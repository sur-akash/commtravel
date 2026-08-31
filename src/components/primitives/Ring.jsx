/* =============================================================================
   Ring — the budget dial.

   An SVG circle whose dash offset is the progress. The figure in the middle is
   real text rather than SVG <text>, so it inherits the type tokens and stays
   selectable and legible at any zoom.
   ============================================================================= */

export default function Ring({
  value,
  max = 100,
  size = 160,
  thickness = 12,
  tone = 'var(--color-text)',
  track = 'var(--color-surface-band-deep)',
  children,
  label,
}) {
  const percent = max ? Math.max(0, Math.min(1, value / max)) : 0
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div
      className="ring"
      style={{ position: 'relative', width: size, height: size, flex: 'none' }}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <svg width={size} height={size} aria-hidden="true" focusable="false">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={track}
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent)}
          /* Start at 12 o'clock rather than 3. */
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset var(--dur-slow) var(--ease)' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeContent: 'center',
          textAlign: 'center',
          gap: 'var(--space-1)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
