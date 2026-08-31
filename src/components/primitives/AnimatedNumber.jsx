/* =============================================================================
   AnimatedNumber — the rate ticker and the running savings counter.

   The brief asks for "a subtle number roll, never a jarring flash". A CSS
   transition can't interpolate text content, so this is the one place in the
   app that tweens a value in JavaScript rather than in CSS. It therefore has to
   honour prefers-reduced-motion itself — the global override in base.css only
   reaches CSS animations, so it cannot help here.
   ============================================================================= */

import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../../state/useSimulator.js'

const easeOut = (t) => 1 - Math.pow(1 - t, 3)

export default function AnimatedNumber({
  value,
  format = (n) => n.toFixed(2),
  duration = 420,
  className = '',
  as: Tag = 'span',
  ...rest
}) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const frameRef = useRef(null)

  useEffect(() => {
    const from = fromRef.current
    const to = value

    if (from === to) return undefined

    if (prefersReducedMotion()) {
      fromRef.current = to
      setDisplay(to)
      return undefined
    }

    const start = performance.now()

    const step = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const next = from + (to - from) * easeOut(t)
      setDisplay(next)
      if (t < 1) {
        frameRef.current = requestAnimationFrame(step)
      } else {
        fromRef.current = to
      }
    }

    frameRef.current = requestAnimationFrame(step)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      // Whatever we'd reached becomes the start of the next tween, so an
      // interrupted roll continues from where it is rather than snapping back.
      fromRef.current = to
    }
  }, [value, duration])

  return (
    <Tag className={className} data-figure {...rest}>
      {format(display)}
    </Tag>
  )
}
