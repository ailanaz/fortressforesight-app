import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import TopBar from './TopBar'
import './Layout.css'

function Layout() {
  return (
    <div className="layout">
      <TopBar />
      <main className="layout-main">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}

export default Layout
