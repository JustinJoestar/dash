const styles = {
  paid: 'bg-emerald-100 text-emerald-700',
  late: 'bg-red-100 text-red-600',
  upcoming: 'bg-amber-100 text-amber-700',
  unpaid: 'bg-slate-100 text-slate-500',
}

const labels = {
  paid: 'Paid',
  late: 'Late',
  upcoming: 'Upcoming',
  unpaid: 'Unpaid',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? styles.unpaid}`}>
      {labels[status] ?? status}
    </span>
  )
}
