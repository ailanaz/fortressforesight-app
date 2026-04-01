import { useState } from 'react'
import CalendarEventBar from '../components/CalendarEventBar'
import { useActiveHome } from '../context/HomeContext'
import { getHomeLocation, getHomeTitle } from '../utils/homeProfile'
import { defaultCalendarDate } from '../utils/calendar'
import './Page.css'
import './RecoveryTracker.css'

const TABS = ['Damage Log', 'Timeline', 'Expenses', 'Claim Status']

function getRecoveryTabClassName(tab, activeTab) {
  const slug = tab.toLowerCase().replace(/\s+/g, '-')
  return `recovery-tab recovery-tab-${slug}${activeTab === tab ? ' active' : ''}`
}

function RecoveryTracker() {
  const { activeHome } = useActiveHome()
  const [activeTab, setActiveTab] = useState('Damage Log')
  const [damageScope, setDamageScope] = useState('Interior')
  const [calendarTitle, setCalendarTitle] = useState('')
  const [calendarDate, setCalendarDate] = useState(defaultCalendarDate(7))
  const homeTitle = getHomeTitle(activeHome)
  const homeLocation = getHomeLocation(activeHome)

  return (
    <div className="page">
      <h1 className="page-title recovery-workspace-title">Recovery Workspace</h1>

      {activeHome ? (
        <div className="active-home-card card">
          <div className="active-home-copy">
            <span className="active-home-title">{homeTitle}</span>
            {homeLocation ? <span className="active-home-meta">{homeLocation}</span> : null}
          </div>
        </div>
      ) : null}

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

      <h2 className="section-label recovery-tracker-title">Tracker</h2>
      <p className="page-subtitle">
        Document damage, log expenses, and track your claim from start to finish.
      </p>

      <div className="recovery-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={getRecoveryTabClassName(tab, activeTab)}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Damage Log' && (
        <div className="tab-content recovery-grid">
          <section className="recovery-panel recovery-main-panel">
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
              <h2 className="section-label">
                {damageScope === 'Interior' ? 'Damage by Room' : 'Exterior Damage'}
              </h2>
              <button className="btn-primary">
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
          </section>
          <section className="recovery-panel recovery-guide-panel">
            <h3 className="guide-title">Working with Adjusters</h3>
            <ul className="guide-list">
              <li>Photograph everything before any cleanup or repairs</li>
              <li>Do not throw away damaged items - adjusters need to see them</li>
              <li>Get the adjuster&apos;s name, company, license number, and phone</li>
              <li>Ask for a written scope of loss after their inspection</li>
              <li>You have the right to hire a public adjuster if you disagree</li>
            </ul>
          </section>
        </div>
      )}

      {activeTab === 'Expenses' && (
        <div className="tab-content">
          <section className="recovery-panel recovery-full-panel">
            <div className="section-header">
              <h2 className="section-label">Expense Log</h2>
              <button className="btn-primary">+ Add Expense</button>
            </div>
            <div className="empty-room-state">
              <p>No expenses logged yet.</p>
              <p>Log every cost with a receipt photo - hotels, meals, emergency repairs, supplies.</p>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'Timeline' && (
        <div className="tab-content">
          <section className="recovery-panel recovery-full-panel">
            <h2 className="section-label">Event Timeline</h2>
            <div className="empty-room-state">
              <p>Your claim timeline will appear here as you log events and updates.</p>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'Claim Status' && (
        <div className="tab-content">
          <section className="recovery-panel recovery-full-panel">
            <h2 className="section-label">Claim Status</h2>
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
          </section>
        </div>
      )}
    </div>
  )
}

export default RecoveryTracker
