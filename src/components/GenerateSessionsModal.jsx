import { useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { generateSessionDates, formatDate, formatCurrency } from '../lib/utils'
import { X } from 'lucide-react'
import { format } from 'date-fns'

const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
]

export default function GenerateSessionsModal({ client, providerId, onClose, onSaved }) {
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [frequency, setFrequency] = useState(
    client.payment_schedule === 'monthly' ? 'monthly' : 'weekly'
  )
  const [count, setCount] = useState(4)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const preview = useMemo(() => {
    if (!startDate || count < 1) return []
    return generateSessionDates(startDate, frequency, count)
  }, [startDate, frequency, count])

  async function handleGenerate() {
    if (preview.length === 0) return
    setSaving(true)
    setError('')

    const rows = preview.map(date => ({
      client_id: client.id,
      provider_id: providerId,
      session_date: date,
      amount: client.rate ?? null,
      status: 'unpaid',
    }))

    const { error: err } = await supabase.from('sessions').insert(rows)
    if (err) { setError(err.message); setSaving(false) }
    else onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-lg text-slate-900">Generate Sessions</h2>
            <p className="text-sm text-slate-500">{client.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Frequency</label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {FREQUENCIES.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Number of sessions: <span className="text-emerald-600 font-semibold">{count}</span>
            </label>
            <input
              type="range"
              min="1"
              max="52"
              value={count}
              onChange={e => setCount(parseInt(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>1</span><span>52</span>
            </div>
          </div>

          {preview.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">
                Preview — {preview.length} sessions at {formatCurrency(client.rate)} each
              </p>
              <div className="bg-slate-50 rounded-lg p-3 max-h-44 overflow-y-auto space-y-1.5">
                {preview.map((date, i) => (
                  <div key={date} className="flex justify-between text-sm">
                    <span className="text-slate-600">{formatDate(date)}</span>
                    <span className="text-slate-400">{formatCurrency(client.rate)}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                Total if all paid: {formatCurrency((client.rate || 0) * preview.length)}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={saving || preview.length === 0}
              className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'Generating…' : `Generate ${preview.length} Sessions`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
