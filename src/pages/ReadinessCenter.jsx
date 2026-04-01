import { useState } from 'react'
import { useActiveHome } from '../context/HomeContext'
import { getHomeLocation, getHomeTitle } from '../utils/homeProfile'
import { defaultCalendarDate, downloadCalendarInvite } from '../utils/calendar'
import './Page.css'
import './ReadinessCenter.css'

const CHECKLIST_SECTIONS = [
  { id: 'homebuyers', label: 'Homebuying Checklists' },
  { id: 'homeowners', label: 'Homeowner Checklists' },
  { id: 'disasters', label: 'Disaster Preparedness' },
]

const PREMADE_CHECKLISTS = [
  {
    id: 'pre-purchase-inspection',
    section: 'homebuyers',
    title: 'Pre-Purchase Inspection',
    description: 'Core systems and structure to verify before you close',
    items: [
      'Foundation cracks and movement',
      'Grading and drainage away from the home',
      'Roof covering condition',
      'Roof age and repair history',
      'Attic leaks, ventilation, and insulation gaps',
      'HVAC operation',
      'HVAC age and service history',
      'Plumbing lines and fixtures',
      'Water heater age and leak signs',
      'Electrical panel and grounding',
      'Outlets and switches',
      'Moisture, mold, or pest signs',
    ],
  },
  {
    id: 'title-deed-verification',
    section: 'homebuyers',
    title: 'Title & Deed Verification',
    description: 'Confirm ownership and uncover legal restrictions before closing',
    items: [
      'Seller ownership and title record match',
      'Recorded liens',
      'Utility and access easements',
      'Deed restrictions',
      'Encumbrances',
      'Legal access to the property and driveway',
      'Survey or boundary issues',
      'HOA or association obligations',
      'Parcel and legal description match',
    ],
  },
  {
    id: 'neighborhood-assessment',
    section: 'homebuyers',
    title: 'Neighborhood Assessment',
    description: 'Review the area around the home before you commit',
    items: [
      'Local crime patterns',
      'Nearby fire, police, and medical access',
      'Airport, rail, highway, or industrial noise exposure',
      'Future development plans',
    ],
  },
  {
    id: 'insurance-adequacy-review',
    section: 'homebuyers',
    title: 'Insurance Adequacy Review',
    description: 'Check what coverage may be needed before purchase',
    items: [
      'Homeowners insurance quotes',
      'Dwelling coverage adequacy',
      'Replacement cost assumptions',
      'Wind and hail deductibles',
      'Flood coverage need',
      'Earthquake coverage need',
      'Water backup or sewer backup options',
      'Prior claims or loss history',
      'Major exclusions and coverage caps',
    ],
  },
  {
    id: 'seasonal',
    section: 'homeowners',
    title: 'Seasonal Maintenance',
    description: 'Annual tasks to keep your home protected',
    items: [
      'Gutters',
      'Downspouts',
      'Tree limbs near the roof',
      'HVAC servicing',
      'HVAC filters',
      'Smoke detectors',
      'Carbon monoxide detectors',
      'Smoke detector batteries',
      'Roof damage',
      'Exterior drainage',
      'Grading around the home',
      'Weather seals',
      'Caulking',
      'Sump pump operation',
    ],
  },
  {
    id: 'emergency-preparedness',
    section: 'homeowners',
    title: 'Emergency Preparedness',
    description: 'Keep emergency supplies and plans ready before a loss',
    items: [
      'Emergency contacts',
      'Insurance policy numbers',
      'Claim phone numbers',
      'Gas shutoff location',
      'Water shutoff location',
      'Electric shutoff location',
      'Household evacuation routes',
    ],
  },
  {
    id: 'home-safety-audit',
    section: 'homeowners',
    title: 'Home Safety Checks',
    description: 'Review essential safety systems and basic security',
    items: [
      'Smoke detectors on every level',
      'Smoke detectors in every bedroom',
      'Smoke detector operation',
      'Carbon monoxide detectors where the home uses gas',
      'Carbon monoxide detector operation',
      'Fire extinguisher expiration date',
      'Visible house numbers',
    ],
  },
  {
    id: 'storm-preparedness',
    section: 'disasters',
    title: 'Storm Preparedness',
    description: 'What to secure, inspect, stock, and save before a storm.',
    items: [
      'Outdoor furniture and loose items',
      'Roof',
      'Flashing',
      'Gutters',
      'Weak branches near the home',
    ],
  },
  {
    id: 'hail-preparedness',
    section: 'disasters',
    title: 'Hail Preparedness',
    description: 'What to inspect and protect before hail season.',
    items: [
      'Roof covering',
      'Skylights',
      'Siding vulnerable areas',
      'Covered parking access',
      'Vehicle protection plan',
      'Windows',
      'Exterior fixtures',
      'Attic leak signs',
      'Current exterior condition photos',
    ],
  },
  {
    id: 'flood-preparedness',
    section: 'disasters',
    title: 'Flood Preparedness',
    description: 'What to check and move before flooding becomes a risk.',
    items: [
      'Flood zone',
      'Drainage around the home',
      'Nearby storm drains and swales',
      'Sump pump operation',
      'Low-entry points',
      'Vent exposure',
      'Basement exposure',
      'Storage above likely water level',
      'Gas and electric shutoffs',
    ],
  },
  {
    id: 'wildfire-preparedness',
    section: 'disasters',
    title: 'Wildfire Preparedness',
    description: 'What to clear, inspect, and pack before wildfire season.',
    items: [
      '0-5 foot non-combustible zone around the home',
      'Leaves on the roof and gutters',
      'Woodpiles near the home',
      'Dead plants and pine needles',
      'Spacing between shrubs',
      'Overhanging branches',
      'Low-hanging branches',
      'Debris near the home',
      'Vents',
      'Eaves',
      'Ember entry points',
      '1/8-inch mesh on attic vents',
      '1/8-inch mesh on under-deck vents',
    ],
  },
  {
    id: 'earthquake-preparedness',
    section: 'disasters',
    title: 'Earthquake Preparedness',
    description: 'What to secure and locate before an earthquake hits.',
    items: [
      'Seismic retrofitting need',
      'Water heaters',
      'Shelves',
      'Heavy furniture',
      'Televisions and hanging objects',
      'Gas shutoff location',
      'Water shutoff location',
      'Shutoff tool',
    ],
  },
]

