import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import WordReveal from './fx/WordReveal'
import Magnetic from './fx/Magnetic'

// Mega-CTA estilo agencia: tipografía gigante + botón magnético.
export default function BigCTA() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const glowScale = useTransform(scrollYProgress, [0, 0.5], [0.7, 1.15])

  return (
    <section ref={ref} className="relative py-28 md:py-44 overflow-hidden" aria-labelledby="bigcta-title">
      {/* Glow que crece con el scroll */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] blur-[180px] pointer-events-none opacity-25"
        style={{
          background: 'radial-gradient(circle, #6366F1 0%, #8B5CF6 40%, transparent 70%)',
          scale: glowScale,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium border border-indigo-500/20 bg-indigo-500/8 text-indigo-300 mb-8 uppercase tracking-widest">
          ¿Trabajamos juntos?
        </span>

        <h2
          id="bigcta-title"
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.02] mb-10"
        >
          <WordReveal text="Tu crecimiento" stagger={0.06} />
          <br />
          <WordReveal
            text="empieza aquí."
            delay={0.2}
            stagger={0.06}
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: 'linear-gradient(135deg, #818CF8 0%, #A78BFA 50%, #6366F1 100%)' }}
          />
        </h2>

        <motion.p
          className="text-[#8A8F98] text-lg md:text-xl max-w-xl mx-auto mb-12"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          La primera sesión es gratuita. 45 minutos, cero compromiso,
          y te llevas un diagnóstico accionable de tu negocio.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <Magnetic strength={0.35}>
            <a
              href="#contacto"
              className="group inline-flex items-center gap-3 px-8 py-4 md:px-10 md:py-5 bg-indigo-600 hover:bg-indigo-500 text-white text-lg md:text-xl font-semibold rounded-2xl transition-colors duration-200 cursor-pointer shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50"
            >
              Agendar mi sesión gratuita
              <span className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center group-hover:rotate-45 transition-transform duration-300">
                <ArrowUpRight size={20} />
              </span>
            </a>
          </Magnetic>
        </motion.div>
      </div>
    </section>
  )
}
