import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { collection, getDocs, query, where, doc, deleteDoc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

const LOCATIONS = [
  'Maharaj Nakorn Chiang Mai Hospital',
  'Affiliated Hospital',
  'Other',
]

export default function StudentDetailPage() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [catalog, setCatalog] = useState({})
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    async function load() {
      const [logsSnap, catalogSnap, profileSnap] = await Promise.all([
        getDocs(query(
          collection(db, 'procedure_logs'),
          where('studentId', '==', studentId)
        )),
        getDocs(collection(db, 'procedure_catalog')),
        getDocs(query(
          collection(db, 'student_profiles'),
          where('__name__', '==', studentId)
        )),
      ])

      const catalogMap = {}
      catalogSnap.docs.forEach(d => { catalogMap[d.id] = d.data() })
      setCatalog(catalogMap)

      const logList = logsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      logList.sort((a, b) => a.performedDate > b.performedDate ? -1 : 1)
      setLogs(logList)

      if (profileSnap.docs.length > 0) {
        setProfile(profileSnap.docs[0].data())
      }
      setLoading(false)
    }
    load()
  }, [studentId])

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
    if (!window.confirm('ลบ record นี้ถาวร?')) return
    setDeleting(logId)
    try {
      await deleteDoc(doc(db, 'procedure_logs', logId))
      setLogs(prev => prev.filter(l => l.id !== logId))
    } catch (err) {
      alert('Failed to delete.')
    }
    setDeleting(null)
  }

  const set = field => e => setEditForm(f => ({ ...f, [field]: e.target.value }))

  if (loading) return (
    <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={() => navigate('/admin')}
        className="text-sm text-gray-500 hover:text-gray-800 mb-4 flex items-center gap-1">
        ← Back to Admin
      </button>

      <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
        <h2 className="text-xl font-semibold text-gray-800">{profile?.fullName}</h2>
        <p className="text-sm text-gray-400">Student ID: {profile?.studentId}</p>
        <p className="text-sm text-gray-400">{profile?.email}</p>
        <p className="text-sm text-gray-500 mt-2">{logs.length} procedures logged</p>
      </div>

      <div className="space-y-3">
        {logs.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-400 text-sm">
            No procedures logged yet.
          </div>
        )}

        {logs.map(log => {
          const proc = catalog[log.procedureId]
          const isEditing = editingId === log.id

          return (
            <div key={log.id} className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {proc ? proc.name : 'Unknown'}
                  </p>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    Level {proc?.level}
                  </span>
                </div>
                {!isEditing && (
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(log)}
                      className="text-xs text-blue-500 hover:text-blue-700 hover:underline">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(log.id)}
                      disabled={deleting === log.id}
                      className="text-xs text-red-500 hover:text-red-700 hover:underline disabled:opacity-50">
                      {deleting === log.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3 border-t pt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                    <input type="date"
                      value={editForm.performedDate}
                      onChange={set('performedDate')}
                      max={new Date().toISOString().slice(0, 10)}
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
                <div className="space-y-1 border-t pt-3">
                  <p className="text-xs text-gray-500">Date: {log.performedDate}</p>
                  <p className="text-xs text-gray-500">Location: {log.location}</p>
                  <p className="text-xs text-gray-500">Supervisor: {log.supervisorName}</p>
                  {log.procedureDetail && (
                    <p className="text-xs text-blue-500">Operation: {log.procedureDetail}</p>
                  )}
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