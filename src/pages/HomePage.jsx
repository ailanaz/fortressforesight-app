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
          <div className="home-stage-copy">
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
    </div>
  )
}

export default HomePage
