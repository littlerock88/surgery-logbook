import { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { Link } from 'react-router-dom'

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: '',
    studentId: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }))

  async function handleRegister(e) {
    e.preventDefault()
    setError('')

    if (!form.fullName.trim()) return setError('Please enter your full name.')
    if (!form.studentId.trim()) return setError('Please enter your student ID.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.')

    setLoading(true)

    try {
      const idRef = doc(db, 'student_ids', form.studentId.trim())
      const idSnap = await getDoc(idRef)
      if (idSnap.exists()) {
        setError('This student ID is already registered.')
        setLoading(false)
        return
      }

      const { user } = await createUserWithEmailAndPassword(auth, form.email, form.password)

      await Promise.all([
        setDoc(doc(db, 'student_profiles', user.uid), {
          fullName: form.fullName.trim(),
          studentId: form.studentId.trim(),
          email: form.email,
          createdAt: new Date().toISOString(),
        }),
        setDoc(idRef, {
          uid: user.uid,
          registeredAt: new Date().toISOString(),
        }),
      ])

    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered.')
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.')
      } else {
        setError('Registration failed. Please try again.')
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-gray-800 mb-1">Register</h1>
        <p className="text-sm text-gray-500 mb-6">Year 6 · Department of Surgery</p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full name
            </label>
            <input type="text" required
              value={form.fullName}
              onChange={set('fullName')}
              placeholder="e.g. Somchai Jaidee"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student ID
            </label>
            <input type="text" required
              value={form.studentId}
              onChange={set('studentId')}
              placeholder="e.g. 630510001"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input type="email" required
              value={form.email}
              onChange={set('email')}
              placeholder="student@cmu.ac.th"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input type="password" required
              value={form.password}
              onChange={set('password')}
              placeholder="At least 6 characters"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm password
            </label>
            <input type="password" required
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition disabled:opacity-50">
            {loading ? 'Registering...' : 'Register'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}