/* =============================================================================
   TripChecklist — the status report that fills itself in.
   ============================================================================= */

import { Link } from 'react-router-dom'
import { Button, Icon, ProgressBar } from './primitives/index.jsx'
import { checklistProgress } from '../lib/checklist.js'
import './TripChecklist.css'

const STATE_ICON = {
  done: 'check',
  attention: 'alert',
  alert: 'alert',
  neutral: 'info',
}

export default function TripChecklist({ items, onAction, compact = false }) {
  if (!items.length) return null
  const { done, total, outstanding } = checklistProgress(items)

  return (
    <div className="checklist">
      <div className="checklist__summary">
        <p className="checklist__summary-text">
          <strong>
            {done} of {total} sorted
          </strong>{' '}
          {outstanding === 0
            ? '— nothing left for you to do.'
            : `— ${outstanding} ${outstanding === 1 ? 'thing needs' : 'things need'} you.`}
        </p>
        <ProgressBar
          value={done}
          max={total}
          tone={outstanding === 0 ? 'success' : 'brand'}
          label={`${done} of ${total} checklist items complete`}
        />
        <p className="checklist__summary-note">
          Ticked from what we already hold. You are not being asked to confirm your own passport
          number.
        </p>
      </div>

      <ul className="checklist__list">
        {items.map((item) => (
          <li className={`checklist__item checklist__item--${item.state}`} key={item.id}>
            <span className={`checklist__mark checklist__mark--${item.state}`}>
              <Icon name={STATE_ICON[item.state] ?? 'info'} size={15} strokeWidth={2.2} />
            </span>
            <span className="checklist__body">
              <span className="checklist__label">
                <Icon name={item.icon} size={16} />
                {item.label}
              </span>
              {!compact ? <span className="checklist__detail">{item.detail}</span> : null}
              {item.action ? (
                <span className="checklist__action">
                  {item.action.to ? (
                    <Button as={Link} to={item.action.to} size="sm" variant="secondary">
                      {item.action.label}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onAction?.(item.action.action)}
                    >
                      {item.action.label}
                    </Button>
                  )}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
