import { useState } from 'react'
import { useActiveHome } from '../context/HomeContext'
import { getHomeLocation, getHomeTitle } from '../utils/homeProfile'
import { defaultCalendarDate, downloadCalendarInvite } from '../utils/calendar'
import './Page.css'
import './RecoveryTracker.css'

const TABS = ['Damage Log', 'Timeline', 'Claim Status', 'Expenses']

function RecoveryTracker() {
  const { activeHome } = useActiveHome()
  const [activeTab, setActiveTab] = useState('Damage Log')
  const [calendarTitle, setCalendarTitle] = useState('')
  const [calendarDate, setCalendarDate] = useState(defaultCalendarDate(7))
  const homeTitle = getHomeTitle(activeHome)
  const homeLocation = getHomeLocation(activeHome)

  const handleSaveToCalendar = () => {
    const title = calendarTitle.trim() || (homeTitle ? `Recovery Event - ${homeTitle}` : 'Recovery Event')
    const details = homeTitle ? `Recovery event for ${homeTitle} in FortressForesight.` : 'Recovery event in FortressForesight.'

    downloadCalendarInvite({ title, date: calendarDate, details })
  }

  return (
    <div className="page">
      <h1 className="page-title recovery-workspace-title">Recovery Workspace</h1>

      {activeHome ? (
        <div className="active-home-card card">
          <div className="active-home-copy">
            <span className="active-home-title">{homeTitle}</span>
            {homeLocation ? <span className="active-home-meta">{homeLocation}</span> : null}
            <span className="active-home-note">
              Damage logs, receipts, and claim milestones now stay centered on the home you searched.
            </span>
          </div>
        </div>
      ) : (
        <div className="active-home-card active-home-empty card">
          <div className="active-home-copy">
            <span className="active-home-title">Add a home to start</span>
            <span className="active-home-note">
              Search an address first so recovery details stay tied to one property instead of a generic claim shell.
            </span>
          </div>
        </div>
      )}

      <div className="page-utility-bar recovery-utility-bar">
        <div className="page-calendar-actions">
          <div className="page-event-field">
            <input
              className="page-input page-input-wide"
              type="text"
              value={calendarTitle}
              onChange={(event) => setCalendarTitle(event.target.value)}
              placeholder="Add calendar event"
              aria-label="Calendar event"
            />
            <span className="page-paid-badge">Paid</span>
          </div>
          <input
            className="page-input"
            type="date"
            value={calendarDate}
            onChange={(event) => setCalendarDate(event.target.value)}
            aria-label="Recovery event date"
          />
          <button className="btn-outline" type="button" onClick={handleSaveToCalendar}>
            Save to Calendar
          </button>
        </div>
      </div>

      <h2 className="section-label recovery-tracker-title">Recovery Tracker</h2>
      <p className="page-subtitle">
        Document damage, log expenses, and track your claim from start to finish.
      </p>

      <div className="recovery-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`recovery-tab${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Damage Log' && (
        <div className="tab-content">
          <div className="section-header">
            <h2 className="section-label">Damage by Room</h2>
            <button className="btn-primary">+ Add Room</button>
          </div>
          <div className="empty-room-state card">
            <p>No damage logged yet.</p>
            <p>Add a room to start documenting with photos and notes.</p>
          </div>
          <div className="adjuster-guide card">
            <h3 className="guide-title">Working with Adjusters</h3>
            <ul className="guide-list">
              <li>Photograph everything before any cleanup or repairs</li>
              <li>Do not throw away damaged items - adjusters need to see them</li>
              <li>Get the adjuster&apos;s name, company, license number, and phone</li>
              <li>Ask for a written scope of loss after their inspection</li>
              <li>You have the right to hire a public adjuster if you disagree</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'Expenses' && (
        <div className="tab-content">
          <div className="section-header">
            <h2 className="section-label">Expense Log</h2>
            <button className="btn-primary">+ Add Expense</button>
          </div>
          <div className="empty-room-state card">
            <p>No expenses logged yet.</p>
            <p>Log every cost with a receipt photo - hotels, meals, emergency repairs, supplies.</p>
          </div>
        </div>
      )}

      {activeTab === 'Timeline' && (
        <div className="tab-content">
          <h2 className="section-label">Event Timeline</h2>
          <div className="empty-room-state card">
            <p>Your claim timeline will appear here as you log events and updates.</p>
          </div>
        </div>
      )}

      {activeTab === 'Claim Status' && (
        <div className="tab-content">
          <h2 className="section-label">Claim Status</h2>
          <div className="claim-steps card">
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
        </div>
      )}
    </div>
  )
}

export default RecoveryTracker
