/* =============================================================================
   EmergencyPanel

   The capability gap, made operable. A neobank can offer a chat window; this
   offers a card lock, cash in your hand within 24–48 hours, a replacement card
   delivered anywhere in the world, and a person on the phone at 3am.

   Rendered in two places from the same component: the drawer behind the
   floating button, and the full /emergency route.
   ============================================================================= */

import { useState } from 'react'
import { Button, Chip, Icon } from './primitives/index.jsx'
import { EMERGENCY_PROMISE, EMERGENCY_ACTIONS } from '../data/emergency.js'
import AtmMap from './AtmMap.jsx'
import { CBA_CONTACTS } from '../data/trip.js'
import { useDemo } from '../state/DemoContext.jsx'
import './EmergencyPanel.css'

function ContactRow({ label, name, number, href }) {
  return (
    <a className="sos-contact" href={href ?? `tel:${number.replace(/\s/g, '')}`}>
      <span>
        <span className="sos-contact__label">{label}</span>
        <span className="sos-contact__name" style={{ display: 'block' }}>
          {name}
        </span>
      </span>
      <span className="sos-contact__number">{number}</span>
    </a>
  )
}

export default function EmergencyPanel({ compact = false, showContacts = true }) {
  const { cardLocked, actions, emergencyContacts, trip } = useDemo()
  const [completed, setCompleted] = useState({})

  const run = (action) => {
    if (action.id === 'lock') {
      actions.toggleCardLock()
      return
    }
    setCompleted((prev) => ({ ...prev, [action.id]: true }))
  }

  const visibleActions = EMERGENCY_ACTIONS.filter((action) =>
    compact ? action.id !== 'branch' : true
  )

  return (
    <div className="sos-panel">
      {/* The promise, as a stat rather than a bullet point. */}
      <div className="sos-promise">
        <span className="sos-promise__stat" data-figure>
          {EMERGENCY_PROMISE.stat}
        </span>
        <span className="sos-promise__claim">{EMERGENCY_PROMISE.claim}</span>
        <span className="sos-promise__note">
          From your Travel Money Card, {EMERGENCY_PROMISE.qualifier}. A replacement card reaches
          you and any additional cardholder wherever you are, for $20.
        </span>
      </div>

      {/* Lock state, with the animated transition the brief asks for. */}
      <div className={`sos-lock ${cardLocked ? 'sos-lock--locked' : ''}`}>
        <span className="sos-lock__icon">
          <Icon name={cardLocked ? 'lock' : 'unlock'} size={22} />
        </span>
        <span className="sos-lock__body">
          <span className="sos-lock__title">
            {cardLocked ? 'Your card is locked' : 'Your card is active'}
          </span>
          <span className="sos-lock__detail">
            {cardLocked
              ? 'Nothing new can be charged. Your backup card ending 4425 still works.'
              : 'Locking is instant and reversible. Nothing is cancelled.'}
          </span>
        </span>
        <Button
          variant={cardLocked ? 'secondary' : 'danger'}
          size="sm"
          icon={cardLocked ? 'unlock' : 'lock'}
          onClick={actions.toggleCardLock}
        >
          {cardLocked ? 'Unlock' : 'Lock'}
        </Button>
      </div>

      <div className="sos-actions">
        {visibleActions
          .filter((action) => action.id !== 'lock')
          .map((action) => (
            <div className="sos-action" key={action.id}>
              <span className="sos-action__head">
                <Icon name={action.icon} size={20} />
                {action.label}
              </span>
              <span className="sos-action__desc">{action.description}</span>

              {completed[action.id] ? (
                <span className="sos-action__done">
                  <span className="sos-action__done-title">{action.confirmation.title}</span>
                  <span>{action.confirmation.body}</span>
                </span>
              ) : action.href ? (
                <Button as="a" href={action.href} variant={action.tone} size="sm" icon="phone">
                  Call now
                </Button>
              ) : (
                <Button variant={action.tone} size="sm" onClick={() => run(action)}>
                  {action.label}
                </Button>
              )}
            </div>
          ))}
      </div>

      {showContacts ? (
        <div>
          <h3 className="sos-heading">Localised for {emergencyContacts.country}</h3>
          <div className="sos-contacts">
            <ContactRow
              label={CBA_CONTACTS.overseas.label}
              name="Reverse the charges"
              number={CBA_CONTACTS.overseas.number}
            />
            <ContactRow
              label={CBA_CONTACTS.coverMore.label}
              name="Travel insurance emergencies"
              number={CBA_CONTACTS.coverMore.number}
            />
            <ContactRow
              label={emergencyContacts.police.label}
              name={emergencyContacts.country}
              number={emergencyContacts.police.number}
            />
            <ContactRow
              label={emergencyContacts.ambulance.label}
              name={emergencyContacts.country}
              number={emergencyContacts.ambulance.number}
            />
            <ContactRow
              label={emergencyContacts.embassy.label}
              name={emergencyContacts.embassy.address ?? 'Consular assistance'}
              number={emergencyContacts.embassy.number}
            />
          </div>
        </div>
      ) : null}

      {!compact ? (
        <div>
          <h3 className="sos-heading">Cash near you</h3>
          <AtmMap />
        </div>
      ) : null}

      {!trip ? (
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-muted)' }}>
          These stay available whether or not you have a trip registered. Registering one just
          means we already know where you are.
        </p>
      ) : null}
    </div>
  )
}
