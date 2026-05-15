import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export function useAdmin(user) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loadingAdmin, setLoadingAdmin] = useState(true)

  useEffect(() => {
    if (!user) {
      setIsAdmin(false)
      setLoadingAdmin(false)
      return
    }
    getDoc(doc(db, 'admins', user.email))
      .then(snap => setIsAdmin(snap.exists()))
      .finally(() => setLoadingAdmin(false))
  }, [user])

  return { isAdmin, loadingAdmin }
}