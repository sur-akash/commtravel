/* =============================================================================
   Confidence layer — "will my card work here?"

   Three pieces that belong together:
     · the DCC explainer, as a first-class card rather than an FAQ entry
     · the backup card, which CommBank issues and nobody ever activates
     · the card comparison strip, answering which one to pack for THIS trip
   ============================================================================= */

import { Button, Card, Chip, Icon } from './primitives/index.jsx'
import { CARD_PRODUCTS, getCard, recommendForTrip } from '../data/cards.js'
import { formatAud, formatDate, formatRate } from '../lib/format.js'
import './ConfidenceLayer.css'

/* -----------------------------------------------------------------------------
   DCC
   -------------------------------------------------------------------------- */

export function DccExplainer({ lockedRate, currency = 'JPY' }) {
  // A representative purchase, priced both ways. Numbers are derived from the
  // real locked rate so this card never disagrees with a receipt in the feed.
  const localAmount = 12800
  const dccRate = lockedRate * 0.95
  const localCost = localAmount / lockedRate
  const dccCost = localAmount / dccRate

  return (
    <Card variant="accent" className="dcc">
      <div className="dcc__head">
        <span className="dcc__icon">
          <Icon name="alert" size={22} />
        </span>
        <div>
          <h3 className="dcc__title">Always choose the local currency</h3>
          <p className="dcc__lede">
            Overseas terminals often offer to bill you in Australian dollars. It looks helpful. It
            is a worse rate, set by the merchant, and it costs you every time.
          </p>
        </div>
      </div>

      <div className="dcc__compare">
        <div className="dcc__cell dcc__cell--bad">
          <span className="dcc__cell-label">
            <Icon name="close" size={14} />
            &ldquo;Charge me in AUD&rdquo;
          </span>
          <span className="dcc__cell-figure" data-figure>
            {formatAud(dccCost)}
          </span>
          <span className="dcc__cell-note">
            at the merchant&rsquo;s {formatRate(dccRate, currency)}
          </span>
        </div>

        <div className="dcc__cell dcc__cell--good">
          <span className="dcc__cell-label">
            <Icon name="check" size={14} />
            &ldquo;Charge me in {currency}&rdquo;
          </span>
          <span className="dcc__cell-figure" data-figure>
            {formatAud(localCost)}
          </span>
          <span className="dcc__cell-note">at your locked {formatRate(lockedRate, currency)}</span>
        </div>
      </div>

      <p className="dcc__verdict">
        Same coffee, same shop, same second. Choosing local currency on a{' '}
        {localAmount.toLocaleString('en-AU')} yen purchase keeps{' '}
        <strong>{formatAud(dccCost - localCost)}</strong> in your pocket.
      </p>
    </Card>
  )
}

/* -----------------------------------------------------------------------------
   Backup card
   -------------------------------------------------------------------------- */

export function BackupCard({ card, activated, onActivate }) {
  if (!card) return null

  return (
    <Card className={`backup ${activated ? 'backup--active' : ''}`}>
      <div className="backup__head">
        <span className={`backup__icon ${activated ? 'is-active' : ''}`}>
          <Icon name="card" size={22} />
        </span>
        <div className="backup__ident">
          <h3 className="backup__title">Your second card</h3>
          <p className="backup__sub">
            {card.name.replace(' — backup', '')} ending {card.last4} · expires{' '}
            {formatDate(card.expiry)}
          </p>
        </div>
        <Chip tone={activated ? 'success' : 'warn'}>{activated ? 'Activated' : 'Not activated'}</Chip>
      </div>

      <p className="backup__body">
        {activated
          ? 'Ready to use. Keep it in your hotel safe, not your wallet — the point of a spare is that it isn’t stolen with the first one.'
          : 'Your Travel Money Card was issued as a pair. The spare is sitting unactivated, which makes it useless the moment you need it. Two minutes now.'}
      </p>

      {!activated ? (
        <Button variant="primary" size="sm" onClick={onActivate}>
          Activate the spare
        </Button>
      ) : null}
    </Card>
  )
}

