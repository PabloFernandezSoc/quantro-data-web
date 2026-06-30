import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { Target, Repeat, Workflow, Check } from 'lucide-react'

const models = [
  {
    icon: Target,
    name: 'Proyecto puntual',
    tagline: 'Un objetivo concreto, entregado y listo.',
    points: [
      'Montar y dejar corriendo tus campañas de Meta o Google',
      'Producir la grilla de contenido y edición del mes',
      'Construir una automatización específica',
    ],
    ideal: 'Ideal para validar un canal o resolver una necesidad concreta.',
    featured: false,
  },
  {
    icon: Repeat,
    name: 'Retainer mensual',
    tagline: 'Gestión continua que mejora mes a mes.',
    points: [
      'Administración y optimización de tus campañas',
      'Contenido y edición recurrente para tus redes',
      'Soporte y ajustes sobre tus automatizaciones',
    ],
    ideal: 'Ideal para crecer de forma sostenida con un equipo a tu lado.',
    featured: true,
  },
  {
    icon: Workflow,
    name: 'Sistema completo',
    tagline: 'Tu máquina de crecimiento, de punta a punta.',
    points: [
      'Paid media + contenido + automatización integrados',
      'CRM, seguimiento y datos conectados en un solo flujo',
      'Estrategia y operación como tu partner de growth',
    ],
    ideal: 'Ideal para escalar en serio con un sistema que opera por ti.',
    featured: false,
  },
]

function ModelCard({ model, index }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const Icon = model.icon
  const accent = '#6366F1'

  return (
    <motion.div
      ref={ref}
      className="relative rounded-2xl border p-6 md:p-7 flex flex-col"
      style={{
        background: model.featured
          ? 'linear-gradient(160deg, rgba(99,102,241,0.10), rgba(139,92,246,0.04))'
          : 'rgba(255,255,255,0.025)',
        borderColor: model.featured ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.08)',
        boxShadow: model.featured ? '0 0 50px rgba(99,102,241,0.12)' : 'none',
      }}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      {model.featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500 text-white whitespace-nowrap shadow-lg shadow-indigo-500/30">
          Más elegido
        </span>
      )}

      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center border mb-5"
        style={{ background: `${accent}15`, borderColor: `${accent}28` }}
      >
        <Icon size={22} style={{ color: accent }} />
      </div>

      <h3 className="text-lg font-semibold text-white mb-1">{model.name}</h3>
      <p className="text-sm text-indigo-300 font-medium mb-5">{model.tagline}</p>

      <ul className="flex flex-col gap-3 mb-6 flex-1" role="list">
        {model.points.map(point => (
          <li key={point} className="flex items-start gap-2.5">
            <Check size={16} className="text-indigo-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-[#8A8F98] leading-relaxed">{point}</span>
          </li>
        ))}
      </ul>

      <p className="text-xs text-[#8A8F98] mb-5 leading-relaxed">{model.ideal}</p>

      <a
        href="#contacto"
        className="block text-center py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer"
        style={
          model.featured
            ? { background: '#6366F1', color: '#fff' }
            : { background: 'rgba(255,255,255,0.05)', color: '#EDEDEF', border: '1px solid rgba(255,255,255,0.1)' }
        }
      >
        Conversemos →
      </a>
    </motion.div>
  )
}

export default function EngagementSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="modelos" className="py-20 md:py-32 relative overflow-hidden" aria-labelledby="modelos-title">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          ref={ref}
          className="text-center mb-12 md:mb-16 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium border border-indigo-500/20 bg-indigo-500/8 text-indigo-300 mb-4 uppercase tracking-widest">
            Cómo trabajamos
          </span>
          <h2 id="modelos-title" className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white tracking-tight mb-4">
            Un alcance para{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #818CF8, #A78BFA)' }}>
              cada etapa
            </span>{' '}
            de tu negocio
          </h2>
          <p className="text-[#8A8F98] text-base md:text-lg leading-relaxed">
            No te amarramos a un paquete gigante. Empieza por donde más lo necesitas
            y escala cuando estés listo.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 md:items-stretch">
          {models.map((model, i) => (
            <ModelCard key={model.name} model={model} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
