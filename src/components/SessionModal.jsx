import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { X } from 'lucide-react'
import { format } from 'date-fns'

export default function SessionModal({ client, providerId, onClose, onSaved }) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [form, setForm] = useState({
    session_date: today,
    amount: client.rate?.toString() ?? '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.session_date) { setError('Date is required.'); return }
    setSaving(true)
    setError('')

    const { error: err } = await supabase.from('sessions').insert({
      client_id: client.id,
      provider_id: providerId,
      session_date: form.session_date,
      amount: form.amount ? parseFloat(form.amount) : null,
      notes: form.notes || null,
      status: 'unpaid',
    })

    if (err) { setError(err.message); setSaving(false) }
    else onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-lg text-slate-900">Add Session</h2>
            <p className="text-sm text-slate-500">{client.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Session Date *</label>
            <input
              type="date"
              value={form.session_date}
              onChange={e => set('session_date', e.target.value)}
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={e => set('amount', e.target.value)}
              placeholder={client.rate ? `Default: $${client.rate}` : '0.00'}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
            <input
              type="text"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Optional note…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? 'Adding…' : 'Add Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
