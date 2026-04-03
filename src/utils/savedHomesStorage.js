const STORAGE_PREFIX = 'fortressforesight.saved-homes'

function getStorageKey(userId) {
  return userId ? `${STORAGE_PREFIX}.${userId}` : ''
}

export function readSavedHomes(userId) {
  if (typeof window === 'undefined' || !userId) {
    return []
  }

  try {
    const rawValue = window.localStorage.getItem(getStorageKey(userId))
    const parsedValue = rawValue ? JSON.parse(rawValue) : []
    return Array.isArray(parsedValue) ? parsedValue : []
  } catch {
    return []
  }
}

export function writeSavedHomes(userId, homes) {
  if (typeof window === 'undefined' || !userId) {
    return
  }

  const storageKey = getStorageKey(userId)

  try {
    if (!homes?.length) {
      window.localStorage.removeItem(storageKey)
      return
    }

    window.localStorage.setItem(storageKey, JSON.stringify(homes))
  } catch {
    // Ignore browser storage failures and keep the in-memory state.
  }
}
