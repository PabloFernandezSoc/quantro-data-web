import { useCallback, useEffect, useState } from 'react'
import { Plus, KeyRound, Copy } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { q, adminApi, generatePassword } from '../lib/api'
import { useStudio } from '../lib/store'
import { ROLES } from '../lib/constants'
import { Button, Card, PageHeader, Modal, Input, Field, Select, ErrorNote, Spinner, Avatar, Badge, Empty } from '../components/ui'
import { Segmented } from '../components/Actions'

export default function Admin() {
  const { isAdmin } = useStudio()
  const [tab, setTab] = useState('users')
  if (!isAdmin) return <Empty title="Sin permiso">Solo administración puede ver esta sección.</Empty>
  return (
    <div>
      <PageHeader title="Administración">
        <Segmented options={[{ key: 'users', label: 'Usuarios' }, { key: 'clients', label: 'Clientes' }]} value={tab} onChange={setTab} />
      </PageHeader>
      {tab === 'users' ? <Users /> : <Clients />}
    </div>
  )
}

// ── Usuarios ────────────────────────────────────────────────

function Users() {
  const { clients, clientById, userId, reloadBase } = useStudio()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    try {
      setData(await adminApi('list'))
      setError(null)
    } catch (e) {
      setError(e.message)
    }
  }, [])
  useEffect(() => { load() }, [load])

  if (!data) return error ? <ErrorNote>{error}</ErrorNote> : <Spinner />

  const membershipsOf = id => data.members.filter(m => m.user_id === id)

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button onClick={() => setEditing({})}><Plus size={16} /> Nuevo usuario</Button>
      </div>
      <ErrorNote>{error}</ErrorNote>
      <ul className="space-y-2">
        {data.profiles.map(p => (
          <li key={p.id}>
            <Card className="flex flex-wrap items-center gap-3 p-3">
              <Avatar person={p} size={32} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {p.full_name} {p.alias && <span className="text-xs text-foreground-muted">· “{p.alias}” en guiones</span>} {p.id === userId && <span className="text-xs text-foreground-subtle">(tú)</span>}
                </p>
                <p className="truncate text-xs text-foreground-muted">{p.email}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {p.is_admin && <Badge color="#8B5CF6">Admin</Badge>}
                {!p.active && <Badge color="#EF4444">Desactivado</Badge>}
                {membershipsOf(p.id).map(m => (
                  <Badge key={m.client_id} color={clientById[m.client_id]?.color}>
                    {clientById[m.client_id]?.name} · {ROLES.find(r => r.key === m.role)?.label}
                  </Badge>
                ))}
              </div>
              <Button size="sm" variant="outline" onClick={() => setEditing(p)}>Editar</Button>
            </Card>
          </li>
        ))}
      </ul>
      {editing && (
        <UserForm
          user={editing.id ? editing : null}
          memberships={editing.id ? membershipsOf(editing.id) : []}
          clients={clients}
          isSelf={editing.id === userId}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); reloadBase() }}
        />
      )}
    </div>
  )
}

function UserForm({ user, memberships, clients, isSelf, onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    alias: user?.alias || '',
    email: user?.email || '',
    password: user ? '' : generatePassword(),
    is_admin: user?.is_admin || false,
    active: user?.active ?? true,
  })
  const [roles, setRoles] = useState(() => Object.fromEntries(memberships.map(m => [m.client_id, m.role])))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [created, setCreated] = useState(null)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const payload = {
        ...form,
        memberships: Object.entries(roles).filter(([, r]) => r).map(([client_id, role]) => ({ client_id, role })),
      }
      if (user) {
        await adminApi('update', { id: user.id, ...payload, password: form.password || undefined })
        if (form.password) setCreated({ email: form.email, password: form.password })
        else onSaved()
      } else {
        await adminApi('create', payload)
        setCreated({ email: form.email, password: form.password })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!confirm(`¿Eliminar a ${user.full_name}? Sus partes quedan sin asignar.`)) return
    try {
      await adminApi('delete', { id: user.id })
      onSaved()
    } catch (err) {
      setError(err.message)
    }
  }

  if (created) {
    const msg = `Hola! Te creé tu usuario en Quantro Studio para ver las grabaciones pendientes:\n${window.location.origin}/app\nUsuario: ${created.email}\nContraseña: ${created.password}`
    return (
      <Modal open onClose={onSaved} title="Listo">
        <p className="mb-2 text-sm text-foreground-muted">Mándale estos datos (por WhatsApp, por ejemplo). La contraseña no se vuelve a mostrar.</p>
        <pre className="whitespace-pre-wrap rounded-lg bg-surface p-3 text-sm">{msg}</pre>
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigator.clipboard?.writeText(msg)}><Copy size={14} /> Copiar mensaje</Button>
          <Button onClick={onSaved}>Cerrar</Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open onClose={onClose} title={user ? `Editar ${user.full_name}` : 'Nuevo usuario'}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Nombre (el primer nombre se usa al importar rostros)"><Input value={form.full_name} onChange={set('full_name')} required /></Field>
        <Field label="Alias en los guiones (opcional)" hint="Cómo aparece en los guiones si no es su primer nombre ni sus iniciales. Ej: JT.">
          <Input value={form.alias} onChange={set('alias')} placeholder="JT" />
        </Field>
        <Field label="Email (usuario y canal de recordatorios)"><Input type="email" value={form.email} onChange={set('email')} required /></Field>
        <Field label={user ? 'Nueva contraseña (vacío = no cambiar)' : 'Contraseña inicial'}>
          <div className="flex gap-2">
            <Input value={form.password} onChange={set('password')} minLength={8} required={!user} />
            <Button type="button" variant="outline" onClick={() => setForm(f => ({ ...f, password: generatePassword() }))} title="Generar"><KeyRound size={16} /></Button>
          </div>
        </Field>

        <div>
          <p className="mb-1 text-xs font-medium text-foreground-muted">Acceso por cliente</p>
          <div className="space-y-2">
            {clients.map(c => (
              <div key={c.id} className="flex items-center gap-2">
                <span className="w-32 truncate text-sm" style={{ color: c.color }}>{c.name}</span>
                <Select value={roles[c.id] || ''} onChange={e => setRoles(r => ({ ...r, [c.id]: e.target.value }))} className="h-9">
                  <option value="">Sin acceso</option>
                  {ROLES.map(r => <option key={r.key} value={r.key}>{r.label} · {r.hint}</option>)}
                </Select>
              </div>
            ))}
            {clients.length === 0 && <p className="text-sm text-foreground-subtle">Crea clientes primero en la pestaña Clientes.</p>}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_admin} onChange={set('is_admin')} disabled={isSelf} />
          Administrador (ve todo y gestiona usuarios)
        </label>
        {user && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={set('active')} disabled={isSelf} />
            Activo (desmarca para bloquear el acceso)
          </label>
        )}

        <ErrorNote>{error}</ErrorNote>
        <div className="flex justify-between gap-2">
          {user && !isSelf ? <Button type="button" variant="danger" onClick={remove}>Eliminar</Button> : <span />}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={busy}>{user ? 'Guardar' : 'Crear usuario'}</Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

