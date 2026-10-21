import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { adminApi } from '../lib/api'
import { LogoMark } from '../../components/Logo'
import { Button, Input, Field, ErrorNote, Card } from '../components/ui'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async e => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (mode === 'setup') {
        // Primer ingreso: crea la cuenta admin (solo funciona si aún no hay admins)
        await adminApi('bootstrap', { email, password, full_name: fullName })
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos' : error.message)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg-deep px-4">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-6 flex items-center gap-3">
          <LogoMark size={36} />
          <div>
            <p className="font-semibold">Quantro Studio</p>
            <p className="text-xs text-foreground-muted">Producción de contenido</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {mode === 'setup' && (
            <Field label="Tu nombre"><Input value={fullName} onChange={e => setFullName(e.target.value)} required /></Field>
          )}
          <Field label="Email"><Input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></Field>
          <Field label="Contraseña">
            <Input type="password" autoComplete={mode === 'setup' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} minLength={mode === 'setup' ? 8 : undefined} required />
          </Field>
          <ErrorNote>{error}</ErrorNote>
          <Button type="submit" className="w-full" loading={busy}>{mode === 'setup' ? 'Crear cuenta de administrador' : 'Entrar'}</Button>
        </form>
        <p className="mt-4 text-center text-xs text-foreground-subtle">
          {mode === 'login' ? (
            <>¿No tienes acceso? Pídele tu usuario a Quantro Data. · <button className="underline" onClick={() => setMode('setup')}>Primer ingreso</button></>
          ) : (
            <button className="underline" onClick={() => setMode('login')}>Volver al login</button>
          )}
        </p>
      </Card>
    </div>
  )
}
