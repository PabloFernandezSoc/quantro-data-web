// Guiones: separa el texto en líneas por hablante ("JIMMY: ...", "JT (aparece en cuadro): ...")
// y las cruza con las personas de la app (alias, primer nombre o iniciales).

const SPEAKER_RE = /^([A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ .]{0,24}?)\s*(\([^)]*\))?\s*:\s*(.*)$/

export function normalize(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '')
}

// Bloques: { type: 'cue' } para indicaciones tipo [HOOK 0-3s], { type: 'line', speaker, direction, text }
// para diálogos y { type: 'text' } para el resto (texto de láminas, notas sueltas)
export function parseScript(script) {
  const blocks = []
  let current = null
  for (const raw of String(script || '').split('\n')) {
    const line = raw.trim()
    if (!line) { current = null; continue }
    if (/^\[.*\]$/.test(line)) {
      blocks.push({ type: 'cue', text: line.slice(1, -1) })
      current = null
      continue
    }
    const m = line.match(SPEAKER_RE)
    if (m && /[A-Z]/.test(m[1]) && m[1] === m[1].toUpperCase()) {
      current = { type: 'line', speaker: m[1].trim(), direction: m[2]?.slice(1, -1) || null, text: m[3] }
      blocks.push(current)
      continue
    }
    // Línea sin rótulo justo después de un diálogo: continúa lo que dice esa persona
    if (current) current.text += (current.text ? '\n' : '') + line
    else blocks.push({ type: 'text', text: line })
  }
  return blocks
}

export function speakersOf(blocks) {
  return [...new Set(blocks.filter(b => b.type === 'line').map(b => b.speaker))]
}

// Claves con que una persona puede aparecer en un guion
export function personKeys(person) {
  if (!person) return []
  const words = String(person.full_name || '').split(/\s+/).filter(Boolean)
  const keys = [person.alias, words[0], words.map(w => w[0]).join(''), person.full_name]
  return [...new Set(keys.map(normalize).filter(Boolean))]
}

export function matchSpeaker(speaker, people) {
  const key = normalize(speaker)
  return people.find(p => personKeys(p).includes(key)) || null
}

const PALETTE = ['#38BDF8', '#F59E0B', '#A78BFA', '#22C55E', '#F472B6', '#14B8A6']

// Color fijo por hablante (mismo color en todas las piezas)
export function speakerColor(speaker) {
  let hash = 0
  for (const ch of normalize(speaker)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return PALETTE[hash % PALETTE.length]
}
