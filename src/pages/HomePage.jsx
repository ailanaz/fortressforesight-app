import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Page.css'
import './HomePage.css'

const RAIL_ITEMS = [
  {
    label: 'Clarity',
    title: 'Understand the property first',
    text: 'Clarity helps you see the home, the area, and the risks more clearly before you move forward.',
    cta: 'Open Search',
    to: '/search',
  },
  {
    label: 'Structure',
    title: 'Keep everything organized',
    text: 'Structure keeps key records, notes, and progress connected in one place.',
    cta: 'Open Documents',
    to: '/documents',
  },
  {
    label: 'Confidence',
    title: 'Know what to do next',
    text: 'Confidence helps you move through damage, claims, and recovery with more direction.',
    cta: 'Open Recovery',
    to: '/recovery',
  },
]

const JOURNEY_SLIDES = [
  {
    id: 'clarity-search',
    label: 'Clarity',
    title: 'You do not know the risk yet',
    text: 'FortressForesight helps surface location-based risks before you commit.',
  },
  {
    id: 'clarity-scattered',
    label: 'Clarity',
    title: 'The warning signs are scattered',
    text: 'FortressForesight brings them into one clear property view.',
  },
  {
    id: 'clarity-too-late',
    label: 'Clarity',
    title: 'You learn it too late',
    text: 'FortressForesight helps you review the right risks earlier.',
  },
  {
    id: 'structure-records',
    label: 'Structure',
    title: 'Everything gets scattered',
    text: 'FortressForesight keeps policies, receipts, inspections, warranties, and claim notes tied to the home you searched.',
  },
  {
    id: 'structure-put-off',
    label: 'Structure',
    title: 'Preparedness gets put off',
    text: 'FortressForesight turns checklists into a clearer way to spot risks, stay ahead of losses, and move through recovery.',
  },
  {
    id: 'structure-chaos',
    label: 'Structure',
    title: 'The moment feels chaotic',
    text: 'FortressForesight gives you structure when something goes wrong.',
  },
  {
    id: 'confidence-claim',
    label: 'Confidence',
    title: 'The claim starts incomplete',
    text: 'FortressForesight helps keep what you need in one place.',
  },
  {
    id: 'confidence-recovery-messy',
    label: 'Confidence',
    title: 'Recovery gets messy fast',
    text: 'FortressForesight helps you track the process with more clarity.',
  },
  {
    id: 'structure-underprepared',
    label: 'Structure',
    title: 'Most homeowners are underprepared',
    text: 'FortressForesight helps you be more prepared before you need to be.',
  },
  {
    id: 'confidence-ready',
    label: 'Confidence',
    title: 'Property risk does not wait',
    text: 'FortressForesight makes sure you are ready.',
  },
  {
    id: 'confidence-storm-hits',
    label: 'Confidence',
    title: 'The storm hits',
    text: 'FortressForesight helps you open one place and start from there.',
  },
  {
    id: 'confidence-damage-docs',
    label: 'Confidence',
    title: 'You need to document damage',
    text: 'FortressForesight helps you keep photos, notes, and next steps together.',
  },
  {
    id: 'clarity-area-risk',
    label: 'Clarity',
    title: 'You know the area has risk',
    text: 'FortressForesight helps turn that into practical preparedness.',
  },
  {
    id: 'clarity-buying-unknown',
    label: 'Clarity',
    title: 'You are buying in the unknown',
    text: 'FortressForesight helps you spot first-glance property and area risks before closing.',
  },
  {
    id: 'confidence-after-loss',
    label: 'Confidence',
    title: 'After a loss, details blur',
    text: 'FortressForesight helps keep recovery organized from the start.',
  },
]

function HomePage() {
  const [address, setAddress] = useState('')
  const [activeSlide, setActiveSlide] = useState(0)
  const navigate = useNavigate()

  const goToNextSlide = () => {
    setActiveSlide((current) => (current + 1) % JOURNEY_SLIDES.length)
  }

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      goToNextSlide()
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
              <Link key={item.label} className="home-side-card home-side-card-link card" to={item.to}>
                <p className="home-side-label">{item.label}</p>
                <div className="home-side-content">
                  <h2 className="home-side-title">{item.title}</h2>
                  <p className="home-side-text">{item.text}</p>
                  <span className="home-side-cta">{item.cta}</span>
                </div>
              </Link>
            ) : (
              <article key={item.label} className="home-side-card card">
                <p className="home-side-label">{item.label}</p>
                <div className="home-side-content">
                  <h2 className="home-side-title">{item.title}</h2>
                  <p className="home-side-text">{item.text}</p>
                  <span className="home-side-cta">{item.cta}</span>
                </div>
              </article>
            )
          ))}
        </aside>

        <div className="home-stage-main-stack">
          <article className="home-stage-main card">
            <div className="home-stage-copy">
              <h1 className="home-title">
                <span className="home-title-word home-title-word-outline">Fortress</span>
                <span className="home-title-word home-title-word-solid">Foresight</span>
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
              <div className="home-search-field">
                <input
                  id="home-address-search"
                  className="home-search-input"
                  type="text"
                  placeholder="Enter address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                />
                <button className="home-search-icon-button" type="submit" aria-label="Search address">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3.5-3.5" />
                  </svg>
                </button>
              </div>
            </form>
          </article>

          <article
            className="home-stage-panel card"
            onClick={goToNextSlide}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                goToNextSlide()
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Show next story"
          >
            <div className="home-stage-panel-media" aria-hidden="true">
              <video
                className="home-stage-panel-video"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
              >
                <source src="/branding/home/story-background.mp4" type="video/mp4" />
              </video>
              <div className="home-stage-panel-overlay" />
            </div>
            <div className="home-journey-track">
              {JOURNEY_SLIDES.map((slide, index) => (
                <section
                  key={slide.id}
                  className={`home-journey-slide${index === activeSlide ? ' active' : ''}`}
                  aria-hidden={index !== activeSlide}
                >
                  <p className="home-journey-kicker">{slide.label}</p>
                  <div className="home-journey-body">
                    <h2 className="home-journey-title">{slide.title}</h2>
                    <p className="home-journey-text">{slide.text}</p>
                  </div>
                </section>
              ))}
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}

export default HomePage
