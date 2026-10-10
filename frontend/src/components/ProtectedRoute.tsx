import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'
import { PageLoader } from './ui'

/** Renders child routes only for a logged-in user; otherwise redirects to /login. */
export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <PageLoader />
  if (status === 'anonymous') {
    // Remember where the user was headed so login can send them back.
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <Outlet />
}

/**
 * The inverse, for /login and /signup. Once the user is authenticated (already,
 * or by logging in on this page) send them to the page ProtectedRoute bounced
 * them from, else the dashboard.
 */
export function GuestRoute() {
  const { status } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string; search: string } } | null)?.from

  if (status === 'loading') return <PageLoader />
  if (status === 'authenticated') {
    return <Navigate to={from ? `${from.pathname}${from.search}` : '/'} replace />
  }
  return <Outlet />
}
