import { motion } from 'motion/react'

// Titular que emerge palabra por palabra desde una máscara (efecto agencia).
// Acepta className/style para variantes con gradiente.
export default function WordReveal({ text, className = '', style, delay = 0, stagger = 0.045, once = true }) {
  const words = text.split(' ')
  return (
    <span aria-label={text} role="text">
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em]">
          <motion.span
            className={`inline-block will-change-transform ${className}`}
            style={style}
            initial={{ y: '115%' }}
            whileInView={{ y: 0 }}
            viewport={{ once, margin: '-40px' }}
            transition={{ duration: 0.75, delay: delay + i * stagger, ease: [0.16, 1, 0.3, 1] }}
          >
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  )
}
