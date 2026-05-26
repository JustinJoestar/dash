import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth, useBusiness } from '../App'
import { formatCurrency, formatDate, getSessionStatus } from '../lib/utils'
import ClientModal from '../components/ClientModal'
import PaymentHistoryModal from '../components/PaymentHistoryModal'
import SessionModal from '../components/SessionModal'
import GenerateSessionsModal from '../components/GenerateSessionsModal'
import StatusBadge from '../components/StatusBadge'
import { Plus, Edit2, Trash2, History, ChevronDown, ChevronUp, Calendar, Zap, X, Building2 } from 'lucide-react'
import { Skeleton } from '../components/Skeleton'

const scheduleLabel = { monthly: 'Monthly', per_session: 'Per session', package: 'One-time' }

export default function Clients() {
  const { user } = useAuth()
  const { activeBusiness, businesses } = useBusiness()
  const [clients, setClients] = useState([])
  const [sessions, setSessions] = useState({})
  const [loading, setLoading] = useState(true)
  const [unassignedCount, setUnassignedCount] = useState(0)
  const [importingUnassigned, setImportingUnassigned] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [modalClient, setModalClient] = useState(undefined)
  const [historyClient, setHistoryClient] = useState(null)
  const [sessionClient, setSessionClient] = useState(null)
  const [generateClient, setGenerateClient] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [markingPaid, setMarkingPaid] = useState(null)

  useEffect(() => { fetchClients() }, [activeBusiness?.id])

  async function fetchClients() {
    setLoading(true)
    let query = supabase.from('clients').select('*').eq('provider_id', user.id).order('name')
    if (activeBusiness) query = query.eq('business_id', activeBusiness.id)
    else query = query.is('business_id', null)

    const { data } = await query
    setClients(data || [])
    setLoading(false)

    if (activeBusiness) {
      const { count } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', user.id)
        .is('business_id', null)
      setUnassignedCount(count || 0)
    } else {
      setUnassignedCount(0)
    }
  }

  async function importUnassigned() {
    setImportingUnassigned(true)
    await supabase
      .from('clients')
      .update({ business_id: activeBusiness.id })
      .eq('provider_id', user.id)
      .is('business_id', null)
    setImportingUnassigned(false)
    fetchClients()
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
    if (expanded === clientId) setExpanded(null)
    else { setExpanded(clientId); fetchSessions(clientId) }
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

  if (businesses.length === 0) {
    return (
      <div className="p-6 md:p-8 max-w-3xl w-full">
        <h1 className="text-xl font-semibold text-slate-900 mb-6">Clients</h1>
        <div className="text-center py-16 text-slate-400">
          <Building2 size={28} className="mx-auto mb-3 text-slate-300" />
          <p className="font-medium text-slate-600 mb-1">No business yet</p>
          <p className="text-sm">Create a business from the sidebar to get started.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Clients</h1>
        <button
          onClick={() => setModalClient(null)}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-700 text-white px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={15} />
          Add Client
        </button>
      </div>

      {activeBusiness && unassignedCount > 0 && (
        <div className="mb-5 flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{unassignedCount}</span> client{unassignedCount !== 1 ? 's' : ''} not assigned to any business.
          </p>
          <button
            onClick={importUnassigned}
            disabled={importingUnassigned}
            className="shrink-0 text-xs font-semibold text-amber-700 hover:text-amber-900 border border-amber-300 hover:border-amber-500 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {importingUnassigned ? 'Importing…' : `Import to ${activeBusiness.name}`}
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-7 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="mb-2 text-sm">No clients yet{activeBusiness ? ` in ${activeBusiness.name}` : ''}.</p>
          <button onClick={() => setModalClient(null)} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
            Add your first client →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {clients.map(client => {
            const clientSessions = sessions[client.id] || []
            const isExpanded = expanded === client.id
            const unpaidCount = clientSessions.filter(s => s.status === 'unpaid').length

            return (
              <div key={client.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Client row */}
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-slate-900 text-sm">{client.name}</h3>
                      {client.service_type && (
                        <span className="text-xs text-slate-400">{client.service_type}</span>
                      )}
                      {client.rate && (
                        <span className="text-xs text-slate-400">{formatCurrency(client.rate)} / {scheduleLabel[client.payment_schedule]?.toLowerCase()}</span>
                      )}
                    </div>
                    {client.email && (
                      <p className="text-xs text-slate-400 mt-0.5">{client.email}{client.phone ? ` · ${client.phone}` : ''}</p>
                    )}
                    {client.notes && <p className="text-xs text-slate-300 italic mt-0.5 line-clamp-1">{client.notes}</p>}
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => setHistoryClient(client)} title="Payment history" className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                      <History size={14} />
                    </button>
                    <button onClick={() => setModalClient(client)} title="Edit" className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => deleteClient(client)} disabled={deletingId === client.id} title="Delete" className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Sessions toggle */}
                <button
                  onClick={() => toggleExpand(client.id)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium transition-colors border-t ${
                    isExpanded
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    Sessions
                    {!isExpanded && clientSessions.length > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full font-medium ${unpaidCount > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                        {unpaidCount > 0 ? `${unpaidCount} unpaid` : 'all paid'}
                      </span>
                    )}
                    {!isExpanded && clientSessions.length === 0 && (
                      <span className="opacity-50">tap to add</span>
                    )}
                    {isExpanded && clientSessions.length > 0 && (
                      <span className="opacity-50">{clientSessions.length} total{unpaidCount > 0 ? ` · ${unpaidCount} unpaid` : ''}</span>
                    )}
                  </span>
                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>

                {/* Sessions panel */}
                {isExpanded && (
                  <div className="border-t border-slate-100">
                    <div className="flex gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
                      <button
                        onClick={() => setSessionClient(client)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        <Plus size={12} />
                        Add Session
                      </button>
                      <button
                        onClick={() => setGenerateClient(client)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-400 text-slate-600 text-xs font-medium rounded-lg transition-colors"
                      >
                        <Zap size={12} />
                        Generate Recurring
                      </button>
                    </div>

                    {clientSessions.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        No sessions yet — add one above.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {clientSessions.map(session => {
                          const status = getSessionStatus(session)
                          return (
                            <div key={session.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${status === 'late' ? 'bg-red-50/30' : ''}`}>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium text-slate-700">{formatDate(session.session_date)}</span>
                                  <span className="text-sm text-slate-400 tabular-nums">{formatCurrency(session.amount)}</span>
                                  <StatusBadge status={status} />
                                </div>
                                {session.notes && <p className="text-xs text-slate-400 mt-0.5">{session.notes}</p>}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {status !== 'paid' && (
                                  <button
                                    onClick={() => markSessionPaid(session)}
                                    disabled={markingPaid === session.id}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-40"
                                  >
                                    {markingPaid === session.id ? '…' : 'Mark Paid'}
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteSession(session)}
                                  className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <X size={12} />
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
        <ClientModal
          client={modalClient}
          providerId={user.id}
          businessId={activeBusiness?.id}
          onClose={() => setModalClient(undefined)}
          onSaved={() => { setModalClient(undefined); fetchClients() }}
        />
      )}
      {historyClient && <PaymentHistoryModal client={historyClient} onClose={() => setHistoryClient(null)} />}
      {sessionClient && <SessionModal client={sessionClient} providerId={user.id} onClose={() => setSessionClient(null)} onSaved={() => onSessionSaved(sessionClient.id)} />}
      {generateClient && <GenerateSessionsModal client={generateClient} providerId={user.id} onClose={() => setGenerateClient(null)} onSaved={() => onSessionSaved(generateClient.id)} />}
    </div>
  )
}
