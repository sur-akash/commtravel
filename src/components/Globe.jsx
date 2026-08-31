/* =============================================================================
   Globe — an orthographic projection on a 2D canvas.

   No WebGL, no three.js, no globe library. The coastline is Natural Earth 110m,
   vendored into src/data/world-land.js, and the maths is the standard
   orthographic projection: rotate a point about the polar axis, drop the half
   facing away from the viewer, project what's left onto the disc.

   The horizon is the whole problem, and two things solve it together:

   · The coastline arrives PRE-TILED into 15° pieces (scripts/build-world.mjs).
     Drawn as whole continents, a partly-hidden ring has to be closed somehow,
     and every cheap answer is visibly wrong — a chord across the disc cuts a
     lens out of the ocean, and pinning hidden points to the limb makes the
     Americas smear around the rim and flood the globe. scripts/debug-globe.mjs
     measures it: worst tile 1.8% of the disc, against ~100% untiled.
   · A tile straddling the horizon is cut at the limb and closed along the LIMB
     ARC, taking the shorter of the two ways round. That choice is ambiguous for
     a whole continent, which is what broke earlier attempts — but a 15° tile
     spans at most ~21° of arc, so the short way is always the right way, and
     the rim now follows the curve instead of chording across it.

   Interaction and lifecycle:

   · Drag to spin, like any globe. Auto-rotation resumes a couple of seconds
     after you let go. Arrow keys do the same thing for keyboard users.
   · The first frame paints SYNCHRONOUSLY on mount. Browsers suspend rAF in a
     hidden tab, so a rAF-only globe is a blank hole for anyone who opens the
     page in a background tab and switches to it later.
   · The loop stops when the globe scrolls out of view or the tab is hidden.
   · sin and cos of each point's LATITUDE never change as the globe spins, so
     they are precomputed into typed arrays; only the longitude term is
     recomputed per frame.
   ============================================================================= */

import { useEffect, useRef } from 'react'
import { LAND_RINGS } from '../data/world-land.js'
import { PING_LIFETIME_MS } from '../data/globalFeed.js'
import { prefersReducedMotion } from '../state/useSimulator.js'

const DEG = Math.PI / 180
const TAU = Math.PI * 2

/** Opening view: centred on +120°E and slightly south — Indonesia to Australia. */
const START_LON = -120 * DEG
const START_TILT = -8 * DEG

/** Don't let a drag tip the globe past the poles. */
const MAX_TILT = 72 * DEG

/** Degrees of rotation per second when idle. A full turn takes about a minute. */
const SPIN = 6

/** How long after a drag before the globe starts turning by itself again. */
const RESUME_SPIN_MS = 2500

/* -----------------------------------------------------------------------------
   Precompute the tiles once. Each gets a bounding cone — a unit vector through
   its centre and the sine of its angular radius — so a tile entirely round the
   back is culled with one dot product.
   -------------------------------------------------------------------------- */

const TILES = LAND_RINGS.map((flat) => {
  const count = flat.length / 2
  const lon = new Float64Array(count)
  const sinLat = new Float64Array(count)
  const cosLat = new Float64Array(count)

  let sumX = 0
  let sumY = 0
  let sumZ = 0

  for (let i = 0; i < count; i++) {
    const lonRad = flat[i * 2] * DEG
    const latRad = flat[i * 2 + 1] * DEG
    const sLat = Math.sin(latRad)
    const cLat = Math.cos(latRad)

    lon[i] = lonRad
    sinLat[i] = sLat
    cosLat[i] = cLat

    sumX += cLat * Math.cos(lonRad)
    sumY += cLat * Math.sin(lonRad)
    sumZ += sLat
  }

  const length = Math.hypot(sumX, sumY, sumZ) || 1
  const centreX = sumX / length
  const centreY = sumY / length
  const centreZ = sumZ / length

  let minDot = 1
  for (let i = 0; i < count; i++) {
    const dot =
      centreX * cosLat[i] * Math.cos(lon[i]) +
      centreY * cosLat[i] * Math.sin(lon[i]) +
      centreZ * sinLat[i]
    if (dot < minDot) minDot = dot
  }

  return {
    count,
    lon,
    sinLat,
    cosLat,
    centreX,
    centreY,
    centreZ,
    sinRadius: Math.sqrt(Math.max(0, 1 - minDot * minDot)),
  }
})

