import React from 'react';
import { WIZARD_STEPS, WizardStepId } from '../utils';

interface RegistrationStepperProps {
  activeStep: WizardStepId;
  maxStep: WizardStepId;
  onStepClick?: (step: WizardStepId) => void;
}

export const RegistrationStepper: React.FC<RegistrationStepperProps> = ({
  activeStep,
  maxStep,
  onStepClick,
}) => {
  return (
    <nav aria-label="Registration progress" className="mb-8">
      <ol className="flex flex-wrap items-center justify-between gap-2">
        {WIZARD_STEPS.map((step, index) => {
          const isActive = step.id === activeStep;
          const isComplete = step.id < activeStep;
          const isAccessible = step.id <= maxStep && step.id >= 2;
          const isClickable = isAccessible && onStepClick && step.id !== activeStep;

          return (
            <li key={step.id} className="flex items-center flex-1 min-w-[80px]">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick?.(step.id as WizardStepId)}
                className={`flex flex-col items-center w-full group ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-primary text-white ring-4 ring-primary/20'
                      : isComplete
                        ? 'bg-success text-white'
                        : isAccessible
                          ? 'bg-primary/10 text-primary border border-primary/30'
                          : 'bg-gray-100 text-textMuted border border-borderColor'
                  }`}
                >
                  {isComplete ? '✓' : step.id}
                </span>
                <span
                  className={`mt-2 text-xs font-medium text-center hidden sm:block ${
                    isActive ? 'text-primary' : 'text-textMuted'
                  }`}
                >
                  {step.shortLabel}
                </span>
              </button>
              {index < WIZARD_STEPS.length - 1 && (
                <div
                  className={`hidden sm:block h-0.5 flex-1 mx-1 ${
                    step.id < activeStep ? 'bg-success' : 'bg-borderColor'
                  }`}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
