import { Link } from 'react-router-dom'
import './Page.css'
import './HomePage.css'

const HIGHLIGHTS = [
  {
    title: 'Search One Home',
    description: 'Look up one address at a time and review a focused starter risk summary.',
  },
  {
    title: 'Organize What Matters',
    description: 'Keep records, contacts, and home details in one place when you are ready to save them.',
  },
  {
    title: 'Recover With Clarity',
    description: 'Use guided workflows for readiness, claims, and recovery when the unexpected happens.',
  },
]

function HomePage() {
  return (
    <div className="page home-page">
      <section className="home-hero card">
        <div className="home-hero-copy">
          <p className="home-kicker">FortressForesight</p>
          <h1 className="home-title">Protect what protects you.</h1>
          <p className="home-subtitle">
            Home readiness, records, and recovery support for homebuyers and homeowners.
          </p>
          <div className="home-actions">
            <Link className="btn-primary" to="/search">
              Start With an Address
            </Link>
            <Link className="btn-outline" to="/login">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <section className="home-grid">
        {HIGHLIGHTS.map((item) => (
          <article key={item.title} className="home-feature card">
            <p className="home-feature-title">{item.title}</p>
            <p className="home-feature-copy">{item.description}</p>
          </article>
        ))}
      </section>
    </div>
  )
}

export default HomePage
