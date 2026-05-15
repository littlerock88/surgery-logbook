import { useEffect, useState, useRef } from 'react'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'

export default function ExportPage({ user }) {
  const [logs, setLogs] = useState([])
  const [catalog, setCatalog] = useState({})
  const [loading, setLoading] = useState(true)
  const printRef = useRef()

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

  function handlePrint() {
    window.print()
  }

  const ROLE_LABEL = {
    performed: 'Performed independently',
    assisted: 'Assisted / under supervision',
    observed: 'Observed',
  }

  const level1 = logs.filter(l => catalog[l.procedureId]?.level === '1')
  const level21 = logs.filter(l => catalog[l.procedureId]?.level === '2.1')
  const level22 = logs.filter(l => catalog[l.procedureId]?.level === '2.2')
  const level3 = logs.filter(l => catalog[l.procedureId]?.level === '3')
  const level5 = logs.filter(l => catalog[l.procedureId]?.level === '5')

  if (loading) return (
    <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Export Logbook</h2>
        <button onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition">
          Print / Save PDF
        </button>
      </div>

      <div ref={printRef} className="bg-white rounded-2xl shadow-sm p-8 space-y-6">

        <div className="text-center border-b pb-4">
          <h1 className="text-xl font-bold text-gray-800">Surgery Logbook</h1>
          <p className="text-sm text-gray-500 mt-1">Year 6 · Department of Surgery · CMU</p>
          <p className="text-sm text-gray-500">{user.email}</p>
          <p className="text-xs text-gray-400 mt-1">Printed: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-3xl font-bold text-gray-800">{logs.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total procedures</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-3xl font-bold text-gray-800">
              {new Set(logs.map(l => l.procedureId)).size}
            </p>
            <p className="text-xs text-gray-500 mt-1">Procedure types</p>
          </div>
        </div>

        {[
          { label: 'Level 1 — Performed independently (need 2 each)', data: level1 },
          { label: 'Level 2.1 — Under supervision (need 1 each)', data: level21 },
          { label: 'Level 2.2 — Under supervision (need 1 of 2)', data: level22 },
          { label: 'Level 3 — Optional', data: level3 },
          { label: 'Level 5 — Major OR (need 4)', data: level5 },
        ].map(section => section.data.length > 0 && (
          <div key={section.label}>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 border-b pb-1">
              {section.label}
            </h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 text-left">
                  <th className="pb-1 font-medium w-6">#</th>
                  <th className="pb-1 font-medium">Procedure</th>
                  <th className="pb-1 font-medium">Date</th>
                  <th className="pb-1 font-medium">Role</th>
                  <th className="pb-1 font-medium">Supervisor</th>
                </tr>
              </thead>
              <tbody>
                {section.data.map((log, i) => (
                  <tr key={log.id} className="border-t border-gray-100 align-top">
                    <td className="py-1.5 text-gray-400">{i + 1}</td>
                    <td className="py-1.5 text-gray-700">
                      {catalog[log.procedureId]?.name}
                      {log.procedureDetail && (
                        <span className="block text-blue-500">{log.procedureDetail}</span>
                      )}
                    </td>
                    <td className="py-1.5 text-gray-500">{log.performedDate}</td>
                    <td className="py-1.5 text-gray-500">{ROLE_LABEL[log.studentRole]?.split(' /')[0]}</td>
                    <td className="py-1.5 text-gray-500">{log.supervisorName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      </div>
    </div>
  )
}