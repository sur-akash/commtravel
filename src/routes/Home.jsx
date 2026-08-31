/* =============================================================================
   / — Travel home.

   Follows the shape of the real commbank.com.au/travel.html: hero, then the
   four pillars of a trip with every product on one shelf beneath them, then
   tools and support. Copy runs at roughly half the length of the real page —
   plain, calm, second person, short sentences.

   Two things the real page does not have, and the reason this prototype exists:
   the live global transaction globe, and a trip status card that actually
   reflects a registered trip.

   The trip checklist deliberately does NOT appear here. It lives in full on
   /trip and in summary on /dashboard; a third copy on the home page was the
   same pane three times.
   ============================================================================= */

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import TripStateSwitcher from '../components/TripStateSwitcher.jsx'
import TravelOrbits from '../components/TravelOrbits.jsx'
import OfferShelf from '../components/OfferShelf.jsx'
import { Button, Card, Chip, Eyebrow, Icon, Sparkline } from '../components/primitives/index.jsx'
import { useDemo } from '../state/DemoContext.jsx'
import { useSimulator } from '../state/useSimulator.js'
import { buildHoldings } from '../lib/holdings.js'
import {
  formatAud,
  formatSignedAud,
  formatCountdown,
  daysBetween,
  formatDate,
} from '../lib/format.js'
import { tripDay } from '../data/trip.js'
import './Home.css'

/** The proof points that run under the hero, as on the real page. */
const HERO_STATS = [
  { value: '16', label: 'currencies you can lock a rate on' },
  { value: '$0', label: 'international fee on a World Debit Mastercard' },
  { value: '24–48h', label: 'to emergency cash, often same day' },
]

export default function Home() {
  const demo = useDemo()
  const sim = useSimulator()
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

  const destination = holdings.find((h) => h.code === trip?.destination.currency)
  const fxDelta = holdings.reduce((sum, holding) => sum + holding.deltaAud, 0)
  const daysToGo = trip ? daysBetween(Date.now(), trip.departure) : null

  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__copy">
            <Eyebrow>CommBank Travel</Eyebrow>
            <h1 className="hero__title">Travel money that tells you what it&rsquo;s doing</h1>
            <p className="hero__lede">
              You already have the rate lock, the emergency cash, the insurance and the lounge
              passes. What you don&rsquo;t have is a screen that shows you any of it. This is that
              screen.
            </p>
            <div className="hero__actions">
              <Button as={Link} to="/dashboard" variant="primary" iconAfter="arrowRight">
                Open the live dashboard
              </Button>
              <Button as={Link} to="/trip" variant="secondary">
                Register your trip
              </Button>
            </div>
          </div>

          {/* Trip status — the pitch as one object. */}
          <div className="hero__card">
            {trip ? (
              <>
                <div className="hero__card-head">
                  <Chip tone="brand">
                    {trip.status === 'active'
                      ? `Day ${tripDay(trip)} of ${trip.lengthDays}`
                      : `Leaves in ${formatCountdown(daysToGo)}`}
                  </Chip>
                  <span className="hero__card-place">
                    {trip.destination.city}, {trip.destination.country}
                  </span>
                </div>

                {destination ? (
                  <>
                    <p className="hero__card-figure" data-figure>
                      {destination.meta.symbol}
                      {Math.round(destination.balance).toLocaleString('en-AU')}
                    </p>
                    <p className="hero__card-sub">
                      loaded and locked at {destination.lockedRate} {destination.code}/AUD
                    </p>

                    <div className="hero__card-delta">
                      <Icon name={fxDelta >= 0 ? 'arrowUp' : 'arrowDown'} size={16} />
                      <span data-figure>{formatSignedAud(fxDelta)}</span>
                      <span className="hero__card-delta-label">
                        {fxDelta >= 0 ? 'ahead of today’s market' : 'behind today’s market'}
                      </span>
                    </div>

                    <div className="hero__card-spark">
                      <Sparkline
                        values={destination.history}
                        height={44}
                        tone="var(--color-text)"
                        fill
                        label={`30-day rate history for ${destination.meta.name}`}
                      />
                    </div>
                  </>
                ) : null}

                {trip.status === 'active' ? (
                  <p className="hero__card-foot">
                    {formatAud(sim.totals.savedAud)} saved in fees so far this trip.
                  </p>
                ) : (
                  <p className="hero__card-foot">
                    Back on {formatDate(trip.return)}. Everything is checked against that date.
                  </p>
                )}
              </>
            ) : (
              <div className="hero__card-empty">
                <Icon name="plane" size={28} />
                <p className="hero__card-figure" style={{ fontSize: 'var(--fs-h3)' }}>
                  No trip registered
                </p>
                <p className="hero__card-sub">
                  This is what most customers see today. Everything below is switched off.
                </p>
                <Button as={Link} to="/trip" variant="primary" size="sm">
                  Register your trip
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="container">
          <ul className="hero__stats">
            {HERO_STATS.map((stat) => (
              <li className="hero__stat" key={stat.label}>
                <span className="hero__stat-value" data-figure>
                  {stat.value}
                </span>
                <span className="hero__stat-label">{stat.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------- The offer shelf ---------------- */}
      <OfferShelf />

      {/* ---------------- Live global dashboard ---------------- */}
      <TravelOrbits />

      {/* ---------------- Demo control ---------------- */}
      <section className="container home__section home__section--switcher">
        <TripStateSwitcher value={demo.tripStateId} onChange={demo.actions.setTripState} />
      </section>
    </>
  )
}
