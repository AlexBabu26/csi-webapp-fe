import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRightLeft, AlertCircle } from 'lucide-react';
import { Button, Skeleton } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { getCurrentUnitId } from '../../services/auth';
import { useActiveUnitMembers } from '../../hooks/queries';
import { ChangeRequestNavigationState } from '../../types';
import { ChangeRequestStepper } from './components/ChangeRequestStepper';
import { SelectMemberStep } from './steps/SelectMemberStep';
import { SelectRequestTypeStep } from './steps/SelectRequestTypeStep';
import { SubmitRequestStep } from './steps/SubmitRequestStep';
import { ChangeRequestStepId, ChangeRequestTypeId } from './utils';
import { mapRegistrationMemberToUnitMember } from '../../utils/unitMembers';
import { canSubmitAllChangeRequestTypes } from '../UnitRegistration/utils';

export const ChangeRequestWizard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const currentUnitId = getCurrentUnitId();

  const wizardState = (location.state as ChangeRequestNavigationState | null) ?? {};
  const initialMemberId = wizardState.memberId ?? null;

  const [activeStep, setActiveStep] = useState<ChangeRequestStepId>(initialMemberId ? 2 : 1);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(initialMemberId);
  const [selectedRequestType, setSelectedRequestType] = useState<ChangeRequestTypeId | null>(null);

  const {
    data: formData,
    members,
    councilors,
    isLoading: formLoading,
    isError,
    error,
    refetch,
  } = useActiveUnitMembers(Boolean(currentUnitId));

  const snapshotMember =
    wizardState.memberSnapshot && currentUnitId
      ? mapRegistrationMemberToUnitMember(
          wizardState.memberSnapshot,
          formData?.user_data.id ?? currentUnitId,
          formData?.user_data.unit_name ?? '',
        )
      : null;

  useEffect(() => {
    if (!currentUnitId) {
      addToast('Please login to access this page', 'error');
      navigate('/');
    }
  }, [currentUnitId, addToast, navigate]);

  useEffect(() => {
    if (!initialMemberId) return;
    setSelectedMemberId(initialMemberId);
    setActiveStep(2);
  }, [initialMemberId]);

  const selectedMember =
    members.find((member) => member.id === selectedMemberId) ??
    (selectedMemberId && snapshotMember?.id === selectedMemberId ? snapshotMember : null);

  useEffect(() => {
    if (formLoading || !initialMemberId || selectedMember) return;
    setActiveStep(1);
    setSelectedMemberId(initialMemberId);
  }, [formLoading, initialMemberId, selectedMember]);

  const handleStepClick = (step: ChangeRequestStepId) => {
    if (step >= activeStep) return;
    setActiveStep(step);
    if (step < 3) setSelectedRequestType(null);
  };

  const handleMemberNext = () => {
    if (!selectedMemberId) return;
    setActiveStep(2);
  };

  const handleRequestTypePrevious = () => {
    setSelectedRequestType(null);
    setActiveStep(1);
  };

  const handleRequestTypeSelect = (requestTypeId: ChangeRequestTypeId) => {
    setSelectedRequestType(requestTypeId);
    setActiveStep(3);
  };

  const handleSubmitPrevious = () => {
    setSelectedRequestType(null);
    setActiveStep(2);
  };

  const handleSubmitSuccess = () => {
    navigate('/unit/my-requests');
  };

  if (!currentUnitId) {
    return null;
  }

  if (formLoading) {
    return (
      <div className="min-h-screen bg-bgLight py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !formData) {
    return (
      <div className="min-h-screen bg-bgLight flex flex-col justify-center py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="h-12 w-12 bg-danger/10 rounded-full mx-auto flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-danger" />
          </div>
          <h2 className="text-xl font-bold text-textDark">Unable to load members</h2>
          <p className="mt-2 text-sm text-textMuted">
            {(error as Error)?.message || 'Something went wrong while loading your unit members.'}
          </p>
          <div className="mt-6">
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bgLight py-4 sm:py-6 px-3 sm:px-5">
      <div className="max-w-4xl mx-auto space-y-4">
        <header className="text-center">
          <div className="h-10 w-10 bg-primary rounded-lg mx-auto flex items-center justify-center text-white mb-3">
            <ArrowRightLeft size={22} />
          </div>
          <h1 className="text-2xl font-bold text-textDark">Change Request</h1>
          <p className="text-sm text-textMuted mt-1">Step {activeStep} of 3</p>
        </header>

        <ChangeRequestStepper activeStep={activeStep} onStepClick={handleStepClick} />

        <div className="space-y-4">
          {activeStep === 1 && (
            <SelectMemberStep
              members={members}
              isLoading={formLoading}
              selectedMemberId={selectedMemberId}
              onSelectMember={setSelectedMemberId}
              onNext={handleMemberNext}
            />
          )}
          {activeStep === 2 && selectedMember && (
            <SelectRequestTypeStep
              selectedMember={selectedMember}
              councilors={councilors}
              onPrevious={handleRequestTypePrevious}
              onSelect={handleRequestTypeSelect}
              allowAllRequestTypes={canSubmitAllChangeRequestTypes(
                formData.registration_status,
              )}
            />
          )}
          {activeStep === 3 && selectedMember && selectedRequestType && (
            <SubmitRequestStep
              requestTypeId={selectedRequestType}
              selectedMember={selectedMember}
              members={members}
              councilors={councilors}
              formData={formData}
              onPrevious={handleSubmitPrevious}
              onSuccess={handleSubmitSuccess}
            />
          )}
        </div>

        <div className="pt-2 border-t border-borderColor/60 text-center">
          <Link
            to="/unit/my-requests"
            className="inline-flex items-center text-sm font-medium text-textMuted hover:text-primary transition-colors"
          >
            View My Requests
          </Link>
        </div>
      </div>
    </div>
  );
};
