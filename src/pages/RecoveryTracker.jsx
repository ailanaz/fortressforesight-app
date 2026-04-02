import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import CalendarEventBar from '../components/CalendarEventBar'
import { useActiveHome } from '../context/HomeContext'
import { getHomeTitle } from '../utils/homeProfile'
import { defaultCalendarDate } from '../utils/calendar'
import './Page.css'
import './RecoveryTracker.css'

const RECOVERY_SECTIONS = [
  {
    id: 'damage-log',
    label: 'Damage Log',
  },
  {
    id: 'timeline',
    label: 'Timeline',
  },
  {
    id: 'expenses',
    label: 'Expenses',
  },
  {
    id: 'claim-status',
    label: 'Claim Status',
  },
]

const EXPENSE_COLUMNS = ['Date', 'Category', 'Vendor', 'Amount', 'Notes', 'Receipt']
const EXPENSE_ROWS = [
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
]

const TIME_LOG_COLUMNS = ['Date', 'Time', 'Type', 'Contact / Company', 'Details', 'Next Step']
const TIME_LOG_ROWS = [
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
]

const INTERIOR_DAMAGE_COLUMNS = ['Room', 'Damage Type', 'Severity', 'Photos', 'Notes', 'Next Step']
const EXTERIOR_DAMAGE_COLUMNS = ['Area', 'Damage Type', 'Severity', 'Photos', 'Notes', 'Next Step']
const DAMAGE_LOG_ROWS = [
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
]

function getSectionTabClassName(sectionId, activeSection) {
  const slug = sectionId.toLowerCase().replace(/\s+/g, '-')
  return `recovery-filter-tab recovery-filter-tab-${slug}${activeSection === sectionId ? ' active' : ''}`
}

