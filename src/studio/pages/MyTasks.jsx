import { useCallback, useEffect, useMemo, useState } from 'react'
import { CircleCheckBig, FolderUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { q, rpc } from '../lib/api'
import { useStudio, openPiece } from '../lib/store'
import { PRE_MATERIAL } from '../lib/constants'
import { deadlines, daysUntil, shortDate, monthLabel } from '../lib/dates'
import { Card, Button, PageHeader, Empty, Spinner, ErrorNote, DueBadge, PartBadge, StatusBadge, Select, Modal, cx } from '../components/ui'
import { PartUploadButton, UploadForm } from '../components/Actions'

// "Lo que te falta": partes asignadas a mí que no están subidas, ordenadas por plazo
export default function MyTasks() {
  const { userId, clientById, version, profile } = useStudio()
  const [parts, setParts] = useState(null)
  const [pending, setPending] = useState([])
  const [error, setError] = useState(null)
  const [folderOpen, setFolderOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      const [myParts, pieces] = await Promise.all([
        q(supabase.from('piece_parts')
          .select('*, piece:pieces(id, title, number, publish_date, status, client_id, grid_id)')
          .eq('assignee_id', userId).neq('status', 'subido')),
        // Piezas de mis clientes que siguen esperando material (para quienes suben por pieza)
        q(supabase.from('pieces').select('id, title, number, publish_date, status, client_id, grid_id')
          .in('status', PRE_MATERIAL).order('publish_date', { nullsFirst: false })),
      ])
      setParts(myParts.filter(p => p.piece && PRE_MATERIAL.includes(p.piece.status)))
      setPending(pieces)
      setError(null)
    } catch (e) {
      setError(e.message)
    }
  }, [userId])

  useEffect(() => { load() }, [load, version])

  const sorted = useMemo(() => (parts || [])
    .map(p => ({ ...p, due: deadlines(p.piece, clientById[p.piece.client_id]).materialDue }))
    .sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999')), [parts, clientById])

  if (!parts) return error ? <ErrorNote>{error}</ErrorNote> : <Spinner />

  const late = sorted.filter(p => p.due && daysUntil(p.due) < 0).length
  const firstName = profile?.full_name?.split(' ')[0] || ''

  return (
    <div>
      <PageHeader
        title={`Hola${firstName ? `, ${firstName}` : ''}`}
        subtitle={sorted.length
          ? `Tienes ${sorted.length} ${sorted.length === 1 ? 'parte pendiente' : 'partes pendientes'}${late ? `, ${late} atrasada${late > 1 ? 's' : ''}` : ''}.`
          : 'No tienes nada pendiente por grabar.'}
      >
        <Button variant="outline" onClick={() => setFolderOpen(true)}><FolderUp size={16} /> Subí una carpeta con varias piezas</Button>
      </PageHeader>

      <ErrorNote>{error}</ErrorNote>

      {sorted.length === 0 ? (
        <Empty icon={CircleCheckBig} title="Todo al día">Cuando te asignen una parte de un video va a aparecer acá con su fecha límite.</Empty>
      ) : (
        <ul className="space-y-3">
          {sorted.map(part => {
            const client = clientById[part.piece.client_id]
            return (
              <li key={part.id}>
                <Card className={cx('p-4', part.status === 'rechazado' && 'border-red/40')}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold" style={{ color: client?.color }}>{client?.name}</span>
                    <DueBadge due={part.due} label="Subir antes del" />
                    {part.status === 'rechazado' && <PartBadge status="rechazado" />}
                  </div>
                  <button className="mt-1 text-left font-medium hover:underline" onClick={() => openPiece(part.piece.id)}>
                    {part.piece.number ? `#${part.piece.number} · ` : ''}{part.piece.title}
                  </button>
                  <p className="text-sm text-foreground-muted">
                    {part.description}{part.piece.publish_date && ` · se publica ${shortDate(part.piece.publish_date)}`}
                  </p>
                  {part.note && <p className="mt-1 text-xs text-foreground-subtle">Tu nota: “{part.note}”</p>}
                  <div className="mt-3"><PartUploadButton part={part} onDone={load} /></div>
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      {pending.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold text-foreground-muted">Piezas de tus clientes esperando material</h2>
          <ul className="divide-y divide-border rounded-xl border border-border">
            {pending.map(p => {
              const due = deadlines(p, clientById[p.client_id]).materialDue
              return (
                <li key={p.id}>
                  <button onClick={() => openPiece(p.id)} className="flex w-full flex-wrap items-center gap-2 px-4 py-3 text-left hover:bg-surface">
                    <span className="text-xs font-semibold" style={{ color: clientById[p.client_id]?.color }}>{clientById[p.client_id]?.name}</span>
                    <span className="text-sm">{p.number ? `#${p.number} · ` : ''}{p.title}</span>
                    <span className="ml-auto flex gap-2"><StatusBadge status={p.status} /><DueBadge due={due} /></span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {folderOpen && <FolderUpload pieces={pending} onClose={() => setFolderOpen(false)} onDone={load} />}
    </div>
  )
}

// Una carpeta de Drive que cubre varias piezas (ej. "todo lo que grabé este mes")
function FolderUpload({ pieces, onClose, onDone }) {
  const { clientById } = useStudio()
  const grids = useMemo(() => {
    const map = new Map()
    for (const p of pieces) {
      if (!map.has(p.grid_id)) map.set(p.grid_id, { id: p.grid_id, client_id: p.client_id, pieces: [] })
      map.get(p.grid_id).pieces.push(p)
    }
    return [...map.values()]
  }, [pieces])
  const [gridId, setGridId] = useState(grids[0]?.id || '')
  const [selected, setSelected] = useState([])
  const grid = grids.find(g => g.id === gridId)

  const [gridMonths, setGridMonths] = useState({})
  useEffect(() => {
    if (!grids.length) return
    supabase.from('grids').select('id, month').in('id', grids.map(g => g.id))
      .then(({ data }) => setGridMonths(Object.fromEntries((data || []).map(g => [g.id, g.month]))))
  }, [grids])

  return (
    <Modal open onClose={onClose} title="Subí una carpeta con varias piezas">
      {grids.length === 0 ? (
        <p className="text-sm text-foreground-muted">No hay piezas esperando material.</p>
      ) : (
        <div className="space-y-3">
          <Select value={gridId} onChange={e => { setGridId(e.target.value); setSelected([]) }}>
            {grids.map(g => (
              <option key={g.id} value={g.id}>{clientById[g.client_id]?.name} · {monthLabel(gridMonths[g.id])}</option>
            ))}
          </Select>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs text-foreground-muted">¿Qué piezas están en la carpeta?</p>
              <button className="text-xs text-accent" onClick={() => setSelected(grid.pieces.map(p => p.id))}>Marcar todas</button>
            </div>
            <div className="max-h-60 space-y-1 overflow-y-auto">
              {grid?.pieces.map(p => (
                <label key={p.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-surface">
                  <input type="checkbox" checked={selected.includes(p.id)} onChange={e => setSelected(s => e.target.checked ? [...s, p.id] : s.filter(x => x !== p.id))} />
                  {p.number ? `#${p.number} · ` : ''}{p.title}
                  <span className="ml-auto text-xs text-foreground-subtle">{shortDate(p.publish_date)}</span>
                </label>
              ))}
            </div>
          </div>
          <UploadForm
            requireLink
            submitLabel={`Enviar (${selected.length} piezas)`}
            onSubmit={async ({ url, note }) => {
              if (!selected.length) throw new Error('Marca al menos una pieza')
              await rpc('submit_grid_upload', { p_grid_id: gridId, url, p_piece_ids: selected, note: note || null })
              onDone()
              onClose()
            }}
          />
          <p className="text-xs text-foreground-subtle">Las piezas quedan “por revisar”: la Vale confirma que esté todo antes de editar.</p>
        </div>
      )}
    </Modal>
  )
}
