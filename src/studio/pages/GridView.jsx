import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Table2, CalendarClock, ChevronsDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { q } from '../lib/api'
import { useStudio, openPiece, navigate, setPieceNav } from '../lib/store'
import { useGrid } from '../lib/useGrid'
import { FORMATS, GRID_STATUSES, CAMPAIGNS } from '../lib/constants'
import { shortDate, monthLabel, nextStep, weekStart, addDays, today, parseISODate } from '../lib/dates'
import {
  Button, PageHeader, Empty, Spinner, ErrorNote, Avatar, StatusBadge, Select, Textarea, DateBlock, DeadlineChip,
  LEVEL_STYLE, cx,
} from '../components/ui'
import { Segmented } from '../components/Actions'
import { ClientPicker, MonthPicker } from '../components/Pickers'
import NewPiece from '../components/NewPiece'

// Etapas que se muestran como barra de avance en cada pieza
const STEPS = [
  { label: 'Guion', statuses: ['idea', 'aprobada'] },
  { label: 'Grabación', statuses: ['en_grabacion', 'material_por_revisar'] },
  { label: 'Edición', statuses: ['material_completo', 'en_edicion', 'editada'] },
  { label: 'Programada', statuses: ['programada'] },
  { label: 'Publicada', statuses: ['publicada'] },
]
const stepIndex = status => STEPS.findIndex(s => s.statuses.includes(status))

const FILTERS = [
  { key: 'all', label: 'Todas' },
  { key: 'late', label: 'Atrasadas', levels: ['late'] },
  { key: 'urgent', label: 'Vencen en ≤ 2 días', levels: ['today', 'soon'] },
  { key: 'week', label: 'Esta semana', levels: ['week'] },
  { key: 'pending', label: 'Pendientes', levels: ['late', 'today', 'soon', 'week', 'ok'] },
  { key: 'done', label: 'Listas', levels: ['done'] },
]

function readView() {
  try { return localStorage.getItem('studio.gridView') || 'agenda' } catch { return 'agenda' }
}

// La grilla del mes: agenda por semana (por defecto) o tabla tipo Sheet
export default function GridView() {
  const { client, canEdit, month, personById } = useStudio()
  const { grid, pieces, loading, error, createGrid, reload } = useGrid()
  const [creating, setCreating] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [view, setView] = useState(readView)
  const [filter, setFilter] = useState('all')
  const editable = client && canEdit(client.id)
  const nextNumber = Math.max(0, ...pieces.map(p => p.number || 0)) + 1

  const enriched = useMemo(
    () => pieces.filter(p => p.status !== 'descartada').map(p => ({ ...p, step: nextStep(p, client) })),
    [pieces, client],
  )
  const counts = useMemo(() => {
    const c = {}
    for (const f of FILTERS) c[f.key] = f.levels ? enriched.filter(p => f.levels.includes(p.step.level)).length : enriched.length
    return c
  }, [enriched])
  const activeFilter = FILTERS.find(f => f.key === filter)
  const visible = activeFilter.levels ? enriched.filter(p => activeFilter.levels.includes(p.step.level)) : enriched

  // Orden de navegación para pasar de una pieza a la siguiente dentro del detalle
  useEffect(() => { setPieceNav(visible.map(p => p.id)) }, [visible])

  const changeView = v => {
    setView(v)
    try { localStorage.setItem('studio.gridView', v) } catch { /* modo privado */ }
  }

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
          {/* Resumen de urgencia: cada tarjeta filtra la grilla */}
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { key: 'late', level: 'late', hint: 'pasaron su plazo' },
              { key: 'urgent', level: 'soon', hint: 'vencen en ≤ 2 días' },
              { key: 'week', level: 'week', hint: 'vencen esta semana' },
              { key: 'done', level: 'done', hint: 'programadas o publicadas', countKey: 'done' },
            ].map(s => {
              const n = counts[s.key]
              const color = LEVEL_STYLE[s.level].color
              const active = filter === s.key
              return (
                <button
                  key={s.key}
                  onClick={() => setFilter(active ? 'all' : s.key)}
                  className={cx('rounded-xl border border-border p-3 text-left transition-colors', active ? 'bg-surface-hover' : 'bg-bg-elevated hover:bg-surface')}
                  style={{ borderColor: active || (n && s.key !== 'done') ? `${color}88` : undefined }}
                >
                  <p className="font-display text-2xl font-bold tabular-nums" style={{ color: n || s.key === 'done' ? color : undefined }}>{n}</p>
                  <p className="text-xs text-foreground-muted">{FILTERS.find(f => f.key === s.key).label}</p>
                  <p className="text-[11px] text-foreground-subtle">{s.hint}</p>
                </button>
              )
            })}
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Segmented
              options={[{ key: 'agenda', label: 'Agenda' }, { key: 'tabla', label: 'Tabla' }]}
              value={view}
              onChange={changeView}
            />
            <Select value={filter} onChange={e => setFilter(e.target.value)} className="h-9 w-auto!">
              {FILTERS.map(f => <option key={f.key} value={f.key}>{f.label} ({counts[f.key]})</option>)}
            </Select>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {editable && pieces.some(p => p.status === 'idea') && (
                <Button variant="outline" size="sm" onClick={approveIdeas}>Cliente aprobó: pasar ideas a aprobadas</Button>
              )}
              {editable ? (
                <Select value={grid.status} onChange={e => updateGrid({ status: e.target.value })} className="h-9 w-auto!">
                  {GRID_STATUSES.map(s => <option key={s.key} value={s.key}>Grilla: {s.label}</option>)}
                </Select>
              ) : (
                <span className="text-sm text-foreground-muted">Grilla: {GRID_STATUSES.find(s => s.key === grid.status)?.label}</span>
              )}
            </div>
          </div>

          {(editable || grid.notes) && <GridNotes grid={grid} editable={editable} onSave={notes => updateGrid({ notes })} />}

          {pieces.length === 0 ? (
            <Empty icon={Table2} title="Grilla vacía">Agrega piezas o impórtalas desde el Sheet.</Empty>
          ) : visible.length === 0 ? (
            <Empty icon={CalendarClock} title="Nada con este filtro">
              <button className="text-accent underline" onClick={() => setFilter('all')}>Ver todas las piezas</button>
            </Empty>
          ) : view === 'agenda' ? (
            <Agenda pieces={visible} personById={personById} />
          ) : (
            <GridTable pieces={visible} personById={personById} />
          )}
        </>
      )}

      {creating && grid && <NewPiece grid={grid} nextNumber={nextNumber} onClose={() => setCreating(false)} onCreated={reload} />}
    </div>
  )
}

