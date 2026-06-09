import React, { useEffect, useState } from 'react';
import { Card } from '../../../../components/ui';
import { FileUpload } from '../../../../components/FileUpload';
import { Shield } from 'lucide-react';
import { useToast } from '../../../../components/Toast';
import { api } from '../../../../services/api';
import { getCurrentUnitId } from '../../../../services/auth';
import { UnitRegistrationOfficial } from '../../../../types';
import { WizardFormActions } from '../../components/WizardFormActions';

interface OfficialsChangeFormStepProps {
  unitOfficials: UnitRegistrationOfficial | null;
  onPrevious: () => void;
  onSuccess: () => void;
}

export const OfficialsChangeFormStep: React.FC<OfficialsChangeFormStepProps> = ({
  unitOfficials,
  onPrevious,
  onSuccess,
}) => {
  const { addToast } = useToast();
  const currentUnitId = getCurrentUnitId();
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

  useEffect(() => {
    if (!unitOfficials) return;
    setFormData({
      presidentDesignation: unitOfficials.president_designation || '',
      presidentName: unitOfficials.president_name || '',
      presidentPhone: unitOfficials.president_phone || '',
      vicePresidentName: unitOfficials.vice_president_name || '',
      vicePresidentPhone: unitOfficials.vice_president_phone || '',
      secretaryName: unitOfficials.secretary_name || '',
      secretaryPhone: unitOfficials.secretary_phone || '',
      jointSecretaryName: unitOfficials.joint_secretary_name || '',
      jointSecretaryPhone: unitOfficials.joint_secretary_phone || '',
      treasurerName: unitOfficials.treasurer_name || '',
      treasurerPhone: unitOfficials.treasurer_phone || '',
    });
  }, [unitOfficials]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      addToast('Please provide a reason', 'warning');
      return;
    }
    if (!unitOfficials || !currentUnitId) {
      addToast('Officials data not available', 'error');
      return;
    }

    const changes: Record<string, string> = {};
    if (formData.presidentDesignation !== (unitOfficials.president_designation || '')) {
      changes.presidentDesignation = formData.presidentDesignation;
    }
    if (formData.presidentName !== (unitOfficials.president_name || '')) {
      changes.presidentName = formData.presidentName;
    }
    if (formData.presidentPhone !== (unitOfficials.president_phone || '')) {
      changes.presidentPhone = formData.presidentPhone;
    }
    if (formData.vicePresidentName !== (unitOfficials.vice_president_name || '')) {
      changes.vicePresidentName = formData.vicePresidentName;
    }
    if (formData.vicePresidentPhone !== (unitOfficials.vice_president_phone || '')) {
      changes.vicePresidentPhone = formData.vicePresidentPhone;
    }
    if (formData.secretaryName !== (unitOfficials.secretary_name || '')) {
      changes.secretaryName = formData.secretaryName;
    }
    if (formData.secretaryPhone !== (unitOfficials.secretary_phone || '')) {
      changes.secretaryPhone = formData.secretaryPhone;
    }
    if (formData.jointSecretaryName !== (unitOfficials.joint_secretary_name || '')) {
      changes.jointSecretaryName = formData.jointSecretaryName;
    }
    if (formData.jointSecretaryPhone !== (unitOfficials.joint_secretary_phone || '')) {
      changes.jointSecretaryPhone = formData.jointSecretaryPhone;
    }
    if (formData.treasurerName !== (unitOfficials.treasurer_name || '')) {
      changes.treasurerName = formData.treasurerName;
    }
    if (formData.treasurerPhone !== (unitOfficials.treasurer_phone || '')) {
      changes.treasurerPhone = formData.treasurerPhone;
    }

    if (Object.keys(changes).length === 0) {
      addToast('No changes detected', 'warning');
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
      addToast('Officials change request submitted successfully', 'success');
      onSuccess();
    } catch {
      addToast('Failed to submit request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
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
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">Name</label>
            <input
              type="text"
              value={formData.presidentName}
              onChange={(e) => setFormData({ ...formData, presidentName: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">Phone</label>
            <input
              type="tel"
              value={formData.presidentPhone}
              onChange={(e) => setFormData({ ...formData, presidentPhone: e.target.value })}
              pattern="[6-9]\d{9}"
              className={inputClass}
            />
          </div>
        </div>
      </Card>

      {[
        { title: 'Vice President Information', nameKey: 'vicePresidentName', phoneKey: 'vicePresidentPhone' },
        { title: 'Secretary Information', nameKey: 'secretaryName', phoneKey: 'secretaryPhone' },
        { title: 'Joint Secretary Information', nameKey: 'jointSecretaryName', phoneKey: 'jointSecretaryPhone' },
        { title: 'Treasurer Information', nameKey: 'treasurerName', phoneKey: 'treasurerPhone' },
      ].map((section) => (
        <Card key={section.title}>
          <h3 className="text-lg font-bold text-textDark mb-4">{section.title}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">Name</label>
              <input
                type="text"
                value={formData[section.nameKey as keyof typeof formData]}
                onChange={(e) => setFormData({ ...formData, [section.nameKey]: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">Phone</label>
              <input
                type="tel"
                value={formData[section.phoneKey as keyof typeof formData]}
                onChange={(e) => setFormData({ ...formData, [section.phoneKey]: e.target.value })}
                pattern="[6-9]\d{9}"
                className={inputClass}
              />
            </div>
          </div>
        </Card>
      ))}

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
              placeholder="Enter reason for officials change..."
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
    </form>
  );
};
