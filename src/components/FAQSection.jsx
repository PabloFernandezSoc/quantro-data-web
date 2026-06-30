import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'motion/react'
import { Plus } from 'lucide-react'

// Las mismas preguntas alimentan el JSON-LD (FAQPage) en index.html.
export const faqs = [
  {
    q: '¿Solo hacen automatizaciones o también campañas y contenido?',
    a: 'Somos un partner de growth completo. Hacemos paid media (Meta y Google Ads), contenido y edición de video, automatización con IA, CRM y analítica. Puedes tomar un solo servicio o combinarlos en un sistema integral.',
  },
  {
    q: '¿Puedo contratar solo la gestión de mis campañas de Meta o Google?',
    a: 'Sí. Muchos clientes empiezan exactamente así: nosotros administramos y optimizamos su inversión publicitaria, mientras ellos siguen con el resto de su operación. Sin automatizaciones ni compromisos extra si no los necesitas.',
  },
  {
    q: '¿Hacen edición de video y manejo de redes?',
    a: 'Sí. Planificamos tu grilla mensual de contenido, producimos y editamos tus reels y shorts, y dejamos tu feed publicando de forma constante y profesional. Es uno de nuestros servicios más solicitados y no requiere ninguna automatización.',
  },
  {
    q: '¿Cómo cobran? ¿Por proyecto o mensual?',
    a: 'Ambos. Ofrecemos proyectos puntuales (un objetivo concreto entregado y listo), retainers mensuales (gestión continua) y sistemas completos de growth. El alcance y el modelo los definimos juntos según tu etapa.',
  },
  {
    q: '¿En cuánto tiempo veo resultados?',
    a: 'Depende del servicio. Una campaña bien montada puede traer leads en los primeros días; un sistema de automatización o una estrategia de contenido muestran su mayor impacto entre la cuarta semana y el segundo mes, cuando ya tenemos datos reales para optimizar.',
  },
  {
    q: '¿Qué necesitan de mi parte para empezar?',
    a: 'Una conversación inicial de 45 minutos (gratuita) donde nos cuentas tu negocio y tus objetivos. A partir de ahí te entregamos un diagnóstico y una propuesta con prioridades claras. No necesitas tener nada listo de antemano.',
  },
  {
    q: '¿Y si no sé exactamente qué necesito?',
    a: 'Es lo más común y para eso está la sesión estratégica. Auditamos tu situación, identificamos dónde está la mayor oportunidad de crecimiento y te recomendamos por dónde partir, sin compromiso.',
  },
]

function FaqItem({ faq, index, isOpen, onToggle }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const panelId = `faq-panel-${index}`
  const btnId = `faq-btn-${index}`

  return (
    <motion.div
      ref={ref}
      className="rounded-2xl border overflow-hidden"
      style={{
        background: isOpen ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.025)',
        borderColor: isOpen ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.08)',
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <button
        id={btnId}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 md:px-6 py-5 text-left cursor-pointer"
      >
        <span className="text-base md:text-lg font-medium text-white">{faq.q}</span>
        <motion.span
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border"
          style={{
            background: isOpen ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
            borderColor: isOpen ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.08)',
          }}
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <Plus size={16} className={isOpen ? 'text-indigo-300' : 'text-[#8A8F98]'} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={btnId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="px-5 md:px-6 pb-5 text-sm md:text-base text-[#8A8F98] leading-relaxed">
              {faq.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function FAQSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section id="faq" className="py-20 md:py-32 relative overflow-hidden" aria-labelledby="faq-title">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          ref={ref}
          className="text-center mb-12 md:mb-14"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium border border-indigo-500/20 bg-indigo-500/8 text-indigo-300 mb-4 uppercase tracking-widest">
            Preguntas frecuentes
          </span>
          <h2 id="faq-title" className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white tracking-tight mb-4">
            Todo lo que necesitas saber{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #818CF8, #A78BFA)' }}>
              antes de empezar
            </span>
          </h2>
          <p className="text-[#8A8F98] text-base md:text-lg">
            ¿Te queda otra duda? Escríbenos y te respondemos en menos de 24 horas.
          </p>
        </motion.div>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <FaqItem
              key={faq.q}
              faq={faq}
              index={i}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
