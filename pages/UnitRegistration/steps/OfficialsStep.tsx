import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Button } from '../../../components/ui';
import { Shield } from 'lucide-react';
import { SearchableSelect } from '../../../components/SearchableSelect';
import { UnitApplicationForm, UnitOfficialPayload, UnitRegistrationMember } from '../../../types';
import { useSaveUnitOfficials, useConfirmUnitOfficials } from '../../../hooks/queries';
import { RenewalChangeRequestNotice } from '../components/RenewalChangeRequestNotice';
import { WizardStepActions, WizardStepNavigationProps } from '../components/WizardStepActions';

interface OfficialsStepProps extends WizardStepNavigationProps {
  formData: UnitApplicationForm;
  onComplete: () => void;
}

const POSITIONS = [
  { key: 'president', label: 'President', position: 'President' as const, needsDesignation: true },
  { key: 'vicePresident', label: 'Vice President', position: 'Vice President' as const },
  { key: 'secretary', label: 'Secretary', position: 'Secretary' as const },
  { key: 'jointSecretary', label: 'Joint Secretary', position: 'Joint Secretary' as const },
  { key: 'treasurer', label: 'Treasurer', position: 'Treasurer' as const },
];

const DESIGNATIONS = ['Vicar', 'Catechist', 'Reader'];

const MEMBER_SELECT_POSITIONS = ['vicePresident', 'secretary', 'jointSecretary', 'treasurer'] as const;
type MemberSelectPosition = (typeof MEMBER_SELECT_POSITIONS)[number];

const findMemberIdByNameAndPhone = (
  members: UnitRegistrationMember[],
  name: string,
  phone?: string,
): string => {
  const trimmedName = name.trim();
  if (!trimmedName) return '';
  const match = members.find(
    (member) =>
      member.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
      (!phone || member.number === phone),
  );
  return match ? String(match.id) : '';
};

