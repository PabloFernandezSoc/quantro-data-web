import { useState } from 'react'
import { Plus, LayoutGrid } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { q } from '../lib/api'
import { useStudio, openPiece, navigate } from '../lib/store'
import { useGrid } from '../lib/useGrid'
import { STATUSES, PRE_MATERIAL } from '../lib/constants'
import { deadlines, shortDate, monthLabel } from '../lib/dates'
import { Button, PageHeader, Empty, Spinner, ErrorNote, Avatar, Dot, Badge, cx } from '../components/ui'
import { ClientPicker, MonthPicker } from '../components/Pickers'
import NewPiece from '../components/NewPiece'

// Kanban de la grilla del mes: una columna por estado
export default function Board() {
  const { client, canEdit, month, personById } = useStudio()
  const { grid, pieces, loading, error, createGrid, reload } = useGrid()
  const [creating, setCreating] = useState(false)
  const [showDiscarded, setShowDiscarded] = useState(false)
  const [dragId, setDragId] = useState(null)
  const editable = client && canEdit(client.id)

  const columns = STATUSES.filter(s => s.key !== 'descartada' || showDiscarded)
  const nextNumber = Math.max(0, ...pieces.map(p => p.number || 0)) + 1

  const move = async (pieceId, status) => {
    const piece = pieces.find(p => p.id === pieceId)
    if (!piece || piece.status === status) return
    await q(supabase.from('pieces').update({ status }).eq('id', pieceId))
    reload()
  }

  return (
    <div>
      <PageHeader title="Tablero" subtitle={client ? `${client.name} · ${monthLabel(month)}` : ''}>
        <ClientPicker />
        <MonthPicker />
        {editable && grid && <Button onClick={() => setCreating(true)}><Plus size={16} /> Pieza</Button>}
      </PageHeader>

      <ErrorNote>{error}</ErrorNote>

      {loading ? <Spinner /> : !client ? (
        <Empty icon={LayoutGrid} title="Sin clientes">Aún no tienes clientes asignados.</Empty>
      ) : !grid ? (
        <Empty icon={LayoutGrid} title={`No hay grilla de ${monthLabel(month)}`}>
          {editable ? (
            <div className="mt-2 flex justify-center gap-2">
              <Button onClick={createGrid}>Crear grilla vacía</Button>
              <Button variant="outline" onClick={() => navigate('/app/importar')}>Importar desde Sheets</Button>
            </div>
          ) : 'Todavía no se carga la grilla de este mes.'}
        </Empty>
      ) : (
        <>
          <div className="-mx-4 overflow-x-auto px-4 pb-4">
            <div className="flex min-w-max gap-3">
              {columns.map(col => {
                const items = pieces.filter(p => p.status === col.key)
                return (
                  <div
                    key={col.key}
                    className={cx('w-64 shrink-0 rounded-xl bg-surface p-2', dragId && 'ring-1 ring-border')}
                    onDragOver={e => editable && e.preventDefault()}
                    onDrop={() => { if (dragId) move(dragId, col.key); setDragId(null) }}
                  >
                    <div className="mb-2 flex items-center gap-2 px-1">
                      <span className="h-2 w-2 rounded-full" style={{ background: col.color }} />
                      <span className="text-xs font-semibold">{col.label}</span>
                      <span className="text-xs text-foreground-subtle">{items.length}</span>
                    </div>
                    <div className="space-y-2">
                      {items.map(p => <PieceCard key={p.id} piece={p} client={client} personById={personById} draggable={editable} onDragStart={() => setDragId(p.id)} />)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <button className="text-xs text-foreground-muted hover:text-foreground" onClick={() => setShowDiscarded(s => !s)}>
            {showDiscarded ? 'Ocultar descartadas' : `Ver descartadas (${pieces.filter(p => p.status === 'descartada').length})`}
          </button>
        </>
      )}

      {creating && grid && <NewPiece grid={grid} nextNumber={nextNumber} onClose={() => setCreating(false)} onCreated={reload} />}
    </div>
  )
}

export function PieceCard({ piece, client, personById, draggable, onDragStart }) {
  const { materialDue } = deadlines(piece, client)
  const missing = piece.parts.filter(p => p.status !== 'subido')
  const waiting = PRE_MATERIAL.includes(piece.status)
  return (
    <button
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={() => openPiece(piece.id)}
      className="block w-full rounded-lg border border-border bg-bg-elevated p-3 text-left hover:border-border-hover"
    >
      <div className="flex items-start gap-2">
        {waiting && <span className="mt-1.5"><Dot due={materialDue} /></span>}
        <p className="text-sm font-medium leading-snug">{piece.number ? `#${piece.number} · ` : ''}{piece.title}</p>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-foreground-muted">
        <span>{shortDate(piece.publish_date)}</span>
        {piece.pillar && <Badge>{piece.pillar}</Badge>}
      </div>
      {waiting && missing.length > 0 && (
        <div className="mt-2 flex items-center gap-1">
          <span className="text-[11px] text-foreground-subtle">Falta:</span>
          {missing.map(p => <Avatar key={p.id} person={personById[p.assignee_id]} size={20} />)}
        </div>
      )}
    </button>
  )
}
