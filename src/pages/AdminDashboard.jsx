import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import StatusBadge from '../components/StatusBadge'
import ShipmentForm from '../components/ShipmentForm'
import CheckpointManager from '../components/CheckpointManager'

export default function AdminDashboard() {
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState('list') // list | create | edit | checkpoints
  const [selected, setSelected] = useState(null)

  async function loadShipments() {
    setLoading(true)
    const { data } = await supabase
      .from('shipments')
      .select('*')
      .order('created_at', { ascending: false })
    setShipments(data || [])
    setLoading(false)
  }

  useEffect(() => { loadShipments() }, [])

  const filtered = shipments.filter((s) => {
    const q = search.toLowerCase()
    if (!q) return true
    return (
      s.tracking_code.toLowerCase().includes(q) ||
      (s.sender_name || '').toLowerCase().includes(q) ||
      (s.receiver_name || '').toLowerCase().includes(q) ||
      (s.destination || '').toLowerCase().includes(q)
    )
  })

  async function handleDelete(shipment) {
    if (!window.confirm(`Delete shipment ${shipment.tracking_code}? This cannot be undone.`)) return
    await supabase.from('shipments').delete().eq('id', shipment.id)
    loadShipments()
  }

  async function quickStatus(shipment, status, askReason) {
    let reason = shipment.status_reason
    if (askReason) {
      reason = window.prompt(`Reason for marking ${shipment.tracking_code} as "${status.replaceAll('_', ' ')}":`, reason || '')
      if (reason === null) return
    }
    await supabase.from('shipments').update({ status, status_reason: reason }).eq('id', shipment.id)
    loadShipments()
  }

  if (mode === 'create') {
    return (
      <section className="admin-page">
        <h1>New Shipment</h1>
        <ShipmentForm onCancel={() => setMode('list')} onSaved={() => { setMode('list'); loadShipments() }} />
      </section>
    )
  }

  if (mode === 'edit' && selected) {
    return (
      <section className="admin-page">
        <h1>Edit Shipment · {selected.tracking_code}</h1>
        <ShipmentForm initial={selected} onCancel={() => setMode('list')} onSaved={() => { setMode('list'); loadShipments() }} />
      </section>
    )
  }

  if (mode === 'checkpoints' && selected) {
    return (
      <section className="admin-page">
        <h1>Tracking Updates · {selected.tracking_code}</h1>
        <CheckpointManager shipment={selected} onBack={() => { setMode('list'); loadShipments() }} />
      </section>
    )
  }

  return (
    <section className="admin-page">
      <div className="admin-header">
        <h1>Shipments</h1>
        <button className="btn-primary" onClick={() => setMode('create')}>+ New Shipment</button>
      </div>

      <input
        className="admin-search"
        placeholder="Search by tracking code, sender, receiver, destination…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <p>Loading shipments…</p>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tracking Code</th>
                <th>Status</th>
                <th>Method</th>
                <th>Receiver</th>
                <th>Destination</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td className="mono">{s.tracking_code}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td className="capitalize">{s.shipping_method}</td>
                  <td>{s.receiver_name || '—'}</td>
                  <td>{s.destination || '—'}</td>
                  <td className="actions-cell">
                    <button onClick={() => { setSelected(s); setMode('edit') }}>Edit</button>
                    <button onClick={() => { setSelected(s); setMode('checkpoints') }}>Updates</button>
                    <button onClick={() => quickStatus(s, 'paused', true)}>Pause</button>
                    <button onClick={() => quickStatus(s, 'on_hold', true)}>Hold</button>
                    <button onClick={() => quickStatus(s, 'delivered', false)}>Delivered</button>
                    <button className="danger" onClick={() => handleDelete(s)}>Delete</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="6" className="empty-row">No shipments found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
