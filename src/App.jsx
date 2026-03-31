import { HashRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom'
import './App.css'

const navItems = [
  { to: '/overview', label: 'Overview' },
  { to: '/property', label: 'Property' },
  { to: '/records', label: 'Records' },
  { to: '/readiness', label: 'Readiness' },
  { to: '/recovery', label: 'Recovery' },
  { to: '/guidance', label: 'Guidance' },
]

const pillarCards = [
  {
    title: 'Know the risk before it becomes expensive',
    body:
      'Map flood, storm, wildfire, and maintenance exposure into one home snapshot so decisions start from reality, not guesswork.',
  },
  {
    title: 'Keep every critical record in one place',
    body:
      'Policies, warranties, inspections, receipts, and home photos should be easy to reach before, during, and after a disruption.',
  },
  {
    title: 'Move through recovery with structure',
    body:
      'Track damage, expenses, claim milestones, and conversations so nothing important disappears into panic or paperwork.',
  },
]

const propertyHighlights = [
  'Address profile with flood, storm, and wildfire context',
  'Pre-buy due diligence checklist for future homeowners',
  'Home systems inventory for roof, HVAC, plumbing, and electrical',
]

const recordHighlights = [
  'Policy folder for homeowners, flood, and specialty coverage',
  'Receipt and warranty vault organized by room or system',
  'Photo inventory workflow for fast documentation before disaster',
]

const readinessHighlights = [
  'Seasonal checklists for storms, freezes, wildfire, and hurricanes',
  'Risk-reduction plans with practical reminders and follow-through',
  'Emergency contact center for insurers, contractors, and family',
]

const recoveryHighlights = [
  'Incident timeline with room-by-room damage logging',
  'Expense tracker for lodging, supplies, cleanup, and temporary fixes',
  'Guided claim support for adjuster meetings and repair decisions',
]

const guidanceHighlights = [
  'Plain-language explanations for deductibles, ACV, and replacement cost',
  'Clear adjuster role breakdowns so users know who represents whom',
  'Decision support for claims, mitigation, and documentation priorities',
]

function Shell({ children }) {
  return (
    <div className="shell">
      <header className="hero">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            FF
          </div>
          <div>
            <p className="eyebrow">FortressForesight</p>
            <h1>Protect what protects you.</h1>
          </div>
        </div>
        <p className="hero-copy">
          A calmer, more organized home readiness app for understanding risk,
          storing the records that matter, and navigating recovery with
          confidence.
        </p>
        <div className="hero-band">
          <span>Risk</span>
          <span>Records</span>
          <span>Readiness</span>
          <span>Recovery</span>
          <span>Guidance</span>
        </div>
      </header>

      <nav className="nav-tabs" aria-label="Primary">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? 'nav-tab nav-tab-active' : 'nav-tab'
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main className="content">{children}</main>
    </div>
  )
}

function OverviewPage() {
  return (
    <Shell>
      <section className="section-grid">
        {pillarCards.map((card) => (
          <article key={card.title} className="surface-card">
            <p className="card-kicker">Core promise</p>
            <h2>{card.title}</h2>
            <p>{card.body}</p>
          </article>
        ))}
      </section>

      <section className="storyboard">
        <article className="story-card story-card-strong">
          <p className="card-kicker">For future homeowners</p>
          <h2>Buy with eyes open.</h2>
          <p>
            Start with a property profile that makes risk, insurance
            implications, and due diligence visible before closing day.
          </p>
        </article>
        <article className="story-card">
          <p className="card-kicker">For current homeowners</p>
          <h2>Stay organized without the scramble.</h2>
          <p>
            Keep a living record of your home so renewals, repairs, and
            emergencies do not depend on memory.
          </p>
        </article>
        <article className="story-card">
          <p className="card-kicker">For crisis moments</p>
          <h2>Recover with structure.</h2>
          <p>
            When damage happens, the app should shift from storage mode into a
            guided recovery workspace.
          </p>
        </article>
      </section>
    </Shell>
  )
}

function DetailPage({ title, intro, bullets, note }) {
  return (
    <Shell>
      <section className="detail-header">
        <p className="card-kicker">Product area</p>
        <h2>{title}</h2>
        <p>{intro}</p>
      </section>

      <section className="detail-grid">
        <article className="surface-card">
          <h3>What belongs here</h3>
          <ul className="bullet-list">
            {bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <aside className="surface-card surface-card-accent">
          <p className="card-kicker">Design note</p>
          <h3>Why it matters</h3>
          <p>{note}</p>
        </aside>
      </section>
    </Shell>
  )
}

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<OverviewPage />} />
        <Route
          path="/property"
          element={
            <DetailPage
              title="Property"
              intro="This section is the intelligence layer for a home: the profile, the exposure, and the context a buyer or owner should understand early."
              bullets={propertyHighlights}
              note="A good property workspace should turn scattered public data and owner details into something simple enough to act on."
            />
          }
        />
        <Route
          path="/records"
          element={
            <DetailPage
              title="Records"
              intro="The vault should feel less like cold storage and more like a home operating system for documents, photos, receipts, and proof."
              bullets={recordHighlights}
              note="Documentation only helps if it is organized ahead of time and still usable under stress."
            />
          }
        />
        <Route
          path="/readiness"
          element={
            <DetailPage
              title="Readiness"
              intro="Readiness is where future risk gets turned into small, repeatable actions instead of abstract worry."
              bullets={readinessHighlights}
              note="The strongest version of this app nudges people toward practical action before a crisis starts."
            />
          }
        />
        <Route
          path="/recovery"
          element={
            <DetailPage
              title="Recovery"
              intro="Recovery mode should guide users through the chaos after damage and help them keep decisions, proof, and progress visible."
              bullets={recoveryHighlights}
              note="This is the emotional heart of the product because structure matters most when people feel overwhelmed."
            />
          }
        />
        <Route
          path="/guidance"
          element={
            <DetailPage
              title="Guidance"
              intro="Guidance translates insurance language, disaster workflows, and repair decisions into plain English so people can move with more confidence."
              bullets={guidanceHighlights}
              note="Clarity is not a side feature here. It is part of the product itself."
            />
          }
        />
      </Routes>
    </HashRouter>
  )
}

export default App
