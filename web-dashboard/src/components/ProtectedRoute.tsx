import { useAuth } from '@/hooks/useAuth'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

interface ProtectedRouteProps {
  requiredRole?: 'super_admin' | 'admin' | 'operator' | 'partner'
}

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { user, role, loading, isInspecting } = useAuth()
  const location = useLocation()

  if (loading || (user && !role)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm">Verifying AutoBell credentials...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 1. Super Admin Route Protection (/super-admin/*)
  if (requiredRole === 'super_admin') {
    if (role !== 'super_admin') {
      return <Navigate to={role === 'partner' ? '/partner' : '/dashboard'} replace />
    }
    return <Outlet />
  }

  // 2. Partner Route Protection (/partner/*)
  if (requiredRole === 'partner') {
    if (role === 'partner' || (role === 'super_admin' && isInspecting)) {
      return <Outlet />
    }
    return <Navigate to={role === 'super_admin' ? '/super-admin' : '/dashboard'} replace />
  }

  // 3. School Admin Dashboard Route Protection (/dashboard/*)
  if (!requiredRole || requiredRole === 'admin') {
    if (role === 'super_admin') {
      if (!isInspecting) {
        // Super Admin navigating to /dashboard without active inspection -> redirect to /super-admin
        return <Navigate to="/super-admin" replace />
      }
      return <Outlet />
    }
    if (role === 'partner') {
      return <Navigate to="/partner" replace />
    }
    return <Outlet />
  }

  return <Outlet />
}
