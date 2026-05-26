import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, X, Building2 } from 'lucide-react'
import { Skeleton } from '../components/Skeleton'
import { supabase } from '../lib/supabase'
import { useAuth, useBusiness } from '../App'
import { formatCurrency, getSessionStatus } from '../lib/utils'
import StatusBadge from '../components/StatusBadge'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function buildCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days = []
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push({ date: new Date(year, month, i - firstDay.getDay() + 1), currentMonth: false })
  }
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({ date: new Date(year, month, i), currentMonth: true })
  }
  const tail = 7 - (days.length % 7)
  if (tail < 7) {
    for (let i = 1; i <= tail; i++) {
      days.push({ date: new Date(year, month + 1, i), currentMonth: false })
    }
  }
  return days
}

function toDateStr(date) {
  return date.toISOString().slice(0, 10)
}

export default function Calendar() {
  const { user } = useAuth()
  const { activeBusiness, businesses } = useBusiness()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)

  useEffect(() => { fetchSessions() }, [year, month, activeBusiness?.id])

  async function fetchSessions() {
    setLoading(true)
    const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const end = toDateStr(new Date(year, month + 1, 0))

    let query
    if (activeBusiness) {
      query = supabase
        .from('sessions')
        .select('*, clients!inner(name, service_type)')
        .eq('provider_id', user.id)
        .gte('session_date', start)
        .lte('session_date', end)
        .eq('clients.business_id', activeBusiness.id)
    } else {
      query = supabase
        .from('sessions')
        .select('*, clients(name, service_type)')
        .eq('provider_id', user.id)
        .gte('session_date', start)
        .lte('session_date', end)
    }

    const { data } = await query
    setSessions((data || []).map(s => ({ ...s, computedStatus: getSessionStatus(s) })))
    setLoading(false)
  }

  const sessionsByDate = useMemo(() => {
    const map = {}
    sessions.forEach(s => {
      if (!map[s.session_date]) map[s.session_date] = []
      map[s.session_date].push(s)
    })
    return map
  }, [sessions])

  const calendarDays = useMemo(() => buildCalendarDays(year, month), [year, month])

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1)
    setSelectedDate(null)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1)
    setSelectedDate(null)
  }
  function goToday() {
    setYear(today.getFullYear())
    setMonth(today.getMonth())
    setSelectedDate(toDateStr(today))
  }

  const todayStr = toDateStr(today)
  const selectedSessions = selectedDate ? (sessionsByDate[selectedDate] || []) : []

  if (businesses.length === 0) {
    return (
      <div className="p-6 md:p-8 max-w-4xl w-full">
        <h1 className="text-xl font-semibold text-slate-900 mb-6">Calendar</h1>
        <div className="text-center py-16 text-slate-400">
          <Building2 size={28} className="mx-auto mb-3 text-slate-300" />
          <p className="font-medium text-slate-600 mb-1">No business yet</p>
          <p className="text-sm">Create a business from the sidebar to get started.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold text-slate-900">Calendar</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={goToday}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:border-slate-400 hover:text-slate-900 transition-colors mr-2"
          >
            Today
          </button>
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-slate-800 min-w-[128px] text-center">
            {MONTHS[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden transition-opacity duration-200 ${loading ? 'opacity-40 pointer-events-none' : ''}`}>
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {DAYS.map(d => (
            <div key={d} className="py-2.5 text-center text-xs font-medium text-slate-400">
              <span className="hidden md:inline">{d}</span>
              <span className="md:hidden">{d[0]}</span>
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map(({ date, currentMonth }, idx) => {
            const dateStr = toDateStr(date)
            const daySessions = sessionsByDate[dateStr] || []
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selectedDate
            const isLastCol = idx % 7 === 6
            const lateCount = daySessions.filter(s => s.computedStatus === 'late').length
            const upcomingCount = daySessions.filter(s => s.computedStatus === 'upcoming').length
            const paidCount = daySessions.filter(s => s.computedStatus === 'paid').length

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={[
                  'min-h-[72px] md:min-h-[88px] p-2 border-b border-r border-slate-100 text-left transition-colors',
                  isLastCol ? 'border-r-0' : '',
                  isSelected ? 'bg-slate-50' : !currentMonth ? 'bg-slate-50/50' : 'hover:bg-slate-50',
                ].join(' ')}
              >
                <span className={[
                  'inline-flex items-center justify-center w-6 h-6 text-xs rounded-full font-medium mb-1',
                  isToday ? 'bg-slate-900 text-white' : !currentMonth ? 'text-slate-300' : 'text-slate-600',
                ].join(' ')}>
                  {date.getDate()}
                </span>

                {daySessions.length > 0 && (
                  <>
                    {/* Desktop: name chips */}
                    <div className="hidden md:block space-y-0.5">
                      {daySessions.slice(0, 2).map(s => (
                        <div
                          key={s.id}
                          className={[
                            'text-xs px-1.5 py-0.5 rounded-md truncate font-medium',
                            s.computedStatus === 'late'     ? 'bg-red-50 text-red-600' :
                            s.computedStatus === 'upcoming' ? 'bg-amber-50 text-amber-700' :
                            'bg-emerald-50 text-emerald-700',
                          ].join(' ')}
                        >
                          {s.clients?.name ?? '—'}
                        </div>
                      ))}
                      {daySessions.length > 2 && (
                        <p className="text-xs text-slate-400 px-1">+{daySessions.length - 2} more</p>
                      )}
                    </div>

                    {/* Mobile: dots */}
                    <div className="md:hidden flex gap-0.5 flex-wrap">
                      {lateCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                      {upcomingCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                      {paidCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    </div>
                  </>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 px-1">
        {[
          { color: 'bg-red-400', label: 'Late' },
          { color: 'bg-amber-400', label: 'Upcoming' },
          { color: 'bg-emerald-400', label: 'Paid' },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className={`w-2 h-2 rounded-full ${color}`} />
            {label}
          </span>
        ))}
      </div>

      {/* Day detail */}
      {selectedDate && (
        <div className="mt-4 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="font-medium text-slate-900 text-sm">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric',
              })}
            </h2>
            <button
              onClick={() => setSelectedDate(null)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {selectedSessions.length === 0 ? (
            <p className="text-center py-8 text-sm text-slate-400">No sessions on this day.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {selectedSessions.map(session => (
                <div key={session.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-900 text-sm">{session.clients?.name ?? '—'}</span>
                      <StatusBadge status={session.computedStatus} />
                    </div>
                    {session.clients?.service_type && (
                      <p className="text-xs text-slate-400 mt-0.5">{session.clients.service_type}</p>
                    )}
                    {session.notes && <p className="text-xs text-slate-300 italic mt-0.5">{session.notes}</p>}
                  </div>
                  <span className="text-sm font-semibold text-slate-800 tabular-nums shrink-0">{formatCurrency(session.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
