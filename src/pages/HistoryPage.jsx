import { useEffect, useState } from 'react'
import { collection, getDocs, query, where, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

const LOCATIONS = [
  'Maharaj Nakorn Chiang Mai Hospital',
  'Affiliated Hospital',
  'Other',
]

export default function HistoryPage({ user }) {
  const [logs, setLogs] = useState([])
  const [catalog, setCatalog] = useState({})
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

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

  function startEdit(log) {
    setEditingId(log.id)
    setEditForm({
      performedDate: log.performedDate,
      location: log.location,
      supervisorName: log.supervisorName,
      procedureDetail: log.procedureDetail || '',
      notes: log.notes || '',
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm({})
  }

  const set = field => e => setEditForm(f => ({ ...f, [field]: e.target.value }))

  async function handleSave(logId) {
    setSaving(true)
    try {
      await updateDoc(doc(db, 'procedure_logs', logId), {
        performedDate: editForm.performedDate,
        location: editForm.location,
        supervisorName: editForm.supervisorName,
        procedureDetail: editForm.procedureDetail || null,
        notes: editForm.notes,
      })
      setLogs(prev => prev.map(l =>
        l.id === logId ? { ...l, ...editForm } : l
      ))
      setEditingId(null)
    } catch (err) {
      alert('Failed to save. Please try again.')
    }
    setSaving(false)
  }

  async function handleDelete(logId) {
    if (!window.confirm('ลบหัตถการนี้ถาวร?')) return
    setDeleting(logId)
    try {
      await deleteDoc(doc(db, 'procedure_logs', logId))
      setLogs(prev => prev.filter(l => l.id !== logId))
    } catch (err) {
      alert('Failed to delete.')
    }
    setDeleting(null)
  }

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

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        History
        <span className="ml-2 text-sm font-normal text-gray-400">{logs.length} records</span>
      </h2>

      <div className="space-y-3">
        {logs.map(log => {
          const proc = catalog[log.procedureId]
          const isEditing = editingId === log.id

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
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full whitespace-nowrap">
                    L{proc ? proc.level : '?'}
                  </span>
                  {!isEditing && (
                    <>
                      <button onClick={() => startEdit(log)}
                        className="text-xs text-blue-500 hover:text-blue-700 hover:underline">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(log.id)}
                        disabled={deleting === log.id}
                        className="text-xs text-red-500 hover:text-red-700 hover:underline disabled:opacity-50">
                        {deleting === log.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-3 border-t border-gray-100 mt-3 pt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                    <input type="date"
                      value={editForm.performedDate}
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={set('performedDate')}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                    <select value={editForm.location} onChange={set('location')}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                      {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Supervisor name</label>
                    <input type="text"
                      value={editForm.supervisorName}
                      onChange={set('supervisorName')}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
                  </div>
                  {proc?.level === '5' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Operation name</label>
                      <input type="text"
                        value={editForm.procedureDetail}
                        onChange={set('procedureDetail')}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                    <textarea rows={2}
                      value={editForm.notes}
                      onChange={set('notes')}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSave(log.id)} disabled={saving}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1.5 rounded-lg transition disabled:opacity-50">
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={cancelEdit}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium py-1.5 rounded-lg transition">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 border-t border-gray-100 mt-3 pt-3">
                  <p className="text-xs text-gray-500">Supervisor: {log.supervisorName}</p>
                  <p className="text-xs text-gray-500">Location: {log.location}</p>
                  {log.notes && (
                    <p className="text-xs text-gray-500">Notes: {log.notes}</p>
                  )}
                  {log.supervisorSignature && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Supervisor signature:</p>
                      <img src={log.supervisorSignature} alt="signature"
                        className="h-12 border border-gray-100 rounded bg-white" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}