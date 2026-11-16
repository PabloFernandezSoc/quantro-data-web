import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Lock, CheckCircle2, ChevronRight, ArrowUpDown, RefreshCw, Search, Lightbulb, Wrench, Bell } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { q } from '../lib/api'
import { useStudio } from '../lib/store'
import { Card, PageHeader, Spinner, ErrorNote, Select, Badge, cx } from '../components/ui'

const clp = n => n == null ? '—' : new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)
const num = n => n == null ? '—' : new Intl.NumberFormat('es-CL').format(n)
const monthName = iso => new Date(`${iso}T12:00:00`).toLocaleDateString('es-CL', { month: 'short', year: '2-digit' })
const cpm = (spend, msgs) => msgs > 0 ? spend / msgs : null

const SYNC = {
  ok: { label: 'Sincronizada', color: '#22C55E', icon: CheckCircle2 },
  sin_acceso: { label: 'Sin acceso API', color: '#F59E0B', icon: Lock },
  bloqueada: { label: 'Bloqueada', color: '#EF4444', icon: AlertTriangle },
}
const OBJECTIVE = { mensajes: 'WhatsApp', trafico: 'Tráfico', web: 'Web' }
const STATUS_LABEL = { ACTIVE: 'Activo', PAUSED: 'Pausado', ARCHIVED: 'Archivado', CAMPAIGN_PAUSED: 'Campaña pausada', ADSET_PAUSED: 'Conjunto pausado', WITH_ISSUES: 'Con problemas', NOT_DELIVERING: 'Sin entrega', INACTIVE: 'Inactivo', DELETED: 'Eliminado' }

