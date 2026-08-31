/* =============================================================================
   AtmMap — the cash locator.

   A real slippy map: Web Mercator, a zoom pyramid, drag to pan, wheel or
   buttons to zoom, and features stored in latitude and longitude rather than
   drawn at fixed positions. What it does NOT have is a tile server — the brief
   rules out network calls, so the streets underneath are generated (see
   src/data/citymap.js) rather than fetched. Swapping in a real vector source
   later means replacing that one file; nothing here changes.

   The point of the module is the surcharge. CommBank's AUD $3.50 is the same at
   every overseas ATM, so it isn't a decision. The operator's own fee is the
   variable, it's different at machines two minutes apart, and nothing tells you
   before you walk to one. So the map is coloured by that and nothing else.
   ============================================================================= */

import { useEffect, useMemo, useRef, useState } from 'react'
import { Chip, Icon } from './primitives/index.jsx'
import SearchBox from './SearchBox.jsx'
import { buildCity, buildCashPoints, MAP_CENTRE, MAP_ZOOM } from '../data/citymap.js'
import { WORLD_CURRENCIES, formatWorldAmount } from '../data/globe.js'
import {
  lonToX,
  latToY,
  xToLon,
  yToLat,
  metresPerPixel,
  distanceMetres,
  formatDistance,
  niceScaleLength,
} from '../lib/mercator.js'
import './AtmMap.css'

/** Road styling per zoom. Widths are in screen pixels. */
const ROAD_STYLE = {
  arterial: {
    minZoom: 13,
    width: (z) => Math.max(3.5, (z - 11.6) * 2.6),
    colour: '#FFFFFF',
    casing: '#DFDBD6',
  },
  street: {
    minZoom: 14.2,
    width: (z) => Math.max(2, (z - 13.1) * 1.9),
    colour: '#FFFFFF',
    casing: '#E6E2DD',
  },
  lane: { minZoom: 15.6, width: (z) => Math.max(1.2, (z - 15) * 1.3), colour: '#FBFAF9', casing: null },
}

/** Where the map opens: the traveller's own destination. */
const HOME_PLACE = {
  key: 'tokyo',
  name: 'Shibuya',
  country: 'Japan',
  cc: 'JPN',
  currency: 'JPY',
  lat: MAP_CENTRE.lat,
  lon: MAP_CENTRE.lon,
}

