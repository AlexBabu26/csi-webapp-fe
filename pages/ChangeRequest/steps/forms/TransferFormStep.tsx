import React, { useState } from 'react';
import { Card } from '../../../../components/ui';
import { FileUpload } from '../../../../components/FileUpload';
import { useToast } from '../../../../components/Toast';
import { api } from '../../../../services/api';
import { UnitMember } from '../../../../types';
import { useTransferDestinations } from '../../../../hooks/queries';
import { WizardFormActions } from '../../components/WizardFormActions';

interface TransferFormStepProps {
  selectedMember: UnitMember;
  onPrevious: () => void;
  onSuccess: () => void;
}

export const TransferFormStep: React.FC<TransferFormStepProps> = ({
  selectedMember,
  onPrevious,
  onSuccess,
}) => {
  const { addToast } = useToast();
  const { data: units = [], isLoading: unitsLoading } = useTransferDestinations();
  const [loading, setLoading] = useState(false);
  const [destinationUnitId, setDestinationUnitId] = useState(0);
  const [reason, setReason] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!destinationUnitId) {
      addToast('Please select a destination unit', 'warning');
      return;
    }
    if (!reason.trim()) {
      addToast('Please provide a reason', 'warning');
      return;
    }

    try {
      setLoading(true);
      await api.submitTransferRequest({
        memberId: selectedMember.id,
        destinationUnitId,
        reason,
        proof: proofFile || undefined,
      });
      addToast('Transfer request submitted successfully', 'success');
      onSuccess();
    } catch {
      addToast('Failed to submit request', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <h3 className="text-lg font-bold text-textDark mb-4">Transfer Details</h3>
        <div className="space-y-4">
          <Card className="bg-blue-50 border-l-4 border-l-primary">
            <h4 className="text-sm font-semibold text-textDark mb-2">Selected Member Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-textMuted">Gender:</span>{' '}
                <span className="font-medium">
                  {selectedMember.gender === 'M' ? 'Male' : 'Female'}
                </span>
              </div>
              <div>
                <span className="text-textMuted">Age:</span>{' '}
                <span className="font-medium">{selectedMember.age} years</span>
              </div>
              <div>
                <span className="text-textMuted">Phone:</span>{' '}
                <span className="font-medium">+91 {selectedMember.number}</span>
              </div>
              <div>
                <span className="text-textMuted">DOB:</span>{' '}
                <span className="font-medium">
                  {new Date(selectedMember.dob).toLocaleDateString()}
                </span>
              </div>
            </div>
          </Card>

          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              Destination Unit <span className="text-danger">*</span>
            </label>
            <select
              value={destinationUnitId}
              onChange={(e) => setDestinationUnitId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-borderColor rounded-md bg-white text-textDark focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              required
            >
              <option value={0}>
                {unitsLoading ? 'Loading units...' : '-- Select Destination Unit --'}
              </option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} - {unit.clergyDistrict} ({unit.unitNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              Transfer Reason <span className="text-danger">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for transfer..."
              className="w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              rows={4}
              required
            />
          </div>

          <FileUpload
            label="Upload Proof (Optional)"
            helperText="Supported formats: PDF, PNG, JPG (max 5MB)"
            onFileSelect={setProofFile}
            accept=".pdf,.png,.jpg,.jpeg"
            maxSize={5}
          />
        </div>
        <WizardFormActions onPrevious={onPrevious} isSubmitting={loading} />
      </Card>
    </form>
  );
};
