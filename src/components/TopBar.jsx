import { Link, useLocation } from 'react-router-dom'
import { useActiveHome } from '../context/HomeContext'
import { getHomeLocation, getHomeTitle } from '../utils/homeProfile'
import './TopBar.css'

function TopBar() {
  const location = useLocation()
  const { activeHome } = useActiveHome()
  const homeTitle = getHomeTitle(activeHome)
  const homeLocation = getHomeLocation(activeHome)
  const showHomePill = activeHome && location.pathname !== '/home'
  const showPlanPill = location.pathname !== '/home'

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
            <div className="topbar-home-pill topbar-plan-pill">
              <span className="topbar-home-title">Saved Properties</span>
              <span className="topbar-home-meta">Upgrade for more</span>
            </div>
          ) : null}
        </div>
        <Link className="topbar-account" aria-label="Account" to="/login">
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
