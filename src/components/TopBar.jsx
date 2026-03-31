import { Link } from 'react-router-dom'
import './TopBar.css'

function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link
          className="topbar-logo-link"
          to="/property"
          aria-label="FortressForesight home"
        >
          <img
            className="topbar-logo-image"
            src="/branding/logos/fortressforesight-logo-horizontal-transparent.png"
            alt="FortressForesight"
          />
        </Link>
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
