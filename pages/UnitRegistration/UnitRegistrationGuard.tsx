import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, isUnitUser } from '../../services/auth';

interface UnitRegistrationGuardProps {
  children: React.ReactNode;
}

export const UnitRegistrationGuard: React.FC<UnitRegistrationGuardProps> = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/register" replace />;
  }

  if (!isUnitUser()) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
