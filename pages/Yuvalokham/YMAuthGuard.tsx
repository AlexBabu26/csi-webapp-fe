import React from 'react';
import { Navigate } from 'react-router-dom';
import { isYMAuthenticated, getYMUserRole } from '../../services/yuvalokham-auth';

interface YMAuthGuardProps {
  requiredRole?: 'admin' | 'user';
  children: React.ReactNode;
}

export const YMAuthGuard: React.FC<YMAuthGuardProps> = ({ requiredRole, children }) => {
  if (!isYMAuthenticated()) {
    return <Navigate to="/yuvalokham/login" replace />;
  }

  if (requiredRole) {
    const role = getYMUserRole();
    if (role !== requiredRole) {
      return <Navigate to="/yuvalokham/login" replace />;
    }
  }

  return <>{children}</>;
};
