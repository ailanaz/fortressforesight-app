import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useActiveHome } from '../context/HomeContext'
import AlertTicker from '../components/AlertTicker'
import './Page.css'
import './PropertyProfile.css'

const GOOGLE_MAPS_EMBED_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
const FEMA_FLOOD_ZONE_QUERY_URL = 'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query'

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
      { label: 'Zoning code', value: '\u2014', pending: true, source: { label: 'Local / State' } },
      { label: 'Land use', value: '\u2014', pending: true, source: { label: 'Local / State' } },
      { label: 'Future use / corridor', value: '\u2014', pending: true, source: { label: 'Local / State' } },
    ],
  },
  {
    title: 'Land and Water Conditions',
    rows: [
      {
        label: 'USDA soil survey',
        value: '\u2014',
        pending: true,
        source: { label: 'USDA', href: 'https://www.nrcs.usda.gov/resources/data-and-reports/web-soil-survey' },
      },
      {
        label: 'EPA radon zone',
        value: '\u2014',
        pending: true,
        source: { label: 'EPA', href: 'https://www.epa.gov/radon/epa-map-radon-zones-and-supplemental-information-0' },
      },
      {
        label: 'Karst / sinkhole',
        value: '\u2014',
        pending: true,
        source: { label: 'USGS', href: 'https://pubs.usgs.gov/sir/2008/5023/pdf/SIR2008-5023.pdf' },
      },
      {
        label: 'FEMA flood zone',
        value: '\u2014',
        pending: true,
        source: { label: 'FEMA', href: 'https://msc.fema.gov/portal/search' },
      },
      {
        label: 'Drainage / low basin',
        value: '\u2014',
        pending: true,
        source: { label: 'USGS', href: 'https://www.usgs.gov/faqs/how-do-i-find-download-a-topographic-map' },
      },
      {
        label: 'Water table / wetlands',
        value: '\u2014',
        pending: true,
        source: { label: 'EPA', href: 'https://www.epa.gov/wetlands/wetlands-monitoring-and-assessment' },
      },
    ],
  },
  {
    title: 'Area Response Context',
    rows: [
      {
        label: 'Fire response class',
        value: '\u2014',
        pending: true,
        source: { label: 'FEMA', href: 'https://hazards.fema.gov/nri/' },
      },
      { label: 'Hydrant / station review', value: '\u2014', pending: true, source: { label: 'Local / State' } },
      { label: 'Area claim pressure', value: '\u2014', pending: true, source: { label: 'Local / State' } },
    ],
  },
]

const SUMMARY_CARD_ORDER = [
  'Property Information',
  'Zoning / Future Use',
  'Land and Water Conditions',
  'Area Response Context',
]

const PENDING_SUMMARY_HINT = 'Search address to see Risk Summary'

const STATE_NAME_TO_CODE = Object.freeze({
  alabama: 'AL',
  alaska: 'AK',
  arizona: 'AZ',
  arkansas: 'AR',
  california: 'CA',
  colorado: 'CO',
  connecticut: 'CT',
  delaware: 'DE',
  florida: 'FL',
  georgia: 'GA',
  hawaii: 'HI',
  idaho: 'ID',
  illinois: 'IL',
  indiana: 'IN',
  iowa: 'IA',
  kansas: 'KS',
  kentucky: 'KY',
  louisiana: 'LA',
  maine: 'ME',
  maryland: 'MD',
  massachusetts: 'MA',
  michigan: 'MI',
  minnesota: 'MN',
  mississippi: 'MS',
  missouri: 'MO',
  montana: 'MT',
  nebraska: 'NE',
  nevada: 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  ohio: 'OH',
  oklahoma: 'OK',
  oregon: 'OR',
  pennsylvania: 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  tennessee: 'TN',
  texas: 'TX',
  utah: 'UT',
  vermont: 'VT',
  virginia: 'VA',
  washington: 'WA',
  'west virginia': 'WV',
  wisconsin: 'WI',
  wyoming: 'WY',
  'district of columbia': 'DC',
})

