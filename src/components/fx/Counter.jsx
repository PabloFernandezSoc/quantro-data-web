import { useRef, useEffect, useState } from 'react'
import { useInView, animate } from 'motion/react'

// Número que cuenta desde 0 al entrar en vista. Soporta prefijo/sufijo y decimales.
export default function Counter({ value, prefix = '', suffix = '', decimals = 0, duration = 1.6, className = '' }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!isInView) return
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: v => setDisplay(v),
    })
    return () => controls.stop()
  }, [isInView, value, duration])

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  )
}
