import RegisterPage from './pages/RegisterPage'
import AdminPage from './pages/AdminPage'
import ExportPage from './pages/ExportPage'
import HistoryPage from './pages/HistoryPage'
import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './lib/firebase'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import LogbookPage from './pages/LogbookPage'
import Navbar from './components/Navbar'

export default function App() {
  const [user, setUser] = useState(undefined)
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
      {user && <Navbar user={user} />}
      <Routes>
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <DashboardPage user={user} /> : <Navigate to="/login" />} />
        <Route path="/log" element={user ? <LogbookPage user={user} /> : <Navigate to="/login" />} />
        <Route path="/history" element={user ? <HistoryPage user={user} /> : <Navigate to="/login" />} />      
        <Route path="/export" element={user ? <ExportPage user={user} /> : <Navigate to="/login" />} />
        <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" />} />
        <Route path="/admin" element={user ? <AdminPage user={user} /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}