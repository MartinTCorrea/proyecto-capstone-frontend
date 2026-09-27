import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { RoleName } from '@sgaob/shared';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface RoleGuardProps {
  roles: RoleName[];
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ roles, children, fallback }) => {
  const { hasRole, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Comprobando permisos de acceso..." size="md" />;
  }

  const isAuthorized = hasRole(...roles);

  if (!isAuthorized) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default RoleGuard;
