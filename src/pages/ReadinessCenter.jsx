import { useState } from 'react'
import { useActiveHome } from '../context/HomeContext'
import { getHomeLocation, getHomeTitle } from '../utils/homeProfile'
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
      'Review structural integrity',
      'Check HVAC condition and age',
      'Inspect plumbing systems',
      'Review electrical systems and panel',
      'Inspect roof condition and age',
      'Look for foundation issues or movement',
    ],
  },
  {
    id: 'title-deed-verification',
    section: 'homebuyers',
    title: 'Title & Deed Verification',
    description: 'Confirm ownership and uncover legal restrictions before closing',
    items: [
      'Confirm current ownership',
      'Review recorded liens',
      'Check easements affecting the property',
      'Review deed restrictions or encumbrances',
    ],
  },
  {
    id: 'neighborhood-assessment',
    section: 'homebuyers',
    title: 'Neighborhood Assessment',
    description: 'Review the area around the home before you commit',
    items: [
      'Check local crime patterns',
      'Review school quality',
      'Assess nearby amenities and services',
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
      'Review standard dwelling coverage',
      'Check whether flood coverage is needed',
      'Check whether earthquake coverage is needed',
    ],
  },
  {
    id: 'utility-cost-estimation',
    section: 'homebuyers',
    title: 'Utility & Cost Estimation',
    description: 'Estimate recurring costs tied to the home',
    items: [
      'Estimate average utility bills',
      'Review energy efficiency',
      'Check appliance age and condition',
      'Flag systems likely to need replacement soon',
    ],
  },
  {
    id: 'seasonal',
    section: 'homeowners',
    title: 'Seasonal Maintenance',
    description: 'Annual tasks to keep your home protected',
    items: [
      'Clean gutters and downspouts',
      'Schedule HVAC servicing',
      'Replace smoke detector batteries',
      'Inspect roof for damage',
      'Check exterior drainage and grading',
      'Inspect weather seals and caulking',
    ],
  },
  {
    id: 'emergency-preparedness',
    section: 'homeowners',
    title: 'Emergency Preparedness',
    description: 'Keep emergency supplies and plans ready before a loss',
    items: [
      'Keep a fire extinguisher accessible',
      'Maintain a stocked first aid kit',
      'Update emergency contacts',
      'Create a household evacuation plan',
    ],
  },
  {
    id: 'home-safety-audit',
    section: 'homeowners',
    title: 'Home Safety Audit',
    description: 'Review essential safety systems and basic security',
    items: [
      'Test carbon monoxide detectors',
      'Review security system status',
      'Check door and window locks',
      'Review exterior lighting coverage',
    ],
  },
  {
    id: 'appliance-equipment-inventory',
    section: 'homeowners',
    title: 'Appliance & Equipment Inventory',
    description: 'Track what is in the home and when it may need replacement',
    items: [
      'Record serial numbers',
      'Save warranty documents',
      'Track expected replacement schedules',
      'Keep model details for recall checks',
    ],
  },
  {
    id: 'document-organization',
    section: 'homeowners',
    title: 'Document Organization',
    description: 'Keep key home records easy to find when needed',
    items: [
      'Store home insurance documents',
      'Store mortgage information',
      'Save renovation permits',
      'Save repair and contractor receipts',
    ],
  },
  {
    id: 'financial-readiness',
    section: 'homeowners',
    title: 'Financial Readiness',
    description: 'Prepare for repairs, long-term upkeep, and recovery costs',
    items: [
      'Set a repair emergency fund target',
      'Review home equity position',
      'Estimate near-term maintenance costs',
      'Plan for deductible and out-of-pocket expenses',
    ],
  },
  {
    id: 'storm-preparedness',
    section: 'disasters',
    title: 'Storm Preparedness',
    description: 'What to secure, inspect, stock, and save before a storm.',
    items: [
      'Secure outdoor furniture and loose items',
      'Inspect roof, flashing, and gutters',
      'Stock backup lighting and batteries',
      'Save local weather alerts and shelter locations',
    ],
  },
  {
    id: 'hail-preparedness',
    section: 'disasters',
    title: 'Hail Preparedness',
    description: 'What to inspect and protect before hail season.',
    items: [
      'Inspect roof covering and skylight vulnerability',
      'Set up covered parking or vehicle protection',
      'Protect windows and exterior fixtures',
      'Photograph current exterior condition before storm season',
    ],
  },
  {
    id: 'flood-preparedness',
    section: 'disasters',
    title: 'Flood Preparedness',
    description: 'What to check and move before flooding becomes a risk.',
    items: [
      'Check flood zone and drainage around the home',
      'Identify low-entry points, vents, and basement exposure',
      'Store documents above likely water level',
      'Save evacuation routes and local flood alerts',
    ],
  },
  {
    id: 'wildfire-preparedness',
    section: 'disasters',
    title: 'Wildfire Preparedness',
    description: 'What to clear, inspect, and pack before wildfire season.',
    items: [
      'Clear defensible space around the home',
      'Trim overhanging branches and clear debris',
      'Inspect vents, eaves, and ember entry points',
      'Pack a go-bag and save evacuation alerts',
    ],
  },
  {
    id: 'earthquake-preparedness',
    section: 'disasters',
    title: 'Earthquake Preparedness',
    description: 'What to secure and locate before an earthquake hits.',
    items: [
      'Check whether older structural elements need retrofitting',
      'Secure water heaters, shelves, and heavy furniture',
      'Identify gas and water shutoff locations',
      'Store emergency shoes, lights, and supplies nearby',
    ],
  },
]

const CUSTOM_STARTER_CHECKLISTS = [
  {
    id: 'my-emergency-planning',
    title: 'My Emergency Planning and Kits',
    description: 'Starter custom checklist',
    items: [
      'Pack my three-day emergency kit with food, water, lights, batteries, and first aid supplies',
      'Save my emergency contacts and choose family meeting spots',
      'Map two ways out of every room and practice fire drills twice a year',
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
          <h3 className="section-label readiness-group-label">Custom</h3>
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
