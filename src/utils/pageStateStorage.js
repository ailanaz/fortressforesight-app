const PAGE_STATE_PREFIX = 'fortressforesight.page-state'
const PAGE_STATE_NAMESPACES = ['readiness', 'documents', 'contacts', 'recovery']

function getPropertyScope(activeHome) {
  if (!activeHome) {
    return 'no-property'
  }

  const baseValue = activeHome.query
    || activeHome.displayName
    || activeHome.address?.street_line
    || activeHome.address?.formatted
    || 'property'

  return encodeURIComponent(baseValue.trim().toLowerCase())
}

export function getPageStateStorageKey(namespace, userId, activeHome) {
  if (!userId || !namespace) {
    return ''
  }

  return `${PAGE_STATE_PREFIX}.${namespace}.${userId}.${getPropertyScope(activeHome)}`
}

export function readPageState(storageKey) {
  if (!storageKey || typeof window === 'undefined') {
    return null
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey)
    return rawValue ? JSON.parse(rawValue) : null
  } catch {
    return null
  }
}

export function writePageState(storageKey, value) {
  if (!storageKey || typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value))
  } catch {
    // Ignore browser storage failures and leave in-memory state as-is.
  }
}

export function clearPageStatesForProperty(userId, activeHome, namespaces = PAGE_STATE_NAMESPACES) {
  if (typeof window === 'undefined' || !userId || !activeHome) {
    return
  }

  namespaces.forEach((namespace) => {
    const storageKey = getPageStateStorageKey(namespace, userId, activeHome)

    if (storageKey) {
      window.localStorage.removeItem(storageKey)
    }
  })
}
