import React, { useState, useEffect } from 'react';
import { Card, Button } from '../../../components/ui';
import { Shield } from 'lucide-react';
import { UnitApplicationForm } from '../../../types';
import { useSaveUnitDetails } from '../../../hooks/queries';
import { WizardStepActions, WizardStepNavigationProps } from '../components/WizardStepActions';
import { PhoneField } from '../../../components/PhoneField';
import { getPhoneValidationError, normalizePhone } from '../../../utils/phoneNumber';

interface UnitDetailsStepProps extends WizardStepNavigationProps {
  formData: UnitApplicationForm;
  onComplete: () => void;
}

const DESIGNATIONS = ['Vicar', 'Catechist', 'Reader'];

export const UnitDetailsStep: React.FC<UnitDetailsStepProps> = ({
  formData,
  onComplete,
  onPrevious,
  showPrevious,
}) => {
  const isRenewal = formData.is_renewal;
  const officials = formData.unit_officials;
  const [presidentDesignation, setPresidentDesignation] = useState(officials?.president_designation || '');
  const [presidentName, setPresidentName] = useState(officials?.president_name || '');
  const [presidentPhone, setPresidentPhone] = useState(officials?.president_phone || '');
  const saveDetails = useSaveUnitDetails();

  useEffect(() => {
    if (officials) {
      setPresidentDesignation(officials.president_designation || '');
      setPresidentName(officials.president_name || '');
      setPresidentPhone(officials.president_phone || '');
    }
  }, [officials]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!presidentDesignation || !presidentName.trim() || !presidentPhone.trim()) return;
    if (getPhoneValidationError(presidentPhone)) return;

    await saveDetails.mutateAsync({
      president_designation: presidentDesignation,
      president_name: presidentName.trim(),
      president_phone: normalizePhone(presidentPhone.trim()) ?? presidentPhone.trim(),
    });
    onComplete();
  };

  return (
    <div className="space-y-6">
      <form id="unit-details-form" onSubmit={handleSubmit} className="space-y-4">
        <Card>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-textDark">Unit President Details</h3>
        </div>
        <p className="text-sm text-textMuted mb-6">
          {isRenewal
            ? 'Review and update the unit president information (Vicar / Catechist / Reader) for this season.'
            : 'Enter the unit president information (Vicar / Catechist / Reader).'}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">Designation <span className="text-danger">*</span></label>
            <select
              value={presidentDesignation}
              onChange={(e) => setPresidentDesignation(e.target.value)}
              className="w-full px-3 py-2 border border-borderColor rounded-md bg-white"
              required
            >
              <option value="">Select designation</option>
              {DESIGNATIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">Name <span className="text-danger">*</span></label>
            <input
              type="text"
              value={presidentName}
              onChange={(e) => setPresidentName(e.target.value)}
              className="w-full px-3 py-2 border border-borderColor rounded-md"
              required
            />
          </div>
          <PhoneField
            label={<>Phone <span className="text-danger">*</span></>}
            value={presidentPhone}
            onChange={setPresidentPhone}
            inputClassName="px-3 py-2 rounded-md"
            required
          />
        </div>
        </Card>
      </form>

      <WizardStepActions standalone onPrevious={onPrevious} showPrevious={showPrevious}>
        <Button type="submit" form="unit-details-form" isLoading={saveDetails.isPending}>
          Save & Continue
        </Button>
      </WizardStepActions>
    </div>
  );
};
