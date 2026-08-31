/* =============================================================================
   Demo state — everything the viewer can change, persisted across reloads.

   Kept deliberately separate from the simulator: the simulator owns the
   transaction stream and is deterministic from a seed, while this owns the
   choices a person makes while poking at the demo (which trip state they're
   looking at, whether they locked the card, how they ordered the currency
   stack). Only this half goes to localStorage.

   "Reset demo" clears both.
   ============================================================================= */

import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react'
import {
  TRIP_STATES,
  DEFAULT_TRIP_STATE,
  TRAVELLER,
  CARDS,
  getEmergencyContacts,
} from '../data/trip.js'
import { CURRENCY_HOLDINGS } from '../data/fx.js'
import { resetSimulator } from '../data/simulator.js'

/* Bumping the version invalidates any older saved shape rather than trying to
   migrate it — this is a demo, and a stale key producing a broken dashboard is
   far worse than a viewer losing their toggle positions. */
const STORAGE_KEY = 'commtravel.demo.v1'

const DEFAULT_STATE = {
  tripStateId: DEFAULT_TRIP_STATE,
  currencyOrder: CURRENCY_HOLDINGS.map((holding) => holding.code),
  cardLocked: false,
  backupCardActivated: false,
  insuranceActivatedByUser: false,
  extraLoads: {}, // { JPY: 30000 } from the Load currency modal
  rateAlerts: {}, // { JPY: 96.5 }
  dismissedExplainers: [],
  registeredTrip: null, // filled in by the register-trip flow
}

function readStored() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Guard against a hand-edited or half-written key.
    if (!parsed || typeof parsed !== 'object') return null
    return { ...DEFAULT_STATE, ...parsed }
  } catch {
    // Private browsing, blocked storage, corrupt JSON — all mean "start fresh".
    return null
  }
}

function writeStored(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage being unavailable must never break the demo.
  }
}

const DemoContext = createContext(null)

export function DemoProvider({ children }) {
  const [state, setState] = useState(() => readStored() ?? DEFAULT_STATE)

  useEffect(() => {
    writeStored(state)
  }, [state])

  const update = useCallback((patch) => {
    setState((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }))
  }, [])

  const actions = useMemo(
    () => ({
      setTripState: (tripStateId) => update({ tripStateId }),

      setCurrencyOrder: (currencyOrder) => update({ currencyOrder }),

      /** Move one currency up or down the fallback stack. Used by both the
          pointer drag and the keyboard controls, so they can't diverge. */
      moveCurrency: (code, direction) =>
        update((prev) => {
          const order = [...prev.currencyOrder]
          const from = order.indexOf(code)
          const to = from + direction
          if (from < 0 || to < 0 || to >= order.length) return prev
          order.splice(to, 0, order.splice(from, 1)[0])
          return { currencyOrder: order }
        }),

      lockCard: () => update({ cardLocked: true }),
      unlockCard: () => update({ cardLocked: false }),
      toggleCardLock: () => update((prev) => ({ cardLocked: !prev.cardLocked })),

      activateBackupCard: () => update({ backupCardActivated: true }),
      activateInsurance: () => update({ insuranceActivatedByUser: true }),

      loadCurrency: (code, amount) =>
        update((prev) => ({
          extraLoads: { ...prev.extraLoads, [code]: (prev.extraLoads[code] ?? 0) + amount },
          currencyOrder: prev.currencyOrder.includes(code)
            ? prev.currencyOrder
            : [...prev.currencyOrder, code],
        })),

      setRateAlert: (code, rate) =>
        update((prev) => ({ rateAlerts: { ...prev.rateAlerts, [code]: rate } })),

      clearRateAlert: (code) =>
        update((prev) => {
          const next = { ...prev.rateAlerts }
          delete next[code]
          return { rateAlerts: next }
        }),

      dismissExplainer: (id) =>
        update((prev) => ({
          dismissedExplainers: prev.dismissedExplainers.includes(id)
            ? prev.dismissedExplainers
            : [...prev.dismissedExplainers, id],
        })),

      /** Complete the register-trip flow. Moves the demo to the upcoming state. */
      registerTrip: (details) =>
        update({ registeredTrip: details, tripStateId: 'upcoming' }),

      /** Wipe everything — saved choices and the transaction stream both. */
      resetDemo: () => {
        try {
          window.localStorage.removeItem(STORAGE_KEY)
        } catch {
          /* nothing to clean up */
        }
        setState(DEFAULT_STATE)
        resetSimulator()
      },
    }),
    [update]
  )

  const value = useMemo(() => {
    const tripState = TRIP_STATES[state.tripStateId] ?? TRIP_STATES[DEFAULT_TRIP_STATE]
    const trip = tripState.trip

    return {
      ...state,
      tripState,
      trip,
      hasTrip: Boolean(trip),
      isActive: trip?.status === 'active',
      isUpcoming: trip?.status === 'upcoming',
      traveller: TRAVELLER,
      cards: CARDS,
      emergencyContacts: getEmergencyContacts(trip?.destination.countryCode),
      actions,
    }
  }, [state, actions])

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemo() {
  const context = useContext(DemoContext)
  if (!context) throw new Error('useDemo must be used inside a DemoProvider')
  return context
}
