import { useEffect, useRef, useState } from 'react'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import CalendarEventBar from '../components/CalendarEventBar'
import { useAuth } from '../context/AuthContext'
import { firebaseDb } from '../firebase'
import { useActiveHome } from '../context/HomeContext'
import { getHomeTitle } from '../utils/homeProfile'
import { defaultCalendarDate } from '../utils/calendar'
import { getPageStateStorageKey, readPageState, writePageState } from '../utils/pageStateStorage'
import { buildSavedPropertyId } from '../utils/propertyStorage'
import './Page.css'
import './EmergencyContacts.css'

const DEFAULT_CONTACTS = [
  { id: 1, name: '', phone: '', placeholder: 'Insurance agent', isSaved: false },
  { id: 2, name: '', phone: '', placeholder: 'Contractor', isSaved: false },
  { id: 3, name: '', phone: '', placeholder: 'Plumber', isSaved: false },
  { id: 4, name: '', phone: '', placeholder: 'Electrician', isSaved: false },
]

const CONTACT_PLACEHOLDERS = [
  'Insurance agent',
  'Contractor',
  'Plumber',
  'Electrician',
  'Roofer',
  'HVAC',
  'Restoration company',
  'Utility company',
]

const CONTACTS_DOC_ID = 'items'

function createDefaultContacts() {
  return DEFAULT_CONTACTS.map((contact) => ({ ...contact }))
}

function normalizeContacts(contacts) {
  if (!Array.isArray(contacts)) {
    return createDefaultContacts()
  }

  if (!contacts.length) {
    return []
  }

  return contacts.map((contact, index) => ({
    id: contact.id ?? `${Date.now()}-${index}`,
    name: contact.name || '',
    phone: contact.phone || '',
    placeholder: contact.placeholder || CONTACT_PLACEHOLDERS[index % CONTACT_PLACEHOLDERS.length],
    isSaved: contact.isSaved ?? true,
  }))
}

function sanitizeContacts(contacts) {
  return contacts.map(({ id, name, phone, placeholder }) => ({
    id,
    name,
    phone,
    placeholder,
  }))
}

