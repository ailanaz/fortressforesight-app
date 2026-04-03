import { useEffect, useRef, useState } from 'react'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { Link, useSearchParams } from 'react-router-dom'
import CalendarEventBar from '../components/CalendarEventBar'
import { useAuth } from '../context/AuthContext'
import { firebaseDb } from '../firebase'
import { useActiveHome } from '../context/HomeContext'
import { getHomeTitle } from '../utils/homeProfile'
import { defaultCalendarDate } from '../utils/calendar'
import { getPageStateStorageKey, readPageState, writePageState } from '../utils/pageStateStorage'
import { buildSavedPropertyId } from '../utils/propertyStorage'
import './Page.css'
import './ReadinessCenter.css'

const CHECKLIST_SECTIONS = [
  { id: 'homebuyers', label: 'Before Buying a Home' },
  { id: 'homeowners', label: 'Homeowner Preparedness' },
  { id: 'disasters', label: 'Disaster Preparedness' },
  { id: 'custom', label: 'Custom Checklists' },
]

const PREMADE_CHECKLISTS = [
  {
    id: 'quick-risk-check',
    section: 'homebuyers',
    title: 'Quick Risk Check',
    items: [
      'Signs of water intrusion are visible',
      'Roof leak signs or visible roof wear are present',
      'Water appears to drain away from the house',
      'Foundation cracks, shifting, or uneven floors are present',
      'Windows and doors show leaks, rot, or failed seals',
      'Major systems such as HVAC and water heater show age or wear',
      'Older or concerning plumbing materials are present',
      'Smoke alarms and carbon monoxide alarms are installed',
      'Signs of pest activity are present',
      'Trees or limbs could threaten the roof or structure',
      'Stairs, decks, and rails show safety concerns',
      'Property hazard exposure includes flood, wildfire, wind, hail, freeze, or earthquake risk',
    ],
  },
  {
    id: 'shutoffs-and-emergency-basics',
    section: 'homeowners',
    title: 'Shutoffs and Emergency Basics',
    items: [
      'Main water shutoff is present and accessible',
      'Electrical panel and main shutoff are present and accessible',
      'Gas shutoff is present and accessible if applicable',
      'Smoke alarms and carbon monoxide alarms are installed',
      'Fire extinguisher locations are in place',
    ],
  },
  {
    id: 'water-roof-and-drainage',
    section: 'homeowners',
    title: 'Water, Roof, and Drainage',
    items: [
      'Signs of water intrusion are present',
      'Roof leak signs are present',
      'Attic, ceilings, walls, and floors show moisture damage',
      'Water drains away from the house',
      'Gutters and downspouts are in working condition',
    ],
  },
  {
    id: 'structure-and-exterior-condition',
    section: 'homeowners',
    title: 'Structure and Exterior Condition',
    items: [
      'Foundation cracks or shifting are present',
      'Windows and doors show leaks, rot, or failed seals',
      'Tree and limb risk is present near the home',
      'Stairs, decks, and rails show safety issues',
    ],
  },
  {
    id: 'major-systems-and-utilities',
    section: 'homeowners',
    title: 'Major Systems and Utilities',
    items: [
      'Major systems show age, wear, or maintenance concerns',
      'Older or high-risk plumbing materials are present',
      'Sewer, septic, or drainage concerns are present if applicable',
      'Items near end of life or likely to need replacement are identified',
    ],
  },
  {
    id: 'records-and-recovery',
    section: 'homeowners',
    title: 'Records and Recovery',
    items: [
      'Property condition is documented',
      'Key home records are stored with the property information',
      'Recovery-related property information is kept together',
    ],
  },
  {
    id: 'storm-preparedness',
    section: 'disasters',
    title: 'Storm Preparedness',
    items: [
      'Inspect the roof for loose, damaged, or aging materials',
      'Check flashing, vents, soffits, and other roof openings',
      'Make sure gutters and downspouts are clear and attached properly',
      'Confirm that water drains away from the house',
      'Check windows and doors for weak seals or water entry points',
      'Inspect siding, trim, and exterior caulking for gaps',
      'Check fences, gates, sheds, and other exterior structures for stability',
      'Look for tree limbs that could strike the house',
      'Identify areas where wind-driven rain could enter',
      "Document the home's current condition with photos",
    ],
  },
  {
    id: 'hail-preparedness',
    section: 'disasters',
    title: 'Hail Preparedness',
    items: [
      'Check the roof for aging shingles or vulnerable areas',
      'Inspect flashing, vents, skylights, and other exposed roof features',
      'Check gutters, downspouts, and soft metal surfaces for existing damage',
      'Inspect siding for cracks, weak points, or brittle sections',
      'Check windows and exterior glass for existing damage or weak seals',
      'Review garage doors and other large exterior surfaces for vulnerability',
      'Look for tree branches that could break and damage the house',
      'Document the roof, siding, windows, and exterior with photos',
      'Note repair materials or contractors to contact if damage occurs',
    ],
  },
  {
    id: 'flood-preparedness',
    section: 'disasters',
    title: 'Flood Preparedness',
    items: [
      'Check whether the lot slopes water away from the house',
      'Inspect gutters, downspouts, drains, and drainage paths',
      'Look for low points where water may collect near the house',
      'Check the foundation for cracks or openings where water could enter',
      'Inspect crawlspaces, basements, and lower levels for moisture signs',
      'Check sump pump function if applicable',
      'Identify doors, vents, or openings at risk for water entry',
      'Store important home records and property documents in protected storage',
      "Document the home's current condition with photos",
      'Review areas of the house most vulnerable to water damage',
    ],
  },
  {
    id: 'wildfire-preparedness',
    section: 'disasters',
    title: 'Wildfire Preparedness',
    items: [
      'Clear dry debris from the roof, gutters, and around the home',
      'Trim tree branches away from the roof, siding, and windows',
      'Remove brush or dense vegetation close to the house if relevant',
      'Check vents, eaves, soffits, and other openings for ember entry risk',
      'Inspect siding, decks, fences, and exterior materials for vulnerability',
      'Check windows and glass doors for exposed or high-risk areas',
      'Identify combustible materials stored against or near the home',
      'Review the condition of exterior caulking and seals',
      "Document the home's current condition with photos",
      'Keep property records and home documents stored in a protected place',
    ],
  },
  {
    id: 'earthquake-preparedness',
    section: 'disasters',
    title: 'Earthquake Preparedness',
    items: [
      'Check for visible foundation cracks or structural concerns',
      'Inspect chimneys, masonry, and brick features for weakness',
      'Secure the water heater if applicable',
      'Check gas, water, and electrical shutoff access',
      'Secure heavy shelving, cabinets, and built-in storage to walls',
      'Inspect large mounted items that could fall or break',
      'Check roof-to-wall and structural connection areas if known',
      'Look for older materials or features that may be more vulnerable',
      "Document the home's current condition with photos",
      'Keep property records, manuals, and key home documents protected',
    ],
  },
  {
    id: 'spring-maintenance',
    section: 'homeowners',
    title: 'Spring Maintenance',
    items: [
      'Inspect the roof for damage after winter weather',
      'Clean gutters and downspouts',
      'Check exterior drainage around the house',
      'Look for leaks, staining, or moisture damage',
      'Inspect siding, trim, and caulking for wear',
      'Check windows and doors for failed seals or rot',
      'Inspect the foundation for cracks or movement',
      'Review crawlspaces, basements, or lower areas for moisture issues',
    ],
  },
  {
    id: 'summer-maintenance',
    section: 'homeowners',
    title: 'Summer Maintenance',
    items: [
      'Check for heat-related wear on roofing and exterior materials',
      'Inspect attic areas for excess heat or ventilation problems',
      'Review exterior caulking and weather seals',
      'Check irrigation or outdoor water flow near the foundation',
      'Trim trees and vegetation away from the home',
      'Inspect decks, rails, and exterior wood for wear',
      'Look for pest entry points around the exterior',
      'Check for signs of cracking, shifting, or dry soil movement near the house',
    ],
  },
  {
    id: 'fall-maintenance',
    section: 'homeowners',
    title: 'Fall Maintenance',
    items: [
      'Clean gutters and downspouts before storm season',
      'Inspect the roof for loose, damaged, or aging materials',
      'Check flashing, vents, and roof penetrations',
      'Inspect windows and doors for drafts or failed seals',
      'Trim branches that could damage the house in wind or ice',
      'Check exterior drainage and water flow paths',
      'Inspect siding, trim, and paint for exposed areas',
      'Look for openings where moisture or pests could enter',
    ],
  },
  {
    id: 'winter-maintenance',
    section: 'homeowners',
    title: 'Winter Maintenance',
    items: [
      'Check exposed pipes and vulnerable plumbing areas if relevant',
      'Look for drafts, leaks, or moisture issues around windows and doors',
      'Monitor the roof and gutters for stress during winter weather',
      'Watch for standing water, ice, or drainage problems near the home',
      'Check basements, crawlspaces, and lower areas for moisture issues',
      'Inspect exterior stairs, rails, and walkways for weather-related damage',
      'Review the home for cold-weather cracks, gaps, or seal failure',
      'Document any new seasonal damage that may need repair',
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

const READINESS_DOC_ID = 'state'

function createCustomChecklistDraft() {
  return {
    id: `custom-${Date.now()}`,
    title: '',
    items: [],
    open: true,
    editingTitle: true,
    done: {},
  }
}

function normalizeCustomChecklist(checklist) {
  return {
    id: checklist.id,
    title: checklist.title || '',
    items: (checklist.items || []).map((item, index) => (
      typeof item === 'string'
        ? { id: `${checklist.id}-${index}`, text: item }
        : { id: item.id || `${checklist.id}-${index}`, text: item.text || '' }
    )),
    open: Boolean(checklist.open ?? checklist.initiallyOpen),
    editingTitle: Boolean(checklist.editingTitle ?? checklist.initiallyOpen),
    done: checklist.done || {},
  }
}

function normalizeCustomChecklists(checklists) {
  if (Array.isArray(checklists)) {
    return checklists.map(normalizeCustomChecklist)
  }

  return CUSTOM_STARTER_CHECKLISTS.map(normalizeCustomChecklist)
}

function sanitizeChecklistState(state) {
  return Object.entries(state || {}).reduce((nextState, [checklistId, checklist]) => {
    nextState[checklistId] = {
      open: Boolean(checklist?.open),
      done: checklist?.done || {},
    }

    return nextState
  }, {})
}

function sanitizeCustomChecklists(checklists) {
  return (checklists || []).map((checklist) => ({
    id: checklist.id,
    title: checklist.title || '',
    items: (checklist.items || []).map((item) => ({
      id: item.id,
      text: item.text || '',
    })),
    open: Boolean(checklist.open),
    editingTitle: Boolean(checklist.editingTitle),
    done: checklist.done || {},
  }))
}

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

function Checklist({ checklist, locked = false, state, onToggleOpen, onToggleItem }) {
  const open = Boolean(state?.open)
  const done = state?.done || {}
  const doneCount = Object.values(done).filter(Boolean).length

  return (
    <div className={`checklist-card card${locked ? ' is-locked' : ''}`}>
      <div className="checklist-header" onClick={() => {
        if (!locked) {
          onToggleOpen(checklist.id)
        }
      }}>
        <div>
          <div className="checklist-title">{checklist.title}</div>
        </div>
        <div className="checklist-progress">
          {locked ? (
            <Link className="checklist-upgrade-link" to="/upgrade">
              Upgrade
            </Link>
          ) : (
            <span>
              {doneCount}/{checklist.items.length}
            </span>
          )}
          <svg
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            style={{ transform: !locked && open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
      {!locked && open && (
        <ul className="checklist-items">
          {checklist.items.map((item, index) => (
            <ChecklistItem
              key={item}
              text={item}
              done={!!done[index]}
              onToggle={() => onToggleItem(checklist.id, index)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function CustomChecklist({
  checklist,
  onDelete,
  onToggleOpen,
  onTitleChange,
  onLockTitle,
  onToggleItem,
  onRemoveItem,
  onAddItem,
  locked = false,
}) {
  const open = Boolean(checklist.open)
  const title = checklist.title
  const editingTitle = Boolean(checklist.editingTitle)
  const done = checklist.done || {}
  const items = checklist.items || []
  const [newItem, setNewItem] = useState('')

  const addItem = () => {
    const trimmed = newItem.trim()
    if (!trimmed) return

    onAddItem(checklist.id, trimmed)
    setNewItem('')
  }

  const doneCount = items.filter((item) => done[item.id]).length
  const progressLabel = items.length ? `${doneCount}/${items.length}` : '0 items'

  return (
    <div className={`checklist-card card${locked ? ' is-locked' : ''}`}>
      <div className="checklist-header" onClick={() => {
        if (!locked) {
          onToggleOpen(checklist.id)
        }
      }}>
        <div>
          <div className="checklist-title">{title || 'New Custom List'}</div>
        </div>
        <div className="checklist-progress">
          {locked ? (
            <Link className="checklist-upgrade-link" to="/upgrade">
              Upgrade
            </Link>
          ) : (
            <span>{progressLabel}</span>
          )}
          <svg
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            style={{ transform: !locked && open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
      {!locked && open && (
        <>
          {editingTitle ? (
            <div className="custom-checklist-title-edit">
              <input
                className="page-input page-input-wide"
                type="text"
                value={title}
                onChange={(event) => onTitleChange(checklist.id, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    onLockTitle(checklist.id)
                  }
                }}
                placeholder="List title"
                aria-label="Custom checklist title"
              />
            </div>
          ) : null}
          <div className={`custom-checklist-actions${editingTitle ? ' is-editing' : ''}`}>
            {editingTitle ? (
              <button className="checklist-remove custom-checklist-lock" type="button" onClick={() => onLockTitle(checklist.id)}>
                Lock Name
              </button>
            ) : null}
            <button className="checklist-remove custom-checklist-delete" type="button" onClick={() => onDelete(checklist.id)}>
              Delete List
            </button>
          </div>
          <ul className="checklist-items">
            {items.map((item) => (
              <li key={item.id} className={`checklist-item${done[item.id] ? ' done' : ''}`}>
                <button className="checklist-item-main" type="button" onClick={() => onToggleItem(checklist.id, item.id)}>
                  <span className="checklist-checkbox">
                    {done[item.id] ? (
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    ) : null}
                  </span>
                  <span className="checklist-text">{item.text}</span>
                </button>
                <button className="checklist-remove" type="button" onClick={() => onRemoveItem(checklist.id, item.id)}>
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
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAuthenticated, user } = useAuth()
  const { activeHome } = useActiveHome()
  const homeTitle = getHomeTitle(activeHome)
  const [calendarTitle, setCalendarTitle] = useState('')
  const [calendarDate, setCalendarDate] = useState(defaultCalendarDate())
  const [customChecklists, setCustomChecklists] = useState(() => normalizeCustomChecklists(CUSTOM_STARTER_CHECKLISTS))
  const [checklistState, setChecklistState] = useState({})
  const sectionParam = searchParams.get('section')
  const initialSection = CHECKLIST_SECTIONS.some((section) => section.id === sectionParam)
    ? sectionParam
    : 'homebuyers'
  const [section, setSection] = useState(initialSection)
  const hydratedRef = useRef(false)
  const skipRemoteWriteRef = useRef(false)
  const storageKey = getPageStateStorageKey('readiness', user?.uid, activeHome)
  const propertyId = activeHome?.savedPropertyId || (activeHome ? buildSavedPropertyId(activeHome) : '')

  useEffect(() => {
    let cancelled = false
    hydratedRef.current = false

    const hydrate = async () => {
      if (!storageKey) {
        setCalendarTitle('')
        setCalendarDate(defaultCalendarDate())
        setChecklistState({})
        setCustomChecklists(normalizeCustomChecklists())
        hydratedRef.current = true
        return
      }

      const storedState = readPageState(storageKey)

      if (!cancelled) {
        setCalendarTitle(storedState?.calendarTitle || '')
        setCalendarDate(storedState?.calendarDate || defaultCalendarDate())
        setChecklistState(storedState?.checklistState || {})
        setCustomChecklists(normalizeCustomChecklists(storedState?.customChecklists))
      }

      if (firebaseDb && isAuthenticated && user?.uid && propertyId) {
        try {
          const snapshot = await getDoc(doc(firebaseDb, 'users', user.uid, 'properties', propertyId, 'readiness', READINESS_DOC_ID))

          if (!cancelled && snapshot.exists()) {
            const remoteState = snapshot.data()
            skipRemoteWriteRef.current = true

            setCalendarTitle(remoteState?.calendarTitle || '')
            setCalendarDate(remoteState?.calendarDate || defaultCalendarDate())

            if (remoteState?.checklistState) {
              setChecklistState(remoteState.checklistState)
            }

            if (Array.isArray(remoteState?.customChecklists)) {
              setCustomChecklists(normalizeCustomChecklists(remoteState.customChecklists))
            }
          }
        } catch (error) {
          console.warn('Readiness sync is not ready yet.', error)
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
      calendarTitle,
      calendarDate,
      checklistState,
      customChecklists,
    })
  }, [calendarDate, calendarTitle, checklistState, customChecklists, storageKey])

  useEffect(() => {
    if (!hydratedRef.current || !firebaseDb || !isAuthenticated || !user?.uid || !propertyId) {
      return
    }

    if (skipRemoteWriteRef.current) {
      skipRemoteWriteRef.current = false
      return
    }

    const syncReadinessState = async () => {
      try {
        await setDoc(
          doc(firebaseDb, 'users', user.uid, 'properties', propertyId, 'readiness', READINESS_DOC_ID),
          {
            calendarTitle,
            calendarDate,
            checklistState: sanitizeChecklistState(checklistState),
            customChecklists: sanitizeCustomChecklists(customChecklists),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        )
      } catch (error) {
        console.warn('Readiness save is not ready yet.', error)
      }
    }

    syncReadinessState()
  }, [calendarDate, calendarTitle, checklistState, customChecklists, isAuthenticated, propertyId, user?.uid])

  const handleSectionChange = (nextSection) => {
    setSection(nextSection)
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (nextSection === 'homebuyers') {
        next.delete('section')
      } else {
        next.set('section', nextSection)
      }
      return next
    }, { replace: true })
  }

  const handleCreateCustomList = () => {
    setCustomChecklists((current) => [createCustomChecklistDraft(), ...current])
  }

  const handleDeleteCustomList = (id) => {
    setCustomChecklists((current) => current.filter((checklist) => checklist.id !== id))
  }

  const handleToggleChecklistOpen = (id) => {
    setChecklistState((current) => ({
      ...current,
      [id]: {
        open: !current[id]?.open,
        done: current[id]?.done || {},
      },
    }))
  }

  const handleToggleChecklistItem = (id, index) => {
    setChecklistState((current) => ({
      ...current,
      [id]: {
        open: current[id]?.open || false,
        done: {
          ...(current[id]?.done || {}),
          [index]: !current[id]?.done?.[index],
        },
      },
    }))
  }

  const updateCustomChecklist = (id, updater) => {
    setCustomChecklists((current) => current.map((checklist) => (
      checklist.id === id ? updater(checklist) : checklist
    )))
  }

  const handleToggleCustomChecklistOpen = (id) => {
    updateCustomChecklist(id, (checklist) => ({
      ...checklist,
      open: !checklist.open,
    }))
  }

  const handleCustomChecklistTitleChange = (id, value) => {
    updateCustomChecklist(id, (checklist) => ({
      ...checklist,
      title: value,
    }))
  }

  const handleLockCustomChecklistTitle = (id) => {
    updateCustomChecklist(id, (checklist) => ({
      ...checklist,
      title: checklist.title.trim() || 'New Custom List',
      editingTitle: false,
    }))
  }

  const handleToggleCustomChecklistItem = (id, itemId) => {
    updateCustomChecklist(id, (checklist) => ({
      ...checklist,
      done: {
        ...(checklist.done || {}),
        [itemId]: !checklist.done?.[itemId],
      },
    }))
  }

  const handleRemoveCustomChecklistItem = (id, itemId) => {
    updateCustomChecklist(id, (checklist) => {
      const nextDone = { ...(checklist.done || {}) }
      delete nextDone[itemId]

      return {
        ...checklist,
        items: checklist.items.filter((item) => item.id !== itemId),
        done: nextDone,
      }
    })
  }

  const handleAddCustomChecklistItem = (id, text) => {
    updateCustomChecklist(id, (checklist) => ({
      ...checklist,
      open: true,
      items: [
        ...checklist.items,
        {
          id: `${checklist.id}-${Date.now()}`,
          text,
        },
      ],
    }))
  }

  const sectionChecklists = PREMADE_CHECKLISTS.filter((checklist) => checklist.section === section)

  return (
    <div className="page">
      <h1 className="page-title readiness-page-title">Readiness Center</h1>

      <div className="page-utility-bar">
        <CalendarEventBar
          title={calendarTitle}
          setTitle={setCalendarTitle}
          date={calendarDate}
          setDate={setCalendarDate}
          defaultTitle={homeTitle ? `Property Readiness Review - ${homeTitle}` : 'Property Readiness Review'}
          details="Review your property readiness checklists in FortressForesight."
          dateAriaLabel="Readiness review date"
        />
      </div>

      <div className="readiness-tabs-wrap">
        <div className="readiness-tabs">
          {CHECKLIST_SECTIONS.map((item) => (
            <button
              key={item.id}
              className={`readiness-tab${section === item.id ? ' active' : ''}`}
              onClick={() => handleSectionChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {isAuthenticated ? (
          <button type="button" className="readiness-tab readiness-note-button">
            Add a Note
          </button>
        ) : (
          <Link className="readiness-tab readiness-note-button" to="/upgrade">
            Add a Note
          </Link>
        )}
      </div>

      {section === 'custom' ? (
        <>
          <div className="readiness-section-spacer" aria-hidden="true" />
          <div className="readiness-custom-note-row">
            <div className="readiness-group-note readiness-custom-note">
              Create a Custom Checklist for property and area specific needs.
            </div>
            {isAuthenticated ? (
              <button type="button" className="readiness-custom-text-link" onClick={handleCreateCustomList}>
                Create Custom List
              </button>
            ) : (
              <Link className="readiness-custom-text-link" to="/upgrade">
                Create Custom List
              </Link>
            )}
          </div>
          <div className="readiness-list">
            {customChecklists.map((checklist) => (
              <CustomChecklist
                key={checklist.id}
                checklist={checklist}
                onDelete={handleDeleteCustomList}
                onToggleOpen={handleToggleCustomChecklistOpen}
                onTitleChange={handleCustomChecklistTitleChange}
                onLockTitle={handleLockCustomChecklistTitle}
                onToggleItem={handleToggleCustomChecklistItem}
                onRemoveItem={handleRemoveCustomChecklistItem}
                onAddItem={handleAddCustomChecklistItem}
                locked={!isAuthenticated}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="readiness-section-spacer" aria-hidden="true" />
          {section === 'disasters' ? (
            <p className="readiness-group-note">
              These cover the most common situations.
            </p>
          ) : null}
          <div className="readiness-list">
            {sectionChecklists.map((checklist) => (
              <Checklist
                key={checklist.id}
                checklist={checklist}
                state={checklistState[checklist.id]}
                onToggleOpen={handleToggleChecklistOpen}
                onToggleItem={handleToggleChecklistItem}
                locked={!isAuthenticated}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default ReadinessCenter
