import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useActiveHome } from '../context/HomeContext'
import { getHomeLocation, getHomeTitle } from '../utils/homeProfile'
import './TopBar.css'

function TopBar() {
  const location = useLocation()
  const { isAuthenticated, propertyLimit } = useAuth()
  const { activeHome } = useActiveHome()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef(null)
  const homeTitle = getHomeTitle(activeHome)
  const homeLocation = getHomeLocation(activeHome)
  const showHomePill = activeHome && location.pathname !== '/home'
  const showPlanPill = location.pathname !== '/home'
  const showMobileSwitcher = location.pathname !== '/home'

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!mobileMenuOpen) return undefined

    const handlePointerDown = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [mobileMenuOpen])

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="topbar-brand-group">
          <Link
            className="topbar-logo-link"
            to="/home"
            aria-label="FortressForesight home"
          >
            <img
              className="topbar-logo-image"
              src="/branding/logos/fortressforesight-logo-header-xl.png"
              alt="FortressForesight"
            />
          </Link>
          {showHomePill ? (
            <div className="topbar-home-pill">
              <span className="topbar-home-title">{homeTitle}</span>
              {homeLocation ? (
                <span className="topbar-home-meta">{homeLocation}</span>
              ) : null}
            </div>
          ) : null}
          {showPlanPill ? (
            isAuthenticated ? (
              <div className="topbar-home-pill topbar-plan-pill">
                <span className="topbar-home-title">Saved Properties</span>
                <span className="topbar-home-meta">Up to {propertyLimit} properties.</span>
              </div>
            ) : (
              <Link className="topbar-home-pill topbar-plan-pill topbar-plan-pill-link" to="/upgrade">
                <span className="topbar-home-title">Saved Properties</span>
                <span className="topbar-home-meta">Upgrade to save properties.</span>
              </Link>
            )
          ) : null}
        </div>
        {showMobileSwitcher ? (
          <div className="topbar-mobile-switcher" ref={mobileMenuRef}>
            <button
              className={`topbar-mobile-toggle${mobileMenuOpen ? ' is-open' : ''}`}
              type="button"
              aria-label="Property menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((current) => !current)}
            >
              <span className="topbar-mobile-toggle-copy">
                <span className="topbar-mobile-toggle-title">{showHomePill ? homeTitle : 'Saved Properties'}</span>
                <span className="topbar-mobile-toggle-meta">{showHomePill ? 'Tap for more' : isAuthenticated ? `Up to ${propertyLimit} properties` : 'Upgrade to save'}</span>
              </span>
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                className="topbar-mobile-toggle-icon"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {mobileMenuOpen ? (
              <div className="topbar-mobile-menu">
                {showHomePill ? (
                  <Link className="topbar-home-pill topbar-mobile-menu-card topbar-plan-pill-link" to="/search">
                    <span className="topbar-home-title">{homeTitle}</span>
                    {homeLocation ? <span className="topbar-home-meta">{homeLocation}</span> : null}
                  </Link>
                ) : null}
                {showPlanPill ? (
                  isAuthenticated ? (
                    <div className="topbar-home-pill topbar-plan-pill topbar-mobile-menu-card">
                      <span className="topbar-home-title">Saved Properties</span>
                      <span className="topbar-home-meta">Up to {propertyLimit} properties.</span>
                    </div>
                  ) : (
                    <Link className="topbar-home-pill topbar-plan-pill topbar-plan-pill-link topbar-mobile-menu-card" to="/upgrade">
                      <span className="topbar-home-title">Saved Properties</span>
                      <span className="topbar-home-meta">Upgrade to save properties.</span>
                    </Link>
                  )
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
        <Link
          className={`topbar-account${isAuthenticated ? ' is-authenticated' : ''}`}
          aria-label="Account"
          title={isAuthenticated ? 'Signed in account' : 'Account'}
          to="/login"
        >
          <svg
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </Link>
      </div>
    </header>
  )
}

export default TopBar
