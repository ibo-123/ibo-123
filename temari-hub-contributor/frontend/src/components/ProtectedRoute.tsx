import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';

export function dashboardPath(role: Role) {
  return role === 'ADMIN' ? '/admin/dashboard' : '/contributor/dashboard';
}

export function ProtectedRoute({
  allowedRole,
  children,
}: {
  allowedRole: Role;
  children: ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-600">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== allowedRole) {
    return <Navigate to={dashboardPath(user.role)} replace />;
  }

  return children;
}
