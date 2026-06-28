import React, { useEffect, useMemo, useState } from 'react';
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
import {
  ChangeRequestStepId,
  ChangeRequestTypeId,
  getEligibleMembersForRequestType,
  getRequestTypeById,
  isMemberSelectionRequired,
} from './utils';
import { mapRegistrationMemberToUnitMember } from '../../utils/unitMembers';
import { canSubmitAllChangeRequestTypes } from '../UnitRegistration/utils';

export const ChangeRequestWizard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const currentUnitId = getCurrentUnitId();

  const wizardState = (location.state as ChangeRequestNavigationState | null) ?? {};
  const initialMemberId = wizardState.memberId ?? null;

  const [activeStep, setActiveStep] = useState<ChangeRequestStepId>(1);
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

  const selectedMember =
    members.find((member) => member.id === selectedMemberId) ??
    (selectedMemberId && snapshotMember?.id === selectedMemberId ? snapshotMember : null);

  const selectedRequestTypeOption = selectedRequestType
    ? getRequestTypeById(selectedRequestType)
    : undefined;

  const eligibleMembers = useMemo(() => {
    if (!selectedRequestType) return [];
    return getEligibleMembersForRequestType(selectedRequestType, members, councilors);
  }, [selectedRequestType, members, councilors]);

  useEffect(() => {
    if (formLoading || !initialMemberId || !selectedRequestType) return;
    if (!isMemberSelectionRequired(selectedRequestType)) return;

    const isEligible = eligibleMembers.some((member) => member.id === initialMemberId);
    if (!isEligible) {
      setSelectedMemberId(null);
    }
  }, [formLoading, initialMemberId, selectedRequestType, eligibleMembers]);

  const handleStepClick = (step: ChangeRequestStepId) => {
    if (step >= activeStep) return;
    setActiveStep(step);
    if (step === 1) {
      setSelectedRequestType(null);
      setSelectedMemberId(initialMemberId);
    }
  };

  const handleRequestTypeSelect = (requestTypeId: ChangeRequestTypeId) => {
    setSelectedRequestType(requestTypeId);

    if (isMemberSelectionRequired(requestTypeId)) {
      const eligible = getEligibleMembersForRequestType(requestTypeId, members, councilors);
      if (selectedMemberId && !eligible.some((member) => member.id === selectedMemberId)) {
        setSelectedMemberId(null);
      }
      setActiveStep(2);
      return;
    }

    setSelectedMemberId(null);
    setActiveStep(3);
  };

  const handleMemberPrevious = () => {
    setSelectedRequestType(null);
    setActiveStep(1);
  };

  const handleMemberNext = () => {
    if (!selectedMemberId) return;
    setActiveStep(3);
  };

  const handleSubmitPrevious = () => {
    if (selectedRequestType && isMemberSelectionRequired(selectedRequestType)) {
      setActiveStep(2);
      return;
    }

    setSelectedRequestType(null);
    setActiveStep(1);
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
            <SelectRequestTypeStep
              councilors={councilors}
              onSelect={handleRequestTypeSelect}
              allowAllRequestTypes={canSubmitAllChangeRequestTypes(
                formData.registration_status,
              )}
            />
          )}
          {activeStep === 2 && selectedRequestTypeOption && (
            <SelectMemberStep
              members={eligibleMembers}
              isLoading={formLoading}
              selectedMemberId={selectedMemberId}
              requestType={selectedRequestTypeOption}
              onSelectMember={setSelectedMemberId}
              onPrevious={handleMemberPrevious}
              onNext={handleMemberNext}
            />
          )}
          {activeStep === 3 && selectedRequestType && (
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
