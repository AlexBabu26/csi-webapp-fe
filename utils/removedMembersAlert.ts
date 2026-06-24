/** Session-scoped dismiss for the admin-removed members alert (cleared on each login). */

const DISMISS_KEY_PREFIX = 'removed_members_alert_dismissed';

function dismissKey(userId?: number): string {
  return `${DISMISS_KEY_PREFIX}_${userId ?? 'unknown'}`;
}

export function isRemovedMembersAlertDismissed(userId?: number): boolean {
  try {
    return sessionStorage.getItem(dismissKey(userId)) === '1';
  } catch {
    return false;
  }
}

export function dismissRemovedMembersAlert(userId?: number): void {
  try {
    sessionStorage.setItem(dismissKey(userId), '1');
  } catch {
    // ignore
  }
}

/** Call after a successful login so the alert shows again on the next session. */
export function resetRemovedMembersAlertDismiss(userId?: number): void {
  try {
    sessionStorage.removeItem(dismissKey(userId));
  } catch {
    // ignore
  }
}
