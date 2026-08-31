/* =============================================================================
   LoadCurrencyModal — load a currency without leaving the page.

   The rate you see is the rate you lock. The modal makes that explicit by
   showing the live rate updating right up until you confirm, then reporting the
   exact figure it froze at.
   ============================================================================= */

import { useEffect, useRef, useState } from 'react'
import { Button, Chip, Icon } from './primitives/index.jsx'
import { TMC_CURRENCIES, CURRENCY_META } from '../data/fx.js'
import { formatAud, formatLocal, formatRate } from '../lib/format.js'
import './LoadCurrencyModal.css'

const PRESET_AUD = [200, 500, 1000]

export default function LoadCurrencyModal({ holdings, initialCode, liveRates, onLoad, onClose }) {
  const [code, setCode] = useState(initialCode ?? 'JPY')
  const [audAmount, setAudAmount] = useState(500)
  const [confirmed, setConfirmed] = useState(null)
  const dialogRef = useRef(null)
  const closeRef = useRef(null)

  useEffect(() => {
    closeRef.current?.focus()

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = dialogRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previous
    }
  }, [onClose])

  const existing = holdings.find((holding) => holding.code === code)
  // A currency already held keeps its locked rate; a new one locks at today's.
  const rate = liveRates[code] ?? existing?.liveRate ?? 1
  const meta = CURRENCY_META[code] ?? { symbol: code, name: code, decimals: 2 }
  const localAmount = audAmount * rate

  const confirm = () => {
    onLoad(code, Math.round(localAmount))
    setConfirmed({ code, localAmount, audAmount, rate })
  }

  return (
    <div
      className="modal__scrim"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="modal" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="load-title">
        <div className="modal__head">
          <h2 id="load-title" style={{ fontSize: 'var(--fs-h3)' }}>
            {confirmed ? 'Loaded' : 'Load currency'}
          </h2>
          <Button
            ref={closeRef}
            variant="ghost"
            size="sm"
            icon="close"
            onClick={onClose}
            aria-label="Close"
          />
        </div>

        {confirmed ? (
          <div className="modal__done">
            <p className="modal__done-figure" data-figure>
              {formatLocal(Math.round(confirmed.localAmount), confirmed.code)}
            </p>
            <p className="modal__done-note">
              Locked at {formatRate(confirmed.rate, confirmed.code)} {confirmed.code}/AUD, for{' '}
              {formatAud(confirmed.audAmount)}. That rate is yours now, whatever the market does
              next.
            </p>
            <Button variant="primary" onClick={onClose} block>
              Done
            </Button>
          </div>
        ) : (
          <>
            <div className="modal__field">
              <label className="modal__label" htmlFor="load-currency">
                Currency
              </label>
              <select
                id="load-currency"
                className="modal__select"
                value={code}
                onChange={(event) => setCode(event.target.value)}
              >
                {TMC_CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency} — {CURRENCY_META[currency]?.name ?? currency}
                  </option>
                ))}
              </select>
              <p className="modal__hint">
                All 16 currencies your Travel Money Card can hold. Each one locks its own rate.
              </p>
            </div>

            <div className="modal__field">
              <label className="modal__label" htmlFor="load-amount">
                Amount in Australian dollars
              </label>
              <input
                id="load-amount"
                className="modal__input"
                type="number"
                min="50"
                max="10000"
                step="50"
                value={audAmount}
                onChange={(event) => setAudAmount(Math.max(0, Number(event.target.value)))}
              />
              <div className="modal__presets">
                {PRESET_AUD.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`modal__preset ${audAmount === preset ? 'is-active' : ''}`}
                    onClick={() => setAudAmount(preset)}
                    aria-pressed={audAmount === preset}
                  >
                    {formatAud(preset, { decimals: 0 })}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal__preview">
              <span className="modal__preview-label">You&rsquo;ll get</span>
              <span className="modal__preview-figure" data-figure>
                {formatLocal(Math.round(localAmount), code)}
              </span>
              <span className="modal__preview-rate">
                <Icon name="clock" size={14} />
                Live rate {formatRate(rate, code)} {code}/AUD — locks the moment you confirm
              </span>
              {existing && existing.totalLoaded > 0 ? (
                <Chip tone="info">
                  You already hold {formatLocal(Math.round(existing.balance), code)} at{' '}
                  {formatRate(existing.lockedRate, code)}
                </Chip>
              ) : null}
            </div>

            <p className="modal__fees">
              No load fee. No reload fee. No closure fee. Spending a currency you hold costs
              nothing extra — spending one you don&rsquo;t costs the Visa rate plus 3%.
            </p>

            <div className="modal__actions">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" onClick={confirm} disabled={audAmount < 50}>
                Load {formatAud(audAmount, { decimals: 0 })}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