function RecoveryTracker() {
  const { activeHome } = useActiveHome()
  const [searchParams, setSearchParams] = useSearchParams()
  const [damageScope, setDamageScope] = useState('Interior')
  const [calendarTitle, setCalendarTitle] = useState('')
  const [calendarDate, setCalendarDate] = useState(defaultCalendarDate(7))
  const sectionParam = searchParams.get('section')
  const initialSection = RECOVERY_SECTIONS.some((section) => section.id === sectionParam) ? sectionParam : 'damage-log'
  const [activeSection, setActiveSection] = useState(initialSection)
  const [openSection, setOpenSection] = useState(initialSection)
  const homeTitle = getHomeTitle(activeHome)

  const selectedSection = RECOVERY_SECTIONS.find((section) => section.id === activeSection) ?? RECOVERY_SECTIONS[0]

  const handleSelectSection = (sectionId) => {
    setActiveSection(sectionId)
    setOpenSection(sectionId)
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.set('section', sectionId)
      return next
    }, { replace: true })
  }

  const handleToggleSection = () => {
    setOpenSection((current) => (current === selectedSection.id ? '' : selectedSection.id))
  }

  return (
    <div className="page">
      <h1 className="page-title recovery-workspace-title">Recovery Workspace</h1>

      <div className="page-utility-bar recovery-utility-bar">
        <CalendarEventBar
          title={calendarTitle}
          setTitle={setCalendarTitle}
          date={calendarDate}
          setDate={setCalendarDate}
          defaultTitle={homeTitle ? `Recovery Event - ${homeTitle}` : 'Recovery Event'}
          details={homeTitle ? `Recovery event for ${homeTitle} in FortressForesight.` : 'Recovery event in FortressForesight.'}
          dateAriaLabel="Recovery event date"
        />
      </div>

      <div className="recovery-filter-tabs-wrap">
        <div className="recovery-filter-tabs">
          {RECOVERY_SECTIONS.map((section) => (
            <button
              key={section.id}
              className={getSectionTabClassName(section.id, activeSection)}
              onClick={() => handleSelectSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      <h2 className="section-label recovery-tracker-title">Tracker</h2>

      <div className="recovery-card-list">
        <div className="recovery-card card">
          <div
            className="recovery-card-header"
            onClick={handleToggleSection}
          >
            <div>
              <div className="recovery-card-title">{selectedSection.label}</div>
            </div>
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              style={{
                transform: openSection === selectedSection.id ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
                flexShrink: 0,
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          {openSection === selectedSection.id ? (
            <div className="recovery-card-body">
              {selectedSection.id === 'damage-log' ? (
                <>
                  <div className="recovery-scope-tabs">
                    {['Interior', 'Exterior'].map((scope) => (
                      <button
                        key={scope}
                        type="button"
                        className={`recovery-scope-tab${damageScope === scope ? ' active' : ''}`}
                        onClick={() => setDamageScope(scope)}
                      >
                        {scope}
                      </button>
                    ))}
                  </div>
                  <div className="section-header">
                    <h3 className="section-label">
                      {damageScope === 'Interior' ? 'Interior Damage' : 'Exterior Damage'}
                    </h3>
                  </div>
                  <div className="expense-sheet-wrap">
                    <div className="expense-sheet-scroll">
                      <table className="expense-sheet">
                        <thead>
                          <tr>
                            {(damageScope === 'Interior' ? INTERIOR_DAMAGE_COLUMNS : EXTERIOR_DAMAGE_COLUMNS).map((column) => (
                              <th key={column}>{column}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {DAMAGE_LOG_ROWS.map((row, rowIndex) => (
                            <tr key={`damage-row-${damageScope}-${rowIndex}`}>
                              {row.map((cell, cellIndex) => (
                                <td key={`damage-cell-${damageScope}-${rowIndex}-${cellIndex}`}>
                                  <input
                                    type="text"
                                    value={cell}
                                    readOnly
                                    placeholder=""
                                    aria-label={`${damageScope === 'Interior' ? INTERIOR_DAMAGE_COLUMNS[cellIndex] : EXTERIOR_DAMAGE_COLUMNS[cellIndex]} row ${rowIndex + 1}`}
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="recovery-bottom-action">
                    <button className="btn-outline recovery-add-btn">
                      {damageScope === 'Interior' ? '+ Add Room' : '+ Add Area'}
                    </button>
                  </div>
                  <div className="recovery-guide-block">
                    <h3 className="guide-title">Working with Adjusters</h3>
                    <ul className="guide-list">
                      <li>Photograph damage before any cleanup or repairs</li>
                      <li>If possible, keep damaged items until they are documented</li>
                      <li>Save the adjuster&apos;s name, company, license number, and phone</li>
                      <li>Ask for a written scope of loss after the inspection</li>
                      <li>Company adjusters work for the insurer; you can hire a public adjuster if needed</li>
                    </ul>
                  </div>
                </>
              ) : null}

              {selectedSection.id === 'timeline' ? (
                <div className="expense-sheet-wrap">
                  <div className="expense-sheet-scroll">
                    <table className="expense-sheet">
                      <thead>
                        <tr>
                          {TIME_LOG_COLUMNS.map((column) => (
                            <th key={column}>{column}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {TIME_LOG_ROWS.map((row, rowIndex) => (
                          <tr key={`timeline-row-${rowIndex}`}>
                            {row.map((cell, cellIndex) => (
                              <td key={`timeline-cell-${rowIndex}-${cellIndex}`}>
                                <input
                                  type="text"
                                  value={cell}
                                  readOnly
                                  placeholder=""
                                  aria-label={`${TIME_LOG_COLUMNS[cellIndex]} row ${rowIndex + 1}`}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {selectedSection.id === 'expenses' ? (
                <div className="expense-sheet-wrap">
                  <div className="expense-sheet-scroll">
                    <table className="expense-sheet">
                      <thead>
                        <tr>
                          {EXPENSE_COLUMNS.map((column) => (
                            <th key={column}>{column}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {EXPENSE_ROWS.map((row, rowIndex) => (
                          <tr key={`expense-row-${rowIndex}`}>
                            {row.map((cell, cellIndex) => (
                              <td key={`expense-cell-${rowIndex}-${cellIndex}`}>
                                <input
                                  type="text"
                                  value={cell}
                                  readOnly
                                  placeholder=""
                                  aria-label={`${EXPENSE_COLUMNS[cellIndex]} row ${rowIndex + 1}`}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {selectedSection.id === 'claim-status' ? (
                <div className="claim-steps">
                  {[
                    { label: 'Claim Filed', done: false },
                    { label: 'Adjuster Assigned', done: false },
                    { label: 'Inspection Complete', done: false },
                    { label: 'Estimate Received', done: false },
                    { label: 'Payment Issued', done: false },
                    { label: 'Repairs Complete', done: false },
                  ].map((step) => (
                    <div key={step.label} className={`claim-step${step.done ? ' done' : ''}`}>
                      <div className="step-dot" />
                      <span>{step.label}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default RecoveryTracker
