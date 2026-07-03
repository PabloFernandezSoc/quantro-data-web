import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'

// Palabra gigante semi-invisible de fondo que se desplaza con el scroll
// (parallax horizontal). Da profundidad editorial a cada sección.
export default function GhostTitle({ text, direction = 1 }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const x = useTransform(scrollYProgress, [0, 1], [80 * direction, -80 * direction])

  return (
    <div
      ref={ref}
      className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
      aria-hidden="true"
    >
      <motion.span
        className="font-bold whitespace-nowrap leading-none"
        style={{
          x,
          fontSize: '19vw',
          color: 'rgba(255,255,255,0.016)',
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.02em',
        }}
      >
        {text}
      </motion.span>
    </div>
  )
}
