/* =============================================================================
   WCAG contrast maths.

   Used by the design-review page to prove the token pairs pass rather than
   asserting they do. CommBank yellow on white is 1.44:1 — this is the check
   that keeps it from creeping in as a text colour.
   ============================================================================= */

function channel(value) {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

export function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ]
}

export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatio(foreground, background) {
  const a = luminance(foreground)
  const b = luminance(background)
  const [light, dark] = a > b ? [a, b] : [b, a]
  return (light + 0.05) / (dark + 0.05)
}

/** AA needs 4.5:1 for body text, 3:1 for large text (24px+, or 19px+ bold). */
export function grade(ratio, { large = false } = {}) {
  const threshold = large ? 3 : 4.5
  if (ratio >= 7) return { level: 'AAA', pass: true }
  if (ratio >= threshold) return { level: 'AA', pass: true }
  return { level: 'Fail', pass: false }
}