export const OfficialsStep: React.FC<OfficialsStepProps> = ({
  formData,
  onComplete,
  onPrevious,
  showPrevious,
}) => {
  const isRenewal = formData.is_renewal;
  const officials = formData.unit_officials;
  const members = formData.unit_members;
  const saveOfficials = useSaveUnitOfficials();
  const confirmOfficials = useConfirmUnitOfficials();

  const [selectedMemberIds, setSelectedMemberIds] = useState<Record<MemberSelectPosition, string>>({
    vicePresident: '',
    secretary: '',
    jointSecretary: '',
    treasurer: '',
  });

  const [form, setForm] = useState({
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

  useEffect(() => {
    if (officials) {
      setForm({
        presidentDesignation: officials.president_designation || '',
        presidentName: officials.president_name || '',
        presidentPhone: officials.president_phone || '',
        vicePresidentName: officials.vice_president_name || '',
        vicePresidentPhone: officials.vice_president_phone || '',
        secretaryName: officials.secretary_name || '',
        secretaryPhone: officials.secretary_phone || '',
        jointSecretaryName: officials.joint_secretary_name || '',
        jointSecretaryPhone: officials.joint_secretary_phone || '',
        treasurerName: officials.treasurer_name || '',
        treasurerPhone: officials.treasurer_phone || '',
      });
      setSelectedMemberIds({
        vicePresident: findMemberIdByNameAndPhone(
          members,
          officials.vice_president_name || '',
          officials.vice_president_phone || '',
        ),
        secretary: findMemberIdByNameAndPhone(
          members,
          officials.secretary_name || '',
          officials.secretary_phone || '',
        ),
        jointSecretary: findMemberIdByNameAndPhone(
          members,
          officials.joint_secretary_name || '',
          officials.joint_secretary_phone || '',
        ),
        treasurer: findMemberIdByNameAndPhone(
          members,
          officials.treasurer_name || '',
          officials.treasurer_phone || '',
        ),
      });
    }
  }, [officials, members]);

  const getExcludedMemberIds = useCallback(
    (positionKey: MemberSelectPosition) => {
      const excluded = new Set<string>();
      for (const key of MEMBER_SELECT_POSITIONS) {
        if (key !== positionKey && selectedMemberIds[key]) {
          excluded.add(selectedMemberIds[key]);
        }
      }
      return excluded;
    },
    [selectedMemberIds],
  );

  const memberOptionsByPosition = useMemo(() => {
    const options: Record<MemberSelectPosition, { value: string; label: string }[]> = {
      vicePresident: [],
      secretary: [],
      jointSecretary: [],
      treasurer: [],
    };

    for (const positionKey of MEMBER_SELECT_POSITIONS) {
      const excluded = getExcludedMemberIds(positionKey);
      const currentId = selectedMemberIds[positionKey];
      options[positionKey] = members
        .filter((member) => !excluded.has(String(member.id)) || String(member.id) === currentId)
        .map((member) => ({ value: String(member.id), label: member.name }));
    }

    return options;
  }, [members, selectedMemberIds, getExcludedMemberIds]);

  const handleMemberSelect = (
    positionKey: MemberSelectPosition,
    nameKey: keyof typeof form,
    phoneKey: keyof typeof form,
    memberId: string,
  ) => {
    const member = members.find((item) => String(item.id) === memberId);
    setSelectedMemberIds((prev) => ({ ...prev, [positionKey]: memberId }));
    setForm((prev) => ({
      ...prev,
      [nameKey]: member?.name || '',
      [phoneKey]: member?.number || '',
    }));
  };

  const isMemberSelectPosition = (key: string): key is MemberSelectPosition =>
    (MEMBER_SELECT_POSITIONS as readonly string[]).includes(key);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isRenewal) {
      await confirmOfficials.mutateAsync();
      onComplete();
      return;
    }

    const payloads: UnitOfficialPayload[] = [
      {
        position: 'President',
        name: form.presidentName.trim(),
        phone: form.presidentPhone.trim(),
        designation: form.presidentDesignation,
      },
      { position: 'Vice President', name: form.vicePresidentName.trim(), phone: form.vicePresidentPhone.trim() },
      { position: 'Secretary', name: form.secretaryName.trim(), phone: form.secretaryPhone.trim() },
      { position: 'Joint Secretary', name: form.jointSecretaryName.trim(), phone: form.jointSecretaryPhone.trim() },
      { position: 'Treasurer', name: form.treasurerName.trim(), phone: form.treasurerPhone.trim() },
    ];

    for (const p of payloads) {
      if (!p.name || !p.phone.match(/^[6-9]\d{9}$/)) return;
      if (p.position === 'President' && !p.designation) return;
    }

    await saveOfficials.mutateAsync(payloads);
    onComplete();
  };

  const readOnlyClass = isRenewal ? 'bg-gray-50 text-textMuted cursor-not-allowed' : '';

  return (
    <div className="space-y-6">
      <form id="officials-form" onSubmit={handleSubmit} className="space-y-6">
        {isRenewal && (
          <RenewalChangeRequestNotice
            requestPath="/unit/change-request"
            requestLabel="Officials Change request"
          />
        )}
        {POSITIONS.map((pos) => {
        const isPresident = pos.key === 'president';
        const nameKey = `${pos.key}Name` as keyof typeof form;
        const phoneKey = `${pos.key}Phone` as keyof typeof form;

        return (
          <Card key={pos.key}>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold text-textDark">{pos.label}</h3>
            </div>
            <div className={`grid grid-cols-1 ${isPresident ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
              {isPresident && (
                <div>
                  <label className="block text-sm font-medium text-textDark mb-2">Designation *</label>
                  <select
                    value={form.presidentDesignation}
                    onChange={(e) => setForm({ ...form, presidentDesignation: e.target.value })}
                    className={`w-full px-3 py-2 border border-borderColor rounded-md bg-white ${readOnlyClass}`}
                    required
                    disabled={isRenewal}
                  >
                    <option value="">Select</option>
                    {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
              <div>
                {isMemberSelectPosition(pos.key) && !isRenewal ? (
                  <SearchableSelect
                    label="Name"
                    required
                    value={selectedMemberIds[pos.key]}
                    onChange={(memberId) =>
                      handleMemberSelect(pos.key as MemberSelectPosition, nameKey, phoneKey, memberId)
                    }
                    options={memberOptionsByPosition[pos.key]}
                    placeholder="Select a unit member"
                    searchPlaceholder="Search members..."
                    emptyMessage={
                      members.length === 0
                        ? 'No unit members found. Add members in the previous step.'
                        : 'No available members. All members are already assigned to other positions.'
                    }
                    initiallyCollapsed
                  />
                ) : (
                  <>
                    <label className="block text-sm font-medium text-textDark mb-2">Name *</label>
                    <input
                      type="text"
                      value={form[nameKey]}
                      onChange={(e) => setForm({ ...form, [nameKey]: e.target.value })}
                      className={`w-full px-3 py-2 border border-borderColor rounded-md ${readOnlyClass}`}
                      required
                      readOnly={isRenewal}
                    />
                  </>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-textDark mb-2">Phone *</label>
                <input
                  type="tel"
                  value={form[phoneKey]}
                  onChange={(e) => setForm({ ...form, [phoneKey]: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  pattern="[6-9]\d{9}"
                  className={`w-full px-3 py-2 border border-borderColor rounded-md ${readOnlyClass}`}
                  required
                  readOnly={isRenewal || isMemberSelectPosition(pos.key)}
                />
              </div>
            </div>
          </Card>
        );
      })}
      </form>

      <WizardStepActions standalone onPrevious={onPrevious} showPrevious={showPrevious}>
        <Button type="submit" form="officials-form" isLoading={saveOfficials.isPending || confirmOfficials.isPending}>
          {isRenewal ? 'Confirm & Continue to Councilors' : 'Save & Continue to Councilors'}
        </Button>
      </WizardStepActions>
    </div>
  );
};
