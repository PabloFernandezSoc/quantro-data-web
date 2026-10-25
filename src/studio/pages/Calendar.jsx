import { useStudio, openPiece } from '../lib/store'
import { useGrid } from '../lib/useGrid'
import { STATUS } from '../lib/constants'
import { parseISODate, toISODate, today, monthLabel } from '../lib/dates'
import { PageHeader, Spinner, ErrorNote, cx } from '../components/ui'
import { ClientPicker, MonthPicker } from '../components/Pickers'

const WEEK = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export default function Calendar() {
  const { client, month } = useStudio()
  const { pieces, loading, error } = useGrid()

  const first = parseISODate(month)
  const offset = (first.getDay() + 6) % 7 // semana parte el lunes
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  const cells = Array.from({ length: Math.ceil((offset + daysInMonth) / 7) * 7 }, (_, i) => {
    const day = i - offset + 1
    return day >= 1 && day <= daysInMonth ? toISODate(new Date(first.getFullYear(), first.getMonth(), day)) : null
  })
  const byDate = {}
  for (const p of pieces) if (p.publish_date) (byDate[p.publish_date] ||= []).push(p)
  const unscheduled = pieces.filter(p => !p.publish_date)
  const now = today()

  return (
    <div>
      <PageHeader title="Calendario" subtitle={client ? `${client.name} · ${monthLabel(month)}` : ''}>
        <ClientPicker />
        <MonthPicker />
      </PageHeader>
      <ErrorNote>{error}</ErrorNote>
      {loading ? <Spinner /> : (
        <>
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-border bg-border text-xs">
            {WEEK.map(d => <div key={d} className="bg-bg-elevated px-2 py-1.5 font-medium text-foreground-muted">{d}</div>)}
            {cells.map((date, i) => (
              <div key={i} className={cx('min-h-24 bg-bg-base p-1', !date && 'bg-bg-deep')}>
                {date && (
                  <>
                    <div className={cx('mb-1 px-1 text-[11px]', date === now ? 'font-bold text-accent' : 'text-foreground-subtle')}>
                      {parseISODate(date).getDate()}
                    </div>
                    <div className="space-y-1">
                      {(byDate[date] || []).map(p => (
                        <button
                          key={p.id}
                          onClick={() => openPiece(p.id)}
                          className="block w-full truncate rounded px-1.5 py-1 text-left text-[11px] leading-tight"
                          style={{ background: `${STATUS[p.status]?.color}26`, color: STATUS[p.status]?.color }}
                          title={`${p.title} · ${STATUS[p.status]?.label}`}
                        >
                          {p.number ? `${p.number}. ` : ''}{p.title}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          {unscheduled.length > 0 && (
            <p className="mt-3 text-sm text-foreground-muted">
              Sin fecha: {unscheduled.map(p => p.title).join(', ')}
            </p>
          )}
        </>
      )}
    </div>
  )
}
