const STARTER_CUSTOM_LIST_TEMPLATES = [
  {
    starterKey: 'emergency-planning',
    id: 'my-emergency-planning',
    title: 'My Emergency Planning and Kits',
    items: [
      'Three days of food',
      'Three days of water',
      'Lights',
      'Batteries',
      'First aid supplies',
      'Medications and backup prescriptions',
      'Emergency contacts',
      'Family meeting spots',
      'Insurance policy numbers',
      'Two ways out of every room',
      'Fire drills twice a year',
    ],
  },
  {
    starterKey: 'evacuation-plan',
    id: 'evacuation-plan',
    title: 'Evacuation Plan',
    items: [
      'Primary route out',
      'Backup route out',
      'Household meeting spot',
      'Out-of-area contact',
      'Pets and carriers',
      'Medications and essential items',
      'Must-grab documents',
      'Go-bag basics',
      'Utility shutoff reminders',
      'Vehicle fuel and keys ready',
    ],
  },
]

const STARTER_KEY_BY_ID = Object.fromEntries(
  STARTER_CUSTOM_LIST_TEMPLATES.map((template) => [template.id, template.starterKey]),
)

const WEATHER_CHECKLIST_TEMPLATES = [
  {
    id: 'flood',
    matchers: [/flood/i, /flash flood/i],
    title: 'Flood Alert Checklist',
    items: [
      'Document lower levels and current exterior condition',
      'Move important items out of low areas',
      'Check drainage paths, gutters, and nearby openings',
      'Keep key home records easy to access',
      'Note the most water-vulnerable rooms and entry points',
    ],
  },
  {
    id: 'wildfire',
    matchers: [/wildfire/i, /red flag/i, /fire weather/i, /smoke/i],
    title: 'Wildfire Alert Checklist',
    items: [
      'Clear dry debris from roof and gutters',
      'Move combustible items away from the home',
      'Check vents, soffits, and exterior gaps',
      'Document the home exterior and vulnerable areas',
      'Keep key records and must-grab items together',
    ],
  },
  {
    id: 'freeze',
    matchers: [/freeze/i, /hard freeze/i, /winter storm/i, /ice storm/i, /snow/i],
    title: 'Freeze Alert Checklist',
    items: [
      'Protect exposed plumbing and hose connections',
      'Check vulnerable shutoffs and utility access points',
      'Note drainage areas that could freeze or back up',
      'Document current exterior and plumbing condition',
      'Keep key property records easy to access',
    ],
  },
  {
    id: 'storm',
    matchers: [/thunderstorm/i, /tornado/i, /wind/i, /hurricane/i, /tropical storm/i, /severe storm/i],
    title: 'Storm Alert Checklist',
    items: [
      'Bring in or secure loose exterior items',
      'Check roof edges, gutters, windows, and doors',
      'Note trees or limbs close to the house',
      'Document the current condition of the exterior',
      'Keep key records, contacts, and chargers ready',
    ],
  },
]

function normalizeChecklistItem(checklistId, item, index) {
  if (typeof item === 'string') {
    return {
      id: `${checklistId}-${index}`,
      text: item,
    }
  }

  return {
    id: item?.id || `${checklistId}-${index}`,
    text: item?.text || '',
  }
}

function createStarterChecklist(template) {
  return {
    id: template.id,
    starterKey: template.starterKey,
    title: template.title,
    items: template.items.map((item, index) => normalizeChecklistItem(template.id, item, index)),
    open: false,
    editingTitle: false,
    done: {},
  }
}

function getAlertText(alert) {
  return `${alert?.event || ''} ${alert?.headline || ''}`.trim()
}

export function createCustomChecklistDraft() {
  return {
    id: `custom-${Date.now()}`,
    title: '',
    items: [],
    open: true,
    editingTitle: true,
    done: {},
  }
}

export function normalizeCustomChecklist(checklist) {
  const id = checklist?.id || `custom-${Date.now()}`

  return {
    id,
    starterKey: checklist?.starterKey || STARTER_KEY_BY_ID[id] || '',
    title: checklist?.title || '',
    items: (checklist?.items || []).map((item, index) => normalizeChecklistItem(id, item, index)),
    open: Boolean(checklist?.open ?? checklist?.initiallyOpen),
    editingTitle: Boolean(checklist?.editingTitle ?? checklist?.initiallyOpen),
    done: checklist?.done || {},
  }
}

export function createDefaultCustomChecklists(removedStarterKeys = []) {
  return STARTER_CUSTOM_LIST_TEMPLATES
    .filter((template) => !removedStarterKeys.includes(template.starterKey))
    .map(createStarterChecklist)
}

export function normalizeCustomChecklists(checklists, removedStarterKeys = []) {
  const normalized = Array.isArray(checklists)
    ? checklists.map(normalizeCustomChecklist)
    : []
  const existingStarterKeys = new Set(normalized.map((checklist) => checklist.starterKey).filter(Boolean))
  const missingStarters = STARTER_CUSTOM_LIST_TEMPLATES
    .filter((template) => (
      !removedStarterKeys.includes(template.starterKey) &&
      !existingStarterKeys.has(template.starterKey)
    ))
    .map(createStarterChecklist)

  return [...normalized, ...missingStarters]
}

export function sanitizeCustomChecklists(checklists) {
  return (checklists || []).map((checklist) => ({
    id: checklist.id,
    starterKey: checklist.starterKey || '',
    title: checklist.title || '',
    items: (checklist.items || []).map((item) => ({
      id: item.id,
      text: item.text || '',
    })),
    open: Boolean(checklist.open),
    editingTitle: Boolean(checklist.editingTitle),
    done: checklist.done || {},
  }))
}

export function buildWeatherChecklist(alerts) {
  const joinedAlertText = alerts.map(getAlertText).join(' ')
  const template = WEATHER_CHECKLIST_TEMPLATES.find((candidate) => (
    candidate.matchers.some((matcher) => matcher.test(joinedAlertText))
  ))

  if (!template) {
    return null
  }

  const primaryAlert = alerts.find((alert) => (
    template.matchers.some((matcher) => matcher.test(getAlertText(alert)))
  )) || alerts[0]
  const checklistId = `weather-${Date.now()}`
  const title = primaryAlert?.event ? `${primaryAlert.event} Checklist` : template.title

  return normalizeCustomChecklist({
    id: checklistId,
    title,
    items: template.items,
    open: true,
    editingTitle: false,
  })
}

export function getWeatherChecklistPreview(alerts) {
  const checklist = buildWeatherChecklist(alerts)

  if (!checklist) {
    return null
  }

  return {
    title: checklist.title,
    items: checklist.items.map((item) => item.text),
  }
}
