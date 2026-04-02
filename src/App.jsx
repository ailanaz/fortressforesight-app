import { HashRouter as Router, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import RequirePaidAccess from './components/RequirePaidAccess'
import { AuthProvider } from './context/AuthContext'
import { HomeProvider } from './context/HomeContext'
import HomePage from './pages/HomePage'
import PropertyProfile from './pages/PropertyProfile'
import DocumentStorage from './pages/DocumentStorage'
import ReadinessCenter from './pages/ReadinessCenter'
import RecoveryTracker from './pages/RecoveryTracker'
import KnowledgeBase from './pages/KnowledgeBase'
import EmergencyContacts from './pages/EmergencyContacts'
import Login from './pages/Login'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <HomeProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/upgrade" element={<Login initialMode="signup" />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/home" replace />} />
              <Route path="home" element={<HomePage />} />
              <Route path="search" element={<PropertyProfile />} />
              <Route path="property" element={<Navigate to="/search" replace />} />
              <Route
                path="documents"
                element={(
                  <RequirePaidAccess>
                    <DocumentStorage />
                  </RequirePaidAccess>
                )}
              />
              <Route
                path="readiness"
                element={(
                  <RequirePaidAccess>
                    <ReadinessCenter />
                  </RequirePaidAccess>
                )}
              />
              <Route
                path="recovery"
                element={(
                  <RequirePaidAccess>
                    <RecoveryTracker />
                  </RequirePaidAccess>
                )}
              />
              <Route path="knowledge" element={<KnowledgeBase />} />
              <Route
                path="contacts"
                element={(
                  <RequirePaidAccess>
                    <EmergencyContacts />
                  </RequirePaidAccess>
                )}
              />
            </Route>
          </Routes>
        </Router>
      </HomeProvider>
    </AuthProvider>
  )
}

export default App
