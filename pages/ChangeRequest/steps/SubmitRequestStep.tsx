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
  selectedMember: UnitMember;
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

  return (
    <div className="space-y-4">
      <SelectedMemberSummary member={selectedMember} requestType={requestType} />

      {requestTypeId === 'member-info' && (
        <MemberInfoChangeFormStep
          selectedMember={selectedMember}
          onPrevious={onPrevious}
          onSuccess={onSuccess}
        />
      )}
      {requestTypeId === 'transfer' && (
        <TransferFormStep
          selectedMember={selectedMember}
          onPrevious={onPrevious}
          onSuccess={onSuccess}
        />
      )}
      {requestTypeId === 'councilor' && (
        <CouncilorChangeFormStep
          selectedMember={selectedMember}
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
