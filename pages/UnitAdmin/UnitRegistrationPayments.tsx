import React, { useMemo, useState } from 'react';
import { Card, Badge, Button } from '../../components/ui';
import { DataTable, ColumnDef } from '../../components/DataTable';
import { Check, X, ExternalLink } from 'lucide-react';
import { useToast } from '../../components/Toast';
import {
  useAdminRegistrationPayments,
  useApproveRegistrationPayment,
  useRejectRegistrationPayment,
  useSiteSettings,
} from '../../hooks/queries';
import { AdminRegistrationPayment } from '../../types';
import { getMediaUrl } from '../../services/http';

export const UnitRegistrationPayments: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('');
  const [rejectDialogId, setRejectDialogId] = useState<number | null>(null);
  const [approveDialogPayment, setApproveDialogPayment] = useState<AdminRegistrationPayment | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [rejectionNote, setRejectionNote] = useState('');
  const { addToast } = useToast();

  const { data: siteSettings } = useSiteSettings();
  const activeRegistrationYear =
    siteSettings?.current_registration_year ?? new Date().getFullYear();

  const { data: payments = [], isLoading } = useAdminRegistrationPayments(
    statusFilter || undefined,
    yearFilter ? Number(yearFilter) : undefined,
  );

  const sortedPayments = useMemo(() => {
    return [...payments].sort((a, b) => {
      const unitA = (a.unit_name ?? a.username ?? '').toLowerCase();
      const unitB = (b.unit_name ?? b.username ?? '').toLowerCase();
      const unitCompare = unitA.localeCompare(unitB);
      if (unitCompare !== 0) return unitCompare;
      return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
    });
  }, [payments]);

  const approveMutation = useApproveRegistrationPayment();
  const rejectMutation = useRejectRegistrationPayment();

  const openApproveDialog = (payment: AdminRegistrationPayment) => {
    setApproveDialogPayment(payment);
    setBalanceAmount('0');
  };

  const handleApproveSubmit = () => {
    if (!approveDialogPayment) return;
    const parsedBalance = Number(balanceAmount);
    if (!Number.isInteger(parsedBalance) || parsedBalance < 0) {
      addToast('Enter a valid balance amount (0 or more)', 'warning');
      return;
    }
    if (
      approveDialogPayment.total_amount != null &&
      parsedBalance > approveDialogPayment.total_amount
    ) {
      addToast('Balance cannot exceed the registration total', 'warning');
      return;
    }
    approveMutation.mutate(
      { paymentId: approveDialogPayment.id, balanceAmount: parsedBalance },
      {
        onSuccess: () => {
          setApproveDialogPayment(null);
          setBalanceAmount('');
        },
      },
    );
  };

  const handleRejectSubmit = () => {
    if (!rejectDialogId) return;
    if (!rejectionNote.trim()) {
      addToast('Please enter a rejection reason', 'warning');
      return;
    }
    rejectMutation.mutate(
      { paymentId: rejectDialogId, rejectionNote },
      {
        onSuccess: () => {
          setRejectDialogId(null);
          setRejectionNote('');
        },
      }
    );
  };

  const statusBadge = (s: string) => {
    const map: Record<string, any> = {
      PENDING: 'warning',
      APPROVED: 'success',
      REJECTED: 'danger',
    };
    return <Badge variant={map[s] ?? 'secondary'}>{s}</Badge>;
  };

  const columns = useMemo<ColumnDef<AdminRegistrationPayment, any>[]>(
    () => [
      {
        accessorKey: 'submitted_at',
        header: 'Date',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-textMuted text-sm">
            {new Date(row.original.submitted_at).toLocaleDateString()}
          </span>
        ),
        size: 100,
      },
      {
        accessorKey: 'unit_name',
        header: 'Unit',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="text-sm">
            <span className="font-medium text-textDark block">{row.original.unit_name ?? '-'}</span>
            <span className="text-textMuted text-xs">{row.original.username}</span>
          </div>
        ),
      },
      {
        accessorKey: 'registration_year',
        header: 'Year',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm text-textMuted">
            {row.original.registration_year
              ? `${row.original.registration_year - 1}–${row.original.registration_year}`
              : '-'}
          </span>
        ),
        size: 100,
      },
      {
        accessorKey: 'total_amount',
        header: 'Amount',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {row.original.total_amount != null ? `₹${row.original.total_amount}` : '-'}
          </span>
        ),
        size: 90,
      },
      {
        id: 'proof',
        header: 'Proof',
        cell: ({ row }) =>
          row.original.file_url ? (
            <a
              href={getMediaUrl(row.original.file_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary text-xs underline"
            >
              View <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span className="text-xs text-textMuted">—</span>
          ),
        size: 70,
        enableSorting: false,
      },
      {
        id: 'balance',
        header: 'Balance',
        cell: ({ row }) => {
          const payment = row.original;
          if (payment.status !== 'APPROVED') {
            return <span className="text-xs text-textMuted">—</span>;
          }
          if (payment.balance_amount == null || payment.balance_amount === 0) {
            return <span className="text-xs text-success font-medium">Fully paid</span>;
          }
          return (
            <span className="text-sm font-medium text-warning">₹{payment.balance_amount}</span>
          );
        },
        size: 90,
        enableSorting: false,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        enableSorting: false,
        cell: ({ row }) => statusBadge(row.original.status),
        size: 90,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const p = row.original;
          if (p.status !== 'PENDING') {
            return (
              <span className="text-xs text-textMuted">
                {p.rejection_note
                  ? `Note: ${p.rejection_note}`
                  : p.status === 'APPROVED' && p.balance_amount
                    ? `Balance: ₹${p.balance_amount}`
                    : '—'}
              </span>
            );
          }
          return (
            <div className="flex items-center gap-2">
              <button
                title="Approve"
                onClick={() => openApproveDialog(p)}
                disabled={approveMutation.isPending}
                className="p-1.5 rounded-full bg-success/10 hover:bg-success/20 text-success transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                title="Reject"
                onClick={() => {
                  setRejectDialogId(p.id);
                  setRejectionNote('');
                }}
                disabled={rejectMutation.isPending}
                className="p-1.5 rounded-full bg-danger/10 hover:bg-danger/20 text-danger transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        },
        size: 90,
        enableSorting: false,
      },
    ],
    [approveMutation.isPending, rejectMutation.isPending]
  );

  const currentYear = activeRegistrationYear;

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="text-2xl font-bold text-textDark">Unit Registration Payments</h1>
        <p className="text-sm text-textMuted mt-1">
          Review and approve payment proofs submitted by units as part of yearly registration.
          Active season: {currentYear - 1}–{currentYear}.
        </p>
      </div>

      <Card noPadding>
        <div className="px-4 pt-4 pb-3 flex items-center gap-3 flex-wrap">
          <p className="text-sm font-semibold text-textDark flex-1">Submissions</p>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-3 py-1.5 border border-borderColor rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All years</option>
            <option value={String(currentYear - 1)}>
              {currentYear - 2}–{currentYear - 1}
            </option>
            <option value={String(currentYear)}>
              {currentYear - 1}–{currentYear}
            </option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-borderColor rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <DataTable
          data={sortedPayments}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No payment submissions found."
        />
      </Card>

      {approveDialogPayment !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold text-textDark">Approve Payment Proof</h3>
            <p className="text-sm text-textMuted">
              Specify the remaining balance for{' '}
              <strong>{approveDialogPayment.unit_name ?? approveDialogPayment.username}</strong>.
              Enter <strong>0</strong> if this payment covers the full registration fee.
            </p>
            {approveDialogPayment.total_amount != null && (
              <p className="text-sm text-textDark">
                Registration total: <strong>₹{approveDialogPayment.total_amount}</strong>
              </p>
            )}
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                Balance amount remaining (₹)
              </label>
              <input
                type="number"
                min={0}
                max={approveDialogPayment.total_amount ?? undefined}
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                className="w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setApproveDialogPayment(null);
                  setBalanceAmount('');
                }}
                disabled={approveMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                isLoading={approveMutation.isPending}
                onClick={handleApproveSubmit}
              >
                Approve
              </Button>
            </div>
          </div>
        </div>
      )}

      {rejectDialogId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold text-textDark">Reject Payment Proof</h3>
            <p className="text-sm text-textMuted">
              Provide a clear rejection reason so the unit knows what to fix.
            </p>
            <textarea
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="e.g. Screenshot is unclear, amount doesn't match..."
              rows={3}
              className="w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setRejectDialogId(null)}
                disabled={rejectMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                isLoading={rejectMutation.isPending}
                onClick={handleRejectSubmit}
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
