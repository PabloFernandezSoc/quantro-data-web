import { useEffect } from 'react'
import { X, LoaderCircle, ExternalLink } from 'lucide-react'
import { STATUS, PART_STATUS } from '../lib/constants'
import { relativeDays, shortDate, urgency } from '../lib/dates'

export function cx(...c) {
  return c.filter(Boolean).join(' ')
}

export function Button({ variant = 'primary', size = 'md', className, loading, children, ...props }) {
  const base = 'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
  const sizes = { sm: 'h-8 px-2.5 text-xs', md: 'h-10 px-4 text-sm' }
  const variants = {
    primary: 'bg-accent text-white hover:bg-accent-secondary',
    ghost: 'bg-transparent text-foreground-muted hover:bg-surface-hover hover:text-foreground',
    outline: 'border border-border text-foreground hover:bg-surface-hover',
    danger: 'bg-red/15 text-red hover:bg-red/25',
    success: 'bg-green/15 text-green hover:bg-green/25',
  }
  return (
    <button className={cx(base, sizes[size], variants[variant], className)} disabled={loading || props.disabled} {...props}>
      {loading && <LoaderCircle size={14} className="animate-spin" />}
      {children}
    </button>
  )
}

const fieldCls = 'w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none'

export function Input({ className, ...props }) {
  return <input className={cx(fieldCls, 'h-10', className)} {...props} />
}

export function Textarea({ className, ...props }) {
  return <textarea className={cx(fieldCls, 'min-h-20', className)} {...props} />
}

export function Select({ className, children, ...props }) {
  return <select className={cx(fieldCls, 'h-10', className)} {...props}>{children}</select>
}

export function Field({ label, hint, children, className }) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1 block text-xs font-medium text-foreground-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-foreground-subtle">{hint}</span>}
    </label>
  )
}

export function Card({ className, children, ...props }) {
  return <div className={cx('rounded-xl border border-border bg-bg-elevated', className)} {...props}>{children}</div>
}

export function Badge({ color = '#8A8F98', children, className }) {
  return (
    <span
      className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium', className)}
      style={{ background: `${color}22`, color }}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }) {
  const s = STATUS[status]
  return <Badge color={s?.color}>{s?.label || status}</Badge>
}

export function PartBadge({ status }) {
  const s = PART_STATUS[status]
  return <Badge color={s?.color}>{s?.label || status}</Badge>
}

const URGENCY_COLOR = { late: '#EF4444', soon: '#F59E0B', ok: '#22C55E' }

export function DueBadge({ due, label = 'Material' }) {
  if (!due) return <Badge>Sin fecha</Badge>
  const u = urgency(due)
  return (
    <Badge color={URGENCY_COLOR[u]}>
      {label} {shortDate(due)} · {relativeDays(due)}
    </Badge>
  )
}

export function Dot({ due }) {
  const u = urgency(due)
  if (!u) return null
  return <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: URGENCY_COLOR[u] }} />
}

export function Avatar({ person, size = 24 }) {
  const name = person?.full_name || '?'
  const initials = name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 360
  return (
    <span
      title={name}
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.4, background: `hsl(${hash} 55% 45%)` }}
    >
      {initials}
    </span>
  )
}

export function LinkOut({ href, children }) {
  if (!href) return null
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-accent hover:underline break-all">
      <ExternalLink size={13} className="shrink-0" /> {children || 'Abrir'}
    </a>
  )
}

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return
    const onKey = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        className={cx('max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-border bg-bg-base sm:rounded-2xl', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-bg-base px-4 py-3">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-foreground-muted hover:bg-surface-hover" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

export function Empty({ icon: Icon, title, children }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-12 text-center">
      {Icon && <Icon size={28} className="text-foreground-subtle" />}
      <p className="font-medium">{title}</p>
      {children && <div className="max-w-md text-sm text-foreground-muted">{children}</div>}
    </div>
  )
}

export function Spinner() {
  return (
    <div className="flex justify-center py-12 text-foreground-muted">
      <LoaderCircle className="animate-spin" />
    </div>
  )
}

export function ErrorNote({ children }) {
  if (!children) return null
  return <p className="rounded-lg bg-red/10 px-3 py-2 text-sm text-red">{children}</p>
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-foreground-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}
