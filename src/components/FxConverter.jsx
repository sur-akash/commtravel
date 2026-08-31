/* =============================================================================
   FxConverter — the foreign exchange calculator.

   Deliberately does more than convert. Any currency site can tell you what
   A$1,000 buys; the number a traveller actually needs is what it costs them,
   and that depends entirely on which card comes out of the wallet. So this
   shows all three side by side:

     · loaded on a Travel Money Card at a rate locked today
     · spent on a card charging the usual 3% foreign transaction fee
     · offered by a terminal overseas billing you in Australian dollars

   The gap between the first and the last is the whole product argument, and
   it's a number rather than a claim.
   ============================================================================= */

import { useMemo, useState } from 'react'
import { Button, Chip, Icon } from './primitives/index.jsx'
import { TMC_CURRENCIES, CURRENCY_META, STANDARD_CARD_FX_FEE } from '../data/fx.js'
import { WORLD_CURRENCIES } from '../data/globe.js'
import { formatAud, formatRate } from '../lib/format.js'
import './FxConverter.css'

/** Full names for the 16, so the picker reads as words not codes. */
const CURRENCY_NAMES = {
  AUD: 'Australian dollar',
  USD: 'US dollar',
  GBP: 'British pound',
  EUR: 'Euro',
  NZD: 'New Zealand dollar',
  THB: 'Thai baht',
  SGD: 'Singapore dollar',
  JPY: 'Japanese yen',
  HKD: 'Hong Kong dollar',
  CAD: 'Canadian dollar',
  CHF: 'Swiss franc',
  CNY: 'Chinese yuan',
  VND: 'Vietnamese dong',
  ZAR: 'South African rand',
  AED: 'UAE dirham',
  PHP: 'Philippine peso',
}

/** Typical margin a terminal adds when it offers to bill you in AUD. */
const DCC_MARKUP = 0.05

const PRESETS = [200, 500, 1000, 2500]

function formatLocal(amount, code) {
  const decimals = WORLD_CURRENCIES[code]?.decimals ?? (amount >= 1000 ? 0 : 2)
  return new Intl.NumberFormat('en-AU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

export default function FxConverter({ liveRates = {}, defaultTo = 'JPY' }) {
  const [amount, setAmount] = useState(1000)
  const [to, setTo] = useState(defaultTo)
  const [direction, setDirection] = useState('fromAud')

  const rate = useMemo(() => {
    if (to === 'AUD') return 1
    // Prefer a rate the rest of the app is already showing, so the calculator
    // never disagrees with the ledger on the same screen.
    return liveRates[to] ?? WORLD_CURRENCIES[to]?.perAud ?? 1
  }, [to, liveRates])

  const meta = CURRENCY_META[to] ?? { symbol: '', name: to }
  const name = CURRENCY_NAMES[to] ?? to

  const audIn = direction === 'fromAud' ? amount : amount / rate
  const localOut = direction === 'fromAud' ? amount * rate : amount

  // The three ways to pay for the same basket.
  const lockedCostAud = audIn
  const standardCardCostAud = audIn * (1 + STANDARD_CARD_FX_FEE)
  const dccCostAud = audIn * (1 + DCC_MARKUP)
  const savedVsStandard = standardCardCostAud - lockedCostAud
  const savedVsDcc = dccCostAud - lockedCostAud

  const swap = () => {
    setDirection((d) => (d === 'fromAud' ? 'toAud' : 'fromAud'))
    setAmount(Math.round((direction === 'fromAud' ? localOut : audIn) * 100) / 100)
  }

  return (
    <div className="fx">
      <div className="fx__inputs">
        <div className="fx__field">
          <label className="fx__label" htmlFor="fx-amount">
            {direction === 'fromAud' ? 'You have' : 'You need'}
          </label>
          <div className="fx__amount">
            <span className="fx__prefix">{direction === 'fromAud' ? 'A$' : meta.symbol}</span>
            <input
              id="fx-amount"
              className="fx__input"
              type="number"
              min="1"
              max="100000"
              value={amount}
              onChange={(event) => setAmount(Math.max(0, Number(event.target.value)))}
            />
          </div>
          <div className="fx__presets">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={`fx__preset ${amount === preset ? 'is-active' : ''}`}
                onClick={() => setAmount(preset)}
                aria-pressed={amount === preset}
              >
                {direction === 'fromAud' ? formatAud(preset, { decimals: 0 }) : preset}
              </button>
            ))}
          </div>
        </div>

        <button type="button" className="fx__swap" onClick={swap} aria-label="Swap direction">
          <Icon name="refresh" size={20} />
        </button>

        <div className="fx__field">
          <label className="fx__label" htmlFor="fx-currency">
            {direction === 'fromAud' ? 'You get' : 'That costs'}
          </label>
          <select
            id="fx-currency"
            className="fx__select"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          >
            {TMC_CURRENCIES.filter((code) => code !== 'AUD').map((code) => (
              <option key={code} value={code}>
                {code} — {CURRENCY_NAMES[code] ?? code}
              </option>
            ))}
          </select>
          <p className="fx__result" data-figure>
            {direction === 'fromAud'
              ? `${meta.symbol}${formatLocal(localOut, to)}`
              : formatAud(audIn)}
          </p>
          <p className="fx__rate">
            1 AUD = {formatRate(rate, to)} {to} · {name}
          </p>
        </div>
      </div>

      {/* The part a rate table never shows you: what it costs three ways. */}
      <div className="fx__compare">
        <p className="fx__compare-title">The same {meta.symbol}{formatLocal(localOut, to)}, three ways to pay</p>

        <ul className="fx__ways">
          <li className="fx__way fx__way--best">
            <span className="fx__way-head">
              <Icon name="check" size={16} />
              Travel Money Card
            </span>
            <span className="fx__way-cost" data-figure>
              {formatAud(lockedCostAud)}
            </span>
            <span className="fx__way-note">
              Rate locked when you load. No load fee, no transaction fee.
            </span>
          </li>

          <li className="fx__way">
            <span className="fx__way-head">A card charging {STANDARD_CARD_FX_FEE * 100}%</span>
            <span className="fx__way-cost" data-figure>
              {formatAud(standardCardCostAud)}
            </span>
            <span className="fx__way-note">
              {formatAud(savedVsStandard)} more, and the rate still moves under you.
            </span>
          </li>

          <li className="fx__way fx__way--worst">
            <span className="fx__way-head">
              <Icon name="alert" size={16} />
              Billed in AUD at the terminal
            </span>
            <span className="fx__way-cost" data-figure>
              {formatAud(dccCostAud)}
            </span>
            <span className="fx__way-note">
              {formatAud(savedVsDcc)} more. Always choose the local currency.
            </span>
          </li>
        </ul>

        <div className="fx__verdict">
          <Chip tone="success" icon="check">
            Keep {formatAud(savedVsDcc)} on this one purchase
          </Chip>
          <span className="fx__verdict-note">
            Load before you go and today&rsquo;s rate is yours, whatever happens next.
          </span>
        </div>
      </div>

      <p className="fx__foot">
        Rates shown are indicative and move constantly. The rate you get is the one showing when
        you confirm a load — and from that moment it stops moving.
      </p>
    </div>
  )
}
