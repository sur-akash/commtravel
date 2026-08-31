/* =============================================================================
   TransactionReceipt

   One arriving transaction, in full. The field order is fixed by the product
   argument, not by layout convenience:

     1. Merchant, category pictogram, local time
     2. The local-currency amount, as the primary figure
     3. The AUD equivalent, directly beneath
     4. The rate applied, named explicitly as locked or not
     5. The fee — ALWAYS shown, including when it is zero
     6. Which currency bucket paid for it
     7. What that saved against a card charging the usual 3%

   Five states: a normal tap, a DCC offer declined, an ATM withdrawal with two
   separate fees, a decline, and a charge that needs confirming. A sixth
   ('insurance') is the large purchase that switches the included cover on.
   ============================================================================= */

import { useEffect, useRef, useState } from 'react'
import { Button, Chip, Icon } from './primitives/index.jsx'
import {
  formatAud,
  formatLocal,
  formatRate,
  formatRatePair,
  formatTime,
} from '../lib/format.js'
import { CURRENCY_META, STANDARD_CARD_FX_FEE } from '../data/fx.js'
import './TransactionReceipt.css'

/* -----------------------------------------------------------------------------
   Shared line items
   -------------------------------------------------------------------------- */

function Line({ label, children, variant }) {
  return (
    <div className={`receipt__line ${variant ? `receipt__line--${variant}` : ''}`}>
      <dt>{label}</dt>
      <dd data-figure>{children}</dd>
    </div>
  )
}

/**
 * The fee line. Rendered on every single receipt, including — especially —
 * when the number is zero.
 */
function FeeLine({ amount, label = 'International transaction fee' }) {
  const isZero = !amount
  return (
    <Line label={label}>
      <span className={isZero ? 'receipt__fee-zero' : 'receipt__fee-charged'}>
        {formatAud(amount ?? 0)}
      </span>
    </Line>
  )
}

function RateLine({ tx }) {
  if (!tx.rateApplied) return null
  return (
    <Line label="Converted at">
      <span className="receipt__amount">{formatRatePair(tx.rateApplied, tx.currency)}</span>{' '}
      <span className="receipt__rate-note">
        {tx.rateIsLocked ? '(your locked rate)' : '(market rate on the day)'}
      </span>
    </Line>
  )
}

function BucketLine({ tx }) {
  if (!tx.bucket) return null
  const symbol = CURRENCY_META[tx.bucket]?.symbol ?? tx.bucket
  return <Line label="Paid from">Your {symbol} balance</Line>
}

/* -----------------------------------------------------------------------------
   The savings chip
   -------------------------------------------------------------------------- */

function SavingsChip({ tx }) {
  if (tx.kind === 'declined') return null

  // An ATM withdrawal can genuinely come out behind once CommBank's $3.50 is in
  // the mix. Saying so is more persuasive than hiding it.
  if (typeof tx.savedAud === 'number' && tx.savedAud < 0) {
    return (
      <Chip tone="neutral">
        A standard card would have cost {formatAud(Math.abs(tx.savedAud))} less here
      </Chip>
    )
  }

  if (!tx.savedAud || tx.savedAud < 0.01) return null

  return (
    <Chip tone="success" icon="check">
      Saved {formatAud(tx.savedAud)} vs a standard card
    </Chip>
  )
}

/* -----------------------------------------------------------------------------
   State-specific banners
   -------------------------------------------------------------------------- */

function DccBanner({ tx }) {
  const [open, setOpen] = useState(false)
  const { offeredRate, wouldHavePaidAud, avoidedAud } = tx.dcc

  return (
    <div className="receipt__banner receipt__banner--warn">
      <p className="receipt__banner-head">
        <Icon name="alert" size={18} />
        The merchant offered to charge you in AUD
      </p>
      <p>
        Their rate was {formatRate(offeredRate, tx.currency)}, not your locked{' '}
        {formatRate(tx.rateApplied, tx.currency)}. You chose the local currency and kept{' '}
        {formatAud(avoidedAud)}.
      </p>

      <div className="receipt__compare">
        <div className="receipt__compare-cell receipt__compare-cell--bad">
          <span className="receipt__compare-label">Their AUD offer</span>
          <span className="receipt__compare-value" data-figure>
            {formatAud(wouldHavePaidAud)}
          </span>
        </div>
        <div className="receipt__compare-cell receipt__compare-cell--good">
          <span className="receipt__compare-label">You paid in {tx.currency}</span>
          <span className="receipt__compare-value" data-figure>
            {formatAud(tx.audAmount)}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="receipt__explainer-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? 'Hide explanation' : 'Why did this happen?'}
        <Icon name="chevronDown" size={14} />
      </button>

      {open ? (
        <p className="receipt__explainer">
          This is dynamic currency conversion. Overseas terminals often offer to bill you in
          Australian dollars, using a rate the merchant sets rather than the one on your card.
          It always costs more. Always choose the local currency.
        </p>
      ) : null}
    </div>
  )
}