// ── Clientes ────────────────────────────────────────────────

function slugify(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function Clients() {
  const { clients, reloadBase } = useStudio()
  const [editing, setEditing] = useState(null)
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button onClick={() => setEditing({})}><Plus size={16} /> Nuevo cliente</Button>
      </div>
      <ul className="space-y-2">
        {clients.map(c => (
          <li key={c.id}>
            <Card className="flex flex-wrap items-center gap-3 p-3">
              <span className="h-3 w-3 rounded-full" style={{ background: c.color }} />
              <span className="flex-1 font-medium">{c.name}</span>
              <span className="text-xs text-foreground-muted">Edición {c.edit_buffer_days} d · Programar {c.schedule_buffer_days} d antes</span>
              <Button size="sm" variant="outline" onClick={() => setEditing(c)}>Editar</Button>
            </Card>
          </li>
        ))}
      </ul>
      {editing && <ClientForm client={editing.id ? editing : null} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reloadBase() }} />}
    </div>
  )
}

function ClientForm({ client, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: client?.name || '',
    color: client?.color || '#6366F1',
    drive_folder_url: client?.drive_folder_url || '',
    edit_buffer_days: client?.edit_buffer_days ?? 3,
    schedule_buffer_days: client?.schedule_buffer_days ?? 1,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const payload = {
        ...form,
        drive_folder_url: form.drive_folder_url || null,
        edit_buffer_days: Number(form.edit_buffer_days),
        schedule_buffer_days: Number(form.schedule_buffer_days),
      }
      if (client) await q(supabase.from('clients').update(payload).eq('id', client.id))
      else await q(supabase.from('clients').insert({ ...payload, slug: slugify(form.name) }))
      onSaved()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={client ? `Editar ${client.name}` : 'Nuevo cliente'}>
      <form onSubmit={submit} className="space-y-3">
        <div className="flex gap-3">
          <Field label="Nombre" className="flex-1"><Input value={form.name} onChange={set('name')} required /></Field>
          <Field label="Color"><input type="color" value={form.color} onChange={set('color')} className="h-10 w-14 rounded-lg border border-border bg-transparent" /></Field>
        </div>
        <Field label="Carpeta de Drive del cliente"><Input type="url" value={form.drive_folder_url} onChange={set('drive_folder_url')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Días para editar" hint="Holgura entre material completo y programación">
            <Input type="number" min={0} value={form.edit_buffer_days} onChange={set('edit_buffer_days')} />
          </Field>
          <Field label="Días antes para programar" hint="Antes de la fecha de publicación">
            <Input type="number" min={0} value={form.schedule_buffer_days} onChange={set('schedule_buffer_days')} />
          </Field>
        </div>
        <p className="text-xs text-foreground-subtle">
          Con estos valores, el material de una pieza que se publica el día 20 tiene que estar el día {20 - Number(form.edit_buffer_days) - Number(form.schedule_buffer_days)}.
        </p>
        <ErrorNote>{error}</ErrorNote>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={busy}>Guardar</Button>
        </div>
      </form>
    </Modal>
  )
}
