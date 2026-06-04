import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from '../../../components/ui';
import { UserPlus, Trash2, Pencil } from 'lucide-react';
import {
  UnitApplicationForm,
  UnitRegistrationMember,
  ResidenceLocation,
  RESIDENCE_LOCATION_OPTIONS,
  getResidenceLocationLabel,
} from '../../../types';
import {
  useAddUnitMember,
  useUpdateUnitMember,
  useDeleteUnitMember,
  useSubmitUnitMembers,
} from '../../../hooks/queries';
import { useSiteSettings } from '../../../hooks/queries';
import { FeeSummary } from '../components/FeeSummary';
import { RenewalChangeRequestNotice } from '../components/RenewalChangeRequestNotice';
import { WizardStepActions, WizardStepNavigationProps } from '../components/WizardStepActions';

interface MembersStepProps extends WizardStepNavigationProps {
  formData: UnitApplicationForm;
  onComplete: () => void;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const emptyMemberForm = {
  name: '',
  gender: 'M' as 'M' | 'F',
  number: '',
  dob: '',
  qualification: '',
  blood_group: '',
  residence_location: '' as ResidenceLocation | '',
};

const inputClass =
  'w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary';

export const MembersStep: React.FC<MembersStepProps> = ({
  formData,
  onComplete,
  onPrevious,
  showPrevious,
}) => {
  const isRenewal = formData.is_renewal;
  const { data: siteSettings } = useSiteSettings();
  const minDob = siteSettings?.member_min_dob ?? '1990-01-01';
  const maxDob = siteSettings?.member_max_dob ?? '2011-12-31';

  const [memberForm, setMemberForm] = useState(emptyMemberForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [addFormError, setAddFormError] = useState('');
  const [continueError, setContinueError] = useState('');
  const [savingLocationId, setSavingLocationId] = useState<number | null>(null);
  const [savingBloodGroupId, setSavingBloodGroupId] = useState<number | null>(null);

  const addMember = useAddUnitMember();
  const updateMember = useUpdateUnitMember();
  const deleteMember = useDeleteUnitMember();
  const submitMembers = useSubmitUnitMembers();

  const members = formData.unit_members;
  const missingLocationCount = members.filter((m) => !m.residence_location).length;
  const missingBloodGroupCount = members.filter((m) => !m.blood_group).length;
  const hasInlineUpdatesNeeded = missingLocationCount > 0 || missingBloodGroupCount > 0;

  const resetForm = () => {
    setMemberForm(emptyMemberForm);
    setEditingId(null);
    setAddFormError('');
  };

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name.trim() || !memberForm.dob || !memberForm.number.match(/^[6-9]\d{9}$/)) return;
    if (!memberForm.residence_location) {
      setAddFormError('Please select a living location.');
      return;
    }
    if (!memberForm.blood_group) {
      setAddFormError('Please select a blood group.');
      return;
    }

    setAddFormError('');
    const payload = {
      name: memberForm.name.trim(),
      gender: memberForm.gender,
      dob: memberForm.dob,
      number: memberForm.number,
      qualification: memberForm.qualification || undefined,
      blood_group: memberForm.blood_group,
      residence_location: memberForm.residence_location,
    };

    if (editingId) {
      await updateMember.mutateAsync({ memberId: editingId, payload });
    } else {
      await addMember.mutateAsync(payload);
    }
    resetForm();
  };

  const startEdit = (member: UnitRegistrationMember) => {
    setEditingId(member.id);
    setMemberForm({
      name: member.name,
      gender: (member.gender as 'M' | 'F') || 'M',
      number: member.number || '',
      dob: member.dob || '',
      qualification: member.qualification || '',
      blood_group: member.blood_group || '',
      residence_location: member.residence_location || '',
    });
    setAddFormError('');
  };

  const handleContinue = async () => {
    if (members.length === 0) return;
    if (members.some((member) => !member.residence_location)) {
      setContinueError('Set the living location for every member before continuing.');
      return;
    }
    if (members.some((member) => !member.blood_group)) {
      setContinueError('Set the blood group for every member before continuing.');
      return;
    }
    setContinueError('');
    await submitMembers.mutateAsync();
    onComplete();
  };

