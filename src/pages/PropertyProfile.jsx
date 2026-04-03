import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useActiveHome } from '../context/HomeContext'
import AlertTicker from '../components/AlertTicker'
import './Page.css'
import './PropertyProfile.css'

const GOOGLE_MAPS_EMBED_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
const FEMA_FLOOD_ZONE_QUERY_URL = 'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query'
const NOAA_POINTS_API_URL = 'https://api.weather.gov/points'
const NOAA_ALERTS_API_URL = 'https://api.weather.gov/alerts/active'

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
      { label: 'NOAA active alerts', value: '\u2014', pending: true, source: { label: 'NOAA', href: 'https://www.weather.gov/' } },
      { label: 'NWS forecast office', value: '\u2014', pending: true, source: { label: 'NOAA', href: 'https://www.weather.gov/' } },
      { label: 'USFS wildfire context', value: '\u2014', pending: true, source: { label: 'USFS', href: 'https://www.fs.usda.gov/' } },
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
    return 'Primary area relevance'
  }

  if (level === 'seasonal') {
    return 'Seasonal area relevance'
  }

  return 'Limited area relevance'
}

function getUsfsWildfireStatus(stateCode) {
  const wildfireDefinition = HAZARD_DEFINITIONS.find((definition) => definition.id === 'wildfire')

  if (!wildfireDefinition || !stateCode) {
    return 'Limited area relevance'
  }

  return getHazardStatus(getHazardLevel(wildfireDefinition, stateCode))
}

function getHazardResultValue(hazardId, property, level) {
  const summaryCards = normalizeSummaryCards(property?.summaryCards)
  const landAndWaterCard = summaryCards.find((card) => card.title === 'Land and Water Conditions')
  const areaResponseCard = summaryCards.find((card) => card.title === 'Area Response Context')

  if (hazardId === 'flood') {
    return landAndWaterCard?.rows?.find((row) => row.label === 'FEMA flood zone')?.value || 'Not returned'
  }

  if (hazardId === 'storm-wind') {
    return getHazardStatus(level)
  }

  if (hazardId === 'wildfire') {
    return areaResponseCard?.rows?.find((row) => row.label === 'USFS wildfire context')?.value || 'Not returned'
  }

  if (hazardId === 'earthquake') {
    return getHazardStatus(level)
  }

  return 'Not returned'
}

function buildLocalHazards(property) {
  const stateCode = normalizeStateCode(property?.address?.state)

  if (!stateCode) {
    return []
  }

  const evaluated = HAZARD_DEFINITIONS
    .filter((definition) => ['flood', 'storm-wind', 'wildfire', 'earthquake'].includes(definition.id))
    .map((definition) => {
      const rawLevel = getHazardLevel(definition, stateCode)
      const level = rawLevel === 'omit' ? 'limited' : rawLevel

      return {
        id: definition.id,
        title: definition.title,
        level,
        copy: level === 'limited' ? definition.limitedCopy : definition.copy,
        resultValue: getHazardResultValue(definition.id, property, level),
        source: definition.source,
      }
    })

  return evaluated
}

function orderSummaryCards(cards) {
  return [...cards].sort(
    (left, right) => SUMMARY_CARD_ORDER.indexOf(left.title) - SUMMARY_CARD_ORDER.indexOf(right.title),
  )
}

function mergeCardRows(...cards) {
  return cards.flatMap((card) => card?.rows || [])
}

function getAreaResponseRowByLabel(rows, label) {
  return rows?.find((row) => row.label === label) || null
}

function normalizeAreaResponseRows(rows) {
  return [
    getAreaResponseRowByLabel(rows, 'NOAA active alerts') || EMPTY_SUMMARY_CARDS[3].rows[0],
    getAreaResponseRowByLabel(rows, 'NWS forecast office') || EMPTY_SUMMARY_CARDS[3].rows[1],
    getAreaResponseRowByLabel(rows, 'USFS wildfire context') || EMPTY_SUMMARY_CARDS[3].rows[2],
  ]
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
      rows: responseCard?.rows?.length ? normalizeAreaResponseRows(responseCard.rows) : EMPTY_SUMMARY_CARDS[3].rows,
    },
  ]
    .map((card) => (
      card.title === 'Area Response Context'
        ? {
            ...card,
            rows: normalizeAreaResponseRows(card.rows),
          }
        : card
    ))
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

function getQueryStreetLine(query) {
  return query?.split(',')[0]?.trim() || ''
}

