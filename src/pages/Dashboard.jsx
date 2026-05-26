import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth, useBusiness } from '../App'
import { getSessionStatus, getDaysOverdue, getDaysUntilDue, formatCurrency, formatDate, sortSessions } from '../lib/utils'
import StatusBadge from '../components/StatusBadge'
import { NumberTicker } from '../components/NumberTicker'
import { Skeleton } from '../components/Skeleton'
import { Building2 } from 'lucide-react'

const FILTERS = ['all', 'late', 'upcoming', 'paid']

export default function Dashboard() {
  const { user } = useAuth()
  const { activeBusiness, businesses } = useBusiness()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [markingPaid, setMarkingPaid] = useState(null)
  const [thisMonthEarned, setThisMonthEarned] = useState(0)

  useEffect(() => { fetchAll() }, [activeBusiness?.id])

  async function fetchAll() {
    const monthStart = new Date().toISOString().slice(0, 7) + '-01'

    let sessionsQuery, historyQuery

    if (activeBusiness) {
      sessionsQuery = supabase
        .from('sessions')
        .select('*, clients!inner(name, service_type)')
        .eq('provider_id', user.id)
        .eq('clients.business_id', activeBusiness.id)
      historyQuery = supabase
        .from('payment_history')
        .select('amount, clients!inner(business_id)')
        .eq('provider_id', user.id)
        .gte('paid_date', monthStart)
        .eq('clients.business_id', activeBusiness.id)
    } else {
      sessionsQuery = supabase
        .from('sessions')
        .select('*, clients(name, service_type)')
        .eq('provider_id', user.id)
      historyQuery = supabase
        .from('payment_history')
        .select('amount')
        .eq('provider_id', user.id)
        .gte('paid_date', monthStart)
    }

    const [{ data: sessionData }, { data: historyData }] = await Promise.all([
      sessionsQuery,
      historyQuery,
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
    .filter(s => s.computedStatus === 'late')
    .reduce((sum, s) => sum + (s.amount || 0), 0)

  const counts = {
    late: enriched.filter(s => s.computedStatus === 'late').length,
    upcoming: enriched.filter(s => s.computedStatus === 'upcoming').length,
    paid: enriched.filter(s => s.computedStatus === 'paid').length,
    all: enriched.length,
  }

  if (businesses.length === 0) {
    return (
      <div className="p-6 md:p-8 max-w-3xl w-full">
        <h1 className="text-xl font-semibold text-slate-900 mb-6">Dashboard</h1>
        <div className="text-center py-16 text-slate-400">
          <Building2 size={28} className="mx-auto mb-3 text-slate-300" />
          <p className="font-medium text-slate-600 mb-1">No business yet</p>
          <p className="text-sm">Create a business from the sidebar to get started.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-3xl w-full">
        <Skeleton className="h-6 w-28 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`bg-white border border-slate-200 rounded-xl p-4 ${i < 2 ? 'col-span-2 md:col-span-1' : ''}`}>
              <Skeleton className="h-2.5 w-20 mb-3" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <div className="flex-1" />
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl w-full">
      <h1 className="text-xl font-semibold text-slate-900 mb-6">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard label="Outstanding" rawValue={outstanding} prefix="$" decimalPlaces={2} valueClass="text-slate-900" span2 emptyText="All clear" />
        <StatCard label="Earned this month" rawValue={thisMonthEarned} prefix="$" decimalPlaces={2} valueClass="text-emerald-600" span2 />
        <StatCard label="Late" rawValue={counts.late} valueClass="text-red-500" />
        <StatCard label="Upcoming" rawValue={counts.upcoming} valueClass="text-amber-500" />
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-slate-200 mb-0 -mx-0.5">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-2.5 text-sm font-medium capitalize transition-colors relative ${
              filter === f
                ? 'text-slate-900 after:absolute after:bottom-0 after:inset-x-0 after:h-0.5 after:bg-slate-900 after:rounded-full'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            {f}
            {counts[f] > 0 && f !== 'all' && (
              <span className={`ml-1.5 text-xs tabular-nums ${filter === f ? 'text-slate-500' : 'text-slate-300'}`}>
                {counts[f]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Session list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          {filter === 'all'
            ? 'No sessions yet. Go to Clients to add sessions.'
            : `No ${filter} sessions right now.`}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 mt-0">
          {filtered.map(session => (
            <SessionRow
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

function StatCard({ label, rawValue, prefix = '', decimalPlaces = 0, valueClass, span2, emptyText }) {
  const isEmpty = rawValue === 0 && emptyText
  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-4 ${span2 ? 'col-span-2 md:col-span-1' : ''}`}>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">{label}</p>
      {isEmpty ? (
        <p className="text-2xl font-bold text-slate-300">{emptyText}</p>
      ) : (
        <p className={`text-2xl font-bold ${valueClass}`}>
          {prefix && <span>{prefix}</span>}
          <NumberTicker key={rawValue} value={rawValue} decimalPlaces={decimalPlaces} />
        </p>
      )}
    </div>
  )
}

function SessionRow({ session, onMarkPaid, isMarking }) {
  const status = session.computedStatus
  const daysOverdue = status === 'late' ? getDaysOverdue(session.session_date) : null
  const daysUntil = status === 'upcoming' ? getDaysUntilDue(session.session_date) : null
  const clientName = session.clients?.name ?? '—'
  const serviceType = session.clients?.service_type

  return (
    <div className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${
      status === 'late' ? 'bg-red-50/40 hover:bg-red-50/60' : ''
    }`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-slate-900 text-sm">{clientName}</span>
          {serviceType && <span className="text-slate-400 text-sm">{serviceType}</span>}
          <StatusBadge status={status} />
          {daysOverdue !== null && daysOverdue > 0 && (
            <span className="text-xs text-red-500 font-medium">{daysOverdue}d overdue</span>
          )}
          {daysOverdue === 0 && <span className="text-xs text-red-500 font-medium">Due today</span>}
          {daysUntil !== null && daysUntil <= 7 && (
            <span className="text-xs text-amber-600 font-medium">in {daysUntil}d</span>
          )}
        </div>
        {session.notes && <p className="text-xs text-slate-400 mt-0.5 italic">{session.notes}</p>}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-slate-400 hidden sm:block">{formatDate(session.session_date)}</span>
        <span className="text-sm font-semibold text-slate-800 tabular-nums">{formatCurrency(session.amount)}</span>
        {(status === 'late' || status === 'upcoming') && (
          <button
            onClick={onMarkPaid}
            disabled={isMarking}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 whitespace-nowrap"
          >
            {isMarking ? '…' : 'Mark Paid'}
          </button>
        )}
      </div>
    </div>
  )
}
