import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { q } from './api'
import { monthStart } from './dates'

const StudioContext = createContext(null)

export function useStudio() {
  return useContext(StudioContext)
}

// Router mínimo: /app/<seccion>, con pushState para no recargar
export function navigate(path) {
  if (window.location.pathname + window.location.search === path) return
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

// El detalle de pieza se abre como modal sobre cualquier sección (?pieza=<id>)
export function openPiece(id) {
  const url = new URL(window.location.href)
  if (id) url.searchParams.set('pieza', id)
  else url.searchParams.delete('pieza')
  navigate(url.pathname + url.search)
}

function usePath() {
  const [path, setPath] = useState(window.location.pathname + window.location.search)
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname + window.location.search)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  return path
}

function readStored(key, fallback) {
  try { return localStorage.getItem(key) || fallback } catch { return fallback }
}
function writeStored(key, value) {
  try { localStorage.setItem(key, value) } catch { /* modo privado */ }
}

export function StudioProvider({ session, children }) {
  const path = usePath()
  const [profile, setProfile] = useState(null)
  const [clients, setClients] = useState([])
  const [members, setMembers] = useState([])
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // Sube cada vez que cambia algo en realtime: las páginas lo usan como dependencia para recargar
  const [version, setVersion] = useState(0)
  const [clientId, setClientIdState] = useState(() => readStored('studio.client', ''))
  const [month, setMonthState] = useState(() => readStored('studio.month', monthStart()))

  const userId = session.user.id

  const loadBase = useCallback(async () => {
    try {
      const [prof, cls, mem, ppl] = await Promise.all([
        q(supabase.from('profiles').select('*').eq('id', userId).maybeSingle()),
        q(supabase.from('clients').select('*').order('name')),
        q(supabase.from('client_members').select('*')),
        q(supabase.from('profiles').select('id, full_name, email, is_admin, active').order('full_name')),
      ])
      setProfile(prof)
      setClients(cls)
      setMembers(mem)
      setPeople(ppl)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { loadBase() }, [loadBase])

  useEffect(() => {
    const channel = supabase
      .channel('studio-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pieces' }, () => setVersion(v => v + 1))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'piece_parts' }, () => setVersion(v => v + 1))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => setVersion(v => v + 1))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const isAdmin = !!profile?.is_admin
  const myRoles = useMemo(
    () => Object.fromEntries(members.filter(m => m.user_id === userId).map(m => [m.client_id, m.role])),
    [members, userId],
  )
  const canEdit = useCallback(cid => isAdmin || myRoles[cid] === 'editor', [isAdmin, myRoles])
  const isEditorAnywhere = isAdmin || Object.values(myRoles).includes('editor')

  // Cliente activo: el guardado si sigue siendo visible, si no el primero
  const activeClientId = clients.some(c => c.id === clientId) ? clientId : clients[0]?.id || ''
  const client = clients.find(c => c.id === activeClientId) || null
  const clientById = useMemo(() => Object.fromEntries(clients.map(c => [c.id, c])), [clients])
  const personById = useMemo(() => Object.fromEntries(people.map(p => [p.id, p])), [people])

  // Personas asignables a partes de un cliente: sus miembros + admins
  const assignableFor = useCallback(cid => {
    const ids = new Set(members.filter(m => m.client_id === cid).map(m => m.user_id))
    return people.filter(p => p.active && (ids.has(p.id) || p.is_admin))
  }, [members, people])

  const value = {
    session, userId, profile, isAdmin, myRoles, canEdit, isEditorAnywhere,
    clients, client, clientId: activeClientId, clientById, members, people, personById, assignableFor,
    setClientId: id => { setClientIdState(id); writeStored('studio.client', id) },
    month, setMonth: m => { setMonthState(m); writeStored('studio.month', m) },
    path, version, bump: () => setVersion(v => v + 1), reloadBase: loadBase,
    loading, error,
  }

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>
}
