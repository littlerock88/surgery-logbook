import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './lib/firebase'
import { useAdmin } from './hooks/useAdmin'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import LogbookPage from './pages/LogbookPage'
import HistoryPage from './pages/HistoryPage'
import ExportPage from './pages/ExportPage'
import AdminPage from './pages/AdminPage'
import Navbar from './components/Navbar'

function AppRoutes({ user }) {
  const { isAdmin, loadingAdmin } = useAdmin(user)

  if (loadingAdmin) return (
    <div className="flex h-screen items-center justify-center text-gray-400 text-sm">
      Loading...
    </div>
  )

  return (
    <>
      {user && <Navbar user={user} isAdmin={isAdmin} />}
      <Routes>
        <Route path="/login"    element={!user ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" />} />
        <Route path="/"         element={user ? (isAdmin ? <Navigate to="/admin" /> : <DashboardPage user={user} />) : <Navigate to="/login" />} />
        <Route path="/log"      element={user && !isAdmin ? <LogbookPage   user={user} /> : <Navigate to="/" />} />
        <Route path="/history"  element={user && !isAdmin ? <HistoryPage   user={user} /> : <Navigate to="/" />} />
        <Route path="/export"   element={user && !isAdmin ? <ExportPage    user={user} /> : <Navigate to="/" />} />
        <Route path="/admin"    element={user && isAdmin  ? <AdminPage     user={user} /> : <Navigate to="/" />} />
      </Routes>
    </>
  )
}

export default function App() {
  const [user, setUser]   = useState(undefined)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setReady(true)
    })
    return unsub
  }, [])

  if (!ready) return (
    <div className="flex h-screen items-center justify-center text-gray-400 text-sm">
      Loading...
    </div>
  )

  return (
    <BrowserRouter>
      <AppRoutes user={user} />
    </BrowserRouter>
  )
}