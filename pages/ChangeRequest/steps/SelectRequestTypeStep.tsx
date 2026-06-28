import React from 'react';
import { Card } from '../../../components/ui';
import {
  ArrowRightLeft,
  FileText,
  Shield,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { UnitCouncilor } from '../../../types';
import {
  MEMBER_REQUEST_TYPES,
  UNIT_REQUEST_TYPES,
  ChangeRequestTypeId,
  ChangeRequestTypeOption,
} from '../utils';

interface SelectRequestTypeStepProps {
  councilors: UnitCouncilor[];
  onSelect: (requestTypeId: ChangeRequestTypeId) => void;
  /**
   * When false, the unit is still in the registration phase and only a limited
   * set of requests is offered. The full set unlocks after declaration
   * completion / unit registration payment.
   */
  allowAllRequestTypes?: boolean;
}

const REGISTRATION_PHASE_REQUEST_IDS: ChangeRequestTypeId[] = ['member-info', 'transfer'];

const REQUEST_ICONS: Record<string, React.ReactNode> = {
  'member-info': <FileText className="w-5 h-5 text-primary" />,
  transfer: <ArrowRightLeft className="w-5 h-5 text-primary" />,
  councilor: <UserCheck className="w-5 h-5 text-primary" />,
  officials: <Shield className="w-5 h-5 text-primary" />,
  'member-add': <UserPlus className="w-5 h-5 text-primary" />,
};

export const SelectRequestTypeStep: React.FC<SelectRequestTypeStepProps> = ({
  councilors,
  onSelect,
  allowAllRequestTypes = true,
}) => {
  const isRequestAllowedInPhase = (id: ChangeRequestTypeId) =>
    allowAllRequestTypes || REGISTRATION_PHASE_REQUEST_IDS.includes(id);

  const availableMemberRequests = MEMBER_REQUEST_TYPES.filter((request) => {
    if (!isRequestAllowedInPhase(request.id)) return false;
    if (request.id === 'councilor') return councilors.length > 0;
    return true;
  });

  const availableUnitRequests = UNIT_REQUEST_TYPES.filter((request) =>
    isRequestAllowedInPhase(request.id),
  );

  const handleSelect = (request: ChangeRequestTypeOption) => {
    onSelect(request.id);
  };

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-lg font-bold text-textDark mb-1">Member Requests</h3>
        <p className="text-sm text-textMuted mb-4">
          Change requests that apply to a specific member in your unit
        </p>
        {availableMemberRequests.length === 0 ? (
          <p className="text-sm text-textMuted py-4 text-center">
            No member requests are available for your unit at this time.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableMemberRequests.map((request) => (
              <button
                key={request.id}
                type="button"
                onClick={() => handleSelect(request)}
                className="text-left p-4 rounded-lg border border-borderColor hover:border-primary/40 hover:bg-bgLight transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{REQUEST_ICONS[request.id]}</div>
                  <div className="min-w-0">
                    <p className="font-semibold text-textDark">{request.title}</p>
                    <p className="text-sm text-textMuted mt-1">{request.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      {availableUnitRequests.length > 0 && (
        <Card>
          <h3 className="text-lg font-bold text-textDark mb-1">Unit Requests</h3>
          <p className="text-sm text-textMuted mb-4">
            These requests apply to your whole unit, not a specific member
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableUnitRequests.map((request) => (
              <button
                key={request.id}
                type="button"
                onClick={() => handleSelect(request)}
                className="text-left p-4 rounded-lg border border-borderColor hover:border-primary/40 hover:bg-bgLight transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{REQUEST_ICONS[request.id]}</div>
                  <div className="min-w-0">
                    <p className="font-semibold text-textDark">{request.title}</p>
                    <p className="text-sm text-textMuted mt-1">{request.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
