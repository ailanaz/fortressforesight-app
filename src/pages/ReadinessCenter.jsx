import { useState } from 'react'
import { useActiveHome } from '../context/HomeContext'
import { getHomeLocation, getHomeTitle } from '../utils/homeProfile'
import './Page.css'
import './ReadinessCenter.css'

const PREMADE_CHECKLISTS = [
  {
    id: 'buying-home',
    title: 'Buying a Home',
    description: 'Before you close - what to check and document',
    items: [
      'Get a full home inspection',
      'Review inspection report for major issues',
      'Get flood zone determination',
      'Get quotes for homeowners insurance before closing',
      'Check if flood insurance is required',
      'Understand your deductible options',
      'Photograph the entire property at move-in',
      'Document all appliances and serial numbers',
    ],
  },
  {
    id: 'seasonal',
    title: 'Seasonal Maintenance',
    description: 'Annual tasks to keep your home protected',
    items: [
      'Test smoke and CO detectors',
      'Inspect roof for missing or damaged shingles',
      'Clean gutters and downspouts',
      'Check caulk around windows and doors',
      'Service HVAC system',
      'Check water heater for leaks or rust',
      'Inspect attic insulation and ventilation',
      'Test sump pump if applicable',
    ],
  },
  {
    id: 'post-storm',
    title: 'After a Storm',
    description: 'Immediate steps if your property was affected',
    items: [
      'Ensure family is safe before entering property',
      'Photograph all exterior damage before cleanup',
      'Photograph all interior damage room by room',
      'Do not throw away damaged items before adjuster visit',
      'Contact insurance company to file a claim',
      'Get claim number and adjuster contact info',
      'Keep all receipts for emergency repairs',
      'Document all temporary repairs with photos',
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
              Use the Property Readiness Checklists to proactively identify risks and streamline recovery to stay ahead of potential losses before they happen.
            </span>
          </div>
        </div>
      ) : null}

      <div className="section-header readiness-checklists-header">
        <h2 className="section-label readiness-checklists-label">Property Readiness Checklists</h2>
        <button className="btn-primary">+ Custom</button>
      </div>

      {PREMADE_CHECKLISTS.map((checklist) => (
        <Checklist key={checklist.id} checklist={checklist} />
      ))}
    </div>
  )
}

export default ReadinessCenter
