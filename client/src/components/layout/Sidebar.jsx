import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  BarChart3,
  ClipboardList,
  Package,
  Bell,
  LogOut,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { logoutApi } from '../../features/auth/api'

const adminNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/farmers', label: 'Farmers', icon: Users },
  { to: '/demand', label: 'Demand Planning', icon: ClipboardList },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/inventory', label: 'Inventory', icon: Package },
]

const farmerNav = [
  { to: '/demand', label: 'Demand Planning', icon: ClipboardList },
  { to: '/notifications', label: 'Notifications', icon: Bell },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [showConfirm, setShowConfirm] = useState(false)

  const navItems = user?.role === 'farmer' ? farmerNav : adminNav

  const confirmLogout = async () => {
    try { await logoutApi() } catch { /* ignore */ }
    logout()
    navigate('/login')
  }

  return (
    <>
      <aside className="w-56 h-screen bg-sidebar-bg flex flex-col fixed left-0 top-0 z-20">
        {/* Logo */}
        <div className="px-6 py-5">
          <span className="text-white font-bold text-2xl">FPO</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-sm cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-sidebar-active text-white font-medium'
                    : 'text-white/80 hover:bg-sidebar-active/50'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}

          {/* Logout */}
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-3 px-6 py-3 text-white/80 text-sm cursor-pointer hover:bg-sidebar-active/50 mt-auto mb-4"
          >
            <LogOut size={18} />
            Logout
          </button>
        </nav>
      </aside>

      {/* Logout confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-80">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Confirm Logout</h3>
            <p className="text-sm text-gray-500 mb-5">Are you sure you want to log out?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 text-sm rounded-md bg-red-500 text-white hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
