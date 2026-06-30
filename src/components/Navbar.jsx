import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { Menu, X } from 'lucide-react'
import Logo from './Logo'

const links = [
  { label: 'Servicios', href: '#servicios' },
  { label: 'Workflows', href: '#workflows' },
  { label: 'Proceso', href: '#proceso' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contacto', href: '#contacto' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useScroll()

  useEffect(() => {
    const unsub = scrollY.on('change', v => setScrolled(v > 40))
    return unsub
  }, [scrollY])

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? 'rgba(5, 5, 6, 0.85)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
      }}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a
          href="#"
          className="flex items-center group transition-transform duration-200 hover:scale-[1.02]"
          aria-label="Quantro Data inicio"
        >
          <Logo size={32} />
        </a>

        <ul className="hidden md:flex items-center gap-1" role="list">
          {links.map(link => (
            <li key={link.href}>
              <a
                href={link.href}
                className="px-4 py-2 text-sm text-[#8A8F98] hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3">
          <a
            href="#contacto"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all duration-200 cursor-pointer shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
          >
            Agendar sesión →
          </a>
        </div>

        <button
          className="md:hidden p-2 rounded-lg text-[#8A8F98] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="md:hidden border-t border-white/6 bg-[#050506]/95 backdrop-blur-xl"
        >
          <ul className="px-6 py-4 flex flex-col gap-1" role="list">
            {links.map(link => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block px-4 py-3 text-sm text-[#8A8F98] hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="pt-2">
              <a
                href="#contacto"
                className="block px-4 py-3 text-sm font-medium text-center text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer"
                onClick={() => setOpen(false)}
              >
                Agendar sesión →
              </a>
            </li>
          </ul>
        </motion.div>
      )}
    </motion.header>
  )
}
