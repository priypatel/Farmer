import { Routes, Route, Navigate } from 'react-router-dom'
import AuthGuard from './AuthGuard.jsx'
import NotFound from '../pages/NotFound.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<div>Login Page (Phase 2)</div>} />
      <Route path="/register" element={<div>Register Page (Phase 2)</div>} />

      {/* Protected routes — all roles */}
      <Route element={<AuthGuard />}>
        <Route path="/dashboard" element={<div>Dashboard (Phase 19)</div>} />
      </Route>

      {/* Admin + Super Admin routes */}
      <Route element={<AuthGuard allowedRoles={['admin', 'super_admin']} />}>
        <Route path="/farmers" element={<div>Farmers (Phase 6)</div>} />
        <Route path="/demand" element={<div>Demand (Phase 8)</div>} />
        <Route path="/inventory" element={<div>Inventory (Phase 15)</div>} />
        <Route path="/reports" element={<div>Reports (Phase 17)</div>} />
      </Route>

      {/* Farmer routes */}
      <Route element={<AuthGuard allowedRoles={['farmer']} />}>
        <Route path="/booking" element={<div>Booking (Phase 10)</div>} />
      </Route>

      {/* Redirects and fallback */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
