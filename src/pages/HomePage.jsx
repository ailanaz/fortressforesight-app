import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
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
  const [address, setAddress] = useState('')
  const navigate = useNavigate()

  const handleSearchSubmit = (event) => {
    event.preventDefault()

    const trimmedAddress = address.trim()

    if (!trimmedAddress) {
      return
    }

    navigate(`/search?address=${encodeURIComponent(trimmedAddress)}`, {
      state: { initialQuery: trimmedAddress },
    })
  }

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

            <form className="home-search-form" onSubmit={handleSearchSubmit}>
              <label className="sr-only" htmlFor="home-address-search">
                Property address
              </label>
              <input
                id="home-address-search"
                className="home-search-input"
                type="text"
                placeholder="Enter address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
              <button className="btn-primary" type="submit">
                Search
              </button>
            </form>
          </article>

          <article className="home-stage-panel card" aria-hidden="true" />
        </div>
      </section>
    </div>
  )
}

export default HomePage
