// Catálogos compartidos de Quantro Studio (deben calzar con los CHECK de la base)

export const STATUSES = [
  { key: 'idea',                 label: 'Idea',                 color: '#8A8F98' },
  { key: 'aprobada',             label: 'Aprobada',             color: '#38BDF8' },
  { key: 'en_grabacion',         label: 'En grabación',         color: '#F59E0B' },
  { key: 'material_por_revisar', label: 'Material por revisar', color: '#F97316' },
  { key: 'material_completo',    label: 'Material completo',    color: '#A78BFA' },
  { key: 'en_edicion',           label: 'En edición',           color: '#8B5CF6' },
  { key: 'editada',              label: 'Editada',              color: '#6366F1' },
  { key: 'programada',           label: 'Programada',           color: '#14B8A6' },
  { key: 'publicada',            label: 'Publicada',            color: '#22C55E' },
  { key: 'descartada',           label: 'Descartada',           color: '#4A505A' },
]
export const STATUS = Object.fromEntries(STATUSES.map(s => [s.key, s]))

// Estados en los que todavía falta material en bruto
export const PRE_MATERIAL = ['idea', 'aprobada', 'en_grabacion']
// Estados en los que la pieza ya no necesita seguimiento de plazos
export const CLOSED = ['programada', 'publicada', 'descartada']

export const FORMATS = [
  { key: 'reel', label: 'Reel' },
  { key: 'carrusel', label: 'Carrusel' },
  { key: 'historia', label: 'Historia' },
  { key: 'post', label: 'Post' },
]

export const CAMPAIGNS = [
  { key: 'organico', label: 'Solo orgánico' },
  { key: 'visitas_perfil', label: 'Visitas al perfil' },
  { key: 'whatsapp', label: 'Mensajes a WhatsApp' },
  { key: 'web', label: 'Tráfico web' },
]

export const ROLES = [
  { key: 'editor', label: 'Edición', hint: 'Edita piezas y confirma material' },
  { key: 'talent', label: 'Rostro', hint: 'Ve la grilla y sube sus partes' },
  { key: 'client', label: 'Cliente', hint: 'Ve la grilla, sube material y comenta' },
]

export const GRID_STATUSES = [
  { key: 'borrador', label: 'Borrador' },
  { key: 'en_revision', label: 'En revisión con cliente' },
  { key: 'aprobada', label: 'Aprobada' },
]

export const PART_STATUS = {
  pendiente: { label: 'Pendiente', color: '#F59E0B' },
  subido: { label: 'Subido', color: '#22C55E' },
  rechazado: { label: 'Falta / rehacer', color: '#EF4444' },
}
