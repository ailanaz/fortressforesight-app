import { useState } from 'react'
import { useActiveHome } from '../context/HomeContext'
import { getHomeLocation, getHomeTitle } from '../utils/homeProfile'
import './Page.css'
import './DocumentStorage.css'

const DOC_TYPES = ['Insurance Policy', 'Receipt', 'Inspection', 'Warranty', 'Other']

const SAMPLE_DOCS = [
  { id: 1, name: 'Home Insurance Policy 2024.pdf', type: 'Insurance Policy', date: '2024-01-15', size: '2.4 MB' },
  { id: 2, name: 'Roof Inspection Report.pdf', type: 'Inspection', date: '2023-11-03', size: '1.1 MB' },
  { id: 3, name: 'HVAC Warranty.pdf', type: 'Warranty', date: '2023-06-20', size: '340 KB' },
]

function DocumentStorage() {
  const { activeHome } = useActiveHome()
  const [filter, setFilter] = useState('All')
  const [docs] = useState(SAMPLE_DOCS)

  const filtered = filter === 'All' ? docs : docs.filter((doc) => doc.type === filter)
  const homeTitle = getHomeTitle(activeHome)
  const homeLocation = getHomeLocation(activeHome)

  return (
    <div className="page">
      {activeHome ? (
        <div className="active-home-card card">
          <div className="active-home-copy">
            <span className="active-home-kicker">Document vault</span>
            <span className="active-home-title">{homeTitle}</span>
            {homeLocation ? <span className="active-home-meta">{homeLocation}</span> : null}
            <span className="active-home-note">
              Organize policies, receipts, inspections, and warranties for the home you just searched.
            </span>
          </div>
        </div>
      ) : (
        <div className="active-home-card active-home-empty card">
          <div className="active-home-copy">
            <span className="active-home-kicker">Document vault</span>
            <span className="active-home-title">Pick a home first</span>
            <span className="active-home-note">
              Search an address in Property Search and this vault will follow that home across the app.
            </span>
          </div>
        </div>
      )}

      <div className="section-header">
        <h1 className="page-title">Documents</h1>
        <button className="btn-primary upload-btn">+ Upload</button>
      </div>
      <p className="page-subtitle">
        Photos and files for your policies, receipts, inspections, and warranties.
      </p>

      <div className="filter-tabs">
        {['All', ...DOC_TYPES].map((type) => (
          <button
            key={type}
            className={`filter-tab${filter === type ? ' active' : ''}`}
            onClick={() => setFilter(type)}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="doc-list">
        {filtered.length === 0 && <div className="empty-state">No documents in this category yet.</div>}
        {filtered.map((doc) => (
          <div key={doc.id} className="doc-card card">
            <div className="doc-icon">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div className="doc-info">
              <span className="doc-name">{doc.name}</span>
              <span className="doc-meta">
                {doc.type} - {doc.date} - {doc.size}
              </span>
            </div>
            <button className="doc-action" aria-label="More options">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="upload-area">
        <p>{activeHome ? `Add files for ${homeTitle}.` : 'Drag and drop files here, or'}</p>
        <div className="upload-buttons">
          <button className="btn-outline">Choose File</button>
          <button className="btn-outline">Take Photo</button>
        </div>
      </div>
    </div>
  )
}

export default DocumentStorage
