import { useEffect, useMemo, useState } from 'react'
import './AlertTicker.css'

const STATE_CODES = {
  ALABAMA: 'AL',
  ALASKA: 'AK',
  ARIZONA: 'AZ',
  ARKANSAS: 'AR',
  CALIFORNIA: 'CA',
  COLORADO: 'CO',
  CONNECTICUT: 'CT',
  DELAWARE: 'DE',
  'DISTRICT OF COLUMBIA': 'DC',
  FLORIDA: 'FL',
  GEORGIA: 'GA',
  HAWAII: 'HI',
  IDAHO: 'ID',
  ILLINOIS: 'IL',
  INDIANA: 'IN',
  IOWA: 'IA',
  KANSAS: 'KS',
  KENTUCKY: 'KY',
  LOUISIANA: 'LA',
  MAINE: 'ME',
  MARYLAND: 'MD',
  MASSACHUSETTS: 'MA',
  MICHIGAN: 'MI',
  MINNESOTA: 'MN',
  MISSISSIPPI: 'MS',
  MISSOURI: 'MO',
  MONTANA: 'MT',
  NEBRASKA: 'NE',
  NEVADA: 'NV',
  'NEW HAMPSHIRE': 'NH',
  'NEW JERSEY': 'NJ',
  'NEW MEXICO': 'NM',
  'NEW YORK': 'NY',
  'NORTH CAROLINA': 'NC',
  'NORTH DAKOTA': 'ND',
  OHIO: 'OH',
  OKLAHOMA: 'OK',
  OREGON: 'OR',
  PENNSYLVANIA: 'PA',
  'RHODE ISLAND': 'RI',
  'SOUTH CAROLINA': 'SC',
  'SOUTH DAKOTA': 'SD',
  TENNESSEE: 'TN',
  TEXAS: 'TX',
  UTAH: 'UT',
  VERMONT: 'VT',
  VIRGINIA: 'VA',
  WASHINGTON: 'WA',
  'WEST VIRGINIA': 'WV',
  WISCONSIN: 'WI',
  WYOMING: 'WY',
  'PUERTO RICO': 'PR',
  GUAM: 'GU',
  'AMERICAN SAMOA': 'AS',
  'NORTHERN MARIANA ISLANDS': 'MP',
  'U.S. VIRGIN ISLANDS': 'VI',
}

const SEVERITY_ORDER = {
  Extreme: 4,
  Severe: 3,
  Moderate: 2,
  Minor: 1,
  Unknown: 0,
}

function getStateCode(value) {
  if (!value) {
    return ''
  }

  const trimmed = value.trim()

  if (trimmed.length === 2) {
    return trimmed.toUpperCase()
  }

  return STATE_CODES[trimmed.toUpperCase()] || ''
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

function AlertTicker({ state }) {
  const stateCode = useMemo(() => getStateCode(state), [state])
  const [status, setStatus] = useState('loading')
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    const controller = new AbortController()

    async function loadAlerts() {
      setStatus('loading')

      try {
        const endpoint = stateCode
          ? `https://api.weather.gov/alerts/active?area=${encodeURIComponent(stateCode)}`
          : 'https://api.weather.gov/alerts/active'

        const response = await fetch(endpoint, {
          signal: controller.signal,
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
  }, [stateCode])

  const heading = stateCode ? `${stateCode} Emergency Alerts` : 'National Emergency Alerts'

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

  const tickerItems = buildTickerItems(alerts)

  return (
    <section className="alert-ticker card" aria-live="polite">
      <span className="alert-ticker-label">{heading}</span>
      <div className="alert-ticker-track">
        <div className="alert-ticker-marquee">
          {tickerItems.map((item, index) => (
            <span key={`a-${index}`} className="alert-ticker-item">
              {item}
            </span>
          ))}
        </div>
        <div className="alert-ticker-marquee" aria-hidden="true">
          {tickerItems.map((item, index) => (
            <span key={`b-${index}`} className="alert-ticker-item">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

export default AlertTicker
