/* =============================================================================
   /trip — the trip object, the rate-lock ledger, and the confidence layer.

   With no trip registered this is the three-step register flow. With one, it's
   everything the registration bought you.
   ============================================================================= */

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import RegisterTripFlow from '../components/RegisterTripFlow.jsx'
import TripChecklist from '../components/TripChecklist.jsx'
import RateLockLedger from '../components/RateLockLedger.jsx'
import FxConverter from '../components/FxConverter.jsx'
import LoadCurrencyModal from '../components/LoadCurrencyModal.jsx'
import { DccExplainer, BackupCard, CardComparison } from '../components/ConfidenceLayer.jsx'
import { Button, Card, Chip, Eyebrow, Icon } from '../components/primitives/index.jsx'
import { useDemo } from '../state/DemoContext.jsx'
import { useSimulator } from '../state/useSimulator.js'
import { buildHoldings } from '../lib/holdings.js'
import { buildChecklist } from '../lib/checklist.js'
import { LOUNGE_PASSES_PER_YEAR } from '../data/benefits.js'
import { tripDay } from '../data/trip.js'
import { formatCountdown, formatDate, daysBetween } from '../lib/format.js'
import './Trip.css'

function Section({ title, lede, eyebrow, children, id }) {
  return (
    <section className="trip__section" aria-labelledby={id}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="trip__section-title" id={id}>
        {title}
      </h2>
      {lede ? <p className="trip__section-lede">{lede}</p> : null}
      {children}
    </section>
  )
}

