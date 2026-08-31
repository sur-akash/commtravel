/* =============================================================================
   Sparkline — a 30-day rate series, or spend by day.

   Pure inline SVG on a normalised viewBox with preserveAspectRatio="none", so
   one component stretches to whatever box it's given without needing to know
   its pixel width. Decorative by default: every caller pairs it with the same
   numbers in text.
   ============================================================================= */

export default function Sparkline({
  values = [],
  height = 40,
  tone = 'currentColor',
  fill = false,
  showLast = true,
  label,
  className = '',
}) {
  if (values.length < 2) return null

  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1

  // Normalised space: 0–100 across, 0–100 down, flipped so higher values sit higher.
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 100
    const y = 100 - ((value - min) / span) * 100
    return [x, y]
  })

  const line = points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
  const area = `0,100 ${line} 100,100`
  const [lastX, lastY] = points[points.length - 1]

  return (
    <svg
      className={`sparkline ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      height={height}
      width="100%"
      role={label ? 'img' : 'presentation'}
      aria-label={label}
      aria-hidden={label ? undefined : 'true'}
      focusable="false"
      style={{ display: 'block', overflow: 'visible' }}
    >
      {fill ? <polygon points={area} fill={tone} opacity="0.12" /> : null}
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        /* The viewBox is stretched non-uniformly, which would stretch the stroke
           too. This keeps it an even 2px whatever the box's aspect ratio. */
        vectorEffect="non-scaling-stroke"
      />
      {showLast ? <circle cx={lastX} cy={lastY} r="2.5" fill={tone} vectorEffect="non-scaling-stroke" /> : null}
    </svg>
  )
}
