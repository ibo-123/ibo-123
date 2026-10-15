import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { BackendRole } from '../types/person2';
import { getStoredToken, getStoredUser } from '../services/authService';

interface ProtectedRouteProps {
  allowedRoles: BackendRole[];
  redirectTo?: string;
  children?: ReactNode;
}

export default function ProtectedRoute({
  allowedRoles,
  redirectTo = '/login',
  children,
}: ProtectedRouteProps) {
  const token = getStoredToken();
  const user = getStoredUser();
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Determine if driver/fleet owner is approved by Admin
  const isDriverOrFleet = user.role === 'DRIVER' || user.role === 'FLEET_OWNER';
  const isApproved =
    user.kyc_status === 'APPROVED' || user.status === 'ACTIVE';

  const isPendingAdminApproval = isDriverOrFleet && !isApproved;

  if (isPendingAdminApproval && location.pathname !== '/pending-approval') {
    return <Navigate to="/pending-approval" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const roleHome: Record<BackendRole, string> = {
      DRIVER: '/driver',
      FLEET_OWNER: '/company',
      ADMIN: '/admin',
      SHIPPER: '/dashboard',
    };
    return <Navigate to={roleHome[user.role] ?? '/'} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
