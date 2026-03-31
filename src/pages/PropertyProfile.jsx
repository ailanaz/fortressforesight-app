import { useEffect, useRef, useState } from 'react'
import { useActiveHome } from '../context/HomeContext'
import './Page.css'
import './PropertyProfile.css'

const GOOGLE_MAPS_EMBED_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const EMPTY_DETAIL_ROWS = [
  { label: 'Address', value: '\u2014' },
  { label: 'City / State', value: '\u2014' },
  { label: 'County', value: '\u2014' },
  { label: 'ZIP code', value: '\u2014' },
]

const EMPTY_SUMMARY_CARDS = [
  {
    title: 'Property Context',
    rows: EMPTY_DETAIL_ROWS,
  },
  {
    title: 'Flood / FEMA',
    rows: [
      { label: 'FEMA flood zone', value: '\u2014', pending: true },
      { label: 'Special flood hazard area', value: '\u2014', pending: true },
      { label: 'Flood map panel', value: '\u2014', pending: true },
    ],
  },
  {
    title: 'Area Snapshot',
    rows: [
      { label: 'Flood review', value: '\u2014' },
      { label: 'Storm review', value: '\u2014' },
      { label: 'Wildfire review', value: '\u2014' },
    ],
  },
  {
    title: 'Zoning / Land Use',
    rows: [
      { label: 'Zoning code', value: '\u2014', pending: true },
      { label: 'Land use', value: '\u2014', pending: true },
    ],
  },
]

const STATE_ALIASES = {
  ALABAMA: 'AL',
  ALASKA: 'AK',
  ARIZONA: 'AZ',
  ARKANSAS: 'AR',
  CALIFORNIA: 'CA',
  COLORADO: 'CO',
  CONNECTICUT: 'CT',
  DELAWARE: 'DE',
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
  RHODEISLAND: 'RI',
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
  'DISTRICT OF COLUMBIA': 'DC',
  DC: 'DC',
}

const FLOOD_PRIORITY_STATES = new Set([
  'AL', 'CT', 'DC', 'DE', 'FL', 'GA', 'HI', 'LA', 'MA', 'MD', 'MS', 'NC', 'NJ',
  'NY', 'RI', 'SC', 'TX', 'VA',
])
const FLOOD_REVIEW_STATES = new Set([
  'AR', 'CA', 'IA', 'IL', 'KY', 'MI', 'MN', 'MO', 'OH', 'OR', 'PA', 'TN', 'WA', 'WI', 'WV',
])
const STORM_PRIORITY_STATES = new Set([
  'AL', 'AR', 'FL', 'GA', 'IA', 'KS', 'LA', 'MN', 'MO', 'MS', 'NC', 'NE', 'OK', 'SC', 'SD', 'TX',
])
const STORM_REVIEW_STATES = new Set([
  'CO', 'IL', 'IN', 'KY', 'ND', 'NM', 'OH', 'TN', 'VA', 'WI', 'WY',
])
const WILDFIRE_PRIORITY_STATES = new Set([
  'AZ', 'CA', 'CO', 'ID', 'MT', 'NM', 'NV', 'OR', 'UT', 'WA', 'WY',
])
const WILDFIRE_REVIEW_STATES = new Set([
  'KS', 'NE', 'OK', 'TX',
])

function getMunicipality(address) {
  return (
    address.city ||
    address.town ||
    address.village ||
    address.hamlet ||
    address.municipality ||
    ''
  )
}

function normalizeState(value) {
  if (!value) {
    return ''
  }

  const cleaned = String(value).trim().toUpperCase()
  return STATE_ALIASES[cleaned] || cleaned
}

function inferLevel(stateCode, prioritySet, reviewSet) {
  if (prioritySet.has(stateCode)) {
    return 'high'
  }

  if (reviewSet.has(stateCode)) {
    return 'moderate'
  }

  return 'low'
}

function getFloodReview(level) {
  return {
    low: 'Standard review',
    moderate: 'Regional review',
    high: 'Priority review',
  }[level]
}