const CUSTOM_STARTER_CHECKLISTS = [
  {
    id: 'my-emergency-planning',
    title: 'My Emergency Planning and Kits',
    description: 'Starter custom checklist',
    items: [
      'Three days of food',
      'Three days of water',
      'Lights',
      'Batteries',
      'First aid supplies',
      'Medications and backup prescriptions',
      'Emergency contacts',
      'Family meeting spots',
      'Insurance policy numbers',
      'Two ways out of every room',
      'Fire drills twice a year',
    ],
  },
]

function ChecklistItem({ text, done, onToggle }) {
  return (
    <li className={`checklist-item${done ? ' done' : ''}`} onClick={onToggle}>
      <span className="checklist-checkbox">
        {done ? (
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : null}
      </span>
      <span className="checklist-text">{text}</span>
    </li>
  )
}

function Checklist({ checklist }) {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState({})

  const toggleItem = (index) =>
    setDone((previous) => ({ ...previous, [index]: !previous[index] }))

  const doneCount = Object.values(done).filter(Boolean).length

  return (
    <div className="checklist-card card">
      <div className="checklist-header" onClick={() => setOpen((value) => !value)}>
        <div>
          <div className="checklist-title">{checklist.title}</div>
        </div>
        <div className="checklist-progress">
          <span>
            {doneCount}/{checklist.items.length}
          </span>
          <svg
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
      {open && (
        <ul className="checklist-items">
          {checklist.items.map((item, index) => (
            <ChecklistItem
              key={item}
              text={item}
              done={!!done[index]}
              onToggle={() => toggleItem(index)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function CustomChecklist({ checklist }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(checklist.title)
  const [done, setDone] = useState({})
  const [items, setItems] = useState(
    checklist.items.map((text, index) => ({
      id: `${checklist.id}-${index}`,
      text,
    })),
  )
  const [newItem, setNewItem] = useState('')

  const toggleItem = (id) =>
    setDone((previous) => ({ ...previous, [id]: !previous[id] }))

  const removeItem = (id) => {
    setItems((previous) => previous.filter((item) => item.id !== id))
    setDone((previous) => {
      const updated = { ...previous }
      delete updated[id]
      return updated
    })
  }

  const addItem = () => {
    const trimmed = newItem.trim()
    if (!trimmed) return

    setItems((previous) => [
      ...previous,
      {
        id: `${checklist.id}-${Date.now()}`,
        text: trimmed,
      },
    ])
    setNewItem('')
    setOpen(true)
  }

  const doneCount = items.filter((item) => done[item.id]).length

  return (
    <div className="checklist-card card">
      <div className="checklist-header" onClick={() => setOpen((value) => !value)}>
        <div>
          <div className="checklist-title">{title}</div>
        </div>
        <div className="checklist-progress">
          <span>
            {doneCount}/{items.length}
          </span>
          <svg
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
      {open && (
        <>
          <div className="custom-checklist-title-edit">
            <input
              className="page-input page-input-wide"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="List title"
              aria-label="Custom checklist title"
            />
          </div>
          <ul className="checklist-items">
            {items.map((item) => (
              <li key={item.id} className={`checklist-item${done[item.id] ? ' done' : ''}`}>
                <button className="checklist-item-main" type="button" onClick={() => toggleItem(item.id)}>
                  <span className="checklist-checkbox">
                    {done[item.id] ? (
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    ) : null}
                  </span>
                  <span className="checklist-text">{item.text}</span>
                </button>
                <button className="checklist-remove" type="button" onClick={() => removeItem(item.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="custom-checklist-add">
            <input
              className="page-input page-input-wide"
              type="text"
              value={newItem}
              onChange={(event) => setNewItem(event.target.value)}
              placeholder="Add item"
              aria-label="Add custom checklist item"
            />
            <button className="btn-outline" type="button" onClick={addItem}>
              Add
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function ReadinessCenter() {
  const { activeHome } = useActiveHome()
  const homeTitle = getHomeTitle(activeHome)
  const homeLocation = getHomeLocation(activeHome)
  const [calendarTitle, setCalendarTitle] = useState('')
  const [calendarDate, setCalendarDate] = useState(defaultCalendarDate())

  return (
    <div className="page">
      <h1 className="page-title readiness-page-title">Readiness Center</h1>

      {activeHome ? (
        <div className="active-home-card card">
          <div className="active-home-copy">
            <span className="active-home-title">{homeTitle}</span>
            {homeLocation ? <span className="active-home-meta">{homeLocation}</span> : null}
            <span className="active-home-note">
              Use the Property Readiness Checklists to proactively identify risks, streamline recovery, and stay ahead of potential losses.
            </span>
          </div>
        </div>
      ) : null}

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
            aria-label="Readiness review date"
          />
          <button
            className="btn-outline"
            type="button"
            onClick={() =>
              downloadCalendarInvite({
                title: calendarTitle.trim() || (homeTitle ? `Property Readiness Review - ${homeTitle}` : 'Property Readiness Review'),
                date: calendarDate,
                details: 'Review your property readiness checklists in FortressForesight.',
              })
            }
          >
            Save to Calendar
          </button>
        </div>
      </div>

      <h2 className="section-label readiness-checklists-label">Property Readiness Checklists</h2>

      <div className="readiness-grid">
        {CHECKLIST_SECTIONS.map((section) => {
          const sectionChecklists = PREMADE_CHECKLISTS.filter((checklist) => checklist.section === section.id)

          if (!sectionChecklists.length) {
            return null
          }

          return (
            <section key={section.id} className="readiness-group-card card">
              <h3 className="section-label readiness-group-label">{section.label}</h3>
              {section.id === 'disasters' ? (
                <p className="readiness-group-note">
                  These cover the most common situations.
                </p>
              ) : null}
              <div className="readiness-group-content">
                {sectionChecklists.map((checklist) => (
                  <Checklist key={checklist.id} checklist={checklist} />
                ))}
              </div>
            </section>
          )
        })}

        <section className="readiness-group-card readiness-custom-card card">
          <h3 className="section-label readiness-group-label">Custom Checklists</h3>
          <div className="readiness-custom-content">
            {CUSTOM_STARTER_CHECKLISTS.map((checklist) => (
              <CustomChecklist key={checklist.id} checklist={checklist} />
            ))}
          </div>
          <div className="readiness-custom-actions">
            <button className="btn-outline">Add Custom List</button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default ReadinessCenter
