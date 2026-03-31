import { Link } from 'react-router-dom'
import './Page.css'
import './HomePage.css'

const RAIL_ITEMS = [
  {
    label: 'Clarity',
    alt: 'Clarity before disaster',
    src: '/branding/home/clarity-before-disaster.png',
  },
  {
    label: 'Structure',
    alt: 'Structure during crisis',
    src: '/branding/home/structure-during-crisis.png',
  },
  {
    label: 'Confidence',
    alt: 'Confidence through recovery',
    src: '/branding/home/confidence-through-recovery.png',
    to: '/recovery',
  },
]

function HomePage() {
  return (
    <div className="page home-page">
      <section className="home-stage">
        <aside className="home-stage-side">
          {RAIL_ITEMS.map((item) => (
            item.to ? (
              <Link key={item.alt} className="home-side-card home-side-card-link card" to={item.to}>
                <p className="home-side-label">{item.label}</p>
                <div className="home-side-media">
                  <img className="home-side-image" src={item.src} alt={item.alt} />
                </div>
              </Link>
            ) : (
              <article key={item.alt} className="home-side-card card">
                <p className="home-side-label">{item.label}</p>
                <div className="home-side-media">
                  <img className="home-side-image" src={item.src} alt={item.alt} />
                </div>
              </article>
            )
          ))}
        </aside>

        <div className="home-stage-main-stack">
          <article className="home-stage-main card">
            <div className="home-stage-copy">
              <p className="home-stage-section-label">Property Search</p>
              <h1 className="home-title">FortressForesight</h1>
              <p className="home-subtitle">
                Clarity before disaster. Structure during crisis. Confidence through recovery.
              </p>
              <p className="home-description">
                FortressForesight helps protect the property that protects you by combining
                pre-purchase and homeownership risk awareness, secure home recordkeeping,
                disaster preparation, and guided recovery support in one place.
              </p>
            </div>

            <div className="home-actions">
              <Link className="btn-primary" to="/search">
                Search Address
              </Link>
            </div>
          </article>

          <article className="home-stage-panel card" aria-hidden="true" />
        </div>
      </section>
    </div>
  )
}

export default HomePage
