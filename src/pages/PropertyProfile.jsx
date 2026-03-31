import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import './Page.css'
import './PropertyProfile.css'

const DEFAULT_CENTER = [39.8283, -98.5795]
const DEFAULT_ZOOM = 4
const PROPERTY_ZOOM = 17

const RISK_LEVELS = {
  low: { label: 'Low Risk', color: '#3d64f0', bg: 'rgba(61, 100, 240, 0.18)' },
  moderate: { label: 'Moderate Risk', color: '#f8c200', bg: 'rgba(248, 194, 0, 0.18)' },
  high: { label: 'High Risk', color: '#ff6675', bg: 'rgba(255, 102, 117, 0.18)' },
}

function hashString(input) {
  let hash = 0

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index)
    hash |= 0
  }

  return Math.abs(hash)
}

function pickRiskLevel(seed, shift = 0) {
  const levels = ['low', 'moderate', 'high']
  return levels[(seed + shift) % levels.length]
}

function deriveOverallLevel(levels) {
  if (levels.includes('high')) {
    return 'high'
  }

  if (levels.filter((level) => level === 'moderate').length >= 2) {
    return 'moderate'
  }

  return 'low'
}

function formatCoordinate(value) {
  return Number(value).toFixed(5)
}

function createStarterProfile(result, query) {
  const seed = hashString(`${query}:${result.lat}:${result.lon}`)
  const floodLevel = pickRiskLevel(seed)
  const stormLevel = pickRiskLevel(seed, 1)
  const wildfireLevel = pickRiskLevel(seed, 2)
  const insuranceLevel = pickRiskLevel(seed, 3)
  const overallLevel = deriveOverallLevel([
    floodLevel,
    stormLevel,
    wildfireLevel,
    insuranceLevel,
  ])

  const floodDetails = {
    low: 'Outside the highest-risk flood bands in this starter view',
    moderate: 'Review drainage, foundation grading, and low-point water paths',
    high: 'Treat flood coverage and elevation history as priority questions',
  }

  const stormDetails = {
    low: 'Typical seasonal storm exposure',
    moderate: 'Wind and hail planning should be part of annual maintenance',
    high: 'Roof age, openings, and deductible language deserve extra attention',
  }

  const wildfireDetails = {
    low: 'No elevated wildfire signal in this starter profile',
    moderate: 'Create defensible space and review ember-resistant upgrades',
    high: 'Plan around defensible space, vent protection, and evacuation readiness',
  }

  const insuranceDetails = {
    low: 'Standard review of dwelling, personal property, and loss-of-use coverage',
    moderate: 'Compare deductibles and confirm peril-specific endorsements',
    high: 'Policy wording, exclusions, and specialty coverage should be reviewed closely',
  }

  const cards = [
    {
      title: 'Flood',
      level: floodLevel,
      detail: floodDetails[floodLevel],
    },
    {
      title: 'Storm',
      level: stormLevel,
      detail: stormDetails[stormLevel],
    },
    {
      title: 'Wildfire',
      level: wildfireLevel,
      detail: wildfireDetails[wildfireLevel],
    },
    {
      title: 'Insurance',
      level: insuranceLevel,
      detail: insuranceDetails[insuranceLevel],
    },
  ]

  const readinessChecklist = [
    'Save a full home photo inventory before the next major weather event',
    'Review deductibles, exclusions, and loss-of-use coverage now',
    'Store your declarations page, inspection reports, and receipts in the vault',
    'Set annual reminders for roof, gutter, drainage, and HVAC checks',
  ]

  return {
    cards,
    overallLevel,
    readinessChecklist,
  }
}

async function geocodeAddress(query, signal) {
  const params = new URLSearchParams({
    format: 'jsonv2',
    limit: '1',
    addressdetails: '1',
    countrycodes: 'us',
    q: query,
  })

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    {
      signal,
      headers: {
        Accept: 'application/json',
      },
    },
  )

  if (!response.ok) {
    throw new Error('Address lookup failed.')
  }

  const results = await response.json()

  if (!results.length) {
    throw new Error('No address match found.')
  }

  const match = results[0]

  return {
    lat: Number(match.lat),
    lon: Number(match.lon),
    displayName: match.display_name,
    address: match.address ?? {},
  }
}

function RiskBadge({ level }) {
  const risk = RISK_LEVELS[level] || RISK_LEVELS.low

  return (
    <span className="risk-badge" style={{ color: risk.color, background: risk.bg }}>
      {risk.label}
    </span>
  )
}

function MapViewportController({ center, zoom }) {
  const map = useMap()

  useEffect(() => {
    map.flyTo(center, zoom, {
      animate: true,
      duration: 1.2,
    })
  }, [center, zoom, map])

  return null
}

