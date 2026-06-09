import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, MessageSquareWarning } from 'lucide-react';
import { Card, Button, Badge } from './ui';
import { ConfirmDialog } from './ConfirmDialog';
import { useToast } from './Toast';
import {
  RecentArchivedMembersResponse,
  RecentArchivedMember,
  ArchivedMemberConcernStatus,
  RequestStatus,
  WizardReturnState,
} from '../types';
import { useSubmitArchivedMemberConcern } from '../hooks/queries';

const WIZARD_RETURN: WizardReturnState = {
  returnTo: '/register/wizard',
  returnLabel: 'Back to Registration',
  wizardStep: 3,
};

const StatCard: React.FC<{ label: string; value: number; color?: string }> = ({
  label,
  value,
  color = 'text-textDark',
}) => (
  <div className="rounded-lg border border-borderColor bg-white px-3 py-2.5">
    <p className={`text-xl font-bold ${color}`}>{value}</p>
    <p className="text-xs font-medium uppercase tracking-wide text-textMuted">{label}</p>
  </div>
);

const formatGender = (gender?: string) => {
  if (!gender) return '—';
  const value = gender.toUpperCase();
  if (value === 'M' || value === 'MALE') return 'Male';
  if (value === 'F' || value === 'FEMALE') return 'Female';
  return gender;
};

const concernBadge = (status: RequestStatus) => {
  const variants = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
  } as const;
  const labels = {
    PENDING: 'Concern pending',
    APPROVED: 'Concern resolved',
    REJECTED: 'Concern rejected',
  };
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
};

interface ArchivedMembersSectionProps {
  data: RecentArchivedMembersResponse;
  variant?: 'preview' | 'full';
  showRaiseConcern?: boolean;
  detailsLinkState?: WizardReturnState;
}

export const ArchivedMembersSection: React.FC<ArchivedMembersSectionProps> = ({
  data,
  variant = 'full',
  showRaiseConcern = true,
  detailsLinkState,
}) => {
  const { addToast } = useToast();
  const submitConcern = useSubmitArchivedMemberConcern();
  const [selectedMember, setSelectedMember] = useState<RecentArchivedMember | null>(null);

  const concernMap = data.member_concerns ?? {};
  const pendingIds = useMemo(
    () => new Set(data.pending_concern_member_ids ?? []),
    [data.pending_concern_member_ids],
  );

  const getConcernStatus = (memberId: number): ArchivedMemberConcernStatus | undefined =>
    concernMap[String(memberId)];

  const openConcernDialog = (member: RecentArchivedMember) => {
    setSelectedMember(member);
  };

  const closeConcernDialog = () => setSelectedMember(null);

  const handleSubmitConcern = async (remarks?: string) => {
    if (!selectedMember) return;
    const concernText = (remarks || '').trim();
    if (concernText.length < 20) {
      addToast('Please describe your concern in at least 20 characters.', 'error');
      return;
    }
    await submitConcern.mutateAsync({
      archivedUnitMemberId: selectedMember.id,
      concernText,
    });
    closeConcernDialog();
  };

  const renderConcernCell = (member: RecentArchivedMember) => {
    const concern = getConcernStatus(member.id);
    if (concern) {
      return (
        <div className="flex flex-col items-end gap-1">
          {concernBadge(concern.status)}
          {concern.admin_response && variant === 'full' && (
            <span className="text-xs text-textMuted line-clamp-2 max-w-[200px] text-right">
              {concern.admin_response}
            </span>
          )}
        </div>
      );
    }
    if (!showRaiseConcern) {
      return <span className="text-xs text-textMuted">—</span>;
    }
    if (pendingIds.has(member.id)) {
      return concernBadge('PENDING');
    }
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => openConcernDialog(member)}>
        <MessageSquareWarning className="w-4 h-4 mr-1" />
        Raise concern
      </Button>
    );
  };

  if (data.members.length === 0) {
    return null;
  }

  const isPreview = variant === 'preview';

  return (
    <>
      <Card className={isPreview ? 'border-l-4 border-l-amber-500 bg-amber-50/40' : undefined}>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 min-w-0">
            <Archive className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-textDark">
                {isPreview ? 'Recently Archived Members' : 'Archived Member List'}
              </h3>
              <p className="text-sm text-textMuted mt-0.5">
                {data.summary.total} member{data.summary.total === 1 ? '' : 's'} archived
                {data.archive_year ? ` for season ${data.archive_year}` : ''}.
                {' '}
                {data.summary.male} male, {data.summary.female} female.
              </p>
              {data.archive_reason && (
                <p className="text-sm text-textDark mt-2">
                  <span className="font-medium">Reason:</span> {data.archive_reason}
                </p>
              )}
            </div>
          </div>
          {isPreview && (
            <Link
              to="/unit/archived-members"
              state={detailsLinkState ?? WIZARD_RETURN}
              className="shrink-0"
            >
              <Button type="button" variant="outline" size="sm">
                View full details
              </Button>
            </Link>
          )}
        </div>

        {!isPreview && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <StatCard label="Total Archived" value={data.summary.total} />
            <StatCard label="Male" value={data.summary.male} color="text-blue-700" />
            <StatCard label="Female" value={data.summary.female} color="text-pink-700" />
          </div>
        )}

        <div className={`overflow-x-auto -mx-6 px-6 ${isPreview ? 'max-h-56 overflow-y-auto' : ''}`}>
          <table className="w-full min-w-[640px] text-sm">
            <thead className={isPreview ? 'sticky top-0 bg-white z-10' : undefined}>
              <tr className="border-b border-borderColor text-left text-textMuted">
                <th className="py-2 pr-3 font-medium">Name</th>
                <th className="py-2 pr-3 font-medium w-20">Gender</th>
                {!isPreview && <th className="py-2 pr-3 font-medium w-28">DOB</th>}
                {!isPreview && <th className="py-2 pr-3 font-medium w-28">Phone</th>}
                <th className="py-2 pr-3 font-medium w-24">Archived</th>
                <th className="py-2 font-medium w-36 text-right">Concern</th>
              </tr>
            </thead>
            <tbody>
              {data.members.map((member) => (
                <tr key={member.id} className="border-b border-borderColor/50 last:border-0">
                  <td className="py-2 pr-3 font-medium max-w-[180px] truncate" title={member.name}>
                    {member.name}
                  </td>
                  <td className="py-2 pr-3">{formatGender(member.gender)}</td>
                  {!isPreview && <td className="py-2 pr-3 whitespace-nowrap">{member.dob}</td>}
                  {!isPreview && <td className="py-2 pr-3 whitespace-nowrap">{member.number}</td>}
                  <td className="py-2 pr-3 whitespace-nowrap text-textMuted text-xs">
                    {new Date(member.archived_at).toLocaleDateString()}
                  </td>
                  <td className="py-2 text-right">{renderConcernCell(member)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isPreview && (
          <p className="text-xs text-textMuted mt-3">
            Open full details to review all fields, raise concerns, and check admin responses.
            You can return here to continue registration afterward.
          </p>
        )}
      </Card>

      {showRaiseConcern && (
        <ConfirmDialog
          isOpen={!!selectedMember}
          onClose={closeConcernDialog}
          onConfirm={handleSubmitConcern}
          title={`Raise concern — ${selectedMember?.name ?? ''}`}
          message="Describe why you believe this member should not have been archived. Admin will review and respond."
          confirmText="Submit concern"
          isLoading={submitConcern.isPending}
          showRemarksField
          remarksLabel="Your concern"
          remarksPlaceholder="Explain the issue (minimum 20 characters)..."
        />
      )}
    </>
  );
};
