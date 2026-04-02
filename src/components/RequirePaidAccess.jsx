import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function RequirePaidAccess({ children }) {
  const location = useLocation()
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/upgrade" replace state={{ from: location.pathname }} />
  }

  return children
}

export default RequirePaidAccess
