/* Diagnostic: replays the globe's land path logic outside the browser and
   reports, per ring, how much of the disc the resulting polygon encloses.
   A correct ring covers a few percent; a ring that covers ~100% is the one
   flooding the globe. Run: node scripts/debug-globe.mjs */

import { LAND_RINGS } from '../src/data/world-land.js'

const DEG = Math.PI / 180
const TILT = -8 * DEG
const SIN_TILT = Math.sin(TILT)
const COS_TILT = Math.cos(TILT)
const rotation = -120 * DEG
const R = 200
const cx = 0
const cy = 0

function project(lonRad, sinLat, cosLat) {
  const lambda = lonRad + rotation
  const sinL = Math.sin(lambda)
  const cosL = Math.cos(lambda)
  return {
    depth: SIN_TILT * sinLat + COS_TILT * cosLat * cosL,
    x: cx + R * cosLat * sinL,
    y: cy - R * (COS_TILT * sinLat - SIN_TILT * cosLat * cosL),
  }
}

function crossing(p1, p2) {
  let lo = 0
  let hi = 1
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2
    const q = project(
      p1.lon + (p2.lon - p1.lon) * mid,
      p1.sinLat + (p2.sinLat - p1.sinLat) * mid,
      p1.cosLat + (p2.cosLat - p1.cosLat) * mid
    )
    if (q.depth > 0) lo = mid
    else hi = mid
  }
  return project(
    p1.lon + (p2.lon - p1.lon) * lo,
    p1.sinLat + (p2.sinLat - p1.sinLat) * lo,
    p1.cosLat + (p2.cosLat - p1.cosLat) * lo
  )
}

function shoelace(points) {
  let sum = 0
  for (let i = 0; i < points.length; i++) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    sum += a[0] * b[1] - b[0] * a[1]
  }
  return Math.abs(sum) / 2
}

/** Sample an arc into segments so shoelace can measure it. */
function arcPoints(from, to, anticlockwise) {
  let sweep = to - from
  if (!anticlockwise) {
    while (sweep < 0) sweep += Math.PI * 2
  } else {
    while (sweep > 0) sweep -= Math.PI * 2
  }
  const steps = Math.max(2, Math.ceil(Math.abs(sweep) / 0.05))
  const out = []
  for (let i = 1; i <= steps; i++) {
    const t = from + (sweep * i) / steps
    out.push([cx + R * Math.cos(t), cy + R * Math.sin(t)])
  }
  return { points: out, sweepDeg: Math.abs(sweep) / DEG }
}

const discArea = Math.PI * R * R
const report = []

LAND_RINGS.forEach((flat, ringIndex) => {
  const count = flat.length / 2
  const pts = []
  for (let i = 0; i < count; i++) {
    pts.push({
      lon: flat[i * 2] * DEG,
      sinLat: Math.sin(flat[i * 2 + 1] * DEG),
      cosLat: Math.cos(flat[i * 2 + 1] * DEG),
    })
  }

  // --- CHORD METHOD on tiled rings: keep visible points, close with a chord ---
  const poly = []
  let anyVisible = false
  for (let i = 0; i < count; i++) {
    const q = project(pts[i].lon, pts[i].sinLat, pts[i].cosLat)
    if (q.depth > 0) {
      anyVisible = true
      poly.push([q.x, q.y])
    }
  }
  const started = anyVisible
  const arcs = 0
  const maxSweep = 0

  if (!started || poly.length < 3) return
  report.push({
    ringIndex,
    points: count,
    area: shoelace(poly) / discArea,
    arcs,
    maxSweep,
  })
})

report.sort((a, b) => b.area - a.area)

console.log('disc coverage by ring (top 8):')
for (const row of report.slice(0, 8)) {
  console.log(
    `  ring ${String(row.ringIndex).padStart(3)} | ${String(row.points).padStart(5)} pts | ` +
      `covers ${(row.area * 100).toFixed(1).padStart(6)}% of disc | ` +
      `antipodal points skipped: ${row.maxSweep}`
  )
}
const total = report.reduce((sum, r) => sum + r.area, 0)
console.log(`\n  rings drawn: ${report.length}, summed coverage: ${(total * 100).toFixed(1)}%`)
console.log('  (real land on this hemisphere is roughly 35%)')
