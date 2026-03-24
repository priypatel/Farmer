import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Settings, ChevronDown, LogOut } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { logoutApi } from '../../features/auth/api'

export default function Header({ pageTitle }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const confirmLogout = async () => {
    try { await logoutApi() } catch { /* ignore */ }
    logout()
    navigate('/login')
  }

  return (
    <>
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left — Page title */}
      <h1 className="font-semibold text-base text-gray-900">{pageTitle}</h1>

      {/* Right — Actions */}
      <div className="flex items-center gap-4">
        {/* Alerts */}
        <button className="relative text-gray-500 hover:text-gray-700">
          <Bell size={20} />
        </button>

        <div className="border-r border-gray-300 h-5" />

        {/* Settings */}
        <button className="text-gray-500 hover:text-gray-700">
          <Settings size={20} />
        </button>

        <div className="border-r border-gray-300 h-5" />

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
          >
            {user?.firstName || 'Admin'}
            <ChevronDown size={16} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[140px] z-30">
              <button
                onClick={() => { setDropdownOpen(false); setShowConfirm(true) }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>

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
