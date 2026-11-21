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

// Próximo hito de la pieza según su estado: qué hay que hacer, para cuándo y qué tan urgente es.
// level: 'late' (vencido), 'today', 'soon' (≤ 2 días), 'week' (≤ 7 días), 'ok', 'done'
export function nextStep(piece, client) {
  const { materialDue, scheduleDue } = deadlines(piece, client)
  let label, due
  switch (piece.status) {
    case 'idea':
    case 'aprobada':
    case 'en_grabacion':
      label = 'Subir material'; due = materialDue; break
    case 'material_por_revisar':
      label = 'Revisar material'; due = materialDue; break
    case 'material_completo':
    case 'en_edicion':
    case 'editada':
      label = 'Editar y programar'; due = scheduleDue; break
    case 'programada':
      label = 'Se publica'; due = piece.publish_date; break
    default:
      return { label: piece.status === 'publicada' ? 'Publicada' : 'Descartada', due: null, days: null, level: 'done' }
  }
  if (!due) return { label, due: null, days: null, level: 'ok' }
  const days = daysUntil(due)
  // Una pieza programada no está "atrasada": solo indica cuándo sale
  const level = piece.status === 'programada'
    ? (days <= 0 ? 'today' : 'ok')
    : days < 0 ? 'late' : days === 0 ? 'today' : days <= 2 ? 'soon' : days <= 7 ? 'week' : 'ok'
  return { label, due, days, level }
}

export function countdown(days) {
  if (days == null) return ''
  if (days === 0) return 'hoy'
  if (days === 1) return 'mañana'
  if (days === -1) return 'venció ayer'
  return days > 0 ? `faltan ${days} días` : `atrasada ${-days} días`
}

const WEEKDAYS_LONG = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export function dateParts(s) {
  const d = parseISODate(s)
  if (!d) return null
  return { day: d.getDate(), weekday: WEEKDAYS_LONG[d.getDay()], month: MONTHS_SHORT[d.getMonth()] }
}

// Lunes de la semana de una fecha (para agrupar la grilla por semana)
export function weekStart(s) {
  const d = parseISODate(s)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return toISODate(d)
}
