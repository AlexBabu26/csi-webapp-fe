import React from 'react';
import { X } from 'lucide-react';
import { PendingRemovedMembersResponse, RemovedUnitMember } from '../types';

interface RemovedMembersSectionProps {
  data: PendingRemovedMembersResponse;
  variant?: 'banner' | 'full';
  onClose: () => void;
}

const MemberLine: React.FC<{ member: RemovedUnitMember }> = ({ member }) => (
  <li className="text-sm text-textDark leading-snug">
    <span className="font-medium">{member.name.trim()}</span>
    {member.delete_reason && (
      <span className="text-textMuted"> — {member.delete_reason}</span>
    )}
  </li>
);

export const RemovedMembersSection: React.FC<RemovedMembersSectionProps> = ({
  data,
  variant = 'banner',
  onClose,
}) => {
  const count = data.summary.total;
  const isBanner = variant === 'banner';

  if (data.members.length === 0) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`relative rounded-lg border border-red-200 border-l-4 border-l-red-500 bg-red-50/50 px-4 py-3 pr-10 ${
        isBanner ? 'mb-4' : ''
      }`}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-2.5 right-2.5 p-1 rounded-md text-textMuted hover:text-textDark hover:bg-red-100/60 transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>

      <p className="text-sm font-semibold text-textDark">
        {count === 1 ? 'Member removed by admin' : `${count} members removed by admin`}
      </p>

      <ul
        className={`mt-2 space-y-1.5 list-none ${
          isBanner && count > 3 ? 'max-h-36 overflow-y-auto' : ''
        }`}
      >
        {data.members.map((member) => (
          <MemberLine key={member.id} member={member} />
        ))}
      </ul>
    </div>
  );
};
