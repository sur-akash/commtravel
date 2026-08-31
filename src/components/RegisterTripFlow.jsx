/* =============================================================================
   RegisterTripFlow — destination, dates, who's travelling.

   Three steps, because that's all the bank actually needs. Today NetBank asks
   for the same three things and uses them only to stop its fraud rules
   declining you. The last step of this flow says what you get back.
   ============================================================================= */

import { useState } from 'react'
import { Button, Chip, Icon, ProgressBar } from './primitives/index.jsx'
import SearchBox from './SearchBox.jsx'
import { searchDestinations, isCurrencySupported } from '../data/destinations.js'
import { formatDateShort, daysBetween } from '../lib/format.js'
import './RegisterTripFlow.css'

/** A few suggestions under the search box — the places Australians actually go. */
const POPULAR = searchDestinations('', { limit: 6, kinds: ['city'] })

const toDestination = (item) => ({
  city: item.name,
  country: item.country,
  code: item.cc,
  currency: item.currency,
  supported: isCurrencySupported(item.currency),
  lat: item.lat,
  lon: item.lon,
})

const STEPS = ['Where', 'When', 'Who']

function isoOffset(days) {
  const date = new Date(Date.now() + days * 86400000)
  return date.toISOString().slice(0, 10)
}

export default function RegisterTripFlow({ onComplete }) {
  const [step, setStep] = useState(0)
  const [destination, setDestination] = useState(toDestination(POPULAR[0]))
  const [departure, setDeparture] = useState(isoOffset(18))
  const [returnDate, setReturnDate] = useState(isoOffset(26))
  const [travellers, setTravellers] = useState(2)

  const nights = daysBetween(departure, returnDate)
  const datesValid = nights > 0

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1))
  const back = () => setStep((s) => Math.max(0, s - 1))

  const submit = () => {
    onComplete({
      destination,
      departure,
      return: returnDate,
      travellers,
      lengthDays: nights + 1,
    })
  }

  return (
    <div className="register">
      <div className="register__progress">
        <ProgressBar
          value={step + 1}
          max={STEPS.length}
          tone="brand"
          label={`Step ${step + 1} of ${STEPS.length}`}
        />
        <ol className="register__steps">
          {STEPS.map((label, index) => (
            <li
              key={label}
              className={`register__step ${index === step ? 'is-current' : ''} ${index < step ? 'is-done' : ''}`}
              aria-current={index === step ? 'step' : undefined}
            >
              <span className="register__step-mark">
                {index < step ? <Icon name="check" size={13} strokeWidth={2.4} /> : index + 1}
              </span>
              {label}
            </li>
          ))}
        </ol>
      </div>

      {/* --- Step 1: where --- */}
      {step === 0 ? (
        <fieldset className="register__panel">
          <legend className="register__legend">Where are you going?</legend>

          <SearchBox
            size="lg"
            placeholder="Search any city or country"
            value={`${destination.city}, ${destination.country}`}
            onSelect={(item) => setDestination(toDestination(item))}
            hint="Over eighty destinations. A yellow currency code means your Travel Money Card can hold it."
          />

          <div className="register__popular">
            <span className="register__popular-label">Popular right now</span>
            <div className="register__chips">
              {POPULAR.map((item) => {
                const selected = item.name === destination.city
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`register__chip ${selected ? 'is-selected' : ''}`}
                    aria-pressed={selected}
                    onClick={() => setDestination(toDestination(item))}
                  >
                    {item.name}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="register__chosen">
            <span className="register__chosen-city">
              {destination.city}, {destination.country}
            </span>
            {destination.supported ? (
              <Chip tone="success" icon="check">
                {destination.currency} can be locked on your card
              </Chip>
            ) : (
              <Chip tone="warn">{destination.currency} not on the card</Chip>
            )}
          </div>

          {!destination.supported ? (
            <p className="register__warn">
              <Icon name="alert" size={16} />
              Your Travel Money Card holds 16 currencies and {destination.currency} isn&rsquo;t one
              of them. Pack your World Debit Mastercard for this one — $0 international
              transaction fee and $0 at any ATM.
            </p>
          ) : null}
        </fieldset>
      ) : null}

      {/* --- Step 2: when --- */}
      {step === 1 ? (
        <fieldset className="register__panel">
          <legend className="register__legend">When?</legend>
          <div className="register__dates">
            <label className="register__field">
              <span className="register__label">Leaving</span>
              <input
                type="date"
                className="register__input"
                value={departure}
                onChange={(event) => setDeparture(event.target.value)}
              />
            </label>
            <label className="register__field">
              <span className="register__label">Back</span>
              <input
                type="date"
                className="register__input"
                value={returnDate}
                min={departure}
                onChange={(event) => setReturnDate(event.target.value)}
              />
            </label>
          </div>
          {datesValid ? (
            <p className="register__note">
              {nights + 1} days away, leaving in{' '}
              {daysBetween(Date.now(), departure)} days. We&rsquo;ll check your card and passport
              expiry against {formatDateShort(returnDate)}, not against today.
            </p>
          ) : (
            <p className="register__warn">
              <Icon name="alert" size={16} />
              Your return date needs to be after you leave.
            </p>
          )}
        </fieldset>
      ) : null}

      {/* --- Step 3: who --- */}
      {step === 2 ? (
        <fieldset className="register__panel">
          <legend className="register__legend">Who&rsquo;s travelling?</legend>
          <div className="register__counter">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setTravellers((t) => Math.max(1, t - 1))}
              aria-label="One fewer traveller"
            >
              −
            </Button>
            <span className="register__counter-value" data-figure aria-live="polite">
              {travellers} {travellers === 1 ? 'traveller' : 'travellers'}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setTravellers((t) => Math.min(9, t + 1))}
              aria-label="One more traveller"
            >
              +
            </Button>
          </div>

          <div className="register__summary">
            <p className="register__summary-title">What you get for telling us</p>
            <ul className="register__gets">
              {[
                'Your cards stop treating you as suspicious the moment you land.',
                'A checklist that fills itself in from what we already hold.',
                'Card and passport expiry checked against your return date.',
                `Emergency numbers for ${destination.country}, on every screen.`,
                'A live view of what each tap actually costs.',
              ].map((line) => (
                <li key={line}>
                  <Icon name="check" size={16} />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </fieldset>
      ) : null}

      <div className="register__actions">
        {step > 0 ? (
          <Button variant="secondary" onClick={back}>
            Back
          </Button>
        ) : null}
        {step < STEPS.length - 1 ? (
          <Button variant="primary" onClick={next} disabled={step === 1 && !datesValid}>
            Continue
          </Button>
        ) : (
          <Button variant="primary" onClick={submit} iconAfter="arrowRight">
            Register this trip
          </Button>
        )}
      </div>
    </div>
  )
}
