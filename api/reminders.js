import { adminClient } from './_lib/supabaseAdmin.js'

// Recordatorio diario (Vercel Cron) a quienes les falta subir material.
// - Parte pendiente cuyo plazo de material vence en ≤ 2 días o ya venció
// - Parte devuelta por edición ("Falta algo"), sin importar el plazo
// Un email por persona con todo lo suyo + un resumen para los admins.
// ?dry=1 devuelve lo que se mandaría sin enviar (también si falta RESEND_API_KEY).

const WINDOW_DAYS = 2
const APP_URL = (process.env.APP_URL || 'https://quantrodata.com').replace(/\/$/, '')
const FROM = process.env.REMINDER_FROM || 'Quantro Studio <studio@quantrodata.com>'

function todayChile() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' }).format(new Date())
}

function addDays(iso, n) {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function diffDays(a, b) {
  return Math.round((new Date(`${a}T12:00:00Z`) - new Date(`${b}T12:00:00Z`)) / 86400000)
}

function fmtDate(iso) {
  const [, m, d] = iso.split('-')
  return `${Number(d)}/${Number(m)}`
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

function itemLine(it) {
  const when = it.rejected
    ? 'Edición pidió rehacer/completar'
    : it.daysLeft < 0 ? `Atrasado ${-it.daysLeft} día(s)` : it.daysLeft === 0 ? 'Vence hoy' : `Vence en ${it.daysLeft} día(s)`
  return `<li style="margin-bottom:10px"><strong>${escapeHtml(it.client)}</strong> · ${it.number ? `#${it.number} · ` : ''}${escapeHtml(it.title)}<br>
    <span style="color:#555">${escapeHtml(it.description)} — subir antes del ${fmtDate(it.due)} (${when})</span></li>`
}

function personEmail(name, items) {
  const first = escapeHtml(name.split(' ')[0])
  return `<div style="font-family:system-ui,sans-serif;font-size:15px;color:#111;max-width:560px">
    <p>Hola ${first}, te falta subir material para estas piezas:</p>
    <ul style="padding-left:18px">${items.map(itemLine).join('')}</ul>
    <p><a href="${APP_URL}/app/pendientes" style="background:#6366F1;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Ver mis pendientes</a></p>
    <p style="color:#888;font-size:13px">Cuando lo subas, márcalo con “Ya lo subí” en la app para que la Vale pueda editar.</p>
  </div>`
}

function summaryEmail(groups) {
  const blocks = groups.map(g => `<p style="margin:14px 0 4px"><strong>${escapeHtml(g.name)}</strong></p><ul style="padding-left:18px;margin:0">${g.items.map(itemLine).join('')}</ul>`)
  return `<div style="font-family:system-ui,sans-serif;font-size:15px;color:#111;max-width:560px">
    <p>Resumen de material pendiente (hoy se enviaron recordatorios a estas personas):</p>${blocks.join('')}
    <p><a href="${APP_URL}/app/tablero">Abrir tablero</a></p></div>`
}

async function sendEmail(to, subject, html) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  })
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`)
}

export default async function handler(req, res) {
  // Vercel Cron manda Authorization: Bearer <CRON_SECRET> cuando la variable existe
  // (obligatorio: la respuesta incluye emails y no debe quedar pública)
  const secret = process.env.CRON_SECRET
  if (!secret) return res.status(500).json({ error: 'Falta CRON_SECRET' })
  if (req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: 'No autorizado' })

  const sb = adminClient()
  if (!sb) return res.status(500).json({ error: 'Falta SUPABASE_SERVICE_ROLE_KEY' })
  const dry = req.query?.dry === '1' || !process.env.RESEND_API_KEY
  const today = todayChile()

  try {
    const { data: parts, error } = await sb
      .from('piece_parts')
      .select(`id, description, status, assignee_id,
        assignee:profiles(id, full_name, email, active),
        piece:pieces(id, title, number, publish_date, status, client:clients(name, edit_buffer_days, schedule_buffer_days))`)
      .in('status', ['pendiente', 'rechazado'])
      .not('assignee_id', 'is', null)
    if (error) throw error

    const { data: sentToday } = await sb.from('reminder_log').select('piece_part_id').eq('kind', 'material').eq('sent_on', today)
    const already = new Set((sentToday || []).map(r => r.piece_part_id))

    const byPerson = new Map()
    for (const part of parts) {
      const pc = part.piece
      if (!pc?.publish_date || !part.assignee?.active || !part.assignee.email) continue
      if (!['idea', 'aprobada', 'en_grabacion'].includes(pc.status)) continue
      if (already.has(part.id)) continue
      const due = addDays(pc.publish_date, -(pc.client.schedule_buffer_days + pc.client.edit_buffer_days))
      const daysLeft = diffDays(due, today)
      const rejected = part.status === 'rechazado'
      if (!rejected && daysLeft > WINDOW_DAYS) continue
      const item = { partId: part.id, client: pc.client.name, title: pc.title, number: pc.number, description: part.description, due, daysLeft, rejected }
      if (!byPerson.has(part.assignee.id)) byPerson.set(part.assignee.id, { ...part.assignee, items: [] })
      byPerson.get(part.assignee.id).items.push(item)
    }

    const groups = [...byPerson.values()].map(g => ({ ...g, items: g.items.sort((a, b) => a.due.localeCompare(b.due)) }))
    const results = []

    for (const g of groups) {
      const late = g.items.filter(i => i.daysLeft < 0).length
      const subject = late
        ? `Tienes ${late} grabación(es) atrasada(s) · Quantro Studio`
        : `Recordatorio: ${g.items.length} grabación(es) por subir · Quantro Studio`
      if (dry) { results.push({ to: g.email, subject, items: g.items.length }); continue }
      try {
        await sendEmail(g.email, subject, personEmail(g.full_name, g.items))
        await sb.from('reminder_log').insert(g.items.map(i => ({ user_id: g.id, piece_part_id: i.partId, kind: 'material', sent_on: today })))
        results.push({ to: g.email, subject, items: g.items.length, sent: true })
      } catch (e) {
        results.push({ to: g.email, error: String(e.message || e) })
      }
    }

    // Resumen para administración
    if (groups.length) {
      const { data: admins } = await sb.from('profiles').select('email').eq('is_admin', true).eq('active', true)
      for (const a of admins || []) {
        if (dry) { results.push({ to: a.email, subject: 'Resumen', people: groups.length }); continue }
        try {
          await sendEmail(a.email, `Material pendiente: ${groups.length} persona(s) · Quantro Studio`, summaryEmail(groups))
        } catch (e) {
          results.push({ to: a.email, error: String(e.message || e) })
        }
      }
    }

    return res.status(200).json({ ok: true, dry, today, results, ...(dry ? { preview: groups } : {}) })
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err.message || err) })
  }
}
