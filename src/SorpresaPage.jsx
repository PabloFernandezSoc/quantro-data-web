import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Volume2, VolumeX, Play, RotateCcw } from 'lucide-react'

const CARTA = [
  'Esperando que te encuentres bien, quiero aprovechar este día para que recuerdes lo mucho que te amo y lo feliz que soy a tu lado. Quiero que sepas que no hay momento más feliz de mi existencia que cuando paso tiempo a tu lado. Me encanta poder compartir la existencia en este mundo contigo. Aunque a veces vea que el mundo es cruel y que parece una novela de terror a tu lado todo parece no solo bonito sino que digno de vivir y disfrutar.',
  'Te prometo que en el futuro en algún 21 de septiembre tendrás flores amarillas de nuestra huerta aunque suene muy hippie. Te amo infinito mi cielo.',
]

// Pétalos deterministas (nada de random en render para no romper hidratación)
const PETALOS = [
  { left: 4, delay: 0, dur: 13, size: 26, rot: -18 },
  { left: 13, delay: 3.5, dur: 16, size: 18, rot: 24 },
  { left: 22, delay: 1.2, dur: 11, size: 32, rot: 8 },
  { left: 31, delay: 6, dur: 15, size: 20, rot: -30 },
  { left: 40, delay: 2.4, dur: 12, size: 24, rot: 14 },
  { left: 49, delay: 8, dur: 17, size: 16, rot: -8 },
  { left: 58, delay: 0.8, dur: 14, size: 28, rot: 20 },
  { left: 67, delay: 4.6, dur: 12, size: 19, rot: -22 },
  { left: 76, delay: 7.2, dur: 16, size: 30, rot: 6 },
  { left: 85, delay: 2, dur: 13, size: 22, rot: -14 },
  { left: 93, delay: 5.4, dur: 15, size: 17, rot: 28 },
]

function Petalos() {
  return (
    <div className="petalos-layer" aria-hidden="true">
      {PETALOS.map((p, i) => (
        <span
          key={i}
          className="petalo"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            ['--rot']: `${p.rot}deg`,
          }}
        />
      ))}
    </div>
  )
}

// Atajo para previsualizar una etapa sin pasar por todo el flujo:
// /sorpresaparamirmorcius?ver=rata | video | carta
const ETAPAS = ['rata', 'video', 'carta']
function etapaInicial() {
  const ver = new URLSearchParams(window.location.search).get('ver')
  return ETAPAS.includes(ver) ? ver : 'intro'
}

