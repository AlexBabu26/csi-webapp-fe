import React from 'react';

export interface RegistrationPaymentLedgerData {
  memberCount: number | null;
  feeOwed: number | null;
  totalPaid: number;
  balanceDue: number;
  paymentCredit: number;
}

interface RegistrationPaymentLedgerProps {
  data: RegistrationPaymentLedgerData;
  compact?: boolean;
  className?: string;
}

export const RegistrationPaymentLedger: React.FC<RegistrationPaymentLedgerProps> = ({
  data,
  compact = false,
  className = '',
}) => {
  const { memberCount, feeOwed, totalPaid, balanceDue, paymentCredit } = data;

  if (feeOwed == null) {
    return null;
  }

  const rowClass = compact
    ? 'flex justify-between text-xs gap-4'
    : 'flex justify-between text-sm gap-4';

  return (
    <div
      className={`rounded-lg border border-borderColor bg-bgLight/50 px-3 py-2.5 space-y-1.5 ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">
        Registration payment
      </p>
      {memberCount != null && (
        <div className={rowClass}>
          <span className="text-textMuted">Members in fee calculation</span>
          <span className="font-medium text-textDark">{memberCount}</span>
        </div>
      )}
      <div className={rowClass}>
        <span className="text-textMuted">Current registration fee</span>
        <span className="font-medium text-textDark">₹{feeOwed}</span>
      </div>
      {totalPaid > 0 && (
        <div className={rowClass}>
          <span className="text-textMuted">Total approved payments</span>
          <span className="font-medium text-success">₹{totalPaid}</span>
        </div>
      )}
      {paymentCredit > 0 && (
        <div className={rowClass}>
          <span className="text-textMuted">Prepaid credit</span>
          <span className="font-medium text-primary">
            ₹{paymentCredit}
            <span className="font-normal text-textMuted ml-1">(covers future member adds)</span>
          </span>
        </div>
      )}
      {balanceDue > 0 && (
        <div className={rowClass}>
          <span className="text-textMuted">Amount still due</span>
          <span className="font-semibold text-warning">₹{balanceDue}</span>
        </div>
      )}
      {balanceDue === 0 && totalPaid > 0 && paymentCredit === 0 && (
        <p className="text-xs text-success font-medium pt-0.5">Fully paid for current roster</p>
      )}
    </div>
  );
};

interface RemovalPaymentImpactProps {
  applies: boolean;
  reason?: string;
  unitLabel: string;
  membersToRemove: number;
  memberFee?: number;
  current?: {
    member_count: number;
    fee_owed: number;
    total_paid: number;
    balance_due: number;
    payment_credit: number;
  };
  projected?: {
    member_count: number;
    fee_owed: number;
    total_paid: number;
    balance_due: number;
    payment_credit: number;
  };
  feeChange?: number;
}

export const RemovalPaymentImpact: React.FC<RemovalPaymentImpactProps> = ({
  applies,
  reason,
  unitLabel,
  membersToRemove,
  memberFee,
  current,
  projected,
  feeChange,
}) => {
  if (!applies) {
    return (
      <div className="rounded-lg border border-borderColor/80 bg-bgLight/40 px-3 py-2 text-xs text-textMuted">
        <p className="font-medium text-textDark">{unitLabel}</p>
        <p className="mt-1">{reason ?? 'Payment impact does not apply.'}</p>
      </div>
    );
  }

  if (!current || !projected) {
    return null;
  }

  return (
    <div className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2.5 space-y-2 text-xs">
      <p className="font-semibold text-textDark">
        {unitLabel} — removing {membersToRemove} member{membersToRemove !== 1 ? 's' : ''}
        {memberFee != null && feeChange != null && (
          <span className="font-normal text-textMuted">
            {' '}
            (fee {feeChange <= 0 ? 'decreases' : 'increases'} by ₹{Math.abs(feeChange)})
          </span>
        )}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-textMuted font-medium mb-1">Before</p>
          <RegistrationPaymentLedger
            compact
            data={{
              memberCount: current.member_count,
              feeOwed: current.fee_owed,
              totalPaid: current.total_paid,
              balanceDue: current.balance_due,
              paymentCredit: current.payment_credit,
            }}
          />
        </div>
        <div>
          <p className="text-textMuted font-medium mb-1">After removal</p>
          <RegistrationPaymentLedger
            compact
            data={{
              memberCount: projected.member_count,
              feeOwed: projected.fee_owed,
              totalPaid: projected.total_paid,
              balanceDue: projected.balance_due,
              paymentCredit: projected.payment_credit,
            }}
          />
        </div>
      </div>
    </div>
  );
};
