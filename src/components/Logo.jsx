// Marca de Quantro Data — logo Q+D de circuitos (public/logo-mark.png).
// `mark` renderiza solo el isotipo; por defecto incluye el wordmark.

export function LogoMark({ size = 32, className = '' }) {
  return (
    <img
      src="/logo-mark.png"
      alt="Quantro Data"
      width={size}
      height={size}
      className={`rounded-lg object-cover block ${className}`}
      loading="eager"
    />
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
