import { getHomeTitle } from './homeProfile'

export function buildSavedPropertyId(home) {
  const baseValue = [
    home?.query || getHomeTitle(home),
    home?.address?.postcode || '',
    home?.lat || '',
    home?.lon || '',
  ]
    .filter(Boolean)
    .join('-')
    .trim()
    .toLowerCase()

  const slug = baseValue.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return slug || `property-${Date.now()}`
}
