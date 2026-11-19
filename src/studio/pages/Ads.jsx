import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Lock, CheckCircle2, ChevronRight, ArrowUpDown, RefreshCw, Search, Lightbulb, Wrench, Bell, Trophy, CalendarRange } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { q } from '../lib/api'
import { useStudio } from '../lib/store'
import { Card, PageHeader, Spinner, ErrorNote, Select, Input, Badge, cx } from '../components/ui'

const clp = n => n == null ? '—' : new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)
const num = n => n == null ? '—' : new Intl.NumberFormat('es-CL').format(n)
const monthName = iso => new Date(`${iso}T12:00:00`).toLocaleDateString('es-CL', { month: 'short', year: '2-digit' })
const dayName = iso => new Date(`${iso}T12:00:00`).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
const cpm = (spend, msgs) => msgs > 0 ? spend / msgs : null

const SYNC = {
  ok: { label: 'Sincronizada', color: '#22C55E', icon: CheckCircle2 },
  sin_acceso: { label: 'Sin acceso API', color: '#F59E0B', icon: Lock },
  bloqueada: { label: 'Bloqueada', color: '#EF4444', icon: AlertTriangle },
}
const OBJECTIVE = { mensajes: 'WhatsApp', trafico: 'Tráfico', web: 'Web' }
const STATUS_LABEL = { ACTIVE: 'Activo', PAUSED: 'Pausado', ARCHIVED: 'Archivado', CAMPAIGN_PAUSED: 'Campaña pausada', ADSET_PAUSED: 'Conjunto pausado', WITH_ISSUES: 'Con problemas', NOT_DELIVERING: 'Sin entrega', INACTIVE: 'Inactivo', DELETED: 'Eliminado' }

// ── Fechas (hora local de Chile) ─────────────────────────────
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const addDays = (s, n) => { const d = new Date(`${s}T12:00:00`); d.setDate(d.getDate() + n); return iso(d) }
const monthStartOf = s => `${s.slice(0, 7)}-01`
const monthEndOf = s => { const d = new Date(`${s.slice(0, 7)}-01T12:00:00`); d.setMonth(d.getMonth() + 1); d.setDate(0); return iso(d) }
const weekStartOf = s => { const d = new Date(`${s}T12:00:00`); const w = (d.getDay() + 6) % 7; d.setDate(d.getDate() - w); return iso(d) }

const PRESETS = [
  ['all', 'Todo el período'], ['today', 'Hoy'], ['yesterday', 'Ayer'], ['7d', 'Últimos 7 días'], ['30d', 'Últimos 30 días'],
  ['this_month', 'Este mes'], ['last_month', 'Mes pasado'], ['custom', 'Personalizado'],
]
function rangeOf(preset, custom, today) {
  switch (preset) {
    case 'today': return { since: today, until: today }
    case 'yesterday': return { since: addDays(today, -1), until: addDays(today, -1) }
    case '7d': return { since: addDays(today, -6), until: today }
    case '30d': return { since: addDays(today, -29), until: today }
    case 'this_month': return { since: monthStartOf(today), until: today, month: monthStartOf(today) }
    case 'last_month': { const m = monthStartOf(addDays(monthStartOf(today), -1)); return { since: m, until: monthEndOf(m), month: m } }
    case 'custom': return custom.since && custom.until ? { since: custom.since, until: custom.until } : null
    default: return null
  }
}

async function fetchAll(build) {
  const out = []
  for (let from = 0; ; from += 1000) {
    const page = await q(build().range(from, from + 999))
    out.push(...page)
    if (page.length < 1000) return out
  }
}

// Agrega filas diarias por anuncio y les pega los datos del anuncio (nombre, campaña, estado)
function aggregateDaily(daily, adsById) {
  const by = {}
  for (const d of daily) {
    const r = (by[d.ad_id] ||= { spend: 0, messages: 0, impressions: 0, clicks: 0 })
    r.spend += Number(d.spend); r.messages += d.messages; r.impressions += Number(d.impressions); r.clicks += d.clicks
  }
  return Object.entries(by).filter(([id]) => adsById[id]).map(([id, r]) => ({
    ...adsById[id], ...r, thruplays: null, ctr: r.impressions ? (r.clicks / r.impressions) * 100 : null,
  }))
}