const FLOOD_PRIMARY_STATES = new Set(['AL', 'AR', 'CA', 'CT', 'DE', 'FL', 'GA', 'HI', 'IA', 'IL', 'KY', 'LA', 'MA', 'MD', 'ME', 'MO', 'MS', 'NC', 'NH', 'NJ', 'NY', 'OH', 'OR', 'PA', 'RI', 'SC', 'TN', 'TX', 'VA', 'VT', 'WA', 'WV'])
const STORM_WIND_PRIMARY_STATES = new Set(['AL', 'AR', 'CT', 'DE', 'FL', 'GA', 'HI', 'IA', 'IL', 'IN', 'KS', 'KY', 'LA', 'MA', 'MD', 'MI', 'MN', 'MO', 'MS', 'NC', 'ND', 'NE', 'NJ', 'NY', 'OH', 'OK', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'VA', 'WI'])
const HAIL_PRIMARY_STATES = new Set(['CO', 'IA', 'IL', 'IN', 'KS', 'MN', 'MO', 'MT', 'ND', 'NE', 'NM', 'OK', 'SD', 'TX', 'WY'])
const HAIL_SEASONAL_STATES = new Set(['AR', 'KY', 'OH', 'PA', 'TN'])
const WILDFIRE_PRIMARY_STATES = new Set(['AZ', 'CA', 'CO', 'HI', 'ID', 'MT', 'NM', 'NV', 'OR', 'TX', 'UT', 'WA', 'WY'])
const WILDFIRE_SEASONAL_STATES = new Set(['FL', 'GA', 'NC', 'OK', 'SC'])
const FREEZE_PRIMARY_STATES = new Set(['AK', 'CO', 'CT', 'IA', 'ID', 'IL', 'IN', 'KS', 'MA', 'MD', 'ME', 'MI', 'MN', 'MO', 'MT', 'ND', 'NE', 'NH', 'NJ', 'NM', 'NY', 'OH', 'OK', 'PA', 'RI', 'SD', 'TX', 'UT', 'VT', 'WI', 'WV', 'WY'])
const FREEZE_SEASONAL_STATES = new Set(['AZ', 'CA', 'KY', 'NC', 'NV', 'OR', 'TN', 'VA', 'WA'])
const EARTHQUAKE_PRIMARY_STATES = new Set(['AK', 'AR', 'AZ', 'CA', 'CO', 'HI', 'ID', 'KY', 'MO', 'MT', 'NM', 'NV', 'OK', 'OR', 'SC', 'TN', 'UT', 'WA', 'WY'])
const EARTHQUAKE_SEASONAL_STATES = new Set(['IL', 'MS', 'NC', 'VA'])

const HAZARD_DEFINITIONS = [
  {
    id: 'flood',
    title: 'Flood',
    primaryStates: FLOOD_PRIMARY_STATES,
    showEverywhere: true,
    copy: 'Drainage, lower-level water entry, and recovery planning may need closer review.',
    limitedCopy: 'Not a primary area concern here, but drainage and lower-level water entry can still vary by lot.',
    source: { label: 'FEMA', href: 'https://msc.fema.gov/portal/search' },
  },
  {
    id: 'storm-wind',
    title: 'Storm / Wind',
    primaryStates: STORM_WIND_PRIMARY_STATES,
    showEverywhere: true,
    copy: 'Roofing, windows, exterior materials, and nearby tree exposure may need closer review.',
    limitedCopy: 'Not a primary area concern here, but roofing, windows, and tree exposure can still vary by site.',
    source: { label: 'NOAA', href: 'https://www.weather.gov/' },
  },
  {
    id: 'hail',
    title: 'Hail',
    primaryStates: HAIL_PRIMARY_STATES,
    seasonalStates: HAIL_SEASONAL_STATES,
    copy: 'Shingles, gutters, skylights, and siding may be more exposed to damage.',
    limitedCopy: 'Not commonly associated with this location, but exterior materials and glass may still vary by site.',
    source: { label: 'NOAA', href: 'https://www.spc.noaa.gov/' },
  },
  {
    id: 'wildfire',
    title: 'Wildfire',
    primaryStates: WILDFIRE_PRIMARY_STATES,
    seasonalStates: WILDFIRE_SEASONAL_STATES,
    copy: 'Defensible space, vents, roofing materials, and exterior vulnerability may need closer review.',
    limitedCopy: 'Not a primary area concern here, but vegetation and exterior materials can still shape exposure.',
    source: { label: 'USFS', href: 'https://www.fs.usda.gov/' },
  },
  {
    id: 'freeze',
    title: 'Freeze',
    primaryStates: FREEZE_PRIMARY_STATES,
    seasonalStates: FREEZE_SEASONAL_STATES,
    copy: 'Exposed pipes, drainage, and seasonal protection points may need closer review.',
    limitedCopy: 'Not commonly associated with this location, but exposed pipes and seasonal protection points can still vary by property.',
    source: { label: 'NOAA', href: 'https://www.weather.gov/' },
  },
  {
    id: 'earthquake',
    title: 'Earthquake',
    primaryStates: EARTHQUAKE_PRIMARY_STATES,
    seasonalStates: EARTHQUAKE_SEASONAL_STATES,
    copy: 'Masonry, structural connections, water heater bracing, and shutoff access may need closer review.',
    limitedCopy: 'Not a primary area concern here, but masonry and heavy mounted items may still be worth noting by property.',
    source: { label: 'USGS', href: 'https://earthquake.usgs.gov/' },
  },
]

