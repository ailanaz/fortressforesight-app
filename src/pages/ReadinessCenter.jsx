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
      'Review foundation cracks and movement',
      'Check grading and drainage away from the home',
      'Inspect roof covering condition',
      'Verify roof age and repair history',
      'Inspect attic for leaks, ventilation, and insulation gaps',
      'Test HVAC operation',
      'Verify HVAC age and service history',
      'Inspect plumbing lines and fixtures',
      'Check water heater age and leak signs',
      'Review electrical panel and grounding',
      'Test a sample of outlets and switches',
      'Check for moisture, mold, or pest signs',
    ],
  },
  {
    id: 'title-deed-verification',
    section: 'homebuyers',
    title: 'Title & Deed Verification',
    description: 'Confirm ownership and uncover legal restrictions before closing',
    items: [
      'Confirm seller ownership matches the title record',
      'Review recorded liens',
      'Check utility and access easements',
      'Review deed restrictions',
      'Review encumbrances',
      'Confirm legal access to the property and driveway',
      'Review survey or boundary issues',
      'Check HOA or association obligations',
      'Confirm parcel and legal description match the contract',
    ],
  },
  {
    id: 'neighborhood-assessment',
    section: 'homebuyers',
    title: 'Neighborhood Assessment',
    description: 'Review the area around the home before you commit',
    items: [
      'Review local crime patterns',
      'Review school ratings and attendance zoning',
      'Check commute routes and traffic patterns',
      'Check nearby fire, police, and medical access',
      'Assess nearby amenities',
      'Assess nearby services',
      'Check airport, rail, highway, or industrial noise exposure',
      'Review future development plans',
    ],
  },
  {
    id: 'insurance-adequacy-review',
    section: 'homebuyers',
    title: 'Insurance Adequacy Review',
    description: 'Check what coverage may be needed before purchase',
    items: [
      'Get homeowners insurance quotes',
      'Confirm dwelling coverage is adequate',
      'Review replacement cost assumptions',
      'Review wind and hail deductibles',
      'Check whether flood coverage is needed',
      'Check whether earthquake coverage is needed',
      'Check water backup or sewer backup options',
      'Ask about prior claims or loss history',
      'Review major exclusions and coverage caps',
    ],
  },
  {
    id: 'utility-cost-estimation',
    section: 'homebuyers',
    title: 'Utility & Cost Estimation',
    description: 'Estimate recurring costs tied to the home',
    items: [
      'Request recent electric bills',
      'Request gas or propane bills',
      'Request water, sewer, and trash costs',
      'Check internet provider availability',
      'Review insulation and window efficiency',
      'Check appliance age',
      'Check appliance condition',
      'Review major system age and service life',
      'Estimate near-term replacement costs',
    ],
  },
  {
    id: 'seasonal',
    section: 'homeowners',
    title: 'Seasonal Maintenance',
    description: 'Annual tasks to keep your home protected',
    items: [
      'Clean gutters',
      'Clean downspouts',
      'Trim tree limbs away from the roof',
      'Schedule HVAC servicing',
      'Replace HVAC filters',
      'Test smoke detectors',
      'Test carbon monoxide detectors',
      'Replace smoke detector batteries',
      'Inspect roof for damage',
      'Check exterior drainage',
      'Check grading around the home',
      'Inspect weather seals',
      'Inspect caulking',
      'Test sump pump if the home has one',
    ],
  },
  {
    id: 'emergency-preparedness',
    section: 'homeowners',
    title: 'Emergency Preparedness',
    description: 'Keep emergency supplies and plans ready before a loss',
    items: [
      'Store three days of water',
      'Store three days of food',
      'Keep flashlights and spare batteries',
      'Keep a backup phone charger or power bank',
      'Keep a fire extinguisher in the kitchen',
      'Maintain a stocked first aid kit',
      'Update emergency contacts',
      'Save insurance policy and claim phone numbers',
      'Choose a family meeting location',
      'Create a household evacuation plan',
    ],
  },
  {
    id: 'home-safety-audit',
    section: 'homeowners',
    title: 'Home Safety Audit',
    description: 'Review essential safety systems and basic security',
    items: [
      'Install smoke detectors on every level',
      'Install smoke detectors in every bedroom',
      'Test smoke detectors',
      'Add carbon monoxide detectors if the home uses gas',
      'Test carbon monoxide detectors',
      'Check fire extinguisher expiration date',
      'Review security system status',
      'Check door locks',
      'Check window locks',
      'Review exterior lighting coverage',
      'Verify house numbers are visible from the street',
      'Test garage door safety reverse',
      'Check stair rails and trip hazards',
    ],
  },
  {
    id: 'appliance-equipment-inventory',
    section: 'homeowners',
    title: 'Appliance & Equipment Inventory',
    description: 'Track what is in the home and when it may need replacement',
    items: [
      'Record appliance make and model',
      'Record serial numbers',
      'Save purchase receipts',
      'Save warranty documents',
      'Save manuals',
      'Record installation dates',
      'Track expected replacement schedules',
      'Keep model details for recall checks',
      'Photograph each major appliance',
    ],
  },
  {
    id: 'document-organization',
    section: 'homeowners',
    title: 'Document Organization',
    description: 'Keep key home records easy to find when needed',
    items: [
      'Store homeowners and flood insurance documents',
      'Store mortgage information',
      'Store deed and closing documents',
      'Save renovation permits',
      'Save contractor agreements',
      'Save repair and contractor receipts',
      'Record a video walkthrough of home contents',
      'Photograph each room for documentation',
      'Save photos of home condition',
      'Save appliance manuals and warranties',
    ],
  },
  {
    id: 'financial-readiness',
    section: 'homeowners',
    title: 'Financial Readiness',
    description: 'Prepare for repairs, long-term upkeep, and recovery costs',
    items: [
      'Set a deductible reserve target',
      'Set a repair emergency fund target',
      'Estimate annual maintenance budget',
      'Review insurance, tax, and escrow changes',
      'Review home equity position',
      'Track major system replacement timelines',
      'Estimate near-term maintenance costs',
      'Plan for deductible expenses',
      'Plan for out-of-pocket expenses',
    ],
  },
  {
    id: 'storm-preparedness',
    section: 'disasters',
    title: 'Storm Preparedness',
    description: 'What to secure, inspect, stock, and save before a storm.',
    items: [
      'Secure outdoor furniture and loose items',
      'Inspect roof',
      'Inspect flashing',
      'Inspect gutters',
      'Trim weak branches near the home',
      'Charge backup batteries and power banks',
      'Stock backup lighting',
      'Stock batteries',
      'Save local weather alerts',
      'Save shelter locations',
    ],
  },
  {
    id: 'hail-preparedness',
    section: 'disasters',
    title: 'Hail Preparedness',
    description: 'What to inspect and protect before hail season.',
    items: [
      'Inspect roof covering',
      'Inspect skylights',
      'Inspect siding for vulnerable areas',
      'Set up covered parking',
      'Plan vehicle protection',
      'Protect windows',
      'Protect exterior fixtures',
      'Inspect attic for prior leak signs',
      'Photograph current exterior condition before storm season',
    ],
  },
  {
    id: 'flood-preparedness',
    section: 'disasters',
    title: 'Flood Preparedness',
    description: 'What to check and move before flooding becomes a risk.',
    items: [
      'Check flood zone',
      'Check drainage around the home',
      'Clear nearby storm drains and swales',
      'Test sump pump if the home has one',
      'Identify low-entry points',
      'Identify vent exposure',
      'Identify basement exposure',
      'Move valuables above likely water level',
      'Store documents above likely water level',
      'Locate gas and electric shutoffs',
      'Save evacuation routes',
      'Save local flood alerts',
    ],
  },
  {
    id: 'wildfire-preparedness',
    section: 'disasters',
    title: 'Wildfire Preparedness',
    description: 'What to clear, inspect, and pack before wildfire season.',
    items: [
      'Create a 0-5 foot non-combustible zone around the home',
      'Clear leaves from the roof and gutters',
      'Keep woodpiles away from the home',
      'Clear dead plants and pine needles',
      'Maintain 15-foot spacing between shrubs',
      'Trim overhanging branches',
      'Remove low-hanging branches up to 15 feet',
      'Clear debris',
      'Move wood piles away from the home',
      'Inspect vents',
      'Inspect eaves',
      'Inspect ember entry points',
      'Install 1/8-inch mesh on attic vents',
      'Install 1/8-inch mesh on under-deck vents',
      'Keep a shovel accessible',
      'Keep a rake accessible',
      'Keep a ladder accessible',
      'Pack a go-bag',
      'Save evacuation alerts',
    ],
  },
  {
    id: 'earthquake-preparedness',
    section: 'disasters',
    title: 'Earthquake Preparedness',
    description: 'What to secure and locate before an earthquake hits.',
    items: [
      'Check whether the home needs seismic retrofitting',
      'Secure water heaters',
      'Secure shelves',
      'Secure heavy furniture',
      'Secure televisions and hanging objects',
      'Identify gas shutoff location',
      'Identify water shutoff location',
      'Keep a shutoff tool nearby',
      'Store emergency shoes nearby',
      'Store lights nearby',
      'Store supplies nearby',
    ],
  },
]

const CUSTOM_STARTER_CHECKLISTS = [
  {
    id: 'my-emergency-planning',
    title: 'My Emergency Planning and Kits',
    description: 'Starter custom checklist',
    items: [
      'Pack three days of food',
      'Pack three days of water',
      'Pack lights',
      'Pack batteries',
      'Pack first aid supplies',
      'Pack medications and backup prescriptions',
      'Save my emergency contacts',
      'Choose family meeting spots',
      'Save my insurance policy numbers',
      'Map two ways out of every room',
      'Practice fire drills twice a year',
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
          <div className="checklist-desc">{checklist.description}</div>
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
                  These cover the most common situations. Create a Custom Checklist for property and area specific needs.
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
          <p className="readiness-group-note">
            Create custom checklists.
          </p>
          <div className="readiness-custom-content">
            {CUSTOM_STARTER_CHECKLISTS.map((checklist) => (
              <Checklist key={checklist.id} checklist={checklist} />
            ))}
          </div>
          <div className="readiness-custom-actions">
            <button className="btn-primary">+ Custom</button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default ReadinessCenter
