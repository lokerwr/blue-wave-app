export const STATUS_META = {
  pending: { label: 'Pending Pickup', color: '#64748b' },
  picked_up: { label: 'Picked Up', color: '#2563eb' },
  in_transit: { label: 'In Transit', color: '#0b5fae' },
  out_for_delivery: { label: 'Out for Delivery', color: '#0891b2' },
  on_hold: { label: 'On Hold', color: '#d97706' },
  paused: { label: 'Paused', color: '#ea580c' },
  delayed: { label: 'Delayed', color: '#ca8a04' },
  delivered: { label: 'Delivered', color: '#16a34a' },
  cancelled: { label: 'Cancelled', color: '#dc2626' },
}

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, color: '#64748b' }
  return (
    <span
      className="status-badge"
      style={{
        backgroundColor: `${meta.color}1a`,
        color: meta.color,
        borderColor: `${meta.color}55`,
      }}
    >
      <span className="status-dot" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </span>
  )
}
