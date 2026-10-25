import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { q } from '../lib/api'
import { useStudio } from '../lib/store'
import { FORMATS } from '../lib/constants'
import { Modal, Button, Input, Textarea, Select, Field, ErrorNote } from './ui'

export default function NewPiece({ grid, nextNumber, onClose, onCreated }) {
  const { assignableFor } = useStudio()
  const people = assignableFor(grid.client_id)
  const [form, setForm] = useState({
    title: '', number: nextNumber, publish_date: '', format: 'reel', pillar: '', hook: '', script: '', status: 'idea',
  })
  const [faces, setFaces] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const payload = { ...form, grid_id: grid.id, number: form.number ? Number(form.number) : null }
      for (const k of Object.keys(payload)) if (payload[k] === '') payload[k] = null
      payload.title = payload.title || 'Sin título'
      const piece = await q(supabase.from('pieces').insert(payload).select().single())
      if (faces.length) {
        await q(supabase.from('piece_parts').insert(
          faces.map(id => ({ piece_id: piece.id, assignee_id: id, description: 'Su parte del video' })),
        ))
      }
      onCreated?.(piece)
      onClose()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Nueva pieza">
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <Field label="N°"><Input type="number" value={form.number} onChange={set('number')} /></Field>
          <Field label="Publicación" className="col-span-2"><Input type="date" value={form.publish_date} onChange={set('publish_date')} /></Field>
        </div>
        <Field label="Título"><Input value={form.title} onChange={set('title')} autoFocus /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Formato">
            <Select value={form.format} onChange={set('format')}>
              {FORMATS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </Select>
          </Field>
          <Field label="Pilar"><Input value={form.pillar} onChange={set('pillar')} /></Field>
        </div>
        <Field label="Gancho"><Input value={form.hook} onChange={set('hook')} /></Field>
        <Field label="Guion"><Textarea value={form.script} onChange={set('script')} /></Field>
        {people.length > 0 && (
          <Field label="¿Quién aparece / tiene que grabar?" hint="Se crea una parte pendiente para cada uno; después puedes detallarla.">
            <div className="flex flex-wrap gap-3 pt-1">
              {people.map(p => (
                <label key={p.id} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" checked={faces.includes(p.id)} onChange={e => setFaces(f => e.target.checked ? [...f, p.id] : f.filter(x => x !== p.id))} />
                  {p.full_name}
                </label>
              ))}
            </div>
          </Field>
        )}
        <ErrorNote>{error}</ErrorNote>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={busy}>Crear pieza</Button>
        </div>
      </form>
    </Modal>
  )
}
