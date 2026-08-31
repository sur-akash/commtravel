/* =============================================================================
   OfferShelf — the four pillars and the product grid.

   This is the shape of the real commbank.com.au/travel.html: a tab strip across
   the four stages of a trip, then every product on one shelf beneath it. The
   difference here is that selecting a pillar filters the shelf, so "Pay for
   travel" shows you the paying products instead of making you scroll past the
   booking ones.

   The tabs follow the ARIA tabs pattern properly: roving tabindex, arrow keys,
   Home and End. A tab strip you can only click is a worse version of a list.
   ============================================================================= */

import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Icon } from './primitives/index.jsx'
import CardArt from './CardArt.jsx'
import { PILLARS, OFFERS, SUPPORT_LINKS, auditOffers } from '../data/offers.js'
import './OfferShelf.css'

const ALL = { id: 'all', label: 'Everything' }

// Shout early if a product ends up in two pillars or none. Cheap, and the
// alternative is noticing months later that a card is unreachable.
if (import.meta.env.DEV) {
  const problem = auditOffers()
  if (problem) console.warn(`[OfferShelf] ${problem}`)
}

function OfferCard({ offer }) {
  return (
    <article className={`offer ${offer.featured ? 'offer--featured' : ''}`}>
      {offer.art ? (
        <div className="offer__art">
          <CardArt kind={offer.art} />
        </div>
      ) : null}

      <div className="offer__top">
        <span className="offer__icon">
          <Icon name={offer.icon} size={22} />
        </span>
        {offer.badge ? <span className="offer__badge">{offer.badge}</span> : null}
      </div>

      <h3 className="offer__name">{offer.name}</h3>

      <p className="offer__stat" data-figure>
        {offer.stat}
        <span className="offer__stat-label">{offer.statLabel}</span>
      </p>

      <p className="offer__body">{offer.body}</p>

      <ul className="offer__points">
        {offer.points.map((point) => (
          <li key={point}>
            <Icon name="check" size={15} />
            {point}
          </li>
        ))}
      </ul>

      <Button
        as={Link}
        to={offer.to}
        variant={offer.featured ? 'primary' : 'secondary'}
        size="sm"
        className="offer__cta"
      >
        {offer.cta}
      </Button>
    </article>
  )
}

export default function OfferShelf() {
  const [active, setActive] = useState(ALL.id)
  const tabsRef = useRef([])

  const tabs = [ALL, ...PILLARS]
  const pillar = PILLARS.find((item) => item.id === active)
  const visible = pillar ? OFFERS.filter((offer) => pillar.related.includes(offer.id)) : OFFERS

  const onKeyDown = (event, index) => {
    const keys = { ArrowRight: 1, ArrowLeft: -1 }
    let next = null

    if (keys[event.key]) next = (index + keys[event.key] + tabs.length) % tabs.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = tabs.length - 1
    if (next === null) return

    event.preventDefault()
    setActive(tabs[next].id)
    tabsRef.current[next]?.focus()
  }

  return (
    <section className="shelf band" aria-labelledby="shelf-title">
      <div className="container">
        <header className="shelf__head">
          <p className="eyebrow">Everything for the trip</p>
          <h2 className="shelf__title" id="shelf-title">
            Prepare for your next trip
          </h2>
          <p className="shelf__lede">
            The products you already have, in one place, with the numbers that matter on the front
            of each one. Pick a stage of the trip to narrow it down.
          </p>
        </header>

        {/* --- Pillar tabs --- */}
        <div className="shelf__tabs" role="tablist" aria-label="Stage of your trip">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={(node) => {
                tabsRef.current[index] = node
              }}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={active === tab.id}
              aria-controls={`panel-${tab.id}`}
              tabIndex={active === tab.id ? 0 : -1}
              className={`shelf__tab ${active === tab.id ? 'is-active' : ''}`}
              onClick={() => setActive(tab.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div
          className="shelf__panel"
          role="tabpanel"
          id={`panel-${active}`}
          aria-labelledby={`tab-${active}`}
          tabIndex={0}
        >
          {pillar ? (
            <div className="shelf__pillar">
              <div>
                <h3 className="shelf__pillar-title">{pillar.headline}</h3>
                <p className="shelf__pillar-body">{pillar.body}</p>
              </div>
              <Button as={Link} to={pillar.to} variant="primary" iconAfter="arrowRight">
                {pillar.cta}
              </Button>
            </div>
          ) : null}

          <div className="shelf__grid">
            {visible.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        </div>

        {/* --- Tools and support, as on the real page --- */}
        <div className="shelf__support">
          {SUPPORT_LINKS.map((item) => (
            <div className="support" key={item.title}>
              <span className="support__icon">
                <Icon name={item.icon} size={20} />
              </span>
              <div className="support__body">
                <h3 className="support__title">{item.title}</h3>
                <p className="support__text">{item.body}</p>
                <Link to={item.to} className="support__link">
                  {item.cta}
                  <Icon name="arrowRight" size={15} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
