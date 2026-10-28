import { useMemo, useState } from 'react'
import { BookOpenText } from 'lucide-react'
import { useStudio, openPiece } from '../lib/store'
import { useGrid } from '../lib/useGrid'
import { parseScript, speakersOf, matchSpeaker } from '../lib/script'
import { shortDate, monthLabel } from '../lib/dates'
import { PageHeader, Spinner, ErrorNote, Empty, Card, Select, StatusBadge, PartBadge } from '../components/ui'
import { ClientPicker, MonthPicker } from '../components/Pickers'
import ScriptView from '../components/ScriptView'

// Guiones del mes para leer y grabar: cada persona filtra sus líneas, pieza por pieza
export default function Scripts() {
  const { client, month, userId, assignableFor } = useStudio()
  const { pieces, loading, error } = useGrid()
  const people = client ? assignableFor(client.id) : []

  // Quién habla en cada pieza (según los rótulos del guion)
  const withSpeakers = useMemo(() => pieces
    .filter(p => p.script?.trim() && p.status !== 'descartada')
    .map(p => {
      const speakers = speakersOf(parseScript(p.script))
      const ids = speakers.map(s => matchSpeaker(s, people)?.id).filter(Boolean)
      return { ...p, speakerIds: [...new Set(ids)] }
    }), [pieces, people])

  const speakingPeople = people.filter(p => withSpeakers.some(pc => pc.speakerIds.includes(p.id)))
  const [personId, setPersonId] = useState(() => '')
  const effectivePerson = personId || (speakingPeople.some(p => p.id === userId) ? userId : 'all')
  const [pieceId, setPieceId] = useState('all')
  const [onlyLines, setOnlyLines] = useState(false)
  const [pendingOnly, setPendingOnly] = useState(true)

  const visible = withSpeakers.filter(p =>
    (effectivePerson === 'all' || p.speakerIds.includes(effectivePerson)) &&
    (pieceId === 'all' || p.id === pieceId) &&
    (!pendingOnly || ['idea', 'aprobada', 'en_grabacion'].includes(p.status)),
  )

  return (
    <div>
      <PageHeader title="Guiones" subtitle={client ? `${client.name} · ${monthLabel(month)}` : ''}>
        <ClientPicker />
        <MonthPicker />
      </PageHeader>
      <ErrorNote>{error}</ErrorNote>

      {loading ? <Spinner /> : (
        <>
          <Card className="mb-4 flex flex-wrap items-center gap-3 p-3">
            <Select value={effectivePerson} onChange={e => setPersonId(e.target.value)} className="w-auto!">
              <option value="all">Todas las personas</option>
              {speakingPeople.map(p => <option key={p.id} value={p.id}>{p.full_name}{p.id === userId ? ' (tú)' : ''}</option>)}
            </Select>
            <Select value={pieceId} onChange={e => setPieceId(e.target.value)} className="w-auto! max-w-72">
              <option value="all">Todas las piezas</option>
              {withSpeakers.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </Select>
            <label className="flex items-center gap-1.5 text-sm text-foreground-muted">
              <input type="checkbox" checked={pendingOnly} onChange={e => setPendingOnly(e.target.checked)} />
              Solo por grabar
            </label>
            {effectivePerson !== 'all' && (
              <label className="flex items-center gap-1.5 text-sm text-foreground-muted">
                <input type="checkbox" checked={onlyLines} onChange={e => setOnlyLines(e.target.checked)} />
                Solo sus líneas
              </label>
            )}
          </Card>

          {visible.length === 0 ? (
            <Empty icon={BookOpenText} title="No hay guiones con estos filtros">
              {pendingOnly ? 'Prueba desmarcando "Solo por grabar".' : 'Cambia la persona o el mes.'}
            </Empty>
          ) : (
            <div className="space-y-4">
              {visible.map(p => {
                const myPart = p.parts.find(pt => pt.assignee_id === (effectivePerson === 'all' ? userId : effectivePerson))
                return (
                  <Card key={p.id} className="p-4 sm:p-5">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <button className="text-left text-base font-semibold hover:underline" onClick={() => openPiece(p.id, 'guion')}>{p.title}</button>
                      <span className="text-xs text-foreground-muted">{shortDate(p.publish_date)}</span>
                      <StatusBadge status={p.status} />
                      {myPart && <PartBadge status={myPart.status} />}
                    </div>
                    {p.hook && <p className="mb-3 rounded-lg bg-accent/10 px-3 py-2 text-sm"><span className="font-semibold text-accent">Gancho: </span>{p.hook}</p>}
                    <ScriptView
                      key={`${p.id}-${effectivePerson}-${onlyLines}`}
                      script={p.script}
                      clientId={p.client_id}
                      defaultPersonId={effectivePerson === 'all' ? null : effectivePerson}
                      defaultHideOthers={onlyLines}
                    />
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
