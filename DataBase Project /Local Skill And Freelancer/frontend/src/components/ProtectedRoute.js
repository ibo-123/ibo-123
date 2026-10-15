import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const ProtectedRoute = ({ 
  children, 
  roles = [], 
  redirectTo = '/login',
  unauthorizedRedirect = '/dashboard',
  requireVerified = false,
  requireProfileComplete = false
}) => {
  const { user, token, loading } = useContext(AuthContext);
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Checking authentication..." />
      </div>
    );
  }

  // Check if user is authenticated (has both user and token)
  const isAuthenticated = user && token;
  if (!isAuthenticated) {
    // Save the attempted URL for redirect after login
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  // Check role requirements (support both single role and array of roles)
  const hasRequiredRole = () => {
    if (!roles || roles.length === 0) return true;
    
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.includes(user?.role);
  };

  if (!hasRequiredRole()) {
    return <Navigate to={unauthorizedRedirect} replace />;
  }

  // Check if email is verified (if required)
  if (requireVerified && !user?.isEmailVerified) {
    return <Navigate to="/verify-email" state={{ from: location.pathname }} replace />;
  }

  // Check if profile is complete (if required)
  if (requireProfileComplete && !user?.profileComplete) {
    return <Navigate to="/complete-profile" state={{ from: location.pathname }} replace />;
  }

  // If user is suspended or banned
  if (user?.status === 'suspended' || user?.status === 'banned') {
    return <Navigate to="/account-suspended" replace />;
  }

  return children;
};

// HOC to protect multiple routes
export const withProtection = (Component, options = {}) => {
  return function ProtectedComponent(props) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
};

// Component for conditional rendering based on roles
export const RoleBasedRender = ({ children, roles, user }) => {
  const hasAccess = () => {
    if (!roles || roles.length === 0) return true;
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.includes(user?.role);
  };

  return hasAccess() ? <>{children}</> : null;
};

export default ProtectedRoute;