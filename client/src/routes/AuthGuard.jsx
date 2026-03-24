import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../store/authStore'

function AuthGuard({ allowedRoles }) {
  const { user, token } = useAuthStore()

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export default AuthGuard
