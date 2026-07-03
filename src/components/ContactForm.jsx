import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'motion/react'
import { CheckCircle2, Send, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import WordReveal from './fx/WordReveal'

const services = [
  'Contenido & video (grilla, guiones, edición)',
  'Paid media (Meta / Google)',
  'Automatización & optimización (n8n, Python)',
  'Email marketing / notificaciones',
  'Estrategia de growth',
  'Aún no lo sé — necesito un diagnóstico',
]

function InputField({ label, id, type = 'text', required, placeholder, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-[#EDEDEF]">
        {label}{required && <span className="text-red-400 ml-0.5" aria-hidden="true">*</span>}
      </label>
      {children || (
        <input
          id={id}
          name={id}
          type={type}
          required={required}
          placeholder={placeholder}
          autoComplete={type === 'email' ? 'email' : type === 'tel' ? 'tel' : 'off'}
          className="w-full px-4 py-3 rounded-xl border text-[#EDEDEF] placeholder-[#4A505A] text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}
          onFocus={e => {
            e.target.style.borderColor = 'rgba(99,102,241,0.5)'
            e.target.style.background  = 'rgba(99,102,241,0.06)'
          }}
          onBlur={e => {
            e.target.style.borderColor = 'rgba(255,255,255,0.1)'
            e.target.style.background  = 'rgba(255,255,255,0.04)'
          }}
        />
      )}
    </div>
  )
}

export default function ContactForm() {
  const ref    = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  const [status,           setStatus]           = useState('idle') // idle | loading | success | error
  const [errorMsg,         setErrorMsg]         = useState('')
  const [selectedServices, setSelectedServices] = useState([])

  function toggleService(service) {
    setSelectedServices(prev =>
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const form = e.currentTarget
    const data = {
      name:     form.name.value.trim(),
      email:    form.email.value.trim(),
      company:  form.company?.value.trim() || null,
      phone:    form.phone?.value.trim()   || null,
      services: selectedServices,
      message:  form.message?.value.trim() || null,
    }

    const { error } = await supabase.from('contact_leads').insert([data])

    if (error) {
      console.error('Supabase error:', error)
      setErrorMsg('Hubo un problema al enviar tu mensaje. Por favor inténtalo de nuevo.')
      setStatus('error')
      return
    }

    setStatus('success')
  }

  return (
    <section id="contacto" className="py-24 md:py-32 relative overflow-hidden" aria-labelledby="contacto-title">
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] blur-[150px] pointer-events-none opacity-20"
        style={{ background: 'radial-gradient(circle, #6366F1, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          ref={ref}
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium border border-green-500/20 bg-green-500/8 text-green-300 mb-4 uppercase tracking-widest">
            Sesión estratégica gratuita
          </span>
          <h2 id="contacto-title" className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-4">
            <WordReveal text="Hablemos de tu" />{' '}
            <WordReveal
              text="próximo nivel"
              delay={0.14}
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #818CF8, #A78BFA)' }}
            />
          </h2>
          <p className="text-[#8A8F98] text-lg max-w-md mx-auto">
            Cuéntanos sobre tu negocio y te mostraremos en 45 minutos exactamente qué automatizar
            para multiplicar tus resultados.
          </p>
        </motion.div>

        <motion.div
          className="relative rounded-2xl border overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.08)' }}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <AnimatePresence mode="wait">
            {/* ── Success state ── */}
            {status === 'success' && (
              <motion.div
                key="success"
                className="flex flex-col items-center justify-center gap-5 py-20 px-8 text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center">
                  <CheckCircle2 size={32} className="text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">¡Recibido!</h3>
                  <p className="text-[#8A8F98]">
                    Nos pondremos en contacto contigo en menos de 24 horas para
                    agendar tu sesión estratégica.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── Form state ── */}
            {status !== 'success' && (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                className="p-8 md:p-10 flex flex-col gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                noValidate
                aria-label="Formulario de consultoría estratégica"
              >
                <div className="grid sm:grid-cols-2 gap-5">
                  <InputField label="Nombre completo" id="name" required placeholder="Ana García" />
                  <InputField label="Email profesional" id="email" type="email" required placeholder="ana@empresa.com" />
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <InputField label="Empresa" id="company" placeholder="Tu empresa S.A." />
                  <InputField label="Teléfono (opcional)" id="phone" type="tel" placeholder="+56 9 0000 0000" />
                </div>

                {/* Service selector */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-[#EDEDEF]" id="services-label">
                    ¿En qué podemos ayudarte?
                  </span>
                  <div className="flex flex-wrap gap-2" role="group" aria-labelledby="services-label">
                    {services.map(service => (
                      <button
                        key={service}
                        type="button"
                        onClick={() => toggleService(service)}
                        aria-pressed={selectedServices.includes(service)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 cursor-pointer"
                        style={{
                          background:   selectedServices.includes(service) ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                          borderColor:  selectedServices.includes(service) ? 'rgba(99,102,241,0.4)'  : 'rgba(255,255,255,0.1)',
                          color:        selectedServices.includes(service) ? '#818CF8'               : '#8A8F98',
                        }}
                      >
                        {service}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <InputField label="Cuéntanos sobre tu negocio" id="message">
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    placeholder="¿Cuál es tu mayor reto de crecimiento? ¿Cuántos leads generás al mes? ¿Qué quieres automatizar?"
                    className="w-full px-4 py-3 rounded-xl border text-[#EDEDEF] placeholder-[#4A505A] text-sm resize-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}
                    onFocus={e => {
                      e.target.style.borderColor = 'rgba(99,102,241,0.5)'
                      e.target.style.background  = 'rgba(99,102,241,0.06)'
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = 'rgba(255,255,255,0.1)'
                      e.target.style.background  = 'rgba(255,255,255,0.04)'
                    }}
                  />
                </InputField>

                {/* Error message */}
                {status === 'error' && (
                  <motion.div
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/8 text-red-300 text-sm"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    role="alert"
                    aria-live="polite"
                  >
                    <AlertCircle size={16} className="flex-shrink-0" />
                    {errorMsg}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="flex items-center justify-center gap-2.5 w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 hover:-translate-y-0.5 disabled:hover:translate-y-0"
                  aria-busy={status === 'loading'}
                >
                  {status === 'loading' ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Quiero mi sesión gratuita
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-[#4A505A]">
                  Sin spam. Nunca compartiremos tus datos. Respondemos en &lt;24h.
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}
