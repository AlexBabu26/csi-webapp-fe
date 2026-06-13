import React from 'react';
import { Navigate } from 'react-router-dom';
import { Skeleton } from '../../components/ui';
import { useApplicationForm } from '../../hooks/queries';
import { canAccessUnitChangeRequests } from '../UnitRegistration/utils';

interface ChangeRequestGuardProps {
  children: React.ReactNode;
}

export const ChangeRequestGuard: React.FC<ChangeRequestGuardProps> = ({ children }) => {
  const { data: formData, isLoading, isError } = useApplicationForm();

  if (isLoading) {
    return (
      <div className="space-y-4 animate-slide-in">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !formData || !canAccessUnitChangeRequests(formData)) {
    return <Navigate to="/register/wizard" replace />;
  }

  return <>{children}</>;
};