function getStreetLine(result, preferredStreetLine = '') {
  const address = result?.address ?? {}
  const streetLine = [
    preferredStreetLine,
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

function createStarterProfile(result, query = '') {
  const preferredStreetLine = getQueryStreetLine(query)

  return {
    summaryCards: [
      {
        title: 'Property Information',
        rows: [
          { label: 'Address', value: getStreetLine(result, preferredStreetLine) },
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
            label: 'NOAA active alerts',
            value: 'Pending NOAA source',
            pending: true,
            source: { label: 'NOAA', href: 'https://www.weather.gov/' },
          },
          {
            label: 'NWS forecast office',
            value: 'Pending NOAA source',
            pending: true,
            source: { label: 'NOAA', href: 'https://www.weather.gov/' },
          },
          {
            label: 'USFS wildfire context',
            value: 'Pending USFS source',
            pending: true,
            source: { label: 'USFS', href: 'https://www.fs.usda.gov/' },
          },
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

function applyPreferredStreetLine(property) {
  if (!property) {
    return property
  }

  const preferredStreetLine = getQueryStreetLine(property.query)

  if (!preferredStreetLine) {
    return property
  }

  return {
    ...property,
    address: {
      ...(property.address || {}),
      street_line: preferredStreetLine,
    },
    summaryCards: normalizeSummaryCards(property.summaryCards).map((card) => (
      card.title === 'Property Information'
        ? {
            ...card,
            rows: card.rows.map((row) => (
              row.label === 'Address'
                ? { ...row, value: preferredStreetLine }
                : row
            )),
          }
        : card
    )),
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

function getNoaaAlertLabel(features) {
  const events = features
    .map((feature) => feature?.properties?.event?.trim())
    .filter(Boolean)

  if (!events.length) {
    return 'None active at time of lookup'
  }

  if (events.length === 1) {
    return events[0]
  }

  return `${events.length} active alerts`
}

async function fetchNoaaContext(result, signal) {
  if (!Number.isFinite(result?.lat) || !Number.isFinite(result?.lon)) {
    return null
  }

  const lat = Number(result.lat).toFixed(4)
  const lon = Number(result.lon).toFixed(4)
  const pointsResponse = await fetch(`${NOAA_POINTS_API_URL}/${lat},${lon}`, {
    signal,
    headers: {
      Accept: 'application/geo+json',
    },
  })

  if (!pointsResponse.ok) {
    throw new Error('NOAA points lookup failed.')
  }

  const pointsPayload = await pointsResponse.json()
  const properties = pointsPayload?.properties ?? {}
  let officeLabel = properties.cwa || properties.gridId || 'Not returned'

  if (properties.forecastOffice) {
    try {
      const officeResponse = await fetch(properties.forecastOffice, {
        signal,
        headers: {
          Accept: 'application/geo+json',
        },
      })

      if (officeResponse.ok) {
        const officePayload = await officeResponse.json()
        officeLabel = officePayload?.name || officeLabel
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw error
      }
    }
  }

  const alertsParams = new URLSearchParams({
    point: `${lat},${lon}`,
  })

  const alertsResponse = await fetch(`${NOAA_ALERTS_API_URL}?${alertsParams.toString()}`, {
    signal,
    headers: {
      Accept: 'application/geo+json',
    },
  })

  if (!alertsResponse.ok) {
    throw new Error('NOAA alerts lookup failed.')
  }

  const alertsPayload = await alertsResponse.json()
  const features = Array.isArray(alertsPayload?.features) ? alertsPayload.features : []

  return {
    officeLabel,
    alertsLabel: getNoaaAlertLabel(features),
  }
}

function applyNoaaContext(summaryCards, noaaContext) {
  if (!Array.isArray(summaryCards) || !noaaContext) {
    return summaryCards
  }

  return summaryCards.map((card) => {
    if (card.title !== 'Area Response Context') {
      return card
    }

    const rows = normalizeAreaResponseRows(card.rows).map((row) => {
      if (row.label === 'NOAA active alerts') {
        return {
          ...row,
          value: noaaContext.alertsLabel,
          pending: false,
        }
      }

      if (row.label === 'NWS forecast office') {
        return {
          ...row,
          value: noaaContext.officeLabel,
          pending: false,
        }
      }

      return row
    })

    return {
      ...card,
      rows,
    }
  })
}

function needsNoaaContext(summaryCards) {
  const areaResponseCard = Array.isArray(summaryCards)
    ? summaryCards.find((card) => card.title === 'Area Response Context')
    : null
  const activeAlertsRow = areaResponseCard?.rows?.find((row) => row.label === 'NOAA active alerts')
  const officeRow = areaResponseCard?.rows?.find((row) => row.label === 'NWS forecast office')

  return Boolean(
    !activeAlertsRow ||
    !officeRow ||
    activeAlertsRow.pending ||
    officeRow.pending ||
    !activeAlertsRow.value ||
    !officeRow.value ||
    activeAlertsRow.value === '—' ||
    officeRow.value === '—',
  )
}

async function enrichPropertyWithNoaa(property, signal) {
  if (!property || !needsNoaaContext(property.summaryCards)) {
    return property
  }

  try {
    const noaaContext = await fetchNoaaContext(property, signal)

    if (!noaaContext) {
      return property
    }

    return {
      ...property,
      summaryCards: applyNoaaContext(property.summaryCards, noaaContext),
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error
    }

    return property
  }
}

function needsUsfsWildfireContext(summaryCards) {
  const areaResponseCard = Array.isArray(summaryCards)
    ? summaryCards.find((card) => card.title === 'Area Response Context')
    : null
  const wildfireRow = areaResponseCard?.rows?.find((row) => row.label === 'USFS wildfire context')

  return Boolean(
    !wildfireRow ||
    wildfireRow.pending ||
    !wildfireRow.value ||
    wildfireRow.value === '—',
  )
}

function applyUsfsWildfireContext(summaryCards, wildfireValue) {
  if (!Array.isArray(summaryCards) || !wildfireValue) {
    return summaryCards
  }

  return summaryCards.map((card) => {
    if (card.title !== 'Area Response Context') {
      return card
    }

    return {
      ...card,
      rows: normalizeAreaResponseRows(card.rows).map((row) => (
        row.label === 'USFS wildfire context'
          ? {
              ...row,
              value: wildfireValue,
              pending: false,
            }
          : row
      )),
    }
  })
}

async function enrichPropertyWithUsfs(property) {
  if (!property || !needsUsfsWildfireContext(property.summaryCards)) {
    return property
  }

  const stateCode = normalizeStateCode(property?.address?.state)

  return {
    ...property,
    summaryCards: applyUsfsWildfireContext(property.summaryCards, getUsfsWildfireStatus(stateCode)),
  }
}

async function enrichPropertyWithSearchSources(property, signal) {
  const withFema = await enrichPropertyWithFema(property, signal)
  const withNoaa = await enrichPropertyWithNoaa(withFema, signal)
  return enrichPropertyWithUsfs(withNoaa)
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
  const starterProfile = createStarterProfile(result, query)
  const property = {
    ...result,
    ...starterProfile,
    query,
  }

  const enrichedProperty = await enrichPropertyWithSearchSources(property, signal)
  return applyPreferredStreetLine(enrichedProperty)
}

function SummaryCard({ title, rows, footer }) {
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
      {footer ? (
        <div className="summary-card-footer">
          {footer}
        </div>
      ) : null}
    </article>
  )
}

function LocalHazardConsiderations({ hazards, hasProperty }) {
  return (
    <article className="summary-card card local-hazards-card">
      <div className="summary-card-header local-hazards-header">
        <div>
          <p className="summary-card-title">Hazard Considerations</p>
        </div>
      </div>

      {hasProperty && hazards.length ? (
        <div className="local-hazards-grid">
          {hazards.map((hazard) => (
            <div key={hazard.id} className="local-hazard-item">
              <p className="local-hazard-title">{hazard.title}</p>
              <p className="local-hazard-result">{hazard.resultValue}</p>
              <p className="local-hazard-copy">{hazard.copy}</p>
              {hazard.source ? (
                <a
                  className="local-hazard-source"
                  href={hazard.source.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  Source: {hazard.source.label}
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
  const { isAuthenticated } = useAuth()
  const {
    activeHome,
    saveActiveHome,
    saveProperty,
    removeProperty,
    isHomeSaved,
  } = useActiveHome()
  const location = useLocation()
  const [query, setQuery] = useState(activeHome?.query || '')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [accountError, setAccountError] = useState('')
  const [propertyActionStatus, setPropertyActionStatus] = useState('idle')
  const [property, setProperty] = useState(activeHome)
  const requestRef = useRef(null)
  const autoSearchRef = useRef('')
  const sourceBackfillRef = useRef(null)

  useEffect(() => {
    return () => {
      if (requestRef.current) {
        requestRef.current.abort()
      }

      if (sourceBackfillRef.current) {
        sourceBackfillRef.current.abort()
      }
    }
  }, [])

  useEffect(() => {
    setProperty(activeHome ? applyPreferredStreetLine(activeHome) : null)
    setQuery((currentValue) => currentValue || activeHome?.query || '')
  }, [activeHome])

  useEffect(() => {
    if (!property || (!needsFemaFloodZone(property.summaryCards) && !needsNoaaContext(property.summaryCards) && !needsUsfsWildfireContext(property.summaryCards))) {
      return
    }

    if (sourceBackfillRef.current) {
      sourceBackfillRef.current.abort()
    }

    const controller = new AbortController()
    sourceBackfillRef.current = controller

    ;(async () => {
      try {
        const nextProperty = applyPreferredStreetLine(
          await enrichPropertyWithSearchSources(property, controller.signal),
        )

        if (!controller.signal.aborted && nextProperty !== property) {
          setProperty(nextProperty)
          saveActiveHome(nextProperty)
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          // Ignore background source backfill errors and leave the existing placeholders in place.
        }
      } finally {
        if (sourceBackfillRef.current === controller) {
          sourceBackfillRef.current = null
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
  const localHazards = buildLocalHazards(property)
  const propertyIsSaved = isHomeSaved(property)
  const propertyCanRemove = Boolean(property?.savedPropertyId) || propertyIsSaved

  useEffect(() => {
    setAccountError('')
    setPropertyActionStatus('idle')
  }, [property?.query, property?.savedPropertyId])

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

  const handleSaveProperty = async () => {
    if (!property) {
      return
    }

    setPropertyActionStatus('working')
    setAccountError('')

    try {
      if (propertyCanRemove) {
        await removeProperty(property)
      } else {
        const savedHome = await saveProperty(property)
        setProperty(savedHome)
      }
    } catch (saveError) {
      setAccountError(saveError?.message || 'We could not update the saved properties right now.')
    } finally {
      setPropertyActionStatus('idle')
    }
  }

  const handleRemoveSavedProperty = async () => {
    if (!property) {
      return
    }

    setPropertyActionStatus('working')
    setAccountError('')

    try {
      await removeProperty(property)
    } catch (removeError) {
      setAccountError(removeError?.message || 'We could not remove this property right now.')
    } finally {
      setPropertyActionStatus('idle')
    }
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
        <div className="property-search-field">
          <input
            id="property-address-search"
            className="property-search-input"
            type="text"
            placeholder="Enter address, city, state ZIP"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            className="property-search-icon-button"
            type="submit"
            aria-label={status === 'loading' ? 'Searching address' : 'Search address'}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
          </button>
        </div>
        {property ? (
          isAuthenticated ? (
            <button
              className="btn-primary property-search-button property-save-button"
              type="button"
              onClick={handleSaveProperty}
            >
              {propertyActionStatus === 'working'
                ? propertyCanRemove ? 'Removing...' : 'Saving...'
                : propertyCanRemove ? 'Remove Saved' : 'Save Property'}
            </button>
          ) : (
            <Link className="btn-primary property-search-button property-save-button" to="/upgrade">
              Save Property
            </Link>
          )
        ) : null}
      </form>

      {error ? <p className="property-error">{error}</p> : null}
      {accountError ? <p className="property-error">{accountError}</p> : null}

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
                    footer={isAuthenticated && propertyCanRemove ? (
                      <>
                        <button
                          className="summary-card-remove"
                          type="button"
                          onClick={handleRemoveSavedProperty}
                        >
                          {propertyActionStatus === 'working' ? 'Removing...' : 'Remove property'}
                        </button>
                        <p className="summary-card-note">
                          Removes all saved items related to this property.
                        </p>
                      </>
                    ) : null}
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
              </div>

              <div className="summary-stack">
                <div className="summary-alert-row">
                  <AlertTicker />
                </div>
                <div className="summary-hazard-row">
                  <LocalHazardConsiderations hazards={localHazards} hasProperty />
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
              </div>

              <div className="summary-stack">
                <div className="summary-alert-row">
                  <AlertTicker />
                </div>
                <div className="summary-hazard-row">
                  <LocalHazardConsiderations hazards={[]} hasProperty={false} />
                </div>
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  )
}

export default PropertyProfile
