import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import WordReveal from './fx/WordReveal'
import GhostTitle from './fx/GhostTitle'

/* ── Iconos SVG de cada herramienta ─────────────────────────── */

const icons = {
  meta: (
    <svg viewBox="0 0 100 100" className="w-10 h-10" fill="none">
      <rect width="100" height="100" rx="24" fill="#0866FF"/>
      <path
        d="M28 50 C28 40 36 36 43 43 L57 57 C64 64 72 60 72 50 C72 40 64 36 57 43 L43 57 C36 64 28 60 28 50 Z"
        stroke="white"
        strokeWidth="8"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  google: (
    <svg viewBox="0 0 100 100" className="w-10 h-10" fill="none">
      <rect width="100" height="100" rx="24" fill="#1a1a2e"/>
      <line x1="34" y1="64" x2="51" y2="33" stroke="#FBBC04" strokeWidth="17" strokeLinecap="round"/>
      <line x1="49" y1="33" x2="66" y2="64" stroke="#4285F4" strokeWidth="17" strokeLinecap="round"/>
      <circle cx="34" cy="64" r="9.5" fill="#34A853"/>
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 100 100" className="w-10 h-10" fill="none">
      <rect width="100" height="100" rx="24" fill="#0a0a0c"/>
      <g fill="none" strokeWidth="9" strokeLinecap="round">
        <g transform="translate(-2.5 -2)" stroke="#25F4EE">
          <path d="M54 28v31a12 12 0 1 1-10-11.8"/>
          <path d="M54 30c2.5 8 8.5 13 16 13.5"/>
        </g>
        <g transform="translate(2.5 2)" stroke="#FE2C55">
          <path d="M54 28v31a12 12 0 1 1-10-11.8"/>
          <path d="M54 30c2.5 8 8.5 13 16 13.5"/>
        </g>
        <g stroke="white">
          <path d="M54 28v31a12 12 0 1 1-10-11.8"/>
          <path d="M54 30c2.5 8 8.5 13 16 13.5"/>
        </g>
      </g>
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 100 100" className="w-10 h-10" fill="none">
      <rect width="100" height="100" rx="24" fill="#25D366"/>
      <path d="M50 22C34.536 22 22 34.536 22 50C22 55.336 23.534 60.332 26.202 64.532L22.5 77.5L35.84 73.858C39.882 76.24 44.78 77.666 50 77.666C65.464 77.666 78 65.13 78 49.666C78 34.202 65.464 22 50 22ZM41.5 44C41.5 44 43 46 44.5 48C45.5 49.5 44 51.5 43 52.5C44.5 55 47.5 57 50 58C52.5 59 54 57 55 56.5C56.5 57.5 59.5 59.5 60 60C60.5 60.5 59.5 63 57.5 63.5C55.5 64 49 62 44.5 56.5C40 51 39.5 46.5 40 45C40.5 43.5 41.5 44 41.5 44Z" fill="white"/>
    </svg>
  ),
  n8n: (
    <svg viewBox="0 0 100 100" className="w-10 h-10" fill="none">
      <rect width="100" height="100" rx="24" fill="#EA4B71"/>
      <circle cx="30" cy="50" r="12" fill="white"/>
      <circle cx="70" cy="50" r="12" fill="white"/>
      <path d="M42 50h16" stroke="white" strokeWidth="4" strokeLinecap="round"/>
      <circle cx="30" cy="50" r="5" fill="#EA4B71"/>
      <circle cx="70" cy="50" r="5" fill="#EA4B71"/>
    </svg>
  ),
  python: (
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
  claude: (
    <svg viewBox="0 0 100 100" className="w-10 h-10" fill="none">
      <rect width="100" height="100" rx="24" fill="#D97757"/>
      <g stroke="white" strokeWidth="6.5" strokeLinecap="round">
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * Math.PI) / 6
          const r2 = i % 2 ? 24 : 29
          return (
            <line
              key={i}
              x1={50 + Math.cos(a) * 11}
              y1={50 + Math.sin(a) * 11}
              x2={50 + Math.cos(a) * r2}
              y2={50 + Math.sin(a) * r2}
            />
          )
        })}
      </g>
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 100 100" className="w-10 h-10" fill="none">
      <rect width="100" height="100" rx="24" fill="#1a1a2e"/>
      <rect x="60" y="24" width="17" height="52" rx="8.5" fill="#F9AB00"/>
      <rect x="41" y="43" width="17" height="33" rx="8.5" fill="#F9AB00" opacity="0.8"/>
      <circle cx="31" cy="67" r="9" fill="#E37400"/>
    </svg>
  ),
  looker: (
    <svg viewBox="0 0 100 100" className="w-10 h-10" fill="none">
      <rect width="100" height="100" rx="24" fill="#1a1a2e"/>
      <rect x="56" y="26" width="17" height="48" rx="8.5" fill="#4285F4"/>
      <rect x="26" y="57" width="30" height="17" rx="8.5" fill="#669DF6"/>
      <circle cx="34" cy="34" r="9" fill="#AECBFA"/>
    </svg>
  ),
  powerbi: (
    <svg viewBox="0 0 100 100" className="w-10 h-10" fill="none">
      <rect width="100" height="100" rx="24" fill="#F2C811"/>
      <rect x="24" y="48" width="14" height="28" rx="3" fill="#12100B" opacity="0.75"/>
      <rect x="43" y="36" width="14" height="40" rx="3" fill="#12100B" opacity="0.88"/>
      <rect x="62" y="24" width="14" height="52" rx="3" fill="#12100B"/>
    </svg>
  ),
  tableau: (
    <svg viewBox="0 0 100 100" className="w-10 h-10" fill="none">
      <rect width="100" height="100" rx="24" fill="#0f1420"/>
      <g strokeLinecap="round">
        <path d="M50 36v28M36 50h28" stroke="#5C6692" strokeWidth="8"/>
        <path d="M50 20v12M44 26h12" stroke="#F28E2B" strokeWidth="5"/>
        <path d="M50 68v12M44 74h12" stroke="#F28E2B" strokeWidth="5"/>
        <path d="M24 50h12M30 44v12" stroke="#59A9CF" strokeWidth="5"/>
        <path d="M64 50h12M70 44v12" stroke="#59A9CF" strokeWidth="5"/>
      </g>
    </svg>
  ),
  openclaw: (
    <svg viewBox="0 0 100 100" className="w-10 h-10" fill="none">
      <rect width="100" height="100" rx="24" fill="#0F766E"/>
      <g stroke="white" strokeWidth="7" strokeLinecap="round">
        <path d="M30 72c-4-20 4-36 20-42"/>
        <path d="M46 74c-2-16 4-28 16-34"/>
        <path d="M62 74c0-11 5-19 13-24"/>
      </g>
      <circle cx="52" cy="28" r="4.5" fill="white"/>
    </svg>
  ),
}

