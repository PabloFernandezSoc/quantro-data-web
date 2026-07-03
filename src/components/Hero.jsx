import { useRef, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { ArrowRight, TrendingUp, Cpu, Users } from 'lucide-react'
import WordReveal from './fx/WordReveal'
import Counter from './fx/Counter'
import Magnetic from './fx/Magnetic'

const stats = [
  { icon: TrendingUp, value: 4.8, prefix: '$', suffix: 'M', decimals: 1, unit: 'CLP/mes', label: 'promedio en nuevas oportunidades' },
  { icon: Cpu,        value: 85,  suffix: '%',              unit: 'ahorro',  label: 'reducción de tareas manuales' },
  { icon: Users,      value: 240, prefix: '+',              unit: 'leads',   label: 'cualificados por mes' },
]

export default function Hero() {
  const ref = useRef(null)
  const videoRef = useRef(null)

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const bgScale     = useTransform(scrollYProgress, [0, 1], [1, 1.12])
  const bgOpacity   = useTransform(scrollYProgress, [0, 0.9], [1, 0.35])
  const contentY    = useTransform(scrollYProgress, [0, 1], [0, 100])
  const contentOpac = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  // Loop con crossfade a negro: el video hace fade-out al terminar,
  // reinicia y vuelve con fade-in — sin el corte seco del loop nativo.
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    let raf = 0
    let fading = false

    const fade = (from, to, ms, done) => {
      const t0 = performance.now()
      const step = now => {
        const p = Math.min((now - t0) / ms, 1)
        v.style.opacity = String(from + (to - from) * p)
        if (p < 1) raf = requestAnimationFrame(step)
        else done?.()
      }
      raf = requestAnimationFrame(step)
    }

    const onCanPlay = () => {
      v.play().catch(() => {})
      fade(0, 1, 500)
    }
    const onTime = () => {
      if (!fading && v.duration && v.duration - v.currentTime <= 0.55) {
        fading = true
        fade(parseFloat(v.style.opacity || '1'), 0, 500)
      }
    }
    const onEnded = () => {
      v.style.opacity = '0'
      setTimeout(() => {
        v.currentTime = 0
        v.play().catch(() => {})
        fading = false
        fade(0, 1, 500)
      }, 100)
    }

    v.addEventListener('canplay', onCanPlay, { once: true })
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('ended', onEnded)
    return () => {
      cancelAnimationFrame(raf)
      v.removeEventListener('canplay', onCanPlay)
      v.removeEventListener('timeupdate', onTime)
      v.removeEventListener('ended', onEnded)
    }
  }, [])

  return (
    <section
      ref={ref}
      className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden pt-16"
      aria-label="Hero section"
    >
      {/* ── Video de fondo con loop crossfade ───────────────── */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{ scale: bgScale, opacity: bgOpacity }}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          src="/videos/hero.mp4"
          muted
          autoPlay
          playsInline
          preload="auto"
          style={{ opacity: 0 }}
          aria-hidden="true"
        />
      </motion.div>

      {/* Base oscura para legibilidad del texto */}
      <div className="absolute inset-0 z-10 bg-black/55" aria-hidden="true" />
      {/* Gradient vignette for cinematic depth */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(2,2,3,0.85) 0%, transparent 70%), ' +
            'radial-gradient(ellipse 100% 40% at 50% 0%,   rgba(2,2,3,0.5)  0%, transparent 60%)',
        }}
        aria-hidden="true"
      />
      {/* Indigo accent glow */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(99,102,241,0.12) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* ── Content ─────────────────────────────────────────── */}
      <motion.div
        className="relative z-20 max-w-5xl mx-auto px-6 text-center"
        style={{ y: contentY, opacity: contentOpac }}
      >
        {/* Badge */}
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-medium mb-8 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
          Growth partner para negocios digitales · Chile
        </motion.div>

        {/* Headline — reveal palabra por palabra con acento serif */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.08] mb-6 drop-shadow-xl">
          <WordReveal text="Somos el" delay={0.1} />{' '}
          <WordReveal
            text="growth partner"
            delay={0.26}
            className="serif-italic text-transparent bg-clip-text"
            style={{ backgroundImage: 'linear-gradient(135deg, #A5B4FC 0%, #C4B5FD 60%, #818CF8 100%)' }}
          />
          <br className="hidden sm:block" />{' '}
          <WordReveal text="de tu negocio digital" delay={0.46} />
        </h1>

        {/* Subheadline */}
        <motion.p
          className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed mb-10 drop-shadow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          Contenido, paid media y automatización trabajando juntos.
          Potenciado con IA, decidido con criterio humano.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <Magnetic>
            <a
              href="#contacto"
              className="group flex items-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors duration-200 cursor-pointer shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40"
            >
              Agenda tu sesión estratégica gratuita
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
            </a>
          </Magnetic>
          <Magnetic strength={0.2}>
            <a
              href="#servicios"
              className="flex items-center gap-2 px-6 py-3.5 border border-white/20 hover:border-white/40 text-white/80 hover:text-white rounded-xl transition-colors duration-200 cursor-pointer hover:bg-white/8 backdrop-blur-sm"
            >
              Ver cómo funciona
            </a>
          </Magnetic>
        </motion.div>

        {/* Stats en CLP */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {stats.map(({ icon: Icon, value, prefix, suffix, decimals, unit, label }, i) => (
            <motion.div
              key={label}
              className="flex flex-col items-center gap-1 p-4 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <Icon size={17} className="text-indigo-400 mb-0.5" />
              <div className="flex items-baseline gap-1">
                <Counter
                  value={value}
                  prefix={prefix}
                  suffix={suffix}
                  decimals={decimals}
                  className="text-2xl font-semibold text-white leading-none"
                />
                <span className="text-xs font-medium text-indigo-300">{unit}</span>
              </div>
              <span className="text-xs text-white/50 text-center leading-tight">{label}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Scroll hint ─────────────────────────────────────── */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        aria-hidden="true"
      >
        <span className="text-xs text-white/30 tracking-widest uppercase">Scroll</span>
        <motion.div
          className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent"
          animate={{ scaleY: [0, 1, 0], originY: 0 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </section>
  )
}
