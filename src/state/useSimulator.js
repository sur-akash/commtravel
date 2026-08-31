/* =============================================================================
   React binding for the simulator store.

   useSyncExternalStore rather than useState + useEffect: the store ticks on a
   timer outside React, and this is the API that keeps a fast external stream
   tear-free without re-subscribing on every render.
   ============================================================================= */

import { useSyncExternalStore, useMemo } from 'react'
import { getSimulator } from '../data/simulator.js'

export function useSimulator() {
  const simulator = getSimulator()

  const snapshot = useSyncExternalStore(
    simulator.subscribe,
    simulator.getSnapshot,
    simulator.getSnapshot
  )

  // The control surface is stable, so components taking it as a prop don't
  // re-render just because a rate ticked.
  const controls = useMemo(
    () => ({
      play: simulator.play,
      pause: simulator.pause,
      toggle: simulator.toggle,
      setSpeed: simulator.setSpeed,
      injectEvent: simulator.injectEvent,
      resolveSuspicious: simulator.resolveSuspicious,
      settle: simulator.settle,
      reset: simulator.reset,
    }),
    [simulator]
  )

  return { ...snapshot, controls }
}

/**
 * True when the viewer has asked for less motion. Read at call time rather than
 * subscribed to — a viewer changing this mid-session is not a case worth the
 * extra listener, and the CSS override in base.css handles the visuals anyway.
 */
export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
