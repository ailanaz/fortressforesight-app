import { HashRouter as Router, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
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
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/property" replace />} />
          <Route path="property" element={<PropertyProfile />} />
          <Route path="documents" element={<DocumentStorage />} />
          <Route path="readiness" element={<ReadinessCenter />} />
          <Route path="recovery" element={<RecoveryTracker />} />
          <Route path="knowledge" element={<KnowledgeBase />} />
          <Route path="contacts" element={<EmergencyContacts />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