function normalizeStateCode(state) {
  if (!state) {
    return ''
  }

  const trimmed = state.trim()

  if (!trimmed) {
    return ''
  }

  const upper = trimmed.toUpperCase()

  if (upper.length === 2) {
    return upper
  }

  return STATE_NAME_TO_CODE[trimmed.toLowerCase()] || ''
}

function getHazardLevel(definition, stateCode) {
  if (!stateCode) {
    return 'omit'
  }

  if (definition.primaryStates?.has(stateCode)) {
    return 'primary'
  }

  if (definition.seasonalStates?.has(stateCode) || definition.showEverywhere) {
    return 'seasonal'
  }

  if (definition.limitedStates?.has(stateCode)) {
    return 'limited'
  }

  return 'omit'
}

function getHazardStatus(level) {
  if (level === 'primary') {
    return 'Area-based relevance noted'
  }

  if (level === 'seasonal') {
    return 'May be relevant in this area'
  }

  return 'Limited area relevance'
}

function buildLocalHazards(property) {
  const stateCode = normalizeStateCode(property?.address?.state)

  if (!stateCode) {
    return []
  }

  const evaluated = HAZARD_DEFINITIONS
    .map((definition) => {
      const level = getHazardLevel(definition, stateCode)

      if (level === 'omit') {
        return null
      }

      return {
        id: definition.id,
        title: definition.title,
        level,
        status: getHazardStatus(level),
        copy: level === 'limited' ? definition.limitedCopy : definition.copy,
        source: definition.source,
      }
    })
    .filter(Boolean)

  const relevantHazards = evaluated.filter((item) => item.level === 'primary' || item.level === 'seasonal')
  const limitedHazards = evaluated.filter((item) => item.level === 'limited')

  return [...relevantHazards, ...limitedHazards].slice(0, Math.max(3, relevantHazards.length))
}

function orderSummaryCards(cards) {
  return [...cards].sort(
    (left, right) => SUMMARY_CARD_ORDER.indexOf(left.title) - SUMMARY_CARD_ORDER.indexOf(right.title),
  )
}

function mergeCardRows(...cards) {
  return cards.flatMap((card) => card?.rows || [])
}

