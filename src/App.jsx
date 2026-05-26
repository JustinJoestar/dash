import { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Reminders from './pages/Reminders'
import Calendar from './pages/Calendar'
import Login from './pages/Login'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'

const AuthContext = createContext(null)
const BusinessContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export function useBusiness() {
  return useContext(BusinessContext)
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400 text-sm">Loading…</div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [businesses, setBusinesses] = useState([])
  const [activeBusiness, setActiveBusinessState] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session) {
        setBusinesses([])
        setActiveBusinessState(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) fetchBusinesses()
  }, [user])

  async function fetchBusinesses() {
    const { data } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at')

    const list = data || []
    setBusinesses(list)

    const savedId = localStorage.getItem('stampaid_active_business')
    const found = list.find(b => b.id === savedId)
    const next = found ?? list[0] ?? null
    setActiveBusinessState(next)
    if (next) localStorage.setItem('stampaid_active_business', next.id)
  }

  function setActiveBusiness(biz) {
    setActiveBusinessState(biz)
    if (biz) localStorage.setItem('stampaid_active_business', biz.id)
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      <BusinessContext.Provider value={{ businesses, activeBusiness, setActiveBusiness, refreshBusinesses: fetchBusinesses }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="clients" element={<Clients />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="reminders" element={<Reminders />} />
          </Route>
        </Routes>
      </BusinessContext.Provider>
    </AuthContext.Provider>
  )
}
