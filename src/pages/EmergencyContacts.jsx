import { useState } from 'react'
import CalendarEventBar from '../components/CalendarEventBar'
import { useActiveHome } from '../context/HomeContext'
import { getHomeTitle } from '../utils/homeProfile'
import { defaultCalendarDate } from '../utils/calendar'
import './Page.css'
import './EmergencyContacts.css'

const DEFAULT_CONTACTS = [
  { id: 1, name: '', phone: '', placeholder: 'Contact' },
  { id: 2, name: '', phone: '', placeholder: 'Contact' },
  { id: 3, name: '', phone: '', placeholder: 'Contact' },
  { id: 4, name: '', phone: '', placeholder: 'Contact' },
]

function EmergencyContacts() {
  const { activeHome } = useActiveHome()
  const [contacts, setContacts] = useState(DEFAULT_CONTACTS)
  const [calendarTitle, setCalendarTitle] = useState('')
  const [calendarDate, setCalendarDate] = useState(defaultCalendarDate())
  const homeTitle = getHomeTitle(activeHome)

  const updateContact = (id, field, value) => {
    setContacts((previous) =>
      previous.map((contact) => (contact.id === id ? { ...contact, [field]: value } : contact)),
    )
  }

  const removeContact = (id) => {
    setContacts((previous) => previous.filter((contact) => contact.id !== id))
  }

  const addContact = () => {
    setContacts((previous) => [
      ...previous,
      { id: Date.now(), name: '', phone: '', placeholder: 'Contact' },
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
              />
              <div className="contact-phone-row">
                <input
                  className="contact-input phone"
                  type="tel"
                  placeholder="Phone"
                  value={contact.phone}
                  onChange={(event) => updateContact(contact.id, 'phone', event.target.value)}
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
              <button className="contact-remove-btn" type="button" onClick={() => removeContact(contact.id)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="contacts-footer-actions">
        <button className="btn-primary" type="button" onClick={addContact}>
          + Add Contact
        </button>
      </div>
    </div>
  )
}

export default EmergencyContacts
