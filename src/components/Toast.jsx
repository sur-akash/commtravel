/* =============================================================================
   Toast — "you just saved".

   Fires on arriving transactions where the saving is worth mentioning. Kept
   deliberately quiet: one at a time, four seconds, and never for a rounding
   error. The feed's aria-live region already announces the transaction itself,
   so this is aria-hidden — otherwise a screen reader hears the same event twice.
   ============================================================================= */

import { useEffect, useState } from 'react'
import { Icon } from './primitives/index.jsx'
import { formatAud } from '../lib/format.js'
import './Toast.css'

/** Below this, a "you saved" message is noise rather than news. */
const MIN_SAVING_AUD = 0.35

export function useSavingsToast(lastArrival) {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!lastArrival) return undefined

    const saving = lastArrival.savedAud ?? 0
    const isNotable =
      saving >= MIN_SAVING_AUD || lastArrival.kind === 'dcc' || lastArrival.kind === 'insurance'
    if (!isNotable) return undefined

    setToast({
      id: lastArrival.id,
      kind: lastArrival.kind,
      merchant: lastArrival.merchant,
      amount: lastArrival.kind === 'dcc' ? lastArrival.dcc.avoidedAud : saving,
    })

    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [lastArrival])

  return [toast, () => setToast(null)]
}

export default function Toast({ toast, onDismiss }) {
  if (!toast) return null

  const isDcc = toast.kind === 'dcc'
  const isInsurance = toast.kind === 'insurance'

  return (
    <div className="toast" aria-hidden="true">
      <span className="toast__icon">
        <Icon name={isInsurance ? 'shield' : 'check'} size={18} />
      </span>
      <span className="toast__body">
        <span className="toast__value" data-figure>
          {isInsurance ? 'You’re covered' : `You just saved ${formatAud(toast.amount)}`}
        </span>
        <span className="toast__label">
          {isDcc
            ? `by turning down ${toast.merchant}’s AUD rate`
            : isInsurance
              ? 'that purchase activated your included travel insurance'
              : `at ${toast.merchant}, against a card charging 3%`}
        </span>
      </span>
      <button type="button" className="toast__close" onClick={onDismiss} tabIndex={-1}>
        <Icon name="close" size={16} />
      </button>
    </div>
  )
}