function AtmLines({ tx }) {
  const { cbaFeeAud, operatorSurchargeLocal, operatorSurchargeAud, wdmWouldSaveAud } = tx.atm
  const total = tx.audAmount + cbaFeeAud + operatorSurchargeAud

  return (
    <>
      <RateLine tx={tx} />
      <Line label="CommBank overseas withdrawal fee">
        <span className="receipt__fee-charged">{formatAud(cbaFeeAud)}</span>
      </Line>
      <Line label="7-Eleven operator surcharge">
        <span className="receipt__fee-charged">
          {formatLocal(operatorSurchargeLocal, tx.currency)} ({formatAud(operatorSurchargeAud)})
        </span>
      </Line>
      <FeeLine amount={0} />
      <BucketLine tx={tx} />
      <Line label="Total debited" variant="total">
        <span className="receipt__amount">{formatAud(total)}</span>
      </Line>
      <p className="receipt__banner receipt__banner--info" style={{ marginTop: 'var(--space-2)' }}>
        <span className="receipt__banner-head">
          <Icon name="info" size={18} />A World Debit Mastercard would have saved{' '}
          {formatAud(wdmWouldSaveAud)} here
        </span>
        <span>
          It charges $0 at any overseas ATM. The {formatLocal(operatorSurchargeLocal, tx.currency)}{' '}
          surcharge is 7-Eleven&rsquo;s own and applies whichever card you use.
        </span>
      </p>
    </>
  )
}

function DeclinedBanner({ tx, onLoadCurrency, onSeeCurrencies }) {
  const { currencyName, currency } = tx.declined
  return (
    <div className="receipt__banner receipt__banner--alert">
      <p className="receipt__banner-head">
        <Icon name="alert" size={18} />
        Declined — {currencyName} isn&rsquo;t on your card
      </p>
      <p>
        Your Travel Money Card holds 16 currencies. {currency} isn&rsquo;t one of them, so there
        was nothing to fall back on.
      </p>
      <p>
        Tap in a currency you hold but haven&rsquo;t loaded and we use the next one in your stack,
        at the Visa rate plus 3%. That needs the currency on the card first.
      </p>
      <div className="receipt__banner-actions">
        <Button size="sm" variant="primary" onClick={onLoadCurrency}>
          Pay with World Debit Mastercard
        </Button>
        <Button size="sm" variant="secondary" onClick={onSeeCurrencies}>
          See your 16 currencies
        </Button>
      </div>
    </div>
  )
}

function SuspiciousBanner({ tx, onResolve, onLockCard }) {
  const resolved = tx.suspicious?.resolved

  if (resolved === 'yes') {
    return (
      <div className="receipt__banner receipt__banner--success">
        <p className="receipt__banner-head">
          <Icon name="check" size={18} />
          Thanks — we&rsquo;ve left it alone
        </p>
        <p>Your card stays active. We&rsquo;ll stop asking about this merchant.</p>
      </div>
    )
  }

  if (resolved === 'no') {
    return (
      <div className="receipt__banner receipt__banner--alert">
        <p className="receipt__banner-head">
          <Icon name="lock" size={18} />
          Card locked and the charge disputed
        </p>
        <p>
          A replacement card is on its way to your hotel. You can still spend from your backup
          card ending 4425.
        </p>
      </div>
    )
  }

  return (
    <div className="receipt__banner receipt__banner--alert">
      <p className="receipt__banner-head">
        <Icon name="alert" size={18} />
        Was this you?
      </p>
      <p>
        A card-not-present charge, at an hour you&rsquo;re usually asleep. Tell us and we&rsquo;ll
        act on it now.
      </p>
      <div className="receipt__answer">
        <Button size="sm" variant="secondary" onClick={() => onResolve(tx.id, 'yes')}>
          Yes, that was me
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onResolve(tx.id, 'no')}>
          No, I don&rsquo;t recognise it
        </Button>
        <Button size="sm" variant="danger" icon="lock" onClick={onLockCard}>
          Lock card
        </Button>
      </div>
    </div>
  )
}

function InsuranceBanner({ tx }) {
  const { countsTowardActivationAud, tmcWouldHaveCostAud } = tx.insurance
  return (
    <div className="receipt__banner receipt__banner--success">
      <p className="receipt__banner-head">
        <Icon name="shield" size={18} />
        Your included travel insurance just switched on
      </p>
      <p>
        This {formatAud(countsTowardActivationAud)} of prepaid travel took you past the $500 your
        Awards credit card needs. You and everyone on the booking are covered.
      </p>
      <p>
        Your Ultimate Awards card charges no international transaction fee, so this cost nothing
        extra to put there. On your Travel Money Card it would have been{' '}
        {formatAud(tmcWouldHaveCostAud)} at your locked rate — but it would not have activated
        anything.
      </p>
    </div>
  )
}

