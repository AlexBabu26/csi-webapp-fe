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

interface MembersStepProps {
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

export const MembersStep: React.FC<MembersStepProps> = ({ formData, onComplete }) => {
  const isRenewal = formData.is_renewal;
  const { data: siteSettings } = useSiteSettings();
  const minDob = siteSettings?.member_min_dob ?? '1990-01-01';
  const maxDob = siteSettings?.member_max_dob ?? '2011-12-31';

  const [memberForm, setMemberForm] = useState(emptyMemberForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState('');

  const addMember = useAddUnitMember();
  const updateMember = useUpdateUnitMember();
  const deleteMember = useDeleteUnitMember();
  const submitMembers = useSubmitUnitMembers();

  const members = formData.unit_members;

  const resetForm = () => {
    setMemberForm(emptyMemberForm);
    setEditingId(null);
  };

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name.trim() || !memberForm.dob || !memberForm.number.match(/^[6-9]\d{9}$/)) return;
    if (!memberForm.residence_location) {
      setFormError('Please select a living location.');
      return;
    }
    if (!memberForm.blood_group) {
      setFormError('Please select a blood group.');
      return;
    }

    setFormError('');
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
  };

  const handleContinue = async () => {
    if (members.length === 0) return;
    if (members.some((member) => !member.residence_location)) {
      setFormError('Set the living location for every member before continuing.');
      return;
    }
    if (members.some((member) => !member.blood_group)) {
      setFormError('Set the blood group for every member before continuing.');
      return;
    }
    setFormError('');
    await submitMembers.mutateAsync();
    onComplete();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {isRenewal && (
          <RenewalChangeRequestNotice
            requestPath="/unit/submit-member-info"
            requestLabel="Member Info Change request"
          />
        )}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-textDark">
              {isRenewal ? 'Add Member' : editingId ? 'Edit Member' : 'Add Member'}
            </h3>
          </div>
          <p className="text-sm text-textMuted mb-4">
            {isRenewal
              ? 'Add new members for this season. To change existing member details, use a change request.'
              : 'Add unit members for registration.'}
          </p>
          <form onSubmit={handleAddOrUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-textDark mb-1">Full Name *</label>
              <input type="text" value={memberForm.name} onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })} className="w-full px-3 py-2 border border-borderColor rounded-md" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-textDark mb-1">Gender *</label>
              <select value={memberForm.gender} onChange={(e) => setMemberForm({ ...memberForm, gender: e.target.value as 'M' | 'F' })} className="w-full px-3 py-2 border border-borderColor rounded-md bg-white">
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-textDark mb-1">Phone *</label>
              <input type="tel" value={memberForm.number} onChange={(e) => setMemberForm({ ...memberForm, number: e.target.value.replace(/\D/g, '').slice(0, 10) })} className="w-full px-3 py-2 border border-borderColor rounded-md" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-textDark mb-1">Date of Birth *</label>
              <input type="date" value={memberForm.dob} min={minDob} max={maxDob} onChange={(e) => setMemberForm({ ...memberForm, dob: e.target.value })} className="w-full px-3 py-2 border border-borderColor rounded-md" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-textDark mb-1">Qualification / Job</label>
              <input type="text" value={memberForm.qualification} onChange={(e) => setMemberForm({ ...memberForm, qualification: e.target.value })} className="w-full px-3 py-2 border border-borderColor rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-textDark mb-1">Blood Group *</label>
              <select
                value={memberForm.blood_group}
                onChange={(e) => setMemberForm({ ...memberForm, blood_group: e.target.value })}
                className="w-full px-3 py-2 border border-borderColor rounded-md bg-white"
                required
              >
                <option value="">Select blood group</option>
                {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-textDark mb-1">Living Location *</label>
              <select
                value={memberForm.residence_location}
                onChange={(e) => setMemberForm({ ...memberForm, residence_location: e.target.value as ResidenceLocation | '' })}
                className="w-full px-3 py-2 border border-borderColor rounded-md bg-white"
                required
              >
                <option value="">Select living location</option>
                {RESIDENCE_LOCATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            {formError && (
              <div className="md:col-span-2 bg-danger/10 border border-danger/30 text-danger text-sm rounded-md p-3">
                {formError}
              </div>
            )}
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" isLoading={addMember.isPending || updateMember.isPending}>
                {editingId ? 'Update Member' : 'Add Member'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              )}
            </div>
          </form>
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-textDark mb-4">Unit Members ({members.length})</h3>
          {members.length === 0 ? (
            <p className="text-sm text-textMuted">No members added yet. Add at least one member to continue.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-borderColor text-left text-textMuted">
                    <th className="py-2 pr-2">Name</th>
                    <th className="py-2 pr-2">Gender</th>
                    <th className="py-2 pr-2">Phone</th>
                    <th className="py-2 pr-2">DOB</th>
                    <th className="py-2 pr-2">Location</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-b border-borderColor/50">
                      <td className="py-2 pr-2 font-medium">{m.name}</td>
                      <td className="py-2 pr-2">{m.gender}</td>
                      <td className="py-2 pr-2">{m.number}</td>
                      <td className="py-2 pr-2">{m.dob}</td>
                      <td className={`py-2 pr-2 ${!m.residence_location ? 'text-danger font-medium' : ''}`}>
                        {getResidenceLocationLabel(m.residence_location)}
                      </td>
                      <td className="py-2 flex gap-1">
                        {isRenewal ? (
                          <Link
                            to="/unit/submit-member-info"
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Request change
                          </Link>
                        ) : (
                          <button type="button" onClick={() => startEdit(m)} className="p-1 text-primary hover:bg-primary/10 rounded"><Pencil className="w-4 h-4" /></button>
                        )}
                        <button type="button" onClick={() => deleteMember.mutate(m.id)} className="p-1 text-danger hover:bg-danger/10 rounded"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-6 flex justify-end">
            {formError && (
              <p className="mr-auto text-sm text-danger self-center">{formError}</p>
            )}
            <Button onClick={handleContinue} disabled={members.length === 0} isLoading={submitMembers.isPending}>
              Continue to Officials
            </Button>
          </div>
        </Card>
      </div>
      <div>
        <FeeSummary
          memberCount={members.length}
          unitRegistrationFee={formData.unit_registration_fee}
          unitMemberFee={formData.unit_member_fee}
          membersAmount={formData.members_amount}
          totalAmount={formData.total_amount}
        />
      </div>
    </div>
  );
};
