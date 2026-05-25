import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatCurrency, formatDate } from '../lib/utils'
import { X } from 'lucide-react'

export default function PaymentHistoryModal({ client, onClose }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('payment_history')
      .select('*')
      .eq('client_id', client.id)
      .order('paid_date', { ascending: false })
      .then(({ data }) => {
        setHistory(data || [])
        setLoading(false)
      })
  }, [client.id])

  const total = history.reduce((sum, p) => sum + (p.amount || 0), 0)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h2 className="font-bold text-lg text-slate-900">{client.name}</h2>
            <p className="text-sm text-slate-500">Payment history</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <p className="text-slate-400 text-sm text-center py-8">Loading…</p>
          ) : history.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No payment history yet.</p>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {history.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{formatDate(entry.paid_date)}</p>
                      {entry.notes && <p className="text-xs text-slate-400 mt-0.5">{entry.notes}</p>}
                    </div>
                    <span className="text-sm font-semibold text-emerald-600">{formatCurrency(entry.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between">
                <span className="text-sm font-medium text-slate-700">Total received</span>
                <span className="text-sm font-bold text-slate-900">{formatCurrency(total)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
