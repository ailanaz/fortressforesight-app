import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import CalendarEventBar from '../components/CalendarEventBar'
import { useActiveHome } from '../context/HomeContext'
import { getHomeTitle } from '../utils/homeProfile'
import { defaultCalendarDate } from '../utils/calendar'
import './Page.css'
import './DocumentStorage.css'

const SAMPLE_DOCS = []

const BASE_DOC_TYPES = ['Insurance Policy', 'Warranty', 'Inspection', 'Receipts']

const MOBILE_DOC_TAB_LABELS = {
  'Insurance Policy': 'Policy',
  Warranty: 'Warranty',
  Inspection: 'Inspection',
  Receipts: 'Receipts',
  Other: 'Other',
}

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
  const lowerName = file.name.toLowerCase()

  if (lowerName.includes('insurance') || lowerName.includes('policy')) return 'Insurance Policy'
  if (lowerName.includes('warranty')) return 'Warranty'
  if (lowerName.includes('inspection') || lowerName.includes('report')) return 'Inspection'
  if (lowerName.includes('receipt') || lowerName.includes('invoice') || lowerName.includes('bill')) return 'Receipts'

  return 'Document'
}

function DocumentStorage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { activeHome } = useActiveHome()
  const [docs, setDocs] = useState(SAMPLE_DOCS)
  const [calendarTitle, setCalendarTitle] = useState('')
  const [calendarDate, setCalendarDate] = useState(defaultCalendarDate())
  const fileInputRef = useRef(null)

  const normalizedDocs = docs.map((doc) => ({ ...doc, type: normalizeDocType(doc.type) }))
  const otherDocs = normalizedDocs.filter((doc) => !BASE_DOC_TYPES.includes(doc.type))
  const homeTitle = getHomeTitle(activeHome)
  const docTabs = [...BASE_DOC_TYPES, ...(otherDocs.length ? ['Other'] : [])]
  const typeParam = searchParams.get('type')
  const initialType = docTabs.includes(typeParam) ? typeParam : BASE_DOC_TYPES[0]
  const [activeType, setActiveType] = useState(initialType)

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

  const handleTypeChange = (nextType) => {
    setActiveType(nextType)
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (nextType === BASE_DOC_TYPES[0]) {
        next.delete('type')
      } else {
        next.set('type', nextType)
      }
      return next
    }, { replace: true })
  }

  const activeDocs = activeType === 'Other'
    ? otherDocs
    : normalizedDocs.filter((doc) => doc.type === activeType)

  return (
    <div className="page">
      <h1 className="page-title document-vault-title">Document Vault</h1>

      <div className="page-utility-bar">
        <CalendarEventBar
          title={calendarTitle}
          setTitle={setCalendarTitle}
          date={calendarDate}
          setDate={setCalendarDate}
          defaultTitle={homeTitle ? `Document Reminder - ${homeTitle}` : 'Document Reminder'}
          details={homeTitle ? `Document reminder for ${homeTitle} in FortressForesight.` : 'Document reminder in FortressForesight.'}
          dateAriaLabel="Document reminder date"
        />
      </div>

      <div className="document-tabs-wrap">
        {docTabs.map((type) => (
          <button
            key={type}
            className={`document-tab${activeType === type ? ' active' : ''}`}
            onClick={() => handleTypeChange(type)}
          >
            <span className="document-tab-label-full">{type}</span>
            <span className="document-tab-label-mobile">{MOBILE_DOC_TAB_LABELS[type] || type}</span>
          </button>
        ))}
      </div>

      <div className="documents-header-spacer" aria-hidden="true" />

      <input
        ref={fileInputRef}
        className="file-input-hidden"
        type="file"
        accept="image/*,.pdf,application/pdf"
        multiple
        onChange={handleFileChange}
      />

      <div className="section-header document-section-header">
        <h3 className="section-label doc-category-title">{activeType}</h3>
        <button className="btn-outline upload-single-btn" onClick={() => fileInputRef.current?.click()}>
          Upload
        </button>
      </div>

      <div className="document-upload-note">PDF, JPG, JPEG, PNG</div>

      <section className="doc-category-card card">
        <div className="doc-category-list">
          {activeDocs.length === 0 ? (
            <div className="empty-state doc-empty-state">No files yet.</div>
          ) : (
            activeDocs.map((doc) => (
              <div key={doc.id} className="doc-card">
                <div className="doc-icon">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="doc-info">
                  <span className="doc-name">{doc.name}</span>
                  <span className="doc-meta">
                    {activeType === 'Other' ? `${doc.type} - ${doc.date} - ${doc.size}` : `${doc.date} - ${doc.size}`}
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
            ))
          )}
        </div>
      </section>
    </div>
  )
}

export default DocumentStorage
