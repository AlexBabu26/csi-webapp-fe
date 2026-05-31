import React, { useState } from 'react';
import { Card, Button } from '../../../components/ui';
import { Users, Trash2 } from 'lucide-react';
import { UnitApplicationForm } from '../../../types';
import {
  useAddUnitCouncilor,
  useDeleteUnitCouncilor,
  useConfirmUnitCouncilors,
} from '../../../hooks/queries';

interface CouncilorsStepProps {
  formData: UnitApplicationForm;
  onComplete: () => void;
}

export const CouncilorsStep: React.FC<CouncilorsStepProps> = ({ formData, onComplete }) => {
  const [selectedMemberId, setSelectedMemberId] = useState<number | ''>('');

  const addCouncilor = useAddUnitCouncilor();
  const deleteCouncilor = useDeleteUnitCouncilor();
  const confirmCouncilors = useConfirmUnitCouncilors();

  const requiredCount = formData.number_of_councilor_fields;
  const councilors = formData.unit_councilors;
  const members = formData.unit_members;

  const councilorMemberIds = new Set(councilors.map((c) => c.unit_member_id));
  const availableMembers = members.filter((m) => !councilorMemberIds.has(m.id));

  const getMemberName = (memberId: number) =>
    members.find((m) => m.id === memberId)?.name || 'Unknown';

  const handleAdd = async () => {
    if (!selectedMemberId) return;
    await addCouncilor.mutateAsync(Number(selectedMemberId));
    setSelectedMemberId('');
  };

  const handleContinue = async () => {
    if (councilors.length !== requiredCount) return;
    await confirmCouncilors.mutateAsync();
    onComplete();
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-textDark">Unit Councilors</h3>
        </div>
        <p className="text-sm text-textMuted mb-4">
          Select {requiredCount} councilor{requiredCount !== 1 ? 's' : ''} from your unit members.
          Currently selected: {councilors.length} / {requiredCount}
        </p>

        {councilors.length < requiredCount && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value ? Number(e.target.value) : '')}
              className="flex-1 px-3 py-2 border border-borderColor rounded-md bg-white"
            >
              <option value="">Select a member</option>
              {availableMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <Button type="button" onClick={handleAdd} disabled={!selectedMemberId} isLoading={addCouncilor.isPending}>
              Add Councilor
            </Button>
          </div>
        )}

        {councilors.length === 0 ? (
          <p className="text-sm text-textMuted">No councilors selected yet.</p>
        ) : (
          <ul className="divide-y divide-borderColor">
            {councilors.map((c, index) => (
              <li key={c.id} className="flex items-center justify-between py-3">
                <span className="text-sm">
                  <span className="font-medium text-textMuted mr-2">{index + 1}.</span>
                  {getMemberName(c.unit_member_id)}
                </span>
                <button
                  type="button"
                  onClick={() => deleteCouncilor.mutate(c.id)}
                  className="p-1 text-danger hover:bg-danger/10 rounded"
                  aria-label="Remove councilor"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleContinue}
            disabled={councilors.length !== requiredCount}
            isLoading={confirmCouncilors.isPending}
          >
            Continue to Declaration
          </Button>
        </div>
      </Card>
    </div>
  );
};
