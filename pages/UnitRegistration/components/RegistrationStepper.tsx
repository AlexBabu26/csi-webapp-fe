import React from 'react';
import { Card } from '../../../components/ui';
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
    <Card className="!p-0">
      <nav aria-label="Registration progress" className="px-4 py-4 sm:px-5">
        <div className="overflow-x-auto pb-1 -mx-1 px-1">
          <ol className="flex min-w-[520px] items-start justify-between gap-1">
            {WIZARD_STEPS.map((step, index) => {
              const isActive = step.id === activeStep;
              const isComplete = step.id < activeStep;
              const isAccessible = step.id <= maxStep && step.id >= 2;
              const isClickable = isAccessible && onStepClick && step.id !== activeStep;

              return (
                <li key={step.id} className="flex flex-1 items-start min-w-0">
                  <div className="flex flex-col items-center flex-1 min-w-0">
                    <button
                      type="button"
                      disabled={!isClickable}
                      onClick={() => isClickable && onStepClick?.(step.id as WizardStepId)}
                      title={isClickable ? `Go back to ${step.label}` : undefined}
                      aria-label={
                        isClickable
                          ? `Go back to ${step.label}`
                          : isActive
                            ? `${step.label}, current step`
                            : step.label
                      }
                      className={`flex flex-col items-center w-full group ${
                        isClickable ? 'cursor-pointer hover:opacity-90' : 'cursor-default'
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
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
                        className={`mt-2 text-xs font-medium text-center truncate w-full px-0.5 ${
                          isActive ? 'text-primary' : 'text-textMuted'
                        }`}
                      >
                        {step.shortLabel}
                      </span>
                    </button>
                  </div>
                  {index < WIZARD_STEPS.length - 1 && (
                    <div
                      className={`mt-[18px] h-0.5 flex-1 min-w-[12px] mx-0.5 ${
                        step.id < activeStep ? 'bg-success' : 'bg-borderColor'
                      }`}
                      aria-hidden
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
        <p className="mt-3 text-center text-xs text-textMuted">
          Completed steps are clickable — use them or the Previous button to go back and review.
        </p>
      </nav>
    </Card>
  );
};
