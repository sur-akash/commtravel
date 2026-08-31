/* =============================================================================
   Icon — flat, single-colour line pictograms in the CommBank style.

   Deliberately not emoji and not gradient illustrations: 1.5px strokes on a
   24px grid, `currentColor` throughout, so an icon inherits whatever text
   colour its context sets and can never break a contrast rule on its own.
   ============================================================================= */

const paths = {
  /* --- merchant categories ------------------------------------------------ */
  store: (
    <>
      <path d="M4 9.5 5.5 5h13L20 9.5" />
      <path d="M4 9.5h16v9.5a.5.5 0 0 1-.5.5h-15a.5.5 0 0 1-.5-.5V9.5Z" />
      <path d="M9.5 19.5V14h5v5.5" />
    </>
  ),
  train: (
    <>
      <rect x="5" y="3.5" width="14" height="13" rx="3" />
      <path d="M5 11h14" />
      <path d="M9 20.5 7 17M15 20.5l2-3.5" />
      <circle cx="9" cy="13.75" r=".9" fill="currentColor" stroke="none" />
      <circle cx="15" cy="13.75" r=".9" fill="currentColor" stroke="none" />
    </>
  ),
  bowl: (
    <>
      <path d="M3.5 11h17a8.5 8.5 0 0 1-8.5 8.5A8.5 8.5 0 0 1 3.5 11Z" />
      <path d="M9 7.5c0-1.5 1.5-1.8 1.5-3M13 7.5c0-1.5 1.5-1.8 1.5-3" />
    </>
  ),
  bag: (
    <>
      <path d="M5 7.5h14l1 12.5H4L5 7.5Z" />
      <path d="M9 9.5v-2a3 3 0 0 1 6 0v2" />
    </>
  ),
  ticket: (
    <>
      <path d="M3.5 8.5V6.5a.5.5 0 0 1 .5-.5h16a.5.5 0 0 1 .5.5v2a2.5 2.5 0 0 0 0 7v2a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5v-2a2.5 2.5 0 0 0 0-7Z" />
      <path d="M14 6.5v11" strokeDasharray="2 2.5" />
    </>
  ),
  atm: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="1.5" />
      <path d="M3.5 9.5h17" />
      <path d="M7 14.5h4" />
    </>
  ),

  /* --- status and controls ------------------------------------------------ */
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  alert: (
    <>
      <path d="M12 4.5 21 19.5H3L12 4.5Z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="16.75" r=".9" fill="currentColor" stroke="none" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="7.75" r=".9" fill="currentColor" stroke="none" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  lock: (
    <>
      <rect x="4.5" y="10" width="15" height="10" rx="1.5" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    </>
  ),
  unlock: (
    <>
      <rect x="4.5" y="10" width="15" height="10" rx="1.5" />
      <path d="M8 10V7.5a4 4 0 0 1 7.7-1.5" />
    </>
  ),
  arrowUp: <path d="M12 19V5m0 0-6 6m6-6 6 6" />,
  arrowDown: <path d="M12 5v14m0 0 6-6m-6 6-6-6" />,
  arrowRight: <path d="M5 12h14m0 0-6-6m6 6-6 6" />,
  chevronDown: <path d="m6 9.5 6 6 6-6" />,
  play: <path d="M7.5 5.5 18.5 12l-11 6.5v-13Z" strokeLinejoin="round" />,
  pause: <path d="M9 5.5v13M15 5.5v13" />,
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20.5 4v4.5H16" />
    </>
  ),
  drag: (
    <>
      <path d="M8.5 7h.01M8.5 12h.01M8.5 17h.01M15.5 7h.01M15.5 12h.01M15.5 17h.01" />
    </>
  ),

  /* --- travel ------------------------------------------------------------- */
  card: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <path d="M6.5 14.5h3.5" />
    </>
  ),
  plane: <path d="M10.5 20.5 12 15l-7 1v-2l7-3.5V4.8a1.3 1.3 0 0 1 2.6 0v5.7L21.5 14v2l-7-1 1.5 5.5-2.5-1.5-3 1.5Z" />,
  passport: (
    <>
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <circle cx="12" cy="10" r="2.75" />
      <path d="M9 16.5h6" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 19.5 6v6c0 4.2-3 7.4-7.5 8.5C7.5 19.4 4.5 16.2 4.5 12V6L12 3.5Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  lounge: (
    <>
      <path d="M4.5 12.5V8a2 2 0 0 1 4 0v3.5h7V8a2 2 0 0 1 4 0v4.5" />
      <path d="M3.5 12.5h17V17a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-4.5Z" />
      <path d="M6 18v2M18 18v2" />
    </>
  ),
  coins: (
    <>
      <ellipse cx="12" cy="7" rx="7.5" ry="3.25" />
      <path d="M4.5 7v5c0 1.8 3.4 3.25 7.5 3.25s7.5-1.45 7.5-3.25V7" />
      <path d="M4.5 12v5c0 1.8 3.4 3.25 7.5 3.25s7.5-1.45 7.5-3.25v-5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.75" />
    </>
  ),
  phone: (
    <path d="M8.4 4.5H5.6A1.6 1.6 0 0 0 4 6.2c0 7.6 6.2 13.8 13.8 13.8a1.6 1.6 0 0 0 1.7-1.6v-2.8l-3.8-1.3-1.9 2.2a13.4 13.4 0 0 1-5.4-5.4l2.2-1.9L8.4 4.5Z" />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5.3l3.2 2" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h10.9a1.6 1.6 0 0 1 1.6 1.6v1.9" />
      <rect x="4" y="7.5" width="16" height="11.5" rx="2" />
      <circle cx="16" cy="13.25" r="1.15" fill="currentColor" stroke="none" />
    </>
  ),
}

export const ICON_NAMES = Object.keys(paths)

export default function Icon({ name, size = 20, strokeWidth = 1.5, className = '', title, ...rest }) {
  const content = paths[name] ?? paths.info
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {content}
    </svg>
  )
}

/**
 * The CommBank diamond. Served from /public rather than redrawn — the real
 * 2020 mark, gradient and folded corner included.
 *
 * Decorative by default: the header pairs it with the visible "CommTravel"
 * wordmark, so announcing it again would just be noise to a screen reader.
 */
export function DiamondMark({ size = 28, className = '', alt = '' }) {
  return (
    <img
      className={className}
      src="/commbank-diamond.webp"
      width={size}
      height={size}
      alt={alt}
      aria-hidden={alt ? undefined : 'true'}
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  )
}
