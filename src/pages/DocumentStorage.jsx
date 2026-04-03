import { useEffect, useRef, useState } from 'react'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { Link, useSearchParams } from 'react-router-dom'
import CalendarEventBar from '../components/CalendarEventBar'
import { useAuth } from '../context/AuthContext'
import { firebaseDb, firebaseStorage } from '../firebase'
import { useActiveHome } from '../context/HomeContext'
import { getHomeTitle } from '../utils/homeProfile'
import { defaultCalendarDate } from '../utils/calendar'
import { getPageStateStorageKey, readPageState, writePageState } from '../utils/pageStateStorage'
import { buildSavedPropertyId } from '../utils/propertyStorage'
import './Page.css'
import './DocumentStorage.css'

const SAMPLE_DOCS = []

const BASE_DOC_TYPES = ['Insurance Policy', 'Warranty', 'Inspection', 'Receipts']
const DOC_TABS = [...BASE_DOC_TYPES, 'Other']
const DOCUMENTS_DOC_ID = 'items'

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

function resolveUploadType(activeType, file) {
  if (BASE_DOC_TYPES.includes(activeType)) {
    return activeType
  }

  const inferredType = inferDocType(file)
  return inferredType === 'Document' ? 'Other' : inferredType
}

function slugifySegment(value) {
  return (value || 'file')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'file'
}

function sanitizeDocs(docs) {
  return docs.map(({ id, name, type, date, size, storagePath, url }) => ({
    id,
    name,
    type,
    date,
    size,
    storagePath: storagePath || '',
    url: url || '',
  }))
}