/* ── Grupos por pilar ───────────────────────────────────────── */

const groups = [
  {
    label: 'Paid Media',
    color: '#6366F1',
    tools: [
      { name: 'Meta Ads', description: 'Facebook & Instagram', icon: icons.meta },
      { name: 'Google Ads', description: 'Search & Display', icon: icons.google },
      { name: 'TikTok Ads', description: 'Video corto & awareness', icon: icons.tiktok },
      { name: 'WhatsApp API', description: 'Mensajería directa', icon: icons.whatsapp },
    ],
  },
  {
    label: 'Automatización & IA',
    color: '#8B5CF6',
    tools: [
      { name: 'n8n', description: 'Workflows visuales', icon: icons.n8n },
      { name: 'Python', description: 'Scripts y pipelines a medida', icon: icons.python },
      { name: 'Claude', description: 'IA para contexto y creatividad', icon: icons.claude },
      { name: 'OpenClaw', description: 'Agentes IA autónomos', icon: icons.openclaw },
    ],
  },
  {
    label: 'Datos & Análisis',
    color: '#06B6D4',
    tools: [
      { name: 'Analytics 4', description: 'Tracking y comportamiento', icon: icons.analytics },
      { name: 'Looker Studio', description: 'Dashboards en tiempo real', icon: icons.looker },
      { name: 'Power BI', description: 'Reportería corporativa', icon: icons.powerbi },
      { name: 'Tableau', description: 'Visualización avanzada', icon: icons.tableau },
    ],
  },
]

function ToolCard({ tool, color, index }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      className="group relative rounded-2xl border overflow-hidden cursor-default"
      style={{
        background: 'rgba(255,255,255,0.025)',
        borderColor: 'rgba(255,255,255,0.07)',
        minHeight: 120,
      }}
      initial={{ opacity: 0, y: 24, scale: 0.95, rotate: index % 2 ? 1.5 : -1.5 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1, rotate: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(circle at 30% 30%, ${color}12, transparent 70%)` }}
      />
      <div className="relative z-10 p-5 flex items-center gap-4">
        <div className="w-12 h-12 flex items-center justify-center flex-shrink-0" aria-hidden="true">
          {tool.icon}
        </div>
        <div>
          <div className="font-semibold text-white text-sm md:text-base">{tool.name}</div>
          <p className="text-xs md:text-sm text-[#8A8F98] mt-0.5">{tool.description}</p>
        </div>
      </div>
      <div
        className="absolute inset-0 rounded-2xl border-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ borderColor: `${color}25` }}
      />
    </motion.div>
  )
}

function ToolGroup({ group, groupIndex }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: groupIndex * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Etiqueta del pilar */}
      <div className="flex items-center gap-3 mb-4">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: group.color, boxShadow: `0 0 12px ${group.color}` }}
          aria-hidden="true"
        />
        <h3
          className="text-xs font-semibold uppercase tracking-[0.2em]"
          style={{ color: group.color }}
        >
          {group.label}
        </h3>
        <div className="flex-1 h-px" style={{ background: `${group.color}20` }} aria-hidden="true" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {group.tools.map((tool, i) => (
          <ToolCard key={tool.name} tool={tool} color={group.color} index={i} />
        ))}
      </div>
    </motion.div>
  )
}

export default function TechStack() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="stack" className="py-20 md:py-32 relative overflow-hidden" aria-labelledby="stack-title">
      <GhostTitle text="STACK" direction={-1} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
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
          <h2 id="stack-title" className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-4">
            <WordReveal text="Las mejores herramientas," />{' '}
            <WordReveal
              text="en las manos correctas"
              delay={0.18}
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #A78BFA, #818CF8)' }}
            />
          </h2>
          <p className="text-[#8A8F98] text-base md:text-lg max-w-xl mx-auto">
            Organizadas igual que nuestros servicios: cada pilar con su arsenal.
          </p>
        </motion.div>

        <div className="flex flex-col gap-10">
          {groups.map((group, i) => (
            <ToolGroup key={group.label} group={group} groupIndex={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
