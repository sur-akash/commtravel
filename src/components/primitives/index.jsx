/* =============================================================================
   Primitive components. Thin wrappers over the classes in primitives.css so
   that variant names are typed in one place rather than spelled out as strings
   at every call site.
   ============================================================================= */

import { forwardRef } from 'react'
import './primitives.css'
import Icon from './Icon.jsx'

export { default as Icon, DiamondMark, ICON_NAMES } from './Icon.jsx'
export { default as Sparkline } from './Sparkline.jsx'
export { default as Ring } from './Ring.jsx'
export { default as AnimatedNumber } from './AnimatedNumber.jsx'

/* forwardRef so callers can move focus to a button — the emergency drawer
   focuses its close button on open, which is what makes it keyboard-usable. */
export const Button = forwardRef(function Button(
  {
    as: Tag = 'button',
    variant = 'primary',
    size = 'md',
    block = false,
    icon,
    iconAfter,
    className = '',
    children,
    ...rest
  },
  ref
) {
  const classes = [
    'btn',
    `btn--${variant}`,
    size === 'sm' ? 'btn--sm' : '',
    block ? 'btn--block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Tag
      ref={ref}
      className={classes}
      {...(Tag === 'button' ? { type: rest.type ?? 'button' } : {})}
      {...rest}
    >
      {icon ? <Icon name={icon} size={size === 'sm' ? 16 : 18} /> : null}
      {children}
      {iconAfter ? <Icon name={iconAfter} size={size === 'sm' ? 16 : 18} /> : null}
    </Tag>
  )
})

export function Chip({ tone = 'neutral', icon, className = '', children, ...rest }) {
  const classes = ['chip', tone !== 'neutral' ? `chip--${tone}` : '', className]
    .filter(Boolean)
    .join(' ')
  return (
    <span className={classes} {...rest}>
      {icon ? <Icon name={icon} size={14} /> : null}
      {children}
    </span>
  )
}

export function Card({ as: Tag = 'div', variant, flush = false, className = '', children, ...rest }) {
  const classes = [
    'card',
    variant ? `card--${variant}` : '',
    flush ? 'card--flush' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  )
}

/**
 * Progress bar. Always paired with a visible text figure by its caller, so the
 * bar itself is decorative to a screen reader unless a label is passed.
 */
export function ProgressBar({ value, max = 100, tone = 'brand', label }) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div
      className="progress"
      role={label ? 'progressbar' : 'presentation'}
      aria-valuenow={label ? Math.round(percent) : undefined}
      aria-valuemin={label ? 0 : undefined}
      aria-valuemax={label ? 100 : undefined}
      aria-label={label}
    >
      <div className={`progress__fill progress__fill--${tone}`} style={{ width: `${percent}%` }} />
    </div>
  )
}

export function Eyebrow({ children, className = '' }) {
  return <p className={`eyebrow ${className}`}>{children}</p>
}
