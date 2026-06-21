import { AdminRegistrationPayment } from '../../types';

export type UnitPaymentDisplayStatus =
  | 'fully_paid'
  | 'partial'
  | 'pending_review'
  | 'rejected';

export interface UnitPaymentSummary {
  registered_user_id: number;
  username: string;
  unit_name: string | null;
  registration_year: number | null;
  total_amount: number | null;
  paid_amount: number;
  remaining_amount: number;
  display_status: UnitPaymentDisplayStatus;
  submission_count: number;
  pending_count: number;
  last_activity_at: string;
  submissions: AdminRegistrationPayment[];
}

const unitSeasonKey = (
  payment: AdminRegistrationPayment,
): string => `${payment.registered_user_id}:${payment.registration_year ?? 'unknown'}`;

const statusLabels: Record<UnitPaymentDisplayStatus, string> = {
  fully_paid: 'Fully Paid',
  partial: 'Partial Payment',
  pending_review: 'Pending Review',
  rejected: 'Rejected',
};

export const getUnitPaymentStatusLabel = (status: UnitPaymentDisplayStatus): string =>
  statusLabels[status];

export function buildUnitPaymentSummary(
  submissions: AdminRegistrationPayment[],
): UnitPaymentSummary {
  const sorted = [...submissions].sort(
    (a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime(),
  );
  const first = sorted[0];
  const approved = sorted.filter((p) => p.status === 'APPROVED');
  const pending = sorted.filter((p) => p.status === 'PENDING');
  const latestApproved = approved[approved.length - 1];
  const registrationTotal =
    [...sorted].reverse().find((p) => p.registration_total_amount != null)
      ?.registration_total_amount ?? null;
  const total_amount =
    registrationTotal ??
    latestApproved?.total_amount ??
    [...sorted].reverse().find((p) => p.total_amount != null)?.total_amount ??
    null;

  let display_status: UnitPaymentDisplayStatus;
  let remaining_amount = total_amount ?? 0;
  let paid_amount = 0;

  if (approved.length > 0) {
    const balance = latestApproved.balance_amount ?? 0;
    remaining_amount = Math.max(0, balance);
    paid_amount =
      total_amount != null ? Math.max(0, total_amount - remaining_amount) : 0;
    display_status = remaining_amount > 0 ? 'partial' : 'fully_paid';
  } else if (pending.length > 0) {
    display_status = 'pending_review';
    remaining_amount = total_amount ?? 0;
    paid_amount = 0;
  } else {
    display_status = 'rejected';
    remaining_amount = total_amount ?? 0;
    paid_amount = 0;
  }

  if (display_status === 'partial' && pending.length > 0) {
    // Keep partial as primary row status; pending proofs are visible in the modal.
  }

  const last_activity_at = sorted[sorted.length - 1]?.submitted_at ?? first.submitted_at;

  return {
    registered_user_id: first.registered_user_id,
    username: first.username,
    unit_name: first.unit_name,
    registration_year:
      latestApproved?.registration_year ??
      [...sorted].reverse().find((p) => p.registration_year != null)?.registration_year ??
      first.registration_year,
    total_amount,
    paid_amount,
    remaining_amount,
    display_status,
    submission_count: sorted.length,
    pending_count: pending.length,
    last_activity_at,
    submissions: sorted,
  };
}

export function groupPaymentsByUnit(
  payments: AdminRegistrationPayment[],
): UnitPaymentSummary[] {
  const grouped = new Map<string, AdminRegistrationPayment[]>();
  for (const payment of payments) {
    const key = unitSeasonKey(payment);
    const existing = grouped.get(key) ?? [];
    existing.push(payment);
    grouped.set(key, existing);
  }

  return Array.from(grouped.values())
    .map(buildUnitPaymentSummary)
    .sort((a, b) => {
      const yearA = a.registration_year ?? 0;
      const yearB = b.registration_year ?? 0;
      if (yearA !== yearB) return yearB - yearA;
      const nameA = (a.unit_name ?? a.username).toLowerCase();
      const nameB = (b.unit_name ?? b.username).toLowerCase();
      return nameA.localeCompare(nameB);
    });
}

export function filterUnitSummaries(
  summaries: UnitPaymentSummary[],
  statusFilter: string,
): UnitPaymentSummary[] {
  if (!statusFilter) return summaries;

  switch (statusFilter) {
    case 'FULLY_PAID':
      return summaries.filter((s) => s.display_status === 'fully_paid');
    case 'PARTIAL':
      return summaries.filter((s) => s.display_status === 'partial');
    case 'PENDING':
      return summaries.filter((s) => s.display_status === 'pending_review');
    case 'REJECTED':
      return summaries.filter((s) => s.display_status === 'rejected');
    default:
      return summaries;
  }
}
