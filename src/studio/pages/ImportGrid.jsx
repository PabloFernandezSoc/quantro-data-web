import { useMemo, useState } from 'react'
import { ClipboardPaste } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { q } from '../lib/api'
import { useStudio, navigate } from '../lib/store'
import { FORMATS } from '../lib/constants'
import { parseLooseDate, shortDate, monthLabel } from '../lib/dates'
import { Button, Card, PageHeader, Textarea, Select, ErrorNote, Empty } from '../components/ui'
import { ClientPicker, MonthPicker } from '../components/Pickers'

// Campos de la pieza que se pueden mapear desde columnas del Sheet
const TARGETS = [
  { key: '', label: '— ignorar —' },
  { key: 'number', label: 'N°', match: /^(n[°º]?|#|nro|num|número|pieza)$/i },
  { key: 'publish_date', label: 'Fecha publicación', match: /fecha|día|dia|publica/i },
  { key: 'format', label: 'Formato', match: /formato|tipo/i },
  { key: 'pillar', label: 'Pilar / temática', match: /pilar|tem[aá]|categor/i },
  { key: 'title', label: 'Título / idea', match: /t[ií]tulo|idea|concepto|nombre/i },
  { key: 'hook', label: 'Gancho', match: /gancho|hook/i },
  { key: 'script', label: 'Guion / descripción', match: /gui[oó]n|descrip|desarrollo|estructura/i },
  { key: 'caption', label: 'Copy', match: /copy|caption|texto/i },
  { key: 'faces', label: 'Rostros (crea partes)', match: /rostro|talento|qui[eé]n|aparece|protagon/i },
  { key: 'notes', label: 'Notas', match: /nota|observ|comentario|referencia/i },
]

// Parser TSV que respeta celdas entre comillas con saltos de línea (como copia Google Sheets)
function parseTSV(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"' && cell === '') quoted = true
    else if (ch === '\t') { row.push(cell); cell = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell); rows.push(row); row = []; cell = ''
    } else cell += ch
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows.filter(r => r.some(c => c.trim()))
}

function guessFormat(raw) {
  const s = String(raw || '').toLowerCase()
  return FORMATS.find(f => s.includes(f.key) || s.includes(f.label.toLowerCase()))?.key || 'reel'
}

export default function ImportGrid() {
  const { client, canEdit, month, assignableFor } = useStudio()
  const [text, setText] = useState('')
  const [mapping, setMapping] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(null)

  const rows = useMemo(() => parseTSV(text), [text])
  const headers = rows[0] || []
  const body = rows.slice(1)
  const people = client ? assignableFor(client.id) : []

  // Mapeo automático por nombre de columna (editable)
  const autoMapping = useMemo(() => headers.map(h => {
    const t = TARGETS.find(t => t.match?.test(h.trim()))
    return t?.key || ''
  }), [headers])
  const map = mapping && mapping.length === headers.length ? mapping : autoMapping

  const matchPeople = raw => String(raw || '')
    .split(/\s*(?:,|\/|&|\+|\by\b)\s*/i)
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
    .map(name => people.find(p => p.full_name.toLowerCase().split(' ')[0] === name || p.full_name.toLowerCase() === name))
    .filter(Boolean)

  const preview = body.map(r => {
    const obj = {}
    map.forEach((k, i) => { if (k) obj[k] = (r[i] || '').trim() })
    return {
      number: obj.number ? parseInt(obj.number, 10) || null : null,
      publish_date: parseLooseDate(obj.publish_date, month),
      format: guessFormat(obj.format),
      pillar: obj.pillar || null,
      title: obj.title || obj.hook || 'Sin título',
      hook: obj.hook || null,
      script: obj.script || null,
      caption: obj.caption || null,
      notes: obj.notes || null,
      faces: matchPeople(obj.faces),
      facesRaw: obj.faces || '',
    }
  })

  const run = async () => {
    setBusy(true)
    setError(null)
    try {
      let grid = await q(supabase.from('grids').select('*').eq('client_id', client.id).eq('month', month).maybeSingle())
      if (!grid) grid = await q(supabase.from('grids').insert({ client_id: client.id, month }).select().single())
      const inserted = await q(supabase.from('pieces').insert(
        preview.map(({ faces, facesRaw, ...p }) => ({ ...p, grid_id: grid.id })),
      ).select('id'))
      const parts = inserted.flatMap((p, i) => preview[i].faces.map(person => ({
        piece_id: p.id, assignee_id: person.id, description: 'Su parte del video',
      })))
      if (parts.length) await q(supabase.from('piece_parts').insert(parts))
      setDone({ pieces: inserted.length, parts: parts.length })
      setText('')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (client && !canEdit(client.id)) return <Empty title="Sin permiso">Solo edición puede importar grillas.</Empty>

  return (
    <div>
      <PageHeader title="Importar grilla desde Sheets" subtitle={client ? `${client.name} · ${monthLabel(month)}` : ''}>
        <ClientPicker />
        <MonthPicker />
      </PageHeader>

      {done ? (
        <Card className="p-6 text-center">
          <p className="font-medium">Listo: {done.pieces} piezas y {done.parts} partes creadas.</p>
          <div className="mt-3 flex justify-center gap-2">
            <Button onClick={() => navigate('/app/grilla')}>Ver grilla</Button>
            <Button variant="outline" onClick={() => setDone(null)}>Importar otra</Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="p-4">
            <p className="mb-2 text-sm text-foreground-muted">
              En el Sheet selecciona la tabla <strong>incluyendo la fila de encabezados</strong>, copia (Ctrl/Cmd + C) y pega acá.
              La columna de rostros (ej. “JT, Jimmy”) crea una parte pendiente para cada persona, usando su primer nombre.
            </p>
            <Textarea value={text} onChange={e => { setText(e.target.value); setMapping(null) }} placeholder="Pega aquí las celdas copiadas…" className="min-h-32 font-mono text-xs" />
          </Card>

          {headers.length > 0 && (
            <Card className="p-4">
              <h2 className="mb-3 text-sm font-semibold">Columnas</h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {headers.map((h, i) => (
                  <label key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-32 truncate text-foreground-muted" title={h}>{h || `Columna ${i + 1}`}</span>
                    <Select value={map[i]} onChange={e => setMapping(map.map((v, j) => j === i ? e.target.value : v))} className="h-8 py-0 text-xs">
                      {TARGETS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                    </Select>
                  </label>
                ))}
              </div>
            </Card>
          )}

          {preview.length > 0 && (
            <Card className="p-4">
              <h2 className="mb-3 text-sm font-semibold">Vista previa ({preview.length} piezas)</h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead className="text-foreground-muted">
                    <tr><th className="p-1.5">N°</th><th className="p-1.5">Fecha</th><th className="p-1.5">Formato</th><th className="p-1.5">Título</th><th className="p-1.5">Rostros</th></tr>
                  </thead>
                  <tbody>
                    {preview.map((p, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="p-1.5">{p.number}</td>
                        <td className="p-1.5">{p.publish_date ? shortDate(p.publish_date) : <span className="text-amber">sin fecha</span>}</td>
                        <td className="p-1.5">{p.format}</td>
                        <td className="p-1.5">{p.title}</td>
                        <td className="p-1.5">
                          {p.faces.map(f => f.full_name).join(', ')}
                          {p.facesRaw && p.faces.length === 0 && <span className="text-amber">“{p.facesRaw}” no calza con ningún usuario</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ErrorNote>{error}</ErrorNote>
              <Button className="mt-3" onClick={run} loading={busy}><ClipboardPaste size={16} /> Importar {preview.length} piezas</Button>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
