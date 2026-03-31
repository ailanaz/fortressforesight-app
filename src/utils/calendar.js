export function formatDateInput(date) {
  return date.toISOString().slice(0, 10)
}

export function defaultCalendarDate(days = 14) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return formatDateInput(date)
}

function createCalendarInvite({ title, date, details }) {
  const start = new Date(`${date}T09:00:00`)
  const end = new Date(`${date}T10:00:00`)

  const formatIcs = (value) => value.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const safe = (value) => String(value).replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FortressForesight//Calendar//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@fortressforesight.app`,
    `DTSTAMP:${formatIcs(new Date())}`,
    `DTSTART:${formatIcs(start)}`,
    `DTEND:${formatIcs(end)}`,
    `SUMMARY:${safe(title)}`,
    `DESCRIPTION:${safe(details)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\n')
}

export function downloadCalendarInvite({ title, date, details, filename }) {
  const content = createCalendarInvite({ title, date, details })
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename ?? `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
