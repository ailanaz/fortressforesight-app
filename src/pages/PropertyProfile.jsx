import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import { useActiveHome } from '../context/HomeContext'
import './Page.css'
import './PropertyProfile.css'

const DEFAULT_CENTER = [39.8283, -98.5795]
const DEFAULT_ZOOM = 4
const PROPERTY_ZOOM = 17
const EMPTY_DETAIL_ROWS = [
  { label: 'Matched address', value: 'Will populate here' },
  { label: 'County / State', value: 'Will populate here' },
  { label: 'ZIP code', value: 'Will populate here' },
  { label: 'Coordinates', value: 'Will populate here' },
]
const EMPTY_RISK_CARDS = ['Flood', 'Storm', 'Wildfire', 'Insurance']

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

function rankGeocodeResult(result) {
  const address = result.address ?? {}
  let score = Number(result.importance ?? 0)

  if (address.house_number && address.road) {
    score += 5
  }

  if (address.road) {
    score += 2
  }

  if (address.postcode) {
    score += 1
  }

  if (['house', 'building', 'office', 'amenity', 'residential'].includes(result.addresstype)) {
    score += 2
  }

  return score
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
    limit: '5',
    addressdetails: '1',
    countrycodes: 'us',
    dedupe: '1',
    'accept-language': 'en',
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

  const match = [...results].sort((left, right) => rankGeocodeResult(right) - rankGeocodeResult(left))[0]
  const [south, north, west, east] = (match.boundingbox ?? []).map(Number)

  return {
    lat: Number(match.lat),
    lon: Number(match.lon),
    displayName: match.display_name,
    address: match.address ?? {},
    bounds:
      Number.isFinite(south) &&
      Number.isFinite(north) &&
      Number.isFinite(west) &&
      Number.isFinite(east)
        ? [
            [south, west],
            [north, east],
          ]
        : null,
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

function MapViewportController({ bounds, center, zoom }) {
  const map = useMap()

  useEffect(() => {
    if (bounds) {
      map.flyToBounds(bounds, {
        animate: true,
        duration: 1.2,
        padding: [28, 28],
        maxZoom: PROPERTY_ZOOM,
      })
      return
    }

    map.flyTo(center, zoom, {
      animate: true,
      duration: 1.2,
    })
  }, [bounds, center, zoom, map])

  return null
}

function PropertyProfile() {
  const { activeHome, saveActiveHome, clearActiveHome } = useActiveHome()
  const [query, setQuery] = useState(activeHome?.query || '')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [property, setProperty] = useState(activeHome)
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

  useEffect(() => {
    setProperty(activeHome ?? null)
    setQuery((currentValue) =>
      currentValue || activeHome?.query || '',
    )
  }, [activeHome])

  const activeCenter = property
    ? [property.lat, property.lon]
    : DEFAULT_CENTER
  const activeZoom = property ? PROPERTY_ZOOM : DEFAULT_ZOOM
  const activeBounds = property?.bounds ?? null

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
      const nextProperty = {
        ...result,
        ...starterProfile,
        query: trimmedQuery,
      }

      setProperty(nextProperty)
      saveActiveHome(nextProperty)
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
    setProperty(activeHome)
    setStatus('idle')
    setError('')
  }

  return (
    <div className="page property-page">
      <div className="property-heading">
        <div>
          <h1 className="page-title">Property Search</h1>
          <p className="page-subtitle">
            Search an address to view the map and summary.
          </p>
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
                ? 'Zoomed to the matched property.'
                : 'Search an address to begin.'}
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
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                    detectRetina
                  />
                <MapViewportController bounds={activeBounds} center={activeCenter} zoom={activeZoom} />
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
                    <p className="property-sidebar-kicker">Risk Summary</p>
                    <h2 className="property-sidebar-title">{property.query}</h2>
                  </div>
                  <RiskBadge level={property.overallLevel} />
                </div>
                <p className="property-sidebar-copy">
                  Starter view for the searched property.
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
                <button className="btn-outline" type="button" disabled>
                  Current Home Active
                </button>
                <button className="btn-outline" type="button">
                  View Insurance Checklist
                </button>
                {activeHome ? (
                  <button
                    className="btn-outline"
                    type="button"
                    onClick={clearActiveHome}
                  >
                    Clear Current Home
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <div className="property-empty-state">
              <div className="property-sidebar-section">
                <div className="property-sidebar-header">
                  <div>
                    <p className="property-sidebar-kicker">Risk Summary</p>
                    <h2 className="property-sidebar-title">Awaiting address</h2>
                  </div>
                  <span className="risk-badge risk-badge-placeholder">
                    Will populate here
                  </span>
                </div>
                <p className="property-sidebar-copy">
                  Search an address to populate this panel.
                </p>
              </div>

              <div className="property-detail-list">
                {EMPTY_DETAIL_ROWS.map((row) => (
                  <div key={row.label} className="property-detail-row">
                    <span className="property-detail-label">{row.label}</span>
                    <span className="property-detail-value property-detail-value-placeholder">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="risk-grid risk-grid-sidebar">
                {EMPTY_RISK_CARDS.map((title) => (
                  <article key={title} className="risk-card risk-card-placeholder">
                    <span className="risk-label">{title}</span>
                    <span className="risk-badge risk-badge-placeholder">Pending</span>
                    <span className="risk-detail">Will populate here.</span>
                  </article>
                ))}
              </div>

              <div className="property-sidebar-section">
                <p className="property-sidebar-kicker">Next actions</p>
                <ul className="property-checklist property-checklist-placeholder">
                  <li>Search a property to populate this section.</li>
                  <li>Review the summary and save the home.</li>
                </ul>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

export default PropertyProfile
