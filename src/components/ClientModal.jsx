import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { X } from 'lucide-react'

const SCHEDULES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'per_session', label: 'Per Session' },
  { value: 'package', label: 'One-time' },
]

const BLANK = {
  name: '',
  email: '',
  phone: '',
  service_type: '',
  rate: '',
  payment_schedule: 'per_session',
  notes: '',
}

function Field({ label, value, onChange, type = 'text', required, ...props }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-shadow"
        {...props}
      />
    </div>
  )
}

export default function ClientModal({ client, providerId, businessId, onClose, onSaved }) {
  const [form, setForm] = useState(
    client ? { ...client, rate: client.rate?.toString() ?? '' } : { ...BLANK }
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Name is required.')
      return
    }

    setSaving(true)
    setError('')

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone || null,
      service_type: form.service_type || null,
      rate: form.rate ? parseFloat(form.rate) : null,
      payment_schedule: form.payment_schedule,
      notes: form.notes || null,
      updated_at: new Date().toISOString(),
    }

    let err
    if (client) {
      ;({ error: err } = await supabase.from('clients').update(payload).eq('id', client.id))
    } else {
      ;({ error: err } = await supabase.from('clients').insert({ ...payload, provider_id: providerId, business_id: businessId ?? null }))
    }

    if (err) { setError(err.message); setSaving(false) }
    else onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto border border-slate-200 shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="font-semibold text-slate-900">{client ? 'Edit Client' : 'Add Client'}</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="text-red-600 text-xs bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>
          )}

          <Field label="Full Name *" value={form.name} onChange={v => set('name', v)} placeholder="Jane Smith" required />
          <Field label="Email" type="email" value={form.email} onChange={v => set('email', v)} placeholder="jane@email.com" />
          <Field label="Phone" type="tel" value={form.phone} onChange={v => set('phone', v)} placeholder="(555) 555-5555" />
          <Field label="Service Type" value={form.service_type} onChange={v => set('service_type', v)} placeholder="Piano Lessons, Math Tutoring…" />

          <div className="grid grid-cols-2 gap-4">
            <Field label="Default Rate ($)" type="number" min="0" step="0.01" value={form.rate} onChange={v => set('rate', v)} placeholder="150.00" />
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Billing Type</label>
              <select
                value={form.payment_schedule}
                onChange={e => set('payment_schedule', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {SCHEDULES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Any notes about this client…"
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-slate-900 hover:bg-slate-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : client ? 'Save Changes' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
