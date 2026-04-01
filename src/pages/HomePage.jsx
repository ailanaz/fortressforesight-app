import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Page.css'
import './HomePage.css'

const RAIL_ITEMS = [
  {
    label: 'Clarity',
    alt: 'Clarity before disaster',
    src: '/branding/home/Clarity.png?v=20260331-2',
    to: '/readiness',
  },
  {
    label: 'Structure',
    alt: 'Structure during crisis',
    src: '/branding/home/Structure.png?v=20260331-2',
    to: '/documents',
  },
  {
    label: 'Confidence',
    alt: 'Confidence through recovery',
    src: '/branding/home/Confidence.png?v=20260331-2',
    to: '/recovery',
  },
]

const JOURNEY_SLIDES = [
  {
    label: 'Clarity',
    title: 'Before the keys change hands',
    text: 'An address comes into view. The risks, the location, and the questions worth asking are clearer before the decision is made.',
  },
  {
    label: 'Structure',
    title: 'A home starts to feel ready',
    text: 'The address becomes a place with documents, checklists, and a plan that stays organized before something goes wrong.',
  },
  {
    label: 'Confidence',
    title: 'When the unexpected happens',
    text: 'The next step is easier to find. Recovery feels more steady when the groundwork is already there.',
  },
]

function HomePage() {
  const [address, setAddress] = useState('')
  const [activeSlide, setActiveSlide] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % JOURNEY_SLIDES.length)
    }, 4200)

    return () => window.clearInterval(intervalId)
  }, [])

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
              <h1 className="home-title">
                <span className="home-title-word">Fortress</span>
                <span className="home-title-word">Foresight</span>
              </h1>
              <p className="home-subtitle">
                Clarity before disaster. Structure during crisis. Confidence through recovery.
              </p>
              <p className="home-description">
                Property risk doesn't wait for you to be ready. FortressForesight makes sure you are.
              </p>
            </div>

            <p className="home-stage-section-label home-stage-search-label">Start Here</p>
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

          <article className="home-stage-panel card">
            <div className="home-journey-stage-nav" aria-hidden="true">
              {JOURNEY_SLIDES.map((slide, index) => (
                <span
                  key={slide.label}
                  className={`home-journey-stage${index === activeSlide ? ' active' : ''}`}
                >
                  {slide.label}
                </span>
              ))}
            </div>

            <div className="home-journey-track">
              {JOURNEY_SLIDES.map((slide, index) => (
                <section
                  key={slide.label}
                  className={`home-journey-slide${index === activeSlide ? ' active' : ''}`}
                  aria-hidden={index !== activeSlide}
                >
                  <div className="home-journey-head">
                    <span className="home-journey-label">{slide.label}</span>
                  </div>
                  <h2 className="home-journey-title">{slide.title}</h2>
                  <p className="home-journey-text">{slide.text}</p>
                </section>
              ))}
            </div>

            <div className="home-journey-progress">
              {JOURNEY_SLIDES.map((slide, index) => (
                <button
                  key={slide.label}
                  type="button"
                  className={`home-journey-dot${index === activeSlide ? ' active' : ''}`}
                  aria-label={`Show ${slide.label}`}
                  aria-pressed={index === activeSlide}
                  onClick={() => setActiveSlide(index)}
                />
              ))}
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}

export default HomePage
