/* =============================================================================
   The self-ticking checklist.

   The point of module 1: not one of these items asks the traveller to confirm
   something the bank already knows. Card expiry, passport expiry, whether the
   currency is loaded, whether cover is active, how many lounge passes are left
   — all of it is answered from held data and checked against the return date.

   A checklist you have to tick yourself is a to-do list. This is a status
   report.
   ============================================================================= */

import { daysBetween, formatDate, formatLocal } from './format.js'

/** Most countries want six months of passport validity beyond your return. */
const PASSPORT_BUFFER_DAYS = 182

export function buildChecklist({
  trip,
  traveller,
  cards,
  holdings,
  insuranceActivated,
  backupCardActivated,
  loungeRemaining,
  emergencyContacts,
}) {
  if (!trip) return []

  const returnDate = trip.return
  const items = []

  items.push({
    id: 'registered',
    icon: 'plane',
    label: 'Trip registered',
    detail: `${trip.destination.city}, ${formatDate(trip.departure)} to ${formatDate(returnDate)}. Your cards won't be declined for looking suspicious.`,
    state: 'done',
  })

  /* --- Currency ---------------------------------------------------------- */
  const destinationHolding = holdings.find((holding) => holding.code === trip.destination.currency)
  if (destinationHolding && destinationHolding.totalLoaded > 0) {
    items.push({
      id: 'currency',
      icon: 'coins',
      label: `${destinationHolding.meta.name} loaded`,
      detail: `${formatLocal(destinationHolding.totalLoaded, destinationHolding.code)} locked at ${destinationHolding.lockedRate}. The rate can move all it likes now.`,
      state: 'done',
    })
  } else {
    items.push({
      id: 'currency',
      icon: 'coins',
      label: `No ${trip.destination.currency} loaded`,
      detail: 'Load before you go and the rate is locked from that moment. Load while you are there and you take the market rate.',
      state: 'attention',
      action: { label: 'Load currency', to: '/trip' },
    })
  }

  /* --- Insurance --------------------------------------------------------- */
  items.push(
    insuranceActivated
      ? {
          id: 'insurance',
          icon: 'shield',
          label: 'Travel insurance active',
          detail: 'Cover-More is reachable 24/7 on +61 2 8907 5641, reverse charges if you need to.',
          state: 'done',
        }
      : {
          id: 'insurance',
          icon: 'shield',
          label: 'Travel insurance not activated',
          detail: 'Included with your cards, but it does not switch itself on. This is the one thing on this list only you can do.',
          state: 'attention',
          action: { label: 'Activate cover', to: '/benefits' },
        }
  )

  /* --- Card expiry, checked against the return date ---------------------- */
  const primaryCard = cards.find((card) => card.isPrimaryForTrip) ?? cards[0]
  const cardMargin = daysBetween(returnDate, primaryCard.expiry)
  items.push({
    id: 'card-expiry',
    icon: 'card',
    label: cardMargin > 0 ? 'Card valid past your return' : 'Card expires before you get home',
    detail:
      cardMargin > 0
        ? `${primaryCard.name} ending ${primaryCard.last4} expires ${formatDate(primaryCard.expiry)} — ${cardMargin} days after you land back.`
        : `${primaryCard.name} ending ${primaryCard.last4} expires ${formatDate(primaryCard.expiry)}, before your return on ${formatDate(returnDate)}.`,
    state: cardMargin > 0 ? 'done' : 'alert',
  })

  /* --- Passport expiry, with the six-month rule -------------------------- */
  const passportMargin = daysBetween(returnDate, traveller.passport.expiry)
  const passportOk = passportMargin >= PASSPORT_BUFFER_DAYS
  items.push({
    id: 'passport',
    icon: 'passport',
    label: passportOk ? 'Passport has enough validity' : 'Passport too close to expiry',
    detail: passportOk
      ? `Expires ${formatDate(traveller.passport.expiry)} — ${passportMargin} days past your return, comfortably clear of the six months most countries want.`
      : `Expires ${formatDate(traveller.passport.expiry)}, only ${passportMargin} days after you return. Most countries want six months.`,
    state: passportOk ? 'done' : 'alert',
  })

  /* --- Backup card ------------------------------------------------------- */
  const backup = cards.find((card) => card.isBackup)
  if (backup) {
    items.push({
      id: 'backup',
      icon: 'card',
      label: backupCardActivated ? 'Backup card activated' : 'Backup card not activated',
      detail: backupCardActivated
        ? `Ending ${backup.last4}. Keep it somewhere separate from your wallet.`
        : `Your Travel Money Card came as a pair. The spare ending ${backup.last4} is sitting in a drawer, unactivated — it is useless to you in Tokyo like that.`,
      state: backupCardActivated ? 'done' : 'attention',
      action: backupCardActivated ? null : { label: 'Activate backup', action: 'activateBackup' },
    })
  }

  /* --- Lounge ------------------------------------------------------------ */
  items.push({
    id: 'lounge',
    icon: 'lounge',
    label: `${loungeRemaining} lounge ${loungeRemaining === 1 ? 'visit' : 'visits'} left`,
    detail:
      loungeRemaining > 0
        ? 'Mastercard Travel Pass, on your World Debit Mastercard. Two a year, per account.'
        : 'Both of this year’s complimentary visits are used.',
    state: loungeRemaining > 0 ? 'done' : 'neutral',
  })

  /* --- Localised contacts ------------------------------------------------ */
  items.push({
    id: 'contacts',
    icon: 'phone',
    label: `Emergency contacts set for ${emergencyContacts.country}`,
    detail: `Police ${emergencyContacts.police.number}, fire and ambulance ${emergencyContacts.ambulance.number}, and CommBank 24/7 on +61 2 9999 3283 with the charges reversed.`,
    state: 'done',
  })

  return items
}

/** How many are done, for the summary line above the list. */
export function checklistProgress(items) {
  const done = items.filter((item) => item.state === 'done').length
  return { done, total: items.length, outstanding: items.length - done }
}
