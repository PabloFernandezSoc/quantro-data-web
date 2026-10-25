import { useState } from 'react'
import { Check, AlertTriangle, Upload } from 'lucide-react'
import { rpc } from '../lib/api'
import { useStudio } from '../lib/store'
import { Button, Input, Textarea, ErrorNote, cx } from './ui'

// Formulario corto de "ya lo subí": link de Drive opcional + nota
export function UploadForm({ onSubmit, onCancel, submitLabel = 'Marcar como subido', requireLink }) {
  const [url, setUrl] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async e => {
    e.preventDefault()
    if (requireLink && !url.trim()) { setError('Pega el link de Drive'); return }
    setBusy(true)
    setError(null)
    try {
      await onSubmit({ url: url.trim(), note: note.trim() })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-2 space-y-2 rounded-lg border border-border bg-bg-base p-3">
      <Input placeholder="Link de Drive (archivo o carpeta)" value={url} onChange={e => setUrl(e.target.value)} type="url" />
      <Input placeholder="Nota opcional (ej. 'son 3 clips', 'falta la toma 2')" value={note} onChange={e => setNote(e.target.value)} />
      <ErrorNote>{error}</ErrorNote>
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={busy}><Upload size={14} /> {submitLabel}</Button>
        {onCancel && <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Cancelar</Button>}
      </div>
    </form>
  )
}

// Botón + formulario para marcar una parte propia como subida
export function PartUploadButton({ part, onDone }) {
  const [open, setOpen] = useState(false)
  if (open) {
    return (
      <UploadForm
        onCancel={() => setOpen(false)}
        onSubmit={async ({ url, note }) => {
          await rpc('mark_part_uploaded', { part_id: part.id, url: url || null, note: note || null })
          setOpen(false)
          onDone?.()
        }}
      />
    )
  }
  return (
    <Button size="sm" variant="success" onClick={() => setOpen(true)}>
      <Check size={14} /> Ya lo subí
    </Button>
  )
}

// Confirmar / devolver material (solo edición)
export function ReviewActions({ piece, onDone }) {
  const { personById } = useStudio()
  const [mode, setMode] = useState(null)
  const [comment, setComment] = useState('')
  const [rejected, setRejected] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const run = async approve => {
    if (!approve && !comment.trim()) { setError('Cuenta qué falta para que le llegue a quien corresponde'); return }
    setBusy(true)
    setError(null)
    try {
      await rpc('review_material', {
        p_piece_id: piece.id,
        approve,
        comment: comment.trim() || null,
        reject_part_ids: approve ? [] : rejected,
      })
      setMode(null)
      setComment('')
      setRejected([])
      onDone?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (!mode) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="success" onClick={() => setMode('ok')}><Check size={14} /> Confirmar material</Button>
        <Button size="sm" variant="danger" onClick={() => setMode('missing')}><AlertTriangle size={14} /> Falta algo</Button>
      </div>
    )
  }

  const parts = piece.parts || []
  return (
    <div className="space-y-2 rounded-lg border border-border bg-bg-base p-3">
      {mode === 'missing' && parts.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-foreground-muted">¿Qué parte hay que rehacer o completar?</p>
          {parts.map(p => (
            <label key={p.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={rejected.includes(p.id)}
                onChange={e => setRejected(r => e.target.checked ? [...r, p.id] : r.filter(x => x !== p.id))}
              />
              {p.description} <span className="text-foreground-subtle">· {personById[p.assignee_id]?.full_name || 'sin asignar'}</span>
            </label>
          ))}
        </div>
      )}
      <Textarea
        placeholder={mode === 'ok' ? 'Comentario opcional' : 'Qué falta (ej. "falta el plano de JT diciendo el cierre")'}
        value={comment}
        onChange={e => setComment(e.target.value)}
        className="min-h-16"
      />
      <ErrorNote>{error}</ErrorNote>
      <div className="flex gap-2">
        <Button size="sm" variant={mode === 'ok' ? 'success' : 'danger'} loading={busy} onClick={() => run(mode === 'ok')}>
          {mode === 'ok' ? 'Confirmar: material completo' : 'Devolver a grabación'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setMode(null)}>Cancelar</Button>
      </div>
    </div>
  )
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-bg-elevated p-0.5">
      {options.map(o => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={cx('rounded-md px-3 py-1.5 text-xs font-medium', value === o.key ? 'bg-surface-hover text-foreground' : 'text-foreground-muted hover:text-foreground')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
