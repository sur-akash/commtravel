/* =============================================================================
   BenefitsWallet — entitlements with activation state, expiry, and the gap.

   The insurance progress bar is live: the "large purchase" event on the
   dashboard pushes prepaid travel past $500 and this switches from blocked to
   active while you watch.
   ============================================================================= */

import { Link } from 'react-router-dom'
import { Button, Chip, Icon, ProgressBar } from './primitives/index.jsx'
import { formatAud, formatDate } from '../lib/format.js'
import './BenefitsWallet.css'

const STATE_LABEL = {
  active: { text: 'Active', tone: 'success' },
  'needs-activation': { text: 'Not activated', tone: 'warn' },
  blocked: { text: 'Not yet available', tone: 'warn' },
  used: { text: 'Used', tone: 'neutral' },
}

export default function BenefitsWallet({ benefits, onActivate, compact = false, className = '' }) {
  const visible = compact
    ? benefits.filter((benefit) => benefit.progress || benefit.counter)
    : benefits

  return (
    <ul className={`wallet ${className}`.trim()}>
      {visible.map((benefit) => {
        const state = STATE_LABEL[benefit.state] ?? STATE_LABEL.active
        const shortfall = benefit.progress
          ? benefit.progress.max - benefit.progress.value
          : 0

        return (
          <li className={`wallet__card wallet__card--${benefit.state}`} key={benefit.id}>
            <div className="wallet__head">
              <span className="wallet__icon">
                <Icon name={benefit.icon} size={20} />
              </span>
              <span className="wallet__ident">
                <span className="wallet__name">{benefit.name}</span>
                <span className="wallet__source">{benefit.source}</span>
              </span>
              <Chip tone={state.tone}>{state.text}</Chip>
            </div>

            <p className="wallet__headline">{benefit.headline}</p>
            {!compact ? <p className="wallet__detail">{benefit.detail}</p> : null}

            {benefit.progress ? (
              <div className="wallet__progress">
                <ProgressBar
                  value={benefit.progress.value}
                  max={benefit.progress.max}
                  tone={shortfall > 0 ? 'warn' : 'success'}
                  label={benefit.progress.label}
                />
                <p className="wallet__progress-label" data-figure>
                  {formatAud(benefit.progress.value)} of {formatAud(benefit.progress.max)}
                  {shortfall > 0 ? ` · ${formatAud(shortfall)} to go` : ' · threshold met'}
                </p>
              </div>
            ) : null}

            {benefit.counter ? (
              <div className="wallet__pips" aria-hidden="true">
                {Array.from({ length: benefit.counter.total }).map((_, index) => (
                  <span
                    key={index}
                    className={`wallet__pip ${index < benefit.counter.used ? 'is-used' : ''}`}
                  />
                ))}
              </div>
            ) : null}

            {benefit.expiry ? (
              <p className="wallet__expiry">
                <Icon name="clock" size={14} />
                Expires {formatDate(benefit.expiry)}
              </p>
            ) : null}

            {benefit.action && !compact ? (
              <div className="wallet__action">
                <Button size="sm" variant="primary" onClick={onActivate}>
                  {benefit.action.label}
                </Button>
              </div>
            ) : benefit.action && compact ? (
              <div className="wallet__action">
                <Button as={Link} to="/benefits" size="sm" variant="secondary">
                  {benefit.action.label}
                </Button>
              </div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