// Publicidad: inversión en Meta Ads por cliente, seguimiento del mes y anuncios ganadores
export default function Ads() {
  const { adsClients: clients, clientId: lastClientId, setClientId } = useStudio()
  const clientId = clients.some(c => c.id === lastClientId) ? lastClientId : clients[0]?.id || ''
  const today = iso(new Date())
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [brand, setBrand] = useState('all')
  const [accountFilter, setAccountFilter] = useState('all')
  const [preset, setPreset] = useState('this_month')
  const [custom, setCustom] = useState({ since: monthStartOf(today), until: today })
  const [sortBy, setSortBy] = useState('messages')
  const [objective, setObjective] = useState('mensajes')

  useEffect(() => {
    let alive = true
    setData(null)
    ;(async () => {
      try {
        const accounts = await q(supabase.from('ad_accounts').select('*').eq('client_id', clientId).order('name'))
        const ids = accounts.map(a => a.id)
        const [monthly, ads, daily, log, funnel, crmSync, weekly, events] = await Promise.all([
          ids.length ? q(supabase.from('ad_monthly').select('*').in('account_id', ids).order('month')) : [],
          ids.length ? q(supabase.from('ad_ads').select('*').in('account_id', ids)) : [],
          ids.length ? fetchAll(() => supabase.from('ad_daily').select('*').in('account_id', ids).order('date')) : [],
          q(supabase.from('ad_ops_log').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(30)),
          q(supabase.from('crm_funnel_monthly').select('*').eq('client_id', clientId).order('month')),
          q(supabase.from('crm_sync').select('*').eq('client_id', clientId)),
          q(supabase.from('crm_funnel_weekly').select('*').eq('client_id', clientId).order('week')),
          q(supabase.from('ad_events').select('*').eq('client_id', clientId).order('date')),
        ])
        if (alive) { setData({ accounts, monthly, ads, daily, log, funnel, crmSync: crmSync[0] || null, weekly, events }); setError(null) }
      } catch (e) {
        if (alive) setError(e.message)
      }
    })()
    return () => { alive = false }
  }, [clientId])

  const range = rangeOf(preset, custom, today)

  const view = useMemo(() => {
    if (!data) return null
    const accounts = data.accounts.filter(a => (brand === 'all' || a.brand === brand) && (accountFilter === 'all' || a.id === accountFilter))
    const accById = Object.fromEntries(accounts.map(a => [a.id, a]))
    const monthly = data.monthly.filter(m => accById[m.account_id])
    const allAds = data.ads.filter(a => accById[a.account_id])
    const adsById = Object.fromEntries(allAds.map(a => [a.id, a]))
    const daily = data.daily.filter(d => accById[d.account_id])
    const hasDaily = a => !!a.daily_since

    // Cuentas sin detalle diario: en meses completos se usa su total mensual; en otros rangos no se pueden incluir
    let ads, fallback = {}, missing = []
    if (!range) {
      ads = allAds.map(a => ({ ...a, spend: Number(a.spend), impressions: Number(a.impressions), ctr: a.ctr == null ? null : Number(a.ctr) }))
    } else {
      ads = aggregateDaily(daily.filter(d => d.date >= range.since && d.date <= range.until), adsById)
      for (const a of accounts.filter(a => a.sync_status === 'ok' && !hasDaily(a))) {
        // Con desglose mensual cargado, un mes sin fila significa que no hubo gasto
        const hasMonthly = monthly.some(x => x.account_id === a.id)
        const m = range.month && monthly.find(x => x.account_id === a.id && x.month === range.month)
        if (range.month && hasMonthly) fallback[a.id] = { spend: Number(m?.spend || 0), messages: m?.messages || 0 }
        else missing.push(a)
      }
    }
    const fbSpend = Object.values(fallback).reduce((s, f) => s + f.spend, 0)
    const fbMsgs = Object.values(fallback).reduce((s, f) => s + f.messages, 0)

    const spend = sumBy(ads, 'spend') + fbSpend
    const messages = sumBy(ads, 'messages') + fbMsgs
    const msgAds = ads.filter(a => a.objective === 'mensajes')
    const msgSpend = sumBy(msgAds, 'spend') + fbSpend
    const msgMessages = sumBy(msgAds, 'messages') + fbMsgs

    const byMonth = {}
    for (const m of monthly) {
      const r = (byMonth[m.month] ||= { key: m.month, label: monthName(m.month), spend: 0, messages: 0 })
      r.spend += Number(m.spend); r.messages += m.messages
    }
    const months = Object.values(byMonth).sort((a, b) => a.key.localeCompare(b.key))

    const perAccount = accounts.map(a => ({
      ...a, noDaily: !!range && !hasDaily(a), fallback: fallback[a.id],
    }))

    const sorted = ads
      .filter(a => objective === 'all' || a.objective === objective)
      .map(a => ({ ...a, cost: cpm(a.spend, a.messages), account: accById[a.account_id] }))
      .sort((a, b) => sortBy === 'cost'
        ? (a.messages >= 20 ? a.cost : Infinity) - (b.messages >= 20 ? b.cost : Infinity)
        : b[sortBy] - a[sortBy])

    const leaks = ads.filter(a => a.status === 'ACTIVE' && a.objective !== 'mensajes' && a.spend > 50000)
    const top = [...ads].sort((a, b) => b.messages - a.messages)[0]

    return { accounts: perAccount, monthly, months, daily, allAds, adsById, ads, sorted, spend, messages, msgSpend, msgMessages, leaks, top, missing, hasFallback: fbSpend > 0 }
  }, [data, brand, accountFilter, sortBy, objective, range?.since, range?.until, range?.month])

  const brands = useMemo(() => [...new Set((data?.accounts || []).map(a => a.brand).filter(Boolean))], [data])
  const pending = view?.accounts.filter(a => a.sync_status !== 'ok') || []
  const lastSync = data?.accounts.map(a => a.synced_at).filter(Boolean).sort().at(-1)
  const periodLabel = !range ? 'desde el inicio' : range.since === range.until ? dayName(range.since) : `${dayName(range.since)} al ${dayName(range.until)}`

  return (
    <div>
      <PageHeader title="Publicidad" subtitle={lastSync ? `Meta Ads · actualizado ${new Date(lastSync).toLocaleDateString('es-CL')}` : 'Meta Ads'}>
        {clients.length > 1 && (
          <Select value={clientId} onChange={e => { setClientId(e.target.value); setAccountFilter('all') }} className="w-auto!">
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        )}
      </PageHeader>
      <ErrorNote>{error}</ErrorNote>
      {!view ? <Spinner /> : data.accounts.length === 0 ? (
        <Card className="p-6 text-sm text-foreground-muted">Este cliente todavía no tiene cuentas publicitarias conectadas.</Card>
      ) : (
        <div className="space-y-4">
          <Card className="flex flex-wrap items-end gap-2 p-3">
            <label className="min-w-40 flex-1 sm:flex-none">
              <span className="mb-1 block text-[11px] text-foreground-muted">Período</span>
              <Select value={preset} onChange={e => setPreset(e.target.value)} className="h-9">
                {PRESETS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </Select>
            </label>
            {preset === 'custom' && (
              <>
                <label><span className="mb-1 block text-[11px] text-foreground-muted">Desde</span>
                  <Input type="date" value={custom.since} max={custom.until || today} onChange={e => setCustom(c => ({ ...c, since: e.target.value }))} className="h-9" /></label>
                <label><span className="mb-1 block text-[11px] text-foreground-muted">Hasta</span>
                  <Input type="date" value={custom.until} min={custom.since} max={today} onChange={e => setCustom(c => ({ ...c, until: e.target.value }))} className="h-9" /></label>
              </>
            )}
            {brands.length > 1 && (
              <label className="min-w-40 flex-1 sm:flex-none">
                <span className="mb-1 block text-[11px] text-foreground-muted">Marca</span>
                <Select value={brand} onChange={e => { setBrand(e.target.value); setAccountFilter('all') }} className="h-9">
                  <option value="all">Todas las marcas</option>
                  {brands.map(b => <option key={b} value={b}>{b}</option>)}
                </Select>
              </label>
            )}
            <label className="min-w-48 flex-1 sm:flex-none">
              <span className="mb-1 block text-[11px] text-foreground-muted">Cuenta</span>
              <Select value={accountFilter} onChange={e => setAccountFilter(e.target.value)} className="h-9">
                <option value="all">Todas las cuentas</option>
                {data.accounts.filter(a => brand === 'all' || a.brand === brand).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </Select>
            </label>
            <span className="ml-auto flex items-center gap-1.5 self-center text-xs text-foreground-muted"><CalendarRange size={14} /> {periodLabel}</span>
          </Card>

          {pending.length > 0 && (
            <Card className="border-amber/40 p-4 text-sm">
              <p className="flex items-center gap-2 font-medium"><AlertTriangle size={15} className="text-amber" /> Los totales no incluyen {pending.length === 1 ? 'una cuenta' : `${pending.length} cuentas`}</p>
              <ul className="mt-1.5 space-y-0.5 text-foreground-muted">
                {pending.map(a => <li key={a.id}>· <span className="text-foreground">{a.name}</span>: {a.sync_note}</li>)}
              </ul>
            </Card>
          )}
          {view.missing.length > 0 && (
            <Card className="border-amber/40 p-3 text-sm text-foreground-muted">
              <AlertTriangle size={14} className="mr-1.5 inline text-amber" />
              Para este período no se incluye {view.missing.map(a => a.name).join(', ')}: todavía no tenemos su detalle por día (sí por mes; elige "Este mes" o "Mes pasado" para verlas).
            </Card>
          )}

          <MonthToDate monthly={view.monthly} daily={view.daily} accounts={view.accounts} today={today} />

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Inversión" value={clp(view.spend)} sub={periodLabel} />
            <Stat label="Conversaciones de WhatsApp" value={num(view.messages)} sub="iniciadas desde anuncios" />
            <Stat label="Costo por conversación" value={clp(cpm(view.msgSpend, view.msgMessages))} sub="solo campañas de mensajes" />
            <Stat label="Video con más conversaciones" value={view.top?.name || '—'} sub={view.top ? `${num(view.top.messages)} conversaciones · ${periodLabel}` : periodLabel} small />
          </div>

          {view.leaks.length > 0 && (
            <Card className="border-red/40 p-4 text-sm">
              <p className="flex items-center gap-2 font-medium"><AlertTriangle size={15} className="text-red" /> Anuncios activos que gastan sin traer conversaciones</p>
              <p className="mt-1 text-foreground-muted">
                {view.leaks.length === 1 ? '1 anuncio de tráfico activo acumula' : `${view.leaks.length} anuncios de tráfico activos acumulan`} {clp(sumBy(view.leaks, 'spend'))} con{' '}
                {num(sumBy(view.leaks, 'messages'))} conversaciones. Conviene pasarlos a campaña de mensajes o pausarlos.
              </p>
            </Card>
          )}

          <Winners allAds={view.allAds} adsById={view.adsById} daily={view.daily} accounts={view.accounts} today={today} />

          <Trend months={view.months} daily={view.daily} range={range} today={today} accounts={view.accounts} />

          <Explorer accounts={view.accounts} ads={view.ads} rangeMode={!!range} />

          <Card className="p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Ranking de videos · {periodLabel}</h2>
              <div className="flex gap-2">
                <Select value={objective} onChange={e => setObjective(e.target.value)} className="h-8! w-auto! text-xs!">
                  <option value="mensajes">Campañas de WhatsApp</option>
                  <option value="trafico">Campañas de tráfico</option>
                  <option value="all">Todas</option>
                </Select>
                <Select value={sortBy} onChange={e => setSortBy(e.target.value)} className="h-8! w-auto! text-xs!">
                  <option value="messages">Más conversaciones</option>
                  <option value="spend">Más inversión</option>
                  <option value="cost">Menor costo/conv. (mín. 20)</option>
                </Select>
              </div>
            </div>
            <AdsTable ads={view.sorted} totalSpend={sumBy(view.ads, 'spend')} />
          </Card>

          {data.funnel.length > 0
            ? <>
                <CommercialFunnel funnel={data.funnel} sync={data.crmSync} allAccounts={data.accounts} accounts={view.accounts} monthly={data.monthly} daily={data.daily} range={range} today={today} />
                <FunnelEvolution weekly={data.weekly} funnel={data.funnel} events={data.events} accounts={data.accounts} range={range} today={today} />
                <SpendMixAndCac funnel={data.funnel} sync={data.crmSync} accounts={data.accounts} monthly={data.monthly} daily={data.daily} events={data.events} range={range} today={today} />
              </>
            : <FunnelPreview messages={view.messages} />}

          <OpsLog log={data.log} accounts={data.accounts} />
        </div>
      )}
    </div>
  )
}

// ── Mes en curso: cuánto llevamos, ritmo diario y proyección al cierre ──
function MonthToDate({ monthly, daily, accounts, today }) {
  const m = monthStartOf(today)
  const prev = monthStartOf(addDays(m, -1))
  const ids = new Set(accounts.filter(a => a.sync_status === 'ok').map(a => a.id))
  // Por cuenta: lo más actualizado entre el total mensual cargado y la suma de sus días
  const monthTotal = month => {
    let spend = 0, messages = 0
    for (const id of ids) {
      const mm = monthly.find(x => x.account_id === id && x.month === month)
      const dd = daily.filter(d => d.account_id === id && d.date.startsWith(month.slice(0, 7)))
      const ds = sumBy(dd, 'spend'), dm = sumBy(dd, 'messages')
      const useDaily = ds >= Number(mm?.spend || 0)
      spend += useDaily ? ds : Number(mm.spend); messages += useDaily ? dm : mm.messages
    }
    return { spend, messages }
  }
  const cur = monthTotal(m), last = monthTotal(prev)
  const elapsed = Number(today.slice(8, 10))
  const daysInMonth = Number(monthEndOf(today).slice(8, 10))
  const pace = cur.spend / elapsed
  const projection = pace * daysInMonth
  const lastSamePace = last.spend ? (projection / last.spend - 1) * 100 : null
  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold">Mes en curso · <span className="capitalize">{new Date(`${m}T12:00:00`).toLocaleDateString('es-CL', { month: 'long' })}</span> {m.slice(0, 4)}</h2>
      <p className="mb-3 text-xs text-foreground-muted">Día {elapsed} de {daysInMonth}. La proyección asume el mismo ritmo de gasto hasta fin de mes.</p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Mini label="Llevamos invertido" value={clp(cur.spend)} />
        <Mini label="Conversaciones" value={num(cur.messages)} sub={`${clp(cpm(cur.spend, cur.messages))} c/u`} />
        <Mini label="Gasto promedio diario" value={clp(pace)} />
        <Mini label="Proyección al cierre" value={clp(projection)} />
        <Mini label={`Mes anterior (${monthName(prev)})`} value={clp(last.spend)}
          sub={lastSamePace == null ? '' : `${lastSamePace >= 0 ? '+' : ''}${lastSamePace.toFixed(0)}% proyectado vs anterior`} />
      </div>
    </Card>
  )
}

function Mini({ label, value, sub }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-[11px] text-foreground-muted">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
      {sub && <p className="text-[11px] text-foreground-subtle">{sub}</p>}
    </div>
  )
}

