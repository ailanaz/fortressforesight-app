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
    summary: 'Document damage by area, room, and exterior section.',
  },
  {
    id: 'timeline',
    label: 'Timeline',
    summary: 'Track calls, updates, inspections, and claim events.',
  },
  {
    id: 'expenses',
    label: 'Expenses',
    summary: 'Keep repair, hotel, meal, and supply costs together.',
  },
  {
    id: 'claim-status',
    label: 'Claim Status',
    summary: 'See the status of the claim from filing through repairs.',
  },
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
      <p className="page-subtitle">
        Document damage, log expenses, and track your claim from start to finish.
      </p>

      <div className="recovery-card-list">
        <div className="recovery-card card">
          <div
            className="recovery-card-header"
            onClick={handleToggleSection}
          >
            <div>
              <span className="recovery-card-category">{selectedSection.label}</span>
              <div className="recovery-card-title">{selectedSection.label}</div>
              <div className="recovery-card-summary">{selectedSection.summary}</div>
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
                    <button className="btn-outline recovery-add-btn">
                      {damageScope === 'Interior' ? '+ Add Room' : '+ Add Area'}
                    </button>
                  </div>
                  <div className="empty-room-state">
                    <p>No damage logged yet.</p>
                    <p>
                      {damageScope === 'Interior'
                        ? 'Add a room to start documenting with photos and notes.'
                        : 'Add an exterior area to start documenting roof, siding, windows, yard, or other outside damage.'}
                    </p>
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
                <div className="empty-room-state">
                  <p>Your claim timeline will appear here as you log events and updates.</p>
                </div>
              ) : null}

              {selectedSection.id === 'expenses' ? (
                <>
                  <div className="section-header">
                    <h3 className="section-label">Expense Log</h3>
                    <button className="btn-outline recovery-add-btn">+ Add Expense</button>
                  </div>
                  <div className="empty-room-state">
                    <p>No expenses logged yet.</p>
                    <p>Log every cost with a receipt photo - hotels, meals, emergency repairs, supplies.</p>
                  </div>
                </>
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
