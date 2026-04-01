import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import './Login.css'

function Login({ initialMode = 'login' }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const modeParam = searchParams.get('mode')
  const resolvedMode = modeParam === 'signup' || modeParam === 'login' ? modeParam : initialMode
  const [mode, setMode] = useState(resolvedMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const changeMode = (nextMode) => {
    setMode(nextMode)
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.set('mode', nextMode)
      return next
    }, { replace: true })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    navigate('/search')
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <Link className="login-back-link" to="/home">
          Back to Home
        </Link>
        <img
          className="login-logo-image"
          src="/branding/logos/fortressforesight-logo-horizontal-transparent.png"
          alt="FortressForesight"
        />
        <p className="login-tagline">
          Clarity before disaster. Structure during crisis. Confidence through recovery.
        </p>

        <div className="login-tabs">
          <button
            className={`login-tab${mode === 'login' ? ' active' : ''}`}
            onClick={() => changeMode('login')}
          >
            Sign In
          </button>
          <button
            className={`login-tab${mode === 'signup' ? ' active' : ''}`}
            onClick={() => changeMode('signup')}
          >
            Create Account
          </button>
        </div>

        <div className="login-panel card">
          {mode === 'login' ? (
            <form className="login-form login-form-inline" onSubmit={handleSubmit}>
              <input
                className="login-input"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <input
                className="login-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button className="login-submit" type="submit">
                Sign In
              </button>

              <div className="login-actions">
                <button
                  className="login-secondary-link"
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? 'Hide password' : 'Show password'}
                </button>
                <button className="login-secondary-link" type="button">
                  Forgot password?
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="login-upgrade">
                <h2 className="login-upgrade-title">Upgrade</h2>
                <p className="login-upgrade-copy">
                  Save and organize your home in one place.
                </p>
                <div className="login-upgrade-list">
                  <div className="login-upgrade-item">Save up to 2 properties</div>
                  <div className="login-upgrade-item">Save checklist progress</div>
                  <div className="login-upgrade-item">Save notes and calendar events</div>
                  <div className="login-upgrade-item">Upload documents and photos</div>
                  <div className="login-upgrade-item">Track recovery in one place</div>
                </div>
              </div>

              <form className="login-form" onSubmit={handleSubmit}>
                <input
                  className="login-input"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
                <input
                  className="login-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button className="login-submit" type="submit">
                  Create Account
                </button>
              </form>

              <div className="login-actions login-actions-single">
                <button
                  className="login-secondary-link"
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? 'Hide password' : 'Show password'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login
