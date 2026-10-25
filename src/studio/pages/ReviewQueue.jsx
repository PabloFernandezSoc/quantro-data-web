import { useCallback, useEffect, useState } from 'react'
import { Inbox } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { q, PIECE_SELECT } from '../lib/api'
import { useStudio, openPiece } from '../lib/store'
import { deadlines, shortDate } from '../lib/dates'
import { Card, PageHeader, Empty, Spinner, ErrorNote, DueBadge, Avatar, PartBadge, LinkOut } from '../components/ui'
import { ReviewActions } from '../components/Actions'

// Bandeja de la Vale: piezas con material subido esperando confirmación humana
export default function ReviewQueue() {
  const { canEdit, clientById, personById, version } = useStudio()
  const [pieces, setPieces] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      const data = await q(supabase.from('pieces').select(PIECE_SELECT).eq('status', 'material_por_revisar')
        .order('publish_date', { nullsFirst: false }))
      setPieces(data.filter(p => canEdit(p.client_id)))
      setError(null)
    } catch (e) {
      setError(e.message)
    }
  }, [canEdit])

  useEffect(() => { load() }, [load, version])

  if (!pieces) return error ? <ErrorNote>{error}</ErrorNote> : <Spinner />

  return (
    <div>
      <PageHeader
        title="Material por revisar"
        subtitle="Revisa que esté todo antes de editar. Si falta algo, devuélvelo y le aparece a quien corresponde."
      />
      <ErrorNote>{error}</ErrorNote>
      {pieces.length === 0 ? (
        <Empty icon={Inbox} title="Nada por revisar">Cuando alguien suba material va a aparecer acá.</Empty>
      ) : (
        <ul className="space-y-3">
          {pieces.map(piece => {
            const client = clientById[piece.client_id]
            const { scheduleDue } = deadlines(piece, client)
            return (
              <li key={piece.id}>
                <Card className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold" style={{ color: client?.color }}>{client?.name}</span>
                    <DueBadge due={scheduleDue} label="Programar" />
                    {piece.publish_date && <span className="text-xs text-foreground-muted">publica {shortDate(piece.publish_date)}</span>}
                  </div>
                  <button className="mt-1 text-left font-medium hover:underline" onClick={() => openPiece(piece.id)}>
                    {piece.number ? `#${piece.number} · ` : ''}{piece.title}
                  </button>
                  <div className="mt-2 space-y-1.5">
                    <LinkOut href={piece.drive_raw_url}>Material de la pieza</LinkOut>
                    {piece.parts.map(part => (
                      <div key={part.id} className="flex flex-wrap items-center gap-2 text-sm">
                        <Avatar person={personById[part.assignee_id]} size={20} />
                        <span className="text-foreground-muted">{part.description}</span>
                        <PartBadge status={part.status} />
                        <LinkOut href={part.drive_url}>link</LinkOut>
                        {part.note && <span className="text-xs text-foreground-subtle">“{part.note}”</span>}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3"><ReviewActions piece={piece} onDone={load} /></div>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
