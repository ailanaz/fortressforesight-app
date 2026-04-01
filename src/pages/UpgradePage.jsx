import { Link } from 'react-router-dom'
import './Page.css'
import './UpgradePage.css'

function UpgradePage() {
  return (
    <div className="page upgrade-page">
      <h1 className="page-title">Upgrade</h1>
      <p className="page-subtitle">Save properties, calendar events, documents, contacts, and recovery progress.</p>

      <section className="card upgrade-card">
        <div className="upgrade-list">
          <div className="upgrade-item">Save up to 2 properties</div>
          <div className="upgrade-item">Save checklist progress</div>
          <div className="upgrade-item">Save notes and calendar events</div>
          <div className="upgrade-item">Upload documents and photos</div>
          <div className="upgrade-item">Track recovery in one place</div>
        </div>

        <div className="upgrade-actions">
          <Link className="btn-primary" to="/login">
            Create Account
          </Link>
        </div>
      </section>
    </div>
  )
}

export default UpgradePage
