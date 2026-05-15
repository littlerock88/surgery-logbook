import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, addDoc, serverTimestamp, orderBy, query } from 'firebase/firestore'
import { db } from '../lib/firebase'
import SignatureCanvas from 'react-signature-canvas'

const LOCATIONS = [
  'Maharaj Nakorn Chiang Mai Hospital',
  'Affiliated Hospital',
  'Other',
]

const ROLES = [
  { value: 'performed', label: 'Performed independently' },
  { value: 'assisted', label: 'Assisted / under supervision' },
  { value: 'observed', label: 'Observed' },
]

const LEVEL_ORDER = ['1', '2.1', '2.2', '3', '5']

export default function LogbookPage({ user }) {
  const navigate = useNavigate()
  const [catalog, setCatalog] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    procedureId: '',
    procedureDetail: '',
    performedDate: new Date().toISOString().slice(0, 10),
    location: LOCATIONS[0],
    studentRole: 'performed',
    supervisorName: '',
    notes: '',
  })
  const sigRef = useRef(null)

  useEffect(() => {
    getDocs(query(collection(db, 'procedure_catalog'), orderBy('level')))
      .then(snap => setCatalog(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [])

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }))

  const selectedProcedure = catalog.find(p => p.id === form.procedureId)
  const isLevel5 = selectedProcedure?.level === '5'

  function clearSignature() {
    sigRef.current?.clear()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.procedureId) return setError('Please select a procedure.')
    if (isLevel5 && !form.procedureDetail.trim()) return setError('Please describe the procedure.')
    if (!form.supervisorName.trim()) return setError('Please enter supervisor name.')
    if (new Date(form.performedDate) > new Date()) return setError('Date cannot be in the future.')
    if (!sigRef.current || sigRef.current.isEmpty()) return setError('Please get supervisor signature.')

    setSaving(true)
    try {
      const signatureData = sigRef.current.toDataURL('image/png')

      await addDoc(collection(db, 'procedure_logs'), {
        studentId: user.uid,
        procedureId: form.procedureId,
        procedureDetail: isLevel5 ? form.procedureDetail.trim() : null,
        performedDate: form.performedDate,
        location: form.location,
        studentRole: form.studentRole,
        supervisorName: form.supervisorName.trim(),
        supervisorSignature: signatureData,
        notes: form.notes.trim(),
        createdAt: serverTimestamp(),
      })
      navigate('/history')
    } catch (err) {
      setError('Failed to save. Please try again.')
    }
    setSaving(false)
  }

  const byLevel = catalog.reduce((acc, p) => {
    acc[p.level] = acc[p.level] || []
    acc[p.level].push(p)
    return acc
  }, {})

  const sortedLevels = LEVEL_ORDER.filter(l => byLevel[l])

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Log a Procedure</h2>
      <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-2xl shadow-sm p-6">

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Procedure</label>
          <select required value={form.procedureId} onChange={set('procedureId')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">-- Select procedure --</option>
            {sortedLevels.map(level => (
              <optgroup key={level} label={'Level ' + level}>
                {byLevel[level].map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {isLevel5 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Operation name</label>
            <input type="text"
              value={form.procedureDetail}
              onChange={set('procedureDetail')}
              placeholder="e.g. Cholecystectomy, Colectomy"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date performed</label>
          <input type="date" required
            value={form.performedDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={set('performedDate')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <select value={form.location} onChange={set('location')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            {LOCATIONS.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your role</label>
          <select required value={form.studentRole} onChange={set('studentRole')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor name</label>
          <input type="text" required
            value={form.supervisorName}
            onChange={set('supervisorName')}
            placeholder="e.g. Asst. Prof. Somchai"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea rows={3}
            value={form.notes}
            onChange={set('notes')}
            placeholder="Additional details, findings, etc."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Supervisor signature
            </label>
            <button type="button" onClick={clearSignature}
              className="text-xs text-gray-400 hover:text-red-500 transition">
              Clear
            </button>
          </div>
          <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
            <SignatureCanvas
              ref={sigRef}
              penColor="black"
              canvasProps={{
                width: 500,
                height: 150,
                className: 'w-full',
                style: { touchAction: 'none' }
              }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">ให้ผู้ควบคุมเซ็นชื่อในกรอบด้านบน</p>
        </div>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <button type="submit" disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Procedure'}
        </button>

      </form>
    </div>
  )
}