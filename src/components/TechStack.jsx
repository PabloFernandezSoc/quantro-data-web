import { useRef } from 'react'
import { motion, useInView } from 'motion/react'

const tools = [
  {
    name: 'Python',
    category: 'Automatización',
    color: '#3B82F6',
    size: '2x1',
    description: 'Scripts de procesamiento y pipelines de datos a medida',
    icon: (
      <svg viewBox="0 0 128 128" className="w-10 h-10">
        <linearGradient id="py-a" x1="70.252" y1="1237.476" x2="170.659" y2="1151.089" gradientUnits="userSpaceOnUse" gradientTransform="matrix(.563 0 0 -.568 -29.215 707.817)">
          <stop offset="0" stopColor="#5A9FD4"/><stop offset="1" stopColor="#306998"/>
        </linearGradient>
        <linearGradient id="py-b" x1="209.474" y1="1098.811" x2="173.62" y2="1149.537" gradientUnits="userSpaceOnUse" gradientTransform="matrix(.563 0 0 -.568 -29.215 707.817)">
          <stop offset="0" stopColor="#FFD43B"/><stop offset="1" stopColor="#FFE873"/>
        </linearGradient>
        <path fill="url(#py-a)" d="M63.391 1.988c-4.222.02-8.252.379-11.8 1.007-10.45 1.846-12.346 5.71-12.346 12.837v9.411h24.693v3.137H29.977c-7.176 0-13.46 4.313-15.426 12.521-2.268 9.405-2.368 15.275 0 25.096 1.755 7.311 5.947 12.519 13.124 12.519h8.491V67.234c0-8.151 7.051-15.34 15.426-15.34h24.665c6.866 0 12.346-5.654 12.346-12.548V15.833c0-6.693-5.646-11.72-12.346-12.837-4.244-.706-8.645-1.027-12.866-1.008zM50.037 9.557c2.55 0 4.634 2.117 4.634 4.721 0 2.593-2.083 4.69-4.634 4.69-2.56 0-4.633-2.097-4.633-4.69-.001-2.604 2.073-4.721 4.633-4.721z"/>
        <path fill="url(#py-b)" d="M91.682 28.38v10.966c0 8.5-7.208 15.655-15.426 15.655H51.591c-6.756 0-12.346 5.783-12.346 12.549v23.515c0 6.691 5.818 10.628 12.346 12.547 7.816 2.297 15.312 2.713 24.665 0 6.216-1.801 12.346-5.423 12.346-12.547v-9.412H63.938v-3.138h37.012c7.176 0 9.852-5.005 12.348-12.519 2.578-7.735 2.467-15.174 0-25.096-1.774-7.145-5.161-12.521-12.348-12.521h-9.268zM77.809 87.927c2.561 0 4.634 2.097 4.634 4.692 0 2.602-2.074 4.719-4.634 4.719-2.55 0-4.633-2.117-4.633-4.719 0-2.595 2.083-4.692 4.633-4.692z"/>
      </svg>
    ),
  },
  {
    name: 'n8n',
    category: 'Orquestación',
    color: '#EA4B71',
    size: '1x1',
    description: 'Workflows visuales',
    icon: (
      <svg viewBox="0 0 100 100" className="w-10 h-10" fill="none">
        <rect width="100" height="100" rx="24" fill="#EA4B71"/>
        <circle cx="30" cy="50" r="12" fill="white"/>
        <circle cx="70" cy="50" r="12" fill="white"/>
        <path d="M42 50h16" stroke="white" strokeWidth="4" strokeLinecap="round"/>
        <circle cx="30" cy="50" r="5" fill="#EA4B71"/>
        <circle cx="70" cy="50" r="5" fill="#EA4B71"/>
      </svg>
    ),
  },
  {
    name: 'Claude AI',
    category: 'Inteligencia',
    color: '#D97706',
    size: '1x1',
    description: 'IA conversacional',
    icon: (
      <svg viewBox="0 0 100 100" className="w-10 h-10" fill="none">
        <rect width="100" height="100" rx="24" fill="#D97706"/>
        <path d="M50 20 C35 20 25 32 25 50 C25 62 33 72 44 76 L50 80 L56 76 C67 72 75 62 75 50 C75 32 65 20 50 20Z" fill="white" opacity="0.9"/>
        <path d="M42 48 L50 56 L58 44" stroke="#D97706" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    name: 'Google Ads',
    category: 'Paid Media',
    color: '#4285F4',
    size: '1x1',
    description: 'Search & Display',
    icon: (
      <svg viewBox="0 0 100 100" className="w-10 h-10" fill="none">
        <rect width="100" height="100" rx="24" fill="#1a1a2e"/>
        <circle cx="38" cy="50" r="14" fill="none" stroke="#4285F4" strokeWidth="6"/>
        <circle cx="62" cy="50" r="14" fill="none" stroke="#EA4335" strokeWidth="6"/>
        <circle cx="50" cy="38" r="14" fill="none" stroke="#FBBC04" strokeWidth="6"/>
        <circle cx="50" cy="62" r="14" fill="none" stroke="#34A853" strokeWidth="6"/>
      </svg>
    ),
  },
  {
    name: 'Meta Ads',
    category: 'Paid Media',
    color: '#0866FF',
    size: '1x1',
    description: 'Facebook & Instagram',
    icon: (
      <svg viewBox="0 0 100 100" className="w-10 h-10" fill="none">
        <rect width="100" height="100" rx="24" fill="#0866FF"/>
        <path d="M50 22C34.536 22 22 34.536 22 50C22 63.978 32.176 75.555 45.5 77.666V58.5H38V50H45.5V43.5C45.5 36.094 49.888 32 56.614 32C59.832 32 63.2 32.562 63.2 32.562V39.875H59.488C55.84 39.875 54.75 42.05 54.75 44.281V50H62.875L61.629 58.5H54.75V77.666C68.074 75.555 78.25 63.978 78.25 50C78.25 34.536 65.464 22 50 22Z" fill="white"/>
      </svg>
    ),
  },
  {
    name: 'HubSpot',
    category: 'CRM',
    color: '#FF7A59',
    size: '1x1',
    description: 'CRM & Pipeline',
    icon: (
      <svg viewBox="0 0 100 100" className="w-10 h-10" fill="none">
        <rect width="100" height="100" rx="24" fill="#FF7A59"/>
        <circle cx="50" cy="36" r="10" fill="white"/>
        <circle cx="28" cy="64" r="8" fill="white"/>
        <circle cx="72" cy="64" r="8" fill="white"/>
        <path d="M50 46 L28 56M50 46 L72 56" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    name: 'WhatsApp API',
    category: 'Comunicación',
    color: '#25D366',
    size: '1x1',
    description: 'Mensajería directa',
    icon: (
      <svg viewBox="0 0 100 100" className="w-10 h-10" fill="none">
        <rect width="100" height="100" rx="24" fill="#25D366"/>
        <path d="M50 22C34.536 22 22 34.536 22 50C22 55.336 23.534 60.332 26.202 64.532L22.5 77.5L35.84 73.858C39.882 76.24 44.78 77.666 50 77.666C65.464 77.666 78 65.13 78 49.666C78 34.202 65.464 22 50 22ZM41.5 44C41.5 44 43 46 44.5 48C45.5 49.5 44 51.5 43 52.5C44.5 55 47.5 57 50 58C52.5 59 54 57 55 56.5C56.5 57.5 59.5 59.5 60 60C60.5 60.5 59.5 63 57.5 63.5C55.5 64 49 62 44.5 56.5C40 51 39.5 46.5 40 45C40.5 43.5 41.5 44 41.5 44Z" fill="white"/>
      </svg>
    ),
  },
  {
    name: 'Analytics & BI',
    category: 'Datos',
    color: '#6366F1',
    size: '2x1',
    description: 'Dashboards en tiempo real y toma de decisiones basada en datos para escalar con certeza',
    icon: (
      <svg viewBox="0 0 100 100" className="w-10 h-10" fill="none">
        <rect width="100" height="100" rx="24" fill="#6366F1"/>
        <rect x="22" y="62" width="14" height="20" rx="3" fill="white" opacity="0.6"/>
        <rect x="43" y="44" width="14" height="38" rx="3" fill="white" opacity="0.8"/>
        <rect x="64" y="28" width="14" height="54" rx="3" fill="white"/>
        <path d="M28 55 L50 42 L71 30" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 3"/>
      </svg>
    ),
  },
]

function ToolCard({ tool, index }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  // 2x1 cards span full width on mobile (col-span-2), half on desktop (md:col-span-2 of 4)
  const spanClass = tool.size === '2x1' ? 'col-span-2' : 'col-span-1'

  return (
    <motion.div
      ref={ref}
      className={`group relative rounded-2xl border overflow-hidden cursor-default ${spanClass}`}
      style={{
        background: 'rgba(255,255,255,0.025)',
        borderColor: 'rgba(255,255,255,0.07)',
        minHeight: 140,
      }}
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(circle at 30% 30%, ${tool.color}10, transparent 70%)` }}
      />

      <div className="relative z-10 p-5 md:p-6 h-full flex flex-col justify-between">
        <div className="flex flex-col gap-3">
          <div className="w-12 h-12 flex items-center justify-center" aria-hidden="true">
            {tool.icon}
          </div>
          <div>
            <div className="font-semibold text-white text-sm md:text-base">{tool.name}</div>
            <div className="text-xs mt-0.5" style={{ color: tool.color }}>{tool.category}</div>
          </div>
        </div>
        {tool.description && (
          <p className="text-xs md:text-sm text-[#8A8F98] leading-relaxed mt-3">{tool.description}</p>
        )}
      </div>

      {/* Border accent on hover */}
      <div
        className="absolute inset-0 rounded-2xl border-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ borderColor: `${tool.color}25` }}
      />
    </motion.div>
  )
}

export default function TechStack() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="stack" className="py-20 md:py-32 relative" aria-labelledby="stack-title">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          ref={ref}
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium border border-violet-500/20 bg-violet-500/8 text-violet-300 mb-4 uppercase tracking-widest">
            Tech Stack
          </span>
          <h2 id="stack-title" className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white tracking-tight mb-4">
            Las mejores herramientas,{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #A78BFA, #818CF8)' }}>
              en las manos correctas
            </span>
          </h2>
          <p className="text-[#8A8F98] text-base md:text-lg max-w-xl mx-auto">
            Dominamos el ecosistema completo de automatización y growth para construir sistemas
            que funcionan sin supervisión constante.
          </p>
        </motion.div>

        {/* Grid: 2 cols mobile, 4 cols desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {tools.map((tool, i) => (
            <ToolCard key={tool.name} tool={tool} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
