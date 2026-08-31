/* =============================================================================
   Simulator controls.

   Deliberately visible rather than hidden behind a dev flag — the demo is the
   product here, and being able to say "watch, I'll make the merchant try to
   charge us in dollars" mid-pitch is the whole point of the inject dropdown.
   ============================================================================= */

import { useState } from 'react'
import { Button } from './primitives/index.jsx'
import { EVENT_TYPES, SPEEDS } from '../data/simulator.js'
import './SimControls.css'

export default function SimControls({ running, speed, controls, onInject }) {
  const [eventType, setEventType] = useState(EVENT_TYPES[0].id)
  const selected = EVENT_TYPES.find((event) => event.id === eventType)

  return (
    <div className="simctl">
      <div className="simctl__row">
        <Button
          size="sm"
          variant={running ? 'secondary' : 'primary'}
          icon={running ? 'pause' : 'play'}
          onClick={controls.toggle}
        >
          {running ? 'Pause' : 'Play'}
        </Button>

        <div className="simctl__speeds" role="group" aria-label="Simulation speed">
          {SPEEDS.map((option) => (
            <button
              key={option}
              type="button"
              className={`simctl__speed ${speed === option ? 'is-active' : ''}`}
              aria-pressed={speed === option}
              onClick={() => controls.setSpeed(option)}
            >
              {option}×
            </button>
          ))}
        </div>

        <Button size="sm" variant="ghost" icon="refresh" onClick={controls.reset}>
          Reset
        </Button>
      </div>

      <div className="simctl__row">
        <label className="simctl__label" htmlFor="inject-event">
          Inject event
        </label>
        <select
          id="inject-event"
          className="simctl__select"
          value={eventType}
          onChange={(event) => setEventType(event.target.value)}
        >
          {EVENT_TYPES.map((event) => (
            <option key={event.id} value={event.id}>
              {event.label}
            </option>
          ))}
        </select>
        <Button size="sm" variant="primary" onClick={() => onInject(eventType)}>
          Fire
        </Button>
      </div>

      {selected ? <p className="simctl__hint">{selected.hint}</p> : null}
    </div>
  )
}