function normalizeSummaryCards(cards) {
  if (!Array.isArray(cards) || !cards.length) {
    return EMPTY_SUMMARY_CARDS
  }

  const propertyInformationCard = cards.find((card) => card.title === 'Property Information')
  const zoningCard = cards.find((card) => card.title === 'Zoning / Future Use')
  const existingLandAndWaterCard = cards.find((card) => card.title === 'Land and Water Conditions')
  const existingAreaResponseCard = cards.find((card) => card.title === 'Area Response Context')
  const soilCard = cards.find((card) => card.title === 'Soil & Geology')
  const waterCard = cards.find((card) => card.title === 'Water / Drainage')
  const responseCard = cards.find((card) => card.title === 'Response / Area Claims')

  return [
    propertyInformationCard || EMPTY_SUMMARY_CARDS[0],
    zoningCard || EMPTY_SUMMARY_CARDS[1],
    existingLandAndWaterCard || {
      title: 'Land and Water Conditions',
      rows: mergeCardRows(soilCard, waterCard).length
        ? mergeCardRows(soilCard, waterCard)
        : EMPTY_SUMMARY_CARDS[2].rows,
    },
    existingAreaResponseCard || {
      title: 'Area Response Context',
      rows: responseCard?.rows?.length ? responseCard.rows : EMPTY_SUMMARY_CARDS[3].rows,
    },
  ]
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

function getStreetLine(result) {
  const address = result?.address ?? {}
  const streetLine = [
    address.street_line,
    [address.house_number, address.road].filter(Boolean).join(' ').trim(),
  ]
    .filter(Boolean)[0]
    ?.trim()

  if (streetLine) {
    return streetLine
  }

  const queryFirstLine = result?.query?.split(',')[0]?.trim()

  if (queryFirstLine) {
    return queryFirstLine
  }

  const displayFirstLine = result?.displayName?.split(',')[0]?.trim()

  return displayFirstLine || 'Not available yet'
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
          { label: 'Address', value: getStreetLine(result) },
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
        title: 'Land and Water Conditions',
        rows: [
          {
            label: 'USDA soil survey',
            value: 'Pending USDA source',
            pending: true,
            source: { label: 'USDA', href: 'https://www.nrcs.usda.gov/resources/data-and-reports/web-soil-survey' },
          },
          {
            label: 'EPA radon zone',
            value: 'Pending EPA source',
            pending: true,
            source: { label: 'EPA', href: 'https://www.epa.gov/radon/epa-map-radon-zones-and-supplemental-information-0' },
          },
          {
            label: 'Karst / sinkhole',
            value: 'Pending geology source',
            pending: true,
            source: { label: 'USGS', href: 'https://pubs.usgs.gov/sir/2008/5023/pdf/SIR2008-5023.pdf' },
          },
          {
            label: 'FEMA flood zone',
            value: 'Pending FEMA source',
            pending: true,
            source: { label: 'FEMA', href: 'https://msc.fema.gov/portal/search' },
          },
          {
            label: 'Drainage / low basin',
            value: 'Pending topography source',
            pending: true,
            source: { label: 'USGS', href: 'https://www.usgs.gov/faqs/how-do-i-find-download-a-topographic-map' },
          },
          {
            label: 'Water table / wetlands',
            value: 'Pending wetlands source',
            pending: true,
            source: { label: 'EPA', href: 'https://www.epa.gov/wetlands/wetlands-monitoring-and-assessment' },
          },
        ],
      },
      {
        title: 'Area Response Context',
        rows: [
          {
        label: 'Fire response class',
        value: 'Pending local source',
        pending: true,
        source: { label: 'FEMA', href: 'https://hazards.fema.gov/nri/' },
      },
      { label: 'Hydrant / station review', value: 'Pending local source', pending: true, source: { label: 'Local / State' } },
      { label: 'Area claim pressure', value: 'Pending claims source', pending: true, source: { label: 'Local / State' } },
    ],
      },
      {
        title: 'Zoning / Future Use',
        rows: [
          { label: 'Zoning code', value: 'Pending local source', pending: true, source: { label: 'Local / State' } },
          { label: 'Land use', value: 'Pending local source', pending: true, source: { label: 'Local / State' } },
          { label: 'Future use / corridor', value: 'Pending local source', pending: true, source: { label: 'Local / State' } },
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

function formatFemaZoneLabel(attributes) {
  const zone = attributes?.FLD_ZONE?.trim()
  const subtype = attributes?.ZONE_SUBTY?.trim()
  const base = [zone ? `Zone ${zone}` : '', subtype].filter(Boolean).join(' ').trim()

  if (!base) {
    return 'Mapped in FEMA layer'
  }

  if (attributes?.SFHA_TF === 'T') {
    return `${base} (SFHA)`
  }

  return base
}

async function fetchFemaFloodZone(result, signal) {
  if (!Number.isFinite(result?.lat) || !Number.isFinite(result?.lon)) {
    return null
  }

  const params = new URLSearchParams({
    f: 'json',
    geometryType: 'esriGeometryPoint',
    geometry: JSON.stringify({
      x: Number(result.lon),
      y: Number(result.lat),
      spatialReference: { wkid: 4326 },
    }),
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    returnGeometry: 'false',
    outFields: 'FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE,DEPTH',
  })

  const response = await fetch(`${FEMA_FLOOD_ZONE_QUERY_URL}?${params.toString()}`, {
    signal,
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('FEMA flood lookup failed.')
  }

  const payload = await response.json()
  const features = Array.isArray(payload?.features) ? payload.features : []
  const match = features.find((feature) => feature?.attributes?.FLD_ZONE) || features[0]

  if (!match?.attributes) {
    return {
      value: 'No FEMA zone returned',
      pending: false,
    }
  }

  return {
    value: formatFemaZoneLabel(match.attributes),
    pending: false,
  }
}

function applyFemaFloodZone(summaryCards, floodZone) {
  if (!Array.isArray(summaryCards) || !floodZone) {
    return summaryCards
  }

  return summaryCards.map((card) => {
    if (card.title !== 'Land and Water Conditions') {
      return card
    }

    return {
      ...card,
      rows: card.rows.map((row) => (
        row.label === 'FEMA flood zone'
          ? {
              ...row,
              ...floodZone,
            }
          : row
      )),
    }
  })
}

function needsFemaFloodZone(summaryCards) {
  const landAndWaterCard = Array.isArray(summaryCards)
    ? summaryCards.find((card) => card.title === 'Land and Water Conditions')
    : null
  const floodRow = landAndWaterCard?.rows?.find((row) => row.label === 'FEMA flood zone')

  if (!floodRow) {
    return false
  }

  return floodRow.pending || !floodRow.value || floodRow.value === '—'
}

async function enrichPropertyWithFema(property, signal) {
  if (!property || !needsFemaFloodZone(property.summaryCards)) {
    return property
  }

  try {
    const floodZone = await fetchFemaFloodZone(property, signal)

    if (!floodZone) {
      return property
    }

    return {
      ...property,
      summaryCards: applyFemaFloodZone(property.summaryCards, floodZone),
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error
    }

    return property
  }
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
  const property = {
    ...result,
    ...starterProfile,
    query,
  }

  return enrichPropertyWithFema(property, signal)
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
            {row.source ? (
              row.source.href ? (
                <a
                  className="summary-row-link"
                  href={row.source.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {row.source.label}
                </a>
              ) : (
                <span className="summary-row-source">{row.source.label}</span>
              )
            ) : null}
          </div>
        ))}
      </div>
    </article>
  )
}

function LocalHazardConsiderations({ hazards, hasProperty }) {
  return (
    <article className="summary-card card local-hazards-card">
      <div className="summary-card-header local-hazards-header">
        <div>
          <p className="summary-card-title">Local Hazard Considerations</p>
          <p className="local-hazards-intro">
            Area-based hazard context that may affect preparedness, maintenance, and recovery for this property.
          </p>
        </div>
      </div>

      {hasProperty && hazards.length ? (
        <div className="local-hazards-grid">
          {hazards.map((hazard) => (
            <div key={hazard.id} className="local-hazard-item">
              <p className="local-hazard-title">{hazard.title}</p>
              <p className={`local-hazard-status local-hazard-status-${hazard.level}`}>{hazard.status}</p>
              <p className="local-hazard-copy">{hazard.copy}</p>
              {hazard.source ? (
                <a
                  className="local-hazard-source"
                  href={hazard.source.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {hazard.source.label}
                </a>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="local-hazards-empty">Search an address to see area-based hazard context.</p>
      )}
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
  const femaBackfillRef = useRef(null)

  useEffect(() => {
    return () => {
      if (requestRef.current) {
        requestRef.current.abort()
      }

      if (femaBackfillRef.current) {
        femaBackfillRef.current.abort()
      }
    }
  }, [])

  useEffect(() => {
    setProperty(activeHome ?? null)
    setQuery((currentValue) => currentValue || activeHome?.query || '')
  }, [activeHome])

  useEffect(() => {
    if (!property || !needsFemaFloodZone(property.summaryCards)) {
      return
    }

    if (femaBackfillRef.current) {
      femaBackfillRef.current.abort()
    }

    const controller = new AbortController()
    femaBackfillRef.current = controller

    ;(async () => {
      try {
        const nextProperty = await enrichPropertyWithFema(property, controller.signal)

        if (!controller.signal.aborted && nextProperty !== property) {
          setProperty(nextProperty)
          saveActiveHome(nextProperty)
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          // Ignore background FEMA backfill errors and leave the existing placeholder in place.
        }
      } finally {
        if (femaBackfillRef.current === controller) {
          femaBackfillRef.current = null
        }
      }
    })()

    return () => {
      controller.abort()
    }
  }, [property, saveActiveHome])

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
  const orderedSummaryCards = orderSummaryCards(normalizeSummaryCards(property?.summaryCards))
  const propertyInformationCard = orderedSummaryCards.find((card) => card.title === 'Property Information')
  const zoningCard = orderedSummaryCards.find((card) => card.title === 'Zoning / Future Use')
  const landAndWaterCard = orderedSummaryCards.find((card) => card.title === 'Land and Water Conditions')
  const areaResponseCard = orderedSummaryCards.find((card) => card.title === 'Area Response Context')
  const localHazards = buildLocalHazards(property)

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
        <section className="property-summary">
          {property ? (
            <>
              <div className="property-sidebar-section">
                <p className="property-sidebar-kicker">Risk Summary</p>
              </div>

              <div className="summary-top-row">
                {propertyInformationCard ? (
                  <SummaryCard
                    key={propertyInformationCard.title}
                    title={propertyInformationCard.title}
                    rows={propertyInformationCard.rows}
                  />
                ) : null}
                <article className="summary-map-card card">
                  <div className="property-map-frame">
                    <iframe
                      className="property-map-embed"
                      title={property ? `Map for ${property.query}` : 'Property map'}
                      src={googleEmbedSrc}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen
                    />
                  </div>
                </article>
                {zoningCard ? (
                  <SummaryCard
                    key={zoningCard.title}
                    title={zoningCard.title}
                    rows={zoningCard.rows}
                  />
                ) : null}
              </div>

              <div className="summary-stack">
                <div className="summary-alert-row">
                  <AlertTicker />
                </div>
                <div className="summary-context-row">
                  <LocalHazardConsiderations hazards={localHazards} hasProperty />
                  {landAndWaterCard ? (
                    <SummaryCard
                      key={landAndWaterCard.title}
                      title={landAndWaterCard.title}
                      rows={landAndWaterCard.rows}
                    />
                  ) : null}
                  {areaResponseCard ? (
                    <SummaryCard
                      key={areaResponseCard.title}
                      title={areaResponseCard.title}
                      rows={areaResponseCard.rows}
                    />
                  ) : null}
                </div>
              </div>
            </>
          ) : (
            <div className="property-empty-state">
              <div className="property-sidebar-section">
                <p className="property-sidebar-kicker">Risk Summary</p>
              </div>

              <div className="summary-top-row">
                {propertyInformationCard ? (
                  <SummaryCard
                    key={propertyInformationCard.title}
                    title={propertyInformationCard.title}
                    rows={propertyInformationCard.rows}
                  />
                ) : null}
                <article className="summary-map-card card">
                  <div className="property-map-frame">
                    <div className="property-map-placeholder">Search address to load the map.</div>
                  </div>
                </article>
                {zoningCard ? (
                  <SummaryCard key={zoningCard.title} title={zoningCard.title} rows={zoningCard.rows} />
                ) : null}
              </div>

              <div className="summary-stack">
                <div className="summary-alert-row">
                  <AlertTicker />
                </div>
                <div className="summary-context-row">
                  <LocalHazardConsiderations hazards={[]} hasProperty={false} />
                  {landAndWaterCard ? (
                    <SummaryCard key={landAndWaterCard.title} title={landAndWaterCard.title} rows={landAndWaterCard.rows} />
                  ) : null}
                  {areaResponseCard ? (
                    <SummaryCard key={areaResponseCard.title} title={areaResponseCard.title} rows={areaResponseCard.rows} />
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </section>

        <form className="property-searchbar property-searchbar-secondary property-searchbar-bottom" onSubmit={handleSubmit}>
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
      </div>
    </div>
  )
}

export default PropertyProfile
