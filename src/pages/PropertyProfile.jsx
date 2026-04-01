import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useActiveHome } from '../context/HomeContext'
import AlertTicker from '../components/AlertTicker'
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
    title: 'Property Information',
    rows: EMPTY_DETAIL_ROWS,
  },
  {
    title: 'Zoning / Future Use',
    rows: [
      { label: 'Zoning code', value: '\u2014', pending: true },
      { label: 'Land use', value: '\u2014', pending: true },
      { label: 'Future use / corridor', value: '\u2014', pending: true },
    ],
  },
  {
    title: 'Soil & Geology',
    rows: [
      { label: 'USDA soil survey', value: '\u2014', pending: true },
      { label: 'EPA radon zone', value: '\u2014', pending: true },
      { label: 'Karst / sinkhole', value: '\u2014', pending: true },
    ],
  },
  {
    title: 'Water / Drainage',
    rows: [
      { label: 'FEMA flood zone', value: '\u2014', pending: true },
      { label: 'Drainage / low basin', value: '\u2014', pending: true },
      { label: 'Water table / wetlands', value: '\u2014', pending: true },
    ],
  },
  {
    title: 'Wildfire / Vegetation',
    rows: [
      { label: 'Wildfire community map', value: '\u2014', pending: true },
      { label: 'Defensible space review', value: '\u2014', pending: true },
      { label: 'Brush / canopy check', value: '\u2014', pending: true },
    ],
  },
  {
    title: 'Response / Area Claims',
    rows: [
      { label: 'Fire response class', value: '\u2014', pending: true },
      { label: 'Hydrant / station review', value: '\u2014', pending: true },
      { label: 'Area claim pressure', value: '\u2014', pending: true },
    ],
  },
]

const SUMMARY_CARD_ORDER = [
  'Property Information',
  'Zoning / Future Use',
  'Soil & Geology',
  'Water / Drainage',
  'Wildfire / Vegetation',
  'Response / Area Claims',
]

const PENDING_SUMMARY_HINT = 'Search address to see Risk Summary'

function orderSummaryCards(cards) {
  return [...cards].sort(
    (left, right) => SUMMARY_CARD_ORDER.indexOf(left.title) - SUMMARY_CARD_ORDER.indexOf(right.title),
  )
}