export default function AtmMap({ compact = false }) {
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const viewRef = useRef({ lat: MAP_CENTRE.lat, lon: MAP_CENTRE.lon, zoom: MAP_ZOOM.initial })
  const renderRef = useRef(null)

  const [place, setPlace] = useState(HOME_PLACE)
  const [freeOnly, setFreeOnly] = useState(false)

  // The generated city and its cash points, both keyed off the place so
  // returning to somewhere gives you the same streets you saw before.
  const city = useMemo(() => buildCity(place, place.key), [place])
  const points = useMemo(
    () =>
      buildCashPoints(place, place.key, {
        cc: place.cc,
        currency: place.currency,
        perAud: WORLD_CURRENCIES[place.currency]?.perAud ?? 1,
      }),
    [place]
  )

  const [selectedId, setSelectedId] = useState(points[0]?.id)

  const visiblePoints = useMemo(
    () => (freeOnly ? points.filter((p) => p.surchargeLocal === 0) : points),
    [freeOnly, points]
  )

  // Distances are measured from wherever the map is centred on.
  const ranked = useMemo(
    () =>
      visiblePoints
        .map((point) => ({ ...point, metres: distanceMetres(place, point) }))
        .sort((a, b) => a.metres - b.metres),
    [visiblePoints, place]
  )

  const selected = ranked.find((p) => p.id === selectedId) ?? ranked[0]

  /** Move the whole map to a searched destination. */
  const goTo = (item) => {
    const next = {
      key: item.id,
      name: item.name,
      country: item.country,
      cc: item.cc,
      currency: item.currency,
      lat: item.lat,
      lon: item.lon,
    }
    setPlace(next)
    setSelectedId(undefined)
    viewRef.current.lat = next.lat
    viewRef.current.lon = next.lon
    viewRef.current.zoom = MAP_ZOOM.initial
  }

  /* --- the map ---------------------------------------------------------- */

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')

    let width = 0
    let height = 0
    let disposed = false

    const view = viewRef.current
    // Screen position of a coordinate, given the current centre and zoom.
    const project = (lat, lon) => [
      width / 2 + (lonToX(lon, view.zoom) - lonToX(view.lon, view.zoom)),
      height / 2 + (latToY(lat, view.zoom) - latToY(view.lat, view.zoom)),
    ]

    const drawPath = (path, close = false) => {
      ctx.beginPath()
      for (let i = 0; i < path.length; i++) {
        const [x, y] = project(path[i].lat, path[i].lon)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      if (close) ctx.closePath()
    }

    const render = () => {
      if (disposed || !width || !height) return
      const { zoom } = view

      // Ground.
      ctx.fillStyle = '#F4F2EF'
      ctx.fillRect(0, 0, width, height)

      // Parks.
      ctx.fillStyle = '#E3EBDF'
      for (const park of city.parks) {
        drawPath(park, true)
        ctx.fill()
      }

      // Roads, casing first so junctions read as continuous.
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      for (const pass of ['casing', 'fill']) {
        for (const kind of ['lane', 'street', 'arterial']) {
          const style = ROAD_STYLE[kind]
          if (zoom < style.minZoom) continue
          if (pass === 'casing' && !style.casing) continue

          ctx.strokeStyle = pass === 'casing' ? style.casing : style.colour
          ctx.lineWidth = style.width(zoom) + (pass === 'casing' ? 2 : 0)

          for (const road of city.roads) {
            if (road.kind !== kind) continue
            drawPath(road.path)
            ctx.stroke()
          }
        }
      }

      // Rail line — dashed, the way every map draws one.
      drawPath(city.rail.path)
      ctx.strokeStyle = '#B9B4AE'
      ctx.lineWidth = 4
      ctx.setLineDash([])
      ctx.stroke()
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 2
      ctx.setLineDash([7, 7])
      ctx.stroke()
      ctx.setLineDash([])

      // Station.
      const [sx, sy] = project(city.rail.station.lat, city.rail.station.lon)
      ctx.beginPath()
      ctx.arc(sx, sy, 6, 0, Math.PI * 2)
      ctx.fillStyle = '#FFFFFF'
      ctx.fill()
      ctx.strokeStyle = '#706D6E'
      ctx.lineWidth = 2
      ctx.stroke()

      if (zoom > 14.4) {
        ctx.fillStyle = '#4F4C4D'
        ctx.font = '600 11px Inter, system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`${place.name} centre`, sx, sy - 12)
      }

      // "You are here" — the hotel, at the map's centre point.
      const [hx, hy] = project(place.lat, place.lon)
      ctx.beginPath()
      ctx.arc(hx, hy, 22, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0, 85, 139, 0.10)'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(hx, hy, 6, 0, Math.PI * 2)
      ctx.fillStyle = '#00558B'
      ctx.fill()
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 2.5
      ctx.stroke()

      // Pins. Drawn last, and the selected one last of all so it sits on top.
      const ordered = [...visiblePoints].sort((a, b) =>
        a.id === selectedId ? 1 : b.id === selectedId ? -1 : 0
      )

      for (const point of ordered) {
        const [x, y] = project(point.lat, point.lon)
        if (x < -40 || x > width + 40 || y < -60 || y > height + 40) continue

        const isSelected = point.id === selectedId
        const free = point.surchargeLocal === 0
        const fill = free ? '#06763D' : '#B26B00'
        const scale = isSelected ? 1.25 : 1

        // Teardrop.
        const r = 11 * scale
        const tip = y + r * 1.9
        ctx.beginPath()
        ctx.moveTo(x, tip)
        ctx.quadraticCurveTo(x - r * 0.95, y + r * 0.55, x - r, y)
        ctx.arc(x, y, r, Math.PI, 0)
        ctx.quadraticCurveTo(x + r * 0.95, y + r * 0.55, x, tip)
        ctx.closePath()

        ctx.fillStyle = fill
        ctx.fill()
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = isSelected ? 3 : 2
        ctx.stroke()

        // Glyph: a branch gets a square, an ATM a slot.
        ctx.fillStyle = '#FFFFFF'
        if (point.type === 'branch') {
          ctx.fillRect(x - 4 * scale, y - 4 * scale, 8 * scale, 8 * scale)
        } else {
          ctx.fillRect(x - 5 * scale, y - 3 * scale, 10 * scale, 6 * scale)
          ctx.fillStyle = fill
          ctx.fillRect(x - 3 * scale, y - 1 * scale, 6 * scale, 2 * scale)
        }
      }

      // Scale bar, computed from the true ground resolution at this latitude —
      // Mercator stretches with latitude, so a fixed ratio would be wrong.
      const mpp = metresPerPixel(view.lat, zoom)
      const barMetres = niceScaleLength(mpp * 90)
      const barPx = barMetres / mpp
      const barX = 14
      const barY = height - 18

      ctx.strokeStyle = 'rgba(255,255,255,0.9)'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(barX, barY)
      ctx.lineTo(barX + barPx, barY)
      ctx.stroke()
      ctx.strokeStyle = '#4F4C4D'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(barX, barY - 4)
      ctx.lineTo(barX, barY + 4)
      ctx.moveTo(barX, barY)
      ctx.lineTo(barX + barPx, barY)
      ctx.moveTo(barX + barPx, barY - 4)
      ctx.lineTo(barX + barPx, barY + 4)
      ctx.stroke()

      ctx.fillStyle = '#4F4C4D'
      ctx.font = '600 11px Inter, system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(
        barMetres >= 1000 ? `${barMetres / 1000} km` : `${barMetres} m`,
        barX,
        barY - 8
      )
    }

    renderRef.current = render

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      render()
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    /* --- pan --------------------------------------------------------- */

    let pointerId = null
    let lastX = 0
    let lastY = 0
    let moved = 0

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
      lastX = event.clientX
      lastY = event.clientY
      moved = 0
      canvas.style.cursor = 'grabbing'
    }

    const onPointerMove = (event) => {
      if (pointerId == null || event.pointerId !== pointerId) return
      const dx = event.clientX - lastX
      const dy = event.clientY - lastY
      moved += Math.abs(dx) + Math.abs(dy)

      // Pan by converting the pixel delta back through the projection.
      view.lon = xToLon(lonToX(view.lon, view.zoom) - dx, view.zoom)
      view.lat = yToLat(latToY(view.lat, view.zoom) - dy, view.zoom)

      lastX = event.clientX
      lastY = event.clientY
      render()
    }

    const onPointerUp = (event) => {
      if (pointerId == null) return
      canvas.style.cursor = 'grab'

      // A tap rather than a drag: select the nearest pin, if it's close enough.
      if (moved < 6) {
        const rect = canvas.getBoundingClientRect()
        const px = event.clientX - rect.left
        const py = event.clientY - rect.top
        let best = null
        let bestDistance = Infinity
        for (const point of visiblePoints) {
          const [x, y] = project(point.lat, point.lon)
          const d = Math.hypot(x - px, y - py)
          if (d < bestDistance) {
            bestDistance = d
            best = point
          }
        }
        if (best && bestDistance < 26) setSelectedId(best.id)
      }

      pointerId = null
      moved = 0
    }

    /* --- zoom --------------------------------------------------------- */

    const applyZoom = (delta, anchorX, anchorY) => {
      const next = Math.max(MAP_ZOOM.min, Math.min(MAP_ZOOM.max, view.zoom + delta))
      if (next === view.zoom) return

      // Keep whatever is under the cursor under the cursor, which is the thing
      // that makes wheel-zoom feel like a map rather than a slider.
      if (anchorX != null) {
        // Whatever sits under the cursor stays under the cursor.
        const lonUnder = xToLon(lonToX(view.lon, view.zoom) + (anchorX - width / 2), view.zoom)
        const latUnder = yToLat(latToY(view.lat, view.zoom) + (anchorY - height / 2), view.zoom)

        view.zoom = next
        view.lon = xToLon(lonToX(lonUnder, next) - (anchorX - width / 2), next)
        view.lat = yToLat(latToY(latUnder, next) - (anchorY - height / 2), next)
      } else {
        view.zoom = next
      }

      render()
    }

    const onWheel = (event) => {
      event.preventDefault()
      const rect = canvas.getBoundingClientRect()
      applyZoom(-event.deltaY * 0.003, event.clientX - rect.left, event.clientY - rect.top)
    }

    const onDoubleClick = (event) => {
      const rect = canvas.getBoundingClientRect()
      applyZoom(1, event.clientX - rect.left, event.clientY - rect.top)
    }

    const onKeyDown = (event) => {
      const step = 60
      let handled = true
      const shift = (dx, dy) => {
        view.lon = xToLon(lonToX(view.lon, view.zoom) + dx, view.zoom)
        view.lat = yToLat(latToY(view.lat, view.zoom) + dy, view.zoom)
      }

      if (event.key === 'ArrowLeft') shift(-step, 0)
      else if (event.key === 'ArrowRight') shift(step, 0)
      else if (event.key === 'ArrowUp') shift(0, -step)
      else if (event.key === 'ArrowDown') shift(0, step)
      else if (event.key === '+' || event.key === '=') applyZoom(0.6)
      else if (event.key === '-' || event.key === '_') applyZoom(-0.6)
      else handled = false

      if (handled) {
        event.preventDefault()
        render()
      }
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('dblclick', onDoubleClick)
    canvas.addEventListener('keydown', onKeyDown)
    canvas.style.cursor = 'grab'
    canvas.style.touchAction = 'none'

    // Exposed so the zoom buttons and "recentre" outside the canvas can drive it.
    wrapRef.current.__map = {
      zoomBy: (delta) => applyZoom(delta),
      recentre: () => {
        view.lat = place.lat
        view.lon = place.lon
        view.zoom = MAP_ZOOM.initial
        render()
      },
      flyTo: (point) => {
        view.lat = point.lat
        view.lon = point.lon
        view.zoom = Math.max(view.zoom, 16.4)
        render()
      },
    }

    return () => {
      disposed = true
      observer.disconnect()
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('dblclick', onDoubleClick)
      canvas.removeEventListener('keydown', onKeyDown)
      renderRef.current = null
    }
  }, [visiblePoints, selectedId, city, place])

  // Repaint when the selection or the filter changes.
  useEffect(() => {
    renderRef.current?.()
  }, [selectedId, freeOnly])

  const map = () => wrapRef.current?.__map

  return (
    <div className="atm" ref={wrapRef}>
      <SearchBox
        placeholder="Search a city or suburb — Shibuya, Bali, London"
        value={`${place.name}${place.country ? `, ${place.country}` : ''}`}
        onSelect={goTo}
        hint={
          place.key === HOME_PLACE.key
            ? 'Showing cash near you. Search anywhere you are heading next.'
            : `Showing ${place.name}. Cash points here are illustrative.`
        }
      />

      <div className="atm__bar">
        <div className="atm__legend">
          <span className="atm__key">
            <span className="atm__dot atm__dot--free" aria-hidden="true" />
            No operator surcharge
          </span>
          <span className="atm__key">
            <span className="atm__dot atm__dot--fee" aria-hidden="true" />
            Charges its own fee
          </span>
        </div>
        <label className="atm__filter">
          <input
            type="checkbox"
            checked={freeOnly}
            onChange={(event) => setFreeOnly(event.target.checked)}
          />
          Surcharge-free only
        </label>
      </div>

      <div className="atm__stage">
        <canvas
          ref={canvasRef}
          className="atm__canvas"
          tabIndex={0}
          role="application"
          aria-label="Map of cash machines near you. Drag to pan, use arrow keys to move and plus or minus to zoom."
        />

        <div className="atm__controls">
          <button type="button" onClick={() => map()?.zoomBy(0.8)} aria-label="Zoom in">
            +
          </button>
          <button type="button" onClick={() => map()?.zoomBy(-0.8)} aria-label="Zoom out">
            −
          </button>
          <button
            type="button"
            className="atm__recentre"
            onClick={() => map()?.recentre()}
            aria-label="Back to where you are"
          >
            <Icon name="pin" size={16} />
          </button>
        </div>

        <p className="atm__attribution">
          Illustrative map · streets generated, not a mapping service
        </p>
      </div>

      {selected ? (
        <div className="atm__selected">
          <span className={`atm__selected-icon ${selected.surchargeLocal === 0 ? 'is-free' : ''}`}>
            <Icon name={selected.type === 'branch' ? 'pin' : 'atm'} size={20} />
          </span>
          <div className="atm__selected-body">
            <p className="atm__selected-name">{selected.name}</p>
            <p className="atm__selected-detail">
              {selected.detail} · {formatDistance(selected.metres)} · {selected.open}
            </p>
            <p className="atm__selected-detail">Accepts {selected.accepts.join(' and ')}</p>
          </div>
          {selected.surchargeLocal === 0 ? (
            <Chip tone="success">No surcharge</Chip>
          ) : (
            <Chip tone="warn">
              {formatWorldAmount(selected.surchargeLocal, place.currency)} surcharge
            </Chip>
          )}
        </div>
      ) : null}

      {!compact ? (
        <ul className="atm__list">
          {ranked.slice(0, 6).map((point) => (
            <li key={point.id}>
              <button
                type="button"
                className={`atm__row ${point.id === selectedId ? 'is-selected' : ''}`}
                onClick={() => {
                  setSelectedId(point.id)
                  map()?.flyTo(point)
                }}
                aria-pressed={point.id === selectedId}
              >
                <span className={`atm__dot ${point.surchargeLocal === 0 ? 'atm__dot--free' : 'atm__dot--fee'}`} aria-hidden="true" />
                <span className="atm__row-body">
                  <span className="atm__row-name">{point.name}</span>
                  <span className="atm__row-detail">
                    {point.detail} · {formatDistance(point.metres)}
                  </span>
                </span>
                <span className="atm__row-fee">
                  {point.surchargeLocal === 0
                    ? 'Free'
                    : formatWorldAmount(point.surchargeLocal, place.currency)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="atm__note">
        CommBank charges AUD $3.50 at any overseas ATM, wherever you go — so that part isn&rsquo;t a
        decision. The operator&rsquo;s own surcharge is, and it differs between machines two minutes
        apart. A World Debit Mastercard removes CommBank&rsquo;s $3.50 but not theirs.
      </p>
    </div>
  )
}
