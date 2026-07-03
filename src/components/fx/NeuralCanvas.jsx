import { useRef, useEffect } from 'react'

// Red neuronal generativa: nodos que derivan, se conectan por cercanía,
// siguen sutilmente al cursor y hacen parallax por capas con el scroll.
// Reemplaza al video de fondo — mismo mood, 0 bytes de descarga.
export default function NeuralCanvas({ className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let raf = 0
    let running = true
    let w = 0
    let h = 0
    const mouse = { x: -9999, y: -9999 }
    let scrollOffset = 0

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const COUNT = w < 768 ? 42 : 78
    const LINK = w < 768 ? 110 : 140
    const parts = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 1.7 + 0.7,
      depth: Math.random() * 0.7 + 0.3, // capa de parallax
      violet: Math.random() > 0.55,
    }))

    function onMouse(e) {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }
    function onLeave() {
      mouse.x = -9999
      mouse.y = -9999
    }
    function onScroll() {
      scrollOffset = window.scrollY
    }

    function frame() {
      ctx.clearRect(0, 0, w, h)

      // Posiciones proyectadas (con parallax de scroll por profundidad)
      const proj = parts.map(p => ({
        p,
        x: p.x,
        y: p.y - scrollOffset * p.depth * 0.18,
      }))

      // Conexiones
      for (let i = 0; i < proj.length; i++) {
        for (let j = i + 1; j < proj.length; j++) {
          const dx = proj[i].x - proj[j].x
          const dy = proj[i].y - proj[j].y
          const d = Math.hypot(dx, dy)
          if (d < LINK) {
            ctx.strokeStyle = `rgba(129,140,248,${((1 - d / LINK) * 0.26).toFixed(3)})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(proj[i].x, proj[i].y)
            ctx.lineTo(proj[j].x, proj[j].y)
            ctx.stroke()
          }
        }
      }

      // Nodos
      for (const { p, x, y } of proj) {
        ctx.fillStyle = p.violet
          ? `rgba(139,92,246,${0.45 + p.depth * 0.45})`
          : `rgba(99,102,241,${0.45 + p.depth * 0.45})`
        ctx.beginPath()
        ctx.arc(x, y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    function tick() {
      if (!running) return
      for (const p of parts) {
        p.x += p.vx
        p.y += p.vy

        // Atracción suave hacia el cursor
        const dx = mouse.x - p.x
        const dy = mouse.y - p.y
        const d2 = dx * dx + dy * dy
        if (d2 < 32400 && d2 > 1) {
          const d = Math.sqrt(d2)
          p.x += (dx / d) * 0.32
          p.y += (dy / d) * 0.32
        }

        // Wrap en los bordes
        if (p.x < -25) p.x = w + 25
        if (p.x > w + 25) p.x = -25
        if (p.y < -25) p.y = h + 25
        if (p.y > h + 25) p.y = -25
      }
      frame()
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMouse, { passive: true })
    window.addEventListener('mouseout', onLeave)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', resize)

    // Pausar cuando el hero sale de pantalla (ahorro de CPU/batería)
    const observer = new IntersectionObserver(([entry]) => {
      const wasRunning = running
      running = entry.isIntersecting && !reduced
      if (running && !wasRunning) raf = requestAnimationFrame(tick)
    })
    observer.observe(canvas)

    if (reduced) {
      frame() // un frame estático: composición sin movimiento
    } else {
      raf = requestAnimationFrame(tick)
    }

    return () => {
      running = false
      cancelAnimationFrame(raf)
      observer.disconnect()
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('mouseout', onLeave)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className={`w-full h-full ${className}`} aria-hidden="true" />
}
