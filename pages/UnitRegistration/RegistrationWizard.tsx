import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building, ArrowLeft } from 'lucide-react';
import { Skeleton } from '../../components/ui';
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

export const RegistrationWizard: React.FC = () => {
  const navigate = useNavigate();
  const { data: formData, isLoading, refetch } = useApplicationForm();
  const [activeStep, setActiveStep] = useState<WizardStepId>(2);

  useEffect(() => {
    if (!formData) return;
    if (isRegistrationComplete(formData.registration_status)) {
      navigate('/register/complete', { replace: true });
      return;
    }
    setActiveStep(statusToStep(formData.registration_status));
  }, [formData, navigate]);

  const maxStep = formData ? statusToStep(formData.registration_status) : 2;

  const handleStepComplete = async () => {
    await refetch();
  };

  const handleStepClick = (step: WizardStepId) => {
    if (canNavigateToStep(step, maxStep)) {
      setActiveStep(step);
    }
  };

  if (isLoading || !formData) {
    return (
      <div className="min-h-screen bg-bgLight py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bgLight py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <div className="h-10 w-10 bg-primary rounded-lg mx-auto flex items-center justify-center text-white mb-3">
            <Building size={22} />
          </div>
          <h1 className="text-2xl font-bold text-textDark">Unit Registration</h1>
          <p className="text-sm text-textMuted mt-1">
            {formData.user_data.unit_name} — Step {activeStep} of 6
          </p>
        </div>

        <RegistrationStepper
          activeStep={activeStep}
          maxStep={maxStep}
          onStepClick={handleStepClick}
        />

        {activeStep === 2 && (
          <UnitDetailsStep formData={formData} onComplete={() => handleStepComplete()} />
        )}
        {activeStep === 3 && (
          <MembersStep formData={formData} onComplete={() => handleStepComplete()} />
        )}
        {activeStep === 4 && (
          <OfficialsStep formData={formData} onComplete={() => handleStepComplete()} />
        )}
        {activeStep === 5 && (
          <CouncilorsStep formData={formData} onComplete={() => handleStepComplete()} />
        )}
        {activeStep === 6 && <DeclarationStep />}

        <div className="mt-8 text-center">
          <Link to="/" className="text-sm font-medium text-primary inline-flex items-center gap-1">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};