function DocumentStorage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAuthenticated, user } = useAuth()
  const { activeHome } = useActiveHome()
  const [docs, setDocs] = useState(SAMPLE_DOCS)
  const [calendarTitle, setCalendarTitle] = useState('')
  const [calendarDate, setCalendarDate] = useState(defaultCalendarDate())
  const fileInputRef = useRef(null)
  const hydratedRef = useRef(false)
  const skipRemoteWriteRef = useRef(false)
  const storageKey = getPageStateStorageKey('documents', user?.uid, activeHome)
  const propertyId = activeHome?.savedPropertyId || (activeHome ? buildSavedPropertyId(activeHome) : '')

  const normalizedDocs = docs.map((doc) => ({ ...doc, type: normalizeDocType(doc.type) }))
  const otherDocs = normalizedDocs.filter((doc) => !BASE_DOC_TYPES.includes(doc.type))
  const homeTitle = getHomeTitle(activeHome)
  const docTabs = DOC_TABS
  const typeParam = searchParams.get('type')
  const initialType = docTabs.includes(typeParam) ? typeParam : BASE_DOC_TYPES[0]
  const [activeType, setActiveType] = useState(initialType)

  useEffect(() => {
    let cancelled = false
    hydratedRef.current = false

    const hydrate = async () => {
      if (!storageKey) {
        setDocs(SAMPLE_DOCS)
        setCalendarTitle('')
        setCalendarDate(defaultCalendarDate())
        hydratedRef.current = true
        return
      }

      const storedState = readPageState(storageKey)

      if (!cancelled) {
        setDocs(Array.isArray(storedState?.docs) ? storedState.docs : SAMPLE_DOCS)
        setCalendarTitle(storedState?.calendarTitle || '')
        setCalendarDate(storedState?.calendarDate || defaultCalendarDate())
      }

      if (firebaseDb && isAuthenticated && user?.uid && propertyId) {
        try {
          const snapshot = await getDoc(doc(firebaseDb, 'users', user.uid, 'properties', propertyId, 'documents', DOCUMENTS_DOC_ID))

          if (!cancelled && snapshot.exists()) {
            const remoteState = snapshot.data()
            skipRemoteWriteRef.current = true
            setDocs(Array.isArray(remoteState?.docs) ? remoteState.docs : SAMPLE_DOCS)
            setCalendarTitle(remoteState?.calendarTitle || '')
            setCalendarDate(remoteState?.calendarDate || defaultCalendarDate())
          }
        } catch (error) {
          console.warn('Documents sync is not ready yet.', error)
        }
      }

      hydratedRef.current = true
    }

    hydrate()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, propertyId, storageKey, user?.uid])

  useEffect(() => {
    if (!storageKey || !hydratedRef.current) {
      return
    }

    writePageState(storageKey, {
      docs: docs.map(({ file, ...doc }) => doc),
      calendarTitle,
      calendarDate,
    })
  }, [calendarDate, calendarTitle, docs, storageKey])

  useEffect(() => {
    if (!hydratedRef.current || !firebaseDb || !isAuthenticated || !user?.uid || !propertyId) {
      return
    }

    if (skipRemoteWriteRef.current) {
      skipRemoteWriteRef.current = false
      return
    }

    const syncDocumentsState = async () => {
      try {
        await setDoc(
          doc(firebaseDb, 'users', user.uid, 'properties', propertyId, 'documents', DOCUMENTS_DOC_ID),
          {
            docs: sanitizeDocs(docs),
            calendarTitle,
            calendarDate,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        )
      } catch (error) {
        console.warn('Documents save is not ready yet.', error)
      }
    }

    syncDocumentsState()
  }, [calendarDate, calendarTitle, docs, isAuthenticated, propertyId, user?.uid])

  const addFiles = async (files) => {
    const selectedFiles = Array.from(files)

    if (!selectedFiles.length) return

    const uploadedDocs = await Promise.all(selectedFiles.map(async (file, index) => {
      const nextDoc = {
        id: `${Date.now()}-${index}-${file.name}`,
        name: file.name,
        type: resolveUploadType(activeType, file),
        date: new Date().toISOString().slice(0, 10),
        size: formatFileSize(file.size),
        file,
      }

      if (!firebaseStorage || !isAuthenticated || !user?.uid || !propertyId) {
        return nextDoc
      }

      try {
        const storagePath = `user_uploads/${user.uid}/properties/${propertyId}/documents/${slugifySegment(nextDoc.type)}/${Date.now()}-${slugifySegment(file.name)}`
        const storageRef = ref(firebaseStorage, storagePath)
        await uploadBytes(storageRef, file)
        const url = await getDownloadURL(storageRef)

        return {
          ...nextDoc,
          storagePath,
          url,
        }
      } catch (error) {
        console.warn('Document upload is not ready yet.', error)
        return nextDoc
      }
    }))

    setDocs((current) => [...uploadedDocs, ...current])
  }

  const handleDelete = async (docId) => {
    const targetDoc = docs.find((item) => item.id === docId)
    const nextDocs = docs.filter((item) => item.id !== docId)
    setDocs(nextDocs)

    if (targetDoc?.storagePath && firebaseStorage) {
      try {
        await deleteObject(ref(firebaseStorage, targetDoc.storagePath))
      } catch (error) {
        console.warn('Document delete is not ready yet.', error)
      }
    }
  }

  const handleFileChange = async (event) => {
    await addFiles(event.target.files ?? [])
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
      } else if (doc.url) {
        window.open(doc.url, '_blank', 'noopener,noreferrer')
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

      <div className="section-header document-section-header">
        <h3 className="section-label doc-category-title">{activeType}</h3>
      </div>

      <input
        ref={fileInputRef}
        className="file-input-hidden"
        type="file"
        accept="image/*,.pdf,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        multiple
        onChange={handleFileChange}
      />

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
                <div className="doc-actions">
                  {isAuthenticated ? (
                    <>
                      <button className="doc-action" aria-label={`Share ${doc.name}`} onClick={() => handleShare(doc)}>
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <circle cx="18" cy="5" r="3" />
                          <circle cx="6" cy="12" r="3" />
                          <circle cx="18" cy="19" r="3" />
                          <path d="M8.6 13.5l6.8 4" />
                          <path d="M15.4 6.5l-6.8 4" />
                        </svg>
                      </button>
                      <button
                        className="doc-delete"
                        type="button"
                        aria-label={`Delete ${doc.name}`}
                        onClick={() => handleDelete(doc.id)}
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <Link className="doc-action" aria-label={`Upgrade to share ${doc.name}`} to="/upgrade">
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <path d="M8.6 13.5l6.8 4" />
                        <path d="M15.4 6.5l-6.8 4" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="document-bottom-action">
        <div className="document-upload-block">
          {isAuthenticated ? (
            <button className="btn-outline upload-single-btn" onClick={() => fileInputRef.current?.click()}>
              Upload
            </button>
          ) : (
            <Link className="btn-outline upload-single-btn" to="/upgrade">
              Upload
            </Link>
          )}
          <p className="document-upload-note">Add JPG, PNG, PDF, Word</p>
        </div>
      </div>
    </div>
  )
}

export default DocumentStorage
