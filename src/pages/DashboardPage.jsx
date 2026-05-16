import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { calculateScore } from '../utils/scoreCalculator'
import { Link } from 'react-router-dom'

function LevelSection({ title, description, required, procedures, logs }) {
  const totalDone = procedures.reduce((sum, proc) => {
    return sum + logs.filter(l => l.procedureId === proc.id).length
  }, 0)
  const totalRequired = procedures.reduce((sum, proc) => sum + (proc.requiredCount || 0), 0)
  const allComplete = procedures.every(proc => {
    const count = logs.filter(l => l.procedureId === proc.id).length
    return proc.requiredCount === 0 || count >= proc.requiredCount
  })

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className={`px-5 py-3 flex items-center justify-between ${allComplete ? 'bg-green-50' : 'bg-gray-50'}`}>
        <div>
          <p className="text-sm font-semibold text-gray-800">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
        {required && (
          <span className={`text-sm font-bold ${allComplete ? 'text-green-600' : 'text-gray-500'}`}>
            {allComplete ? '✓ ครบ' : `${totalDone}/${totalRequired}`}
          </span>
        )}
        {!required && (
          <span className="text-xs text-gray-400">{totalDone} ครั้ง</span>
        )}
      </div>
      <div className="divide-y divide-gray-50">
        {procedures.map(proc => {
          const count = logs.filter(l => l.procedureId === proc.id).length
          const done = proc.requiredCount === 0 || count >= proc.requiredCount
          return (
            <div key={proc.id} className="px-5 py-2.5 flex items-center justify-between">
              <p className="text-xs text-gray-700 flex-1 pr-4">{proc.name}</p>
              <div className="flex items-center gap-2 flex-shrink-0">
                {proc.requiredCount > 0 ? (
                  <>
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${done ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min((count / proc.requiredCount) * 100, 100)}%` }} />
                    </div>
                    <span className={`text-xs font-medium w-8 text-right ${done ? 'text-green-600' : 'text-gray-400'}`}>
                      {count}/{proc.requiredCount}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-gray-400">{count > 0 ? `${count} ครั้ง` : 'optional'}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function DashboardPage({ user }) {
  const [result, setResult] = useState(null)
  const [logs, setLogs] = useState([])
  const [catalog, setCatalog] = useState([])

  useEffect(() => {
    async function load() {
      const [logsSnap, catalogSnap] = await Promise.all([
        getDocs(query(
          collection(db, 'procedure_logs'),
          where('studentId', '==', user.uid)
        )),
        getDocs(collection(db, 'procedure_catalog')),
      ])
      const logsData = logsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      const catalogData = catalogSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      setLogs(logsData)
      setCatalog(catalogData)
      setResult(calculateScore(logsData, catalogData))
    }
    load()
  }, [user])

  if (!result) return (
    <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
  )

  const level1 = catalog.filter(p => p.level === '1')
  const level21 = catalog.filter(p => p.level === '2.1')
  const level22 = catalog.filter(p => p.level === '2.2')
  const level3 = catalog.filter(p => p.level === '3')
  const level5 = catalog.filter(p => p.level === '5')

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

      {/* Level 1 */}
      <LevelSection
        title="ระดับ 1"
        description="ต้องทำด้วยตนเอง — บันทึกอย่างน้อยหัตถการละ 2 ครั้ง"
        required={true}
        procedures={level1}
        logs={logs}
      />

      {/* Level 2 */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className={`px-5 py-3 ${result.level21.complete && result.level22.complete ? 'bg-green-50' : 'bg-gray-50'}`}>
          <p className="text-sm font-semibold text-gray-800">ระดับ 2</p>
          <p className="text-xs text-gray-500 mt-0.5">ภายใต้การกำกับดูแลหรือช่วยทำ — บันทึกอย่างน้อย 1 ครั้ง</p>
        </div>

        {/* Level 2.1 */}
        <div className="px-5 pt-3 pb-1">
          <p className="text-xs font-medium text-gray-500 mb-1">2.1 — ต้องครบทุกหัตถการ</p>
        </div>
        <div className="divide-y divide-gray-50">
          {level21.map(proc => {
            const count = logs.filter(l => l.procedureId === proc.id).length
            const done = count >= 1
            return (
              <div key={proc.id} className="px-5 py-2.5 flex items-center justify-between">
                <p className="text-xs text-gray-700 flex-1 pr-4">{proc.name}</p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${done ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(count * 100, 100)}%` }} />
                  </div>
                  <span className={`text-xs font-medium w-8 text-right ${done ? 'text-green-600' : 'text-gray-400'}`}>
                    {count}/1
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Level 2.2 */}
        <div className="px-5 pt-3 pb-1 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-1">2.2 — ต้องอย่างน้อย 1 จาก 2 หัตถการ</p>
        </div>
        <div className="divide-y divide-gray-50">
          {level22.map(proc => {
            const count = logs.filter(l => l.procedureId === proc.id).length
            const done = count >= 1
            return (
              <div key={proc.id} className="px-5 py-2.5 flex items-center justify-between">
                <p className="text-xs text-gray-700 flex-1 pr-4">{proc.name}</p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${done ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(count * 100, 100)}%` }} />
                  </div>
                  <span className={`text-xs font-medium w-8 text-right ${done ? 'text-green-600' : 'text-gray-400'}`}>
                    {count}/1
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Level 3 */}
      <LevelSection
        title="ระดับ 3"
        description="อาจเห็นหรือช่วย — บันทึกหรือไม่ก็ได้"
        required={false}
        procedures={level3}
        logs={logs}
      />

      {/* Level 5 */}
      <LevelSection
        title="ระดับ 5"
        description="เข้าสังเกตหรือช่วย — บันทึกอย่างน้อย 4 หัตถการ"
        required={true}
        procedures={level5}
        logs={logs}
      />

    </div>
  )
}