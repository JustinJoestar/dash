import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'
import { formatCurrency, formatDate, getSessionStatus } from '../lib/utils'
import ClientModal from '../components/ClientModal'
import PaymentHistoryModal from '../components/PaymentHistoryModal'
import SessionModal from '../components/SessionModal'
import GenerateSessionsModal from '../components/GenerateSessionsModal'
import StatusBadge from '../components/StatusBadge'
import { Plus, Edit2, Trash2, History, ChevronDown, ChevronUp, Calendar, Zap, X } from 'lucide-react'

const scheduleLabel = { monthly: 'Monthly', per_session: 'Per session', package: 'One-time' }

export default function Clients() {
  const { user } = useAuth()
  const [clients, setClients] = useState([])
  const [sessions, setSessions] = useState({})
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [modalClient, setModalClient] = useState(undefined)
  const [historyClient, setHistoryClient] = useState(null)
  const [sessionClient, setSessionClient] = useState(null)
  const [generateClient, setGenerateClient] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [markingPaid, setMarkingPaid] = useState(null)

  useEffect(() => { fetchClients() }, [])

  async function fetchClients() {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('provider_id', user.id)
      .order('name')
    setClients(data || [])
    setLoading(false)
  }

  async function fetchSessions(clientId) {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('client_id', clientId)
      .order('session_date', { ascending: false })
    setSessions(prev => ({ ...prev, [clientId]: data || [] }))
  }

  function toggleExpand(clientId) {
    if (expanded === clientId) {
      setExpanded(null)
    } else {
      setExpanded(clientId)
      fetchSessions(clientId)
    }
  }

  async function deleteClient(client) {
    if (!window.confirm(`Delete ${client.name}? This also deletes all their sessions and payment history.`)) return
    setDeletingId(client.id)
    await supabase.from('clients').delete().eq('id', client.id)
    setClients(prev => prev.filter(c => c.id !== client.id))
    setDeletingId(null)
  }

  async function deleteSession(session) {
    await supabase.from('sessions').delete().eq('id', session.id)
    setSessions(prev => ({
      ...prev,
      [session.client_id]: (prev[session.client_id] || []).filter(s => s.id !== session.id),
    }))
  }

  async function markSessionPaid(session) {
    setMarkingPaid(session.id)
    const today = new Date().toISOString().slice(0, 10)
    await supabase.from('sessions').update({ status: 'paid', paid_date: today }).eq('id', session.id)
    await supabase.from('payment_history').insert({
      client_id: session.client_id,
      provider_id: user.id,
      session_id: session.id,
      amount: session.amount,
      paid_date: today,
    })
    setSessions(prev => ({
      ...prev,
      [session.client_id]: (prev[session.client_id] || []).map(s =>
        s.id === session.id ? { ...s, status: 'paid', paid_date: today } : s
      ),
    }))
    setMarkingPaid(null)
  }

  function onSessionSaved(clientId) {
    setSessionClient(null)
    setGenerateClient(null)
    fetchSessions(clientId)
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
        <button
          onClick={() => setModalClient(null)}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add Client
        </button>
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm text-center py-12">Loading…</p>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="mb-2">No clients yet.</p>
          <button onClick={() => setModalClient(null)} className="text-emerald-600 hover:underline text-sm font-medium">
            Add your first client
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {clients.map(client => {
            const clientSessions = sessions[client.id] || []
            const isExpanded = expanded === client.id
            const unpaidCount = clientSessions.filter(s => s.status === 'unpaid').length

            return (
              <div key={client.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

                {/* Client info */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 text-base">{client.name}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {[client.service_type, client.rate ? formatCurrency(client.rate) : null, scheduleLabel[client.payment_schedule]].filter(Boolean).join(' · ')}
                      </p>
                      {client.email && <p className="text-xs text-slate-400 mt-1">{client.email}{client.phone ? ` · ${client.phone}` : ''}</p>}
                      {client.notes && <p className="text-xs text-slate-400 italic mt-1.5 line-clamp-1">{client.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setHistoryClient(client)} title="Payment history" className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <History size={15} />
                      </button>
                      <button onClick={() => setModalClient(client)} title="Edit" className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => deleteClient(client)} disabled={deletingId === client.id} title="Delete" className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sessions toggle bar — always visible */}
                <button
                  onClick={() => toggleExpand(client.id)}
                  className={`w-full flex items-center justify-between px-5 py-3 text-sm font-medium transition-colors border-t ${
                    isExpanded
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Calendar size={14} />
                    Sessions
                    {isExpanded && clientSessions.length > 0 && (
                      <span className="text-xs opacity-60">{clientSessions.length} total{unpaidCount > 0 ? ` · ${unpaidCount} unpaid` : ''}</span>
                    )}
                    {!isExpanded && clientSessions.length === 0 && (
                      <span className="text-xs opacity-50">tap to add</span>
                    )}
                    {!isExpanded && clientSessions.length > 0 && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${unpaidCount > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                        {unpaidCount > 0 ? `${unpaidCount} unpaid` : 'all paid'}
                      </span>
                    )}
                  </span>
                  {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>

                {/* Sessions panel */}
                {isExpanded && (
                  <div className="border-t border-slate-100">

                    {/* Action buttons */}
                    <div className="flex gap-2 p-4 bg-slate-50 border-b border-slate-100">
                      <button
                        onClick={() => setSessionClient(client)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        <Plus size={13} />
                        Add Session
                      </button>
                      <button
                        onClick={() => setGenerateClient(client)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-slate-400 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                      >
                        <Zap size={13} />
                        Generate Recurring
                      </button>
                    </div>

                    {/* Session rows */}
                    {clientSessions.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-sm">
                        No sessions yet — add one above.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {clientSessions.map(session => {
                          const status = getSessionStatus(session)
                          return (
                            <div key={session.id} className={`flex items-center gap-3 px-4 py-3.5 ${status === 'late' ? 'bg-red-50/40' : ''}`}>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium text-slate-800">{formatDate(session.session_date)}</span>
                                  <span className="text-sm text-slate-500">{formatCurrency(session.amount)}</span>
                                  <StatusBadge status={status} />
                                </div>
                                {session.notes && <p className="text-xs text-slate-400 mt-0.5">{session.notes}</p>}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {status !== 'paid' && (
                                  <button
                                    onClick={() => markSessionPaid(session)}
                                    disabled={markingPaid === session.id}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-40"
                                  >
                                    {markingPaid === session.id ? '…' : 'Mark Paid'}
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteSession(session)}
                                  className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {modalClient !== undefined && (
        <ClientModal client={modalClient} providerId={user.id} onClose={() => setModalClient(undefined)} onSaved={() => { setModalClient(undefined); fetchClients() }} />
      )}
      {historyClient && <PaymentHistoryModal client={historyClient} onClose={() => setHistoryClient(null)} />}
      {sessionClient && <SessionModal client={sessionClient} providerId={user.id} onClose={() => setSessionClient(null)} onSaved={() => onSessionSaved(sessionClient.id)} />}
      {generateClient && <GenerateSessionsModal client={generateClient} providerId={user.id} onClose={() => setGenerateClient(null)} onSaved={() => onSessionSaved(generateClient.id)} />}
    </div>
  )
}