function PropertyProfile() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [property, setProperty] = useState(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const requestRef = useRef(null)

  useEffect(() => {
    setIsMapReady(true)

    return () => {
      if (requestRef.current) {
        requestRef.current.abort()
      }
    }
  }, [])

  const activeCenter = property
    ? [property.lat, property.lon]
    : DEFAULT_CENTER
  const activeZoom = property ? PROPERTY_ZOOM : DEFAULT_ZOOM

  const detailRows = useMemo(() => {
    if (!property) {
      return []
    }

    return [
      { label: 'Matched address', value: property.displayName },
      {
        label: 'County / State',
        value:
          [property.address.county, property.address.state]
            .filter(Boolean)
            .join(', ') || 'Not available yet',
      },
      {
        label: 'ZIP code',
        value: property.address.postcode || 'Not available yet',
      },
      {
        label: 'Coordinates',
        value: `${formatCoordinate(property.lat)}, ${formatCoordinate(property.lon)}`,
      },
    ]
  }, [property])

  const handleSubmit = async (event) => {
    event.preventDefault()

    const trimmedQuery = query.trim()

    if (!trimmedQuery) {
      return
    }

    if (requestRef.current) {
      requestRef.current.abort()
    }

    const controller = new AbortController()
    requestRef.current = controller

    setStatus('loading')
    setError('')

    try {
      const result = await geocodeAddress(trimmedQuery, controller.signal)
      const starterProfile = createStarterProfile(result, trimmedQuery)

      setProperty({
        ...result,
        ...starterProfile,
        query: trimmedQuery,
      })
      setStatus('success')
    } catch (lookupError) {
      if (lookupError.name === 'AbortError') {
        return
      }

      setProperty(null)
      setStatus('error')
      setError(
        'We could not place that address yet. Try a fuller street address with city and state.',
      )
    } finally {
      requestRef.current = null
    }
  }

  const resetSearch = () => {
    setQuery('')
    setProperty(null)
    setStatus('idle')
    setError('')
  }

  return (
    <div className="page property-page">
      <div className="property-heading">
        <div>
          <h1 className="page-title">Property Search</h1>
          <p className="page-subtitle">
            Search one address at a time, zoom into the property, and review a
            starter risk profile in the side panel.
          </p>
        </div>
        <div className="property-status-group">
          <span className="property-status-chip">
            Address search only
          </span>
          <span className="property-status-chip property-status-chip-muted">
            Live zoom map
          </span>
        </div>
      </div>

      <form className="property-searchbar" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="property-address-search">
          Property address
        </label>
        <input
          id="property-address-search"
          className="property-search-input"
          type="text"
          placeholder="Search a property address"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button className="btn-primary property-search-button" type="submit">
          {status === 'loading' ? 'Searching...' : 'Search Address'}
        </button>
        {property && (
          <button
            className="btn-outline property-search-button"
            type="button"
            onClick={resetSearch}
          >
            Reset
          </button>
        )}
      </form>

      {error && <p className="property-error">{error}</p>}

      <div className="property-workspace">
        <section className="property-map-card card">
          <div className="property-map-toolbar">
            <div>
              <p className="property-map-kicker">Map View</p>
              <h2 className="property-map-title">
                {property ? property.query : 'United States overview'}
              </h2>
            </div>
            <p className="property-map-note">
              {property
                ? 'The map will pan and zoom into the matched property.'
                : 'Search an address to animate into the property location.'}
            </p>
          </div>

          <div className="property-map-frame">
            {isMapReady ? (
              <MapContainer
                center={DEFAULT_CENTER}
                zoom={DEFAULT_ZOOM}
                scrollWheelZoom
                className="property-map"
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  subdomains="abcd"
                />
                <MapViewportController center={activeCenter} zoom={activeZoom} />
                {property && (
                  <CircleMarker
                    center={[property.lat, property.lon]}
                    radius={12}
                    pathOptions={{
                      color: '#f8c200',
                      fillColor: '#3d64f0',
                      fillOpacity: 0.88,
                      weight: 3,
                    }}
                  >
                    <Popup>
                      <strong>{property.query}</strong>
                      <br />
                      {property.displayName}
                    </Popup>
                  </CircleMarker>
                )}
              </MapContainer>
            ) : (
              <div className="property-map-placeholder">Loading map...</div>
            )}
          </div>
        </section>

        <aside className="property-sidebar card">
          {property ? (
            <>
              <div className="property-sidebar-section">
                <div className="property-sidebar-header">
                  <div>
                    <p className="property-sidebar-kicker">Starter summary</p>
                    <h2 className="property-sidebar-title">{property.query}</h2>
                  </div>
                  <RiskBadge level={property.overallLevel} />
                </div>
                <p className="property-sidebar-copy">
                  FEMA, NOAA, and insurance integrations are not wired yet, so
                  this panel is a starter profile to shape the final workflow.
                </p>
              </div>

              <div className="property-detail-list">
                {detailRows.map((row) => (
                  <div key={row.label} className="property-detail-row">
                    <span className="property-detail-label">{row.label}</span>
                    <span className="property-detail-value">{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="risk-grid risk-grid-sidebar">
                {property.cards.map((card) => (
                  <article key={card.title} className="risk-card">
                    <span className="risk-label">{card.title}</span>
                    <RiskBadge level={card.level} />
                    <span className="risk-detail">{card.detail}</span>
                  </article>
                ))}
              </div>

              <div className="property-sidebar-section">
                <p className="property-sidebar-kicker">Next actions</p>
                <ul className="property-checklist">
                  {property.readinessChecklist.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="property-actions">
                <button className="btn-outline" type="button">
                  Save Property
                </button>
                <button className="btn-outline" type="button">
                  View Insurance Checklist
                </button>
              </div>
            </>
          ) : (
            <div className="property-empty-state">
              <p className="property-sidebar-kicker">Search workspace</p>
              <h2 className="property-sidebar-title">One address, one clear view.</h2>
              <p className="property-sidebar-copy">
                Enter a property address above to drop a pin, zoom into the
                location, and open a right-side summary built for home risk and
                readiness.
              </p>

              <div className="property-empty-list">
                <div className="property-empty-item">
                  <span className="property-empty-dot" />
                  <span>Smooth map zoom into the searched home</span>
                </div>
                <div className="property-empty-item">
                  <span className="property-empty-dot" />
                  <span>Right-panel property summary and starter risk signals</span>
                </div>
                <div className="property-empty-item">
                  <span className="property-empty-dot" />
                  <span>Future handoff into records, readiness, and recovery flows</span>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

export default PropertyProfile
