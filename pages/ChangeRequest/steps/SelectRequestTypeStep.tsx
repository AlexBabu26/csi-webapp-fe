import React from 'react';
import { Card, Button } from '../../../components/ui';
import {
  ArrowRightLeft,
  ChevronLeft,
  FileText,
  Shield,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { UnitCouncilor, UnitMember } from '../../../types';
import {
  MEMBER_REQUEST_TYPES,
  UNIT_REQUEST_TYPES,
  ChangeRequestTypeId,
  ChangeRequestTypeOption,
} from '../utils';

interface SelectRequestTypeStepProps {
  selectedMember: UnitMember;
  councilors: UnitCouncilor[];
  onPrevious: () => void;
  onSelect: (requestTypeId: ChangeRequestTypeId) => void;
}

const REQUEST_ICONS: Record<string, React.ReactNode> = {
  'member-info': <FileText className="w-5 h-5 text-primary" />,
  transfer: <ArrowRightLeft className="w-5 h-5 text-primary" />,
  councilor: <UserCheck className="w-5 h-5 text-primary" />,
  officials: <Shield className="w-5 h-5 text-primary" />,
  'member-add': <UserPlus className="w-5 h-5 text-primary" />,
};

export const SelectRequestTypeStep: React.FC<SelectRequestTypeStepProps> = ({
  selectedMember,
  councilors,
  onPrevious,
  onSelect,
}) => {
  const memberCouncilor = councilors.find((c) => c.memberId === selectedMember.id);

  const availableMemberRequests = MEMBER_REQUEST_TYPES.filter((request) => {
    if (request.id === 'councilor') return Boolean(memberCouncilor);
    return true;
  });

  const handleSelect = (request: ChangeRequestTypeOption) => {
    onSelect(request.id);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-primary/5 border-primary/20">
        <p className="text-sm text-textMuted">Request for</p>
        <p className="text-lg font-bold text-textDark mt-0.5">{selectedMember.name}</p>
        <p className="text-sm text-textMuted mt-1">+91 {selectedMember.number}</p>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-textDark mb-1">Member Requests</h3>
        <p className="text-sm text-textMuted mb-4">
          Change requests that apply to {selectedMember.name}
        </p>
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
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-textDark mb-1">Unit Requests</h3>
        <p className="text-sm text-textMuted mb-4">
          These requests apply to your whole unit, not a specific member
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {UNIT_REQUEST_TYPES.map((request) => (
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

      <div className="flex justify-start">
        <Button type="button" variant="outline" onClick={onPrevious}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
      </div>
    </div>
  );
};
