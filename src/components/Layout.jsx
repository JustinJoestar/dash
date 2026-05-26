import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, CalendarDays, Bell, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'
import BusinessSelector from './BusinessSelector'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
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
      <aside className="hidden md:flex flex-col w-56 bg-slate-950 fixed inset-y-0 left-0 z-20">
        {/* Brand */}
        <div className="px-4 pt-5 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-white text-xs select-none shrink-0">
              S
            </div>
            <span className="font-semibold text-white text-sm tracking-tight">Stampaid</span>
          </div>
          <p className="text-slate-500 text-xs truncate mb-0.5">{user?.email}</p>
          <BusinessSelector />
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 mt-1">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`
              }
            >
              <Icon size={15} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-white/5">
          <button
            onClick={signOut}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-200 hover:bg-white/5 w-full transition-colors"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Page content */}
      <div className="flex-1 md:ml-56 flex flex-col pb-20 md:pb-0">
        <Outlet />
      </div>

      {/* Bottom nav – mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 flex z-20">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center pt-3 pb-4 gap-1 text-xs transition-colors ${
                isActive ? 'text-emerald-600 font-medium' : 'text-slate-400'
              }`
            }
          >
            <Icon size={19} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
