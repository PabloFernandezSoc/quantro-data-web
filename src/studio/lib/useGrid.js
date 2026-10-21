import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { q, PIECE_SELECT } from './api'
import { useStudio } from './store'

// Grilla del cliente/mes activos con sus piezas y partes. Se recarga con cada cambio realtime.
export function useGrid() {
  const { clientId, month, version } = useStudio()
  const [grid, setGrid] = useState(null)
  const [pieces, setPieces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!clientId) { setLoading(false); return }
    try {
      const g = await q(supabase.from('grids').select('*').eq('client_id', clientId).eq('month', month).maybeSingle())
      setGrid(g)
      if (g) {
        const ps = await q(
          supabase.from('pieces').select(PIECE_SELECT).eq('grid_id', g.id)
            .order('publish_date', { ascending: true, nullsFirst: false }).order('number'),
        )
        setPieces(ps)
      } else {
        setPieces([])
      }
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [clientId, month])

  useEffect(() => { setLoading(true) }, [clientId, month])
  useEffect(() => { load() }, [load, version])

  const createGrid = async () => {
    const g = await q(supabase.from('grids').insert({ client_id: clientId, month }).select().single())
    setGrid(g)
    return g
  }

  return { grid, pieces, loading, error, reload: load, createGrid }
}
