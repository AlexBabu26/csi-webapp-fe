import React from 'react';
import { Card } from '../../../components/ui';
import { CHANGE_REQUEST_STEPS, ChangeRequestStepId } from '../utils';

interface ChangeRequestStepperProps {
  activeStep: ChangeRequestStepId;
  onStepClick?: (step: ChangeRequestStepId) => void;
}

export const ChangeRequestStepper: React.FC<ChangeRequestStepperProps> = ({
  activeStep,
  onStepClick,
}) => {
  return (
    <Card className="!p-0">
      <nav aria-label="Change request progress" className="px-4 py-4 sm:px-5">
        <div className="overflow-x-auto pb-1 -mx-1 px-1">
          <ol className="flex min-w-[360px] items-start justify-between gap-1">
            {CHANGE_REQUEST_STEPS.map((step, index) => {
              const isActive = step.id === activeStep;
              const isComplete = step.id < activeStep;
              const isClickable = isComplete && onStepClick && step.id !== activeStep;

              return (
                <li key={step.id} className="flex flex-1 items-start min-w-0">
                  <div className="flex flex-col items-center flex-1 min-w-0">
                    <button
                      type="button"
                      disabled={!isClickable}
                      onClick={() => isClickable && onStepClick?.(step.id as ChangeRequestStepId)}
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
                  {index < CHANGE_REQUEST_STEPS.length - 1 && (
                    <div
                      className={`mt-[18px] h-0.5 flex-1 min-w-[24px] mx-0.5 ${
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
          Select a member, choose a request type, then complete and submit the form.
        </p>
      </nav>
    </Card>
  );
};
