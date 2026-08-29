import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { generateUniqueTrackingCode } from '../utils/trackingCode'
import { STATUS_META } from './StatusBadge'

const emptyForm = {
  tracking_code: '',
  status: 'pending',
  status_reason: '',
  shipping_method: 'air',
  package_description: '',
  package_image_url: '',
  weight_kg: '',
  origin: '',
  destination: '',
  current_location: '',
  sender_name: '',
  sender_address: '',
  sender_phone: '',
  sender_email: '',
  receiver_name: '',
  receiver_address: '',
  receiver_phone: '',
  receiver_email: '',
  estimated_delivery: '',
}

export default function ShipmentForm({ initial, onCancel, onSaved }) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const isEdit = Boolean(initial?.id)

  useEffect(() => {
    if (initial) {
      setForm({ ...emptyForm, ...initial })
    } else {
      setForm(emptyForm)
      generateUniqueTrackingCode()
        .then((code) => setForm((f) => ({ ...f, tracking_code: code })))
        .catch((e) => setError(e.message))
    }
  }, [initial])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    const path = `${form.tracking_code || 'unassigned'}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('package-images')
      .upload(path, file, { upsert: true })
    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }
    const { data } = supabase.storage.from('package-images').getPublicUrl(path)
    update('package_image_url', data.publicUrl)
    setUploading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      ...form,
      weight_kg: form.weight_kg === '' ? null : Number(form.weight_kg),
      estimated_delivery: form.estimated_delivery || null,
      tracking_code: form.tracking_code.toUpperCase(),
    }
    delete payload.id
    delete payload.created_at
    delete payload.updated_at

    let result
    if (isEdit) {
      result = await supabase.from('shipments').update(payload).eq('id', initial.id).select().single()
    } else {
      result = await supabase.from('shipments').insert(payload).select().single()
    }

    setSaving(false)
    if (result.error) {
      setError(result.error.message)
      return
    }
    onSaved(result.data)
  }

  return (
    <form className="shipment-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-field">
          <label>Tracking Code</label>
          <input value={form.tracking_code} readOnly className="readonly-input" />
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
          <label>Shipping Method</label>
          <select value={form.shipping_method} onChange={(e) => update('shipping_method', e.target.value)}>
            <option value="air">Air</option>
            <option value="land">Land</option>
            <option value="sea">Sea</option>
          </select>
        </div>
        <div className="form-field">
          <label>Status Reason / Note</label>
          <input
            value={form.status_reason || ''}
            onChange={(e) => update('status_reason', e.target.value)}
            placeholder="e.g. Held at customs"
          />
        </div>

        <div className="form-field">
          <label>Origin</label>
          <input value={form.origin || ''} onChange={(e) => update('origin', e.target.value)} />
        </div>
        <div className="form-field">
          <label>Destination</label>
          <input value={form.destination || ''} onChange={(e) => update('destination', e.target.value)} />
        </div>
        <div className="form-field">
          <label>Current Location</label>
          <input value={form.current_location || ''} onChange={(e) => update('current_location', e.target.value)} />
        </div>
        <div className="form-field">
          <label>Estimated Delivery</label>
          <input type="date" value={form.estimated_delivery || ''} onChange={(e) => update('estimated_delivery', e.target.value)} />
        </div>

        <div className="form-field">
          <label>Package Description</label>
          <input value={form.package_description || ''} onChange={(e) => update('package_description', e.target.value)} />
        </div>
        <div className="form-field">
          <label>Weight (kg)</label>
          <input type="number" step="0.01" value={form.weight_kg ?? ''} onChange={(e) => update('weight_kg', e.target.value)} />
        </div>
        <div className="form-field">
          <label>Package Image</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          {uploading && <span className="hint">Uploading…</span>}
          {form.package_image_url && (
            <img src={form.package_image_url} alt="Package preview" className="image-preview" />
          )}
        </div>

        <div className="form-field span-2"><h4>Sender</h4></div>
        <div className="form-field">
          <label>Sender Name</label>
          <input value={form.sender_name || ''} onChange={(e) => update('sender_name', e.target.value)} />
        </div>
        <div className="form-field">
          <label>Sender Phone</label>
          <input value={form.sender_phone || ''} onChange={(e) => update('sender_phone', e.target.value)} />
        </div>
        <div className="form-field">
          <label>Sender Email</label>
          <input value={form.sender_email || ''} onChange={(e) => update('sender_email', e.target.value)} />
        </div>
        <div className="form-field">
          <label>Sender Address</label>
          <input value={form.sender_address || ''} onChange={(e) => update('sender_address', e.target.value)} />
        </div>

        <div className="form-field span-2"><h4>Receiver</h4></div>
        <div className="form-field">
          <label>Receiver Name</label>
          <input value={form.receiver_name || ''} onChange={(e) => update('receiver_name', e.target.value)} />
        </div>
        <div className="form-field">
          <label>Receiver Phone</label>
          <input value={form.receiver_phone || ''} onChange={(e) => update('receiver_phone', e.target.value)} />
        </div>
        <div className="form-field">
          <label>Receiver Email</label>
          <input value={form.receiver_email || ''} onChange={(e) => update('receiver_email', e.target.value)} />
        </div>
        <div className="form-field">
          <label>Receiver Address</label>
          <input value={form.receiver_address || ''} onChange={(e) => update('receiver_address', e.target.value)} />
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving || uploading}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Shipment'}
        </button>
      </div>
    </form>
  )
}
