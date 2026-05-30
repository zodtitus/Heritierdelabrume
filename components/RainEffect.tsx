'use client'

import { useEffect, useRef } from 'react'

interface Drop {
  x: number
  y: number
  length: number
  speed: number
  opacity: number
  width: number
}

function createDrop(width: number, height: number): Drop {
  return {
    x: Math.random() * (width + 200) - 100,
    y: Math.random() * height - height,
    length: Math.random() * 14 + 8,
    speed: Math.random() * 3 + 2.5,
    opacity: Math.random() * 0.09 + 0.03,
    width: Math.random() * 0.5 + 0.3,
  }
}

export default function RainEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const DROPS_COUNT = 120
    const ANGLE = Math.PI / 12 // ~15 degrés

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const drops: Drop[] = Array.from({ length: DROPS_COUNT }, () =>
      createDrop(canvas.width, canvas.height)
    )

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      drops.forEach(d => {
        ctx.save()
        ctx.strokeStyle = `rgba(138, 180, 201, ${d.opacity})`
        ctx.lineWidth = d.width
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(d.x, d.y)
        ctx.lineTo(
          d.x + Math.sin(ANGLE) * d.length,
          d.y + Math.cos(ANGLE) * d.length
        )
        ctx.stroke()
        ctx.restore()

        d.x += Math.sin(ANGLE) * d.speed * 0.4
        d.y += Math.cos(ANGLE) * d.speed

        if (d.y > canvas.height + 20) {
          Object.assign(d, createDrop(canvas.width, canvas.height))
          d.y = -d.length
        }
      })

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
      }}
    />
  )
}
