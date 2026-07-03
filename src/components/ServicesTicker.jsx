import Marquee from './fx/Marquee'

const items = [
  'Paid Media', 'Contenido & Video', 'Automatización con IA', 'Meta Ads',
  'Google Ads', 'Edición de Reels', 'CRM & Seguimiento', 'Analítica',
  'Estrategia de Growth', 'Chatbots IA',
]

// Cinta de servicios entre el hero y la primera sección.
export default function ServicesTicker() {
  return (
    <div
      className="relative py-5 md:py-6 border-y"
      style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.015)' }}
      aria-hidden="true"
    >
      <Marquee
        items={items}
        duration={36}
        itemClassName="text-sm md:text-base font-medium uppercase tracking-[0.2em] text-white/40"
      />
    </div>
  )
}
