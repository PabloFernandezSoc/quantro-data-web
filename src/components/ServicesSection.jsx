import { useRef } from 'react'
import { motion, useInView, useMotionValue, useSpring } from 'motion/react'
import { Megaphone, Clapperboard, Bot, Sparkles, ArrowRight } from 'lucide-react'
import WordReveal from './fx/WordReveal'
import GhostTitle from './fx/GhostTitle'

// Tres pilares claros — todo lo que hacemos cabe en uno de estos frentes.
const services = [
  {
    icon: Clapperboard,
    title: 'Contenido & Creatividad',
    tagline: 'Tu marca, constante y profesional.',
    description:
      'Grilla mensual, guiones y edición de tus reels y shorts. Partimos analizando a tu competencia para que cada pieza salga a competir con ventaja.',
    tags: ['Grilla mensual', 'Guiones', 'Edición de video', 'Análisis de competencia'],
    color: '#EC4899',
  },
  {
    icon: Megaphone,
    title: 'Paid Media',
    tagline: 'Campañas que traen clientes, no solo clics.',
    description:
      'Diseñamos, lanzamos y optimizamos tus campañas en Meta y Google Ads. Segmentación afilada, creatividades testeadas y reporting claro de cada peso invertido.',
    tags: ['Meta Ads', 'Google Ads', 'Retargeting', 'Reporting'],
    color: '#6366F1',
  },
  {
    icon: Bot,
    title: 'Automatización & Optimización',
    tagline: 'Le devolvemos horas a tu equipo.',
    description:
      'Con n8n y Python intervenimos las gestiones que hoy consumen tiempo humano: email marketing, notificaciones a clientes y la optimización de tu flujo publicitario.',
    tags: ['n8n', 'Python', 'Email marketing', 'Notificaciones'],
    color: '#8B5CF6',
  },
]

function ServiceCard({ service, index }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const Icon = service.icon

  // Tilt 3D con física de resorte
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 180, damping: 18 })
  const sry = useSpring(ry, { stiffness: 180, damping: 18 })

  // Spotlight (glow que sigue al cursor) + inclinación 3D
  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`)
    ry.set((px - 0.5) * 9)
    rx.set(-(py - 0.5) * 7)
  }

  function onLeave() {
    rx.set(0)
    ry.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className="group relative rounded-2xl border overflow-hidden p-6 md:p-7"
      style={{
        background: 'rgba(255,255,255,0.025)',
        borderColor: 'rgba(255,255,255,0.07)',
        rotateX: srx,
        rotateY: sry,
        transformPerspective: 900,
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      {/* Spotlight que sigue al cursor */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%), ${service.color}18, transparent 65%)`,
        }}
      />

      <div className="relative z-10">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center border mb-5 transition-transform duration-200 group-hover:scale-110"
          style={{ background: `${service.color}15`, borderColor: `${service.color}28` }}
        >
          <Icon size={22} style={{ color: service.color }} />
        </div>

        <h3 className="text-lg font-semibold text-white mb-1">{service.title}</h3>
        <p className="text-sm font-medium mb-3" style={{ color: service.color }}>
          {service.tagline}
        </p>
        <p className="text-sm text-[#8A8F98] leading-relaxed mb-5">{service.description}</p>

        <div className="flex flex-wrap gap-2">
          {service.tags.map(tag => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-lg text-xs font-medium border"
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderColor: 'rgba(255,255,255,0.08)',
                color: '#EDEDEF',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Border accent on hover */}
      <div
        className="absolute inset-0 rounded-2xl border opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ borderColor: `${service.color}30` }}
      />
    </motion.div>
  )
}

export default function ServicesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="servicios" className="py-20 md:py-32 relative overflow-hidden" aria-labelledby="servicios-title">
      <GhostTitle text="GROWTH" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
        {/* Header */}
        <motion.div
          ref={ref}
          className="text-center mb-12 md:mb-16 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium border border-indigo-500/20 bg-indigo-500/8 text-indigo-300 mb-4 uppercase tracking-widest">
            Servicios
          </span>
          <h2 id="servicios-title" className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-4">
            <WordReveal text="Un objetivo:" />{' '}
            <WordReveal
              text="tu crecimiento"
              delay={0.16}
              className="serif-italic text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #818CF8, #A78BFA)' }}
            />
          </h2>
          <p className="text-[#8A8F98] text-base md:text-lg leading-relaxed">
            Tres frentes, un solo partner. Toma uno puntual o combínalos —
            los ajustamos a la etapa de tu negocio.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {services.map((service, i) => (
            <ServiceCard key={service.title} service={service} index={i} />
          ))}
        </div>

        {/* Declaración de IA + criterio humano */}
        <motion.div
          className="liquid-glass mt-8 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-5 md:gap-8"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center flex-shrink-0">
            <Sparkles size={22} className="text-indigo-400" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-white font-semibold text-lg mb-1.5">
              IA en el proceso, <span className="serif-italic text-indigo-300">criterio humano</span> en cada decisión
            </h3>
            <p className="text-sm md:text-base text-[#8A8F98] leading-relaxed">
              Estudiamos a tu competencia, convertimos los hallazgos en contexto para modelos
              como Claude y optimizamos cada flujo de trabajo. La IA nos hace más rápidos —
              nuestro criterio decide qué vale la pena crear.
            </p>
          </div>
          <a
            href="/vision"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-300 hover:text-indigo-200 transition-colors cursor-pointer whitespace-nowrap"
          >
            Conoce cómo pensamos
            <ArrowRight size={15} />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