// ── Agenda por semana ───────────────────────────────────────

function weekLabel(start) {
  const end = addDays(start, 6)
  const a = parseISODate(start)
  const b = parseISODate(end)
  const m = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()} al ${b.getDate()} de ${m[b.getMonth()]}`
    : `${a.getDate()} ${m[a.getMonth()]} al ${b.getDate()} ${m[b.getMonth()]}`
}

function Agenda({ pieces, personById }) {
  const todayRef = useRef(null)
  const now = today()
  const thisWeek = weekStart(now)

  const weeks = useMemo(() => {
    const map = new Map()
    for (const p of [...pieces].sort((a, b) => (a.publish_date || '9999').localeCompare(b.publish_date || '9999'))) {
      const key = p.publish_date ? weekStart(p.publish_date) : 'sin-fecha'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(p)
    }
    return [...map.entries()]
  }, [pieces])

  // Primera pieza que se publica hoy o después: ahí va la línea de "Hoy"
  const firstUpcoming = pieces.filter(p => p.publish_date && p.publish_date >= now)
    .sort((a, b) => a.publish_date.localeCompare(b.publish_date))[0]?.id

  useEffect(() => {
    todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  return (
    <div className="space-y-6">
      {firstUpcoming && (
        <div className="flex justify-end">
          <Button size="sm" variant="ghost" onClick={() => todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
            <ChevronsDown size={14} /> Ir a hoy
          </Button>
        </div>
      )}
      {weeks.map(([key, items]) => (
        <section key={key}>
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-sm font-semibold">
              {key === 'sin-fecha' ? 'Sin fecha de publicación' : `Semana del ${weekLabel(key)}`}
            </h3>
            {key === thisWeek && <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-semibold text-accent">Esta semana</span>}
            <span className="text-xs text-foreground-subtle">{items.length} {items.length === 1 ? 'pieza' : 'piezas'}</span>
          </div>
          <div className="space-y-2">
            {items.map(p => (
              <div key={p.id}>
                {p.id === firstUpcoming && (
                  <div ref={todayRef} className="my-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-accent">
                    <span className="h-px flex-1 bg-accent/60" /> Hoy · {shortDate(now)} <span className="h-px flex-1 bg-accent/60" />
                  </div>
                )}
                <AgendaRow piece={p} personById={personById} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function AgendaRow({ piece, personById }) {
  const { step } = piece
  const idx = stepIndex(piece.status)
  const [code, ...rest] = piece.title.split(' · ')
  const name = rest.length ? rest.join(' · ') : code
  const color = LEVEL_STYLE[step.level].color
  const urgent = ['late', 'today', 'soon'].includes(step.level)
  return (
    <button
      onClick={() => openPiece(piece.id)}
      className={cx(
        'flex w-full items-center gap-3 rounded-xl border border-border bg-bg-elevated p-3 text-left transition-colors hover:bg-surface sm:gap-4',
        step.level === 'done' && 'opacity-60',
      )}
      style={{ borderColor: urgent ? `${color}77` : undefined, boxShadow: urgent ? `inset 3px 0 0 ${color}` : undefined }}
    >
      <DateBlock date={piece.publish_date} level={step.level} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {rest.length > 0 && <span className="rounded-md bg-surface-hover px-1.5 py-0.5 font-mono text-[11px] font-semibold">{code}</span>}
          <span className="truncate text-sm font-semibold sm:text-base">{name}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-foreground-muted">
          <span>{FORMATS.find(f => f.key === piece.format)?.label}</span>
          {piece.pillar && <span>· {piece.pillar}</span>}
          {piece.parts.length > 0 && (
            <span className="flex items-center gap-0.5">
              ·
              {piece.parts.map(part => (
                <span key={part.id} className={part.status === 'subido' ? '' : 'opacity-40'} title={`${personById[part.assignee_id]?.full_name || 'Sin asignar'}: ${part.status}`}>
                  <Avatar person={personById[part.assignee_id]} size={18} />
                </span>
              ))}
            </span>
          )}
        </div>
        {step.level !== 'done' && (
          <p className="mt-1 text-[11px] font-medium sm:hidden" style={{ color }}>
            {step.label}{step.due ? ` · ${shortDate(step.due)}` : ''}
          </p>
        )}
        {/* Avance por etapas */}
        <div className="mt-2 flex max-w-xs gap-1" title={STEPS[idx]?.label}>
          {STEPS.map((s, i) => (
            <span key={s.label} className="h-1 flex-1 rounded-full" style={{ background: i <= idx ? (step.level === 'done' ? '#22C55E' : '#6366F1') : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>
      </div>
      <div className="hidden flex-col items-end gap-1.5 sm:flex">
        <StatusBadge status={piece.status} />
        <DeadlineChip step={step} compact />
      </div>
      <div className="sm:hidden">
        <DeadlineChip step={step} compact short />
      </div>
    </button>
  )
}

// ── Tabla tipo Sheet ────────────────────────────────────────

function GridTable({ pieces, personById }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead className="text-xs text-foreground-muted">
          <tr className="border-b border-border">
            <th className="px-2 py-2">Publica</th>
            <th className="px-2 py-2">Pieza</th>
            <th className="px-2 py-2">Formato</th>
            <th className="px-2 py-2">Pilar</th>
            <th className="px-2 py-2">Gancho</th>
            <th className="px-2 py-2">Rostros</th>
            <th className="px-2 py-2">Estado</th>
            <th className="px-2 py-2">Próximo plazo</th>
            <th className="px-2 py-2">Campaña</th>
          </tr>
        </thead>
        <tbody>
          {pieces.map(p => (
            <tr key={p.id} onClick={() => openPiece(p.id)} className="cursor-pointer border-b border-border hover:bg-surface">
              <td className="whitespace-nowrap px-2 py-2 font-semibold">{shortDate(p.publish_date)}</td>
              <td className="px-2 py-2 font-medium">{p.title}</td>
              <td className="px-2 py-2">{FORMATS.find(f => f.key === p.format)?.label}</td>
              <td className="px-2 py-2 text-foreground-muted">{p.pillar}</td>
              <td className="max-w-56 truncate px-2 py-2 text-foreground-muted">{p.hook}</td>
              <td className="px-2 py-2">
                <div className="flex gap-0.5">
                  {p.parts.map(part => (
                    <span key={part.id} className={part.status === 'subido' ? '' : 'opacity-40'}>
                      <Avatar person={personById[part.assignee_id]} size={20} />
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-2 py-2"><StatusBadge status={p.status} /></td>
              <td className="px-2 py-2"><DeadlineChip step={p.step} compact /></td>
              <td className="px-2 py-2 text-xs text-foreground-muted">{CAMPAIGNS.find(c => c.key === p.campaign_target)?.label}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-foreground-subtle">Rostros en gris: su parte aún no está subida.</p>
    </div>
  )
}

function GridNotes({ grid, editable, onSave }) {
  const [value, setValue] = useState(grid.notes || '')
  const dirty = value !== (grid.notes || '')
  return (
    <details className="mb-4 rounded-xl border border-border px-4 py-3">
      <summary className="cursor-pointer text-sm font-medium text-foreground-muted">Notas de la grilla</summary>
      {editable ? (
        <div className="mt-2">
          <Textarea placeholder="Objetivos del mes, fechas clave, acuerdos con el cliente" value={value} onChange={e => setValue(e.target.value)} className="min-h-14" />
          {dirty && <Button size="sm" className="mt-1" onClick={() => onSave(value)}>Guardar notas</Button>}
        </div>
      ) : (
        <p className="mt-2 whitespace-pre-wrap text-sm text-foreground-muted">{grid.notes}</p>
      )}
    </details>
  )
}
