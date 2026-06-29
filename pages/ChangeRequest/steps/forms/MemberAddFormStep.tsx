import React, { Suspense, useState } from 'react';
import { Card } from '../../../../components/ui';
import { FileUpload } from '../../../../components/FileUpload';
import { UserPlus } from 'lucide-react';
import { useToast } from '../../../../components/Toast';
import { api } from '../../../../services/api';
import { getCurrentUnitId } from '../../../../services/auth';
import { useSiteSettings } from '../../../../hooks/queries';
import { WizardFormActions } from '../../components/WizardFormActions';
import { lazyImport } from '../../../../utils/chunkLoadError';
import {
  buildResidencePayload,
  ResidenceFormValue,
  validateResidenceFormValue,
} from '../../../../utils/memberResidence';
import { PhoneField } from '../../../../components/PhoneField';
import {
  getPhoneCountryFromResidence,
  getPhoneValidationError,
  isInternationalResidence,
  normalizePhone,
} from '../../../../utils/phoneNumber';

const MemberResidenceFields = lazyImport(() =>
  import('../../../../components/MemberResidenceFields').then((module) => ({
    default: module.MemberResidenceFields,
  })),
);

const emptyResidence = (): ResidenceFormValue => ({
  livesInKerala: null,
  countryId: null,
  stateId: null,
  cityId: null,
});

interface MemberAddFormStepProps {
  onPrevious: () => void;
  onSuccess: () => void;
}

export const MemberAddFormStep: React.FC<MemberAddFormStepProps> = ({
  onPrevious,
  onSuccess,
}) => {
  const { addToast } = useToast();
  const currentUnitId = getCurrentUnitId();
  const { data: siteSettings } = useSiteSettings();
  const minDob = siteSettings?.member_min_dob ?? '1990-01-01';
  const maxDob = siteSettings?.member_max_dob ?? '2011-12-31';
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    gender: 'M' as 'M' | 'F',
    number: '',
    dob: '',
    qualification: '',
    bloodGroup: '',
  });
  const [reason, setReason] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [residence, setResidence] = useState<ResidenceFormValue>(emptyResidence);

  const inputClass =
    'w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUnitId) {
      addToast('Please login to submit request', 'error');
      return;
    }
    if (!formData.name.trim()) {
      addToast('Please enter member name', 'warning');
      return;
    }
    if (!formData.number.trim()) {
      addToast('Please enter a phone number', 'warning');
      return;
    }
    const phoneError = getPhoneValidationError(
      formData.number,
      getPhoneCountryFromResidence(residence),
      isInternationalResidence(residence),
    );
    if (phoneError) {
      addToast(phoneError, 'warning');
      return;
    }
    if (!formData.bloodGroup) {
      addToast('Please select a blood group', 'warning');
      return;
    }
    if (!reason.trim()) {
      addToast('Please provide a reason', 'warning');
      return;
    }
    const residenceError = validateResidenceFormValue(residence);
    if (residenceError) {
      addToast(residenceError, 'warning');
      return;
    }

    try {
      setLoading(true);
      const residencePayload = buildResidencePayload(residence);
      await api.submitMemberAdd({
        ...formData,
        number: normalizePhone(formData.number, getPhoneCountryFromResidence(residence) ?? 'IN') ?? formData.number,
        reason,
        proof: proofFile || undefined,
        ...residencePayload,
      });
      addToast('Member add request submitted successfully', 'success');
      onSuccess();
    } catch {
      addToast('Failed to submit request', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-textDark">New Member Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              Full Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              pattern="[a-zA-Z\s.]+"
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              Gender <span className="text-danger">*</span>
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'M' | 'F' })}
              className={`${inputClass} bg-white text-textDark`}
              required
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </div>
          <PhoneField
            label={<>Phone Number <span className="text-danger">*</span></>}
            value={formData.number}
            onChange={(number) => setFormData({ ...formData, number })}
            international={isInternationalResidence(residence)}
            required
          />
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              Date of Birth <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              min={minDob}
              max={maxDob}
              className={inputClass}
              required
            />
            <p className="mt-1 text-xs text-textMuted">
              DOB must be between <strong>{minDob}</strong> and <strong>{maxDob}</strong>.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              Education Qualification / Job
            </label>
            <input
              type="text"
              value={formData.qualification}
              onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              Blood Group <span className="text-danger">*</span>
            </label>
            <select
              value={formData.bloodGroup}
              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
              className={`${inputClass} bg-white text-textDark`}
              required
            >
              <option value="">-- Select Blood Group --</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <Suspense fallback={<p className="text-sm text-textMuted">Loading location fields...</p>}>
              <MemberResidenceFields value={residence} onChange={setResidence} />
            </Suspense>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-textDark mb-4">Additional Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              Reason for Adding Member <span className="text-danger">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for adding this member..."
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
          />
        </div>
        <WizardFormActions onPrevious={onPrevious} isSubmitting={loading} />
      </Card>
    </form>
  );
};
