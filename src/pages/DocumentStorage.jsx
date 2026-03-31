import { useRef, useState } from 'react'
import { useActiveHome } from '../context/HomeContext'
import { getHomeLocation, getHomeTitle } from '../utils/homeProfile'
import { defaultCalendarDate, downloadCalendarInvite } from '../utils/calendar'
import './Page.css'
import './DocumentStorage.css'

const SAMPLE_DOCS = [
  { id: 1, name: 'Home Insurance Policy 2024.pdf', type: 'Insurance Policy', date: '2024-01-15', size: '2.4 MB' },
  { id: 2, name: 'Roof Inspection Report.pdf', type: 'Inspection', date: '2023-11-03', size: '1.1 MB' },
  { id: 3, name: 'HVAC Warranty.pdf', type: 'Warranty', date: '2023-06-20', size: '340 KB' },
]

const BASE_DOC_TYPES = ['Insurance Policy', 'Warranty', 'Inspection', 'Receipts']

function formatFileSize(bytes) {
  if (!bytes) return '0 KB'
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function normalizeDocType(type) {
  if (type === 'Receipt') return 'Receipts'
  return type
}

function inferDocType(file) {
  if (file.type.startsWith('image/')) return 'Photo'
  if (file.type === 'application/pdf') return 'PDF'
  if (file.type.includes('word') || file.name.match(/\.(doc|docx)$/i)) return 'Document'
  return 'Document'
}

function DocumentStorage() {
  const { activeHome } = useActiveHome()
  const [filter, setFilter] = useState('All')
  const [docs, setDocs] = useState(SAMPLE_DOCS)
  const [calendarTitle, setCalendarTitle] = useState('')
  const [calendarDate, setCalendarDate] = useState(defaultCalendarDate())
  const fileInputRef = useRef(null)

  const normalizedDocs = docs.map((doc) => ({ ...doc, type: normalizeDocType(doc.type) }))
  const docTypes = [...new Set([...BASE_DOC_TYPES, ...normalizedDocs.map((doc) => doc.type)])]
  const filtered = filter === 'All' ? normalizedDocs : normalizedDocs.filter((doc) => doc.type === filter)
  const homeTitle = getHomeTitle(activeHome)
  const homeLocation = getHomeLocation(activeHome)

  const addFiles = (files) => {
    const nextDocs = Array.from(files).map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      name: file.name,
      type: inferDocType(file),
      date: new Date().toISOString().slice(0, 10),
      size: formatFileSize(file.size),
      file,
    }))

    if (!nextDocs.length) return
    setDocs((current) => [...nextDocs, ...current])
  }

  const handleFileChange = (event) => {
    addFiles(event.target.files ?? [])
    event.target.value = ''
  }

  const handleShare = async (doc) => {
    try {
      if (navigator.share) {
        if (doc.file && navigator.canShare?.({ files: [doc.file] })) {
          await navigator.share({ title: doc.name, files: [doc.file] })
          return
        }

        await navigator.share({
          title: doc.name,
          text: `${doc.name} • ${doc.type}`,
        })
        return
      }

      if (doc.file) {
        const url = URL.createObjectURL(doc.file)
        window.open(url, '_blank', 'noopener,noreferrer')
        setTimeout(() => URL.revokeObjectURL(url), 1500)
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error('Share failed', error)
      }
    }
  }

  const handleSaveToCalendar = () => {
    const title = calendarTitle.trim() || (homeTitle ? `Document Reminder - ${homeTitle}` : 'Document Reminder')
    const details = homeTitle ? `Document reminder for ${homeTitle} in FortressForesight.` : 'Document reminder in FortressForesight.'

    downloadCalendarInvite({ title, date: calendarDate, details })
  }

  return (
    <div className="page">
      <h1 className="page-title document-vault-title">Document Vault</h1>

      {activeHome ? (
        <div className="active-home-card card">
          <div className="active-home-copy">
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
            <span className="active-home-title">Pick a home first</span>
            <span className="active-home-note">
              Search an address in Property Search and this vault will follow that home across the app.
            </span>
          </div>
        </div>
      )}

      <div className="page-utility-bar">
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
            aria-label="Document reminder date"
          />
          <button className="btn-outline" type="button" onClick={handleSaveToCalendar}>
            Save to Calendar
          </button>
        </div>
      </div>

      <h1 className="page-title">Documents</h1>
      <input
        ref={fileInputRef}
        className="file-input-hidden"
        type="file"
        accept="image/*,.pdf,application/pdf"
        multiple
        onChange={handleFileChange}
      />

      <div className="filter-tabs">
        {['All', ...docTypes].map((type) => (
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
            <button className="doc-action" aria-label={`Share ${doc.name}`} onClick={() => handleShare(doc)}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path d="M8.6 13.5l6.8 4" />
                <path d="M15.4 6.5l-6.8 4" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="upload-area">
        <p>{activeHome ? `Add files for ${homeTitle}.` : 'Upload files for the selected home.'}</p>
        <p className="upload-note">PDF, JPG, JPEG, PNG</p>
        <button className="btn-outline upload-single-btn" onClick={() => fileInputRef.current?.click()}>
          Upload
        </button>
      </div>
    </div>
  )
}

export default DocumentStorage
