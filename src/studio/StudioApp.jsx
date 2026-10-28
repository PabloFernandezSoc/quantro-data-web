import { useEffect, useState } from 'react'
import {
  ListChecks, BookOpenText, Inbox, LayoutGrid, Table2, CalendarDays, ClipboardPaste, BarChart3, UserCog, CircleUser, LogOut, Menu, X,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { LogoMark } from '../components/Logo'
import { StudioProvider, useStudio, navigate, openPiece } from './lib/store'
import { Spinner, ErrorNote, cx } from './components/ui'
import PieceDetail from './components/PieceDetail'
import Login from './pages/Login'
import MyTasks from './pages/MyTasks'
import Scripts from './pages/Scripts'
import ReviewQueue from './pages/ReviewQueue'
import Board from './pages/Board'
import GridView from './pages/GridView'
import Calendar from './pages/Calendar'
import ImportGrid from './pages/ImportGrid'
import Metrics from './pages/Metrics'
import Admin from './pages/Admin'
import Account from './pages/Account'

// Quantro Studio: app interna para coordinar la producción de grillas (/app)
export default function StudioApp() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    document.title = 'Quantro Studio'
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (session === undefined) return <div className="min-h-dvh bg-bg-deep"><Spinner /></div>
  if (!session) return <Login />
  return (
    <StudioProvider key={session.user.id} session={session}>
      <Shell />
    </StudioProvider>
  )
}

const PAGES = {
  pendientes: { label: 'Mis pendientes', icon: ListChecks, component: MyTasks },
  guiones: { label: 'Guiones', icon: BookOpenText, component: Scripts },
  revisar: { label: 'Por revisar', icon: Inbox, component: ReviewQueue, editors: true },
  tablero: { label: 'Tablero', icon: LayoutGrid, component: Board },
  grilla: { label: 'Grilla', icon: Table2, component: GridView },
  calendario: { label: 'Calendario', icon: CalendarDays, component: Calendar },
  importar: { label: 'Importar Sheet', icon: ClipboardPaste, component: ImportGrid, editors: true },
  metricas: { label: 'Métricas', icon: BarChart3, component: Metrics, editors: true },
  admin: { label: 'Administración', icon: UserCog, component: Admin, admin: true },
  cuenta: { label: 'Mi cuenta', icon: CircleUser, component: Account },
}

function Shell() {
  const { path, profile, isAdmin, isEditorAnywhere, loading, error } = useStudio()
  const [menuOpen, setMenuOpen] = useState(false)

  const url = new URL(path, window.location.origin)
  const slug = url.pathname.replace(/^\/app\/?/, '').split('/')[0]
  const pieceId = url.searchParams.get('pieza')
  const visible = Object.entries(PAGES).filter(([, p]) => (!p.editors || isEditorAnywhere) && (!p.admin || isAdmin))
  // Inicio según rol: edición parte en "Por revisar", el resto en sus pendientes
  const fallback = isEditorAnywhere ? 'revisar' : 'pendientes'
  const current = visible.find(([k]) => k === slug) ? slug : fallback
  const Page = PAGES[current].component

  useEffect(() => { setMenuOpen(false) }, [path])

  if (loading) return <div className="min-h-dvh bg-bg-deep"><Spinner /></div>
  if (!profile) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <ErrorNote>{error || 'Tu usuario no tiene perfil en Quantro Studio. Pídele a Pablo que te dé acceso.'}</ErrorNote>
        <button className="mt-4 text-sm underline" onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>
      </div>
    )
  }
  if (!profile.active) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <ErrorNote>Tu acceso está desactivado.</ErrorNote>
        <button className="mt-4 text-sm underline" onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>
      </div>
    )
  }

  const nav = (
    <nav className="flex flex-col gap-0.5">
      {visible.map(([key, p]) => {
        const Icon = p.icon
        return (
          <button
            key={key}
            onClick={() => navigate(`/app/${key}`)}
            className={cx(
              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm',
              current === key ? 'bg-surface-hover text-foreground' : 'text-foreground-muted hover:bg-surface hover:text-foreground',
            )}
          >
            <Icon size={16} /> {p.label}
          </button>
        )
      })}
      <button onClick={() => supabase.auth.signOut()} className="mt-2 flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-foreground-muted hover:bg-surface hover:text-foreground">
        <LogOut size={16} /> Salir
      </button>
    </nav>
  )

  return (
    <div className="min-h-dvh bg-bg-deep text-foreground">
      {/* Barra superior móvil */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-bg-deep/95 px-4 py-3 backdrop-blur lg:hidden">
        <span className="flex items-center gap-2 font-semibold"><LogoMark size={26} /> Studio</span>
        <button onClick={() => setMenuOpen(o => !o)} aria-label="Menú" className="rounded-md p-1.5 hover:bg-surface">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>
      {menuOpen && <div className="border-b border-border bg-bg-base p-3 lg:hidden">{nav}</div>}

      <div className="lg:flex">
        <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-border p-3 lg:flex">
          <div className="mb-5 flex items-center gap-2 px-2 pt-1">
            <LogoMark size={28} />
            <div>
              <p className="text-sm font-semibold leading-tight">Quantro Studio</p>
              <p className="text-[11px] text-foreground-subtle">{profile.full_name}</p>
            </div>
          </div>
          {nav}
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8">
          <Page />
        </main>
      </div>

      {pieceId && <PieceDetail key={pieceId} pieceId={pieceId} onClose={() => openPiece(null)} />}
    </div>
  )
}
