import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useActiveHome } from '../context/HomeContext'
import { getHomeLocation, getHomeTitle } from '../utils/homeProfile'
import { readSavedHomes } from '../utils/savedHomesStorage'
import './TopBar.css'

function TopBar() {
  const location = useLocation()
  const { isAuthenticated, propertyLimit, user } = useAuth()
  const { activeHome, savedHomes, savedHomesLoading, selectSavedHome, removeProperty } = useActiveHome()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false)
  const mobileMenuRef = useRef(null)
  const desktopMenuRef = useRef(null)
  const homeTitle = getHomeTitle(activeHome)
  const homeLocation = getHomeLocation(activeHome)
  const showHomePill = activeHome && location.pathname !== '/home'
  const showPlanPill = location.pathname !== '/home'
  const showMobileSwitcher = location.pathname !== '/home'
  const fallbackSavedHomes = user?.uid ? readSavedHomes(user.uid) : []
  const visibleSavedHomes = savedHomes.length ? savedHomes : fallbackSavedHomes
  const savedHomeCount = visibleSavedHomes.length

  useEffect(() => {
    setMobileMenuOpen(false)
    setDesktopMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!mobileMenuOpen && !desktopMenuOpen) return undefined

    const handlePointerDown = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false)
      }

      if (desktopMenuRef.current && !desktopMenuRef.current.contains(event.target)) {
        setDesktopMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [desktopMenuOpen, mobileMenuOpen])

  const handleSelectSavedHome = (home) => {
    selectSavedHome(home)
    setMobileMenuOpen(false)
    setDesktopMenuOpen(false)
  }

  const handleRemoveSavedHome = async (event, home) => {
    event.stopPropagation()
    await removeProperty(home)
  }

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
              <div className="topbar-plan-menu-wrap" ref={desktopMenuRef}>
                <button
                  className={`topbar-home-pill topbar-plan-pill topbar-plan-pill-button${desktopMenuOpen ? ' is-open' : ''}`}
                  type="button"
                  aria-expanded={desktopMenuOpen}
                  onClick={() => setDesktopMenuOpen((current) => !current)}
                >
                  <span className="topbar-plan-pill-copy">
                    <span className="topbar-home-title">Saved Properties</span>
                    <span className="topbar-home-meta">{savedHomeCount} of {propertyLimit} saved.</span>
                  </span>
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    className="topbar-plan-pill-icon"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {desktopMenuOpen ? (
                  <div className="topbar-plan-menu">
                    {savedHomesLoading ? (
                      <div className="topbar-plan-menu-empty">Loading properties...</div>
                    ) : visibleSavedHomes.length ? (
                      visibleSavedHomes.map((home) => {
                        const isCurrent = activeHome?.savedPropertyId === home.savedPropertyId

                        return (
                          <div
                            key={home.savedPropertyId}
                            className={`topbar-plan-menu-item${isCurrent ? ' is-active' : ''}`}
                          >
                            <button
                              className="topbar-plan-menu-select"
                              type="button"
                              onClick={() => handleSelectSavedHome(home)}
                            >
                              <span className="topbar-plan-menu-title">{getHomeTitle(home)}</span>
                              <span className="topbar-plan-menu-meta">{getHomeLocation(home) || 'Saved property'}</span>
                            </button>
                            <button
                              className="topbar-plan-menu-remove"
                              type="button"
                              aria-label={`Remove ${getHomeTitle(home)}`}
                              onClick={(event) => handleRemoveSavedHome(event, home)}
                            >
                              ×
                            </button>
                          </div>
                        )
                      })
                    ) : (
                      <div className="topbar-plan-menu-empty">No saved properties yet.</div>
                    )}
                  </div>
                ) : null}
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
                      <span className="topbar-home-meta">{savedHomeCount} of {propertyLimit} saved.</span>
                    </div>
                  ) : (
                    <Link className="topbar-home-pill topbar-plan-pill topbar-plan-pill-link topbar-mobile-menu-card" to="/upgrade">
                      <span className="topbar-home-title">Saved Properties</span>
                      <span className="topbar-home-meta">Upgrade to save properties.</span>
                    </Link>
                  )
                ) : null}
                {isAuthenticated ? (
                  <div className="topbar-mobile-saved-list">
                    {savedHomesLoading ? (
                      <div className="topbar-plan-menu-empty">Loading properties...</div>
                    ) : visibleSavedHomes.length ? (
                      visibleSavedHomes.map((home) => {
                        const isCurrent = activeHome?.savedPropertyId === home.savedPropertyId

                        return (
                          <div
                            key={home.savedPropertyId}
                            className={`topbar-plan-menu-item topbar-mobile-saved-item${isCurrent ? ' is-active' : ''}`}
                          >
                            <button
                              className="topbar-plan-menu-select"
                              type="button"
                              onClick={() => handleSelectSavedHome(home)}
                            >
                              <span className="topbar-plan-menu-title">{getHomeTitle(home)}</span>
                              <span className="topbar-plan-menu-meta">{getHomeLocation(home) || 'Saved property'}</span>
                            </button>
                            <button
                              className="topbar-plan-menu-remove"
                              type="button"
                              aria-label={`Remove ${getHomeTitle(home)}`}
                              onClick={(event) => handleRemoveSavedHome(event, home)}
                            >
                              ×
                            </button>
                          </div>
                        )
                      })
                    ) : (
                      <div className="topbar-plan-menu-empty">No saved properties yet.</div>
                    )}
                  </div>
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
