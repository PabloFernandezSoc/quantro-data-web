import { useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import Magnetic from './fx/Magnetic'

// Video destacado a pantalla ancha con tarjeta liquid-glass superpuesta.
// El video (22 MB) solo se descarga y reproduce cuando entra en vista.
export default function FeaturedVideoSection() {
  const videoRef = useRef(null)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (v.preload === 'none') v.preload = 'auto'
          v.play().catch(() => {})
        } else {
          v.pause()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(v)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="py-6 md:py-10 px-4 sm:px-6 overflow-hidden" aria-label="Nuestro enfoque">
      <motion.div
        className="relative max-w-6xl mx-auto rounded-3xl overflow-hidden aspect-video"
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          src="/videos/enfoque.mp4"
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
        />

        {/* Gradiente para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" aria-hidden="true" />

        {/* Contenido superpuesto */}
        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="liquid-glass rounded-2xl p-5 md:p-8 max-w-md">
            <span className="block text-white/50 text-xs tracking-widest uppercase mb-3">
              Nuestro enfoque
            </span>
            <p className="text-white text-sm md:text-base leading-relaxed">
              Cada proyecto parte con una pregunta: ¿dónde está tu próxima oportunidad
              de crecimiento? La respondemos combinando research, IA y criterio humano.
            </p>
          </div>

          <Magnetic strength={0.25}>
            <motion.a
              href="/vision"
              className="liquid-glass inline-block rounded-full px-8 py-3 text-white text-sm font-medium hover:bg-white/5 transition-colors cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Conoce nuestra visión
            </motion.a>
          </Magnetic>
        </div>
      </motion.div>
    </section>
  )
}