export default function Trip() {
  const demo = useDemo()
  const sim = useSimulator()
  const [loadCode, setLoadCode] = useState(null)
  const trip = demo.trip

  const holdings = useMemo(
    () =>
      buildHoldings({
        currencyOrder: demo.currencyOrder,
        extraLoads: demo.extraLoads,
        liveRates: sim.liveRates,
        spentByCurrency: trip?.status === 'active' ? sim.spentByCurrency : {},
      }),
    [demo.currencyOrder, demo.extraLoads, sim.liveRates, sim.spentByCurrency, trip]
  )

  const insuranceActivated = sim.insuranceActivated || demo.insuranceActivatedByUser

  const checklist = useMemo(
    () =>
      buildChecklist({
        trip,
        traveller: demo.traveller,
        cards: demo.cards,
        holdings,
        insuranceActivated,
        backupCardActivated: demo.backupCardActivated,
        loungeRemaining: LOUNGE_PASSES_PER_YEAR - (trip?.loungePassesUsed ?? 0),
        emergencyContacts: demo.emergencyContacts,
      }),
    [trip, demo.traveller, demo.cards, holdings, insuranceActivated, demo.backupCardActivated, demo.emergencyContacts]
  )

  /* --- No trip: the register flow --------------------------------------- */
  if (!trip) {
    return (
      <div className="container trip trip--register">
        <Eyebrow>Step one</Eyebrow>
        <h1 className="trip__title">Register your trip</h1>
        <p className="trip__lede">
          Three questions. Today the bank asks the same three and uses them only to stop your card
          being declined. Here they build everything else on this page.
        </p>
        <Card>
          <RegisterTripFlow onComplete={demo.actions.registerTrip} />
        </Card>
      </div>
    )
  }

  const backup = demo.cards.find((card) => card.isBackup)
  const destination = holdings.find((h) => h.code === trip.destination.currency) ?? holdings[0]
  const daysToGo = daysBetween(Date.now(), trip.departure)
  const isActive = trip.status === 'active'

  return (
    <div className="container trip">
      {/* --- Trip card --- */}
      <header className="trip__hero">
        <div className="trip__hero-copy">
          <Eyebrow>
            {trip.destination.city}, {trip.destination.country}
          </Eyebrow>
          <h1 className="trip__title">
            {isActive
              ? `Day ${tripDay(trip)} of ${trip.lengthDays}`
              : `${formatCountdown(daysToGo)} to go`}
          </h1>
          <p className="trip__lede">
            {formatDate(trip.departure)} — {formatDate(trip.return)} · {trip.travellers}{' '}
            {trip.travellers === 1 ? 'traveller' : 'travellers'}
          </p>
          <div className="trip__hero-chips">
            <Chip tone={destination?.totalLoaded > 0 ? 'success' : 'warn'}>
              {destination?.totalLoaded > 0
                ? `${destination.meta.symbol} loaded and locked`
                : `No ${trip.destination.currency} loaded`}
            </Chip>
            <Chip tone={insuranceActivated ? 'success' : 'warn'}>
              {insuranceActivated ? 'Insurance active' : 'Insurance not activated'}
            </Chip>
            <Chip tone="outline">
              {LOUNGE_PASSES_PER_YEAR - trip.loungePassesUsed} lounge passes left
            </Chip>
          </div>
          {isActive ? (
            <Button as={Link} to="/dashboard" variant="primary" iconAfter="arrowRight">
              Open the live dashboard
            </Button>
          ) : null}
        </div>

        <Card className="trip__hero-card">
          <p className="eyebrow">Emergency numbers, {demo.emergencyContacts.country}</p>
          <ul className="trip__contacts">
            <li>
              <Icon name="phone" size={16} />
              <span>{demo.emergencyContacts.police.label}</span>
              <strong>{demo.emergencyContacts.police.number}</strong>
            </li>
            <li>
              <Icon name="phone" size={16} />
              <span>{demo.emergencyContacts.ambulance.label}</span>
              <strong>{demo.emergencyContacts.ambulance.number}</strong>
            </li>
            <li>
              <Icon name="pin" size={16} />
              <span>{demo.emergencyContacts.embassy.label}</span>
              <strong>{demo.emergencyContacts.embassy.number}</strong>
            </li>
            <li>
              <Icon name="card" size={16} />
              <span>CommBank, reverse charges</span>
              <strong>+61 2 9999 3283</strong>
            </li>
          </ul>
        </Card>
      </header>

      {/* --- Checklist --- */}
      <Section
        id="trip-checklist"
        eyebrow="Your trip"
        title="The checklist that fills itself in"
        lede="Every line below is answered from data already held. Card and passport expiry are checked against your return date, not today's."
      >
        <Card>
          <TripChecklist
            items={checklist}
            onAction={(action) => {
              if (action === 'activateBackup') demo.actions.activateBackupCard()
            }}
          />
        </Card>
      </Section>

      {/* --- Rate lock ledger --- */}
      <Section
        id="trip-ledger"
        eyebrow="Exchange rates"
        title="You locked, they float"
        lede="Your Travel Money Card fixes the rate the moment you load it, across 16 currencies — so the trip you budgeted for is the trip you get. Here is what that lock has been worth since."
      >
        <Card className="trip__fx">
          <h3 className="trip__sub">Work out what it costs before you go</h3>
          <p className="trip__sub-lede">
            Any calculator will tell you what your dollar buys. This one also tells you what it
            costs three different ways, which is the part that decides which card you pack.
          </p>
          <FxConverter liveRates={sim.liveRates} defaultTo={destination?.code ?? 'JPY'} />
        </Card>

        <RateLockLedger
          holdings={holdings}
          rateAlerts={demo.rateAlerts}
          onSetAlert={demo.actions.setRateAlert}
          onClearAlert={demo.actions.clearRateAlert}
          onLoad={(code) => setLoadCode(code)}
        />
      </Section>

      {/* --- Confidence layer --- */}
      <Section
        id="trip-confidence"
        eyebrow="Cards and payments"
        title="Will my card work here?"
        lede="What happens on a tap, which balance pays, and which card to actually pack."
      >
        <div className="trip__confidence">
          <DccExplainer lockedRate={destination?.lockedRate ?? 96.2} currency={destination?.code} />

          <BackupCard
            card={backup}
            activated={demo.backupCardActivated}
            onActivate={demo.actions.activateBackupCard}
          />
        </div>

        <div className="trip__compare">
          <h3 className="trip__sub">Which card to pack for {trip.destination.city}</h3>
          <CardComparison
            trip={trip}
            currencyLoaded={Boolean(destination?.totalLoaded)}
            hasLoungeAccess={LOUNGE_PASSES_PER_YEAR - trip.loungePassesUsed > 0}
          />
        </div>
      </Section>

      {loadCode ? (
        <LoadCurrencyModal
          holdings={holdings}
          initialCode={loadCode}
          liveRates={sim.liveRates}
          onLoad={demo.actions.loadCurrency}
          onClose={() => setLoadCode(null)}
        />
      ) : null}
    </div>
  )
}
