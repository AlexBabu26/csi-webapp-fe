import { PaymentProofStatus } from '../types';

export interface PaymentProofRecord {
  id: number;
  total_amount: number | null;
  balance_amount: number | null;
  approved_paid_amount?: number | null;
  detected_paid_amount?: number | null;
  status: PaymentProofStatus;
  submitted_at: string;
}

/** Amount approved for a single proof, accounting for prior partial payments. */
export function getProofPaidAmount(
  payment: PaymentProofRecord,
  allSubmissions: PaymentProofRecord[],
): number | null {
  if (payment.status !== 'APPROVED') {
    return null;
  }

  if (payment.approved_paid_amount != null) {
    return payment.approved_paid_amount;
  }

  if (payment.balance_amount == null) {
    return payment.total_amount;
  }

  const sorted = [...allSubmissions].sort(
    (a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime(),
  );
  const index = sorted.findIndex((submission) => submission.id === payment.id);
  if (index < 0) {
    return null;
  }

  let priorBalance = payment.total_amount ?? 0;
  for (let i = 0; i < index; i++) {
    const previous = sorted[i];
    if (previous.status === 'APPROVED' && previous.balance_amount != null) {
      priorBalance = previous.balance_amount;
    }
  }

  return priorBalance - payment.balance_amount;
}
