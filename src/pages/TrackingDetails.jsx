import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import StatusBadge from '../components/StatusBadge'
import TrackingTimeline from '../components/TrackingTimeline'

export default function TrackingDetails() {
  const { code } = useParams()
  const [shipment, setShipment] = useState(null)
  const [checkpoints, setCheckpoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    async function load() {
      setLoading(true)
      setError('')

      const { data: shipmentData, error: shipmentError } = await supabase
        .from('shipments')
        .select('*')
        .eq('tracking_code', code.toUpperCase())
        .maybeSingle()

      if (ignore) return

      if (shipmentError || !shipmentData) {
        setError('We could not find a shipment with that tracking number.')
        setShipment(null)
        setLoading(false)
        return
      }

      setShipment(shipmentData)

      const { data: checkpointData } = await supabase
        .from('shipment_checkpoints')
        .select('*')
        .eq('shipment_id', shipmentData.id)
        .order('checkpoint_time', { ascending: true })

      if (!ignore) {
        setCheckpoints(checkpointData || [])
        setLoading(false)
      }
    }

    load()
    return () => { ignore = true }
  }, [code])

  if (loading) return <div className="page-loading">Loading tracking details…</div>

  if (error) {
    return (
      <div className="not-found">
        <h2>Shipment not found</h2>
        <p>{error}</p>
        <Link to="/" className="btn-primary">Try another tracking number</Link>
      </div>
    )
  }

  return (
    <section className="tracking-page">
      <div className="tracking-header">
        <div>
          <p className="eyebrow">Tracking Number</p>
          <h1>{shipment.tracking_code}</h1>
        </div>
        <StatusBadge status={shipment.status} />
      </div>

      {shipment.status_reason && (
        <div className="status-reason-banner">
          <strong>Update:</strong> {shipment.status_reason}
        </div>
      )}

      <TrackingTimeline shipment={shipment} checkpoints={checkpoints} />

      <div className="details-grid">
        <div className="details-card">
          <h3>Package</h3>
          {shipment.package_image_url ? (
            <img src={shipment.package_image_url} alt="Package" className="package-image" />
          ) : (
            <div className="package-image placeholder">No image available</div>
          )}
          <dl>
            <dt>Description</dt><dd>{shipment.package_description || '—'}</dd>
            <dt>Weight</dt><dd>{shipment.weight_kg ? `${shipment.weight_kg} kg` : '—'}</dd>
            <dt>Shipping Method</dt><dd className="capitalize">{shipment.shipping_method}</dd>
            <dt>Origin</dt><dd>{shipment.origin || '—'}</dd>
            <dt>Destination</dt><dd>{shipment.destination || '—'}</dd>
            <dt>Current Location</dt><dd>{shipment.current_location || '—'}</dd>
            <dt>Estimated Delivery</dt><dd>{shipment.estimated_delivery || '—'}</dd>
          </dl>
        </div>

        <div className="details-card">
          <h3>Sender</h3>
          <dl>
            <dt>Name</dt><dd>{shipment.sender_name || '—'}</dd>
            <dt>Address</dt><dd>{shipment.sender_address || '—'}</dd>
            <dt>Phone</dt><dd>{shipment.sender_phone || '—'}</dd>
            <dt>Email</dt><dd>{shipment.sender_email || '—'}</dd>
          </dl>
        </div>

        <div className="details-card">
          <h3>Receiver</h3>
          <dl>
            <dt>Name</dt><dd>{shipment.receiver_name || '—'}</dd>
            <dt>Address</dt><dd>{shipment.receiver_address || '—'}</dd>
            <dt>Phone</dt><dd>{shipment.receiver_phone || '—'}</dd>
            <dt>Email</dt><dd>{shipment.receiver_email || '—'}</dd>
          </dl>
        </div>
      </div>
    </section>
  )
}
