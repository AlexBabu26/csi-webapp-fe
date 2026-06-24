import React, { useState } from 'react';
import { RemovedMembersSection } from './RemovedMembersSection';
import { usePendingRemovedMembers } from '../hooks/queries';
import { getAuthUser } from '../services/auth';
import {
  dismissRemovedMembersAlert,
  isRemovedMembersAlertDismissed,
} from '../utils/removedMembersAlert';

interface UnitRemovedMembersNoticeProps {
  variant?: 'banner' | 'full';
}

/**
 * Shows admin-removed member alerts for the logged-in unit user.
 * Reappears on every login; closing hides it until the next login.
 */
export const UnitRemovedMembersNotice: React.FC<UnitRemovedMembersNoticeProps> = ({
  variant = 'banner',
}) => {
  const userId = getAuthUser()?.id;
  const { data } = usePendingRemovedMembers();
  const [sessionDismissed, setSessionDismissed] = useState(() =>
    isRemovedMembersAlertDismissed(userId),
  );

  const handleClose = () => {
    dismissRemovedMembersAlert(userId);
    setSessionDismissed(true);
  };

  if (sessionDismissed || !data || data.members.length === 0) {
    return null;
  }

  return (
    <RemovedMembersSection
      data={data}
      variant={variant}
      onClose={handleClose}
    />
  );
};
