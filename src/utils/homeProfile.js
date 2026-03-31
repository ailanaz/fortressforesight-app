export function getHomeTitle(home) {
  if (!home) {
    return ''
  }

  const street = [home.address?.house_number, home.address?.road]
    .filter(Boolean)
    .join(' ')

  return street || home.query || 'Saved home'
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
