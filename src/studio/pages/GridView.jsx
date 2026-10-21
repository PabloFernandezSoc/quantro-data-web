import { useState } from 'react'
import { Plus, Table2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { q } from '../lib/api'
import { useStudio, openPiece, navigate } from '../lib/store'
import { useGrid } from '../lib/useGrid'
import { FORMATS, GRID_STATUSES, CAMPAIGNS } from '../lib/constants'
import { deadlines, shortDate, monthLabel } from '../lib/dates'
import { Button, PageHeader, Empty, Spinner, ErrorNote, Avatar, StatusBadge, Dot, Select, Textarea } from '../components/ui'
import { ClientPicker, MonthPicker } from '../components/Pickers'
import NewPiece from '../components/NewPiece'

// La grilla del mes en formato tabla (lo que hoy vive en el Sheet)
export default function GridView() {
  const { client, canEdit, month, personById } = useStudio()
  const { grid, pieces, loading, error, createGrid, reload } = useGrid()
  const [creating, setCreating] = useState(false)
  const [actionError, setActionError] = useState(null)
  const editable = client && canEdit(client.id)
  const nextNumber = Math.max(0, ...pieces.map(p => p.number || 0)) + 1

  const updateGrid = async patch => {
    try {
      await q(supabase.from('grids').update(patch).eq('id', grid.id))
      reload()
    } catch (e) { setActionError(e.message) }
  }

  // Al aprobar la grilla, las ideas pasan a "aprobada" de una
  const approveIdeas = async () => {
    const ids = pieces.filter(p => p.status === 'idea').map(p => p.id)
    if (!ids.length) return
    try {
      await q(supabase.from('pieces').update({ status: 'aprobada' }).in('id', ids))
      await updateGrid({ status: 'aprobada' })
    } catch (e) { setActionError(e.message) }
  }

  return (
    <div>
      <PageHeader title="Grilla" subtitle={client ? `${client.name} · ${monthLabel(month)}` : ''}>
        <ClientPicker />
        <MonthPicker />
        {editable && grid && <Button onClick={() => setCreating(true)}><Plus size={16} /> Pieza</Button>}
      </PageHeader>

      <ErrorNote>{error || actionError}</ErrorNote>

      {loading ? <Spinner /> : !client ? null : !grid ? (
        <Empty icon={Table2} title={`No hay grilla de ${monthLabel(month)}`}>
          {editable && (
            <div className="mt-2 flex justify-center gap-2">
              <Button onClick={createGrid}>Crear grilla vacía</Button>
              <Button variant="outline" onClick={() => navigate('/app/importar')}>Importar desde Sheets</Button>
            </div>
          )}
        </Empty>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {editable ? (
              <Select value={grid.status} onChange={e => updateGrid({ status: e.target.value })} className="w-auto!">
                {GRID_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </Select>
            ) : (
              <span className="text-sm text-foreground-muted">Estado: {GRID_STATUSES.find(s => s.key === grid.status)?.label}</span>
            )}
            {editable && pieces.some(p => p.status === 'idea') && (
              <Button variant="outline" size="sm" onClick={approveIdeas}>Cliente aprobó: pasar ideas a aprobadas</Button>
            )}
            <span className="text-sm text-foreground-muted">{pieces.filter(p => p.status !== 'descartada').length} piezas</span>
          </div>

          {editable && <GridNotes grid={grid} onSave={notes => updateGrid({ notes })} />}

          {pieces.length === 0 ? (
            <Empty icon={Table2} title="Grilla vacía">Agrega piezas o impórtalas desde el Sheet.</Empty>
          ) : (
            <div className="-mx-4 overflow-x-auto px-4">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="text-xs text-foreground-muted">
                  <tr className="border-b border-border">
                    <th className="px-2 py-2">N°</th>
                    <th className="px-2 py-2">Publica</th>
                    <th className="px-2 py-2">Formato</th>
                    <th className="px-2 py-2">Pilar</th>
                    <th className="px-2 py-2">Pieza</th>
                    <th className="px-2 py-2">Gancho</th>
                    <th className="px-2 py-2">Rostros</th>
                    <th className="px-2 py-2">Estado</th>
                    <th className="px-2 py-2">Campaña</th>
                  </tr>
                </thead>
                <tbody>
                  {pieces.map(p => {
                    const { materialDue } = deadlines(p, client)
                    return (
                      <tr key={p.id} onClick={() => openPiece(p.id)} className="cursor-pointer border-b border-border hover:bg-surface">
                        <td className="px-2 py-2 text-foreground-muted">{p.number}</td>
                        <td className="whitespace-nowrap px-2 py-2">{shortDate(p.publish_date)}</td>
                        <td className="px-2 py-2">{FORMATS.find(f => f.key === p.format)?.label}</td>
                        <td className="px-2 py-2 text-foreground-muted">{p.pillar}</td>
                        <td className="px-2 py-2 font-medium">{p.title}</td>
                        <td className="max-w-64 truncate px-2 py-2 text-foreground-muted">{p.hook}</td>
                        <td className="px-2 py-2">
                          <div className="flex gap-0.5">
                            {p.parts.map(part => (
                              <span key={part.id} className={part.status === 'subido' ? '' : 'opacity-40'}>
                                <Avatar person={personById[part.assignee_id]} size={20} />
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <span className="flex items-center gap-1.5">
                            {['idea', 'aprobada', 'en_grabacion'].includes(p.status) && <Dot due={materialDue} />}
                            <StatusBadge status={p.status} />
                          </span>
                        </td>
                        <td className="px-2 py-2 text-xs text-foreground-muted">{CAMPAIGNS.find(c => c.key === p.campaign_target)?.label}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <p className="mt-2 text-xs text-foreground-subtle">Rostros en gris: su parte aún no está subida.</p>
            </div>
          )}
        </>
      )}

      {creating && grid && <NewPiece grid={grid} nextNumber={nextNumber} onClose={() => setCreating(false)} onCreated={reload} />}
    </div>
  )
}

function GridNotes({ grid, onSave }) {
  const [value, setValue] = useState(grid.notes || '')
  const dirty = value !== (grid.notes || '')
  return (
    <div className="mb-4">
      <Textarea placeholder="Notas de la grilla (objetivos del mes, fechas clave, acuerdos con el cliente)" value={value} onChange={e => setValue(e.target.value)} className="min-h-14" />
      {dirty && <Button size="sm" className="mt-1" onClick={() => onSave(value)}>Guardar notas</Button>}
    </div>
  )
}
