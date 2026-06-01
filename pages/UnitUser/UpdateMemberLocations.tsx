import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, AlertCircle } from 'lucide-react';
import { Card, Button } from '../../components/ui';
import {
  ResidenceLocation,
  RESIDENCE_LOCATION_OPTIONS,
  getResidenceLocationLabel,
} from '../../types';
import { useApplicationForm, useUpdateUnitMember } from '../../hooks/queries';
import { resolvePostLoginPath } from '../../services/authRouting';
import { getAuthUser } from '../../services/auth';

export const UpdateMemberLocations: React.FC = () => {
  const navigate = useNavigate();
  const { data: formData, isLoading, refetch } = useApplicationForm();
  const updateMember = useUpdateUnitMember();
  const [drafts, setDrafts] = useState<Record<number, ResidenceLocation | ''>>({});
  const [formError, setFormError] = useState('');

  const membersNeedingLocation = useMemo(
    () => (formData?.unit_members ?? []).filter((member) => !member.residence_location),
    [formData?.unit_members],
  );

  const handleSaveMember = async (memberId: number) => {
    const residenceLocation = drafts[memberId];
    if (!residenceLocation) {
      setFormError('Please select a living location for each member.');
      return;
    }

    setFormError('');
    await updateMember.mutateAsync({
      memberId,
      payload: { residence_location: residenceLocation },
    });
    await refetch();
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[memberId];
      return next;
    });
  };

  const handleContinue = async () => {
    await refetch();
    const userType = getAuthUser()?.user_type;
    const path = await resolvePostLoginPath(userType, null, { skipLocationCheck: true });
    navigate(path, { replace: true });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-slide-in">
        <Card className="h-48 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="h-8 bg-gray-200 rounded w-1/2" />
        </Card>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="space-y-6 animate-slide-in">
        <Card className="p-8 text-center">
          <p className="text-textMuted">Unable to load member data.</p>
        </Card>
      </div>
    );
  }

  if (membersNeedingLocation.length === 0) {
    return (
      <div className="space-y-6 animate-slide-in">
        <Card className="p-8 text-center max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-textDark">All member locations are set</h1>
          <p className="mt-2 text-sm text-textMuted">No further updates are required.</p>
          <Button className="mt-6" onClick={handleContinue}>Continue</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <div className="h-10 w-10 bg-primary rounded-lg mx-auto flex items-center justify-center text-white mb-3">
            <MapPin size={22} />
          </div>
          <h1 className="text-2xl font-bold text-textDark">Update Member Living Locations</h1>
          <p className="mt-2 text-sm text-textMuted">
            Set the living location for each member. This information is required before you can continue.
          </p>
        </div>

        <Card>
          <div className="space-y-4">
            {membersNeedingLocation.map((member) => (
              <div key={member.id} className="border border-borderColor rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-medium text-textDark">{member.name}</p>
                    <p className="text-sm text-textMuted">
                      {member.number ? `+91 ${member.number}` : 'No phone'} · Current: {getResidenceLocationLabel(member.residence_location)}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <select
                      value={drafts[member.id] ?? ''}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [member.id]: e.target.value as ResidenceLocation | '' }))}
                      className="px-3 py-2 border border-borderColor rounded-md bg-white text-sm min-w-[220px]"
                    >
                      <option value="">Select living location</option>
                      {RESIDENCE_LOCATION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      onClick={() => handleSaveMember(member.id)}
                      isLoading={updateMember.isPending}
                      disabled={!drafts[member.id]}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {formError && (
            <div className="mt-4 bg-danger/10 border border-danger/30 text-danger text-sm rounded-md p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <p className="mt-4 text-xs text-textMuted">
            Update every member listed above. The Continue button will appear once all locations are saved.
          </p>
        </Card>
      </div>
    </div>
  );
};
