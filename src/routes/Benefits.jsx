/* =============================================================================
   /benefits — the wallet, and the gap.

   Everything here is already paid for. The module's job is to say whether it's
   switched on, how much is left, and when it expires — none of which any
   current surface tells you.
   ============================================================================= */

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import BenefitsWallet from '../components/BenefitsWallet.jsx'
import { Button, Card, Eyebrow, Icon, ProgressBar } from '../components/primitives/index.jsx'
import { useDemo } from '../state/DemoContext.jsx'
import { useSimulator } from '../state/useSimulator.js'
import { buildBenefits, INSURANCE_SPEND_THRESHOLD_AUD } from '../data/benefits.js'
import { formatAud } from '../lib/format.js'
import './Benefits.css'

export default function Benefits() {
  const demo = useDemo()
  const sim = useSimulator()

  const insuranceActivated = sim.insuranceActivated || demo.insuranceActivatedByUser
  const prepaid = sim.prepaidTravelChargedAud
  const shortfall = Math.max(0, INSURANCE_SPEND_THRESHOLD_AUD - prepaid)

  const benefits = useMemo(
    () =>
      buildBenefits({
        trip: demo.trip,
        traveller: demo.traveller,
        prepaidTravelChargedAud: prepaid,
        insuranceActivated,
      }),
    [demo.trip, demo.traveller, prepaid, insuranceActivated]
  )

  return (
    <div className="container benefits">
      <header className="benefits__head">
        <Eyebrow>Your benefits</Eyebrow>
        <h1 className="benefits__title">What you&rsquo;re already owed</h1>
        <p className="benefits__lede">
          You are paying for all of this today. The only thing missing is a screen that says
          whether it&rsquo;s switched on.
        </p>
      </header>

      {/* --- The gap, as the headline --- */}
      <Card variant="accent" className="benefits__gap">
        <div className="benefits__gap-head">
          <span className={`benefits__gap-icon ${insuranceActivated ? 'is-active' : ''}`}>
            <Icon name="shield" size={26} />
          </span>
          <div>
            <h2 className="benefits__gap-title">
              {insuranceActivated
                ? 'Your included cover is active'
                : `You're ${formatAud(shortfall)} short of activating your included cover`}
            </h2>
            <p className="benefits__gap-sub">
              {insuranceActivated
                ? 'Everyone on the booking is covered. Cover-More answers 24/7 on +61 2 8907 5641, reverse charges from anywhere.'
                : `Charge ${formatAud(INSURANCE_SPEND_THRESHOLD_AUD, { decimals: 0 })} of prepaid travel to your Awards credit card and the cover switches on. You're at ${formatAud(prepaid)}.`}
            </p>
          </div>
        </div>

        <ProgressBar
          value={Math.min(prepaid, INSURANCE_SPEND_THRESHOLD_AUD)}
          max={INSURANCE_SPEND_THRESHOLD_AUD}
          tone={insuranceActivated ? 'success' : 'warn'}
          label="Prepaid travel charged toward activating cover"
        />

        <div className="benefits__gap-scale" data-figure>
          <span>{formatAud(prepaid)}</span>
          <span>{formatAud(INSURANCE_SPEND_THRESHOLD_AUD, { decimals: 0 })}</span>
        </div>

        {!insuranceActivated ? (
          <div className="benefits__gap-actions">
            <Button variant="primary" onClick={demo.actions.activateInsurance}>
              Activate cover now
            </Button>
            <Button as={Link} to="/dashboard" variant="secondary">
              Watch it activate live
            </Button>
          </div>
        ) : null}

        <p className="benefits__gap-note">
          On the dashboard, fire the &ldquo;large purchase&rdquo; event and this bar moves while
          you watch — that&rsquo;s the point of tying the wallet to the transaction feed rather
          than to a settings page.
        </p>
      </Card>

      <section className="benefits__section">
        <h2 className="benefits__section-title">Everything in the wallet</h2>
        <BenefitsWallet
          benefits={benefits}
          onActivate={demo.actions.activateInsurance}
          className="wallet--grid"
        />
      </section>

      <section className="benefits__section">
        <h2 className="benefits__section-title">The gap, quantified</h2>
        <div className="benefits__gaps">
          {[
            {
              icon: 'shield',
              title: 'Insurance you have but have not switched on',
              body: 'Two of your cards include international travel cover. Neither activates itself. One needs $500 of prepaid travel first, the other just needs asking.',
            },
            {
              icon: 'lounge',
              title: 'Lounge visits with a use-by date',
              body: 'Two complimentary Mastercard Travel Pass visits a year, across more than 1,300 lounges. They do not roll over. Most people never use either.',
            },
            {
              icon: 'coins',
              title: 'Travel credit that expires',
              body: 'Yello gives up to 10% back on Hopper bookings, and those credits expire two years after you earn them. Nothing currently tells you when.',
            },
            {
              icon: 'bag',
              title: 'Purchase cover that works abroad',
              body: 'Price Guarantee, Purchase Security and Extended Warranty are framed as shopping benefits. They cover the camera you buy in Ginza too.',
            },
          ].map((item) => (
            <div className="benefits__gap-card" key={item.title}>
              <span className="benefits__gap-card-icon">
                <Icon name={item.icon} size={20} />
              </span>
              <h3 className="benefits__gap-card-title">{item.title}</h3>
              <p className="benefits__gap-card-body">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
