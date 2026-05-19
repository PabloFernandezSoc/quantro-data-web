import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { Target, Cpu, CheckCircle2, ArrowDown } from 'lucide-react'

const steps = [
  {
    id: 'captacion',
    number: '01',
    icon: Target,
    label: 'Captación',
    title: 'Atrae a los clientes correctos',
    description:
      'Diseñamos y gestionamos campañas de alto rendimiento en Google Ads y Meta Ads. Segmentación precisa, creatividades testeadas y optimización continua para que cada peso invertido traiga leads de calidad.',
    tools: ['Google Ads', 'Meta Ads', 'Analytics 4', 'Looker Studio'],
    color: '#6366F1',
    glow: 'rgba(99,102,241,0.15)',
    metric: { value: '$890K CLP', label: 'costo por cliente adquirido' },
  },
  {
    id: 'nutricion',
    number: '02',
    icon: Cpu,
    label: 'Nutrición & Automatización',
    title: 'Convierte el interés en intención',
    description:
      'Orquestamos flujos automáticos con n8n y Python que califican, segmentan y nutren a tus prospectos. La IA de Claude analiza el comportamiento y personaliza cada interacción en tiempo real.',
    tools: ['n8n', 'Python', 'Claude AI', 'Make', 'Webhooks'],
    color: '#8B5CF6',
    glow: 'rgba(139,92,246,0.15)',
    metric: { value: '72h', label: 'ciclo de cualificación' },
  },
  {
    id: 'conversion',
    number: '03',
    icon: CheckCircle2,
    label: 'Conversión & Cierre',
    title: 'Cierra ventas mientras duermes',
    description:
      'Chatbots inteligentes que responden 24/7, seguimiento automatizado en CRM y pipelines que empujan a cada prospecto hacia el cierre. Sin fricción, sin leads perdidos.',
    tools: ['HubSpot', 'Pipedrive', 'Chatbots IA', 'WhatsApp API', 'Zapier'],
    color: '#22C55E',
    glow: 'rgba(34,197,94,0.15)',
    metric: { value: '$4.8M CLP', label: 'promedio en contratos cerrados/mes' },
  },
]

function StepCard({ step, index }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const Icon = step.icon

  return (
    <motion.div
      ref={ref}
      className="relative"
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="relative rounded-2xl border overflow-hidden p-6 md:p-10"
        style={{
          borderColor: 'rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.025)',
        }}
      >
        {/* Glow accent */}
        <div
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none"
          style={{ background: step.glow }}
        />

        <div className="relative z-10 flex flex-col items-center text-center md:flex-row md:items-start md:text-left gap-6">

          {/* Icon + number — centered on mobile */}
          <div className="flex-shrink-0 flex flex-row md:flex-col items-center gap-4 md:gap-3">
            <div
              className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center border"
              style={{ background: `${step.color}15`, borderColor: `${step.color}25` }}
            >
              <Icon size={22} style={{ color: step.color }} />
            </div>
            <div
              className="font-mono text-4xl md:text-5xl font-bold leading-none select-none"
              style={{ color: `${step.color}18` }}
              aria-hidden="true"
            >
              {step.number}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 w-full">
            {/* Label */}
            <span
              className="text-xs font-medium uppercase tracking-widest"
              style={{ color: step.color }}
            >
              {step.label}
            </span>

            {/* Title */}
            <h3 className="text-xl md:text-2xl font-semibold text-white mt-1 mb-4">
              {step.title}
            </h3>

            {/* Metric badge — full width on mobile, inline on desktop */}
            <div
              className="flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl border mb-4 md:inline-flex md:w-auto w-full"
              style={{ borderColor: `${step.color}20`, background: `${step.color}08` }}
            >
              <span className="text-xl font-bold leading-tight" style={{ color: step.color }}>
                {step.metric.value}
              </span>
              <span className="text-xs text-[#8A8F98]">{step.metric.label}</span>
            </div>

            {/* Description */}
            <p className="text-[#8A8F98] leading-relaxed mb-5 text-sm md:text-base">
              {step.description}
            </p>

            {/* Tools */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              {step.tools.map(tool => (
                <span
                  key={tool}
                  className="px-3 py-1 rounded-lg text-xs font-medium border"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderColor: 'rgba(255,255,255,0.08)',
                    color: '#EDEDEF',
                  }}
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function ConnectorArrow() {
  return (
    <div className="flex justify-center py-2" aria-hidden="true">
      <div className="flex flex-col items-center gap-1">
        <div className="w-px h-8 bg-gradient-to-b from-white/10 to-white/4" />
        <ArrowDown size={14} className="text-white/20" />
      </div>
    </div>
  )
}

export default function FunnelSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="embudo" className="py-20 md:py-32 relative overflow-hidden" aria-labelledby="embudo-title">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          ref={ref}
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium border border-indigo-500/20 bg-indigo-500/8 text-indigo-300 mb-4 uppercase tracking-widest">
            El embudo integral
          </span>
          <h2 id="embudo-title" className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white tracking-tight mb-4">
            De extraño a cliente,{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #818CF8, #A78BFA)' }}>
              en automático
            </span>
          </h2>
          <p className="text-[#8A8F98] text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Tres fases interconectadas que trabajan las 24 horas para llenar tu pipeline
            sin que muevas un dedo.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="flex flex-col gap-0">
          {steps.map((step, index) => (
            <div key={step.id}>
              <StepCard step={step} index={index} />
              {index < steps.length - 1 && <ConnectorArrow />}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
