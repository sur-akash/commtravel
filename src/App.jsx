import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import AppShell from './components/AppShell.jsx'
import { DemoProvider } from './state/DemoContext.jsx'
import Home from './routes/Home.jsx'
import Dashboard from './routes/Dashboard.jsx'
import Trip from './routes/Trip.jsx'
import Benefits from './routes/Benefits.jsx'
import Emergency from './routes/Emergency.jsx'

/**
 * Client-side routing loses the browser's own "you moved to a new page" cue.
 * Sending focus to the top and scrolling there on each navigation restores it —
 * without this, a keyboard user tabs from wherever they were on the old page.
 */
function RouteChangeHandler() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    const main = document.getElementById('main')
    if (main) {
      main.setAttribute('tabindex', '-1')
      main.focus({ preventScroll: true })
      main.removeAttribute('tabindex')
    }
  }, [pathname])

  return null
}

export default function App() {
  return (
    <DemoProvider>
      <RouteChangeHandler />
      <AppShell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/trip" element={<Trip />} />
          <Route path="/benefits" element={<Benefits />} />
          <Route path="/emergency" element={<Emergency />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </DemoProvider>
  )
}
