import React from 'react';
import { UnitApplicationForm, UnitCouncilor, UnitMember } from '../../../types';
import { ChangeRequestTypeId, getRequestTypeById } from '../utils';
import { SelectedMemberSummary } from '../components/SelectedMemberSummary';
import { MemberInfoChangeFormStep } from './forms/MemberInfoChangeFormStep';
import { TransferFormStep } from './forms/TransferFormStep';
import { CouncilorChangeFormStep } from './forms/CouncilorChangeFormStep';
import { OfficialsChangeFormStep } from './forms/OfficialsChangeFormStep';
import { MemberAddFormStep } from './forms/MemberAddFormStep';

interface SubmitRequestStepProps {
  requestTypeId: ChangeRequestTypeId;
  selectedMember: UnitMember | null;
  members: UnitMember[];
  councilors: UnitCouncilor[];
  formData: UnitApplicationForm;
  onPrevious: () => void;
  onSuccess: () => void;
}

export const SubmitRequestStep: React.FC<SubmitRequestStepProps> = ({
  requestTypeId,
  selectedMember,
  members,
  councilors,
  formData,
  onPrevious,
  onSuccess,
}) => {
  const requestType = getRequestTypeById(requestTypeId);

  if (!requestType) return null;

  if (requestType.memberSpecific && !selectedMember) return null;

  const member = selectedMember!;

  return (
    <div className="space-y-4">
      <SelectedMemberSummary member={selectedMember} requestType={requestType} />

      {requestTypeId === 'member-info' && (
        <MemberInfoChangeFormStep
          selectedMember={member}
          onPrevious={onPrevious}
          onSuccess={onSuccess}
        />
      )}
      {requestTypeId === 'transfer' && (
        <TransferFormStep
          selectedMember={member}
          onPrevious={onPrevious}
          onSuccess={onSuccess}
        />
      )}
      {requestTypeId === 'councilor' && (
        <CouncilorChangeFormStep
          selectedMember={member}
          councilors={councilors}
          members={members}
          onPrevious={onPrevious}
          onSuccess={onSuccess}
        />
      )}
      {requestTypeId === 'officials' && (
        <OfficialsChangeFormStep
          unitOfficials={formData.unit_officials}
          onPrevious={onPrevious}
          onSuccess={onSuccess}
        />
      )}
      {requestTypeId === 'member-add' && (
        <MemberAddFormStep onPrevious={onPrevious} onSuccess={onSuccess} />
      )}
    </div>
  );
};
