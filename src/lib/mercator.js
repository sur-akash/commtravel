/* =============================================================================
   Web Mercator — the same projection every slippy map uses.

   This is what makes the ATM locator genuinely scalable rather than a picture
   of a map: features are stored once in latitude and longitude, and the
   projection turns them into pixels for whatever zoom and centre the viewer has
   panned to. Zoom is the standard tile-pyramid scale, so `worldSize` doubles
   with every level and the numbers mean the same thing they would in any
   mapping library.
   ============================================================================= */

const TILE = 256
const MAX_LAT = 85.05112878 // where Mercator runs to infinity

export const worldSize = (zoom) => TILE * 2 ** zoom

/** Longitude → world x, at a given zoom. */
export function lonToX(lon, zoom) {
  return ((lon + 180) / 360) * worldSize(zoom)
}

/** Latitude → world y, at a given zoom. */
export function latToY(lat, zoom) {
  const clamped = Math.max(-MAX_LAT, Math.min(MAX_LAT, lat))
  const rad = (clamped * Math.PI) / 180
  const merc = Math.log(Math.tan(Math.PI / 4 + rad / 2))
  return (0.5 - merc / (2 * Math.PI)) * worldSize(zoom)
}

export function xToLon(x, zoom) {
  return (x / worldSize(zoom)) * 360 - 180
}

export function yToLat(y, zoom) {
  const merc = (0.5 - y / worldSize(zoom)) * (2 * Math.PI)
  return ((2 * Math.atan(Math.exp(merc)) - Math.PI / 2) * 180) / Math.PI
}

/**
 * Ground resolution in metres per pixel. Mercator stretches with latitude, so
 * this is what the scale bar has to be built from — a fixed "100 m = 40px"
 * would be wrong everywhere except the equator.
 */
export function metresPerPixel(lat, zoom) {
  return (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom
}

/** Metres between two coordinates, via the haversine formula. */
export function distanceMetres(a, b) {
  const R = 6371000
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Format a distance the way a person would say it. */
export function formatDistance(metres) {
  if (metres < 950) return `${Math.round(metres / 10) * 10} m`
  return `${(metres / 1000).toFixed(1)} km`
}

/** Round a scale-bar length down to a friendly number. */
export function niceScaleLength(metres) {
  const steps = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000]
  for (let i = steps.length - 1; i >= 0; i--) {
    if (steps[i] <= metres) return steps[i]
  }
  return steps[0]
}
