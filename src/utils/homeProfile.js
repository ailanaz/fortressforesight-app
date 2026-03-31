export function getHomeTitle(home) {
  if (!home) {
    return ''
  }

  const streetLine = home.address?.street_line
  const street = [home.address?.house_number, home.address?.road]
    .filter(Boolean)
    .join(' ')
  const queryLine = home.query?.split(',')[0]?.trim()
  const displayLine = home.displayName?.split(',')[0]?.trim()

  return streetLine || street || queryLine || displayLine || home.query || 'Saved home'
}

export function getHomeLocation(home) {
  if (!home) {
    return ''
  }

  return [
    home.address?.city || home.address?.town || home.address?.village || home.address?.hamlet,
    home.address?.state,
    home.address?.postcode,
  ]
    .filter(Boolean)
    .join(' • ')
}
