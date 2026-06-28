import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { getCurrentUnitId } from '../../services/auth';
import { ChangeRequestNavigationState, UnitRegistrationOfficial } from '../../types';
import { useActiveUnitMembers } from '../../hooks/queries';
import { OfficialsChangeFormStep } from '../ChangeRequest/steps/forms/OfficialsChangeFormStep';

export const SubmitOfficialsChange: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const navState = (location.state as ChangeRequestNavigationState | null) ?? {};
  const fromWizard = Boolean(navState.fromWizard);
  const presetMemberId = navState.memberId;

  const currentUnitId = getCurrentUnitId();
  const { data: formData, members, councilors, isLoading } = useActiveUnitMembers(Boolean(currentUnitId));

  const unitOfficials = useMemo<UnitRegistrationOfficial | null>(() => {
    if (!formData?.unit_officials) return null;
    return formData.unit_officials;
  }, [formData]);

  useEffect(() => {
    if (!currentUnitId) {
      addToast('Please login to access this page', 'error');
      navigate('/');
    }
  }, [currentUnitId, addToast, navigate]);

  const handleBack = () => {
    if (fromWizard) {
      navigate('/unit/change-request', { state: { memberId: presetMemberId } });
      return;
    }
    navigate('/unit/my-requests');
  };

  if (!currentUnitId) {
    return null;
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-textDark">Submit Officials Change Request</h1>
          <p className="mt-1 text-sm text-textMuted">Request to update unit officials information</p>
        </div>
      </div>

      {!isLoading && (
        <OfficialsChangeFormStep
          unitOfficials={unitOfficials}
          members={members}
          councilors={councilors}
          onPrevious={handleBack}
          onSuccess={() => navigate('/unit/my-requests')}
        />
      )}
    </div>
  );
};
