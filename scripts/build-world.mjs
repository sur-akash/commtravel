/* =============================================================================
   Build script — turns Natural Earth's 110m land TopoJSON into a compact local
   module.

   Run once, by hand, when the coastline needs regenerating:

     node scripts/build-world.mjs <path-to-land-110m.json>

   The output is committed to src/data/world-land.js so the app never fetches
   geography at runtime. TopoJSON is decoded here rather than in the browser,
   which keeps topojson-client out of the dependency list entirely — the format
   is just quantised delta-encoded arcs, and decoding it is the 30 lines below.

   The important part is the TILING. Drawing a whole continent onto an
   orthographic globe means deciding what to do with the half that is round the
   back, and every cheap answer is visibly wrong: closing the visible span with
   a straight chord slices a lens out of the ocean, and pinning hidden points to
   the limb makes an almost-entirely-hidden landmass (the Americas, when the
   globe faces Asia) smear around the rim and flood the disc.

   Cutting the coastline into 15-degree tiles here removes the problem at the
   source rather than papering over it at draw time. No tile can span more than
   about 21 degrees of arc, so a tile is either visible, hidden, or crossing the
   horizon by a sliver — and closing that sliver with a chord is off by roughly
   two pixels on a 540px globe, underneath the rim glow. It also lets the
   renderer cull whole tiles by bounding box.
   ============================================================================= */

import { readFileSync, writeFileSync } from 'node:fs'

const source = process.argv[2]
if (!source) {
  console.error('usage: node scripts/build-world.mjs <path-to-land-110m.json>')
  process.exit(1)
}

const topology = JSON.parse(readFileSync(source, 'utf8'))
const { scale, translate } = topology.transform

/** Undo the quantisation: arcs are stored as integer deltas from the previous point. */
function decodeArc(arc) {
  let x = 0
  let y = 0
  return arc.map(([dx, dy]) => {
    x += dx
    y += dy
    return [x * scale[0] + translate[0], y * scale[1] + translate[1]]
  })
}

const arcs = topology.arcs.map(decodeArc)

/** A negative arc index means "this arc, reversed" — index is ~i, i.e. -i-1. */
function ringFor(indices) {
  const points = []
  for (const index of indices) {
    const arc = index < 0 ? arcs[~index].slice().reverse() : arcs[index]
    // Arcs share endpoints; drop the duplicate where they join.
    points.push(...(points.length ? arc.slice(1) : arc))
  }
  return points
}

/** Tile size in degrees. Smaller means more rings but a smaller chord error. */
const TILE = 15

/**
 * Sutherland–Hodgman: clip a polygon against one half-plane.
 * `keep` decides which side survives; `intersect` finds the boundary crossing.
 */
function clipHalfPlane(points, keep, intersect) {
  if (!points.length) return []
  const out = []
  for (let i = 0; i < points.length; i++) {
    const current = points[i]
    const previous = points[(i + points.length - 1) % points.length]
    const currentIn = keep(current)
    const previousIn = keep(previous)

    if (currentIn) {
      if (!previousIn) out.push(intersect(previous, current))
      out.push(current)
    } else if (previousIn) {
      out.push(intersect(previous, current))
    }
  }
  return out
}

/** Clip a polygon to an axis-aligned box. */
function clipToBox(points, x0, y0, x1, y1) {
  const lerpX = (a, b, x) => [x, a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0] || 1e-12)]
  const lerpY = (a, b, y) => [a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1] || 1e-12), y]

  let result = points
  result = clipHalfPlane(result, (p) => p[0] >= x0, (a, b) => lerpX(a, b, x0))
  result = clipHalfPlane(result, (p) => p[0] <= x1, (a, b) => lerpX(a, b, x1))
  result = clipHalfPlane(result, (p) => p[1] >= y0, (a, b) => lerpY(a, b, y0))
  result = clipHalfPlane(result, (p) => p[1] <= y1, (a, b) => lerpY(a, b, y1))
  return result
}