// ── Tendencia por día, semana o mes ──
function Trend({ months, daily, range, today, accounts }) {
  const [gran, setGran] = useState('week')
  const since = range?.since || (gran === 'day' ? addDays(today, -29) : addDays(today, -7 * 12 + 1))
  const until = range?.until || today
  let buckets
  if (gran === 'month') buckets = months
  else {
    const by = {}
    for (const d of daily.filter(d => d.date >= since && d.date <= until)) {
      const k = gran === 'day' ? d.date : weekStartOf(d.date)
      const r = (by[k] ||= { key: k, label: gran === 'day' ? dayName(k) : `Sem. ${dayName(k)}`, spend: 0, messages: 0 })
      r.spend += Number(d.spend); r.messages += d.messages
    }
    buckets = Object.values(by).sort((a, b) => a.key.localeCompare(b.key))
  }
  const noDaily = accounts.filter(a => a.sync_status === 'ok' && !a.daily_since)
  return (
    <Card className="p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Inversión y conversaciones por {gran === 'day' ? 'día' : gran === 'week' ? 'semana' : 'mes'}</h2>
        <div className="flex rounded-lg border border-border p-0.5 text-xs">
          {[['day', 'Día'], ['week', 'Semana'], ['month', 'Mes']].map(([k, l]) => (
            <button key={k} onClick={() => setGran(k)} className={cx('rounded-md px-3 py-1', gran === k ? 'bg-surface-hover text-foreground' : 'text-foreground-muted hover:text-foreground')}>{l}</button>
          ))}
        </div>
      </div>
      <BarChart rows={buckets} compact={buckets.length > 14} />
      {gran !== 'month' && noDaily.length > 0 && (
        <p className="mt-2 text-xs text-foreground-subtle">Por día y semana no incluye {noDaily.map(a => a.name).join(', ')} (falta su detalle diario). La vista por mes sí las incluye.</p>
      )}
    </Card>
  )
}

function BarChart({ rows, compact }) {
  if (!rows.length) return <p className="text-sm text-foreground-muted">Sin datos para este período.</p>
  const max = Math.max(...rows.map(m => m.spend), 1)
  return (
    <div className="flex items-end gap-1.5 overflow-x-auto pb-1">
      {rows.map(m => (
        <div key={m.key} className={cx('flex flex-1 flex-col items-center gap-1', compact ? 'min-w-9' : 'min-w-16')} title={`${m.label}: ${clp(m.spend)} · ${num(m.messages)} conv.`}>
          {!compact && <span className="text-[11px] tabular-nums text-foreground-muted">{m.spend >= 1e6 ? `$${(m.spend / 1e6).toFixed(1)}M` : `$${Math.round(m.spend / 1e3)}K`}</span>}
          <div className="flex h-36 w-full items-end">
            <div className="w-full rounded-t-md bg-accent" style={{ height: `${Math.max(2, (m.spend / max) * 100)}%` }} />
          </div>
          <span className={cx('whitespace-nowrap font-medium capitalize', compact ? 'text-[10px]' : 'text-xs')}>{m.label}</span>
          {!compact && <span className="text-[11px] tabular-nums text-foreground-subtle">{num(m.messages)} conv.</span>}
          {!compact && <span className="text-[11px] tabular-nums text-foreground-subtle">{clp(cpm(m.spend, m.messages))}</span>}
        </div>
      ))}
    </div>
  )
}

