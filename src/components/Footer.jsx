import { Zap, Mail } from 'lucide-react'

const LinkedinIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
)

const XIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

const socialLinks = [
  { Icon: LinkedinIcon, label: 'LinkedIn', href: '#' },
  { Icon: XIcon, label: 'Twitter / X', href: '#' },
  { Icon: Mail, label: 'Email', href: 'mailto:hola@quantrodata.com', size: 15 },
]

export default function Footer() {
  return (
    <footer className="border-t py-12" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Zap size={14} className="text-indigo-400" />
            </div>
            <span className="font-semibold text-white text-sm tracking-tight">
              Quantro <span className="text-indigo-400">Data</span>
            </span>
          </div>

          <p className="text-xs text-[#4A505A] text-center">
            © {new Date().getFullYear()} Quantro Data. Automatización &amp; Growth Intelligence.
          </p>

          <div className="flex items-center gap-4">
            {socialLinks.map(({ Icon, label, href, size }) => (
              <a
                key={label}
                href={href}
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