export default function SorpresaPage() {
  const [etapa, setEtapa] = useState(etapaInicial) // intro | rata | video | carta
  const [preguntaAbierta, setPreguntaAbierta] = useState(false)
  const [silenciado, setSilenciado] = useState(false)
  const videoRef = useRef(null)

  useEffect(() => {
    const tituloPrevio = document.title
    document.title = 'Una sorpresa para Mir Morcius 🌻'
    window.scrollTo(0, 0)

    // Página oculta: que no la indexe nadie
    const robots = document.querySelector('meta[name="robots"]')
    const valorPrevio = robots?.getAttribute('content')
    robots?.setAttribute('content', 'noindex, nofollow')

    const t = etapaInicial() === 'intro'
      ? setTimeout(() => setPreguntaAbierta(true), 1600)
      : undefined
    return () => {
      clearTimeout(t)
      document.title = tituloPrevio
      if (robots && valorPrevio) robots.setAttribute('content', valorPrevio)
    }
  }, [])

  // Arranca el video en cuanto entramos a esa etapa (viene de un click, así que
  // el navegador deja reproducir con sonido; si no, caemos a mute)
  useEffect(() => {
    if (etapa !== 'video') return
    const v = videoRef.current
    if (!v) return
    v.muted = false
    setSilenciado(false)
    v.play().catch(() => {
      v.muted = true
      setSilenciado(true)
      v.play().catch(() => {})
    })
  }, [etapa])

  const decirSi = () => {
    setPreguntaAbierta(false)
    setEtapa('video')
  }

  const decirNo = () => {
    setPreguntaAbierta(false)
    setEtapa('rata')
  }

  const volverAPreguntar = () => {
    setEtapa('intro')
    setPreguntaAbierta(true)
  }

  const alternarSonido = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setSilenciado(v.muted)
  }

  return (
    <div className="sorpresa-root min-h-dvh relative overflow-hidden">
      {/* Fondo de flores amarillas */}
      <div className="sorpresa-fondo" aria-hidden="true" />
      <div className="sorpresa-velo" aria-hidden="true" />
      <Petalos />

      {/* Las etapas comparten la misma celda de grilla: la que entra se monta al
          instante (no espera a que la anterior termine de salir) */}
      <main className="sorpresa-escenario relative z-10 min-h-dvh px-5 py-16">
        <AnimatePresence>
          {/* ── Portada ──────────────────────────────────────── */}
          {etapa === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16, pointerEvents: 'none' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="sorpresa-etapa text-center max-w-3xl"
            >
              <motion.span
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="block text-5xl sm:text-6xl mb-6"
              >
                🌻
              </motion.span>

              <h1 className="sorpresa-titulo text-3xl sm:text-5xl md:text-6xl leading-[1.15]">
                Hay una sorpresa disponible para
                <br />
                <span className="serif-italic sorpresa-destacado">
                  Mir Morcius
                </span>
              </h1>

              {!preguntaAbierta && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.6 }}
                  onClick={() => setPreguntaAbierta(true)}
                  className="sorpresa-boton sorpresa-boton-si mt-10 inline-flex items-center gap-2"
                >
                  <Play size={16} />
                  Ábrela
                </motion.button>
              )}
            </motion.div>
          )}

          {/* ── La rata de la rabia ──────────────────────────── */}
          {etapa === 'rata' && (
            <motion.div
              key="rata"
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94, pointerEvents: 'none' }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="sorpresa-etapa text-center max-w-lg w-full"
            >
              <motion.div
                animate={{ rotate: [-1.5, 1.5, -1.5] }}
                transition={{ repeat: Infinity, duration: 0.35, ease: 'easeInOut' }}
                className="sorpresa-marco-rata"
              >
                <img
                  src="/sorpresa/rata-rabia.jpeg"
                  alt="Una rata apretando el puño de la rabia"
                  className="w-full rounded-xl"
                />
              </motion.div>

              <p className="sorpresa-texto-rata mt-6 text-lg sm:text-xl">
                Piénsalo bien panzona
              </p>

              <button
                onClick={volverAPreguntar}
                className="sorpresa-boton sorpresa-boton-si mt-7 inline-flex items-center gap-2"
              >
                <RotateCcw size={16} />
                Volver a reflexionar
              </button>
            </motion.div>
          )}

          {/* ── Animación ────────────────────────────────────── */}
          {etapa === 'video' && (
            <motion.div
              key="video"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, pointerEvents: 'none' }}
              transition={{ duration: 0.6 }}
              className="sorpresa-etapa w-full max-w-3xl"
            >
              <div className="sorpresa-marco-video">
                <video
                  ref={videoRef}
                  src="/sorpresa/animacion.mp4"
                  className="w-full h-auto block rounded-2xl"
                  playsInline
                  preload="auto"
                  onEnded={() => setEtapa('carta')}
                  onError={() => setEtapa('carta')}
                />
              </div>

              <div className="flex items-center justify-center gap-3 mt-5">
                <button
                  onClick={alternarSonido}
                  className="sorpresa-boton sorpresa-boton-suave inline-flex items-center gap-2"
                  aria-label={silenciado ? 'Activar sonido' : 'Silenciar'}
                >
                  {silenciado ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  {silenciado ? 'Activar sonido' : 'Sonido'}
                </button>
                <button
                  onClick={() => setEtapa('carta')}
                  className="sorpresa-boton sorpresa-boton-suave"
                >
                  Saltar a la carta →
                </button>
              </div>
            </motion.div>
          )}

          {/* ── La carta ─────────────────────────────────────── */}
          {etapa === 'carta' && (
            <motion.article
              key="carta"
              initial={{ opacity: 0, y: 40, rotate: -0.6 }}
              animate={{ opacity: 1, y: 0, rotate: -0.4 }}
              exit={{ opacity: 0, y: -20, pointerEvents: 'none' }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="sorpresa-etapa sorpresa-carta w-full max-w-2xl"
            >
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.7 }}
                className="sorpresa-carta-saludo serif-italic"
              >
                Estimada Mir Morcius,
              </motion.p>

              {CARTA.map((parrafo, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + i * 0.7, duration: 0.8 }}
                  className="sorpresa-carta-parrafo"
                >
                  {parrafo}
                </motion.p>
              ))}

              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="sorpresa-carta-firma"
              >
                <span className="text-3xl">🌻</span>
              </motion.div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3.2, duration: 0.6 }}
                onClick={() => setEtapa('video')}
                className="sorpresa-boton sorpresa-boton-carta mt-8 inline-flex items-center gap-2"
              >
                <RotateCcw size={15} />
                Ver la animación otra vez
              </motion.button>
            </motion.article>
          )}
        </AnimatePresence>
      </main>

      {/* ── Popup: ¿canjeas la sorpresa? ───────────────────── */}
      <AnimatePresence>
        {preguntaAbierta && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" aria-hidden="true" />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="sorpresa-pregunta"
              initial={{ opacity: 0, scale: 0.9, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="sorpresa-modal relative w-full max-w-md text-center"
            >
              <span className="block text-4xl mb-3">💛</span>
              <h2 id="sorpresa-pregunta" className="sorpresa-modal-titulo">
                ¿Quieres canjear tu sorpresa?
              </h2>
              <p className="sorpresa-modal-texto">
                Ojito con tu respuesta.
              </p>

              <div className="flex items-center justify-center gap-3 mt-7">
                <button onClick={decirSi} className="sorpresa-boton sorpresa-boton-si" autoFocus>
                  Sí
                </button>
                <button onClick={decirNo} className="sorpresa-boton sorpresa-boton-no">
                  No
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