/**
 * Longitudes jump by 360 where a ring crosses the antimeridian. Unwrap them
 * into a continuous run first, or the clipper sees a segment spanning the whole
 * map and produces nonsense.
 */
function unwrapLongitudes(ring) {
  const out = [ring[0].slice()]
  let offset = 0
  for (let i = 1; i < ring.length; i++) {
    const delta = ring[i][0] - ring[i - 1][0]
    if (delta > 180) offset -= 360
    else if (delta < -180) offset += 360
    out.push([ring[i][0] + offset, ring[i][1]])
  }
  return out
}

/** Cut one ring into tile-sized pieces. */
function tileRing(ring) {
  const unwrapped = unwrapLongitudes(ring)
  const lons = unwrapped.map((p) => p[0])
  const lats = unwrapped.map((p) => p[1])

  const lonStart = Math.floor(Math.min(...lons) / TILE) * TILE
  const lonEnd = Math.ceil(Math.max(...lons) / TILE) * TILE
  const latStart = Math.floor(Math.min(...lats) / TILE) * TILE
  const latEnd = Math.ceil(Math.max(...lats) / TILE) * TILE

  const pieces = []
  for (let x = lonStart; x < lonEnd; x += TILE) {
    for (let y = latStart; y < latEnd; y += TILE) {
      const clipped = clipToBox(unwrapped, x, y, x + TILE, y + TILE)
      if (clipped.length < 3) continue
      // Wrap longitudes back into [-180, 180]. Tile edges land on multiples of
      // 15 and 180 is one of them, so a tile never straddles the antimeridian
      // and every point in it wraps by the same amount.
      pieces.push(
        clipped.map(([lon, lat]) => [((((lon + 180) % 360) + 360) % 360) - 180, lat])
      )
    }
  }
  return pieces
}

const PRECISION = 1 // 0.1° ≈ 11km — far finer than a 400px globe can show
const round = (n) => Math.round(n * 10 ** PRECISION) / 10 ** PRECISION

const rings = []

for (const geometry of topology.objects.land.geometries) {
  const polygons = geometry.type === 'Polygon' ? [geometry.arcs] : geometry.arcs
  for (const polygon of polygons) {
    // polygon[0] is the outer ring; holes (lakes) are dropped — at this scale
    // they're a pixel or two and cost more than they show.
    const ring = ringFor(polygon[0])

    for (const piece of tileRing(ring)) {
      // Round, then collapse points that land on the same rounded coordinate.
      const simplified = []
      for (const [lon, lat] of piece) {
        const point = [round(lon), round(lat)]
        const last = simplified[simplified.length - 1]
        if (!last || last[0] !== point[0] || last[1] !== point[1]) simplified.push(point)
      }

      // Anything under four points can't enclose an area worth drawing.
      if (simplified.length < 4) continue
      rings.push(simplified)
    }
  }
}

rings.sort((a, b) => b.length - a.length)

const body = rings.map((ring) => `[${ring.map(([x, y]) => `${x},${y}`).join(',')}]`).join(',\n')

const output = `/* =============================================================================
   World coastline — generated, do not edit by hand.

   Natural Earth 110m land, decoded from TopoJSON by scripts/build-world.mjs,
   cut into \${TILE}° tiles and simplified to 0.1° precision. Each entry is one closed
   ring as a flat array of alternating longitude and latitude values — flat
   rather than nested pairs because it halves the array count and the globe
   reads it in a tight loop.

   Tiling is what makes the orthographic globe tractable: see the build script's
   header for why a whole continent cannot be drawn as one ring.

   Source: Natural Earth (public domain), via world-atlas.
   Rings: ${rings.length}. Points: ${rings.reduce((sum, r) => sum + r.length, 0)}.
   ============================================================================= */

export const LAND_RINGS = [
${body}
]
`

writeFileSync(new URL('../src/data/world-land.js', import.meta.url), output)

console.log(
  `wrote src/data/world-land.js — ${rings.length} rings, ` +
    `${rings.reduce((sum, r) => sum + r.length, 0)} points, ` +
    `${(output.length / 1024).toFixed(1)} kB`
)
