import { STATUS_META } from './StatusBadge'

const STATUS_PERCENT = {
  pending: 5,
  picked_up: 20,
  in_transit: 55,
  out_for_delivery: 85,
  delivered: 100,
  on_hold: null,
  paused: null,
  delayed: null,
  cancelled: null,
}

const METHOD_ICON = { air: '✈️', land: '🚚', sea: '🚢' }

export default function TrackingTimeline({ shipment, checkpoints }) {
  const latest = checkpoints.length ? checkpoints[checkpoints.length - 1] : null
  const fallbackPercent = STATUS_PERCENT[shipment.status]
  const progress =
    latest && latest.position_percent != null
      ? Number(latest.position_percent)
      : fallbackPercent != null
      ? fallbackPercent
      : 0

  const isMoving = ['picked_up', 'in_transit', 'out_for_delivery'].includes(shipment.status)
  const isPaused = ['on_hold', 'paused', 'delayed'].includes(shipment.status)
  const isDelivered = shipment.status === 'delivered'
  const icon = METHOD_ICON[shipment.shipping_method] || '📦'

  // Route breadcrumb: origin -> intermediate checkpoint locations -> destination
  const routeStops = []
  if (shipment.origin) routeStops.push(shipment.origin)
  checkpoints.forEach((cp) => {
    if (cp.location && !routeStops.includes(cp.location)) routeStops.push(cp.location)
  })
  if (shipment.destination && !routeStops.includes(shipment.destination)) {
    routeStops.push(shipment.destination)
  }

  const orderedCheckpoints = [...checkpoints].reverse() // most recent first

  return (
    <div className="timeline-wrap">
      {routeStops.length > 1 && (
        <div className="route-breadcrumb">
          {routeStops.map((stop, i) => (
            <span key={`${stop}-${i}`} className="route-stop">
              {stop}
              {i < routeStops.length - 1 && <span className="route-arrows">▶▶▶</span>}
            </span>
          ))}
        </div>
      )}

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
        <div
          className={`progress-icon ${isMoving ? 'moving' : ''} ${isPaused ? 'paused' : ''} ${
            isDelivered ? 'delivered' : ''
          }`}
          style={{ left: `${progress}%` }}
          title={STATUS_META[shipment.status]?.label || shipment.status}
        >
          {icon}
        </div>
      </div>
      <div className="progress-labels">
        <span>{shipment.origin || 'Origin'}</span>
        <span>{shipment.destination || 'Destination'}</span>
      </div>

      <h3 className="section-title">Shipment History</h3>
      <div className="checkpoint-list">
        {orderedCheckpoints.length === 0 && (
          <p className="no-checkpoints">No tracking updates yet. Check back soon.</p>
        )}
        {orderedCheckpoints.map((cp, i) => {
          const meta = STATUS_META[cp.status] || { label: cp.status, color: '#64748b' }
          const isLatest = i === 0
          return (
            <div key={cp.id} className="checkpoint-row">
              <div className="checkpoint-date">
                <span>{new Date(cp.checkpoint_time).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <span className="checkpoint-time">
                  {new Date(cp.checkpoint_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="checkpoint-track">
                <span className={`checkpoint-dot ${isLatest ? 'active' : ''}`} style={isLatest ? { backgroundColor: meta.color, borderColor: meta.color } : {}}>
                  {isLatest ? '✓' : ''}
                </span>
                {i < orderedCheckpoints.length - 1 && <span className="checkpoint-line" />}
              </div>
              <div className="checkpoint-body">
                <strong>{cp.location}</strong>
                {cp.note && <p className="checkpoint-note">{cp.note}</p>}
                <span className="status-badge small" style={{ backgroundColor: `${meta.color}1a`, color: meta.color, borderColor: `${meta.color}55` }}>
                  {meta.label.toUpperCase()}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
