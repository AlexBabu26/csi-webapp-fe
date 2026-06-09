import React from 'react';
import { Button } from '../../../components/ui';
import { ChevronLeft, Send } from 'lucide-react';

interface WizardFormActionsProps {
  onPrevious: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export const WizardFormActions: React.FC<WizardFormActionsProps> = ({
  onPrevious,
  isSubmitting = false,
  submitLabel = 'Submit Request',
}) => (
  <div className="flex items-center justify-between gap-3 pt-6 border-t border-borderColor">
    <Button type="button" variant="outline" onClick={onPrevious} disabled={isSubmitting}>
      <ChevronLeft className="w-4 h-4 mr-2" />
      Previous
    </Button>
    <Button type="submit" variant="primary" disabled={isSubmitting}>
      <Send className="w-4 h-4 mr-2" />
      {isSubmitting ? 'Submitting...' : submitLabel}
    </Button>
  </div>
);
