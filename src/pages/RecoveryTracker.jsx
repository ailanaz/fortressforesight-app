import { useState } from 'react'
import CalendarEventBar from '../components/CalendarEventBar'
import { useActiveHome } from '../context/HomeContext'
import { getHomeTitle } from '../utils/homeProfile'
import { defaultCalendarDate } from '../utils/calendar'
import './Page.css'
import './RecoveryTracker.css'

function RecoveryTracker() {
  const { activeHome } = useActiveHome()
  const [damageScope, setDamageScope] = useState('Interior')
  const [calendarTitle, setCalendarTitle] = useState('')
  const [calendarDate, setCalendarDate] = useState(defaultCalendarDate(7))
  const homeTitle = getHomeTitle(activeHome)

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

      <h2 className="section-label recovery-tracker-title">Tracker</h2>
      <p className="page-subtitle">
        Document damage, log expenses, and track your claim from start to finish.
      </p>

      <div className="recovery-sections-grid">
        <section className="recovery-panel">
          <h2 className="section-label">Damage Log</h2>
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
              {damageScope === 'Interior' ? 'Damage by Room' : 'Exterior Damage'}
            </h3>
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
        </section>

        <section className="recovery-panel">
          <h2 className="section-label">Timeline</h2>
          <div className="empty-room-state">
            <p>Your claim timeline will appear here as you log events and updates.</p>
          </div>
        </section>

        <section className="recovery-panel">
          <div className="section-header">
            <h2 className="section-label">Expenses</h2>
            <button className="btn-primary">+ Add Expense</button>
          </div>
          <div className="empty-room-state">
            <p>No expenses logged yet.</p>
            <p>Log every cost with a receipt photo - hotels, meals, emergency repairs, supplies.</p>
          </div>
        </section>

        <section className="recovery-panel">
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
    </div>
  )
}

export default RecoveryTracker
