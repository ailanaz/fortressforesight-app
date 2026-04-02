/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { persistHome, readStoredHome } from '../utils/homeStorage'

const HomeContext = createContext(null)

export function HomeProvider({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const [activeHome, setActiveHome] = useState(() => readStoredHome())

  useEffect(() => {
    if (loading) {
      return
    }

    if (!isAuthenticated) {
      setActiveHome(null)
      persistHome(null)
    }
  }, [isAuthenticated, loading])

  const saveActiveHome = (home) => {
    setActiveHome(home)
    persistHome(home, { persistent: isAuthenticated })
  }

  const clearActiveHome = () => {
    setActiveHome(null)
    persistHome(null)
  }

  const value = useMemo(
    () => ({
      activeHome,
      saveActiveHome,
      clearActiveHome,
    }),
    [activeHome],
  )

  return <HomeContext.Provider value={value}>{children}</HomeContext.Provider>
}

export function useActiveHome() {
  const context = useContext(HomeContext)

  if (!context) {
    throw new Error('useActiveHome must be used inside HomeProvider')
  }

  return context
}
