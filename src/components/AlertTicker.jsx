import { useEffect, useState } from 'react'
import './AlertTicker.css'

const SEVERITY_ORDER = {
  Extreme: 4,
  Severe: 3,
  Moderate: 2,
  Minor: 1,
  Unknown: 0,
}

function formatSent(sent) {
  if (!sent) {
    return ''
  }

  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(sent))
  } catch {
    return ''
  }
}

function normalizeAlert(feature) {
  const properties = feature?.properties ?? {}
  const severity = properties.severity || 'Unknown'

  return {
    id: feature?.id || `${properties.event}-${properties.sent}`,
    severity,
    rank: SEVERITY_ORDER[severity] ?? 0,
    headline: properties.headline || properties.event || 'Active weather alert',
    event: properties.event || 'Alert',
    sent: properties.sent || '',
    sentLabel: formatSent(properties.sent),
  }
}

function buildTickerItems(alerts) {
  return alerts.flatMap((alert) => [
    `${alert.event}${alert.severity ? ` • ${alert.severity}` : ''}`,
    alert.headline,
    alert.sentLabel ? `Updated ${alert.sentLabel}` : null,
  ]).filter(Boolean)
}

function buildTickerText(alerts) {
  return buildTickerItems(alerts).join('   •   ')
}

function AlertTicker() {
  const [status, setStatus] = useState('loading')
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    const controller = new AbortController()

    async function loadAlerts() {
      setStatus('loading')

      try {
        const response = await fetch('https://api.weather.gov/alerts/active', {
          signal: controller.signal,
          cache: 'no-store',
          headers: {
            Accept: 'application/geo+json',
          },
        })

        if (!response.ok) {
          throw new Error('Alert lookup failed.')
        }

        const payload = await response.json()
        const nextAlerts = (payload.features ?? [])
          .map(normalizeAlert)
          .sort((left, right) => {
            if (right.rank !== left.rank) {
              return right.rank - left.rank
            }

            return new Date(right.sent).getTime() - new Date(left.sent).getTime()
          })
          .slice(0, 6)

        setAlerts(nextAlerts)
        setStatus('ready')
      } catch (error) {
        if (error.name === 'AbortError') {
          return
        }

        setAlerts([])
        setStatus('error')
      }
    }

    loadAlerts()
    const intervalId = window.setInterval(loadAlerts, 15 * 60 * 1000)

    return () => {
      controller.abort()
      window.clearInterval(intervalId)
    }
  }, [])

  const heading = 'National Emergency Alerts'

  if (status === 'loading') {
    return (
      <section className="alert-ticker card" aria-live="polite">
        <span className="alert-ticker-label">{heading}</span>
        <div className="alert-ticker-static">Loading alerts...</div>
      </section>
    )
  }

  if (status === 'error') {
    return (
      <section className="alert-ticker card" aria-live="polite">
        <span className="alert-ticker-label">{heading}</span>
        <div className="alert-ticker-static">Alerts unavailable right now.</div>
      </section>
    )
  }

  if (!alerts.length) {
    return (
      <section className="alert-ticker card" aria-live="polite">
        <span className="alert-ticker-label">{heading}</span>
        <div className="alert-ticker-static">No active alerts right now.</div>
      </section>
    )
  }

  const tickerText = buildTickerText(alerts)

  return (
    <section className="alert-ticker card" aria-live="polite">
      <span className="alert-ticker-label">{heading}</span>
      <div className="alert-ticker-track">
        <div className="alert-ticker-marquee">
          <span className="alert-ticker-line">{tickerText}</span>
        </div>
        <div className="alert-ticker-marquee" aria-hidden="true">
          <span className="alert-ticker-line">{tickerText}</span>
        </div>
      </div>
    </section>
  )
}

export default AlertTicker
