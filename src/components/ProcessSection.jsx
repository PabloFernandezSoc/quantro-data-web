import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { Search, Settings, BarChart3, Rocket } from 'lucide-react'
import WordReveal from './fx/WordReveal'
import GhostTitle from './fx/GhostTitle'

const steps = [
  {
    icon: Search,
    week: 'Semana 1',
    title: 'Diagnóstico estratégico',
    description:
      'Auditamos tu embudo actual, identificamos los puntos de fuga y mapeamos las oportunidades de automatización con mayor impacto en tu negocio.',
  },
  {
    icon: Settings,
    week: 'Semanas 2–3',
    title: 'Arquitectura & construcción',
    description:
      'Diseñamos y construimos los flujos de automatización, configuramos las integraciones entre plataformas y programamos los agentes de IA.',
  },
  {
    icon: BarChart3,
    week: 'Semana 4',
    title: 'Activación & monitoreo',
    description:
      'Lanzamos el sistema, conectamos el tracking, calibramos los modelos con datos reales y entregamos dashboards de control en tiempo real.',
  },
  {
    icon: Rocket,
    week: 'Mes 2+',
    title: 'Optimización continua',
    description:
      'Iteramos sobre los resultados cada sprint, escalamos lo que funciona y refinamos lo que no. Tu sistema mejora semana a semana.',
  },
]

function ProcessStep({ step, index, isLast }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const Icon = step.icon

  return (
    <motion.div
      ref={ref}
      className="flex gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Timeline: icono con pop + línea que se dibuja al entrar en vista */}
      <div className="flex flex-col items-center flex-shrink-0">
        <motion.div
          className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center"
          initial={{ scale: 0, rotate: -30 }}
          animate={isInView ? { scale: 1, rotate: 0 } : {}}
          transition={{ type: 'spring', stiffness: 260, damping: 18, delay: index * 0.1 + 0.1 }}
        >
          <Icon size={18} className="text-indigo-400" />
        </motion.div>
        {!isLast && (
          <motion.div
            className="w-px flex-1 mt-3 bg-gradient-to-b from-indigo-500/40 to-indigo-500/5 min-h-[40px] origin-top"
            initial={{ scaleY: 0 }}
            animate={isInView ? { scaleY: 1 } : {}}
            transition={{ duration: 0.8, delay: index * 0.1 + 0.35, ease: [0.16, 1, 0.3, 1] }}
          />
        )}
      </div>

      {/* Content */}
      <div className="pb-8 md:pb-10 pt-0.5">
        <span className="text-xs text-indigo-400 font-medium uppercase tracking-wider">{step.week}</span>
        <h3 className="text-base md:text-lg font-semibold text-white mt-1 mb-1.5">{step.title}</h3>
        <p className="text-[#8A8F98] leading-relaxed text-sm">{step.description}</p>
      </div>
    </motion.div>
  )
}

export default function ProcessSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="proceso" className="py-20 md:py-32 relative overflow-hidden" aria-labelledby="proceso-title">
      <GhostTitle text="PROCESO" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative">
        {/* Header */}
        <motion.div
          ref={ref}
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium border border-indigo-500/20 bg-indigo-500/8 text-indigo-300 mb-4 uppercase tracking-widest">
            Proceso
          </span>
          <h2 id="proceso-title" className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-4">
            <WordReveal text="De cero a sistema" />{' '}
            <WordReveal
              text="en 30 días"
              delay={0.16}
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #818CF8, #A78BFA)' }}
            />
          </h2>
          <p className="text-[#8A8F98] text-base md:text-lg max-w-xl mx-auto">
            Un proceso claro, sin sorpresas, con entregas concretas en cada etapa.
          </p>
        </motion.div>

        {/* Steps: single column on mobile, 2 cols on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16">
          <div>
            {steps.slice(0, 2).map((step, i) => (
              <ProcessStep key={step.title} step={step} index={i} isLast={false} />
            ))}
          </div>
          <div className="md:pt-10">
            {steps.slice(2).map((step, i) => (
              <ProcessStep key={step.title} step={step} index={i + 2} isLast={i === 1} />
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="mt-2 md:mt-4 p-6 md:p-8 rounded-2xl border text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))',
            borderColor: 'rgba(99,102,241,0.2)',
          }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-white font-medium text-base md:text-lg mb-2">
            ¿Listo para automatizar tu crecimiento?
          </p>
          <p className="text-[#8A8F98] text-sm mb-5">
            La primera sesión es gratuita. Sin compromiso, con valor real.
          </p>
          <a
            href="#contacto"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 hover:-translate-y-0.5"
          >
            Empezar ahora →
          </a>
        </motion.div>
      </div>
    </section>
  )
}
