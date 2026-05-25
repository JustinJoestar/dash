import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Bell, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/reminders', icon: Bell, label: 'Reminders' },
]

export default function Layout() {
  const { user } = useAuth()
  const navigate = useNavigate()

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar – desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-slate-900 fixed inset-y-0 left-0 z-20">
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-white text-sm select-none">
              S
            </div>
            <span className="font-bold text-white text-lg tracking-tight">Stampaid</span>
          </div>
          <p className="text-slate-500 text-xs truncate">{user?.email}</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white font-medium'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 w-full transition-colors"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Page content */}
      <div className="flex-1 md:ml-60 flex flex-col pb-20 md:pb-0">
        <Outlet />
      </div>

      {/* Bottom nav – mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex z-20">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center pt-3 pb-4 gap-1 text-xs transition-colors ${
                isActive ? 'text-emerald-600 font-medium' : 'text-slate-500'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
