import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'

export default function Login() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else navigate('/dashboard', { replace: true })
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account, then sign in.')
    }

    setLoading(false)
  }

  function switchMode(m) {
    setMode(m)
    setError('')
    setMessage('')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
            <span className="text-white font-bold text-2xl select-none">S</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Stampaid</h1>
          <p className="text-slate-500 text-sm mt-1">Payment tracking for service providers</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-5">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </h2>

          {error && (
            <div className="mb-4 text-red-600 text-sm bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 text-emerald-700 text-sm bg-emerald-50 border border-emerald-100 px-3 py-2.5 rounded-lg">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="At least 6 characters"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {loading ? 'Loading…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500">
            {mode === 'login' ? (
              <>
                No account?{' '}
                <button onClick={() => switchMode('signup')} className="text-emerald-600 hover:underline font-medium">
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button onClick={() => switchMode('login')} className="text-emerald-600 hover:underline font-medium">
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400 space-x-4">
          <a href="/privacy" className="hover:text-slate-600 hover:underline">Privacy Policy</a>
          <a href="/terms" className="hover:text-slate-600 hover:underline">Terms of Service</a>
        </div>
      </div>
    </div>
  )
}
