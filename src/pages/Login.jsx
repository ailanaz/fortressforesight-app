import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resetting, setResetting] = useState(false)
  const navigate = useNavigate()
  const { user, loading, isAuthenticated, signIn, signOut, resetPassword, deleteAccount, hasFirebaseConfig } = useAuth()

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (isAuthenticated) {
      navigate('/search')
      return
    }

    setSubmitting(true)
    setError('')
    setNotice('')

    try {
      await signIn(email.trim(), password)
      navigate('/search')
    } catch (authError) {
      setError(authError?.message || 'We could not access the account right now.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      setError('Enter your email first.')
      setNotice('')
      return
    }

    setResetting(true)
    setError('')
    setNotice('')

    try {
      await resetPassword(trimmedEmail)
      setNotice('Password reset email sent.')
    } catch (authError) {
      setError(authError?.message || 'We could not send the reset email right now.')
    } finally {
      setResetting(false)
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
          <button className="login-tab active" type="button">
            Sign In
          </button>
          <Link className="login-tab login-tab-link" to="/upgrade">
            Create Account
          </Link>
        </div>

        <form className="login-shell-form" onSubmit={handleSubmit}>
          <div className="login-panel card">
            {loading ? (
              <div className="login-upgrade">
                <h2 className="login-upgrade-title">Checking account</h2>
                <p className="login-upgrade-copy">One moment while FortressForesight loads your account.</p>
              </div>
            ) : isAuthenticated ? (
              <div className="login-upgrade">
                <h2 className="login-upgrade-title">Account active</h2>
                <p className="login-upgrade-copy">
                  Signed in as {user?.email || 'your account'}. Continue to the app or sign out here.
                </p>
              </div>
            ) : (
              <>
                <div className="login-upgrade">
                  <h2 className="login-upgrade-title">Welcome back</h2>
                  <p className="login-upgrade-copy">
                    Sign in to access your saved properties, documents, and recovery workspace, and pick up where you left off.
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
            )}
          </div>

          {error ? <p className="login-error">{error}</p> : null}
          {notice ? <p className="login-notice">{notice}</p> : null}
          {!hasFirebaseConfig ? (
            <p className="login-config-note">Firebase web app values still need to be added before sign-in can work.</p>
          ) : null}

          <div className="login-actions login-actions-centered">
            <button className="login-submit login-submit-inline" type="submit" disabled={loading || submitting}>
              {loading
                ? 'Loading...'
                : submitting
                  ? 'Signing In...'
                  : isAuthenticated
                    ? 'Open App'
                    : 'Sign In'}
            </button>
          </div>

          <div className="login-utility-row login-utility-row-centered">
            {isAuthenticated ? (
              <div className="login-account-links">
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
                <button
                  className="login-secondary-link login-danger-link"
                  type="button"
                  onClick={async () => {
                    try {
                      await deleteAccount()
                      setError('')
                      navigate('/home')
                    } catch (authError) {
                      setError(authError?.message || 'We could not delete the account right now.')
                    }
                  }}
                >
                  Delete account
                </button>
              </div>
            ) : (
              <div className="login-password-links is-login">
                <button
                  className="login-secondary-link"
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? 'Hide password' : 'Show password'}
                </button>
                <button
                  className="login-secondary-link"
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetting}
                >
                  {resetting ? 'Sending...' : 'Forgot password'}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login
