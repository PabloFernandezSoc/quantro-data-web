import { useRef } from 'react'
import { motion, useInView, useScroll, useTransform } from 'motion/react'
import { Search, Settings, BarChart3, Rocket } from 'lucide-react'

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

function ProcessStep({ step, index }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const Icon = step.icon

  return (
    <motion.div
      ref={ref}
      className="flex gap-5"
      initial={{ opacity: 0, x: -30 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Timeline */}
      <div className="flex flex-col items-center gap-0 flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
          <Icon size={18} className="text-indigo-400" />
        </div>
        {index < steps.length - 1 && (
          <div className="w-px flex-1 mt-3 mb-0 bg-gradient-to-b from-indigo-500/20 to-transparent min-h-[40px]" />
        )}
      </div>

      {/* Content */}
      <div className="pb-10">
        <span className="text-xs text-indigo-400 font-medium uppercase tracking-wider">{step.week}</span>
        <h3 className="text-lg font-semibold text-white mt-1 mb-2">{step.title}</h3>
        <p className="text-[#8A8F98] leading-relaxed text-sm">{step.description}</p>
      </div>
    </motion.div>
  )
}

export default function ProcessSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start end', 'end start'] })
  const x = useTransform(scrollYProgress, [0, 1], [40, -40])

  return (
    <section id="proceso" className="py-24 md:py-32 relative overflow-hidden" aria-labelledby="proceso-title">
      {/* Floating label background */}
      <motion.div
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
        aria-hidden="true"
      >
        <motion.span
          className="text-[20vw] font-bold text-white/[0.015] whitespace-nowrap"
          style={{ x }}
        >
          PROCESO
        </motion.span>
      </motion.div>

      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          ref={ref}
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium border border-indigo-500/20 bg-indigo-500/8 text-indigo-300 mb-4 uppercase tracking-widest">
            Proceso
          </span>
          <h2 id="proceso-title" className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white tracking-tight mb-4">
            De cero a sistema{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #818CF8, #A78BFA)' }}>
              en 30 días
            </span>
          </h2>
          <p className="text-[#8A8F98] text-lg max-w-xl mx-auto">
            Un proceso claro, sin sorpresas, con entregas concretas en cada etapa.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-x-16 gap-y-0">
          <div>
            {steps.slice(0, 2).map((step, i) => (
              <ProcessStep key={step.title} step={step} index={i} />
            ))}
          </div>
          <div className="md:pt-10">
            {steps.slice(2).map((step, i) => (
              <ProcessStep key={step.title} step={step} index={i + 2} />
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="mt-4 p-8 rounded-2xl border text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))',
            borderColor: 'rgba(99,102,241,0.2)',
          }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-white font-medium text-lg mb-2">
            ¿Listo para automatizar tu crecimiento?
          </p>
          <p className="text-[#8A8F98] text-sm mb-6">
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
