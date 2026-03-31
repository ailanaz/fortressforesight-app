import { useState } from 'react'
import './Page.css'
import './PropertyProfile.css'

const RISK_LEVELS = {
  low: { label: 'Low Risk', color: '#16a34a', bg: '#dcfce7' },
  moderate: { label: 'Moderate Risk', color: '#ca8a04', bg: '#fef9c3' },
  high: { label: 'High Risk', color: '#dc2626', bg: '#fee2e2' },
}

function RiskBadge({ level }) {
  const risk = RISK_LEVELS[level] || RISK_LEVELS.low

  return (
    <span className="risk-badge" style={{ color: risk.color, background: risk.bg }}>
      {risk.label}
    </span>
  )
}

function PropertyProfile() {
  const [lookupMode, setLookupMode] = useState('address')
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()

    if (query.trim()) {
      setSubmittedQuery(query.trim())
    }
  }

  const inputLabel =
    lookupMode === 'address' ? 'Property address' : 'ZIP code'
  const inputPlaceholder =
    lookupMode === 'address' ? '123 Main St, City, State ZIP' : 'Enter ZIP code'

  return (
    <div className="page">
      <h1 className="page-title">Property Profile</h1>
      <p className="page-subtitle">
        Enter your property address or ZIP code to get your risk overview.
      </p>

      <div className="lookup-toggle" role="tablist" aria-label="Property lookup type">
        <button
          type="button"
          className={`lookup-toggle-button${lookupMode === 'address' ? ' active' : ''}`}
          onClick={() => {
            setLookupMode('address')
            setQuery('')
          }}
        >
          Address
        </button>
        <button
          type="button"
          className={`lookup-toggle-button${lookupMode === 'zip' ? ' active' : ''}`}
          onClick={() => {
            setLookupMode('zip')
            setQuery('')
          }}
        >
          ZIP code
        </button>
      </div>

      <form className="address-form" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="property-lookup">
          {inputLabel}
        </label>
        <input
          id="property-lookup"
          className="address-input"
          type="text"
          inputMode={lookupMode === 'zip' ? 'numeric' : 'text'}
          maxLength={lookupMode === 'zip' ? 5 : undefined}
          placeholder={inputPlaceholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button className="btn-primary" type="submit">
          Look Up Property
        </button>
      </form>

      {submittedQuery && (
        <div className="risk-scorecard">
          <h2 className="scorecard-title">{submittedQuery}</h2>
          <p className="scorecard-note">
            Risk data pulls from FEMA and NOAA. Connect live APIs to replace
            this starter snapshot with real results.
          </p>

          <div className="risk-grid">
            <div className="risk-card">
              <span className="risk-label">Flood Zone</span>
              <RiskBadge level="moderate" />
              <span className="risk-detail">Zone AE - Special Flood Hazard Area</span>
            </div>
            <div className="risk-card">
              <span className="risk-label">Wildfire Risk</span>
              <RiskBadge level="low" />
              <span className="risk-detail">Minimal vegetation, urban area</span>
            </div>
            <div className="risk-card">
              <span className="risk-label">Storm Risk</span>
              <RiskBadge level="moderate" />
              <span className="risk-detail">Moderate wind exposure</span>
            </div>
            <div className="risk-card">
              <span className="risk-label">Overall</span>
              <RiskBadge level="moderate" />
              <span className="risk-detail">Review flood and storm coverage</span>
            </div>
          </div>

          <div className="property-actions">
            <button
              className="btn-outline"
              type="button"
              onClick={() => {
                setQuery('')
                setSubmittedQuery('')
              }}
            >
              Add Another Property
            </button>
            <button className="btn-outline" type="button">
              View Insurance Checklist
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PropertyProfile
