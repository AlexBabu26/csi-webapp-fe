import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../../components/ui';
import { FileUpload } from '../../components/FileUpload';
import { ArrowLeft, Send } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';
import { UnitCouncilor, UnitMember } from '../../types';

export const SubmitCouncilorChange: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  const [councilors, setCouncilors] = useState<UnitCouncilor[]>([]);
  const [members, setMembers] = useState<UnitMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCouncilorId, setSelectedCouncilorId] = useState<number>(0);
  const [newMemberId, setNewMemberId] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);

  // Mock current unit ID
  const currentUnitId = 1;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [councilorsRes, membersRes] = await Promise.all([
          api.getUnitCouncilors(currentUnitId),
          api.getUnitMembers(currentUnitId)
        ]);
        setCouncilors(councilorsRes.data);
        setMembers(membersRes.data);
      } catch (err) {
        addToast("Failed to load data", "error");
      }
    };
    loadData();
  }, [addToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCouncilorId) {
      addToast("Please select a councilor", "warning");
      return;
    }
    
    if (!newMemberId) {
      addToast("Please select a replacement member", "warning");
      return;
    }
    
    if (!reason.trim()) {
      addToast("Please provide a reason", "warning");
      return;
    }

    try {
      setLoading(true);
      await api.submitCouncilorChange({
        councilorId: selectedCouncilorId,
        newMemberId,
        reason,
        proof: proofFile || undefined,
      });
      addToast("Councilor change request submitted successfully", "success");
      navigate('/unit/my-requests');
    } catch (err) {
      addToast("Failed to submit request", "error");
    } finally {
      setLoading(false);
    }
  };

  const selectedCouncilor = councilors.find(c => c.id === selectedCouncilorId);
  const availableMembers = members.filter(m => 
    !councilors.some(c => c.memberId === m.id)
  );

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/unit/my-requests')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-textDark">Submit Councilor Change Request</h1>
          <p className="mt-1 text-sm text-textMuted">Request to replace a unit councilor</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Current Councilor */}
          <Card>
            <h3 className="text-lg font-bold text-textDark mb-4">Select Current Councilor</h3>
            <select
              value={selectedCouncilorId}
              onChange={(e) => setSelectedCouncilorId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-borderColor rounded-md bg-white text-textDark focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              required
            >
              <option value={0}>-- Select Current Councilor --</option>
              {councilors.map(councilor => (
                <option key={councilor.id} value={councilor.id}>
                  {councilor.memberName} - +91 {councilor.memberPhone}
                </option>
              ))}
            </select>

            {selectedCouncilor && (
              <div className="mt-4 p-3 bg-gray-50 rounded border border-borderColor">
                <p className="text-sm text-textMuted">
                  <strong>Current Councilor:</strong> {selectedCouncilor.memberName}
                  <br />
                  <strong>Contact:</strong> +91 {selectedCouncilor.memberPhone}
                </p>
              </div>
            )}
          </Card>

          {/* New Councilor Selection */}
          {selectedCouncilorId > 0 && (
            <Card>
              <h3 className="text-lg font-bold text-textDark mb-4">Select New Councilor</h3>
              <select
                value={newMemberId}
                onChange={(e) => setNewMemberId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-borderColor rounded-md bg-white text-textDark focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              >
                <option value={0}>-- Select Unit Member as New Councilor --</option>
                {availableMembers.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name} - +91 {member.number}
                  </option>
                ))}
              </select>
            </Card>
          )}

          {/* Reason & Proof */}
          {selectedCouncilorId > 0 && newMemberId > 0 && (
            <Card>
              <h3 className="text-lg font-bold text-textDark mb-4">Additional Information</h3>
              
              <div className="space-y-4">
                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-textDark mb-2">
                    Reason for Change <span className="text-danger">*</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason for councilor change (e.g., resignation, relocation)..."
                    className="w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    rows={3}
                    required
                  />
                </div>

                {/* Proof */}
                <FileUpload
                  label="Upload Proof"
                  helperText="Upload supporting document (PDF, PNG, JPG - max 5MB)"
                  onFileSelect={setProofFile}
                  accept=".pdf,.png,.jpg,.jpeg"
                  maxSize={5}
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-borderColor">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/unit/my-requests')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </form>
    </div>
  );
};