// ── Anuncios ganadores: en cada campaña, qué anuncio se está llevando el presupuesto ──
const WIN_PERIODS = [['today', 'Hoy'], ['yesterday', 'Ayer'], ['7d', 'Últimos 7 días'], ['this_month', 'Este mes']]
function Winners({ allAds, adsById, daily, accounts, today }) {
  const [period, setPeriod] = useState('7d')
  const r = rangeOf(period, {}, today)
  // Solo lo que está corriendo hoy: anuncios activos (y por lo tanto en campañas activas)
  const rows = aggregateDaily(daily.filter(d => d.date >= r.since && d.date <= r.until), adsById).filter(a => a.spend > 0 && a.status === 'ACTIVE')
  const groups = {}
  for (const a of rows) (groups[`${a.account_id}|${a.campaign_name}`] ||= []).push(a)
  // Cuentas sin detalle diario: se muestra el acumulado de sus anuncios activos
  const noDaily = accounts.filter(a => a.sync_status === 'ok' && !a.daily_since).map(a => a.id)
  const cumulative = {}
  for (const a of allAds.filter(a => noDaily.includes(a.account_id) && a.status === 'ACTIVE')) {
    (cumulative[`${a.account_id}|${a.campaign_name}`] ||= []).push({ ...a, spend: Number(a.spend) })
  }
  const accName = Object.fromEntries(accounts.map(a => [a.id, a.name]))
  const render = (key, list, cumul) => {
    const total = sumBy(list, 'spend')
    const sorted = [...list].sort((a, b) => b.spend - a.spend)
    const eligible = sorted.filter(a => a.messages >= 3)
    const best = eligible.length > 1 ? eligible.reduce((x, y) => (cpm(y.spend, y.messages) < cpm(x.spend, x.messages) ? y : x)) : null
    const [accId, ...rest] = key.split('|')
    const campaign = rest.join('|')
    return (
      <div key={key} className="rounded-lg border border-border p-3">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-1">
          <p className="text-sm font-medium">{campaign}</p>
          <p className="text-[11px] text-foreground-subtle">{accName[accId]} · {clp(total)} {cumul ? 'acumulado (sin detalle diario)' : 'en el período'}</p>
        </div>
        <ul className="space-y-2.5">
          {sorted.slice(0, 5).map((a, i) => {
            const share = total ? (a.spend / total) * 100 : 0
            return (
              <li key={a.id} className="text-sm">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <span className="flex min-w-0 max-w-full items-center gap-1.5">
                    {i === 0 && <Trophy size={14} className="shrink-0 text-amber" />}
                    <span className="min-w-0 truncate">{a.name}</span>
                  </span>
                  {i === 0 && <Badge color="#F59E0B">Ganador</Badge>}
                  {best?.id === a.id && <Badge color="#22C55E">Mejor costo</Badge>}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                  <span className="flex min-w-32 flex-1 items-center gap-2">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface"><span className="block h-full rounded-full bg-accent" style={{ width: `${share}%` }} /></span>
                    <span className="whitespace-nowrap text-right text-xs tabular-nums text-foreground-muted">{share.toFixed(0)}% ppto.</span>
                  </span>
                  <span className="text-xs tabular-nums text-foreground-muted">{clp(a.spend)} · {num(a.messages)} conv. · {clp(cpm(a.spend, a.messages))} c/u</span>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }
  const keys = Object.keys(groups).sort((a, b) => sumBy(groups[b], 'spend') - sumBy(groups[a], 'spend'))
  return (
    <Card className="p-4">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold"><Trophy size={15} className="text-amber" /> Anuncios ganadores · campañas activas</h2>
        <Select value={period} onChange={e => setPeriod(e.target.value)} className="h-8! w-auto! text-xs!">
          {WIN_PERIODS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </Select>
      </div>
      <p className="mb-3 text-xs text-foreground-muted">Solo anuncios que están corriendo hoy. En cada campaña, Meta reparte el presupuesto entre los anuncios: el <b>ganador</b> es el que se está llevando la mayor parte y <b>mejor costo</b> el que trae conversaciones más baratas.</p>
      <div className="space-y-3">
        {keys.map(k => render(k, groups[k], false))}
        {Object.entries(cumulative).map(([k, list]) => render(k, list, true))}
        {keys.length === 0 && Object.keys(cumulative).length === 0 && <p className="text-sm text-foreground-muted">No hay anuncios activos con gasto en este período.</p>}
      </div>
    </Card>
  )
}

const sumBy = (rows, k) => rows.reduce((s, r) => s + Number(r[k] || 0), 0)
// CTR ponderado por impresiones (el CTR no se puede sumar)
const ctrOf = rows => {
  const imp = sumBy(rows, 'impressions')
  return imp ? rows.reduce((s, r) => s + Number(r.ctr || 0) * Number(r.impressions || 0), 0) / imp : null
}
const agg = rows => {
  const spend = sumBy(rows, 'spend'), messages = sumBy(rows, 'messages')
  return { spend, messages, impressions: sumBy(rows, 'impressions'), thruplays: sumBy(rows, 'thruplays'), ctr: ctrOf(rows), cost: cpm(spend, messages), activeAds: rows.filter(r => r.status === 'ACTIVE').length, adsCount: rows.length }
}

// Explorador jerárquico: Cuenta → Campaña → Anuncios (agrupados por conjunto)
function Explorer({ accounts, ads, rangeMode }) {
  const [accountId, setAccountId] = useState(null)
  const [campaign, setCampaign] = useState(null)
  const [sort, setSort] = useState({ key: 'spend', dir: -1 })
  // Cuentas sin detalle diario aportan su total mensual solo a nivel de cuenta
  const fbSpend = accounts.reduce((s, a) => s + (a.noDaily && a.fallback ? a.fallback.spend : 0), 0)
  const fbMsgs = accounts.reduce((s, a) => s + (a.noDaily && a.fallback ? a.fallback.messages : 0), 0)
  const total = sumBy(ads, 'spend') + fbSpend
  const account = accounts.find(a => a.id === accountId)

  const level = !account ? 'account' : !campaign ? 'campaign' : 'ad'
  let rows
  if (level === 'account') {
    rows = accounts.map(a => {
      const r = ads.filter(x => x.account_id === a.id)
      const sub = `${a.brand} · ${a.id}`
      if (a.noDaily && a.sync_status === 'ok') {
        const f = a.fallback
        return { key: a.id, name: a.name, sub, badge: { label: f ? 'Total del mes' : 'Sin detalle diario', color: '#F59E0B' }, ok: false, campaigns: null,
          ...(f ? { spend: f.spend, messages: f.messages, cost: cpm(f.spend, f.messages), adsCount: 1, impressions: null, ctr: null } : { adsCount: 0 }) }
      }
      return { key: a.id, name: a.name, sub, badge: SYNC[a.sync_status], ok: a.sync_status === 'ok' && r.length > 0,
        campaigns: new Set(r.map(x => x.campaign_name)).size, ...agg(r) }
    })
  } else if (level === 'campaign') {
    const byCampaign = {}
    for (const x of ads.filter(x => x.account_id === account.id)) (byCampaign[x.campaign_name || 'Sin campaña'] ||= []).push(x)
    rows = Object.entries(byCampaign).map(([name, r]) => {
      const a = agg(r)
      return { key: name, name, sub: `${OBJECTIVE[r[0].objective] || r[0].objective} · ${new Set(r.map(x => x.adset_name)).size} conjunto(s)`,
        badge: a.activeAds ? { label: 'Activa', color: '#22C55E' } : { label: 'Inactiva', color: '#8A8F98' }, ok: true, ...a }
    })
  } else {
    rows = ads.filter(x => x.account_id === account.id && (x.campaign_name || 'Sin campaña') === campaign).map(x => ({
      key: x.id, name: x.name, sub: x.adset_name ? `Conjunto: ${x.adset_name}` : `ID ${x.id}`, adset: x.adset_name,
      badge: { label: STATUS_LABEL[x.status] || x.status, color: x.status === 'ACTIVE' ? '#22C55E' : '#8A8F98' }, ok: false,
      spend: Number(x.spend), messages: x.messages, impressions: Number(x.impressions), thruplays: x.thruplays, ctr: x.ctr == null ? null : Number(x.ctr),
      cost: cpm(Number(x.spend), x.messages), reach: Number(x.reach),
    }))
  }
  const val = (r, k) => k === 'name' ? r.name : (r[k] ?? (sort.dir < 0 ? -Infinity : Infinity))
  rows.sort((a, b) => {
    const x = val(a, sort.key), y = val(b, sort.key)
    return (typeof x === 'string' ? x.localeCompare(y) : x - y) * sort.dir
  })
  const levelTotal = agg(level === 'account' ? ads : level === 'campaign' ? ads.filter(x => x.account_id === account.id)
    : ads.filter(x => x.account_id === account.id && (x.campaign_name || 'Sin campaña') === campaign))
  if (level === 'account' && fbSpend) {
    levelTotal.spend += fbSpend; levelTotal.messages += fbMsgs; levelTotal.cost = cpm(levelTotal.spend, levelTotal.messages)
  }

  const open = r => {
    if (!r.ok) return
    if (level === 'account') { setAccountId(r.key); setCampaign(null) } else if (level === 'campaign') setCampaign(r.key)
  }
  const Th = ({ k, children, left }) => (
    <th className={cx('cursor-pointer select-none whitespace-nowrap py-1.5 font-medium hover:text-foreground', !left && 'text-right')} onClick={() => setSort(s => ({ key: k, dir: s.key === k ? -s.dir : -1 }))}>
      <span className="inline-flex items-center gap-1">{children}{sort.key === k && <ArrowUpDown size={11} />}</span>
    </th>
  )
  const crumb = 'rounded px-1.5 py-0.5 hover:bg-surface-hover'
  const firstCol = { account: 'Cuenta', campaign: 'Campaña', ad: 'Anuncio' }[level]

  return (
    <Card className="p-4">
      <div className="mb-3 flex flex-wrap items-center gap-1 text-sm">
        <button className={cx(crumb, level === 'account' ? 'font-semibold' : 'text-foreground-muted')} onClick={() => { setAccountId(null); setCampaign(null) }}>Todas las cuentas</button>
        {account && <><ChevronRight size={14} className="text-foreground-subtle" /><button className={cx(crumb, level === 'campaign' ? 'font-semibold' : 'text-foreground-muted')} onClick={() => setCampaign(null)}>{account.name}</button></>}
        {campaign && <><ChevronRight size={14} className="text-foreground-subtle" /><span className="px-1.5 font-semibold">{campaign}</span></>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm [&_td]:px-2 [&_th]:px-2 [&_td:first-child]:pl-0 [&_th:first-child]:pl-0">
          <thead className="text-xs text-foreground-muted">
            <tr>
              <Th k="name" left>{firstCol}</Th><th className="py-1.5 font-medium">Estado</th>
              {level === 'account' && <Th k="campaigns">Campañas</Th>}
              {level !== 'ad' && <Th k="activeAds">Anuncios activos</Th>}
              <Th k="spend">Inversión</Th><th className="py-1.5 text-right font-medium">% del total</th>
              <Th k="impressions">Impresiones</Th><Th k="ctr">CTR</Th>
              {level === 'ad' && !rangeMode && <Th k="thruplays">ThruPlays</Th>}
              <Th k="messages">Conversaciones</Th><Th k="cost">Costo/conv.</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.key} onClick={() => open(r)} className={cx('border-t border-border', r.ok && 'cursor-pointer hover:bg-surface-hover')}>
                <td className="max-w-80 py-2 pr-2">
                  <span className="flex items-center gap-1">
                    <span className="line-clamp-2">{r.name}</span>
                    {r.ok && <ChevronRight size={14} className="shrink-0 text-foreground-subtle" />}
                  </span>
                  <span className="block text-[11px] text-foreground-subtle">{r.sub}</span>
                </td>
                <td><Badge color={r.badge.color}>{r.badge.label}</Badge></td>
                {level === 'account' && <td className="text-right tabular-nums">{r.ok ? r.campaigns : '—'}</td>}
                {level !== 'ad' && <td className="text-right tabular-nums">{r.ok ? r.activeAds : '—'}</td>}
                <td className="text-right tabular-nums">{r.adsCount === 0 ? '—' : clp(r.spend)}</td>
                <td className="text-right tabular-nums text-foreground-muted">{total && r.spend ? `${((r.spend / total) * 100).toFixed(1)}%` : '—'}</td>
                <td className="text-right tabular-nums">{r.adsCount === 0 ? '—' : num(r.impressions)}</td>
                <td className="text-right tabular-nums">{r.ctr == null ? '—' : `${r.ctr.toFixed(2)}%`}</td>
                {level === 'ad' && !rangeMode && <td className="text-right tabular-nums">{num(r.thruplays)}</td>}
                <td className="text-right tabular-nums">{r.adsCount === 0 ? '—' : num(r.messages)}</td>
                <td className={cx('text-right tabular-nums', r.cost > 10000 && 'text-red')}>{clp(r.cost)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-border text-sm font-semibold">
            <tr>
              <td className="py-2">Total</td><td />
              {level === 'account' && <td className="text-right tabular-nums">{rows.reduce((s, r) => s + (r.campaigns || 0), 0)}</td>}
              {level !== 'ad' && <td className="text-right tabular-nums">{levelTotal.activeAds}</td>}
              <td className="text-right tabular-nums">{clp(levelTotal.spend)}</td>
              <td className="text-right tabular-nums text-foreground-muted">{total ? `${((levelTotal.spend / total) * 100).toFixed(1)}%` : '—'}</td>
              <td className="text-right tabular-nums">{num(levelTotal.impressions)}</td>
              <td className="text-right tabular-nums">{levelTotal.ctr == null ? '—' : `${levelTotal.ctr.toFixed(2)}%`}</td>
              {level === 'ad' && !rangeMode && <td className="text-right tabular-nums">{num(levelTotal.thruplays)}</td>}
              <td className="text-right tabular-nums">{num(levelTotal.messages)}</td>
              <td className="text-right tabular-nums">{clp(levelTotal.cost)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      {level === 'account' && <p className="mt-2 text-xs text-foreground-subtle">Haz clic en una cuenta para ver sus campañas, y en una campaña para ver sus anuncios.</p>}
    </Card>
  )
}

function AdsTable({ ads, totalSpend }) {
  if (!ads.length) return <p className="text-sm text-foreground-muted">Sin anuncios para este filtro.</p>
  const maxMsgs = Math.max(...ads.map(a => a.messages), 1)
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="text-xs text-foreground-muted">
          <tr>
            <th className="py-1.5">Video / anuncio</th><th>Estado</th>
            <th className="text-right">Inversión</th><th className="text-right">% del total</th>
            <th className="w-40 pl-4">Conversaciones</th><th className="text-right">Costo/conv.</th><th className="text-right">CTR</th>
          </tr>
        </thead>
        <tbody>
          {ads.map(a => (
            <tr key={a.id} className="border-t border-border">
              <td className="max-w-72 py-2">
                <span className="line-clamp-2">{a.name}</span>
                <span className="block text-[11px] text-foreground-subtle">{a.account?.name} · {OBJECTIVE[a.objective] || a.objective}</span>
              </td>
              <td><Badge color={a.status === 'ACTIVE' ? '#22C55E' : '#8A8F98'}>{STATUS_LABEL[a.status] || a.status}</Badge></td>
              <td className="text-right tabular-nums">{clp(a.spend)}</td>
              <td className="text-right tabular-nums text-foreground-muted">{totalSpend ? `${((a.spend / totalSpend) * 100).toFixed(1)}%` : '—'}</td>
              <td className="pl-4">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${(a.messages / maxMsgs) * 100}%` }} />
                  </div>
                  <span className="w-12 text-right tabular-nums">{num(a.messages)}</span>
                </div>
              </td>
              <td className={cx('text-right tabular-nums', a.cost && a.cost > 10000 && 'text-red')}>{clp(a.cost)}</td>
              <td className="text-right tabular-nums text-foreground-muted">{a.ctr == null ? '—' : `${Number(a.ctr).toFixed(2)}%`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Embudo comercial: se completa cuando conectemos el CRM (Airtable)
function FunnelPreview({ messages }) {
  const steps = [
    ['Conversaciones de WhatsApp', num(messages), 'Meta Ads'],
    ['Reuniones agendadas', '—', 'Airtable'],
    ['Aptos (liquidación / renegociación)', '—', 'Airtable'],
    ['Ventas cerradas', '—', 'Airtable'],
  ]
  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold">Embudo comercial</h2>
      <p className="mb-3 text-xs text-foreground-muted">De la conversación a la venta. Las etapas comerciales se activan al conectar Airtable.</p>
      <div className="grid gap-2 sm:grid-cols-4">
        {steps.map(([label, value, source], i) => (
          <div key={label} className={cx('rounded-lg border border-border p-3', i > 0 && 'opacity-60')}>
            <p className="text-[11px] text-foreground-muted">{label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
            <p className="text-[11px] text-foreground-subtle">{source}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Embudo comercial real: WhatsApp (HiBot) → reuniones y ventas (Airtable) ──
// Datos mensuales en crm_funnel_monthly, cargados desde la carpeta "Tus deudas" (cruce por teléfono).
// basis 'cohorte' = mes del primer mensaje en WhatsApp; 'agenda' = mes en que se agendó la reunión.
const BASIS = { cohorte: 'Por primer contacto', agenda: 'Por fecha de agendamiento' }
const pctOf = (a, b) => (b ? `${(Math.round((a / b) * 1000) / 10).toLocaleString('es-CL')}%` : '—')
const ratio = (a, b) => (a && b ? `${(a / b).toFixed(1).replace('.', ',')}×` : '—')
const median = arr => { const s = arr.filter(x => x != null).sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null }

// Gasto y conversaciones del mes por cuenta: lo más actualizado entre el total mensual y la suma diaria
function spendByMonth(monthly, daily, ids) {
  const out = {}
  const months = new Set(monthly.filter(m => ids.has(m.account_id)).map(m => m.month))
  for (const d of daily) if (ids.has(d.account_id)) months.add(monthStartOf(d.date))
  for (const month of months) {
    let spend = 0, messages = 0
    for (const id of ids) {
      const mm = monthly.find(x => x.account_id === id && x.month === month)
      const dd = daily.filter(d => d.account_id === id && d.date.startsWith(month.slice(0, 7)))
      const ds = sumBy(dd, 'spend'), dm = sumBy(dd, 'messages')
      const useDaily = ds >= Number(mm?.spend || 0)
      spend += useDaily ? ds : Number(mm.spend); messages += useDaily ? dm : mm.messages
    }
    out[month] = { spend, messages }
  }
  return out
}

function CommercialFunnel({ funnel, sync, allAccounts, accounts, monthly, daily, range, today }) {
  const [basisPick, setBasisPick] = useState(null)
  const brandIds = useMemo(() => new Set(allAccounts.filter(a => a.sync_status === 'ok' && (!sync?.brand || a.brand === sync.brand)).map(a => a.id)), [allAccounts, sync?.brand])
  const spendBy = useMemo(() => spendByMonth(monthly, daily, brandIds), [monthly, daily, brandIds])
  const visible = new Set(accounts.map(a => a.id))
  const otherBrand = accounts.length > 0 && ![...visible].some(id => brandIds.has(id))
  const subset = !otherBrand && [...brandIds].some(id => !visible.has(id))

  if (otherBrand) {
    return (
      <Card className="p-4 text-sm text-foreground-muted">
        <h2 className="mb-1 text-sm font-semibold text-foreground">Embudo comercial</h2>
        Por ahora el embudo de reuniones y ventas está conectado solo para {sync?.brand || 'la marca principal'}.
      </Card>
    )
  }

  const cohortMonths = new Set(funnel.filter(f => f.basis === 'cohorte').map(f => f.month))
  const allMonths = [...new Set(funnel.map(f => f.month))].sort()
  const sel = range ? allMonths.filter(m => m >= monthStartOf(range.since) && m <= monthStartOf(range.until)) : allMonths
  const basis = basisPick || (sel.length && sel.every(m => cohortMonths.has(m)) ? 'cohorte' : 'agenda')
  const rows = funnel.filter(f => f.basis === basis && sel.includes(f.month))
  const tot = k => rows.reduce((s, r) => s + Number(r[k] || 0), 0)
  const isOpen = m => m >= monthStartOf(addDays(today, -15))

  // KPIs de costo: solo meses que tienen gasto cargado
  const withSpend = rows.filter(r => spendBy[r.month]?.spend > 0)
  const spend = withSpend.reduce((s, r) => s + spendBy[r.month].spend, 0)
  const messages = rows.reduce((s, r) => s + (spendBy[r.month]?.messages || 0), 0)
  const kSales = basis === 'cohorte' ? 'sales' : 'sales_in_month'
  const salesWithSpend = withSpend.reduce((s, r) => s + Number(r[kSales] || 0), 0)
  const scheduledWithSpend = withSpend.reduce((s, r) => s + Number(r.scheduled || 0), 0)
  const revenueWithSpend = withSpend.reduce((s, r) => s + Number(r.revenue_contracted || 0), 0)
  const revenue = tot('revenue_contracted')
  const ticketBase = basis === 'cohorte' ? tot('sales') : tot('sales_with_amount')

  const top = basis === 'cohorte' ? tot('new_contacts') : messages
  const steps = [
    [basis === 'cohorte' ? 'Escribieron por primera vez' : 'Conversaciones de WhatsApp', top, basis === 'cohorte' ? `${num(messages)} conversaciones en Meta` : 'Meta Ads'],
    ['Agendaron reunión', tot('scheduled'), basis === 'cohorte'
      ? `${pctOf(tot('scheduled'), top)} de quienes escribieron`
      : `${pctOf(scheduledWithSpend, messages)} de las conversaciones${withSpend.length < rows.length ? ' (meses con inversión)' : ''}`],
    ['Asistieron', tot('attended'), `${pctOf(tot('attended'), tot('scheduled'))} de los agendados`],
    ['Aptos', tot('eligible'), `${pctOf(tot('eligible'), tot('attended'))} de los asistentes`],
    ['Contrataron', tot('sales'), `${pctOf(tot('sales'), tot('attended'))} de los asistentes`],
  ]
  const lastDay = sel.length ? (monthEndOf(sel.at(-1)) > today ? today : monthEndOf(sel.at(-1))) : null
  const partial = range && sel.length && (range.since > sel[0] || range.until < lastDay)
  const anyOpen = sel.some(isOpen)

  return (
    <Card className="p-4">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Embudo comercial · de la conversación a la venta</h2>
        <div className="flex rounded-lg border border-border p-0.5 text-xs">
          {Object.entries(BASIS).map(([k, l]) => (
            <button key={k} onClick={() => setBasisPick(k)} className={cx('rounded-md px-3 py-1', basis === k ? 'bg-surface-hover text-foreground' : 'text-foreground-muted hover:text-foreground')}>{l}</button>
          ))}
        </div>
      </div>
      <p className="mb-3 text-xs text-foreground-muted">
        {basis === 'cohorte'
          ? 'Personas nuevas que escribieron por WhatsApp en el período y lo que pasó después con cada una (clientes antiguos excluidos).'
          : 'Reuniones agendadas en el período. Incluye a quienes llegaron por otros canales.'}
        {sel.length > 0 && <> {sel.length === 1 ? monthName(sel[0]) : `${monthName(sel[0])} a ${monthName(sel.at(-1))}`}.</>}
        {anyOpen && <> <Badge color="#F59E0B">en curso: aún pueden cerrar más ventas</Badge></>}
      </p>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-border p-3 text-sm text-foreground-muted">
          No hay datos comerciales {basis === 'cohorte' ? 'por primer contacto ' : ''}para este período.
          {basis === 'cohorte' && sync?.hibot_since && <> Los datos de WhatsApp parten el {dayName(sync.hibot_since)}.</>}
        </p>
      ) : (
        <>
          <FunnelChart steps={steps} />
          <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
            <Mini label="Costo por reunión agendada" value={clp(per(spend, scheduledWithSpend))} sub="inversión / reuniones" />
            <Mini label="Costo por cliente" value={clp(per(spend, salesWithSpend))} sub={basis === 'cohorte' ? 'lo que cuesta en publicidad cada cliente' : 'inversión / ventas cerradas en el período'} />
            <Mini label="Ticket promedio" value={clp(per(revenue, ticketBase))} sub="honorarios contratados por cliente" />
            <Mini label="Retorno de la inversión" value={ratio(revenueWithSpend, spend)} sub={spend ? `por cada $1 en Meta se contrataron $${ratio(revenueWithSpend, spend).replace('×', '')}` : 'sin gasto cargado en estos meses'} />
          </div>
          {(partial || subset || withSpend.length < rows.length) && (
            <ul className="mt-2 space-y-0.5 text-[11px] text-foreground-subtle">
              {partial && <li>· Los datos comerciales son mensuales: se muestran los meses completos.</li>}
              {subset && <li>· El embudo es del total {sync?.brand || ''}: las ventas no se pueden separar por cuenta publicitaria, y los costos usan la inversión de todas sus cuentas.</li>}
              {withSpend.length < rows.length && <li>· Algunos meses no tienen inversión cargada: los costos y el retorno consideran solo los meses con inversión.</li>}
            </ul>
          )}
        </>
      )}

      <FunnelByMonth funnel={funnel} basis={basis} spendBy={spendBy} selected={new Set(sel)} isOpen={isOpen} />

      {sync && (
        <p className="mt-3 text-[11px] text-foreground-subtle">
          Reuniones y ventas: Airtable{sync.airtable_at ? ` (actualizado ${new Date(sync.airtable_at).toLocaleDateString('es-CL')})` : ''}.
          {sync.hibot_since && <> WhatsApp: HiBot, del {dayName(sync.hibot_since)} al {dayName(sync.hibot_until)}.</>}
          {' '}Todavía no es posible saber de qué anuncio viene cada cliente.
        </p>
      )}
    </Card>
  )
}
const per = (a, b) => (a && b ? a / b : null)

function FunnelByMonth({ funnel, basis, spendBy, selected, isOpen }) {
  const rows = funnel.filter(f => f.basis === basis).sort((a, b) => a.month.localeCompare(b.month))
  const kSales = basis === 'cohorte' ? 'sales' : 'sales_in_month'
  const withCac = rows.map(r => ({ ...r, spend: spendBy[r.month]?.spend || null, cac: per(spendBy[r.month]?.spend, r[kSales]) }))
  const colorOf = (r, i) => {
    const ref = median(withCac.slice(Math.max(0, i - 3), i).map(x => x.cac))
    if (!r.cac || !ref) return undefined
    return r.cac < ref ? '#22C55E' : r.cac > ref * 1.2 ? '#EF4444' : undefined
  }
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[720px] text-xs">
        <thead className="text-left text-foreground-muted">
          <tr className="border-b border-border">
            <th className="py-2 pr-2 font-medium">Mes</th>
            <th className="px-2 text-right font-medium">Inversión</th>
            {basis === 'cohorte' && <th className="px-2 text-right font-medium">Nuevos</th>}
            <th className="px-2 text-right font-medium">Agendaron</th>
            <th className="px-2 text-right font-medium">Asistieron</th>
            <th className="px-2 text-right font-medium">Aptos</th>
            <th className="px-2 text-right font-medium">{basis === 'cohorte' ? 'Contrataron' : 'Ventas del mes'}</th>
            <th className="px-2 text-right font-medium">Costo por cliente</th>
            <th className="px-2 text-right font-medium">Contratado</th>
            <th className="pl-2 text-right font-medium">Retorno</th>
          </tr>
        </thead>
        <tbody>
          {withCac.map((r, i) => ({ r, i })).reverse().map(({ r, i }) => (
            <tr key={r.month} className={cx('border-b border-border/60 tabular-nums', !selected.has(r.month) && 'opacity-50')}>
              <td className="py-1.5 pr-2"><span className="capitalize">{monthName(r.month)}</span> {isOpen(r.month) && <Badge color="#F59E0B">en curso</Badge>}</td>
              <td className="px-2 text-right">{r.spend ? clp(r.spend) : '—'}</td>
              {basis === 'cohorte' && <td className="px-2 text-right">{num(r.new_contacts)}</td>}
              <td className="px-2 text-right">{num(r.scheduled)}</td>
              <td className="px-2 text-right">{num(r.attended)}</td>
              <td className="px-2 text-right">{num(r.eligible)}</td>
              <td className="px-2 text-right">{num(r[kSales])}</td>
              <td className="px-2 text-right font-medium" style={{ color: colorOf(r, i) }}>{clp(r.cac)}</td>
              <td className="px-2 text-right">{clp(r.revenue_contracted == null ? null : Number(r.revenue_contracted))}</td>
              <td className="pl-2 text-right">{ratio(Number(r.revenue_contracted), r.spend)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1.5 text-[11px] text-foreground-subtle">Costo por cliente en verde: mejor que la mediana de los 3 meses anteriores; en rojo: más de 20% peor.</p>
    </div>
  )
}

// ── Gráfico funnel: barras centradas, ancho proporcional a la etapa, con la caída entre etapas ──
function FunnelChart({ steps }) {
  const [hover, setHover] = useState(null)
  const top = steps[0]?.[1] || 0
  const w = v => (top ? Math.max(1.2, (v / top) * 100) : 0)
  return (
    <div className="rounded-lg border border-border p-3" onMouseLeave={() => setHover(null)}>
      {steps.map(([label, value, sub], i) => {
        const prev = i > 0 ? steps[i - 1][1] : null
        const lost = prev != null ? prev - value : null
        const active = hover === i
        return (
          <div key={label}>
            {i > 0 && (
              <div className="flex h-3 sm:gap-3">
                <div className="hidden sm:block sm:w-40 sm:shrink-0" />
                <div className="relative h-full flex-1">
                  <div className="absolute inset-0 bg-accent/15" style={{ clipPath: `polygon(${50 - w(prev) / 2}% 0, ${50 + w(prev) / 2}% 0, ${50 + w(value) / 2}% 100%, ${50 - w(value) / 2}% 100%)` }} />
                </div>
                <div className="hidden sm:block sm:w-44 sm:shrink-0" />
              </div>
            )}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3" onMouseEnter={() => setHover(i)}>
              <div className="flex items-baseline justify-between sm:block sm:w-40 sm:shrink-0">
                <p className={cx('text-xs', active ? 'text-foreground' : 'text-foreground-muted')}>{label}</p>
                <p className="text-sm font-semibold tabular-nums sm:hidden">{num(value)}</p>
              </div>
              <div className="relative h-8 w-full shrink-0 sm:w-auto sm:flex-1">
                <div className={cx('absolute top-0 h-full rounded-md transition-colors', active ? 'bg-accent' : 'bg-accent/75')}
                  style={{ left: `${50 - w(value) / 2}%`, width: `${w(value)}%` }} />
                <span className="absolute inset-0 hidden items-center justify-center text-sm font-semibold tabular-nums text-white drop-shadow sm:flex">{num(value)}</span>
              </div>
              <div className="sm:w-44 sm:shrink-0">
                <p className="text-[11px] text-foreground-muted">{sub}</p>
                {active && lost != null && lost > 0 && <p className="text-[11px] text-foreground-subtle">{num(lost)} quedaron en la etapa anterior</p>}
              </div>
            </div>
          </div>
        )
      })}
      <p className="mt-2 text-[11px] text-foreground-subtle">El ancho de cada barra es proporcional a la primera etapa.</p>
    </div>
  )
}

// ── Evolución del embudo (semana o mes) con los cambios hechos en Meta ──
const WEEK_DAYS = 7
const weekLabel = w => `${dayName(w)}`
const bucketKeyOf = (date, gran) => (gran === 'month' ? monthStartOf(date) : weekStartOf(date))
const bucketEnd = (key, gran) => (gran === 'month' ? monthEndOf(key) : addDays(key, WEEK_DAYS - 1))
const EVENT_KIND = {
  campana_nueva: ['Campaña nueva', '#3987e5'],
  pausa: ['Pausa', '#8A8F98'],
  activacion: ['Reactivación', '#8A8F98'],
  presupuesto_sube: ['Sube presupuesto', '#199e70'],
  presupuesto_baja: ['Baja presupuesto', '#d95926'],
  nota: ['Nota', '#8A8F98'],
}

function MiniChart({ title, points, kind = 'line', fmt, hover, setHover, eventsAt, note }) {
  const W = 320, H = 116, padT = 8, padB = 16
  const vals = points.map(p => p.value).filter(v => v != null)
  const max = (Math.max(...vals, 0) || 1) * 1.15
  const n = points.length || 1
  const step = W / n
  const x = i => step * (i + 0.5)
  const y = v => padT + (H - padT - padB) * (1 - v / max)
  const closed = points.map((p, i) => ({ ...p, i })).filter(p => p.value != null && !p.open)
  const openPts = points.map((p, i) => ({ ...p, i })).filter(p => p.value != null && p.open)
  const line = pts => pts.map((p, k) => `${k ? 'L' : 'M'}${x(p.i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const shown = hover != null && points[hover] ? points[hover] : [...points].reverse().find(p => p.value != null && !p.open) || points.at(-1)
  const labelEvery = Math.ceil(n / 6)
  return (
    <div className="min-w-0 rounded-lg border border-border p-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs text-foreground-muted">{title}</p>
        <p className="text-right text-sm font-semibold tabular-nums">
          {shown?.value == null ? '—' : fmt(shown.value)}
          <span className="ml-1 text-[11px] font-normal text-foreground-subtle">{shown?.label}{shown?.open ? ' · en curso' : ''}</span>
        </p>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-1 h-28 w-full overflow-visible" onMouseLeave={() => setHover(null)} role="img" aria-label={title}>
        <line x1="0" x2={W} y1={H - padB} y2={H - padB} stroke="rgba(255,255,255,0.12)" />
        {points.map((p, i) => eventsAt[p.key]?.length ? (
          <line key={`e${p.key}`} x1={x(i)} x2={x(i)} y1={padT - 4} y2={H - padB} stroke="#F59E0B" strokeOpacity="0.45" strokeDasharray="2 3" />
        ) : null)}
        {kind === 'bar' ? points.map((p, i) => p.value == null ? null : (
          <rect key={p.key} x={x(i) - step * 0.32} width={step * 0.64} y={y(p.value)} height={Math.max(1, H - padB - y(p.value))} rx="3"
            fill="var(--color-accent)" fillOpacity={p.open ? 0.35 : hover === i ? 1 : 0.8} />
        )) : (
          <>
            <path d={line(closed)} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinejoin="round" />
            {closed.length > 0 && openPts.length > 0 && <path d={line([closed.at(-1), ...openPts])} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeDasharray="3 4" strokeOpacity="0.6" />}
            {hover != null && points[hover]?.value != null && <circle cx={x(hover)} cy={y(points[hover].value)} r="4.5" fill="var(--color-accent)" stroke="#0a0a0c" strokeWidth="2" />}
          </>
        )}
        {points.map((p, i) => (i % labelEvery === 0 || i === n - 1) && (
          <text key={`l${p.key}`} x={x(i)} y={H - 3} textAnchor="middle" fontSize="9" fill="#8A8F98">{p.label}</text>
        ))}
        {hover != null && <line x1={x(hover)} x2={x(hover)} y1={padT} y2={H - padB} stroke="rgba(255,255,255,0.25)" />}
        {points.map((p, i) => (
          <rect key={`h${p.key}`} x={step * i} width={step} y="0" height={H} fill="transparent" onMouseEnter={() => setHover(i)} />
        ))}
      </svg>
      {note && <p className="text-[10px] text-foreground-subtle">{note}</p>}
    </div>
  )
}

function FunnelEvolution({ weekly, funnel, events, accounts, range, today }) {
  const [gran, setGran] = useState('week')
  const [hover, setHover] = useState(null)
  const accName = Object.fromEntries(accounts.map(a => [a.id, a.name]))
  const src = gran === 'week'
    ? weekly.map(r => ({ ...r, key: r.week }))
    : funnel.filter(f => f.basis === 'cohorte').map(r => ({ ...r, key: r.month }))
  if (!src.length) return null
  // Ventana: lo que toca el filtro de período; si es corto, se muestran al menos 8 períodos para ver la tendencia
  const inRange = r => !range || (bucketEnd(r.key, gran) >= range.since && r.key <= range.until)
  let idx = src.map((r, i) => (inRange(r) ? i : -1)).filter(i => i >= 0)
  if (!idx.length) idx = [src.length - 1]
  const lo = Math.max(0, Math.min(idx[0], idx.at(-1) - 7)), hi = idx.at(-1)
  const rows = src.slice(lo, hi + 1)
  const openCut = addDays(today, -15)
  const mk = f => rows.map(r => ({
    key: r.key,
    label: gran === 'week' ? weekLabel(r.key) : monthName(r.key),
    value: f(r),
    open: bucketEnd(r.key, gran) > openCut,
    inRange: inRange(r),
  }))
  const pct = (a, b) => (b ? (a / b) * 100 : null)
  const fmtPct = v => `${(Math.round(v * 10) / 10).toLocaleString('es-CL')}%`
  const eventsAt = {}
  for (const e of events) {
    const k = bucketKeyOf(e.date, gran)
    if (rows.some(r => r.key === k)) (eventsAt[k] ||= []).push(e)
  }
  const visibleEvents = rows.flatMap(r => eventsAt[r.key] || []).sort((a, b) => b.date.localeCompare(a.date))
  const hoverKey = hover != null ? rows[hover]?.key : null
  const list = hoverKey && eventsAt[hoverKey] ? eventsAt[hoverKey] : visibleEvents
  const share = { hover, setHover, eventsAt }

  return (
    <Card className="p-4">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Evolución del embudo y cambios en las campañas</h2>
        <div className="flex rounded-lg border border-border p-0.5 text-xs">
          {[['week', 'Semana'], ['month', 'Mes']].map(([k, l]) => (
            <button key={k} onClick={() => { setGran(k); setHover(null) }} className={cx('rounded-md px-3 py-1', gran === k ? 'bg-surface-hover text-foreground' : 'text-foreground-muted hover:text-foreground')}>{l}</button>
          ))}
        </div>
      </div>
      <p className="mb-3 text-xs text-foreground-muted">
        Por {gran === 'week' ? 'semana' : 'mes'} del primer mensaje en WhatsApp. Las líneas punteadas verticales marcan cambios en Meta; pasa el mouse para ver el detalle.
        Los períodos de las últimas 2 semanas están <span className="text-foreground">en curso</span>: sus ventas todavía pueden subir.
      </p>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <MiniChart title="Personas nuevas que escribieron" kind="bar" points={mk(r => r.new_contacts)} fmt={num} {...share} />
        <MiniChart title="% que agenda reunión" points={mk(r => pct(r.scheduled, r.new_contacts))} fmt={fmtPct} {...share} />
        <MiniChart title="% que asiste (de los agendados)" points={mk(r => pct(r.attended, r.scheduled))} fmt={fmtPct} {...share} />
        <MiniChart title="% que contrata (de los asistentes)" points={mk(r => pct(r.sales, r.attended))} fmt={fmtPct} {...share} />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <MiniChart title="Clientes nuevos" kind="bar" points={mk(r => r.sales)} fmt={num} {...share} />
        <MiniChart title="Honorarios contratados" kind="bar" points={mk(r => (r.revenue_contracted == null ? null : Number(r.revenue_contracted)))} fmt={clp} {...share} />
      </div>

      <div className="mt-4">
        <h3 className="mb-2 text-xs font-semibold">
          Cambios en Meta {hoverKey && eventsAt[hoverKey] ? `· ${gran === 'week' ? `semana del ${weekLabel(hoverKey)}` : monthName(hoverKey)}` : 'en el período mostrado'}
        </h3>
        {list.length === 0 ? <p className="text-xs text-foreground-muted">Sin cambios registrados en este período.</p> : (
          <ul className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
            {list.map(e => (
              <li key={e.id || `${e.account_id}${e.date}`} className="flex gap-2 text-xs">
                <span className="w-14 shrink-0 tabular-nums text-foreground-muted">{dayName(e.date)}</span>
                <span className="w-28 shrink-0"><Badge color={EVENT_KIND[e.kind]?.[1]}>{EVENT_KIND[e.kind]?.[0] || e.kind}</Badge></span>
                <span className="min-w-0">
                  <span className="text-foreground">{e.title}</span>
                  <span className="text-foreground-subtle"> · {accName[e.account_id] || e.account_id}{e.source === 'inferido' ? ' (según la fecha del primer anuncio)' : ''}</span>
                  {e.detail && <span className="block text-foreground-subtle">{e.detail}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[11px] text-foreground-subtle">
          Cambios leídos del historial de Meta. La cuenta principal todavía no tiene historial disponible por API: de ella solo se ve cuándo partió cada campaña.
          Un cambio cerca de una subida o bajada no prueba que la haya causado.
        </p>
      </div>
    </Card>
  )
}

// ── Inversión por cuenta (barras apiladas) y costo por cliente, mes a mes ──
const ACCOUNT_COLORS = ['#3987e5', '#d95926', '#199e70', '#c98500'] // validados para fondo oscuro (CVD y contraste)
function SpendMixAndCac({ funnel, sync, accounts, monthly, daily, events, range, today }) {
  const [hover, setHover] = useState(null)
  const brandAccounts = accounts.filter(a => a.sync_status === 'ok' && (!sync?.brand || a.brand === sync.brand))
  const ids = new Set(brandAccounts.map(a => a.id))
  const months = [...new Set(monthly.filter(m => ids.has(m.account_id)).map(m => m.month))].sort()
  if (!months.length) return null
  const perAcc = {}
  for (const a of brandAccounts) {
    const s = spendByMonth(monthly, daily, new Set([a.id]))
    perAcc[a.id] = s
  }
  // Orden fijo: cuenta con más inversión total primero (el color sigue a la cuenta, no al ranking del mes)
  const order = brandAccounts.map(a => ({ a, total: months.reduce((s, m) => s + (perAcc[a.id][m]?.spend || 0), 0) }))
    .filter(x => x.total > 0).sort((x, y) => y.total - x.total).map(x => x.a)
  const color = Object.fromEntries(order.map((a, i) => [a.id, ACCOUNT_COLORS[i] || '#8A8F98']))
  const totalOf = m => order.reduce((s, a) => s + (perAcc[a.id][m]?.spend || 0), 0)
  const max = Math.max(...months.map(totalOf), 1)
  const sel = m => !range || (monthEndOf(m) >= range.since && m <= range.until)
  const cohort = Object.fromEntries(funnel.filter(f => f.basis === 'cohorte').map(f => [f.month, f]))
  const agenda = Object.fromEntries(funnel.filter(f => f.basis === 'agenda').map(f => [f.month, f]))
  const cacPoints = months.map(m => {
    const c = cohort[m], s = totalOf(m)
    const v = c ? (c.sales ? s / c.sales : null) : agenda[m]?.sales_in_month ? s / agenda[m].sales_in_month : null
    return { key: m, label: monthName(m), value: v, open: monthEndOf(m) > addDays(today, -15), inRange: sel(m) }
  })
  const eventsAt = {}
  for (const e of events) { const k = monthStartOf(e.date); if (months.includes(k)) (eventsAt[k] ||= []).push(e) }
  const hm = hover != null ? months[hover] : null
  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold">Inversión por cuenta y costo por cliente</h2>
      <p className="mb-3 text-xs text-foreground-muted">Cómo se repartió la inversión entre cuentas cada mes, y cuánto costó cada cliente nuevo en ese mes.</p>
      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-lg border border-border p-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-xs text-foreground-muted">Inversión mensual por cuenta</p>
            <p className="text-sm font-semibold tabular-nums">{clp(totalOf(hm || months.at(-1)))} <span className="text-[11px] font-normal text-foreground-subtle">{monthName(hm || months.at(-1))}</span></p>
          </div>
          <div className="mt-2 flex h-40 items-end gap-2" onMouseLeave={() => setHover(null)}>
            {months.map((m, i) => (
              <div key={m} className={cx('flex h-full flex-1 flex-col justify-end', !sel(m) && 'opacity-40')} onMouseEnter={() => setHover(i)}>
                <div className="flex w-full flex-col-reverse gap-[2px]" style={{ height: `${(totalOf(m) / max) * 100}%` }}>
                  {order.map(a => {
                    const v = perAcc[a.id][m]?.spend || 0
                    if (!v) return null
                    return <div key={a.id} className="w-full first:rounded-b-sm last:rounded-t-[4px]" style={{ flexGrow: v, flexBasis: 0, background: color[a.id], opacity: hover == null || hover === i ? 1 : 0.55 }} title={`${a.name}: ${clp(v)}`} />
                  })}
                </div>
                <span className="mt-1 text-center text-[10px] capitalize text-foreground-muted">{monthName(m)}</span>
              </div>
            ))}
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
            {order.map(a => {
              const v = hm ? perAcc[a.id][hm]?.spend || 0 : null
              return (
                <li key={a.id} className="flex items-center gap-1.5 text-foreground-muted">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: color[a.id] }} />
                  {a.name}{hm && <span className="tabular-nums text-foreground">{clp(v)} ({pctOf(v, totalOf(hm))})</span>}
                </li>
              )
            })}
          </ul>
        </div>
        <MiniChart title="Costo por cliente nuevo" points={cacPoints} fmt={clp} hover={hover} setHover={setHover} eventsAt={eventsAt}
          note="Meses con primer contacto en WhatsApp (desde ago-26) usan cohorte; antes, ventas cerradas en el mes." />
      </div>
    </Card>
  )
}

const KIND = {
  sync: { label: 'Actualización', icon: RefreshCw, color: '#8A8F98' },
  analisis: { label: 'Análisis', icon: Search, color: '#6366F1' },
  recomendacion: { label: 'Recomendación', icon: Lightbulb, color: '#F59E0B' },
  cambio: { label: 'Cambio', icon: Wrench, color: '#22C55E' },
  alerta: { label: 'Alerta', icon: Bell, color: '#EF4444' },
}
const LOG_STATUS = { propuesta: ['Esperando aprobación', '#F59E0B'], aplicada: ['Aplicada', '#22C55E'], descartada: ['Descartada', '#8A8F98'] }

// Bitácora: lo que se analizó, propuso y cambió en las campañas
function OpsLog({ log, accounts }) {
  const accName = Object.fromEntries(accounts.map(a => [a.id, a.name]))
  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold">Bitácora de gestión</h2>
      <p className="mb-3 text-xs text-foreground-muted">Análisis, recomendaciones y cambios hechos en las campañas.</p>
      {log.length === 0 ? <p className="text-sm text-foreground-muted">Sin registros todavía.</p> : (
        <ul className="space-y-3">
          {log.map(e => {
            const k = KIND[e.kind] || KIND.analisis
            const Icon = k.icon
            const st = LOG_STATUS[e.status]
            return (
              <li key={e.id} className="flex gap-3 border-t border-border pt-3 first:border-0 first:pt-0">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ background: `${k.color}22`, color: k.color }}><Icon size={14} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{e.title}</p>
                    {st && <Badge color={st[1]}>{st[0]}</Badge>}
                  </div>
                  {e.detail && <p className="mt-0.5 text-sm text-foreground-muted">{e.detail}</p>}
                  {(e.before_value || e.after_value) && (
                    <p className="mt-0.5 text-xs text-foreground-muted">{e.before_value || '—'} → <span className="text-foreground">{e.after_value || '—'}</span></p>
                  )}
                  <p className="mt-1 text-[11px] text-foreground-subtle">
                    {k.label} · {new Date(e.created_at).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })}
                    {e.account_id && ` · ${accName[e.account_id] || e.account_id}`}{e.entity && ` · ${e.entity}`} · {e.author}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

function Stat({ label, value, sub, small }) {
  return (
    <Card className="min-w-0 p-4">
      <p className="text-xs text-foreground-muted">{label}</p>
      <p className={cx('mt-1 font-semibold tabular-nums', small ? 'line-clamp-2 text-base' : 'text-2xl')}>{value}</p>
      {sub && <p className="text-xs text-foreground-subtle">{sub}</p>}
    </Card>
  )
}
