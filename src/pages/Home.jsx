import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Home() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      setError('Please enter a tracking number.')
      return
    }
    setLoading(true)
    const { data, error: dbError } = await supabase
      .from('shipments')
      .select('tracking_code')
      .eq('tracking_code', trimmed)
      .maybeSingle()
    setLoading(false)

    if (dbError) {
      setError('Something went wrong. Please try again.')
      return
    }
    if (!data) {
      setError('We could not find a shipment with that tracking number.')
      return
    }
    navigate(`/tracking/${trimmed}`)
  }

  return (
    <section className="hero">
      <div className="hero-inner">
        <p className="eyebrow">Worldwide Air · Land · Sea Shipping</p>
        <h1>Track your shipment with Blue Wave</h1>
        <p className="hero-sub">
          Enter your tracking number below to see real-time status, current location,
          and full delivery details — wherever your package is in the world.
        </p>
        <form className="track-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter tracking number e.g. BW4F7K9P"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="track-input"
            autoFocus
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Searching…' : 'Track Shipment'}
          </button>
        </form>
        {error && <p className="form-error">{error}</p>}

        <div className="hero-features">
          <div className="feature"><span>✈️</span> Air Freight</div>
          <div className="feature"><span>🚚</span> Land Freight</div>
          <div className="feature"><span>🚢</span> Sea Freight</div>
        </div>
      </div>
    </section>
  )
}
