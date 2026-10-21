import { supabase } from '../../lib/supabase'

// Lanza el error de Supabase como Error normal para manejarlo con try/catch
export async function q(promise) {
  const { data, error } = await promise
  if (error) throw new Error(error.message)
  return data
}

export function rpc(fn, args) {
  return q(supabase.rpc(fn, args))
}

// Acciones que requieren service role (crear usuarios, permisos) pasan por /api/admin-users
export async function adminApi(action, payload = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch('/api/admin-users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ action, ...payload }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || `Error ${res.status}`)
  return body
}

export const PIECE_SELECT = '*, parts:piece_parts(*)'

export function generatePassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const arr = new Uint32Array(12)
  crypto.getRandomValues(arr)
  return Array.from(arr, n => chars[n % chars.length]).join('')
}
