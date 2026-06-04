import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/ui';

export interface WizardStepNavigationProps {
  onPrevious?: () => void;
  showPrevious?: boolean;
}

interface WizardStepActionsProps extends WizardStepNavigationProps {
  children: React.ReactNode;
  className?: string;
  leading?: React.ReactNode;
  /** When true, renders as a standalone full-width footer bar (outside nested cards). */
  standalone?: boolean;
}

export const WizardStepActions: React.FC<WizardStepActionsProps> = ({
  onPrevious,
  showPrevious = false,
  children,
  className = '',
  leading,
  standalone = false,
}) => {
  const wrapperClass = standalone
    ? `rounded-lg border border-borderColor bg-white shadow-sm px-4 py-3 sm:px-5 ${className}`
    : `border-t border-borderColor pt-4 mt-4 ${className}`;

  return (
    <div className={wrapperClass}>
      {leading && <div className="mb-3">{leading}</div>}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {showPrevious && onPrevious ? (
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
        ) : (
          <span className="hidden sm:block sm:flex-1" aria-hidden />
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end w-full sm:w-auto order-1 sm:order-2">
          {React.Children.map(children, (child) =>
            React.isValidElement<{ className?: string }>(child)
              ? React.cloneElement(child, {
                  className: `w-full sm:w-auto ${child.props.className ?? ''}`.trim(),
                })
              : child,
          )}
        </div>
      </div>
    </div>
  );
};