  const handleInlineLocationUpdate = async (memberId: number, value: ResidenceLocation) => {
    setSavingLocationId(memberId);
    setContinueError('');
    try {
      await updateMember.mutateAsync({
        memberId,
        payload: { residence_location: value },
      });
    } finally {
      setSavingLocationId(null);
    }
  };

  const handleInlineBloodGroupUpdate = async (memberId: number, value: string) => {
    setSavingBloodGroupId(memberId);
    setContinueError('');
    try {
      await updateMember.mutateAsync({
        memberId,
        payload: { blood_group: value },
      });
    } finally {
      setSavingBloodGroupId(null);
    }
  };

  const inlineSelectClass = (isSaving: boolean, isMissing: boolean) =>
    `w-full min-w-[88px] px-2 py-1.5 border rounded-md bg-white text-sm ${
      isSaving
        ? 'border-borderColor text-textMuted'
        : isMissing
          ? 'border-danger/40 text-danger focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
          : 'border-borderColor focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
    }`;

  return (
    <div className="space-y-4">
      {isRenewal && (
        <RenewalChangeRequestNotice
          requestPath="/unit/submit-member-info"
          requestLabel="Member Info Change request"
        />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_260px] gap-4 items-start">
        <div className="space-y-4 min-w-0">
          <Card>
            <div className="flex items-center gap-2 mb-1">
              <UserPlus className="w-5 h-5 text-primary shrink-0" />
              <h3 className="text-lg font-bold text-textDark">
                {isRenewal ? 'Add Member' : editingId ? 'Edit Member' : 'Add Member'}
              </h3>
            </div>
            <p className="text-sm text-textMuted mb-4">
              {isRenewal
                ? 'Add new members for this season. To change existing member details, use a change request.'
                : 'Add unit members for registration.'}
            </p>
            <form onSubmit={handleAddOrUpdate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-textDark mb-1.5">Full Name *</label>
                <input
                  type="text"
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-textDark mb-1.5">Gender *</label>
                <select
                  value={memberForm.gender}
                  onChange={(e) => setMemberForm({ ...memberForm, gender: e.target.value as 'M' | 'F' })}
                  className={`${inputClass} bg-white`}
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-textDark mb-1.5">Phone *</label>
                <input
                  type="tel"
                  value={memberForm.number}
                  onChange={(e) =>
                    setMemberForm({ ...memberForm, number: e.target.value.replace(/\D/g, '').slice(0, 10) })
                  }
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-textDark mb-1.5">Date of Birth *</label>
                <input
                  type="date"
                  value={memberForm.dob}
                  min={minDob}
                  max={maxDob}
                  onChange={(e) => setMemberForm({ ...memberForm, dob: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-textDark mb-1.5">Qualification / Job</label>
                <input
                  type="text"
                  value={memberForm.qualification}
                  onChange={(e) => setMemberForm({ ...memberForm, qualification: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-textDark mb-1.5">Blood Group *</label>
                <select
                  value={memberForm.blood_group}
                  onChange={(e) => setMemberForm({ ...memberForm, blood_group: e.target.value })}
                  className={`${inputClass} bg-white`}
                  required
                >
                  <option value="">Select blood group</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-textDark mb-1.5">Living Location *</label>
                <select
                  value={memberForm.residence_location}
                  onChange={(e) =>
                    setMemberForm({ ...memberForm, residence_location: e.target.value as ResidenceLocation | '' })
                  }
                  className={`${inputClass} bg-white`}
                  required
                >
                  <option value="">Select living location</option>
                  {RESIDENCE_LOCATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {addFormError && (
                <div className="sm:col-span-2 bg-danger/10 border border-danger/30 text-danger text-sm rounded-md px-3 py-2">
                  {addFormError}
                </div>
              )}
              <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap gap-2 pt-1">
                <Button type="submit" isLoading={addMember.isPending || updateMember.isPending}>
                  {editingId ? 'Update Member' : 'Add Member'}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </Card>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h3 className="text-lg font-bold text-textDark">Unit Members ({members.length})</h3>
              <div className="flex flex-wrap gap-2">
                {missingLocationCount > 0 && (
                  <span className="text-xs font-medium text-danger bg-danger/10 border border-danger/20 rounded-full px-3 py-1">
                    {missingLocationCount} missing location
                  </span>
                )}
                {missingBloodGroupCount > 0 && (
                  <span className="text-xs font-medium text-danger bg-danger/10 border border-danger/20 rounded-full px-3 py-1">
                    {missingBloodGroupCount} missing blood group
                  </span>
                )}
              </div>
            </div>
            {hasInlineUpdatesNeeded && (
              <p className="text-sm text-textMuted mb-4">
                Set living location and blood group directly in the table below. Changes save automatically.
              </p>
            )}
            {members.length === 0 ? (
              <p className="text-sm text-textMuted">
                No members added yet. Add at least one member to continue.
              </p>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-borderColor text-left text-textMuted">
                      <th className="py-2.5 pr-3 font-medium">Name</th>
                      <th className="py-2.5 pr-3 font-medium w-14">Gender</th>
                      <th className="py-2.5 pr-3 font-medium w-28">Phone</th>
                      <th className="py-2.5 pr-3 font-medium w-28">DOB</th>
                      <th className="py-2.5 pr-3 font-medium w-24">Blood Group</th>
                      <th className="py-2.5 pr-3 font-medium min-w-[160px]">Location</th>
                      <th className="py-2.5 font-medium w-28 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.id} className="border-b border-borderColor/50 last:border-0">
                        <td className="py-2.5 pr-3 font-medium max-w-[180px] truncate" title={m.name}>
                          {m.name}
                        </td>
                        <td className="py-2.5 pr-3">{m.gender}</td>
                        <td className="py-2.5 pr-3 whitespace-nowrap">{m.number}</td>
                        <td className="py-2.5 pr-3 whitespace-nowrap">{m.dob}</td>
                        <td className="py-2.5 pr-3">
                          {!m.blood_group ? (
                            <select
                              value=""
                              disabled={savingBloodGroupId === m.id || updateMember.isPending}
                              onChange={(e) => handleInlineBloodGroupUpdate(m.id, e.target.value)}
                              aria-label={`Blood group for ${m.name}`}
                              className={inlineSelectClass(savingBloodGroupId === m.id, true)}
                            >
                              <option value="">Not set</option>
                              {BLOOD_GROUPS.map((bg) => (
                                <option key={bg} value={bg}>
                                  {bg}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="whitespace-nowrap font-medium">{m.blood_group}</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-3">
                          {!m.residence_location ? (
                            <select
                              value=""
                              disabled={savingLocationId === m.id || updateMember.isPending}
                              onChange={(e) =>
                                handleInlineLocationUpdate(m.id, e.target.value as ResidenceLocation)
                              }
                              aria-label={`Living location for ${m.name}`}
                              className={`w-full min-w-[150px] px-2 py-1.5 border rounded-md bg-white text-sm ${
                                savingLocationId === m.id
                                  ? 'border-borderColor text-textMuted'
                                  : 'border-danger/40 text-danger focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
                              }`}
                            >
                              <option value="">Not set</option>
                              {RESIDENCE_LOCATION_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="whitespace-nowrap">
                              {getResidenceLocationLabel(m.residence_location)}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5">
                          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                            {isRenewal ? (
                              <Link
                                to="/unit/submit-member-info"
                                className="text-xs font-medium text-primary hover:underline"
                              >
                                Request change
                              </Link>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startEdit(m)}
                                className="p-1.5 text-primary hover:bg-primary/10 rounded"
                                aria-label={`Edit ${m.name}`}
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => deleteMember.mutate(m.id)}
                              className="p-1.5 text-danger hover:bg-danger/10 rounded"
                              aria-label={`Remove ${m.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className="xl:col-span-1">
          <FeeSummary
            memberCount={members.length}
            unitRegistrationFee={formData.unit_registration_fee}
            unitMemberFee={formData.unit_member_fee}
            membersAmount={formData.members_amount}
            totalAmount={formData.total_amount}
          />
        </div>
      </div>

      <WizardStepActions
        standalone
        onPrevious={onPrevious}
        showPrevious={showPrevious}
        leading={
          continueError ? (
            <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
              {continueError}
            </p>
          ) : undefined
        }
      >
        <Button
          onClick={handleContinue}
          disabled={members.length === 0}
          isLoading={submitMembers.isPending}
        >
          Continue to Officials
        </Button>
      </WizardStepActions>
    </div>
  );
};
