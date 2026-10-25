import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useStudio } from '../lib/store'
import { ROLES } from '../lib/constants'
import { Button, Card, Input, Field, ErrorNote, PageHeader, Badge } from '../components/ui'

export default function Account() {
  const { profile, myRoles, clientById, isAdmin } = useStudio()
  const [password, setPassword] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [error, setError] = useState(null)

  const submit = async e => {
    e.preventDefault()
    setError(null)
    setMsg(null)
    if (password !== confirmPwd) { setError('Las contraseñas no coinciden'); return }
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) setError(error.message)
    else { setMsg('Contraseña actualizada'); setPassword(''); setConfirmPwd('') }
  }

  return (
    <div className="max-w-md">
      <PageHeader title="Mi cuenta" subtitle={`${profile?.full_name} · ${profile?.email}`} />
      <Card className="mb-4 p-4">
        <p className="mb-2 text-xs font-medium text-foreground-muted">Accesos</p>
        <div className="flex flex-wrap gap-1">
          {isAdmin && <Badge color="#8B5CF6">Administrador</Badge>}
          {Object.entries(myRoles).map(([cid, role]) => (
            <Badge key={cid} color={clientById[cid]?.color}>{clientById[cid]?.name} · {ROLES.find(r => r.key === role)?.label}</Badge>
          ))}
        </div>
      </Card>
      <Card className="p-4">
        <form onSubmit={submit} className="space-y-3">
          <p className="text-sm font-semibold">Cambiar contraseña</p>
          <Field label="Nueva contraseña"><Input type="password" autoComplete="new-password" minLength={8} value={password} onChange={e => setPassword(e.target.value)} required /></Field>
          <Field label="Repetir"><Input type="password" autoComplete="new-password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} required /></Field>
          <ErrorNote>{error}</ErrorNote>
          {msg && <p className="text-sm text-green">{msg}</p>}
          <Button type="submit" loading={busy}>Guardar</Button>
        </form>
      </Card>
    </div>
  )
}
