/* =============================================================================
   AppShell — masthead, navigation, footer, and the emergency affordance that
   stays reachable from every route while a trip is active.
   ============================================================================= */

import { useEffect, useRef, useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { Button, Chip, DiamondMark, Icon } from './primitives/index.jsx'
import EmergencyPanel from './EmergencyPanel.jsx'
import { useDemo } from '../state/DemoContext.jsx'
import './AppShell.css'

const ROUTES = [
  { to: '/', label: 'Travel home', end: true },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/trip', label: 'Your trip' },
  { to: '/benefits', label: 'Benefits' },
  { to: '/emergency', label: 'Emergency' },
]

/** Byline links, in the footer of every page. */
const BYLINE_LINKS = [
  { label: 'GitHub', href: 'https://github.com/sur-akash' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/akash-sur/' },
  { label: 'Website', href: 'https://sur-akash.github.io/' },
]

/* -----------------------------------------------------------------------------
   Emergency drawer
   -------------------------------------------------------------------------- */

function EmergencyDrawer({ onClose }) {
  const panelRef = useRef(null)
  const closeRef = useRef(null)

  // Move focus in on open, and send Escape back out. Without this the drawer is
  // unusable by keyboard — you'd tab straight past it into the page behind.
  useEffect(() => {
    closeRef.current?.focus()

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = panelRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  return (
    <div
      className="drawer__scrim"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="drawer"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sos-title"
      >
        <div className="drawer__head">
          <h2 id="sos-title" style={{ fontSize: 'var(--fs-h3)' }}>
            Help, right now
          </h2>
          <Button
            ref={closeRef}
            variant="ghost"
            size="sm"
            icon="close"
            onClick={onClose}
            aria-label="Close emergency panel"
          />
        </div>
        <EmergencyPanel compact />
        <p style={{ marginTop: 'var(--space-5)' }}>
          <Link to="/emergency" onClick={onClose}>
            Open the full emergency page
          </Link>
        </p>
      </div>
    </div>
  )
}

/* -----------------------------------------------------------------------------
   Shell
   -------------------------------------------------------------------------- */

export default function AppShell({ children }) {
  const { trip, isActive, cardLocked, actions } = useDemo()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="masthead">
        <div className="container masthead__inner">
          <div className="masthead__bar">
            <Link to="/" className="masthead__brand">
              <DiamondMark size={26} />
              CommTravel
            </Link>
            <span className="masthead__spacer" />
            {isActive ? (
              <span className="masthead__status">
                <Chip tone={cardLocked ? 'alert' : 'brand'}>
                  {cardLocked ? 'Card locked' : 'Travel Mode is on'}
                </Chip>
              </span>
            ) : null}
          </div>

          <nav className="nav" aria-label="Primary">
            <ul className="nav__list">
              {ROUTES.map((route) => (
                <li key={route.to}>
                  <NavLink className="nav__link" to={route.to} end={route.end}>
                    {route.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main id="main" className="shell__main">
        {children}
      </main>

      <footer className="footer">
        <div className="container footer__inner">
          <div>
            <p className="footer__disclaimer">
              Unofficial concept prototype. Not affiliated with or endorsed by Commonwealth Bank
              of Australia. All data simulated.
            </p>
            <p className="footer__meta">
              Product fees and benefits referenced here are taken from CommBank&rsquo;s published
              pages. Balances, transactions, rates and timings are generated by a seeded
              simulator and are not real.
            </p>
          </div>
          <Button variant="secondary" size="sm" icon="refresh" onClick={actions.resetDemo}>
            Reset demo
          </Button>
        </div>

        {/* Byline, last thing on every page. External links open in a new tab —
            rel="noopener" because a target="_blank" link otherwise hands the
            opened page a reference back to this one. */}
        <div className="container footer__byline">
          <span>Built by Akash Sur</span>
          <span className="footer__sep" aria-hidden="true">
            ·
          </span>
          {BYLINE_LINKS.map((link, index) => (
            <span key={link.label}>
              <a
                className="footer__link"
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
                <Icon name="arrowUpRight" size={12} />
              </a>
              <span className="footer__sep" aria-hidden="true">
                ·
              </span>
            </span>
          ))}
          <span>data is illustrative</span>
        </div>
      </footer>

      {/* Persistent while a trip is running — the whole argument of module 4 is
          that this must never be more than one tap away. */}
      {trip ? (
        <Button
          className={`sos ${cardLocked ? 'sos--locked' : ''}`}
          variant={cardLocked ? 'danger' : 'primary'}
          icon={cardLocked ? 'lock' : 'shield'}
          onClick={() => setDrawerOpen(true)}
          aria-haspopup="dialog"
        >
          {cardLocked ? 'Card locked' : 'Get help'}
        </Button>
      ) : null}

      {drawerOpen ? <EmergencyDrawer onClose={() => setDrawerOpen(false)} /> : null}
    </div>
  )
}
