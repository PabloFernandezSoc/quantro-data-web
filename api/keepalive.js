// Ping diario a Supabase (via Vercel Cron) para que el proyecto gratuito
// no se pause por inactividad. La publishable key es pública por diseño
// (viaja igual en el bundle del cliente).
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://mcgogmldiuejqrqfgwbd.supabase.co'
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_hbsPmJA7SiiY64D6Ngzqcw_EiDZrZ3O'

export default async function handler(req, res) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/contact_leads?select=id&limit=1`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    })
    res.status(200).json({ ok: r.ok, status: r.status, ts: new Date().toISOString() })
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) })
  }
}
