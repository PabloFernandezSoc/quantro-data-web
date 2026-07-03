import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { Megaphone, Clapperboard, Bot, Database, LineChart, Target, ArrowRight } from 'lucide-react'

const services = [
  {
    icon: Megaphone,
    title: 'Paid Media',
    tagline: 'Campañas que traen clientes, no solo clics.',
    description:
      'Diseñamos, lanzamos y optimizamos tus campañas en Meta y Google Ads. Segmentación afilada, creatividades que convierten y reporting claro de cada peso invertido.',
    tags: ['Meta Ads', 'Google Ads', 'Retargeting', 'Reporting'],
    color: '#6366F1',
  },
  {
    icon: Clapperboard,
    title: 'Contenido & Video',
    tagline: 'Tu marca, constante y profesional.',
    description:
      'Planificamos tu grilla mensual, producimos y editamos tus reels, shorts y piezas. Tu feed siempre activo, con guion, ritmo y estética que enamoran.',
    tags: ['Grilla mensual', 'Edición', 'Reels / Shorts', 'Guion'],
    color: '#EC4899',
  },
  {
    icon: Bot,
    title: 'Automatización & IA',
    tagline: 'Flujos que trabajan mientras duermes.',
    description:
      'Construimos automatizaciones que califican, responden y dan seguimiento solas. La IA de Claude personaliza cada interacción y elimina el trabajo manual repetitivo.',
    tags: ['n8n', 'Python', 'Claude AI', 'Webhooks'],
    color: '#8B5CF6',
  },
  {
    icon: Database,
    title: 'CRM & Seguimiento',
    tagline: 'Ningún lead se enfría ni se pierde.',
    description:
      'Ordenamos tu pipeline y montamos flujos de seguimiento por WhatsApp y email que empujan a cada prospecto hacia el cierre, sin que tengas que recordarlo.',
    tags: ['HubSpot', 'Pipedrive', 'WhatsApp API'],
    color: '#22C55E',
  },
  {
    icon: LineChart,
    title: 'Datos & Analítica',
    tagline: 'Decide con certeza, no con corazonadas.',
    description:
      'Conectamos tu tracking y armamos dashboards en tiempo real para que sepas exactamente qué funciona, qué escalar y dónde está tu próxima oportunidad.',
    tags: ['GA4', 'Looker Studio', 'Dashboards'],
    color: '#06B6D4',
  },
  {
    icon: Target,
    title: 'Estrategia de Growth',
    tagline: 'Un partner, no un proveedor más.',
    description:
      'Auditamos tu situación, definimos un roadmap con prioridades reales y te acompañamos en la ejecución. Pensamos tu crecimiento como si fuera nuestro.',
    tags: ['Auditoría', 'Roadmap', 'Consultoría'],
    color: '#F59E0B',
  },
]

function ServiceCard({ service, index }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const Icon = service.icon

  // Spotlight: el glow sigue la posición del cursor dentro de la tarjeta
  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }

  return (
    <motion.div
      ref={ref}
      className="group relative rounded-2xl border overflow-hidden p-6 md:p-7"
      style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.07)' }}
      onMouseMove={onMove}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
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
          <h2 id="servicios-title" className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white tracking-tight mb-4">
            No solo automatización.{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #818CF8, #A78BFA)' }}>
              Growth de punta a punta
            </span>
          </h2>
          <p className="text-[#8A8F98] text-base md:text-lg leading-relaxed">
            Desde traer a los clientes correctos hasta producir el contenido que los enamora.
            Toma un servicio puntual o combínalos en un sistema completo — el alcance lo defines tú.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {services.map((service, i) => (
            <ServiceCard key={service.title} service={service} index={i} />
          ))}
        </div>

        {/* Modular note */}
        <motion.div
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-sm text-[#8A8F98]">
            ¿No ves tu necesidad exacta? Armamos un plan a tu medida.
          </p>
          <a
            href="#contacto"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-300 hover:text-indigo-200 transition-colors cursor-pointer"
          >
            Conversemos
            <ArrowRight size={15} />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
