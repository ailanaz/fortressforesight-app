import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

function Login({ initialMode = 'login' }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const modeParam = searchParams.get('mode')
  const resolvedMode = modeParam === 'signup' || modeParam === 'login' ? modeParam : initialMode
  const [mode, setMode] = useState(resolvedMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const { user, loading, isAuthenticated, signIn, signOut, signUp, hasFirebaseConfig } = useAuth()

  const changeMode = (nextMode) => {
    setMode(nextMode)
    setError('')
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.set('mode', nextMode)
      return next
    }, { replace: true })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (isAuthenticated) {
      navigate('/search')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      if (mode === 'login') {
        await signIn(email.trim(), password)
      } else {
        await signUp(email.trim(), password)
      }

      navigate('/search')
    } catch (authError) {
      setError(authError?.message || 'We could not access the account right now.')
    } finally {
      setSubmitting(false)
    }
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

        <form className="login-shell-form" onSubmit={handleSubmit}>
          <div className="login-panel card">
            {loading ? (
              <div className="login-upgrade">
                <h2 className="login-upgrade-title">Checking account</h2>
                <p className="login-upgrade-copy">One moment while FortressForesight loads your account.</p>
              </div>
            ) : isAuthenticated ? (
              <>
                <div className="login-upgrade">
                  <h2 className="login-upgrade-title">Account active</h2>
                  <p className="login-upgrade-copy">
                    Signed in as {user?.email || 'your account'}. Continue to the app or sign out here.
                  </p>
                </div>
              </>
            ) : mode === 'login' ? (
              <>
                <div className="login-upgrade">
                  <h2 className="login-upgrade-title">Welcome back</h2>
                  <p className="login-upgrade-copy">
                    Sign in to access your saved properties, documents, and recovery
                    workspace, and pick up where you left off.
                  </p>
                </div>

                <div className="login-form login-form-inline">
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
                </div>
              </>
            ) : (
              <>
                <div className="login-upgrade">
                  <h2 className="login-upgrade-title">Upgrade to a Foresight Account</h2>
                  <p className="login-upgrade-copy">
                    A Foresight account is a paid option that lets you keep your
                    properties, progress, notes, files, and recovery details saved in
                    one place for when you need them.
                  </p>
                  <div className="login-upgrade-list">
                    <div className="login-upgrade-item">Save up to 2 properties</div>
                    <div className="login-upgrade-item">Save checklist progress and notes</div>
                    <div className="login-upgrade-item">Set alerts with calendar events</div>
                    <div className="login-upgrade-item">Upload documents and photos</div>
                    <div className="login-upgrade-item">Track recovery and insurance claims</div>
                  </div>
                </div>

                <div className="login-form">
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
                </div>
              </>
            )}
          </div>

          {error ? <p className="login-error">{error}</p> : null}
          {!hasFirebaseConfig ? (
            <p className="login-config-note">Firebase web app values still need to be added before sign-in can work.</p>
          ) : null}

          <div className="login-actions login-actions-centered">
            <button className="login-submit login-submit-inline" type="submit" disabled={loading || submitting}>
              {loading
                ? 'Loading...'
                : submitting
                  ? mode === 'login'
                    ? 'Signing In...'
                    : 'Creating Account...'
                  : isAuthenticated
                    ? 'Open App'
                    : mode === 'login'
                      ? 'Sign In'
                      : 'Upgrade to Paid'}
            </button>
          </div>

          <div className="login-utility-row login-utility-row-centered">
            {isAuthenticated ? (
              <button
                className="login-secondary-link"
                type="button"
                onClick={async () => {
                  await signOut()
                  setError('')
                }}
              >
                Sign out
              </button>
            ) : (
              <button
                className="login-secondary-link"
                type="button"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? 'Hide password' : 'Show password'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login
