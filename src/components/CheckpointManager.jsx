import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { STATUS_META } from './StatusBadge'

function defaultCheckpoint() {
  return {
    location: '',
    status: 'in_transit',
    note: '',
    position_percent: 50,
    checkpoint_time: new Date().toISOString().slice(0, 16),
  }
}

export default function CheckpointManager({ shipment, onBack }) {
  const [checkpoints, setCheckpoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(defaultCheckpoint())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('shipment_checkpoints')
      .select('*')
      .eq('shipment_id', shipment.id)
      .order('checkpoint_time', { ascending: false })
    setCheckpoints(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [shipment.id])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleAdd(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      shipment_id: shipment.id,
      location: form.location,
      status: form.status,
      note: form.note,
      position_percent: Number(form.position_percent),
      checkpoint_time: new Date(form.checkpoint_time).toISOString(),
    }

    const { error: insertError } = await supabase.from('shipment_checkpoints').insert(payload)
    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    // Keep the shipment's headline status/location in sync with the latest update
    await supabase
      .from('shipments')
      .update({
        status: form.status,
        current_location: form.location,
        status_reason: form.note || null,
      })
      .eq('id', shipment.id)

    setForm(defaultCheckpoint())
    setSaving(false)
    load()
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this tracking update?')) return
    await supabase.from('shipment_checkpoints').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <button className="btn-secondary" onClick={onBack}>← Back to shipments</button>

      <form className="checkpoint-form" onSubmit={handleAdd}>
        <h3>Add Tracking Update</h3>
        <div className="form-grid">
          <div className="form-field">
            <label>Location</label>
            <input value={form.location} onChange={(e) => update('location', e.target.value)} required placeholder="e.g. Sydney, Australia" />
          </div>
          <div className="form-field">
            <label>Status</label>
            <select value={form.status} onChange={(e) => update('status', e.target.value)}>
              {Object.entries(STATUS_META).map(([value, meta]) => (
                <option key={value} value={value}>{meta.label}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Date &amp; Time</label>
            <input type="datetime-local" value={form.checkpoint_time} onChange={(e) => update('checkpoint_time', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Route Progress ({form.position_percent}%)</label>
            <input type="range" min="0" max="100" value={form.position_percent} onChange={(e) => update('position_percent', e.target.value)} />
          </div>
          <div className="form-field span-2">
            <label>Note</label>
            <input value={form.note} onChange={(e) => update('note', e.target.value)} placeholder="Optional note, e.g. Departed sorting facility" />
          </div>
        </div>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Adding…' : 'Add Update'}
        </button>
      </form>

      <h3 className="section-title">History</h3>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="checkpoint-history">
          {checkpoints.length === 0 && <p>No updates yet.</p>}
          {checkpoints.map((cp) => {
            const meta = STATUS_META[cp.status] || { label: cp.status, color: '#64748b' }
            return (
              <div key={cp.id} className="checkpoint-history-row">
                <div>
                  <strong>{cp.location}</strong>{' '}
                  <span className="status-badge small" style={{ backgroundColor: `${meta.color}1a`, color: meta.color, borderColor: `${meta.color}55` }}>
                    {meta.label.toUpperCase()}
                  </span>{' '}
                  <span className="hint">({cp.position_percent}%)</span>
                  <div className="hint">{new Date(cp.checkpoint_time).toLocaleString()}</div>
                  {cp.note && <div className="hint">{cp.note}</div>}
                </div>
                <button className="danger" onClick={() => handleDelete(cp.id)}>Delete</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