function EmergencyContacts() {
  const { isAuthenticated, user } = useAuth()
  const { activeHome } = useActiveHome()
  const [contacts, setContacts] = useState(createDefaultContacts)
  const [calendarTitle, setCalendarTitle] = useState('')
  const [calendarDate, setCalendarDate] = useState(defaultCalendarDate())
  const homeTitle = getHomeTitle(activeHome)
  const hydratedRef = useRef(false)
  const storageKey = getPageStateStorageKey('contacts', user?.uid, activeHome)
  const propertyId = activeHome?.savedPropertyId || (activeHome ? buildSavedPropertyId(activeHome) : '')

  useEffect(() => {
    let cancelled = false
    hydratedRef.current = false

    const hydrate = async () => {
      if (!storageKey) {
        setContacts(createDefaultContacts())
        setCalendarTitle('')
        setCalendarDate(defaultCalendarDate())
        hydratedRef.current = true
        return
      }

      const storedState = readPageState(storageKey)
      const fallbackContacts = normalizeContacts(storedState?.contacts)

      if (!cancelled) {
        setContacts(fallbackContacts)
        setCalendarTitle(storedState?.calendarTitle || '')
        setCalendarDate(storedState?.calendarDate || defaultCalendarDate())
      }

      if (firebaseDb && isAuthenticated && user?.uid && propertyId) {
        try {
          const snapshot = await getDoc(doc(firebaseDb, 'users', user.uid, 'properties', propertyId, 'contacts', CONTACTS_DOC_ID))

          if (!cancelled && snapshot.exists()) {
            setContacts(normalizeContacts(snapshot.data()?.contacts))
          }
        } catch (error) {
          console.warn('Contacts sync is not ready yet.', error)
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
      contacts,
      calendarTitle,
      calendarDate,
    })
  }, [calendarDate, calendarTitle, contacts, storageKey])

  const persistContacts = async (nextContacts) => {
    if (!firebaseDb || !isAuthenticated || !user?.uid || !propertyId) {
      return
    }

    try {
      await setDoc(
        doc(firebaseDb, 'users', user.uid, 'properties', propertyId, 'contacts', CONTACTS_DOC_ID),
        {
          contacts: sanitizeContacts(nextContacts),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
    } catch (error) {
      console.warn('Contacts save is not ready yet.', error)
    }
  }

  const updateContact = (id, field, value) => {
    setContacts((previous) =>
      previous.map((contact) =>
        contact.id === id ? { ...contact, [field]: value, isSaved: false } : contact,
      ),
    )
  }

  const saveContact = async (id) => {
    const nextContacts = contacts.map((contact) => (contact.id === id ? { ...contact, isSaved: true } : contact))
    setContacts(nextContacts)
    await persistContacts(nextContacts)
  }

  const removeContact = async (id) => {
    const nextContacts = contacts.filter((contact) => contact.id !== id)
    setContacts(nextContacts)
    await persistContacts(nextContacts)
  }

  const addContact = () => {
    setContacts((previous) => [
      ...previous,
      {
        id: Date.now(),
        name: '',
        phone: '',
        placeholder: CONTACT_PLACEHOLDERS[previous.length % CONTACT_PLACEHOLDERS.length],
        isSaved: false,
      },
    ])
  }

  return (
    <div className="page">
      <h1 className="page-title">Contacts</h1>

      <div className="page-utility-bar">
        <CalendarEventBar
          title={calendarTitle}
          setTitle={setCalendarTitle}
          date={calendarDate}
          setDate={setCalendarDate}
          defaultTitle={homeTitle ? `Contact Reminder - ${homeTitle}` : 'Contact Reminder'}
          details={homeTitle ? `Contact reminder for ${homeTitle} in FortressForesight.` : 'Contact reminder in FortressForesight.'}
          dateAriaLabel="Contact date"
        />
      </div>

      <div className="contacts-list">
        {contacts.map((contact) => (
          <div key={contact.id} className="contact-card card">
            <div className="contact-fields">
              <input
                className="contact-input"
                type="text"
                placeholder={contact.placeholder || 'Contact'}
                value={contact.name}
                onChange={(event) => updateContact(contact.id, 'name', event.target.value)}
                disabled={!isAuthenticated}
              />
              <div className="contact-phone-row">
                <input
                  className="contact-input phone"
                  type="tel"
                  placeholder="Phone"
                  value={contact.phone}
                  onChange={(event) => updateContact(contact.id, 'phone', event.target.value)}
                  disabled={!isAuthenticated}
                />
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="call-btn">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91A16 16 0 0 0 15.09 16l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    Call
                  </a>
                )}
              </div>
            </div>
            <div className="contact-card-actions">
              {isAuthenticated ? (
                <button className={`contact-save-btn${contact.isSaved ? ' is-saved' : ''}`} type="button" onClick={() => saveContact(contact.id)}>
                  {contact.isSaved ? 'Saved' : 'Save'}
                </button>
              ) : (
                <Link className="contact-save-btn" to="/upgrade">
                  Save
                </Link>
              )}
              {isAuthenticated ? (
                <button className="contact-remove-btn" type="button" onClick={() => removeContact(contact.id)}>
                  Remove
                </button>
              ) : (
                <Link className="contact-remove-btn" to="/upgrade">
                  Remove
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="contacts-footer-actions">
        {isAuthenticated ? (
          <button className="btn-outline contact-add-btn" type="button" onClick={addContact}>
            + Add Contact
          </button>
        ) : (
          <Link className="btn-outline contact-add-btn" to="/upgrade">
            + Add Contact
          </Link>
        )}
      </div>
    </div>
  )
}

export default EmergencyContacts
