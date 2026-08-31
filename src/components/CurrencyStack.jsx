/* =============================================================================
   CurrencyStack — what actually happens when you tap.

   The order of this list is the fallback priority: tap in a currency you
   haven't loaded and the card reaches for the top of this stack first. Today
   that behaviour is buried in a PDS. Here you can drag it.

   Reordering works three ways, all driving the same `moveCurrency` action:
     · pointer drag on the handle (works on touch — pointer events, not HTML5 DnD)
     · arrow keys while the handle has focus
     · the visible up/down buttons

   Every reorder is announced through an aria-live region, because the visual
   consequence — the sentence at the bottom rewriting itself — is otherwise
   invisible to a screen reader.
   ============================================================================= */

import { useEffect, useRef, useState } from 'react'
import { Icon, Sparkline } from './primitives/index.jsx'
import { formatLocal, formatRate, formatSignedAud } from '../lib/format.js'
import { fallbackSentence } from '../lib/holdings.js'
import './CurrencyStack.css'

export default function CurrencyStack({ holdings, onMove, onReorder }) {
  const [draggingCode, setDraggingCode] = useState(null)
  const [announcement, setAnnouncement] = useState('')
  const [flash, setFlash] = useState(false)
  const listRef = useRef(null)
  const firstRender = useRef(true)

  const order = holdings.map((holding) => holding.code).join(',')

  // Flash the fallback sentence whenever the order actually changes, but not on
  // first paint — a page that flashes on load reads as a glitch, not feedback.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return undefined
    }
    setFlash(true)
    const timer = setTimeout(() => setFlash(false), 600)
    return () => clearTimeout(timer)
  }, [order])

  const move = (code, direction) => {
    const index = holdings.findIndex((holding) => holding.code === code)
    const target = index + direction
    if (target < 0 || target >= holdings.length) return
    onMove(code, direction)
    setAnnouncement(
      `${code} moved to position ${target + 1} of ${holdings.length}. ${
        target === 0 ? `${code} is now the first fallback.` : ''
      }`
    )
  }

  /* --- pointer drag ------------------------------------------------------- */

  const handlePointerDown = (event, code) => {
    // Left button / primary touch only.
    if (event.button != null && event.button !== 0) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setDraggingCode(code)

    const onPointerMove = (moveEvent) => {
      const items = [...(listRef.current?.querySelectorAll('[data-code]') ?? [])]
      const currentIndex = items.findIndex((item) => item.dataset.code === code)
      if (currentIndex < 0) return

      const pointerY = moveEvent.clientY

      for (let i = 0; i < items.length; i++) {
        if (i === currentIndex) continue
        const rect = items[i].getBoundingClientRect()
        const midpoint = rect.top + rect.height / 2
        // Crossed the midpoint of the item above or below — swap toward it.
        if (
          (i < currentIndex && pointerY < midpoint) ||
          (i > currentIndex && pointerY > midpoint)
        ) {
          onMove(code, i < currentIndex ? -1 : 1)
          return
        }
      }
    }

    const onPointerUp = () => {
      setDraggingCode(null)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
  }

  return (
    <div>
      <ul className="stack" ref={listRef}>
        {holdings.map((holding, index) => {
          const ahead = holding.deltaAud >= 0
          const isHome = holding.code === 'AUD'

          return (
            <li
              key={holding.code}
              data-code={holding.code}
              className={[
                'stack__item',
                draggingCode === holding.code ? 'stack__item--dragging' : '',
                holding.isDestination ? 'stack__item--destination' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <button
                type="button"
                className="stack__handle"
                aria-label={`Reorder ${holding.meta.name}. Currently ${index + 1} of ${holdings.length}. Use arrow keys to move.`}
                onPointerDown={(event) => handlePointerDown(event, holding.code)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowUp') {
                    event.preventDefault()
                    move(holding.code, -1)
                  } else if (event.key === 'ArrowDown') {
                    event.preventDefault()
                    move(holding.code, 1)
                  }
                }}
              >
                <Icon name="drag" size={18} />
              </button>

              <span className="stack__rank" aria-hidden="true">
                {index + 1}
              </span>

              <span className="stack__body">
                <span className="stack__code">
                  <span className="stack__balance">
                    {formatLocal(Math.round(holding.balance), holding.code)}
                  </span>
                  <span className="stack__name">{holding.meta.name}</span>
                </span>
                <span className="stack__rates">
                  {isHome
                    ? 'Your home currency — no conversion'
                    : `Locked ${formatRate(holding.lockedRate, holding.code)} · live ${formatRate(holding.liveRate, holding.code)}`}
                </span>
              </span>

              {!isHome ? (
                <span className="stack__spark" aria-hidden="true">
                  <Sparkline
                    values={holding.history}
                    height={28}
                    tone={ahead ? 'var(--color-success)' : 'var(--color-alert)'}
                  />
                </span>
              ) : null}

              {!isHome ? (
                <span className="stack__delta">
                  <span
                    className={`stack__delta-value ${ahead ? 'stack__delta-value--up' : 'stack__delta-value--down'}`}
                  >
                    <Icon name={ahead ? 'arrowUp' : 'arrowDown'} size={14} />
                    {formatSignedAud(holding.deltaAud)}
                  </span>
                  <span className="stack__delta-label">{ahead ? 'ahead' : 'behind'} on FX</span>
                </span>
              ) : null}
            </li>
          )
        })}
      </ul>

      <p className={`stack__fallback ${flash ? 'stack__fallback--changed' : ''}`}>
        {fallbackSentence(holdings)}{' '}
        <span style={{ color: 'var(--color-text-muted)' }}>
          Anything not on the card converts at the Visa rate plus 3%.
        </span>
      </p>

      <p className="stack__hint">
        Drag a row, or focus a handle and use the arrow keys, to change which balance pays first.
      </p>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  )
}
