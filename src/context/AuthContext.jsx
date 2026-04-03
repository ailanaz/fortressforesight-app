/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { firebaseAuth, firebaseDb, hasFirebaseConfig } from '../firebase'

const AuthContext = createContext(null)

function createConfigError() {
  return new Error('Firebase is not configured yet. Add the Firebase web app values first.')
}

async function ensureUserProfile(user) {
  if (!firebaseDb || !user) {
    return
  }

  await setDoc(
    doc(firebaseDb, 'users', user.uid),
    {
      email: user.email || '',
      plan: 'paid',
      propertyLimit: 2,
      updatedAt: serverTimestamp(),
      ...(user.metadata?.creationTime === user.metadata?.lastSignInTime
        ? { createdAt: serverTimestamp() }
        : {}),
    },
    { merge: true },
  )
}

async function syncUserProfile(user) {
  try {
    await ensureUserProfile(user)
  } catch (error) {
    console.warn('User profile sync is not ready yet.', error)
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!firebaseAuth || !hasFirebaseConfig) {
      setLoading(false)
      return undefined
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!firebaseDb || !user) {
      setProfile(null)
      return undefined
    }

    const unsubscribe = onSnapshot(
      doc(firebaseDb, 'users', user.uid),
      (snapshot) => {
        setProfile(snapshot.exists() ? snapshot.data() : null)
      },
      () => {
        setProfile(null)
      },
    )

    return unsubscribe
  }, [user])

  const signIn = async (email, password) => {
    if (!firebaseAuth || !hasFirebaseConfig) {
      throw createConfigError()
    }

    await setPersistence(firebaseAuth, browserLocalPersistence)
    const credential = await signInWithEmailAndPassword(firebaseAuth, email, password)
    await syncUserProfile(credential.user)
    return credential.user
  }

  const signUp = async (email, password) => {
    if (!firebaseAuth || !hasFirebaseConfig) {
      throw createConfigError()
    }

    await setPersistence(firebaseAuth, browserLocalPersistence)
    const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password)
    await syncUserProfile(credential.user)
    return credential.user
  }

  const signOut = async () => {
    if (!firebaseAuth || !hasFirebaseConfig) {
      return
    }

    await firebaseSignOut(firebaseAuth)
  }

  const resetPassword = async (email) => {
    if (!firebaseAuth || !hasFirebaseConfig) {
      throw createConfigError()
    }

    await sendPasswordResetEmail(firebaseAuth, email)
  }

  const deleteAccount = async () => {
    if (!firebaseAuth || !hasFirebaseConfig || !firebaseAuth.currentUser) {
      throw createConfigError()
    }

    const currentUser = firebaseAuth.currentUser

    if (firebaseDb) {
      try {
        await deleteDoc(doc(firebaseDb, 'users', currentUser.uid))
      } catch (error) {
        console.warn('User profile delete is not ready yet.', error)
      }
    }

    await deleteUser(currentUser)
  }

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      isAuthenticated: Boolean(user),
      plan: profile?.plan || (user ? 'paid' : 'guest'),
      propertyLimit: profile?.propertyLimit || (user ? 2 : 0),
      signIn,
      signUp,
      resetPassword,
      signOut,
      deleteAccount,
      hasFirebaseConfig,
    }),
    [loading, profile, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
