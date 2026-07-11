import { useId } from 'react'

// Marca de Quantro Data — radar orbital sobre squircle con gradiente
// (app-icon del logo kit, inline para que escale nítido en cualquier tamaño).
// `mark` renderiza solo el isotipo; por defecto incluye el wordmark.

export function LogoMark({ size = 32, className = '' }) {
  const id = useId()
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      role="img"
      aria-label="Quantro Data"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#6366F1" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="24" fill={`url(#${id})`} />
      <g transform="translate(9,9) scale(0.82)" stroke="#FFFFFF" strokeLinecap="round">
        <path d="M 77.2 37.3 A 30 30 0 0 1 37.3 77.2" strokeWidth="5.5" fill="none" />
        <path d="M 22.8 62.7 A 30 30 0 0 1 62.7 22.8" strokeWidth="5.5" fill="none" />
        <line x1="72" y1="72" x2="83" y2="83" strokeWidth="5.5" />
        <circle cx="50" cy="50" r="13" strokeWidth="4.5" fill="none" />
        <circle cx="50" cy="50" r="5" fill="#FFFFFF" stroke="none" />
        <line x1="61.3" y1="38.7" x2="66.3" y2="33.7" strokeWidth="4.5" />
        <circle cx="71.2" cy="28.8" r="4" fill="#FFFFFF" stroke="none" />
        <line x1="38.7" y1="61.3" x2="33.7" y2="66.3" strokeWidth="4.5" />
        <circle cx="28.8" cy="71.2" r="4" fill="#FFFFFF" stroke="none" />
      </g>
    </svg>
  )
}

export default function Logo({ size = 32, mark = false, className = '' }) {
  if (mark) return <LogoMark size={size} className={className} />
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span className="font-semibold text-white tracking-tight leading-none whitespace-nowrap">
        Quantro <span className="text-indigo-400">Data</span>
      </span>
    </span>
  )
}
