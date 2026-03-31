import { Link } from 'react-router-dom'
import './Page.css'
import './HomePage.css'

const RAIL_ITEMS = [
  {
    alt: 'Clarity before disaster',
    src: '/branding/home/clarity-before-disaster.png',
  },
  {
    alt: 'Structure during crisis',
    src: '/branding/home/structure-during-crisis.png',
  },
  {
    alt: 'Confidence through recovery',
    src: '/branding/home/confidence-through-recovery.png',
  },
]

const PATHWAYS = [
  {
    number: '01',
    label: 'Buy',
    title: 'Review the location first.',
    tags: ['Map', 'Flood / FEMA', 'Area snapshot'],
  },
  {
    number: '02',
    label: 'Own',
    title: 'Keep the home file ready.',
    tags: ['Policies', 'Receipts', 'Inspections'],
  },
  {
    number: '03',
    label: 'Recover',
    title: 'Track the claim with structure.',
    tags: ['Damage log', 'Expenses', 'Claim steps'],
  },
]

function HomePage() {
  return (
    <div className="page home-page">
      <section className="home-stage">
        <article className="home-stage-main card">
          <div className="home-stage-mark">
            <p className="home-kicker">FortressForesight</p>
            <img
              className="home-stage-logo"
              src="/branding/logos/fortressforesight-logo-square-transparent.png"
              alt="FortressForesight"
            />
          </div>

          <div className="home-stage-copy">
            <h1 className="home-title">Protect what protects you.</h1>
            <p className="home-subtitle">
              Search the home. Read the signals. Keep the file ready.
            </p>
          </div>

          <div className="home-actions">
            <Link className="btn-primary" to="/search">
              Search Address
            </Link>
            <Link className="btn-outline" to="/login">
              Sign In
            </Link>
          </div>

          <div className="home-pill-row" aria-label="Core app areas">
            <span className="home-pill">Map</span>
            <span className="home-pill">Risk Summary</span>
            <span className="home-pill">Records</span>
            <span className="home-pill">Recovery</span>
          </div>
        </article>

        <aside className="home-stage-side">
          {RAIL_ITEMS.map((item) => (
            <article key={item.alt} className="home-side-card card">
              <img className="home-side-image" src={item.src} alt={item.alt} />
            </article>
          ))}
        </aside>
      </section>

      <section className="home-pathways">
        {PATHWAYS.map((item) => (
          <article key={item.label} className="home-pathway card">
            <div className="home-pathway-top">
              <span className="home-pathway-number">{item.number}</span>
              <span className="home-pathway-label">{item.label}</span>
            </div>
            <p className="home-pathway-title">{item.title}</p>
            <div className="home-pathway-tags">
              {item.tags.map((tag) => (
                <span key={tag} className="home-pathway-tag">
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="home-banner card">
        <p className="home-banner-kicker">FortressForesight</p>
        <h2 className="home-banner-title">
          Clarity before disaster. Structure during crisis. Confidence through recovery.
        </h2>
      </section>
    </div>
  )
}

export default HomePage
