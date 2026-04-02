import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { defaultCalendarDate, downloadCalendarInvite, formatDateInput } from '../utils/calendar'
import './CalendarEventBar.css'

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function dateFromValue(value) {
  if (!value) return null

  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null

  return new Date(year, month - 1, day)
}

function monthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function shiftMonth(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function formatDisplayDate(value) {
  const date = dateFromValue(value)
  if (!date) return 'Select date'

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}/${day}/${date.getFullYear()}`
}

function buildCalendarDays(viewMonth) {
  const firstDay = monthStart(viewMonth)
  const gridStart = new Date(firstDay.getFullYear(), firstDay.getMonth(), 1 - firstDay.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index)
    return {
      date,
      value: formatDateInput(date),
      label: date.getDate(),
      inMonth: date.getMonth() === viewMonth.getMonth(),
    }
  })
}

function CalendarEventBar({
  title,
  setTitle,
  date,
  setDate,
  defaultTitle,
  details,
  dateAriaLabel,
}) {
  const { isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const [hintOpen, setHintOpen] = useState(false)
  const pickerRef = useRef(null)
  const today = useMemo(() => defaultCalendarDate(0), [])
  const selectedDate = dateFromValue(date) ?? dateFromValue(today)
  const [viewMonth, setViewMonth] = useState(monthStart(selectedDate ?? new Date()))

  const openPicker = () => {
    const nextViewDate = dateFromValue(date) ?? dateFromValue(today) ?? new Date()
    setViewMonth(monthStart(nextViewDate))
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return undefined

    const handlePointerDown = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const days = useMemo(() => buildCalendarDays(viewMonth), [viewMonth])
  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(viewMonth),
    [viewMonth],
  )

  const saveCalendarEvent = () => {
    if (!date) return

    const safeTitle = title.trim() || defaultTitle
    downloadCalendarInvite({ title: safeTitle, date, details })
    setOpen(false)
  }

  return (
    <div className="page-calendar-actions">
      <div className="page-event-field">
        <input
          className="page-input page-input-wide"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add calendar event"
          aria-label="Calendar event"
          disabled={!isAuthenticated}
        />
        <span className={`page-upgrade-hint${hintOpen ? ' is-open' : ''}`}>
          <button
            className="page-upgrade-hint-trigger"
            type="button"
            aria-label="Upgrade info"
            aria-expanded={hintOpen}
            onClick={() => setHintOpen((current) => !current)}
            onBlur={() => setHintOpen(false)}
          >
            i
          </button>
          <span className="page-upgrade-tooltip" role="tooltip">
            Upgrade to
            <br />
            save calendar events.
          </span>
        </span>
      </div>

      <div className="calendar-picker" ref={pickerRef}>
        {isAuthenticated ? (
          <button
            className={`page-date-trigger${open ? ' is-open' : ''}`}
            type="button"
            aria-label={dateAriaLabel}
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => {
              if (open) {
                setOpen(false)
                return
              }

              openPicker()
            }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4" />
              <path d="M8 2v4" />
              <path d="M3 10h18" />
            </svg>
            <span>{formatDisplayDate(date)}</span>
          </button>
        ) : (
          <Link className="page-date-trigger" aria-label={dateAriaLabel} to="/upgrade">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4" />
              <path d="M8 2v4" />
              <path d="M3 10h18" />
            </svg>
            <span>Save date</span>
          </Link>
        )}

        {isAuthenticated && open ? (
          <div className="calendar-popover" role="dialog" aria-label="Choose date">
            <div className="calendar-popover-header">
              <button
                className="calendar-nav-button"
                type="button"
                onClick={() => setViewMonth((current) => shiftMonth(current, -1))}
                aria-label="Previous month"
              >
                ‹
              </button>
              <div className="calendar-month-label">{monthLabel}</div>
              <button
                className="calendar-nav-button"
                type="button"
                onClick={() => setViewMonth((current) => shiftMonth(current, 1))}
                aria-label="Next month"
              >
                ›
              </button>
            </div>

            <div className="calendar-weekdays" aria-hidden="true">
              {WEEKDAY_LABELS.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>

            <div className="calendar-grid">
              {days.map((day) => {
                const isSelected = day.value === date
                const isToday = day.value === today

                return (
                  <button
                    key={day.value}
                    className={`calendar-day${day.inMonth ? '' : ' is-outside'}${isSelected ? ' is-selected' : ''}${isToday ? ' is-today' : ''}`}
                    type="button"
                    onClick={() => {
                      setDate(day.value)
                      if (!day.inMonth) {
                        setViewMonth(monthStart(day.date))
                      }
                    }}
                    aria-pressed={isSelected}
                  >
                    {day.label}
                  </button>
                )
              })}
            </div>

            <div className="calendar-popover-footer">
              <button className="calendar-link-button" type="button" onClick={() => setDate(today)}>
                Today
              </button>
              <button className="calendar-link-button" type="button" onClick={() => setDate('')}>
                Clear
              </button>
              <button
                className="calendar-link-button calendar-link-button-save"
                type="button"
                onClick={saveCalendarEvent}
                disabled={!date}
              >
                Save
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default CalendarEventBar
