/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { firebaseDb } from '../firebase'
import { getHomeLocation, getHomeTitle } from '../utils/homeProfile'
import { readSavedHomes, writeSavedHomes } from '../utils/savedHomesStorage'
import { useAuth } from './AuthContext'
import { persistHome, readStoredHome } from '../utils/homeStorage'

const HomeContext = createContext(null)

function buildSavedPropertyId(home) {
  const baseValue = [
    home?.query || getHomeTitle(home),
    home?.address?.postcode || '',
    home?.lat || '',
    home?.lon || '',
  ]
    .filter(Boolean)
    .join('-')
    .trim()
    .toLowerCase()

  const slug = baseValue.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return slug || `property-${Date.now()}`
}

function normalizeSavedHome(docId, data) {
  return {
    ...data,
    savedPropertyId: docId,
  }
}

function sortSavedHomes(left, right) {
  return getHomeTitle(left).localeCompare(getHomeTitle(right))
}

export function HomeProvider({ children }) {
  const { user, isAuthenticated, loading, propertyLimit } = useAuth()
  const [activeHome, setActiveHome] = useState(() => readStoredHome())
  const [savedHomes, setSavedHomes] = useState([])
  const [savedHomesLoading, setSavedHomesLoading] = useState(false)

  useEffect(() => {
    if (loading) {
      return
    }

    if (!isAuthenticated) {
      setSavedHomes([])
      setActiveHome(null)
      persistHome(null)
    }
  }, [isAuthenticated, loading])

  useEffect(() => {
    if (!firebaseDb || !isAuthenticated || !user?.uid) {
      setSavedHomes([])
      setSavedHomesLoading(false)
      return undefined
    }

    const localHomes = readSavedHomes(user.uid).sort(sortSavedHomes)
    setSavedHomes(localHomes)
    setSavedHomesLoading(true)

    const unsubscribe = onSnapshot(
      collection(firebaseDb, 'users', user.uid, 'properties'),
      (snapshot) => {
        const nextHomes = snapshot.docs
          .map((docSnapshot) => normalizeSavedHome(docSnapshot.id, docSnapshot.data()))
          .sort(sortSavedHomes)

        setSavedHomes(nextHomes)
        writeSavedHomes(user.uid, nextHomes)
        setSavedHomesLoading(false)

        setActiveHome((current) => {
          if (!current) {
            return current
          }

          const currentId = current.savedPropertyId || buildSavedPropertyId(current)
          const matchedHome = nextHomes.find((home) => home.savedPropertyId === currentId)

          if (!matchedHome) {
            return current
          }

          persistHome(matchedHome, { persistent: true })
          return matchedHome
        })
      },
      () => {
        setSavedHomes(readSavedHomes(user.uid).sort(sortSavedHomes))
        setSavedHomesLoading(false)
      },
    )

    return unsubscribe
  }, [isAuthenticated, user?.uid])

  const saveActiveHome = (home) => {
    setActiveHome(home)
    persistHome(home, { persistent: isAuthenticated })
  }

  const clearActiveHome = () => {
    setActiveHome(null)
    persistHome(null)
  }

  const selectSavedHome = (home) => {
    if (!home) {
      return
    }

    setActiveHome(home)
    persistHome(home, { persistent: true })
  }

  const isHomeSaved = (home) => {
    if (!home) {
      return false
    }

    const nextId = home.savedPropertyId || buildSavedPropertyId(home)
    return savedHomes.some((savedHome) => savedHome.savedPropertyId === nextId)
  }

  const saveProperty = async (home) => {
    if (!firebaseDb || !isAuthenticated || !user?.uid || !home) {
      throw new Error('Sign in to save properties.')
    }

    const propertyId = buildSavedPropertyId(home)
    const alreadySaved = savedHomes.some((savedHome) => savedHome.savedPropertyId === propertyId)

    if (!alreadySaved && savedHomes.length >= propertyLimit) {
      throw new Error(`You can save up to ${propertyLimit} properties on this plan.`)
    }

    const savedHome = {
      ...home,
      savedPropertyId: propertyId,
      title: getHomeTitle(home),
      location: getHomeLocation(home),
    }

    const nextHomes = [...savedHomes.filter((savedHomeItem) => savedHomeItem.savedPropertyId !== propertyId), savedHome].sort(sortSavedHomes)

    try {
      await setDoc(
        doc(firebaseDb, 'users', user.uid, 'properties', propertyId),
        {
          ...savedHome,
          updatedAt: serverTimestamp(),
          savedAt: serverTimestamp(),
        },
        { merge: true },
      )
    } catch (error) {
      writeSavedHomes(user.uid, nextHomes)
      setSavedHomes(nextHomes)
      setActiveHome(savedHome)
      persistHome(savedHome, { persistent: true })
      return savedHome
    }

    setActiveHome(savedHome)
    setSavedHomes(nextHomes)
    writeSavedHomes(user.uid, nextHomes)
    persistHome(savedHome, { persistent: true })
    return savedHome
  }

  const removeProperty = async (home) => {
    if (!firebaseDb || !isAuthenticated || !user?.uid || !home) {
      throw new Error('Sign in to manage saved properties.')
    }

    const propertyId = typeof home === 'string' ? home : home.savedPropertyId || buildSavedPropertyId(home)

    try {
      await deleteDoc(doc(firebaseDb, 'users', user.uid, 'properties', propertyId))
    } catch {
      const nextHomes = savedHomes.filter((savedHome) => savedHome.savedPropertyId !== propertyId)
      setSavedHomes(nextHomes)
      writeSavedHomes(user.uid, nextHomes)
    }

    setActiveHome((current) => {
      if (!current) {
        return current
      }

      const currentId = current.savedPropertyId || buildSavedPropertyId(current)

      if (currentId !== propertyId) {
        return current
      }

      const nextHome = { ...current }
      delete nextHome.savedPropertyId
      delete nextHome.savedAt
      delete nextHome.updatedAt
      persistHome(nextHome, { persistent: false })
      return nextHome
    })

    const nextHomes = savedHomes.filter((savedHome) => savedHome.savedPropertyId !== propertyId)
    setSavedHomes(nextHomes)
    writeSavedHomes(user.uid, nextHomes)
  }

  const value = useMemo(
    () => ({
      activeHome,
      savedHomes,
      savedHomesLoading,
      saveActiveHome,
      clearActiveHome,
      selectSavedHome,
      saveProperty,
      removeProperty,
      isHomeSaved,
    }),
    [activeHome, isAuthenticated, propertyLimit, savedHomes, savedHomesLoading, user?.uid],
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
