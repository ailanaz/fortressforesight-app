import { useEffect, useMemo, useRef, useState } from 'react'
import { useActiveHome } from '../context/HomeContext'
import './Page.css'
import './PropertyProfile.css'

const GOOGLE_MAPS_EMBED_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const EMPTY_DETAIL_ROWS = [
  { label: 'Address', value: '\u2014' },
  { label: 'City / State', value: '\u2014' },
  { label: 'ZIP code', value: '\u2014' },
  { label: 'Coordinates', value: '\u2014' },
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

  return {
    cards: [
      {
        title: 'Flood',
        level: floodLevel,
        detail: {
          low: 'Outside the highest-risk flood bands in this starter view',
          moderate: 'Review drainage and low-point water paths',
          high: 'Treat flood coverage and elevation history as priority questions',
        }[floodLevel],
      },
      {
        title: 'Storm',
        level: stormLevel,
        detail: {
          low: 'Typical seasonal storm exposure',
          moderate: 'Wind and hail planning should be part of annual maintenance',
          high: 'Roof age, openings, and deductible language deserve extra attention',
        }[stormLevel],
      },
      {
        title: 'Wildfire',
        level: wildfireLevel,
        detail: {
          low: 'No elevated wildfire signal in this starter profile',
          moderate: 'Create defensible space and review ember-resistant upgrades',
          high: 'Plan around defensible space and evacuation readiness',
        }[wildfireLevel],
      },
      {
        title: 'Insurance',
        level: insuranceLevel,
        detail: {
          low: 'Standard review of dwelling and loss-of-use coverage',
          moderate: 'Compare deductibles and peril-specific endorsements',
          high: 'Policy wording and exclusions should be reviewed closely',
        }[insuranceLevel],
      },
    ],
    overallLevel,
  }
}

function createAbortError() {
  const error = new Error('Request aborted.')
  error.name = 'AbortError'
  return error
}

function buildCensusRoad(components) {
  return [
    components.preDirection,
    components.streetName,
    components.suffixType,
    components.suffixDirection,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function geocodeWithCensus(query, signal) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      reject(new Error('Census geocoder unavailable.'))
      return
    }

    if (signal?.aborted) {
      reject(createAbortError())
      return
    }

    const callbackName = `__ffCensus_${Date.now()}_${Math.floor(Math.random() * 10000)}`
    const script = document.createElement('script')
    const params = new URLSearchParams({
      address: query,
      benchmark: 'Public_AR_Current',
      format: 'jsonp',
      callback: callbackName,
    })

    let settled = false

    const cleanup = () => {
      delete window[callbackName]
      script.remove()
      signal?.removeEventListener('abort', handleAbort)
    }

    const fail = (error) => {
      if (settled) {
        return
      }

      settled = true
      cleanup()
      reject(error)
    }

    function handleAbort() {
      fail(createAbortError())
    }

    window[callbackName] = (payload) => {
      if (settled) {
        return
      }

      const match = payload?.result?.addressMatches?.[0]

      if (!match) {
        fail(new Error('No Census address match found.'))
        return
      }

      const coordinates = match.coordinates ?? {}
      const components = match.addressComponents ?? {}
      const road = buildCensusRoad(components)
      const houseNumber = components.fromAddress || ''
      const streetLine = [houseNumber, road].filter(Boolean).join(' ').trim()

      settled = true
      cleanup()
      resolve({
        lat: Number(coordinates.y),
        lon: Number(coordinates.x),
        displayName: match.matchedAddress,
        address: {
          house_number: houseNumber,
          road,
          street_line: streetLine,
          city: components.city || '',
          state: components.state || '',
          postcode: components.zip || '',
        },
        bounds: null,
      })
    }

    script.onerror = () => {
      fail(new Error('Census geocoder failed.'))
    }

    signal?.addEventListener('abort', handleAbort, { once: true })
    script.src = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?${params.toString()}`
    document.body.appendChild(script)
  })
}

async function geocodeWithNominatim(query, signal) {
  const params = new URLSearchParams({
    format: 'jsonv2',
    limit: '3',
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

  return {
    lat: Number(match.lat),
    lon: Number(match.lon),
    displayName: match.display_name,
    address: match.address ?? {},
    bounds: null,
  }
}

async function geocodeAddress(query, signal) {
  try {
    return await geocodeWithCensus(query, signal)
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error
    }

    return geocodeWithNominatim(query, signal)
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

function getGoogleEmbedSrc(property) {
  if (!property) {
    return ''
  }

  const target = property.displayName || property.query

  if (GOOGLE_MAPS_EMBED_KEY) {
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(GOOGLE_MAPS_EMBED_KEY)}&q=${encodeURIComponent(target)}&zoom=16`
  }

  return `https://www.google.com/maps?output=embed&q=${encodeURIComponent(target)}`
}

function PropertyProfile() {
  const { activeHome, saveActiveHome, clearActiveHome } = useActiveHome()
  const [query, setQuery] = useState(activeHome?.query || '')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [property, setProperty] = useState(activeHome)
  const requestRef = useRef(null)

  useEffect(() => {
    return () => {
      if (requestRef.current) {
        requestRef.current.abort()
      }
    }
  }, [])

  useEffect(() => {
    setProperty(activeHome ?? null)
    setQuery((currentValue) => currentValue || activeHome?.query || '')
  }, [activeHome])

  const detailRows = useMemo(() => {
    if (!property) {
      return []
    }

    return [
      { label: 'Address', value: property.displayName },
      {
        label: 'City / State',
        value:
          [
            property.address.city ||
              property.address.town ||
              property.address.village ||
              property.address.hamlet,
            property.address.state,
          ]
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

  const googleEmbedSrc = getGoogleEmbedSrc(property)

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
      setError('We could not place that home yet. Try the street address with city and state.')
    } finally {
      requestRef.current = null
    }
  }

  const resetSearch = () => {
    if (requestRef.current) {
      requestRef.current.abort()
      requestRef.current = null
    }

    clearActiveHome()
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
          <p className="page-subtitle">Search an address to view the Risk Summary.</p>
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
          placeholder="Enter a home address"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button className="btn-primary property-search-button" type="submit">
          {status === 'loading' ? 'Searching...' : 'Search Address'}
        </button>
        {property ? (
          <button
            className="btn-outline property-search-button"
            type="button"
            onClick={resetSearch}
          >
            Reset
          </button>
        ) : null}
      </form>

      {error ? <p className="property-error">{error}</p> : null}

      <div className="property-workspace">
        <section className="property-map-card card">
          <div className="property-map-toolbar">
            <div>
              <p className="property-map-kicker">Map</p>
              <h2 className="property-map-title">{property ? property.query : 'Map'}</h2>
            </div>
            {property ? (
              <p className="property-map-note">Visual location reference.</p>
            ) : null}
          </div>

          <div className="property-map-frame">
            {property ? (
              <iframe
                className="property-map-embed"
                title={`Map for ${property.query}`}
                src={googleEmbedSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            ) : (
              <div className="property-map-placeholder">Search a home address to load the map.</div>
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

              <div className="property-actions">
                <button className="btn-outline" type="button" disabled>
                  Saved Address
                </button>
                {activeHome ? (
                  <button
                    className="btn-outline"
                    type="button"
                    onClick={clearActiveHome}
                  >
                    Clear Address
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <div className="property-empty-state">
              <div className="property-sidebar-section">
                <p className="property-sidebar-kicker">Risk Summary</p>
                <p className="property-sidebar-copy">
                  This area fills in after you search a home address.
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
                    <span className="risk-detail">\u2014</span>
                  </article>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

export default PropertyProfile
