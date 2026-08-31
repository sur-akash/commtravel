/* =============================================================================
   TripStateSwitcher — the demo's control surface.

   Three states, and every module in the portal reacts to whichever is selected.
   It's a demo device rather than a product feature, so it says so.
   ============================================================================= */

import { TRIP_STATE_ORDER, TRIP_STATES } from '../data/trip.js'
import { Icon } from './primitives/index.jsx'
import './TripStateSwitcher.css'

export default function TripStateSwitcher({ value, onChange }) {
  return (
    <div className="switcher">
      <div className="switcher__head">
        <span className="eyebrow">Demo control</span>
        <p className="switcher__hint">
          Pick a state. The dashboard, checklist, benefits and emergency panel all change with it.
        </p>
      </div>

      <div className="switcher__options" role="radiogroup" aria-label="Trip state">
        {TRIP_STATE_ORDER.map((id) => {
          const state = TRIP_STATES[id]
          const selected = value === id
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`switcher__option ${selected ? 'is-selected' : ''}`}
              onClick={() => onChange(id)}
            >
              <span className="switcher__option-mark" aria-hidden="true">
                {selected ? <Icon name="check" size={14} strokeWidth={2.4} /> : null}
              </span>
              <span>
                <span className="switcher__option-label">{state.label}</span>
                <span className="switcher__option-desc">{state.description}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
