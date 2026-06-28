import React from 'react';
import { Card } from '../../../components/ui';
import { UnitMember } from '../../../types';
import { ChangeRequestTypeOption } from '../utils';

interface SelectedMemberSummaryProps {
  member?: UnitMember | null;
  requestType: ChangeRequestTypeOption;
}

export const SelectedMemberSummary: React.FC<SelectedMemberSummaryProps> = ({
  member,
  requestType,
}) => (
  <Card className="bg-primary/5 border-primary/20">
    <p className="text-sm text-textMuted">{requestType.title}</p>
    {!requestType.memberSpecific || !member ? (
      <p className="text-sm text-textDark mt-1">Unit-level request for your unit</p>
    ) : (
      <>
        <p className="text-lg font-bold text-textDark mt-0.5">{member.name}</p>
        <p className="text-sm text-textMuted mt-1">+91 {member.number}</p>
      </>
    )}
  </Card>
);