function getRegionalReviewLabel(level) {
  return {
    low: 'Standard review',
    moderate: 'Regional review',
    high: 'Priority review',
  }[level]
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

function createStarterProfile(result) {
  const stateCode = normalizeState(result.address?.state)
  const floodLevel = inferLevel(stateCode, FLOOD_PRIORITY_STATES, FLOOD_REVIEW_STATES)
  const stormLevel = inferLevel(stateCode, STORM_PRIORITY_STATES, STORM_REVIEW_STATES)
  const wildfireLevel = inferLevel(stateCode, WILDFIRE_PRIORITY_STATES, WILDFIRE_REVIEW_STATES)

  return {
    summaryCards: [
      {
        title: 'Property Context',
        rows: [
          { label: 'Address', value: result.displayName },
          {
            label: 'City / State',
            value:
              [getMunicipality(result.address), result.address?.state]
                .filter(Boolean)
                .join(', ') || 'Not available yet',
          },
          {
            label: 'County',
            value: result.address?.county || 'Not available yet',
          },
          {
            label: 'ZIP code',
            value: result.address?.postcode || 'Not available yet',
          },
        ],
      },
      {
        title: 'Flood / FEMA',
        rows: [
          { label: 'FEMA flood zone', value: 'Pending FEMA source', pending: true },
          { label: 'Special flood hazard area', value: 'Pending FEMA source', pending: true },
          { label: 'Flood map panel', value: 'Pending FEMA source', pending: true },
        ],
      },
      {
        title: 'Area Snapshot',
        rows: [
          { label: 'Flood review', value: getFloodReview(floodLevel) },
          { label: 'Storm review', value: getRegionalReviewLabel(stormLevel) },
          { label: 'Wildfire review', value: getRegionalReviewLabel(wildfireLevel) },
        ],
      },
      {
        title: 'Zoning / Land Use',
        rows: [
          { label: 'Zoning code', value: 'Pending local source', pending: true },
          { label: 'Land use', value: 'Pending local source', pending: true },
        ],
      },
    ],
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

async function enrichAddressContext(result, signal) {
  if (!result?.lat || !result?.lon) {
    return result
  }

  const params = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    'accept-language': 'en',
    lat: String(result.lat),
    lon: String(result.lon),
    zoom: '18',
  })

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      {
        signal,
        headers: {
          Accept: 'application/json',
        },
      },
    )

    if (!response.ok) {
      return result
    }

    const payload = await response.json()
    const reverseAddress = payload?.address ?? {}

    return {
      ...result,
      address: {
        ...reverseAddress,
        ...result.address,
        county: result.address?.county || reverseAddress.county || '',
        city:
          result.address?.city ||
          reverseAddress.city ||
          reverseAddress.town ||
          reverseAddress.village ||
          '',
        town: result.address?.town || reverseAddress.town || '',
        village: result.address?.village || reverseAddress.village || '',
        municipality: result.address?.municipality || reverseAddress.municipality || '',
      },
    }
  } catch {
    return result
  }
}

async function geocodeAddress(query, signal) {
  try {
    const result = await geocodeWithCensus(query, signal)
    return await enrichAddressContext(result, signal)
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error
    }

    const result = await geocodeWithNominatim(query, signal)
    return await enrichAddressContext(result, signal)
  }
}

function SummaryCard({ title, rows }) {
  return (
    <article className="summary-card card">
      <div className="summary-card-header">
        <p className="summary-card-title">{title}</p>
      </div>
      <div className="summary-rows">
        {rows.map((row) => (
          <div key={`${title}-${row.label}`} className="summary-row">
            <span className="summary-label">{row.label}</span>
            <span className={`summary-value${row.pending ? ' summary-value-muted' : ''}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </article>
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
      const starterProfile = createStarterProfile(result)
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
          <p className="page-subtitle">Search an address to view map and Risk Summary results.</p>
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
              {property ? (
                <h2 className="property-map-title">{property.query}</h2>
              ) : null}
            </div>
            {property ? (
              <p className="property-map-note">Visual location reference.</p>
            ) : null}
          </div>

          <div className="property-map-frame">
            {property ? (
              <>
                <iframe
                  className="property-map-embed"
                  title={`Map for ${property.query}`}
                  src={googleEmbedSrc}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </>
            ) : (
              <div className="property-map-placeholder">Search address to load the map.</div>
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
                </div>
              </div>

              <div className="summary-stack">
                {property.summaryCards.map((card) => (
                  <SummaryCard key={card.title} title={card.title} rows={card.rows} />
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
              </div>

              <div className="summary-stack">
                {EMPTY_SUMMARY_CARDS.map((card) => (
                  <SummaryCard key={card.title} title={card.title} rows={card.rows} />
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