/* -----------------------------------------------------------------------------
   The receipt
   -------------------------------------------------------------------------- */

export default function TransactionReceipt({
  transaction: tx,
  onSettle,
  onResolveSuspicious = () => {},
  onLockCard = () => {},
  onLoadCurrency = () => {},
  onSeeCurrencies = () => {},
}) {
  const ref = useRef(null)
  const isSpecial = tx.kind !== 'purchase'

  // Clear the entrance flag once the animation has finished, so a later
  // re-render can't replay it. Falls back to a timeout because the reduced-
  // motion override shortens the animation rather than removing it.
  useEffect(() => {
    if (!tx.isNew || !onSettle) return undefined
    const node = ref.current
    const done = () => onSettle(tx.id)
    node?.addEventListener('animationend', done, { once: true })
    const fallback = setTimeout(done, 1200)
    return () => {
      node?.removeEventListener('animationend', done)
      clearTimeout(fallback)
    }
  }, [tx.isNew, tx.id, onSettle])

  const symbol = CURRENCY_META[tx.currency]?.symbol ?? ''

  return (
    <article
      ref={ref}
      className={`receipt receipt--${tx.kind} ${tx.isNew ? 'is-new' : ''}`}
      aria-label={`${tx.merchant}, ${formatLocal(tx.localAmount, tx.currency)}`}
    >
      <header className="receipt__head">
        <span className="receipt__icon">
          <Icon name={tx.icon} size={20} />
        </span>
        <div className="receipt__ident">
          <h3 className="receipt__merchant">{tx.merchant}</h3>
          <p className="receipt__meta">
            <span className="receipt__meta-place">{tx.location}</span>
            <span className="receipt__meta-time">{formatTime(tx.timestamp)}</span>
          </p>
        </div>
        {isSpecial ? (
          <span className="receipt__head-chip">
            {tx.kind === 'declined' ? (
              <Chip tone="alert">Declined</Chip>
            ) : tx.kind === 'dcc' ? (
              <Chip tone="warn">DCC offered</Chip>
            ) : tx.kind === 'atm' ? (
              <Chip tone="info">Cash</Chip>
            ) : tx.kind === 'suspicious' ? (
              <Chip tone="alert">Needs checking</Chip>
            ) : tx.kind === 'insurance' ? (
              <Chip tone="success">Cover activated</Chip>
            ) : null}
          </span>
        ) : null}
      </header>

      {/* 2 + 3 — the local figure, then what it is in AUD */}
      <div className="receipt__amounts">
        <p className="receipt__local" data-figure>
          {formatLocal(tx.localAmount, tx.currency)}
        </p>
        {tx.audAmount != null ? (
          <p className="receipt__aud" data-figure>
            {formatAud(tx.audAmount)}
          </p>
        ) : (
          <p className="receipt__aud">Nothing was charged</p>
        )}
      </div>

      {tx.kind === 'dcc' ? <DccBanner tx={tx} /> : null}
      {tx.kind === 'declined' ? (
        <DeclinedBanner
          tx={tx}
          onLoadCurrency={onLoadCurrency}
          onSeeCurrencies={onSeeCurrencies}
        />
      ) : null}
      {tx.kind === 'suspicious' ? (
        <SuspiciousBanner tx={tx} onResolve={onResolveSuspicious} onLockCard={onLockCard} />
      ) : null}
      {tx.kind === 'insurance' ? <InsuranceBanner tx={tx} /> : null}

      {/* 4 + 5 + 6 — rate, fee, bucket */}
      {tx.kind !== 'declined' ? (
        <dl className="receipt__lines">
          {tx.kind === 'atm' ? (
            <AtmLines tx={tx} />
          ) : (
            <>
              <RateLine tx={tx} />
              <FeeLine amount={tx.feeAud} />
              <BucketLine tx={tx} />
              {tx.card !== 'Travel Money Card' ? <Line label="Card">{tx.card}</Line> : null}
            </>
          )}
        </dl>
      ) : null}

      {/* 7 — what it saved */}
      <div className="receipt__foot">
        <SavingsChip tx={tx} />
        {tx.kind === 'purchase' ? (
          <span className="receipt__meta" style={{ fontSize: 'var(--fs-xs)' }}>
            Based on a {STANDARD_CARD_FX_FEE * 100}% foreign transaction fee
          </span>
        ) : null}
      </div>
    </article>
  )
}
