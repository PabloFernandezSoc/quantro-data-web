// Fechas como 'YYYY-MM-DD' (columnas date de Postgres), siempre en hora local

export function toISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISODate(s) {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(s, n) {
  const d = parseISODate(s)
  if (!d) return null
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

export function today() {
  return toISODate(new Date())
}

export function daysUntil(s) {
  const d = parseISODate(s)
  if (!d) return null
  const t = parseISODate(today())
  return Math.round((d - t) / 86400000)
}

export function monthStart(s = today()) {
  return s.slice(0, 7) + '-01'
}

export function shiftMonth(s, n) {
  const d = parseISODate(monthStart(s))
  d.setMonth(d.getMonth() + n)
  return toISODate(d)
}

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const WEEKDAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

export function monthLabel(s) {
  const d = parseISODate(s)
  return d ? `${MONTHS[d.getMonth()]} ${d.getFullYear()}` : ''
}

export function shortDate(s) {
  const d = parseISODate(s)
  return d ? `${WEEKDAYS[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}` : '—'
}

// Plazos calculados hacia atrás desde la publicación (misma lógica que la vista piece_deadlines)
export function deadlines(piece, client) {
  if (!piece?.publish_date || !client) return { materialDue: null, scheduleDue: null }
  const scheduleDue = addDays(piece.publish_date, -client.schedule_buffer_days)
  const materialDue = addDays(scheduleDue, -client.edit_buffer_days)
  return { materialDue, scheduleDue }
}

// Semáforo: 'late' (vencido), 'soon' (≤ 2 días), 'ok'
export function urgency(due) {
  const n = daysUntil(due)
  if (n == null) return null
  if (n < 0) return 'late'
  if (n <= 2) return 'soon'
  return 'ok'
}

export function relativeDays(due) {
  const n = daysUntil(due)
  if (n == null) return 'sin fecha'
  if (n === 0) return 'hoy'
  if (n === 1) return 'mañana'
  if (n === -1) return 'ayer'
  return n > 0 ? `en ${n} días` : `hace ${-n} días`
}

// Acepta 2026-11-04, 04/11/2026, 4-11-26, 4/11 (usa el año de referencia)
export function parseLooseDate(raw, refMonth) {
  const s = String(raw || '').trim()
  if (!s) return null
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m) return toISODate(new Date(+m[1], +m[2] - 1, +m[3]))
  m = s.match(/(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?/)
  if (m) {
    let y = m[3] ? +m[3] : parseISODate(refMonth || today()).getFullYear()
    if (y < 100) y += 2000
    return toISODate(new Date(y, +m[2] - 1, +m[1]))
  }
  return null
}
