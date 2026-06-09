import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Building, AlertCircle } from 'lucide-react';
import { Skeleton, Button } from '../../components/ui';
import { useApplicationForm } from '../../hooks/queries';
import { RegistrationStepper } from './components/RegistrationStepper';
import { UnitDetailsStep } from './steps/UnitDetailsStep';
import { MembersStep } from './steps/MembersStep';
import { OfficialsStep } from './steps/OfficialsStep';
import { CouncilorsStep } from './steps/CouncilorsStep';
import { DeclarationStep } from './steps/DeclarationStep';
import {
  statusToStep,
  isRegistrationComplete,
  canNavigateToStep,
  WizardStepId,
} from './utils';
import { membersMissingLocation, formatRegistrationSeason } from '../../services/authRouting';
import { WizardReturnState } from '../../types';

export const RegistrationWizard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: formData, isLoading, isError, error, refetch } = useApplicationForm();
  const [activeStep, setActiveStep] = useState<WizardStepId>(2);

  const returnWizardStep = (location.state as WizardReturnState | null)?.wizardStep;

  useEffect(() => {
    if (
      returnWizardStep &&
      returnWizardStep >= 2 &&
      returnWizardStep <= 6
    ) {
      setActiveStep(returnWizardStep as WizardStepId);
    }
  }, [returnWizardStep]);

  useEffect(() => {
    if (returnWizardStep) return;

    if (!formData) return;
    if (isRegistrationComplete(formData.registration_status)) {
      navigate('/register/complete', { replace: true });
      return;
    }
    const step = statusToStep(formData.registration_status);
    if (step > 3 && membersMissingLocation(formData.unit_members)) {
      setActiveStep(3);
      return;
    }
    setActiveStep(step);
  }, [formData, navigate, returnWizardStep]);

  const maxStep = formData ? statusToStep(formData.registration_status) : 2;

  const handleStepComplete = async () => {
    await refetch();
  };

  const handleStepClick = (step: WizardStepId) => {
    if (canNavigateToStep(step, maxStep)) {
      setActiveStep(step);
    }
  };

  const handlePrevious = () => {
    if (activeStep > 2) {
      setActiveStep((activeStep - 1) as WizardStepId);
    }
  };

  const stepNavigation = {
    onPrevious: handlePrevious,
    showPrevious: activeStep > 2,
  };

  if (isLoading) {
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
          <h2 className="text-xl font-bold text-textDark">Unable to load registration</h2>
          <p className="mt-2 text-sm text-textMuted">
            {(error as Error)?.message || 'Something went wrong while loading your registration form.'}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button onClick={() => refetch()}>Try Again</Button>
            <Link to="/register" className="text-sm font-medium text-primary">
              Back to Registration
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bgLight py-4 sm:py-6 px-3 sm:px-5">
      <div className="max-w-7xl mx-auto space-y-4">
        <header className="text-center">
          <div className="h-10 w-10 bg-primary rounded-lg mx-auto flex items-center justify-center text-white mb-3">
            <Building size={22} />
          </div>
          <h1 className="text-2xl font-bold text-textDark">Unit Registration</h1>
          <p className="text-sm text-textMuted mt-1">
            {formData.user_data.unit_name} — Step {activeStep} of 6
          </p>
          {formData.is_renewal && (
            <div className="mt-4 mx-auto max-w-4xl rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-textDark text-left sm:text-center">
              Renewing registration for{' '}
              <strong>{formatRegistrationSeason(formData.registration_year)}</strong>. Review your
              information below. Corrections to existing records must be submitted as change
              requests from My Requests.
            </div>
          )}
        </header>

        <RegistrationStepper
          activeStep={activeStep}
          maxStep={maxStep}
          onStepClick={handleStepClick}
        />

        <div className="space-y-4">
          {activeStep === 2 && (
            <UnitDetailsStep
              formData={formData}
              onComplete={() => handleStepComplete()}
              {...stepNavigation}
            />
          )}
          {activeStep === 3 && (
            <MembersStep
              formData={formData}
              onComplete={() => handleStepComplete()}
              {...stepNavigation}
            />
          )}
          {activeStep === 4 && (
            <OfficialsStep
              formData={formData}
              onComplete={() => handleStepComplete()}
              {...stepNavigation}
            />
          )}
          {activeStep === 5 && (
            <CouncilorsStep
              formData={formData}
              onComplete={() => handleStepComplete()}
              {...stepNavigation}
            />
          )}
          {activeStep === 6 && <DeclarationStep {...stepNavigation} />}
        </div>

        <div className="pt-2 border-t border-borderColor/60 text-center flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
          <Link
            to="/unit/change-request"
            className="inline-flex items-center text-sm font-medium text-textMuted hover:text-primary transition-colors"
          >
            Submit Change Request
          </Link>
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