function PendingSummaryInfo() {
  const [open, setOpen] = useState(false)

  return (
    <span className={`summary-label-info-wrap${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="summary-label-info"
        aria-label={PENDING_SUMMARY_HINT}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onBlur={() => setOpen(false)}
      >
        i
      </button>
      <span className="summary-label-tooltip" role="tooltip">
        Search address to
        <br />
        see Risk Summary
      </span>
    </span>
  )
}

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
  return {
    summaryCards: [
      {
        title: 'Property Information',
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
        title: 'Soil & Geology',
        rows: [
          { label: 'USDA soil survey', value: 'Pending USDA source', pending: true },
          { label: 'EPA radon zone', value: 'Pending EPA source', pending: true },
          { label: 'Karst / sinkhole', value: 'Pending geology source', pending: true },
        ],
      },
      {
        title: 'Water / Drainage',
        rows: [
          { label: 'FEMA flood zone', value: 'Pending FEMA source', pending: true },
          { label: 'Drainage / low basin', value: 'Pending topography source', pending: true },
          { label: 'Water table / wetlands', value: 'Pending wetlands source', pending: true },
        ],
      },
      {
        title: 'Wildfire / Vegetation',
        rows: [
          { label: 'Wildfire community map', value: 'Pending wildfire source', pending: true },
          { label: 'Defensible space review', value: 'Pending vegetation source', pending: true },
          { label: 'Brush / canopy check', value: 'Pending vegetation source', pending: true },
        ],
      },
      {
        title: 'Response / Area Claims',
        rows: [
          { label: 'Fire response class', value: 'Pending local source', pending: true },
          { label: 'Hydrant / station review', value: 'Pending local source', pending: true },
          { label: 'Area claim pressure', value: 'Pending claims source', pending: true },
        ],
      },
      {
        title: 'Zoning / Future Use',
        rows: [
          { label: 'Zoning code', value: 'Pending local source', pending: true },
          { label: 'Land use', value: 'Pending local source', pending: true },
          { label: 'Future use / corridor', value: 'Pending local source', pending: true },
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

async function lookupProperty(query, signal) {
  const result = await geocodeAddress(query, signal)
  const starterProfile = createStarterProfile(result)

  return {
    ...result,
    ...starterProfile,
    query,
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
            <span className="summary-label-wrap">
              <span className="summary-label">{row.label}</span>
              {row.pending ? (
                <PendingSummaryInfo />
              ) : null}
            </span>
            <span className={`summary-value${row.pending ? ' summary-value-muted' : ''}`}>
              {row.pending ? '--' : row.value}
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
  const location = useLocation()
  const [query, setQuery] = useState(activeHome?.query || '')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [property, setProperty] = useState(activeHome)
  const requestRef = useRef(null)
  const autoSearchRef = useRef('')

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

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const prefilledQuery = (
      location.state?.initialQuery ||
      searchParams.get('address') ||
      ''
    ).trim()

    if (!prefilledQuery || autoSearchRef.current === prefilledQuery) {
      return
    }

    if (property?.query === prefilledQuery) {
      setQuery(prefilledQuery)
      autoSearchRef.current = prefilledQuery
      return
    }

    if (requestRef.current) {
      requestRef.current.abort()
    }

    const controller = new AbortController()
    requestRef.current = controller
    autoSearchRef.current = prefilledQuery
    setQuery(prefilledQuery)
    setStatus('loading')
    setError('')

    ;(async () => {
      try {
        const nextProperty = await lookupProperty(prefilledQuery, controller.signal)
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
    })()
  }, [location.search, location.state, property?.query, saveActiveHome])

  const googleEmbedSrc = getGoogleEmbedSrc(property)
  const orderedSummaryCards = orderSummaryCards(property?.summaryCards || EMPTY_SUMMARY_CARDS)
  const topSummaryCards = orderedSummaryCards.slice(0, 2)
  const remainingSummaryCards = orderedSummaryCards.slice(2)

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
      const nextProperty = await lookupProperty(trimmedQuery, controller.signal)
      setProperty(nextProperty)
      saveActiveHome(nextProperty)
      autoSearchRef.current = trimmedQuery
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
    autoSearchRef.current = ''
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
          placeholder="Enter address"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button className="btn-primary property-search-button" type="submit">
          {status === 'loading' ? 'Searching...' : 'Search'}
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
        <section className="property-summary card">
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
                {topSummaryCards.map((card) => (
                  <SummaryCard
                    key={card.title}
                    title={card.title}
                    rows={card.rows}
                  />
                ))}
                <div className="summary-alert-row">
                  <AlertTicker />
                </div>
                {remainingSummaryCards.map((card) => (
                  <SummaryCard
                    key={card.title}
                    title={card.title}
                    rows={card.rows}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="property-empty-state">
              <div className="property-sidebar-section">
                <p className="property-sidebar-kicker">Risk Summary</p>
              </div>

              <div className="summary-stack">
                {topSummaryCards.map((card) => (
                  <SummaryCard key={card.title} title={card.title} rows={card.rows} />
                ))}
                <div className="summary-alert-row">
                  <AlertTicker />
                </div>
                {remainingSummaryCards.map((card) => (
                  <SummaryCard key={card.title} title={card.title} rows={card.rows} />
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="property-map-card card">
          <div className="property-map-toolbar">
            <div>
              <p className="property-map-kicker">Map</p>
              {property ? (
                <h2 className="property-map-title">{property.query}</h2>
              ) : null}
            </div>
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
              <div className="property-map-placeholder">Search address to load the map.</div>
            )}
          </div>

          <form className="property-searchbar property-searchbar-secondary" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="property-address-search-secondary">
              Property address
            </label>
            <input
              id="property-address-search-secondary"
              className="property-search-input"
              type="text"
              placeholder="Enter address"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button className="btn-primary property-search-button" type="submit">
              {status === 'loading' ? 'Searching...' : 'Search'}
            </button>
            <button
              className="btn-outline property-search-button"
              type="button"
              onClick={resetSearch}
              disabled={!query && !property}
            >
              Reset
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}

export default PropertyProfile
