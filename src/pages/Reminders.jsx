import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'
import { ChevronDown, ChevronUp, Mail } from 'lucide-react'

const DEFAULT_TEMPLATE = `Hi {{client_name}},

I hope you're doing well! I wanted to follow up on the payment of \${{amount}} for {{service_type}}, which was due on {{due_date}}.

If you've already sent it, please disregard this message. Otherwise, please take a moment to send it when you get a chance.

Thank you!`

export default function Reminders() {
  const { user } = useAuth()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [saving, setSaving] = useState(null)

  useEffect(() => {
    supabase
      .from('clients')
      .select('id, name, email, service_type, reminders_enabled, reminder_days_after_due, reminder_template')
      .eq('provider_id', user.id)
      .order('name')
      .then(({ data }) => {
        setClients(data || [])
        setLoading(false)
      })
  }, [])

  async function update(id, updates) {
    setSaving(id)
    await supabase.from('clients').update(updates).eq('id', id)
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
    setSaving(null)
  }

  function toggle(client) {
    const next = !client.reminders_enabled
    update(client.id, { reminders_enabled: next })
    if (!next && expanded === client.id) setExpanded(null)
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Reminders</h1>
        <p className="text-slate-500 text-sm mt-1">
          Configure per-client email reminders. Email sending is coming soon — settings are saved now.
        </p>
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm text-center py-12">Loading…</p>
      ) : clients.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-16">Add clients first to configure reminders.</p>
      ) : (
        <div className="space-y-3">
          {clients.map(client => (
            <div key={client.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              {/* Header row */}
              <div className="flex items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900">{client.name}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <Mail size={12} />{client.email}
                  </p>
                </div>

                {client.reminders_enabled && (
                  <button
                    onClick={() => setExpanded(expanded === client.id ? null : client.id)}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-0.5 transition-colors"
                  >
                    Settings
                    {expanded === client.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                )}

                {/* Toggle */}
                <button
                  onClick={() => toggle(client)}
                  disabled={saving === client.id}
                  aria-label={client.reminders_enabled ? 'Disable reminders' : 'Enable reminders'}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                    client.reminders_enabled ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      client.reminders_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Expanded settings */}
              {expanded === client.id && client.reminders_enabled && (
                <div className="border-t border-slate-100 p-4 bg-slate-50 space-y-4">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-slate-700 whitespace-nowrap">
                      Send reminder
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={client.reminder_days_after_due ?? 3}
                      onChange={e => update(client.id, { reminder_days_after_due: parseInt(e.target.value) || 1 })}
                      className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-600">days after due date</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Email template
                    </label>
                    <textarea
                      value={client.reminder_template ?? DEFAULT_TEMPLATE}
                      onChange={e => update(client.id, { reminder_template: e.target.value })}
                      rows={9}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none bg-white"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Variables: <code className="bg-slate-100 px-1 rounded">{'{{client_name}}'}</code>{' '}
                      <code className="bg-slate-100 px-1 rounded">{'{{amount}}'}</code>{' '}
                      <code className="bg-slate-100 px-1 rounded">{'{{service_type}}'}</code>{' '}
                      <code className="bg-slate-100 px-1 rounded">{'{{due_date}}'}</code>
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
