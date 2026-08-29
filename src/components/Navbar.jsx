import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Navbar() {
  const [session, setSession] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <span className="brand-wave">〰</span> Blue Wave
      </Link>
      <nav className="nav-links">
        <Link to="/">Track Shipment</Link>
        {session ? (
          <>
            <Link to="/admin">Admin Dashboard</Link>
            <button className="btn-link" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <Link to="/admin/login">Admin Login</Link>
        )}
      </nav>
    </header>
  )
}
