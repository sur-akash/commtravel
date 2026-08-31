/* =============================================================================
   /dashboard — the centrepiece.

   Alive on load with no user action: the feed opens already populated with days
   1 to 4, the rate re-prices every three seconds, and the next transaction
   lands within nine.

   Mobile: one column, in priority order — balance, currency stack, spend, feed,
   then the side modules. Desktop: two columns, with the feed on the left and
   the reactive side panel on the right.
   ============================================================================= */

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import BalanceHeader from '../components/BalanceHeader.jsx'
import CurrencyStack from '../components/CurrencyStack.jsx'
import SpendSoFar from '../components/SpendSoFar.jsx'
import LiveFeed from '../components/LiveFeed.jsx'
import SimControls from '../components/SimControls.jsx'
import EmergencyPanel from '../components/EmergencyPanel.jsx'
import BenefitsWallet from '../components/BenefitsWallet.jsx'
import TripChecklist from '../components/TripChecklist.jsx'
import LoadCurrencyModal from '../components/LoadCurrencyModal.jsx'
import Toast, { useSavingsToast } from '../components/Toast.jsx'
import { Button, Card, Eyebrow } from '../components/primitives/index.jsx'
import { useSimulator } from '../state/useSimulator.js'
import { useDemo } from '../state/DemoContext.jsx'
import { buildHoldings } from '../lib/holdings.js'
import { buildChecklist } from '../lib/checklist.js'
import { buildBenefits, LOUNGE_PASSES_PER_YEAR } from '../data/benefits.js'
import { formatAud } from '../lib/format.js'
import { tripDay } from '../data/trip.js'
import './Dashboard.css'

function Module({ title, hint, action, children, id }) {
  return (
    <section className="module" aria-labelledby={id}>
      <div className="module__head">
        <div>
          <h2 className="module__title" id={id}>
            {title}
          </h2>
          {hint ? <p className="module__hint">{hint}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export default function Dashboard() {
  const sim = useSimulator()
  const demo = useDemo()
  const [primaryIsLocal, setPrimaryIsLocal] = useState(true)
  const [loadModalCode, setLoadModalCode] = useState(null)
  const [toast, dismissToast] = useSavingsToast(sim.lastArrival)

  const trip = demo.trip

  const holdings = useMemo(
    () =>
      buildHoldings({
        currencyOrder: demo.currencyOrder,
        extraLoads: demo.extraLoads,
        liveRates: sim.liveRates,
        spentByCurrency: sim.spentByCurrency,
      }),
    [demo.currencyOrder, demo.extraLoads, sim.liveRates, sim.spentByCurrency]
  )

  const insuranceActivated = sim.insuranceActivated || demo.insuranceActivatedByUser

  const benefits = useMemo(
    () =>
      buildBenefits({
        trip,
        traveller: demo.traveller,
        prepaidTravelChargedAud: sim.prepaidTravelChargedAud,
        insuranceActivated,
      }),
    [trip, demo.traveller, sim.prepaidTravelChargedAud, insuranceActivated]
  )

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

  // No trip registered — the dashboard has nothing to show, and saying so
  // plainly is better than rendering a shell full of zeroes.
  if (!trip) {
    return (
      <div className="container dash dash--empty">
        <Card variant="accent">
          <h1 style={{ fontSize: 'var(--fs-h2)', marginBottom: 'var(--space-3)' }}>
            No trip registered
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-5)' }}>
            The dashboard follows a trip. Register one and this page fills with your balances,
            your locked rates and every transaction as it lands.
          </p>
          <Button as={Link} to="/trip" variant="primary">
            Register a trip
          </Button>
        </Card>
      </div>
    )
  }

  const destination = holdings.find((holding) => holding.code === trip.destination.currency) ?? holdings[0]
  const currentDay = tripDay(trip)
  const fxDelta = holdings.reduce((sum, holding) => sum + holding.deltaAud, 0)

  return (
    <div className="container dash">
      <header className="dash__head">
        <Eyebrow>
          {trip.destination.city}, {trip.destination.country} · day {currentDay} of{' '}
          {trip.lengthDays}
        </Eyebrow>
        <h1 className="dash__title">Your money, live</h1>
      </header>

      <SimControls
        running={sim.running}
        speed={sim.speed}
        controls={sim.controls}
        onInject={(type) => sim.controls.injectEvent(type)}
      />

      <div className="dash__grid">
        {/* ---------------- Main column ---------------- */}
        <div className="dash__main">
          <BalanceHeader
            currency={destination.code}
            localBalance={destination.balance}
            audBalance={destination.audBalance}
            otherHoldings={holdings.filter((h) => h.code !== destination.code && h.balance > 0)}
            liveRate={destination.liveRate}
            lockedRate={destination.lockedRate}
            primaryIsLocal={primaryIsLocal}
            onFlip={() => setPrimaryIsLocal((v) => !v)}
            travelModeOn={trip.travelModeOn}
            cardLocked={demo.cardLocked}
          />

          <Module
            id="mod-stack"
            title="Your currency stack"
            hint="The order decides which balance pays when you tap in something you haven't loaded."
            action={
              <Button size="sm" variant="secondary" onClick={() => setLoadModalCode('JPY')}>
                Load currency
              </Button>
            }
          >
            <CurrencyStack holdings={holdings} onMove={demo.actions.moveCurrency} />
          </Module>

          <Module
            id="mod-spend"
            title="Spend so far"
            hint={`Day ${currentDay} of ${trip.lengthDays}, against a ${formatAud(trip.budgetAud, { decimals: 0 })} budget.`}
          >
            <SpendSoFar
              spentAud={sim.totals.spentAud}
              budgetAud={trip.budgetAud}
              dayOfTrip={currentDay}
              lengthDays={trip.lengthDays}
              byCategory={sim.totals.byCategory}
              byDay={sim.totals.byDay}
              fxDeltaAud={fxDelta}
              savedAud={sim.totals.savedAud}
            />
          </Module>

          <Module id="mod-feed" title="As it happens">
            <LiveFeed
              transactions={sim.transactions}
              totals={sim.totals}
              controls={sim.controls}
              onLockCard={demo.actions.lockCard}
              onLoadCurrency={() => setLoadModalCode('JPY')}
              onSeeCurrencies={() => setLoadModalCode('JPY')}
            />
          </Module>
        </div>

        {/* ---------------- Side column ---------------- */}
        <aside className="dash__side" aria-label="Trip status">
          <Module id="mod-sos" title="If it all goes wrong">
            <EmergencyPanel compact showContacts={false} />
          </Module>

          <Module
            id="mod-benefits"
            title="What you're owed"
            action={
              <Button as={Link} to="/benefits" size="sm" variant="ghost" iconAfter="arrowRight">
                All benefits
              </Button>
            }
          >
            <BenefitsWallet benefits={benefits} compact />
          </Module>

          <Module
            id="mod-checklist"
            title="Trip checklist"
            action={
              <Button as={Link} to="/trip" size="sm" variant="ghost" iconAfter="arrowRight">
                Your trip
              </Button>
            }
          >
            <TripChecklist
              items={checklist}
              compact
              onAction={(action) => {
                if (action === 'activateBackup') demo.actions.activateBackupCard()
              }}
            />
          </Module>
        </aside>
      </div>

      <Toast toast={toast} onDismiss={dismissToast} />

      {loadModalCode ? (
        <LoadCurrencyModal
          holdings={holdings}
          initialCode={loadModalCode}
          liveRates={sim.liveRates}
          onLoad={demo.actions.loadCurrency}
          onClose={() => setLoadModalCode(null)}
        />
      ) : null}
    </div>
  )
}
