import { adminClient } from './_lib/supabaseAdmin.js'

// Gestión de usuarios de Quantro Studio desde la app (sin entrar a Supabase).
// Todas las acciones exigen un JWT de un admin activo, salvo "bootstrap",
// que crea el primer admin solo si aún no existe ninguno y el email calza con STUDIO_ADMIN_EMAIL.

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const VALID_ROLES = ['editor', 'talent', 'client']

function cleanMemberships(list) {
  if (!Array.isArray(list)) return []
  return list.filter(m => m && typeof m.client_id === 'string' && VALID_ROLES.includes(m.role))
}

async function must(promise) {
  const { data, error } = await promise
  if (error) throw new HttpError(400, error.message)
  return data
}

async function requireAdmin(sb, req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) throw new HttpError(401, 'No autenticado')
  const { data, error } = await sb.auth.getUser(token)
  if (error || !data?.user) throw new HttpError(401, 'Sesión inválida')
  const profile = await must(sb.from('profiles').select('id, is_admin, active').eq('id', data.user.id).maybeSingle())
  if (!profile?.is_admin || !profile.active) throw new HttpError(403, 'Solo administración puede hacer esto')
  return profile
}

async function setMemberships(sb, userId, memberships) {
  await must(sb.from('client_members').delete().eq('user_id', userId))
  const rows = cleanMemberships(memberships).map(m => ({ user_id: userId, client_id: m.client_id, role: m.role }))
  if (rows.length) await must(sb.from('client_members').insert(rows))
}

async function createUser(sb, { full_name, email, password, is_admin, memberships }) {
  if (!full_name?.trim() || !email?.trim()) throw new HttpError(400, 'Nombre y email son obligatorios')
  if (!password || password.length < 8) throw new HttpError(400, 'La contraseña debe tener al menos 8 caracteres')
  const { data, error } = await sb.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name.trim() },
  })
  if (error) throw new HttpError(400, error.message.includes('already') ? 'Ya existe un usuario con ese email' : error.message)
  const id = data.user.id
  try {
    await must(sb.from('profiles').insert({ id, full_name: full_name.trim(), email: email.trim().toLowerCase(), is_admin: !!is_admin }))
    await setMemberships(sb, id, memberships)
  } catch (e) {
    await sb.auth.admin.deleteUser(id)
    throw e
  }
  return id
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })
  const sb = adminClient()
  if (!sb) return res.status(500).json({ error: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY en Vercel' })

  const { action, ...p } = req.body || {}
  try {
    if (action === 'bootstrap') {
      const admins = await must(sb.from('profiles').select('id').eq('is_admin', true).limit(1))
      if (admins.length) throw new HttpError(403, 'Ya existe un administrador. Pídele tu usuario.')
      const allowed = (process.env.STUDIO_ADMIN_EMAIL || '').trim().toLowerCase()
      if (!allowed || allowed !== String(p.email || '').trim().toLowerCase()) {
        throw new HttpError(403, 'Este email no está autorizado como administrador inicial')
      }
      await createUser(sb, { ...p, is_admin: true, memberships: [] })
      return res.status(200).json({ ok: true })
    }

    const me = await requireAdmin(sb, req)

    switch (action) {
      case 'list': {
        const [profiles, members] = await Promise.all([
          must(sb.from('profiles').select('*').order('full_name')),
          must(sb.from('client_members').select('*')),
        ])
        return res.status(200).json({ profiles, members })
      }

      case 'create': {
        const id = await createUser(sb, p)
        return res.status(200).json({ ok: true, id })
      }

      case 'update': {
        if (!p.id) throw new HttpError(400, 'Falta el id')
        const isSelf = p.id === me.id
        const email = String(p.email || '').trim().toLowerCase()
        const authPatch = { email, user_metadata: { full_name: p.full_name } }
        if (p.password) {
          if (p.password.length < 8) throw new HttpError(400, 'La contraseña debe tener al menos 8 caracteres')
          authPatch.password = p.password
        }
        // Desactivar = bloquear login (ban) además de marcar el perfil
        if (!isSelf) authPatch.ban_duration = p.active === false ? '876000h' : 'none'
        const { error } = await sb.auth.admin.updateUserById(p.id, authPatch)
        if (error) throw new HttpError(400, error.message)
        await must(sb.from('profiles').update({
          full_name: String(p.full_name || '').trim(),
          email,
          // Nadie se quita a sí mismo el admin ni se desactiva (evita quedar sin acceso)
          ...(isSelf ? {} : { is_admin: !!p.is_admin, active: p.active !== false }),
        }).eq('id', p.id))
        await setMemberships(sb, p.id, p.memberships)
        return res.status(200).json({ ok: true })
      }

      case 'delete': {
        if (!p.id || p.id === me.id) throw new HttpError(400, 'No puedes eliminar tu propio usuario')
        const { error } = await sb.auth.admin.deleteUser(p.id)
        if (error) throw new HttpError(400, error.message)
        return res.status(200).json({ ok: true })
      }

      default:
        throw new HttpError(400, 'Acción desconocida')
    }
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || String(err) })
  }
}
