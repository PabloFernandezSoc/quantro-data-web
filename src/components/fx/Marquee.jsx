// Cinta infinita de texto (marquee). Duplica el contenido para el loop perfecto.
export default function Marquee({ items, duration = 30, className = '', itemClassName = '' }) {
  const row = (ariaHidden) => (
    <div className="flex items-center flex-shrink-0" aria-hidden={ariaHidden}>
      {items.map((item, i) => (
        <span key={i} className={`flex items-center whitespace-nowrap ${itemClassName}`}>
          {item}
          <span className="mx-6 md:mx-10 text-indigo-500/60 select-none">✦</span>
        </span>
      ))}
    </div>
  )

  return (
    <div className={`overflow-hidden marquee-mask ${className}`}>
      <div className="marquee-track" style={{ '--marquee-duration': `${duration}s` }}>
        {row(false)}
        {row(true)}
      </div>
    </div>
  )
}
