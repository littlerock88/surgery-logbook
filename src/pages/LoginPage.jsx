import { Link } from 'react-router-dom'
import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../lib/firebase'

export default function LoginPage() {
  const [email, setEmail]     = useState('')
  const [pass, setPass]       = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, pass)
    } catch (err) {
      setError('Email or password incorrect.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-gray-800 mb-1">Surgery Logbook</h1>
        <p className="text-sm text-gray-500 mb-6">Year 6 · Department of Surgery</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="student@cmu.ac.th" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required value={pass}
              onChange={e => setPass(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition disabled:opacity-50">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        <p className="text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
        </p>
        </form>
      </div>
    </div>
  )
}