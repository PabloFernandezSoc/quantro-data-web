import { Mail } from 'lucide-react'
import Logo from './Logo'

const WhatsAppIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
)

const socialLinks = [
  { Icon: WhatsAppIcon, label: 'WhatsApp', href: 'https://wa.me/56939568768' },
  { Icon: Mail, label: 'Email', href: 'mailto:quantrodata@gmail.com', size: 15 },
]

export default function Footer() {
  return (
    <footer className="border-t py-12" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo size={28} />

          <p className="text-xs text-[#4A505A] text-center">
            © {new Date().getFullYear()} Quantro Data. Automatización &amp; Growth Intelligence.
          </p>

          <div className="flex items-center gap-4">
            {socialLinks.map(({ Icon, label, href, size }) => (
              <a
                key={label}
                href={href}
                {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                aria-label={label}
                className="w-8 h-8 rounded-lg border border-white/8 bg-white/4 flex items-center justify-center text-[#8A8F98] hover:text-white hover:border-white/16 hover:bg-white/8 transition-all duration-200 cursor-pointer"
              >
                {size ? <Icon size={size} /> : <Icon />}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