export default function Globe({ pings = [], className = '', ariaLabel }) {
  const canvasRef = useRef(null)
  const pingsRef = useRef(pings)
  const renderRef = useRef(null)
  const spinningRef = useRef(false)

  pingsRef.current = pings

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')

    let width = 0
    let height = 0
    let radius = 0
    let cx = 0
    let cy = 0
    let rotation = START_LON
    let tilt = START_TILT
    let sinTilt = Math.sin(tilt)
    let cosTilt = Math.cos(tilt)
    let frame = null
    let disposed = false
    let onScreen = true
    let dragging = false
    let lastInteraction = 0

    const reduced = prefersReducedMotion()

    // Read the palette from the tokens rather than hard-coding it, so the globe
    // follows the theme like everything else.
    const css = getComputedStyle(document.documentElement)
    const token = (name, fallback) => css.getPropertyValue(name).trim() || fallback
    const LAND = token('--cba-yellow', '#FFCC00')
    const OCEAN_IN = token('--cba-white', '#FFFFFF')
    const OCEAN_OUT = token('--cba-grey-band-deep', '#EBEBEB')
    const PING = token('--cba-ink-strong', '#231F20')

    const point = [0, 0]
    const edge = [0, 0]

    const setTilt = (value) => {
      tilt = Math.max(-MAX_TILT, Math.min(MAX_TILT, value))
      sinTilt = Math.sin(tilt)
      cosTilt = Math.cos(tilt)
    }

    /** Depth is cos of angular distance from the disc centre; positive is near. */
    const project = (lonRad, sLat, cLat, out) => {
      const lambda = lonRad + rotation
      const sinL = Math.sin(lambda)
      const cosL = Math.cos(lambda)
      out[0] = cx + radius * cLat * sinL
      out[1] = cy - radius * (cosTilt * sLat - sinTilt * cLat * cosL)
      return sinTilt * sLat + cosTilt * cLat * cosL
    }

    /** Bisect a segment to find where it crosses the horizon. */
    const crossing = (lon1, s1, c1, lon2, s2, c2, out) => {
      let lo = 0
      let hi = 1
      for (let i = 0; i < 12; i++) {
        const mid = (lo + hi) / 2
        if (project(lon1 + (lon2 - lon1) * mid, s1 + (s2 - s1) * mid, c1 + (c2 - c1) * mid, out) > 0) {
          lo = mid
        } else {
          hi = mid
        }
      }
      project(lon1 + (lon2 - lon1) * lo, s1 + (s2 - s1) * lo, c1 + (c2 - c1) * lo, out)
      return Math.atan2(out[1] - cy, out[0] - cx)
    }

    const render = () => {
      if (disposed || radius <= 0) return

      ctx.clearRect(0, 0, width, height)

      // Ocean.
      const ocean = ctx.createRadialGradient(
        cx - radius * 0.35,
        cy - radius * 0.4,
        radius * 0.05,
        cx,
        cy,
        radius
      )
      ocean.addColorStop(0, OCEAN_IN)
      ocean.addColorStop(0.75, OCEAN_OUT)
      ocean.addColorStop(1, '#DCD9D6')
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, TAU)
      ctx.fillStyle = ocean
      ctx.fill()

      // View direction in earth-fixed coordinates, for the tile cull.
      const viewX = cosTilt * Math.cos(rotation)
      const viewY = -cosTilt * Math.sin(rotation)
      const viewZ = sinTilt

      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, TAU)
      ctx.clip()

      // ONE path for every tile, filled once. Two reasons, both visible:
      // stroking tiles individually draws the 15° cut lines as a grid across
      // the continents, and filling them individually leaves hairline seams
      // where two antialiased edges meet. In a single path the shared edges are
      // traversed in opposite directions, so under the nonzero winding rule
      // they cancel and the tiles merge into one landmass.
      ctx.fillStyle = LAND
      ctx.globalAlpha = 1
      ctx.beginPath()

      for (const tile of TILES) {
        if (viewX * tile.centreX + viewY * tile.centreY + viewZ * tile.centreZ < -tile.sinRadius) {
          continue
        }

        const { count, lon, sinLat, cosLat } = tile
        let started = false
        let prevVisible = false
        let exitAngle = 0
        let pending = false
        let openAngle = 0
        let openedOnLimb = false

        for (let i = 0; i <= count; i++) {
          const index = i % count
          const visible = project(lon[index], sinLat[index], cosLat[index], point) > 0
          const px = point[0]
          const py = point[1]

          if (visible) {
            if (!prevVisible && i > 0) {
              const p = (i - 1 + count) % count
              const enterAngle = crossing(
                lon[p], sinLat[p], cosLat[p],
                lon[index], sinLat[index], cosLat[index],
                edge
              )
              if (started && pending) {
                // Short way round. Unambiguous because a tile is small.
                let delta = enterAngle - exitAngle
                while (delta > Math.PI) delta -= TAU
                while (delta < -Math.PI) delta += TAU
                ctx.arc(cx, cy, radius, exitAngle, enterAngle, delta < 0)
                pending = false
              } else if (!started) {
                ctx.moveTo(edge[0], edge[1])
                started = true
                openedOnLimb = true
                openAngle = enterAngle
              }
              ctx.lineTo(px, py)
            } else if (started) {
              ctx.lineTo(px, py)
            } else {
              ctx.moveTo(px, py)
              started = true
            }
          } else if (prevVisible) {
            const p = (i - 1 + count) % count
            exitAngle = crossing(
              lon[index], sinLat[index], cosLat[index],
              lon[p], sinLat[p], cosLat[p],
              edge
            )
            ctx.lineTo(edge[0], edge[1])
            pending = true
          }

          prevVisible = visible
        }

        if (started) {
          if (pending && openedOnLimb) {
            let delta = openAngle - exitAngle
            while (delta > Math.PI) delta -= TAU
            while (delta < -Math.PI) delta += TAU
            ctx.arc(cx, cy, radius, exitAngle, openAngle, delta < 0)
          }
          ctx.closePath()
        }
      }

      ctx.fill()
      ctx.restore()

      // Pings. Dark on a light globe so they read over both ocean and land,
      // with an expanding ring so an arrival catches the eye without needing
      // to be large enough to obscure the geography underneath it.
      const nowMs = Date.now()
      for (const ping of pingsRef.current) {
        const age = (nowMs - ping.born) / PING_LIFETIME_MS
        if (age > 1) continue

        const depth = project(ping.lon * DEG, Math.sin(ping.lat * DEG), Math.cos(ping.lat * DEG), point)
        if (depth <= 0.015) continue

        // Fade toward the limb so a ping doesn't wink out as it rounds the edge.
        const edgeFade = Math.min(1, depth * 5)
        const life = 1 - age

        if (!reduced) {
          const ringRadius = 4 + age * 26
          ctx.beginPath()
          ctx.arc(point[0], point[1], ringRadius, 0, TAU)
          ctx.strokeStyle = PING
          ctx.globalAlpha = life * 0.5 * edgeFade
          ctx.lineWidth = 1.5
          ctx.stroke()
        }

        ctx.globalAlpha = Math.min(1, life * 2.2) * edgeFade
        ctx.beginPath()
        ctx.arc(point[0], point[1], 4.2, 0, TAU)
        ctx.fillStyle = PING
        ctx.fill()

        // A white pip in the middle keeps it legible where it lands on land.
        ctx.beginPath()
        ctx.arc(point[0], point[1], 1.6, 0, TAU)
        ctx.fillStyle = OCEAN_IN
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // Terminator shading and rim, drawn last so they sit over the land.
      const shade = ctx.createRadialGradient(
        cx - radius * 0.3,
        cy - radius * 0.35,
        radius * 0.2,
        cx,
        cy,
        radius
      )
      shade.addColorStop(0, 'rgba(35, 31, 32, 0)')
      shade.addColorStop(0.7, 'rgba(35, 31, 32, 0.04)')
      shade.addColorStop(1, 'rgba(35, 31, 32, 0.20)')
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, TAU)
      ctx.fillStyle = shade
      ctx.fill()

      ctx.beginPath()
      ctx.arc(cx, cy, radius - 0.5, 0, TAU)
      ctx.strokeStyle = 'rgba(35, 31, 32, 0.28)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    renderRef.current = render

    /* --- sizing ---------------------------------------------------------- */

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Leave room for the ping rings, which extend past the coastline, and
      // never go negative — a collapsed container would throw in createRadialGradient.
      radius = Math.max(0, Math.min(width, height) / 2 - 18)
      cx = width / 2
      cy = height / 2
      render()
    }

    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)

    /* --- drag ------------------------------------------------------------ */

    let pointerId = null
    let lastX = 0
    let lastY = 0

    const onPointerDown = (event) => {
      if (event.button != null && event.button !== 0) return
      pointerId = event.pointerId
      // Throws if the pointer is already gone — a synthetic event, or a device
      // that released between the event firing and this line.
      try {
        canvas.setPointerCapture?.(pointerId)
      } catch {
        /* capture is an optimisation; the window listeners still work */
      }
      dragging = true
      lastX = event.clientX
      lastY = event.clientY
      lastInteraction = performance.now()
      canvas.style.cursor = 'grabbing'
      sync()
    }

    const onPointerMove = (event) => {
      if (!dragging || event.pointerId !== pointerId) return
      // A drag across the full width turns the globe roughly half a turn, which
      // is the ratio that feels like pushing a ball rather than a slider.
      const scale = 180 / Math.max(1, width)
      rotation += (event.clientX - lastX) * scale * DEG
      setTilt(tilt + (event.clientY - lastY) * scale * DEG)
      lastX = event.clientX
      lastY = event.clientY
      lastInteraction = performance.now()
      render()
    }

    const endDrag = (event) => {
      if (event && pointerId != null && event.pointerId !== pointerId) return
      if (!dragging) return
      dragging = false
      pointerId = null
      lastInteraction = performance.now()
      canvas.style.cursor = 'grab'
      sync()
    }

    const onKeyDown = (event) => {
      const step = event.shiftKey ? 15 : 5
      let handled = true
      if (event.key === 'ArrowLeft') rotation -= step * DEG
      else if (event.key === 'ArrowRight') rotation += step * DEG
      else if (event.key === 'ArrowUp') setTilt(tilt - step * DEG)
      else if (event.key === 'ArrowDown') setTilt(tilt + step * DEG)
      else handled = false

      if (handled) {
        event.preventDefault()
        lastInteraction = performance.now()
        render()
      }
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', endDrag)
    canvas.addEventListener('pointercancel', endDrag)
    canvas.addEventListener('keydown', onKeyDown)
    canvas.style.cursor = 'grab'
    canvas.style.touchAction = 'none'

    /* --- the loop -------------------------------------------------------- */

    let last = performance.now()

    const loop = (now) => {
      if (disposed) return
      const idle = !dragging && now - lastInteraction > RESUME_SPIN_MS
      if (idle) rotation += SPIN * DEG * ((now - last) / 1000)
      last = now
      render()
      frame = requestAnimationFrame(loop)
    }

    // Keep the loop alive while dragging even under reduced motion, so the drag
    // itself responds — what that setting asks us to stop is the idle spin.
    const shouldRun = () => onScreen && !document.hidden && (!reduced || dragging)

    const sync = () => {
      const wanted = shouldRun()
      if (wanted && frame == null) {
        last = performance.now()
        frame = requestAnimationFrame(loop)
        spinningRef.current = true
      } else if (!wanted && frame != null) {
        cancelAnimationFrame(frame)
        frame = null
        spinningRef.current = false
        render()
      }
    }

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting
        sync()
      },
      { threshold: 0 }
    )
    intersectionObserver.observe(canvas)

    document.addEventListener('visibilitychange', sync)
    sync()

    return () => {
      disposed = true
      spinningRef.current = false
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      document.removeEventListener('visibilitychange', sync)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', endDrag)
      canvas.removeEventListener('pointercancel', endDrag)
      canvas.removeEventListener('keydown', onKeyDown)
      if (frame != null) cancelAnimationFrame(frame)
      renderRef.current = null
    }
  }, [])

  // When the loop is stopped — reduced motion, off screen, hidden tab — nothing
  // else repaints, so arriving pings would never show up.
  useEffect(() => {
    if (!spinningRef.current) renderRef.current?.()
  }, [pings])

  return (
    <canvas
      ref={canvasRef}
      className={`globe ${className}`}
      role="img"
      tabIndex={0}
      aria-label={
        ariaLabel ??
        'Globe showing international card transactions as they happen. Drag or use the arrow keys to turn it.'
      }
    />
  )
}
