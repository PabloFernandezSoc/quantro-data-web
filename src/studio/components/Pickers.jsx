import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useStudio } from '../lib/store'
import { monthLabel, shiftMonth } from '../lib/dates'
import { Select } from './ui'

export function ClientPicker() {
  const { clients, clientId, setClientId } = useStudio()
  if (clients.length <= 1) {
    return clients[0] ? <span className="text-sm font-medium">{clients[0].name}</span> : null
  }
  return (
    <Select value={clientId} onChange={e => setClientId(e.target.value)} className="w-auto! min-w-36">
      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
    </Select>
  )
}

export function MonthPicker() {
  const { month, setMonth } = useStudio()
  return (
    <div className="flex h-10 items-center rounded-lg border border-border bg-bg-elevated">
      <button className="px-2 text-foreground-muted hover:text-foreground" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Mes anterior">
        <ChevronLeft size={16} />
      </button>
      <span className="min-w-32 text-center text-sm capitalize">{monthLabel(month)}</span>
      <button className="px-2 text-foreground-muted hover:text-foreground" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Mes siguiente">
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
