import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'motion/react'
import {
  Megaphone, MousePointerClick, Bot, Database, MessageSquare, CheckCircle2,
  Sparkles, CalendarDays, Video, Scissors, Share2, LineChart,
  Search, Filter, PenTool, Gauge, BarChart3,
} from 'lucide-react'

const flows = [
  {
    id: 'leadgen',
    label: 'Lead Gen automatizado',
    badge: 'Automatizado',
    color: '#6366F1',
    description:
      'Un anuncio capta, la IA califica y el CRM da seguimiento — todo solo, 24/7.',
    nodes: [
      { icon: Megaphone, title: 'Anuncio', sub: 'Meta / Google' },
      { icon: MousePointerClick, title: 'Landing', sub: 'Captura el lead' },
      { icon: Bot, title: 'IA califica', sub: 'Claude analiza' },
      { icon: Database, title: 'CRM', sub: 'Pipeline ordenado' },
      { icon: MessageSquare, title: 'Seguimiento', sub: 'WhatsApp / Email' },
      { icon: CheckCircle2, title: 'Venta', sub: 'Cierre' },
    ],
  },
  {
    id: 'contenido',
    label: 'Contenido & Video',
    badge: 'Ejecución manual',
    color: '#EC4899',
    description:
      'Sin automatización: estrategia, producción y edición hechas a mano, mes a mes.',
    nodes: [
      { icon: Sparkles, title: 'Estrategia', sub: 'Línea editorial' },
      { icon: CalendarDays, title: 'Grilla', sub: 'Plan mensual' },
      { icon: Video, title: 'Producción', sub: 'Rodaje / material' },
      { icon: Scissors, title: 'Edición', sub: 'Reels & shorts' },
      { icon: Share2, title: 'Publicación', sub: 'Calendarizado' },
      { icon: LineChart, title: 'Análisis', sub: 'Qué funcionó' },
    ],
  },
  {
    id: 'campanas',
    label: 'Gestión de campañas',
    badge: 'Servicio puntual',
    color: '#22C55E',
    description:
      'Solo administramos tu inversión publicitaria: setup, optimización y reportes.',
    nodes: [
      { icon: Search, title: 'Research', sub: 'Audiencias' },
      { icon: Filter, title: 'Setup', sub: 'Estructura' },
      { icon: PenTool, title: 'Creatividades', sub: 'Tests A/B' },
      { icon: Gauge, title: 'Optimización', sub: 'Diaria' },
      { icon: BarChart3, title: 'Reporting', sub: 'Resultados claros' },
    ],
  },
]

/* Conector con pulso animado — horizontal en desktop, vertical en mobile */
function Connector({ color, delay }) {
  return (
    <div className="flex items-center justify-center md:w-14 md:flex-none" aria-hidden="true">
      {/* Desktop: horizontal */}
      <div className="hidden md:block relative w-full h-px mx-1">
        <div className="absolute inset-0" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <motion.span
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
          style={{ background: color, boxShadow: `0 0 10px ${color}` }}
          initial={{ left: '0%', opacity: 0 }}
          animate={{ left: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.8, delay, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' }}
        />
      </div>
      {/* Mobile: vertical */}
      <div className="md:hidden relative h-7 w-px my-1">
        <div className="absolute inset-0" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <motion.span
          className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
          style={{ background: color, boxShadow: `0 0 10px ${color}` }}
          initial={{ top: '0%', opacity: 0 }}
          animate={{ top: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.4, delay, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' }}
        />
      </div>
    </div>
  )
}

function FlowNode({ node, color, index }) {
  const Icon = node.icon
  return (
    <motion.div
      className="flex flex-col items-center text-center gap-2 md:flex-1 md:min-w-0"
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center border flex-shrink-0"
        style={{ background: `${color}15`, borderColor: `${color}30` }}
      >
        <Icon size={24} style={{ color }} />
      </div>
      <div>
        <div className="text-sm font-semibold text-white leading-tight">{node.title}</div>
        <div className="text-xs text-[#8A8F98] leading-tight mt-0.5">{node.sub}</div>
      </div>
    </motion.div>
  )
}

export default function WorkflowSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [active, setActive] = useState(0)
  const flow = flows[active]

  return (
    <section id="workflows" className="py-20 md:py-32 relative overflow-hidden" aria-labelledby="workflows-title">
      {/* Ambient glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] blur-[160px] pointer-events-none opacity-[0.12]"
        style={{ background: `radial-gradient(circle, ${flow.color}, transparent 70%)` }}
        aria-hidden="true"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <motion.div
          ref={ref}
          className="text-center mb-10 md:mb-14 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium border border-violet-500/20 bg-violet-500/8 text-violet-300 mb-4 uppercase tracking-widest">
            Workflows en acción
          </span>
          <h2 id="workflows-title" className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white tracking-tight mb-4">
            Mira{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #A78BFA, #818CF8)' }}>
              cómo trabaja
            </span>{' '}
            cada engranaje
          </h2>
          <p className="text-[#8A8F98] text-base md:text-lg leading-relaxed">
            Cada proyecto es un flujo claro y medible. Elige un objetivo y observa el playbook
            que ejecutamos — con o sin automatización.
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-2 mb-8 md:mb-10"
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          role="tablist"
          aria-label="Tipos de workflow"
        >
          {flows.map((f, i) => {
            const isActive = i === active
            return (
              <button
                key={f.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(i)}
                className="px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 cursor-pointer"
                style={{
                  background: isActive ? `${f.color}18` : 'rgba(255,255,255,0.03)',
                  borderColor: isActive ? `${f.color}45` : 'rgba(255,255,255,0.08)',
                  color: isActive ? '#fff' : '#8A8F98',
                }}
              >
                {f.label}
              </button>
            )
          })}
        </motion.div>

        {/* Flow board */}
        <motion.div
          className="relative rounded-2xl border p-6 md:p-12 overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.08)' }}
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={flow.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Badge + description */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8 md:mb-10">
                <span
                  className="self-center sm:self-auto px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap"
                  style={{ background: `${flow.color}15`, borderColor: `${flow.color}35`, color: flow.color }}
                >
                  {flow.badge}
                </span>
                <p className="text-sm text-[#8A8F98] text-center sm:text-left">{flow.description}</p>
              </div>

              {/* Nodes + connectors */}
              <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                {flow.nodes.map((node, i) => (
                  <div key={node.title} className="contents">
                    <FlowNode node={node} color={flow.color} index={i} />
                    {i < flow.nodes.length - 1 && (
                      <Connector color={flow.color} delay={i * 0.25} />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}
