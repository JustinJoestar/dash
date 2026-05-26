import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth, useBusiness } from '../App'
import { ChevronDown, ChevronUp, Mail } from 'lucide-react'
import { Skeleton } from '../components/Skeleton'

const DEFAULT_TEMPLATE = `Hi {{client_name}},

I hope you're doing well! I wanted to follow up on the payment of \${{amount}} for {{service_type}}, which was due on {{due_date}}.

If you've already sent it, please disregard this message. Otherwise, please take a moment to send it when you get a chance.

Thank you!`

export default function Reminders() {
  const { user } = useAuth()
  const { activeBusiness } = useBusiness()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [saving, setSaving] = useState(null)

  useEffect(() => {
    let query = supabase
      .from('clients')
      .select('id, name, email, service_type, reminders_enabled, reminder_days_after_due, reminder_template')
      .eq('provider_id', user.id)
      .order('name')

    if (activeBusiness) query = query.eq('business_id', activeBusiness.id)
    else query = query.is('business_id', null)

    query.then(({ data }) => {
      setClients(data || [])
      setLoading(false)
    })
  }, [activeBusiness?.id])

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
    <div className="p-6 md:p-8 max-w-3xl w-full">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Reminders</h1>
        <p className="text-slate-400 text-sm mt-1">
          Configure per-client email reminders. Email sending is coming soon — settings are saved now.
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center gap-3 px-4 py-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
              <Skeleton className="h-5 w-9 rounded-full" />
            </div>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-16">Add clients first to configure reminders.</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
          {clients.map(client => (
            <div key={client.id}>
              {/* Row */}
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm">{client.name}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Mail size={11} />{client.email}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {client.reminders_enabled && (
                    <button
                      onClick={() => setExpanded(expanded === client.id ? null : client.id)}
                      className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-0.5 transition-colors"
                    >
                      Settings
                      {expanded === client.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  )}

                  {/* Toggle */}
                  <button
                    onClick={() => toggle(client)}
                    disabled={saving === client.id}
                    aria-label={client.reminders_enabled ? 'Disable reminders' : 'Enable reminders'}
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                      client.reminders_enabled ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        client.reminders_enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Expanded settings */}
              {expanded === client.id && client.reminders_enabled && (
                <div className="border-t border-slate-100 px-4 py-4 bg-slate-50 space-y-4">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-slate-600 whitespace-nowrap">
                      Send reminder
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={client.reminder_days_after_due ?? 3}
                      onChange={e => update(client.id, { reminder_days_after_due: parseInt(e.target.value) || 1 })}
                      className="w-14 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                    />
                    <span className="text-xs text-slate-500">days after due date</span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Email template
                    </label>
                    <textarea
                      value={client.reminder_template ?? DEFAULT_TEMPLATE}
                      onChange={e => update(client.id, { reminder_template: e.target.value })}
                      rows={8}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none bg-white text-slate-700"
                    />
                    <p className="text-xs text-slate-400 mt-1.5 flex flex-wrap gap-1.5">
                      Variables:
                      {['{{client_name}}', '{{amount}}', '{{service_type}}', '{{due_date}}'].map(v => (
                        <code key={v} className="bg-white border border-slate-200 px-1 py-0.5 rounded text-slate-500">{v}</code>
                      ))}
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
