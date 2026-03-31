/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react'
import { persistHome, readStoredHome } from '../utils/homeStorage'

const HomeContext = createContext(null)

export function HomeProvider({ children }) {
  const [activeHome, setActiveHome] = useState(() => readStoredHome())

  const saveActiveHome = (home) => {
    setActiveHome(home)
    persistHome(home)
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
