import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { calculateScore } from '../utils/scoreCalculator'
import { Link } from 'react-router-dom'

function ProgressRow({ label, done, required, complete }) {
  const pct = required > 0 ? Math.min((done / required) * 100, 100) : 100
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 text-xs">{label}</span>
        <span className={`text-xs font-medium ${complete ? 'text-green-600' : 'text-gray-400'}`}>
          {complete ? '✓ Done' : `${done}/${required}`}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${complete ? 'bg-green-500' : 'bg-blue-500'}`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function DashboardPage({ user }) {
  const [result, setResult] = useState(null)

  useEffect(() => {
    async function load() {
      const [logsSnap, catalogSnap] = await Promise.all([
        getDocs(query(
          collection(db, 'procedure_logs'),
          where('studentId', '==', user.uid)
        )),
        getDocs(collection(db, 'procedure_catalog')),
      ])
      const logs    = logsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      const catalog = catalogSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      setResult(calculateScore(logs, catalog))
    }
    load()
  }, [user])

  if (!result) return (
    <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
  )

  const scoreColor = result.score === 10 ? 'text-green-400' : result.score === 5 ? 'text-yellow-300' : 'text-red-300'

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-4">

      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl p-5 text-white">
        <p className="text-blue-100 text-xs font-medium mb-1">Year 6 · Department of Surgery · CMU</p>
        <h2 className="text-xl sm:text-2xl font-bold mb-0.5">Surgery Logbook</h2>
        <p className="text-blue-200 text-xs sm:text-sm truncate">{user.email}</p>
      </div>

      {/* Score card */}
      <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 mb-1">Logbook score (estimated)</p>
          <p className={`text-5xl font-bold ${
            result.score === 10 ? 'text-green-600' :
            result.score === 5 ? 'text-yellow-500' : 'text-red-500'
          }`}>
            {result.score}<span className="text-xl text-gray-300">/10</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">{result.uniqueTypes} procedure types logged</p>
        </div>
        <Link to="/log"
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium px-4 py-3 rounded-xl transition text-center leading-tight">
          <span className="block text-lg">+</span>
          <span className="block text-xs">Log</span>
        </Link>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Progress by level</h3>
        {result.level1.detail.map(p => (
          <ProgressRow key={p.id} label={'L1: ' + p.name} done={p.count} required={2} complete={p.done} />
        ))}
        {result.level21.detail.map(p => (
          <ProgressRow key={p.id} label={'L2.1: ' + p.name} done={p.count} required={1} complete={p.done} />
        ))}
        <ProgressRow label="L2.2: Appendectomy or Needle biopsy (need 1)" done={result.level22.done} required={1} complete={result.level22.complete} />
        <ProgressRow label="L5: Major OR (need 4 cases)" done={result.level5.count} required={4} complete={result.level5.complete} />
      </div>

    </div>
  )
}