// Marca de Quantro Data — anillo orbital + flecha de crecimiento.
// `mark` renderiza solo el isotipo; por defecto incluye el wordmark.

export function LogoMark({ size = 32, className = '' }) {
  const id = 'qg-' + size
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Quantro Data"
    >
      <defs>
        <linearGradient id={id} x1="8" y1="8" x2="92" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#818CF8" />
          <stop offset="0.55" stopColor="#6366F1" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="24" fill={`url(#${id})`} />
      <circle cx="45" cy="55" r="21" fill="none" stroke="#fff" strokeWidth="6.5" opacity="0.95" />
      <path d="M39 61 L60 40" stroke="#fff" strokeWidth="6.5" strokeLinecap="round" />
      <path
        d="M49 38 L63 38 L63 52"
        fill="none"
        stroke="#fff"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Logo({ size = 32, mark = false, className = '' }) {
  if (mark) return <LogoMark size={size} className={className} />
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span className="font-semibold text-white tracking-tight leading-none">
        Quantro <span className="text-indigo-400">Data</span>
      </span>
    </span>
  )
}
