const STORAGE_KEY = 'fortressforesight.active-home'
const SESSION_STORAGE_KEY = 'fortressforesight.active-home-session'

function readStorageValue(storage, key) {
  if (!storage) {
    return null
  }

  try {
    const rawValue = storage.getItem(key)
    return rawValue ? JSON.parse(rawValue) : null
  } catch {
    return null
  }
}

export function readStoredHome() {
  if (typeof window === 'undefined') {
    return null
  }

  return readStorageValue(window.sessionStorage, SESSION_STORAGE_KEY)
    || readStorageValue(window.localStorage, STORAGE_KEY)
}

export function persistHome(value, { persistent = true } = {}) {
  if (typeof window === 'undefined') {
    return
  }

  if (!value) {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
    window.localStorage.removeItem(STORAGE_KEY)
    return
  }

  const serialized = JSON.stringify(value)
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, serialized)

  if (persistent) {
    window.localStorage.setItem(STORAGE_KEY, serialized)
  } else {
    window.localStorage.removeItem(STORAGE_KEY)
  }
}
