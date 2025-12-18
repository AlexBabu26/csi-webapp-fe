import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../../components/ui';
import { FileUpload } from '../../components/FileUpload';
import { ArrowLeft, Send, Shield } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';
import { UnitOfficial } from '../../types';

export const SubmitOfficialsChange: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  const [currentOfficial, setCurrentOfficial] = useState<UnitOfficial | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    presidentDesignation: '',
    presidentName: '',
    presidentPhone: '',
    vicePresidentName: '',
    vicePresidentPhone: '',
    secretaryName: '',
    secretaryPhone: '',
    jointSecretaryName: '',
    jointSecretaryPhone: '',
    treasurerName: '',
    treasurerPhone: '',
  });
  const [reason, setReason] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);

  // Mock current unit ID
  const currentUnitId = 1;

  useEffect(() => {
    const loadOfficial = async () => {
      try {
        const response = await api.getUnitOfficials(currentUnitId);
        if (response.data.length > 0) {
          const official = response.data[0];
          setCurrentOfficial(official);
          setFormData({
            presidentDesignation: official.presidentDesignation || '',
            presidentName: official.presidentName,
            presidentPhone: official.presidentPhone,
            vicePresidentName: official.vicePresidentName,
            vicePresidentPhone: official.vicePresidentPhone,
            secretaryName: official.secretaryName,
            secretaryPhone: official.secretaryPhone,
            jointSecretaryName: official.jointSecretaryName,
            jointSecretaryPhone: official.jointSecretaryPhone,
            treasurerName: official.treasurerName,
            treasurerPhone: official.treasurerPhone,
          });
        }
      } catch (err) {
        addToast("Failed to load officials data", "error");
      }
    };
    loadOfficial();
  }, [addToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      addToast("Please provide a reason", "warning");
      return;
    }

    // Check for changes
    if (currentOfficial) {
      const changes: any = {};
      if (formData.presidentDesignation !== (currentOfficial.presidentDesignation || '')) 
        changes.presidentDesignation = formData.presidentDesignation;
      if (formData.presidentName !== currentOfficial.presidentName) 
        changes.presidentName = formData.presidentName;
      if (formData.presidentPhone !== currentOfficial.presidentPhone) 
        changes.presidentPhone = formData.presidentPhone;
      if (formData.vicePresidentName !== currentOfficial.vicePresidentName) 
        changes.vicePresidentName = formData.vicePresidentName;
      if (formData.vicePresidentPhone !== currentOfficial.vicePresidentPhone) 
        changes.vicePresidentPhone = formData.vicePresidentPhone;
      if (formData.secretaryName !== currentOfficial.secretaryName) 
        changes.secretaryName = formData.secretaryName;
      if (formData.secretaryPhone !== currentOfficial.secretaryPhone) 
        changes.secretaryPhone = formData.secretaryPhone;
      if (formData.jointSecretaryName !== currentOfficial.jointSecretaryName) 
        changes.jointSecretaryName = formData.jointSecretaryName;
      if (formData.jointSecretaryPhone !== currentOfficial.jointSecretaryPhone) 
        changes.jointSecretaryPhone = formData.jointSecretaryPhone;
      if (formData.treasurerName !== currentOfficial.treasurerName) 
        changes.treasurerName = formData.treasurerName;
      if (formData.treasurerPhone !== currentOfficial.treasurerPhone) 
        changes.treasurerPhone = formData.treasurerPhone;

      if (Object.keys(changes).length === 0) {
        addToast("No changes detected", "warning");
        return;
      }

      try {
        setLoading(true);
        await api.submitOfficialsChange({
          unitId: currentUnitId,
          changes,
          reason,
          proof: proofFile || undefined,
        });
        addToast("Officials change request submitted successfully", "success");
        navigate('/unit/my-requests');
      } catch (err) {
        addToast("Failed to submit request", "error");
      } finally {
        setLoading(false);
      }
    }
  };

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
          <h1 className="text-2xl font-bold text-textDark">Submit Officials Change Request</h1>
          <p className="mt-1 text-sm text-textMuted">Request to update unit officials information</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* President */}
        <Card className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-textDark">President Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">Designation</label>
              <input
                type="text"
                value={formData.presidentDesignation}
                onChange={(e) => setFormData({ ...formData, presidentDesignation: e.target.value })}
                placeholder="e.g., Rev., Rev. Fr."
                className="w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">Name</label>
              <input
                type="text"
                value={formData.presidentName}
                onChange={(e) => setFormData({ ...formData, presidentName: e.target.value })}
                className="w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">Phone</label>
              <input
                type="tel"
                value={formData.presidentPhone}
                onChange={(e) => setFormData({ ...formData, presidentPhone: e.target.value })}
                pattern="[6-9]\d{9}"
                className="w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </Card>

        {/* Vice President */}
        <Card className="mb-6">
          <h3 className="text-lg font-bold text-textDark mb-4">Vice President Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">Name</label>
              <input
                type="text"
                value={formData.vicePresidentName}
                onChange={(e) => setFormData({ ...formData, vicePresidentName: e.target.value })}
                className="w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">Phone</label>
              <input
                type="tel"
                value={formData.vicePresidentPhone}
                onChange={(e) => setFormData({ ...formData, vicePresidentPhone: e.target.value })}
                pattern="[6-9]\d{9}"
                className="w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </Card>

        {/* Secretary */}
        <Card className="mb-6">
          <h3 className="text-lg font-bold text-textDark mb-4">Secretary Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">Name</label>
              <input
                type="text"
                value={formData.secretaryName}
                onChange={(e) => setFormData({ ...formData, secretaryName: e.target.value })}
                className="w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">Phone</label>
              <input
                type="tel"
                value={formData.secretaryPhone}
                onChange={(e) => setFormData({ ...formData, secretaryPhone: e.target.value })}
                pattern="[6-9]\d{9}"
                className="w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </Card>

        {/* Joint Secretary */}
        <Card className="mb-6">
          <h3 className="text-lg font-bold text-textDark mb-4">Joint Secretary Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">Name</label>
              <input
                type="text"
                value={formData.jointSecretaryName}
                onChange={(e) => setFormData({ ...formData, jointSecretaryName: e.target.value })}
                className="w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">Phone</label>
              <input
                type="tel"
                value={formData.jointSecretaryPhone}
                onChange={(e) => setFormData({ ...formData, jointSecretaryPhone: e.target.value })}
                pattern="[6-9]\d{9}"
                className="w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </Card>

        {/* Treasurer */}
        <Card className="mb-6">
          <h3 className="text-lg font-bold text-textDark mb-4">Treasurer Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">Name</label>
              <input
                type="text"
                value={formData.treasurerName}
                onChange={(e) => setFormData({ ...formData, treasurerName: e.target.value })}
                className="w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">Phone</label>
              <input
                type="tel"
                value={formData.treasurerPhone}
                onChange={(e) => setFormData({ ...formData, treasurerPhone: e.target.value })}
                pattern="[6-9]\d{9}"
                className="w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </Card>

        {/* Reason & Proof */}
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
                placeholder="Enter reason for officials change..."
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
      </form>
    </div>
  );
};


