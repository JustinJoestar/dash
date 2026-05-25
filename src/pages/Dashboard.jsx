import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'
import { getSessionStatus, getDaysOverdue, getDaysUntilDue, formatCurrency, formatDate, sortSessions } from '../lib/utils'
import StatusBadge from '../components/StatusBadge'

const FILTERS = ['all', 'late', 'upcoming', 'paid']

export default function Dashboard() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [markingPaid, setMarkingPaid] = useState(null)
  const [thisMonthEarned, setThisMonthEarned] = useState(0)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    const monthStart = new Date().toISOString().slice(0, 7) + '-01'

    const [{ data: sessionData }, { data: historyData }] = await Promise.all([
      supabase
        .from('sessions')
        .select('*, clients(name, service_type)')
        .eq('provider_id', user.id),
      supabase
        .from('payment_history')
        .select('amount')
        .eq('provider_id', user.id)
        .gte('paid_date', monthStart),
    ])

    setSessions(sessionData || [])
    setThisMonthEarned((historyData || []).reduce((s, p) => s + (p.amount || 0), 0))
    setLoading(false)
  }

  async function markAsPaid(session) {
    setMarkingPaid(session.id)
    try {
      const today = new Date().toISOString().slice(0, 10)
      await supabase.from('sessions').update({ status: 'paid', paid_date: today }).eq('id', session.id)
      await supabase.from('payment_history').insert({
        client_id: session.client_id,
        provider_id: user.id,
        session_id: session.id,
        amount: session.amount,
        paid_date: today,
      })
      await fetchAll()
    } finally {
      setMarkingPaid(null)
    }
  }

  const enriched = sortSessions(
    (sessions || []).map(s => ({ ...s, computedStatus: getSessionStatus(s) }))
  )

  const filtered = filter === 'all' ? enriched : enriched.filter(s => s.computedStatus === filter)

  const outstanding = enriched
    .filter(s => s.computedStatus === 'late' || s.computedStatus === 'upcoming')
    .reduce((sum, s) => sum + (s.amount || 0), 0)

  const lateCount = enriched.filter(s => s.computedStatus === 'late').length
  const upcomingCount = enriched.filter(s => s.computedStatus === 'upcoming').length

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><p className="text-slate-400 text-sm">Loading…</p></div>
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl w-full">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Outstanding" value={formatCurrency(outstanding)} valueClass="text-slate-900" wide />
        <StatCard label="Earned this month" value={formatCurrency(thisMonthEarned)} valueClass="text-emerald-600" wide />
        <StatCard label="Late" value={lateCount} valueClass="text-red-500" />
        <StatCard label="Upcoming" value={upcomingCount} valueClass="text-amber-500" />
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
              filter === f ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'
            }`}
          >
            {f}
            {f !== 'all' && (
              <span className="ml-1.5 text-xs opacity-60">
                {enriched.filter(s => s.computedStatus === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          {filter === 'all'
            ? 'No sessions yet. Go to Clients to add sessions.'
            : `No ${filter} sessions right now.`}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              onMarkPaid={() => markAsPaid(session)}
              isMarking={markingPaid === session.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, valueClass, wide }) {
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border border-slate-100 ${wide ? 'col-span-2 md:col-span-1' : ''}`}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}

function SessionCard({ session, onMarkPaid, isMarking }) {
  const status = session.computedStatus
  const daysOverdue = status === 'late' ? getDaysOverdue(session.session_date) : null
  const daysUntil = status === 'upcoming' ? getDaysUntilDue(session.session_date) : null
  const clientName = session.clients?.name ?? '—'
  const serviceType = session.clients?.service_type ?? 'Session'

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border transition-colors ${
      status === 'late' ? 'border-red-100 bg-red-50/30' :
      status === 'upcoming' && daysUntil <= 3 ? 'border-amber-100' :
      'border-slate-100'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <h3 className="font-semibold text-slate-900">{clientName}</h3>
            <StatusBadge status={status} />
          </div>
          <p className="text-sm text-slate-500">{serviceType}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-sm">
            <span className="font-semibold text-slate-800">{formatCurrency(session.amount)}</span>
            <span className="text-slate-500">{formatDate(session.session_date)}</span>
            {daysOverdue !== null && daysOverdue > 0 && (
              <span className="text-red-500 font-medium">{daysOverdue}d overdue</span>
            )}
            {daysOverdue === 0 && <span className="text-red-500 font-medium">Due today</span>}
            {daysUntil !== null && daysUntil <= 7 && (
              <span className="text-amber-600 font-medium">in {daysUntil}d</span>
            )}
          </div>
          {session.notes && <p className="text-xs text-slate-400 italic mt-1.5">{session.notes}</p>}
        </div>

        {(status === 'late' || status === 'upcoming') && (
          <button
            onClick={onMarkPaid}
            disabled={isMarking}
            className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-40 whitespace-nowrap"
          >
            {isMarking ? '…' : 'Mark Paid'}
          </button>
        )}
      </div>
    </div>
  )
}
