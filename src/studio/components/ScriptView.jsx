import { useMemo, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { parseScript, speakersOf, matchSpeaker, speakerColor } from '../lib/script'
import { useStudio } from '../lib/store'
import { cx } from './ui'

// Guion en modo lectura: cada línea con su hablante, filtro por persona y tamaño de letra
// defaultPersonId fija a quién se destaca al abrir; si no viene, se destaca a quien mira (si habla en el guion)
export default function ScriptView({ script, clientId, defaultPersonId, defaultHideOthers = false }) {
  const { userId, assignableFor, personById } = useStudio()
  const blocks = useMemo(() => parseScript(script), [script])
  const speakers = useMemo(() => speakersOf(blocks), [blocks])
  const people = assignableFor(clientId)
  const speakerPerson = useMemo(
    () => Object.fromEntries(speakers.map(s => [s, matchSpeaker(s, people)])),
    [speakers, people],
  )
  const target = defaultPersonId === undefined ? userId : defaultPersonId
  const [focus, setFocus] = useState(() => speakers.find(s => target && speakerPerson[s]?.id === target) || null)
  const [hideOthers, setHideOthers] = useState(defaultHideOthers)
  const [size, setSize] = useState(17)

  if (!script?.trim()) return <p className="text-sm text-foreground-muted">Esta pieza no tiene guion.</p>

  const count = s => blocks.filter(b => b.type === 'line' && b.speaker === s).length

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {speakers.length > 0 && (
          <>
            <Chip active={!focus} onClick={() => setFocus(null)}>Todo el guion</Chip>
            {speakers.map(s => {
              const person = speakerPerson[s]
              return (
                <Chip key={s} active={focus === s} color={speakerColor(s, speakers)} onClick={() => setFocus(s)}>
                  {person ? person.full_name : s}{person?.id === userId && ' (tú)'} · {count(s)}
                </Chip>
              )
            })}
          </>
        )}
        <div className="ml-auto flex items-center gap-1">
          {focus && (
            <label className="mr-2 flex items-center gap-1.5 text-xs text-foreground-muted">
              <input type="checkbox" checked={hideOthers} onChange={e => setHideOthers(e.target.checked)} />
              Ocultar las demás
            </label>
          )}
          <button className="rounded-md border border-border p-1.5 text-foreground-muted hover:text-foreground" onClick={() => setSize(s => Math.max(13, s - 2))} aria-label="Achicar letra"><Minus size={14} /></button>
          <button className="rounded-md border border-border p-1.5 text-foreground-muted hover:text-foreground" onClick={() => setSize(s => Math.min(28, s + 2))} aria-label="Agrandar letra"><Plus size={14} /></button>
        </div>
      </div>

      <div className="space-y-3" style={{ fontSize: size }}>
        {blocks.map((b, i) => {
          if (b.type === 'cue') {
            return <p key={i} className="text-[0.7em] font-semibold uppercase tracking-wide text-foreground-subtle">{b.text}</p>
          }
          if (b.type === 'text') {
            if (focus && hideOthers) return null
            return <p key={i} className={cx('whitespace-pre-wrap leading-relaxed', focus ? 'text-foreground-subtle' : 'text-foreground-muted')}>{b.text}</p>
          }
          const mine = !focus || b.speaker === focus
          if (!mine && hideOthers) return null
          const color = speakerColor(b.speaker, speakers)
          const person = speakerPerson[b.speaker]
          return (
            <div
              key={i}
              className={cx('rounded-lg border-l-4 py-1.5 pl-3 transition-opacity', mine ? 'bg-surface' : 'opacity-40')}
              style={{ borderColor: color }}
            >
              <p className="text-[0.65em] font-semibold uppercase tracking-wide" style={{ color }}>
                {person ? (personById[person.id]?.full_name || person.full_name) : b.speaker}
                {b.direction && <span className="ml-1.5 font-normal normal-case text-foreground-muted">({b.direction})</span>}
              </p>
              <p className="whitespace-pre-wrap leading-relaxed">{b.text}</p>
            </div>
          )
        })}
      </div>

      {speakers.some(s => !speakerPerson[s]) && (
        <p className="mt-3 text-xs text-foreground-subtle">
          Sin usuario asignado: {speakers.filter(s => !speakerPerson[s]).join(', ')}. Se asignan por alias, primer nombre o iniciales (Administración → Usuarios).
        </p>
      )}
    </div>
  )
}

function Chip({ active, color = '#8A8F98', onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={cx('rounded-full border px-3 py-1 text-xs font-medium transition-colors', active ? 'text-foreground' : 'border-border text-foreground-muted hover:text-foreground')}
      style={active ? { borderColor: color, background: `${color}22` } : undefined}
    >
      {children}
    </button>
  )
}
