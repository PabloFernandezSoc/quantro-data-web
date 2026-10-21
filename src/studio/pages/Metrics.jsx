import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { q } from '../lib/api'
import { useStudio } from '../lib/store'
import { deadlines, toISODate, parseISODate, shiftMonth, monthLabel } from '../lib/dates'
import { Card, PageHeader, Spinner, ErrorNote, Avatar, Select } from '../components/ui'
import { MonthPicker } from '../components/Pickers'

const dayDiff = (a, b) => Math.round((parseISODate(a) - parseISODate(b)) / 86400000)
const dateOf = ts => toISODate(new Date(ts))
const avg = xs => xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null
const fmt = (n, suffix = '') => n == null ? '—' : `${n.toFixed(1)}${suffix}`

// Diagnóstico de la producción: puntualidad, atrasos por persona y dónde se atasca el flujo
export default function Metrics() {
  const { clients, clientById, personById, month } = useStudio()
  const [scope, setScope] = useState('all')
  const [range, setRange] = useState(1)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const from = shiftMonth(month, -(range - 1))
  const to = shiftMonth(month, 1)

  useEffect(() => {
    let alive = true
    setData(null)
    ;(async () => {
      try {
        let query = supabase.from('pieces').select('*, parts:piece_parts(*), events:piece_events(*)')
          .gte('publish_date', from).lt('publish_date', to)
        if (scope !== 'all') query = query.eq('client_id', scope)
        const pieces = await q(query)
        if (alive) { setData(pieces); setError(null) }
      } catch (e) {
        if (alive) setError(e.message)
      }
    })()
    return () => { alive = false }
  }, [scope, from, to])

  const stats = useMemo(() => {
    if (!data) return null
    const active = data.filter(p => p.status !== 'descartada')
    const confirmedAt = p => {
      const ev = p.events.filter(e => e.to_status === 'material_completo').sort((a, b) => a.created_at.localeCompare(b.created_at))[0]
      return ev ? dateOf(ev.created_at) : null
    }
    const firstAt = (p, status) => {
      const ev = p.events.filter(e => e.to_status === status).sort((a, b) => a.created_at.localeCompare(b.created_at))[0]
      return ev ? dateOf(ev.created_at) : null
    }

    // Material a tiempo: confirmado antes del plazo de material
    const withDue = active.map(p => ({ p, due: deadlines(p, clientById[p.client_id]).materialDue, done: confirmedAt(p) })).filter(x => x.due)
    const evaluable = withDue.filter(x => x.done || dayDiff(x.due, toISODate(new Date())) < 0)
    const onTime = evaluable.filter(x => x.done && dayDiff(x.done, x.due) <= 0).length

    // Atraso por persona según fecha de subida de sus partes
    const byPerson = {}
    for (const { p, due } of withDue) {
      for (const part of p.parts) {
        if (!part.assignee_id) continue
        const s = (byPerson[part.assignee_id] ||= { total: 0, late: 0, delays: [], pending: 0, rejected: 0 })
        s.total++
        if (part.status === 'rechazado') s.rejected++
        if (part.uploaded_at && part.status === 'subido') {
          const d = dayDiff(dateOf(part.uploaded_at), due)
          s.delays.push(Math.max(0, d))
          if (d > 0) s.late++
        } else {
          s.pending++
          if (dayDiff(toISODate(new Date()), due) > 0) s.late++
        }
      }
    }

    // Tiempo promedio entre etapas (días)
    const stage = (a, b) => avg(active.map(p => {
      const x = firstAt(p, a) || (a === 'creada' ? dateOf(p.created_at) : null)
      const y = firstAt(p, b)
      return x && y ? Math.max(0, dayDiff(y, x)) : null
    }).filter(v => v != null))

    const returned = active.filter(p => p.events.some(e => e.type === 'material_devuelto')).length

    return {
      total: active.length,
      discarded: data.length - active.length,
      published: active.filter(p => p.status === 'publicada').length,
      onTimePct: evaluable.length ? (onTime / evaluable.length) * 100 : null,
      evaluable: evaluable.length,
      returned,
      byPerson: Object.entries(byPerson).map(([id, s]) => ({ id, ...s, avgDelay: avg(s.delays) })).sort((a, b) => b.late - a.late),
      stages: [
        ['Aprobada → material por revisar', stage('aprobada', 'material_por_revisar')],
        ['Por revisar → material completo', stage('material_por_revisar', 'material_completo')],
        ['Material completo → editada', stage('material_completo', 'editada')],
        ['Editada → programada', stage('editada', 'programada')],
      ],
    }
  }, [data, clientById])

  return (
    <div>
      <PageHeader title="Métricas" subtitle={`Piezas que se publican entre ${monthLabel(from)} y ${monthLabel(month)}`}>
        <Select value={scope} onChange={e => setScope(e.target.value)} className="w-auto!">
          <option value="all">Todos los clientes</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select value={range} onChange={e => setRange(Number(e.target.value))} className="w-auto!">
          <option value={1}>1 mes</option>
          <option value={3}>3 meses</option>
          <option value={6}>6 meses</option>
        </Select>
        <MonthPicker />
      </PageHeader>
      <ErrorNote>{error}</ErrorNote>
      {!stats ? <Spinner /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Piezas" value={stats.total} sub={`${stats.discarded} descartadas`} />
            <Stat label="Material a tiempo" value={stats.onTimePct == null ? '—' : `${Math.round(stats.onTimePct)}%`} sub={`de ${stats.evaluable} con plazo cumplido`} />
            <Stat label="Material devuelto" value={stats.returned} sub="piezas a las que les faltó algo" />
            <Stat label="Publicadas" value={stats.published} sub={`de ${stats.total}`} />
          </div>

          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">Puntualidad por persona</h2>
            {stats.byPerson.length === 0 ? <p className="text-sm text-foreground-muted">Sin partes asignadas en el período.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="text-xs text-foreground-muted">
                    <tr><th className="py-1.5">Persona</th><th>Partes</th><th>Atrasadas</th><th>Atraso prom.</th><th>Pendientes</th><th>Devueltas</th></tr>
                  </thead>
                  <tbody>
                    {stats.byPerson.map(s => (
                      <tr key={s.id} className="border-t border-border">
                        <td className="py-2"><span className="flex items-center gap-2"><Avatar person={personById[s.id]} />{personById[s.id]?.full_name}</span></td>
                        <td>{s.total}</td>
                        <td className={s.late ? 'text-red' : ''}>{s.late}</td>
                        <td>{fmt(s.avgDelay, ' días')}</td>
                        <td>{s.pending}</td>
                        <td>{s.rejected}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">¿Dónde se atasca? (días promedio entre etapas)</h2>
            <ul className="space-y-2">
              {stats.stages.map(([label, v]) => (
                <li key={label} className="flex items-center gap-3 text-sm">
                  <span className="w-64 shrink-0 text-foreground-muted">{label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (v || 0) * 7)}%` }} />
                  </div>
                  <span className="w-16 text-right tabular-nums">{fmt(v, ' d')}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, sub }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-foreground-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-foreground-subtle">{sub}</p>}
    </Card>
  )
}
