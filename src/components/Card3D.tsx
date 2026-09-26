import { useEffect, useRef, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  /** Resting angles in degrees. Negative Y turns the card to face left. */
  restY?: number
  restX?: number
  /** Extra things (balls, badges) floating in front of the card. */
  floaters?: ReactNode
  className?: string
}

const EDGE_LAYERS = 12

/**
 * A card with real depth: perspective tilt that follows the pointer,
 * a paper-thick edge, a moving glossy highlight and a soft floor shadow.
 * All motion is driven by CSS variables, so React doesn't re-render on move.
 */
export default function Card3D({ children, restY = -18, restX = 10, floaters, className = '' }: Props) {
  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const set = (ry: number, rx: number, gx: number, gy: number) => {
      stage.style.setProperty('--ry', `${ry}deg`)
      stage.style.setProperty('--rx', `${rx}deg`)
      stage.style.setProperty('--gx', `${gx}%`)
      stage.style.setProperty('--gy', `${gy}%`)
    }
    set(restY, restX, 30, 20)
    if (reduced || coarse) return

    let frame = 0
    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect()
      const px = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1) - 0.5
      const py = Math.min(Math.max((e.clientY - r.top) / r.height, 0), 1) - 0.5
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        // Hovering straightens the card (like the original), then it leans toward the pointer.
        set(restY * 0.35 + px * 22, restX * 0.35 - py * 18, 50 + px * 90, 50 + py * 90)
        stage.classList.add('is-active')
      })
    }
    const onLeave = () => {
      cancelAnimationFrame(frame)
      stage.classList.remove('is-active')
      set(restY, restX, 30, 20)
    }
    stage.addEventListener('pointermove', onMove)
    stage.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(frame)
      stage.removeEventListener('pointermove', onMove)
      stage.removeEventListener('pointerleave', onLeave)
    }
  }, [restX, restY])

  return (
    <div className={`card3d-stage ${className}`} ref={stageRef}>
      <div className="card3d-float">
        <div className="card3d">
          {Array.from({ length: EDGE_LAYERS }, (_, i) => (
            <span
              key={i}
              className="card3d-edge"
              style={{ transform: `translateZ(${-(i + 1) * 1.5}px)` }}
              aria-hidden
            />
          ))}
          <div className="card3d-face">
            {children}
            <span className="card3d-gloss" aria-hidden />
          </div>
          {floaters}
        </div>
      </div>
      <span className="card3d-shadow" aria-hidden />
    </div>
  )
}