/* -----------------------------------------------------------------------------
   Card comparison
   -------------------------------------------------------------------------- */

export function CardComparison({ trip, currencyLoaded }) {
  const recommendations = recommendForTrip({
    currencyLoaded,
    lengthDays: trip?.lengthDays ?? 9,
  })

  return (
    <div className="compare">
      <div className="compare__scroll">
        <table className="compare__table">
          <caption className="sr-only">
            Card comparison for {trip?.destination.city ?? 'this trip'}
          </caption>
          <thead>
            <tr>
              <th scope="col">For this trip</th>
              {CARD_PRODUCTS.map((card) => (
                <th scope="col" key={card.id}>
                  {card.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">International transaction fee</th>
              {CARD_PRODUCTS.map((card) => (
                <td key={card.id}>
                  <span className={card.intlTransactionFeePct === 0 ? 'compare__good' : 'compare__bad'}>
                    {card.intlTransactionFeePct === 0 ? '$0' : `${card.intlTransactionFeePct}%`}
                  </span>
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Overseas ATM withdrawal</th>
              {CARD_PRODUCTS.map((card) => (
                <td key={card.id}>
                  <span className={card.overseasAtmFeeAud === 0 ? 'compare__good' : 'compare__bad'}>
                    {card.overseasAtmFeeAud === 0
                      ? '$0'
                      : formatAud(card.overseasAtmFeeAud, { decimals: 2 })}
                  </span>
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Rate locked before you go</th>
              {CARD_PRODUCTS.map((card) => (
                <td key={card.id}>
                  {card.ratesLocked ? (
                    <span className="compare__good">
                      Yes, {card.currencyCount} currencies
                    </span>
                  ) : (
                    <span className="compare__muted">No — market rate on the day</span>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Ongoing cost</th>
              {CARD_PRODUCTS.map((card) => (
                <td key={card.id}>
                  {card.monthlyFeeAud ? (
                    <span className={card.monthlyFeeWaivedAtAud ? 'compare__muted' : 'compare__bad'}>
                      {formatAud(card.monthlyFeeAud, { decimals: 0 })} a month
                      {card.monthlyFeeWaivedAtAud
                        ? `, waived at ${formatAud(card.monthlyFeeWaivedAtAud, { decimals: 0 })} spend`
                        : ''}
                    </span>
                  ) : (
                    <span className="compare__good">Nothing</span>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Lounge visits a year</th>
              {CARD_PRODUCTS.map((card) => (
                <td key={card.id}>
                  {card.loungePassesPerYear ? (
                    <span className="compare__good">
                      {card.loungePassesPerYear} · {card.loungeProgram}
                    </span>
                  ) : (
                    <span className="compare__muted">None</span>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Included travel insurance</th>
              {CARD_PRODUCTS.map((card) => (
                <td key={card.id}>
                  {card.insurance ? (
                    <span className="compare__good">
                      Yes
                      {card.insurance.spendThresholdAud
                        ? `, after ${formatAud(card.insurance.spendThresholdAud, { decimals: 0 })} prepaid travel`
                        : card.insurance.maxDaysPerTrip
                          ? `, up to ${card.insurance.maxDaysPerTrip} days a trip`
                          : ''}
                    </span>
                  ) : (
                    <span className="compare__muted">No</span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* The actual answer, rather than leaving the reader to work it out. */}
      <ul className="compare__verdicts">
        {recommendations.map((recommendation) => {
          const card = getCard(recommendation.cardId)
          const isPrimary = recommendation.role === 'Pack this one'
          return (
            <li className={`verdict ${isPrimary ? 'verdict--primary' : ''}`} key={recommendation.cardId}>
              <Chip tone={isPrimary ? 'brand' : 'outline'}>{recommendation.role}</Chip>
              <span className="verdict__name">{card.name}</span>
              <span className="verdict__why">{recommendation.why}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
