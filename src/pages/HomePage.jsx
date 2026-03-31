import { Link } from 'react-router-dom'
import './Page.css'
import './HomePage.css'

const PATHWAYS = [
  {
    label: 'Buy',
    title: 'Check the home before close.',
    tags: ['Address search', 'Risk summary', 'Coverage questions'],
  },
  {
    label: 'Own',
    title: 'Keep the home file together.',
    tags: ['Policies', 'Receipts', 'Inspections', 'Contacts'],
  },
  {
    label: 'Recover',
    title: 'Move through a claim more cleanly.',
    tags: ['Damage log', 'Expense tracking', 'Claim steps'],
  },
]

function HomePage() {
  return (
    <div className="page home-page">
      <section className="home-hero">
        <article className="home-hero-main card">
          <p className="home-kicker">Homebuyers • Homeowners • Recovery</p>
          <h1 className="home-title">Protect what protects you.</h1>
          <p className="home-subtitle">Search. Organize. Recover.</p>
          <div className="home-actions">
            <Link className="btn-primary" to="/search">
              Search an Address
            </Link>
            <Link className="btn-outline" to="/login">
              Sign In
            </Link>
          </div>
        </article>

        <aside className="home-side card">
          <p className="home-side-kicker">Inside the app</p>
          <div className="home-side-list">
            <div className="home-side-item">
              <span className="home-side-number">01</span>
              <span className="home-side-text">Map and Risk Summary</span>
            </div>
            <div className="home-side-item">
              <span className="home-side-number">02</span>
              <span className="home-side-text">Records and readiness</span>
            </div>
            <div className="home-side-item">
              <span className="home-side-number">03</span>
              <span className="home-side-text">Recovery workflows</span>
            </div>
          </div>
        </aside>
      </section>

      <section className="home-grid">
        {PATHWAYS.map((item) => (
          <article key={item.label} className="home-feature card">
            <p className="home-feature-label">{item.label}</p>
            <p className="home-feature-title">{item.title}</p>
            <div className="home-feature-tags">
              {item.tags.map((tag) => (
                <span key={tag} className="home-feature-tag">
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

export default HomePage
