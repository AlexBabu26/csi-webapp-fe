import React, { useState } from 'react';
import { Card, Button } from '../../../../components/ui';
import { FileUpload } from '../../../../components/FileUpload';
import { useToast } from '../../../../components/Toast';
import { api } from '../../../../services/api';
import { UnitCouncilor, UnitMember } from '../../../../types';
import { WizardFormActions } from '../../components/WizardFormActions';

interface CouncilorChangeFormStepProps {
  selectedMember: UnitMember;
  councilors: UnitCouncilor[];
  members: UnitMember[];
  onPrevious: () => void;
  onSuccess: () => void;
}

export const CouncilorChangeFormStep: React.FC<CouncilorChangeFormStepProps> = ({
  selectedMember,
  councilors,
  members,
  onPrevious,
  onSuccess,
}) => {
  const { addToast } = useToast();
  const selectedCouncilor = councilors.find((c) => c.memberId === selectedMember.id);
  const [loading, setLoading] = useState(false);
  const [newMemberId, setNewMemberId] = useState(0);
  const [reason, setReason] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);

  const availableMembers = members.filter(
    (member) => !councilors.some((councilor) => councilor.memberId === member.id),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCouncilor) {
      addToast('Selected member is not a councilor', 'warning');
      return;
    }
    if (!newMemberId) {
      addToast('Please select a replacement member', 'warning');
      return;
    }
    if (!reason.trim()) {
      addToast('Please provide a reason', 'warning');
      return;
    }
    if (!proofFile) {
      addToast('Please upload proof document', 'warning');
      return;
    }

    try {
      setLoading(true);
      await api.submitCouncilorChange({
        councilorId: selectedCouncilor.id,
        newMemberId,
        reason,
        proof: proofFile,
      });
      addToast('Councilor change request submitted successfully', 'success');
      onSuccess();
    } catch {
      addToast('Failed to submit request', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedCouncilor) {
    return (
      <Card>
        <p className="text-sm text-textMuted">
          The selected member is not a current councilor. Go back and choose a different request type.
        </p>
        <div className="mt-4">
          <Button type="button" variant="outline" onClick={onPrevious}>
            Previous
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <h3 className="text-lg font-bold text-textDark mb-4">Current Councilor</h3>
        <div className="p-3 bg-gray-50 rounded border border-borderColor">
          <p className="text-sm text-textMuted">
            <strong>Current Councilor:</strong> {selectedCouncilor.memberName}
            <br />
            <strong>Contact:</strong> +91 {selectedCouncilor.memberPhone}
          </p>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-textDark mb-4">Select New Councilor</h3>
        <select
          value={newMemberId}
          onChange={(e) => setNewMemberId(Number(e.target.value))}
          className="w-full px-3 py-2 border border-borderColor rounded-md bg-white text-textDark focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          required
        >
          <option value={0}>-- Select Unit Member as New Councilor --</option>
          {availableMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name} - +91 {member.number}
            </option>
          ))}
        </select>
        {newMemberId === 0 && (
          <div className="mt-4">
            <Button type="button" variant="outline" onClick={onPrevious}>
              Previous
            </Button>
          </div>
        )}
      </Card>

      {newMemberId > 0 && (
        <Card>
          <h3 className="text-lg font-bold text-textDark mb-4">Additional Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                Reason for Change <span className="text-danger">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for councilor change..."
                className="w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                rows={3}
                required
              />
            </div>
            <FileUpload
              label="Upload Proof"
              helperText="Upload supporting document (PDF, PNG, JPG - max 5MB)"
              onFileSelect={setProofFile}
              accept=".pdf,.png,.jpg,.jpeg"
              maxSize={5}
              required
            />
          </div>
          <WizardFormActions onPrevious={onPrevious} isSubmitting={loading} />
        </Card>
      )}
    </form>
  );
};