// Publicidad: inversión en Meta Ads por cliente y qué videos traen conversaciones
export default function Ads() {
  const { adsClients: clients, clientId: lastClientId, setClientId } = useStudio()
  const clientId = clients.some(c => c.id === lastClientId) ? lastClientId : clients[0]?.id || ''
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [brand, setBrand] = useState('all')
  const [sortBy, setSortBy] = useState('messages')
  const [objective, setObjective] = useState('mensajes')

  useEffect(() => {
    let alive = true
    setData(null)
    ;(async () => {
      try {
        const accounts = await q(supabase.from('ad_accounts').select('*').eq('client_id', clientId).order('name'))
        const ids = accounts.map(a => a.id)
        const [monthly, ads, log] = await Promise.all([
          ids.length ? q(supabase.from('ad_monthly').select('*').in('account_id', ids).order('month')) : [],
          ids.length ? q(supabase.from('ad_ads').select('*').in('account_id', ids)) : [],
          q(supabase.from('ad_ops_log').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(30)),
        ])
        if (alive) { setData({ accounts, monthly, ads, log }); setError(null) }
      } catch (e) {
        if (alive) setError(e.message)
      }
    })()
    return () => { alive = false }
  }, [clientId])

  const view = useMemo(() => {
    if (!data) return null
    const accounts = data.accounts.filter(a => brand === 'all' || a.brand === brand)
    const accById = Object.fromEntries(accounts.map(a => [a.id, a]))
    const monthly = data.monthly.filter(m => accById[m.account_id])
    const ads = data.ads.filter(a => accById[a.account_id])

    const spend = ads.reduce((s, a) => s + Number(a.spend), 0)
    const messages = ads.reduce((s, a) => s + a.messages, 0)
    const msgSpend = ads.filter(a => a.objective === 'mensajes').reduce((s, a) => s + Number(a.spend), 0)
    const msgMessages = ads.filter(a => a.objective === 'mensajes').reduce((s, a) => s + a.messages, 0)

    const byMonth = {}
    for (const m of monthly) {
      const r = (byMonth[m.month] ||= { month: m.month, spend: 0, messages: 0 })
      r.spend += Number(m.spend)
      r.messages += m.messages
    }
    const months = Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month))

    const perAccount = accounts.map(a => {
      const rows = ads.filter(x => x.account_id === a.id)
      return { ...a, spend: rows.reduce((s, x) => s + Number(x.spend), 0), messages: rows.reduce((s, x) => s + x.messages, 0), active: rows.filter(x => x.status === 'ACTIVE').length }
    })

    const sorted = ads
      .filter(a => objective === 'all' || a.objective === objective)
      .map(a => ({ ...a, spend: Number(a.spend), cost: cpm(Number(a.spend), a.messages), account: accById[a.account_id] }))
      .sort((a, b) => sortBy === 'cost'
        ? (a.messages >= 20 ? a.cost : Infinity) - (b.messages >= 20 ? b.cost : Infinity)
        : b[sortBy] - a[sortBy])

    // Gasto en anuncios activos que no traen conversaciones (alerta para el admin y el cliente)
    const leaks = ads.filter(a => a.status === 'ACTIVE' && a.objective !== 'mensajes' && Number(a.spend) > 50000)

    const withMonths = new Set(monthly.map(m => m.account_id))
    const noMonthly = perAccount.filter(a => a.sync_status === 'ok' && a.spend > 0 && !withMonths.has(a.id))

    return { accounts: perAccount, months, noMonthly, ads: sorted, spend, messages, msgSpend, msgMessages, leaks, top: [...ads].sort((a, b) => b.messages - a.messages)[0] }
  }, [data, brand, sortBy, objective])

  const brands = useMemo(() => [...new Set((data?.accounts || []).map(a => a.brand).filter(Boolean))], [data])
  const pending = view?.accounts.filter(a => a.sync_status !== 'ok') || []
  const lastSync = data?.accounts.map(a => a.synced_at).filter(Boolean).sort().at(-1)

  return (
    <div>
      <PageHeader title="Publicidad" subtitle={lastSync ? `Meta Ads · actualizado ${new Date(lastSync).toLocaleDateString('es-CL')}` : 'Meta Ads'}>
        {clients.length > 1 && (
          <Select value={clientId} onChange={e => setClientId(e.target.value)} className="w-auto!">
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        )}
        {brands.length > 1 && (
          <Select value={brand} onChange={e => setBrand(e.target.value)} className="w-auto!">
            <option value="all">Todas las marcas</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </Select>
        )}
      </PageHeader>
      <ErrorNote>{error}</ErrorNote>
      {!view ? <Spinner /> : data.accounts.length === 0 ? (
        <Card className="p-6 text-sm text-foreground-muted">Este cliente todavía no tiene cuentas publicitarias conectadas.</Card>
      ) : (
        <div className="space-y-4">
          {pending.length > 0 && (
            <Card className="border-amber/40 p-4 text-sm">
              <p className="flex items-center gap-2 font-medium"><AlertTriangle size={15} className="text-amber" /> Los totales no incluyen {pending.length === 1 ? 'una cuenta' : `${pending.length} cuentas`}</p>
              <ul className="mt-1.5 space-y-0.5 text-foreground-muted">
                {pending.map(a => <li key={a.id}>· <span className="text-foreground">{a.name}</span>: {a.sync_note}</li>)}
              </ul>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Inversión acumulada" value={clp(view.spend)} sub="cuentas sincronizadas" />
            <Stat label="Conversaciones de WhatsApp" value={num(view.messages)} sub="iniciadas desde anuncios" />
            <Stat label="Costo por conversación" value={clp(cpm(view.msgSpend, view.msgMessages))} sub="solo campañas de mensajes" />
            <Stat label="Mejor video" value={view.top?.name || '—'} sub={view.top ? `${num(view.top.messages)} conversaciones` : ''} small />
          </div>

          {view.leaks.length > 0 && (
            <Card className="border-red/40 p-4 text-sm">
              <p className="flex items-center gap-2 font-medium"><AlertTriangle size={15} className="text-red" /> Anuncios activos que gastan sin traer conversaciones</p>
              <p className="mt-1 text-foreground-muted">
                {view.leaks.length === 1 ? '1 anuncio de tráfico activo acumula' : `${view.leaks.length} anuncios de tráfico activos acumulan`} {clp(view.leaks.reduce((s, a) => s + Number(a.spend), 0))} con{' '}
                {num(view.leaks.reduce((s, a) => s + a.messages, 0))} conversaciones. Conviene pasarlos a campaña de mensajes o pausarlos.
              </p>
            </Card>
          )}

          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">Inversión y conversaciones por mes</h2>
            <MonthChart months={view.months} />
            {view.noMonthly.length > 0 && (
              <p className="mt-2 text-xs text-foreground-subtle">
                No incluye {view.noMonthly.map(a => a.name).join(', ')} ({clp(view.noMonthly.reduce((s, a) => s + a.spend, 0))}): falta su desglose mensual.
              </p>
            )}
          </Card>

          <Explorer accounts={view.accounts} ads={data.ads.filter(a => view.accounts.some(x => x.id === a.account_id))} />

          <Card className="p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Ranking de videos · todas las cuentas</h2>
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
            <AdsTable ads={view.ads} totalSpend={view.spend} />
          </Card>

          <FunnelPreview messages={view.messages} />

          <OpsLog log={data.log} accounts={data.accounts} />
        </div>
      )}
    </div>
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
function Explorer({ accounts, ads }) {
  const [accountId, setAccountId] = useState(null)
  const [campaign, setCampaign] = useState(null)
  const [sort, setSort] = useState({ key: 'spend', dir: -1 })
  const total = sumBy(ads, 'spend')
  const account = accounts.find(a => a.id === accountId)

  const level = !account ? 'account' : !campaign ? 'campaign' : 'ad'
  let rows
  if (level === 'account') {
    rows = accounts.map(a => {
      const r = ads.filter(x => x.account_id === a.id)
      return { key: a.id, name: a.name, sub: `${a.brand} · ${a.id}`, badge: SYNC[a.sync_status], ok: a.sync_status === 'ok' && r.length > 0,
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
              {level === 'ad' && <Th k="thruplays">ThruPlays</Th>}
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
                {level === 'ad' && <td className="text-right tabular-nums">{num(r.thruplays)}</td>}
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
              {level === 'ad' && <td className="text-right tabular-nums">{num(levelTotal.thruplays)}</td>}
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

function MonthChart({ months }) {
  if (!months.length) return <p className="text-sm text-foreground-muted">Sin datos mensuales.</p>
  const max = Math.max(...months.map(m => m.spend), 1)
  return (
    <div className="flex items-end gap-2 overflow-x-auto pb-1">
      {months.map(m => (
        <div key={m.month} className="flex min-w-16 flex-1 flex-col items-center gap-1">
          <span className="text-[11px] tabular-nums text-foreground-muted">{m.spend ? `$${(m.spend / 1e6).toFixed(1)}M` : '$0'}</span>
          <div className="flex h-40 w-full items-end">
            <div className="w-full rounded-t-md bg-accent" style={{ height: `${Math.max(2, (m.spend / max) * 100)}%` }} title={clp(m.spend)} />
          </div>
          <span className="text-xs font-medium capitalize">{monthName(m.month)}</span>
          <span className="text-[11px] tabular-nums text-foreground-subtle">{num(m.messages)} conv.</span>
          <span className="text-[11px] tabular-nums text-foreground-subtle">{clp(cpm(m.spend, m.messages))}</span>
        </div>
      ))}
    </div>
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
