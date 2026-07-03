import { motion, useScroll, useVelocity, useSpring, useTransform } from 'motion/react'
import Marquee from './fx/Marquee'

const items = [
  'Paid Media', 'Contenido & Video', 'Automatización con IA', 'Meta Ads',
  'Google Ads', 'Edición de Reels', 'CRM & Seguimiento', 'Analítica',
  'Estrategia de Growth', 'Chatbots IA',
]

// Cinta de servicios que se inclina según la velocidad del scroll:
// scrollear rápido la "empuja", soltar la endereza con física de resorte.
export default function ServicesTicker() {
  const { scrollY } = useScroll()
  const velocity = useVelocity(scrollY)
  const smooth = useSpring(velocity, { stiffness: 90, damping: 25, mass: 0.4 })
  const skewX = useTransform(smooth, [-1800, 1800], [5, -5])

  return (
    <div
      className="relative py-5 md:py-6 border-y overflow-hidden"
      style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.015)' }}
      aria-hidden="true"
    >
      <motion.div style={{ skewX }}>
        <Marquee
          items={items}
          duration={36}
          itemClassName="text-sm md:text-base font-medium uppercase tracking-[0.2em] text-white/40"
        />
      </motion.div>
    </div>
  )
}
