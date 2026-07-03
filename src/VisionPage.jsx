import { useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import { ArrowLeft, ArrowRight, FileSearch, Bot, PenTool, TrendingUp } from 'lucide-react'
import Logo from './components/Logo'
import WordReveal from './components/fx/WordReveal'
import Magnetic from './components/fx/Magnetic'
import Footer from './components/Footer'

const aiSteps = [
  { icon: FileSearch, title: 'Research', text: 'Estudiamos a tu competencia y tu categoría: qué publican, qué les funciona, dónde hay espacio.' },
  { icon: Bot, title: 'Contexto para la IA', text: 'Convertimos los hallazgos en documentos de contexto que alimentan modelos como Claude.' },
  { icon: PenTool, title: 'Criterio humano', text: 'La IA propone volumen y velocidad; nosotros decidimos qué vale la pena crear y por qué.' },
  { icon: TrendingUp, title: 'Optimización continua', text: 'Cada resultado vuelve al sistema como aprendizaje. El flujo mejora semana a semana.' },
]

export default function VisionPage() {
  const videoRef = useRef(null)

  useEffect(() => {
    document.title = 'Nuestra visión — Quantro Data'
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-dvh" style={{ background: 'var(--color-bg-deep)' }}>
      <div className="grain-overlay" aria-hidden="true" />

      {/* ── Header mínimo ─────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <nav className="liquid-glass max-w-5xl mx-auto rounded-full px-5 py-2.5 flex items-center justify-between">
          <a href="/" aria-label="Quantro Data inicio">
            <Logo size={28} />
          </a>
          <a
            href="/"
            className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={15} />
            Volver al inicio
          </a>
        </nav>
      </header>

      <main>
        {/* ── Hero con video ──────────────────────────────────── */}
        <section className="relative min-h-[85dvh] flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            src="/videos/vision.mp4"
            muted
            autoPlay
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(2,2,3,0.9) 0%, transparent 70%)',
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center pt-24">
            <motion.span
              className="inline-block px-3 py-1 rounded-full text-xs font-medium border border-indigo-500/25 bg-indigo-500/10 text-indigo-300 mb-8 uppercase tracking-widest"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              Nuestra visión
            </motion.span>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold text-white leading-[1.05] drop-shadow-xl">
              <WordReveal text="Datos" delay={0.15} stagger={0.06} />{' '}
              <WordReveal text="x" delay={0.3} className="serif-italic text-white/50" />{' '}
              <WordReveal
                text="criterio"
                delay={0.4}
                stagger={0.06}
                className="serif-italic text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(135deg, #A5B4FC, #C4B5FD)' }}
              />
            </h1>
          </div>
        </section>

        {/* ── Manifiesto ──────────────────────────────────────── */}
        <section className="relative pt-28 md:pt-40 pb-10 md:pb-14 px-6 overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at top, rgba(255,255,255,0.03) 0%, transparent 70%)' }}
            aria-hidden="true"
          />
          <div className="relative max-w-4xl mx-auto text-center">
            <motion.span
              className="block text-white/40 text-sm tracking-widest uppercase mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
            >
              Manifiesto
            </motion.span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl text-white leading-[1.15]">
              <WordReveal text="Creemos que el crecimiento no se improvisa:" />{' '}
              <WordReveal
                text="se investiga, se diseña y se itera."
                delay={0.3}
                className="serif-italic text-white/60"
              />
            </h2>
            <motion.p
              className="text-[#8A8F98] text-base md:text-lg leading-relaxed max-w-2xl mx-auto mt-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              Quantro Data nace para ser el growth partner de los negocios que operan en
              digital. No vendemos piezas sueltas: pensamos tu marca como un sistema donde
              el contenido atrae, el paid media amplifica y la automatización sostiene.
            </motion.p>
          </div>
        </section>

        {/* ── Cómo usamos la IA ───────────────────────────────── */}
        <section className="py-20 md:py-28 px-6 overflow-hidden">
          <div className="max-w-5xl mx-auto">
            <motion.div
              className="text-center mb-12 md:mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl text-white mb-4">
                <WordReveal text="Cómo trabajamos" />{' '}
                <WordReveal
                  text="con la IA"
                  delay={0.16}
                  className="serif-italic text-transparent bg-clip-text"
                  style={{ backgroundImage: 'linear-gradient(135deg, #818CF8, #A78BFA)' }}
                />
              </h2>
              <p className="text-[#8A8F98] text-base md:text-lg max-w-xl mx-auto">
                La IA está en todo nuestro proceso creativo y estratégico —
                pero nunca decide sola.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {aiSteps.map((step, i) => {
                const Icon = step.icon
                return (
                  <motion.div
                    key={step.title}
                    className="liquid-glass rounded-2xl p-6"
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.55, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="w-11 h-11 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center mb-4">
                      <Icon size={20} className="text-indigo-400" />
                    </div>
                    <div className="text-xs text-indigo-300 font-mono mb-1.5">0{i + 1}</div>
                    <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-[#8A8F98] leading-relaxed">{step.text}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── Portafolio (teaser) ─────────────────────────────── */}
        <section className="py-16 md:py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div
              className="liquid-glass rounded-3xl p-8 md:p-12 text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium border border-violet-500/20 bg-violet-500/8 text-violet-300 mb-6 uppercase tracking-widest">
                Portafolio · próximamente
              </span>
              <h2 className="text-2xl md:text-4xl text-white mb-4">
                Los resultados hablan{' '}
                <span className="serif-italic text-white/60">mejor que nosotros</span>
              </h2>
              <p className="text-[#8A8F98] text-base md:text-lg max-w-xl mx-auto mb-8">
                Estamos documentando nuestros primeros casos: grillas antes/después,
                resultados de campañas y flujos de automatización en producción.
                Muy pronto en esta página.
              </p>
              <Magnetic strength={0.3}>
                <a
                  href="/#contacto"
                  className="group inline-flex items-center gap-2 px-7 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors duration-200 cursor-pointer shadow-xl shadow-indigo-500/25"
                >
                  Sé uno de esos casos
                  <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform duration-200" />
                </a>
              </Magnetic>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
