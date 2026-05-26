const config = {
  paid:     { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50',   label: 'Paid' },
  late:     { dot: 'bg-red-500',     text: 'text-red-600',     bg: 'bg-red-50',       label: 'Late' },
  upcoming: { dot: 'bg-amber-400',   text: 'text-amber-700',   bg: 'bg-amber-50',     label: 'Upcoming' },
  unpaid:   { dot: 'bg-slate-400',   text: 'text-slate-500',   bg: 'bg-slate-100',    label: 'Unpaid' },
}

export default function StatusBadge({ status }) {
  const c = config[status] ?? config.unpaid
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}
