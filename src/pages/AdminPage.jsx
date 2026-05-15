import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { calculateScore } from '../utils/scoreCalculator'

const ADMIN_EMAILS = import.meta.env.VITE_ADMIN_EMAILS?.split(',') || []

export default function AdminPage({ user }) {
  const [students, setStudents] = useState([])
  const [catalog, setCatalog] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!ADMIN_EMAILS.includes(user.email)) return

    async function load() {
      const [profilesSnap, logsSnap, catalogSnap] = await Promise.all([
        getDocs(collection(db, 'student_profiles')),
        getDocs(collection(db, 'procedure_logs')),
        getDocs(collection(db, 'procedure_catalog')),
      ])

      const catalog = catalogSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      setCatalog(catalog)

      const logs = logsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

      const studentList = profilesSnap.docs.map(d => {
        const profile = { id: d.id, ...d.data() }
        const studentLogs = logs.filter(l => l.studentId === d.id)
        const score = calculateScore(studentLogs, catalog)
        return { ...profile, ...score, totalLogs: studentLogs.length }
      })

      studentList.sort((a, b) => a.fullName?.localeCompare(b.fullName, 'th'))
      setStudents(studentList)
      setLoading(false)
    }
    load()
  }, [user])

  if (!ADMIN_EMAILS.includes(user.email)) {
    return (
      <div className="p-8 text-center text-red-500 text-sm">
        Access denied. Admin only.
      </div>
    )
  }

  if (loading) return (
    <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
  )

  const filtered = filter === 'incomplete'
    ? students.filter(s => !s.allComplete)
    : filter === 'complete'
    ? students.filter(s => s.allComplete)
    : students

  const totalComplete = students.filter(s => s.allComplete).length
  const totalIncomplete = students.filter(s => !s.allComplete).length

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Admin — Student Overview</h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-gray-800">{students.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total students</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{totalComplete}</p>
          <p className="text-xs text-gray-500 mt-1">Completed</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-red-500">{totalIncomplete}</p>
          <p className="text-xs text-gray-500 mt-1">Incomplete</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {[
          { value: 'all', label: 'All' },
          { value: 'incomplete', label: 'Incomplete only' },
          { value: 'complete', label: 'Complete only' },
        ].map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`text-sm px-4 py-1.5 rounded-full border transition ${
              filter === f.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'text-gray-500 border-gray-300 hover:border-gray-400'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="text-left px-4 py-3 font-medium">#</th>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Student ID</th>
              <th className="text-center px-4 py-3 font-medium">Score</th>
              <th className="text-center px-4 py-3 font-medium">L1</th>
              <th className="text-center px-4 py-3 font-medium">L2.1</th>
              <th className="text-center px-4 py-3 font-medium">L2.2</th>
              <th className="text-center px-4 py-3 font-medium">L5</th>
              <th className="text-center px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                <td className="px-4 py-3 text-gray-800 font-medium">{s.fullName}</td>
                <td className="px-4 py-3 text-gray-500">{s.studentId}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-bold ${
                    s.score === 10 ? 'text-green-600' :
                    s.score === 5 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {s.score}/10
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {s.level1.complete ? '✅' : '❌'}
                </td>
                <td className="px-4 py-3 text-center">
                  {s.level21.complete ? '✅' : '❌'}
                </td>
                <td className="px-4 py-3 text-center">
                  {s.level22.complete ? '✅' : '❌'}
                </td>
                <td className="px-4 py-3 text-center">
                  {s.level5.complete ? '✅' : '❌'}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    s.allComplete
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {s.allComplete ? 'Complete' : 'Incomplete'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">
            No students found.
          </div>
        )}
      </div>
    </div>
  )
}