import { Routes, Route, Navigate } from 'react-router-dom'
import AuthGuard from './AuthGuard'
import AppLayout from '../components/layout/AppLayout'
import LoginPage from '../features/auth/LoginPage'
import RegisterPage from '../features/auth/RegisterPage'
import ForgotPasswordPage from '../features/auth/ForgotPasswordPage'
import ResetPasswordPage from '../features/auth/ResetPasswordPage'
import SetPasswordPage from '../features/auth/SetPasswordPage'
import NotFound from '../pages/NotFound'
import useAuthStore from '../store/authStore'

function RootRedirect() {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'farmer') return <Navigate to="/demand" replace />
  return <Navigate to="/dashboard" replace />
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/auth/set-password" element={<SetPasswordPage />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

      {/* Protected routes — all wrapped in AuthGuard + AppLayout */}
      <Route element={<AuthGuard />}>
        {/* Admin + Super Admin */}
        <Route element={<AppLayout pageTitle="Dashboard" />}>
          <Route path="/dashboard" element={<div className="text-gray-700">Dashboard (Phase 19)</div>} />
        </Route>

        <Route element={<AuthGuard allowedRoles={['admin', 'super_admin']} />}>
          <Route element={<AppLayout pageTitle="Farmers" />}>
            <Route path="/farmers" element={<div className="text-gray-700">Farmers (Phase 6)</div>} />
          </Route>
          <Route element={<AppLayout pageTitle="Inventory" />}>
            <Route path="/inventory" element={<div className="text-gray-700">Inventory (Phase 15)</div>} />
          </Route>
          <Route element={<AppLayout pageTitle="Reports" />}>
            <Route path="/reports" element={<div className="text-gray-700">Reports (Phase 17)</div>} />
          </Route>
        </Route>

        {/* All roles */}
        <Route element={<AppLayout pageTitle="Demand Planning" />}>
          <Route path="/demand" element={<div className="text-gray-700">Demand Planning (Phase 8)</div>} />
        </Route>
        <Route element={<AppLayout pageTitle="Notifications" />}>
          <Route path="/notifications" element={<div className="text-gray-700">Notifications (Phase 12)</div>} />
        </Route>

        {/* Farmer only */}
        <Route element={<AuthGuard allowedRoles={['farmer']} />}>
          <Route element={<AppLayout pageTitle="Booking" />}>
            <Route path="/booking" element={<div className="text-gray-700">Booking (Phase 10)</div>} />
          </Route>
        </Route>
      </Route>

      {/* Root redirect + fallback */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
