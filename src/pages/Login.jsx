import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Login.css'

function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (event) => {
    event.preventDefault()
    navigate('/search')
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <Link className="login-back-link" to="/search">
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
        <p className="login-description">
          FortressForesight helps protect the property that protects you by combining
          pre-purchase and homeownership risk awareness, secure home recordkeeping,
          disaster preparation, and guided recovery support in one place.
        </p>

        <div className="login-tabs">
          <button
            className={`login-tab${mode === 'login' ? ' active' : ''}`}
            onClick={() => setMode('login')}
          >
            Sign In
          </button>
          <button
            className={`login-tab${mode === 'signup' ? ' active' : ''}`}
            onClick={() => setMode('signup')}
          >
            Create Account
          </button>
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
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className={`login-actions${mode === 'signup' ? ' login-actions-single' : ''}`}>
          <button
            className="login-secondary-link"
            type="button"
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? 'Hide password' : 'Show password'}
          </button>
          {mode === 'login' ? (
            <button className="login-secondary-link" type="button">
              Forgot password?
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default Login
