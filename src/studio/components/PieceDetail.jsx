import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2, RotateCcw, Upload, MessageSquare } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { q, rpc, PIECE_SELECT } from '../lib/api'
import { useStudio } from '../lib/store'
import { STATUSES, STATUS, FORMATS, CAMPAIGNS, PRE_MATERIAL } from '../lib/constants'
import { deadlines, shortDate } from '../lib/dates'
import {
  Modal, Button, Input, Textarea, Select, Field, Avatar, PartBadge, StatusBadge, DueBadge, LinkOut, Spinner, ErrorNote,
} from './ui'
import { PartUploadButton, ReviewActions, UploadForm } from './Actions'

const EDITABLE = [
  'title', 'number', 'format', 'pillar', 'hook', 'script', 'caption', 'publish_date', 'status',
  'campaign_target', 'drive_raw_url', 'drive_edited_url', 'published_url', 'notes',
]

const EVENT_LABEL = {
  creada: 'Creó la pieza',
  estado: 'Cambió estado',
  parte_subida: 'Subió parte',
  material_pieza: 'Subió material de la pieza',
  material_carpeta: 'Subió carpeta con varias piezas',
  material_confirmado: 'Confirmó el material',
  material_devuelto: 'Devolvió el material',
}

export default function PieceDetail({ pieceId, onClose }) {
  const { canEdit, clientById, personById, userId, version, assignableFor } = useStudio()
  const [piece, setPiece] = useState(null)
  const [form, setForm] = useState(null)
  const [comments, setComments] = useState([])
  const [events, setEvents] = useState([])
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [newPart, setNewPart] = useState({ assignee_id: '', description: '' })
  const [uploadingPiece, setUploadingPiece] = useState(false)

  const load = useCallback(async () => {
    try {
      const [p, cs, ev] = await Promise.all([
        q(supabase.from('pieces').select(PIECE_SELECT).eq('id', pieceId).single()),
        q(supabase.from('comments').select('*').eq('piece_id', pieceId).order('created_at')),
        q(supabase.from('piece_events').select('*').eq('piece_id', pieceId).order('created_at', { ascending: false })),
      ])
      p.parts.sort((a, b) => a.created_at.localeCompare(b.created_at))
      setPiece(p)
      setForm(f => f ?? Object.fromEntries(EDITABLE.map(k => [k, p[k] ?? ''])))
      setComments(cs)
      setEvents(ev)
    } catch (e) {
      setError(e.message)
    }
  }, [pieceId])

  useEffect(() => { load() }, [load, version])

  if (!piece || !form) {
    return <Modal open onClose={onClose} title="Pieza">{error ? <ErrorNote>{error}</ErrorNote> : <Spinner />}</Modal>
  }

  const client = clientById[piece.client_id]
  const editable = canEdit(piece.client_id)
  const { materialDue, scheduleDue } = deadlines(piece, client)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const dirty = EDITABLE.some(k => String(form[k] ?? '') !== String(piece[k] ?? ''))

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const patch = Object.fromEntries(EDITABLE.map(k => [k, form[k] === '' ? null : form[k]]))
      patch.title = patch.title || 'Sin título'
      patch.number = patch.number ? Number(patch.number) : null
      await q(supabase.from('pieces').update(patch).eq('id', piece.id))
      setForm(null)
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!confirm('¿Eliminar esta pieza y todo su historial?')) return
    try {
      await q(supabase.from('pieces').delete().eq('id', piece.id))
      onClose()
    } catch (e) {
      setError(e.message)
    }
  }

  const act = fn => async (...args) => {
    setError(null)
    try { await fn(...args); await load() } catch (e) { setError(e.message) }
  }

  const addPart = act(async () => {
    if (!newPart.description.trim()) return
    await q(supabase.from('piece_parts').insert({
      piece_id: piece.id,
      assignee_id: newPart.assignee_id || null,
      description: newPart.description.trim(),
    }))
    setNewPart({ assignee_id: '', description: '' })
  })
  const deletePart = act(id => q(supabase.from('piece_parts').delete().eq('id', id)))
  const resetPart = act(id => q(supabase.from('piece_parts').update({ status: 'pendiente' }).eq('id', id)))

  const addComment = act(async () => {
    if (!newComment.trim()) return
    await q(supabase.from('comments').insert({ piece_id: piece.id, author_id: userId, body: newComment.trim() }))
    setNewComment('')
  })

  const assignable = assignableFor(piece.client_id)

  return (
    <Modal open onClose={onClose} wide title={`${piece.number ? `#${piece.number} · ` : ''}${piece.title}`}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium" style={{ color: client?.color }}>{client?.name}</span>
          <StatusBadge status={piece.status} />
          {piece.publish_date && <span className="text-xs text-foreground-muted">Publica {shortDate(piece.publish_date)}</span>}
          {PRE_MATERIAL.includes(piece.status) && <DueBadge due={materialDue} />}
          {scheduleDue && !['programada', 'publicada', 'descartada'].includes(piece.status) && (
            <span className="text-xs text-foreground-subtle">Programar a más tardar {shortDate(scheduleDue)}</span>
          )}
        </div>

        <ErrorNote>{error}</ErrorNote>

        {piece.status === 'material_por_revisar' && editable && (
          <section>
            <h3 className="mb-2 text-sm font-semibold">Revisión de material</h3>
            <ReviewActions piece={piece} onDone={load} />
          </section>
        )}

        {/* Partes por persona */}
        <section>
          <h3 className="mb-2 text-sm font-semibold">Material por persona</h3>
          {piece.parts.length === 0 && (
            <p className="text-sm text-foreground-muted">Sin partes asignadas. {editable && 'Agrega quién tiene que grabar qué.'}</p>
          )}
          <ul className="space-y-2">
            {piece.parts.map(part => {
              const person = personById[part.assignee_id]
              const mine = part.assignee_id === userId
              return (
                <li key={part.id} className="rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Avatar person={person} />
                    <span className="text-sm font-medium">{person?.full_name || 'Sin asignar'}</span>
                    <span className="text-sm text-foreground-muted">{part.description}</span>
                    <PartBadge status={part.status} />
                    <div className="ml-auto flex gap-1">
                      {editable && part.status !== 'pendiente' && (
                        <Button size="sm" variant="ghost" onClick={() => resetPart(part.id)} title="Volver a pendiente"><RotateCcw size={14} /></Button>
                      )}
                      {editable && (
                        <Button size="sm" variant="ghost" onClick={() => deletePart(part.id)} title="Eliminar parte"><Trash2 size={14} /></Button>
                      )}
                    </div>
                  </div>
                  {(part.drive_url || part.note) && (
                    <div className="mt-2 space-y-1 pl-8">
                      <LinkOut href={part.drive_url}>Material subido</LinkOut>
                      {part.note && <p className="text-xs text-foreground-muted">“{part.note}”</p>}
                    </div>
                  )}
                  {part.status !== 'subido' && (mine || editable) && (
                    <div className="mt-2 pl-8"><PartUploadButton part={part} onDone={load} /></div>
                  )}
                </li>
              )
            })}
          </ul>
          {editable && (
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <Select value={newPart.assignee_id} onChange={e => setNewPart(p => ({ ...p, assignee_id: e.target.value }))} className="sm:w-44">
                <option value="">¿Quién?</option>
                {assignable.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </Select>
              <Input
                placeholder="Qué tiene que grabar (ej. 'Intro + diálogo final')"
                value={newPart.description}
                onChange={e => setNewPart(p => ({ ...p, description: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addPart()}
              />
              <Button variant="outline" onClick={addPart}><Plus size={14} /> Agregar</Button>
            </div>
          )}
        </section>

        {/* Material a nivel de pieza */}
        <section>
          <h3 className="mb-2 text-sm font-semibold">Archivos</h3>
          <div className="space-y-1">
            {piece.drive_raw_url ? <LinkOut href={piece.drive_raw_url}>Material en bruto</LinkOut> : <p className="text-sm text-foreground-muted">Sin link de material en bruto.</p>}
            <LinkOut href={piece.drive_edited_url}>Video editado</LinkOut>
            <LinkOut href={piece.published_url}>Publicación</LinkOut>
          </div>
          {!editable && PRE_MATERIAL.includes(piece.status) && (
            uploadingPiece ? (
              <UploadForm
                requireLink
                submitLabel="Enviar material de la pieza"
                onCancel={() => setUploadingPiece(false)}
                onSubmit={async ({ url, note }) => {
                  await rpc('submit_piece_material', { p_piece_id: piece.id, url, note: note || null })
                  setUploadingPiece(false)
                  load()
                }}
              />
            ) : (
              <Button size="sm" variant="outline" className="mt-2" onClick={() => setUploadingPiece(true)}>
                <Upload size={14} /> Subí todo el material de esta pieza
              </Button>
            )
          )}
        </section>

        {/* Ficha */}
        <section>
          <h3 className="mb-2 text-sm font-semibold">Ficha</h3>
          {editable ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Título" className="sm:col-span-2"><Input value={form.title} onChange={set('title')} /></Field>
              <Field label="N°"><Input type="number" value={form.number} onChange={set('number')} /></Field>
              <Field label="Fecha de publicación"><Input type="date" value={form.publish_date} onChange={set('publish_date')} /></Field>
              <Field label="Estado">
                <Select value={form.status} onChange={set('status')}>
                  {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </Select>
              </Field>
              <Field label="Formato">
                <Select value={form.format} onChange={set('format')}>
                  {FORMATS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                </Select>
              </Field>
              <Field label="Pilar / temática"><Input value={form.pillar} onChange={set('pillar')} /></Field>
              <Field label="Campaña destino">
                <Select value={form.campaign_target} onChange={set('campaign_target')}>
                  {CAMPAIGNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </Select>
              </Field>
              <Field label="Gancho" className="sm:col-span-2"><Input value={form.hook} onChange={set('hook')} /></Field>
              <Field label="Guion / estructura" className="sm:col-span-2"><Textarea value={form.script} onChange={set('script')} className="min-h-28" /></Field>
              <Field label="Copy" className="sm:col-span-2"><Textarea value={form.caption} onChange={set('caption')} /></Field>
              <Field label="Link material en bruto"><Input type="url" value={form.drive_raw_url} onChange={set('drive_raw_url')} /></Field>
              <Field label="Link video editado"><Input type="url" value={form.drive_edited_url} onChange={set('drive_edited_url')} /></Field>
              <Field label="Link publicación (IG)"><Input type="url" value={form.published_url} onChange={set('published_url')} /></Field>
              <Field label="Notas"><Input value={form.notes} onChange={set('notes')} /></Field>
            </div>
          ) : (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {[
                ['Formato', FORMATS.find(f => f.key === piece.format)?.label],
                ['Pilar', piece.pillar],
                ['Gancho', piece.hook],
                ['Guion', piece.script],
                ['Copy', piece.caption],
                ['Notas', piece.notes],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className={k === 'Guion' || k === 'Copy' ? 'sm:col-span-2' : ''}>
                  <dt className="text-xs text-foreground-muted">{k}</dt>
                  <dd className="whitespace-pre-wrap">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          {editable && (
            <div className="mt-3 flex justify-between gap-2">
              <Button variant="danger" size="sm" onClick={remove}><Trash2 size={14} /> Eliminar pieza</Button>
              <Button onClick={save} loading={saving} disabled={!dirty}>Guardar cambios</Button>
            </div>
          )}
        </section>

        {/* Comentarios */}
        <section>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><MessageSquare size={14} /> Comentarios</h3>
          <ul className="space-y-2">
            {comments.map(c => (
              <li key={c.id} className="flex gap-2">
                <Avatar person={personById[c.author_id]} />
                <div className="min-w-0 flex-1 rounded-lg bg-surface px-3 py-2">
                  <p className="text-xs text-foreground-muted">
                    {personById[c.author_id]?.full_name || 'Alguien'} · {new Date(c.created_at).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                  <p className="whitespace-pre-wrap text-sm">{c.body}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex gap-2">
            <Input placeholder="Escribe un comentario" value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment()} />
            <Button variant="outline" onClick={addComment}>Enviar</Button>
          </div>
        </section>

        {/* Historial */}
        <section>
          <h3 className="mb-2 text-sm font-semibold">Historial</h3>
          <ul className="space-y-1 text-xs text-foreground-muted">
            {events.map(ev => (
              <li key={ev.id}>
                {new Date(ev.created_at).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })} ·{' '}
                <span className="text-foreground">{personById[ev.actor_id]?.full_name || 'Sistema'}</span>{' '}
                {EVENT_LABEL[ev.type] || ev.type}
                {ev.type === 'estado' && <> : {STATUS[ev.from_status]?.label} → {STATUS[ev.to_status]?.label}</>}
                {ev.detail && ev.type !== 'estado' && <> · {ev.detail}</>}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Modal>
  )
}
