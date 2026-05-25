import { differenceInDays, addMonths, addWeeks, format, parseISO, isBefore, startOfDay } from 'date-fns'

export function getClientStatus(client) {
  if (client.payment_status === 'paid') return 'paid'
  if (!client.due_date) return 'unpaid'
  const today = startOfDay(new Date())
  const due = startOfDay(parseISO(client.due_date))
  return isBefore(due, today) ? 'late' : 'upcoming'
}

export function getDaysOverdue(dueDateStr) {
  return differenceInDays(startOfDay(new Date()), startOfDay(parseISO(dueDateStr)))
}

export function getDaysUntilDue(dueDateStr) {
  return differenceInDays(startOfDay(parseISO(dueDateStr)), startOfDay(new Date()))
}

export function getNextMonthlyDueDate(dueDateStr) {
  return format(addMonths(parseISO(dueDateStr), 1), 'yyyy-MM-dd')
}

export function formatCurrency(amount) {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return format(parseISO(dateStr), 'MMM d, yyyy')
}

export function sortClients(clients) {
  const order = { late: 0, upcoming: 1, unpaid: 2, paid: 3 }
  return [...clients].sort((a, b) => {
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status]
    if (a.status === 'late') return getDaysOverdue(b.due_date) - getDaysOverdue(a.due_date)
    if (a.status === 'upcoming') return new Date(a.due_date) - new Date(b.due_date)
    return 0
  })
}

export function getSessionStatus(session) {
  if (session.status === 'paid') return 'paid'
  const today = startOfDay(new Date())
  const date = startOfDay(parseISO(session.session_date))
  return isBefore(date, today) ? 'late' : 'upcoming'
}

export function sortSessions(sessions) {
  const order = { late: 0, upcoming: 1, paid: 2 }
  return [...sessions].sort((a, b) => {
    const diff = order[a.computedStatus] - order[b.computedStatus]
    if (diff !== 0) return diff
    return new Date(a.session_date) - new Date(b.session_date)
  })
}

export function generateSessionDates(startDate, frequency, count) {
  const dates = []
  const base = parseISO(startDate)
  for (let i = 0; i < count; i++) {
    let date
    if (frequency === 'weekly') date = addWeeks(base, i)
    else if (frequency === 'biweekly') date = addWeeks(base, i * 2)
    else date = addMonths(base, i)
    dates.push(format(date, 'yyyy-MM-dd'))
  }
  return dates
}
