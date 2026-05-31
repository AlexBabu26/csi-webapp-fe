import React from 'react';
import { Card } from '../../../components/ui';

interface FeeSummaryProps {
  memberCount: number;
  membersAmount?: number;
  totalAmount?: number;
}

export const FeeSummary: React.FC<FeeSummaryProps> = ({
  memberCount,
  membersAmount,
  totalAmount,
}) => {
  const membersFee = membersAmount ?? memberCount * 10;
  const total = totalAmount ?? membersFee + 100;

  return (
    <Card className="bg-primary/5 border-primary/20">
      <h4 className="text-sm font-semibold text-textDark mb-3">Registration Fee</h4>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-textMuted">Unit registration fee</dt>
          <dd className="font-medium text-textDark">₹100</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-textMuted">Members ({memberCount} × ₹10)</dt>
          <dd className="font-medium text-textDark">₹{membersFee}</dd>
        </div>
        <div className="border-t border-primary/20 pt-2 flex justify-between">
          <dt className="font-semibold text-textDark">Total</dt>
          <dd className="font-bold text-primary">₹{total}</dd>
        </div>
      </dl>
    </Card>
  );
};
