import React, { Suspense, useMemo, useState } from 'react';
import { lazyImport } from '../../utils/chunkLoadError';
import { useNavigate } from 'react-router-dom';
import { MapPin, AlertCircle } from 'lucide-react';
import { Card, Button } from '../../components/ui';
const MemberResidenceFields = lazyImport(() =>
  import('../../components/MemberResidenceFields').then((module) => ({
    default: module.MemberResidenceFields,
  })),
);
import { useApplicationForm, useUpdateUnitMember } from '../../hooks/queries';
import { resolvePostLoginPath } from '../../services/authRouting';
import { getAuthUser } from '../../services/auth';
import {
  ResidenceFormValue,
  buildResidencePayload,
  getMemberResidenceLabel,
  isResidenceComplete,
  parseResidenceFormValue,
  validateResidenceFormValue,
} from '../../utils/memberResidence';

export const UpdateMemberLocations: React.FC = () => {
  const navigate = useNavigate();
  const { data: formData, isLoading, refetch } = useApplicationForm();
  const updateMember = useUpdateUnitMember();
  const [drafts, setDrafts] = useState<Record<number, ResidenceFormValue>>({});
  const [formError, setFormError] = useState('');

  const membersNeedingLocation = useMemo(
    () => (formData?.unit_members ?? []).filter((member) => !isResidenceComplete(member)),
    [formData?.unit_members],
  );

  const getDraft = (memberId: number) =>
    drafts[memberId] ?? { livesInKerala: null, countryId: null, stateId: null, cityId: null };

  const handleSaveMember = async (memberId: number) => {
    const draft = getDraft(memberId);
    const validationError = validateResidenceFormValue(draft);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError('');
    await updateMember.mutateAsync({
      memberId,
      payload: buildResidencePayload(draft),
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
            Tell us whether each member lives in Kerala. If not, select their current country and city.
          </p>
        </div>

        <Card>
          <div className="space-y-6">
            {membersNeedingLocation.map((member) => (
              <div key={member.id} className="border border-borderColor rounded-lg p-4">
                <div className="mb-4">
                  <p className="font-medium text-textDark">{member.name}</p>
                  <p className="text-sm text-textMuted">
                    {member.number ? `+91 ${member.number}` : 'No phone'} · Current: {getMemberResidenceLabel(member)}
                  </p>
                </div>

                <Suspense fallback={<p className="text-sm text-textMuted">Loading location fields...</p>}>
                  <MemberResidenceFields
                    value={drafts[member.id] ?? parseResidenceFormValue(member)}
                    onChange={(nextValue) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [member.id]: nextValue,
                      }))
                    }
                  />
                </Suspense>

                <div className="mt-4 flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => handleSaveMember(member.id)}
                    isLoading={updateMember.isPending}
                  >
                    Save
                  </Button>
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
