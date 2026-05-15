import { useEffect, useState } from 'react'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'

export default function HistoryPage({ user }) {
  const [logs, setLogs] = useState([])
  const [catalog, setCatalog] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [logsSnap, catalogSnap] = await Promise.all([
        getDocs(query(
          collection(db, 'procedure_logs'),
          where('studentId', '==', user.uid),
          orderBy('performedDate', 'desc')
        )),
        getDocs(collection(db, 'procedure_catalog')),
      ])
      const catalogMap = {}
      catalogSnap.docs.forEach(d => { catalogMap[d.id] = d.data() })
      setCatalog(catalogMap)
      setLogs(logsSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) return (
    <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
  )

  if (logs.length === 0) return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">History</h2>
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-400 text-sm">
        No procedures logged yet.
      </div>
    </div>
  )

  const ROLE_LABEL = {
    performed: 'Performed independently',
    assisted: 'Assisted / under supervision',
    observed: 'Observed',
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        History
        <span className="ml-2 text-sm font-normal text-gray-400">{logs.length} records</span>
      </h2>

      <div className="space-y-3">
        {logs.map(log => {
          const proc = catalog[log.procedureId]
          return (
            <div key={log.id} className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {proc ? proc.name : 'Unknown procedure'}
                  </p>
                  {log.procedureDetail && (
                    <p className="text-xs text-blue-600 mt-0.5">{log.procedureDetail}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{log.performedDate}</p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full whitespace-nowrap">
                  L{proc ? proc.level : '?'}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                <p className="text-xs text-gray-500">
                  Role: {ROLE_LABEL[log.studentRole] || log.studentRole}
                </p>
                <p className="text-xs text-gray-500">
                  Supervisor: {log.supervisorName}
                </p>
                <p className="text-xs text-gray-500">
                  Location: {log.location}
                </p>
                {log.notes && (
                  <p className="text-xs text-gray-500">
                    Notes: {log.notes}
                  </p>
                )}
                {log.supervisorSignature && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Supervisor signature:</p>
                    <img src={log.supervisorSignature} alt="signature"
                      className="h-12 border border-gray-100 rounded bg-white" />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}