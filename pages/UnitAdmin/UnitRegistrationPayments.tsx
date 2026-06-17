import React, { useEffect, useMemo, useState } from 'react';
import { Card, Badge, Button } from '../../components/ui';
import { DataTable, ColumnDef } from '../../components/DataTable';
import { Check, ChevronRight, ExternalLink, X } from 'lucide-react';
import { useToast } from '../../components/Toast';
import {
  useAdminRegistrationPayments,
  useApproveRegistrationPayment,
  useRejectRegistrationPayment,
  useSiteSettings,
} from '../../hooks/queries';
import { AdminRegistrationPayment } from '../../types';
import { getMediaUrl } from '../../services/http';
import {
  UnitPaymentSummary,
  buildUnitPaymentSummary,
  filterUnitSummaries,
  getUnitPaymentStatusLabel,
  groupPaymentsByUnit,
} from './unitPaymentSummary';
import { getProofPaidAmount } from '../../utils/registrationPayment';

const paymentStatusBadgeVariant = (
  status: UnitPaymentSummary['display_status'],
): 'success' | 'warning' | 'danger' | 'secondary' => {
  switch (status) {
    case 'fully_paid':
      return 'success';
    case 'partial':
      return 'warning';
    case 'pending_review':
      return 'warning';
    case 'rejected':
      return 'danger';
    default:
      return 'secondary';
  }
};

const submissionStatusBadge = (status: AdminRegistrationPayment['status']) => {
  const map: Record<AdminRegistrationPayment['status'], 'success' | 'warning' | 'danger'> = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
  };
  return <Badge variant={map[status]}>{status}</Badge>;
};

export const UnitRegistrationPayments: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<UnitPaymentSummary | null>(null);
  const [rejectDialogId, setRejectDialogId] = useState<number | null>(null);
  const [approveDialogPayment, setApproveDialogPayment] = useState<AdminRegistrationPayment | null>(null);
  const [approveDialogBalanceDue, setApproveDialogBalanceDue] = useState<number | null>(null);
  const [paidAmount, setPaidAmount] = useState('');
  const [rejectionNote, setRejectionNote] = useState('');
  const [reviewingPaymentId, setReviewingPaymentId] = useState<number | null>(null);
  const { addToast } = useToast();

  const { data: siteSettings } = useSiteSettings();
  const activeRegistrationYear =
    siteSettings?.current_registration_year ?? new Date().getFullYear();

  const { data: payments = [], isLoading } = useAdminRegistrationPayments(
    undefined,
    yearFilter ? Number(yearFilter) : undefined,
  );

  const unitSummaries = useMemo(() => {
    const grouped = groupPaymentsByUnit(payments);
    return filterUnitSummaries(grouped, statusFilter);
  }, [payments, statusFilter]);

  useEffect(() => {
    if (!selectedUnit) return;
    const updated = groupPaymentsByUnit(
      payments.filter(
        (p) =>
          p.registered_user_id === selectedUnit.registered_user_id &&
          p.registration_year === selectedUnit.registration_year,
      ),
    )[0];
    if (updated) {
      setSelectedUnit(updated);
    } else {
      setSelectedUnit(null);
    }
  }, [payments, selectedUnit?.registered_user_id, selectedUnit?.registration_year]);

  const approveMutation = useApproveRegistrationPayment();
  const rejectMutation = useRejectRegistrationPayment();

  const openApproveDialog = (payment: AdminRegistrationPayment) => {
    const balanceDue =
      selectedUnit != null && selectedUnit.remaining_amount > 0
        ? selectedUnit.remaining_amount
        : payment.total_amount;
    setApproveDialogPayment(payment);
    setApproveDialogBalanceDue(balanceDue ?? null);
    setPaidAmount(balanceDue != null ? String(balanceDue) : '');
  };

  const handleApproveSubmit = () => {
    if (!approveDialogPayment || !selectedUnit) return;
    const parsedPaid = Number(paidAmount);
    if (!Number.isInteger(parsedPaid) || parsedPaid < 0) {
      addToast('Enter a valid paid amount (0 or more)', 'warning');
      return;
    }
    if (approveDialogBalanceDue != null && parsedPaid > approveDialogBalanceDue) {
      addToast('Paid amount cannot exceed the remaining balance', 'warning');
      return;
    }
    const paymentId = approveDialogPayment.id;
    setReviewingPaymentId(paymentId);
    approveMutation.mutate(
      {
        paymentId,
        paidAmount: parsedPaid,
        balanceDueBefore: approveDialogBalanceDue,
      },
      {
        onSuccess: (data) => {
          const reviewedAt = new Date().toISOString();
          const updatedSubmissions = selectedUnit.submissions.map((submission) =>
            submission.id === paymentId
              ? {
                  ...submission,
                  status: 'APPROVED' as const,
                  balance_amount: data.balance_amount,
                  rejection_note: null,
                  reviewed_at: reviewedAt,
                }
              : submission,
          );
          setSelectedUnit(buildUnitPaymentSummary(updatedSubmissions));
          setApproveDialogPayment(null);
          setApproveDialogBalanceDue(null);
          setPaidAmount('');
        },
        onSettled: () => {
          setReviewingPaymentId(null);
        },
      },
    );
  };

  const handleRejectSubmit = () => {
    if (!rejectDialogId || !selectedUnit) return;
    if (!rejectionNote.trim()) {
      addToast('Please enter a rejection reason', 'warning');
      return;
    }
    const paymentId = rejectDialogId;
    const note = rejectionNote.trim();
    setReviewingPaymentId(paymentId);
    rejectMutation.mutate(
      { paymentId, rejectionNote: note },
      {
        onSuccess: () => {
          const reviewedAt = new Date().toISOString();
          const updatedSubmissions = selectedUnit.submissions.map((submission) =>
            submission.id === paymentId
              ? {
                  ...submission,
                  status: 'REJECTED' as const,
                  rejection_note: note,
                  reviewed_at: reviewedAt,
                }
              : submission,
          );
          setSelectedUnit(buildUnitPaymentSummary(updatedSubmissions));
          setRejectDialogId(null);
          setRejectionNote('');
        },
        onSettled: () => {
          setReviewingPaymentId(null);
        },
      },
    );
  };

  const columns = useMemo<ColumnDef<UnitPaymentSummary, any>[]>(
    () => [
      {
        accessorKey: 'unit_name',
        header: 'Unit',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="text-sm">
            <span className="font-medium text-textDark block">
              {row.original.unit_name ?? '-'}
            </span>
            <span className="text-textMuted text-xs">{row.original.username}</span>
          </div>
        ),
      },
      {
        accessorKey: 'registration_year',
        header: 'Season',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm text-textMuted">
            {row.original.registration_year
              ? `${row.original.registration_year - 1}–${row.original.registration_year}`
              : '-'}
          </span>
        ),
        size: 110,
      },
      {
        accessorKey: 'display_status',
        header: 'Payment Status',
        enableSorting: false,
        cell: ({ row }) => (
          <Badge variant={paymentStatusBadgeVariant(row.original.display_status)}>
            {getUnitPaymentStatusLabel(row.original.display_status)}
          </Badge>
        ),
        size: 140,
      },
      {
        accessorKey: 'total_amount',
        header: 'Total',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {row.original.total_amount != null ? `₹${row.original.total_amount}` : '-'}
          </span>
        ),
        size: 90,
      },
      {
        accessorKey: 'paid_amount',
        header: 'Paid',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm font-medium text-success">
            {row.original.paid_amount > 0 ? `₹${row.original.paid_amount}` : '—'}
          </span>
        ),
        size: 90,
      },
      {
        accessorKey: 'remaining_amount',
        header: 'Remaining',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.display_status === 'fully_paid' ? (
            <span className="text-xs text-success font-medium">₹0</span>
          ) : (
            <span className="text-sm font-medium text-warning">
              ₹{row.original.remaining_amount}
            </span>
          ),
        size: 100,
      },
      {
        accessorKey: 'submission_count',
        header: 'Proofs',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm text-textMuted">
            {row.original.submission_count}
            {row.original.pending_count > 0
              ? ` (${row.original.pending_count} pending)`
              : ''}
          </span>
        ),
        size: 110,
      },
      {
        accessorKey: 'last_activity_at',
        header: 'Last Activity',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-textMuted text-sm">
            {new Date(row.original.last_activity_at).toLocaleDateString()}
          </span>
        ),
        size: 110,
      },
      {
        id: 'details',
        header: '',
        enableSorting: false,
        cell: () => (
          <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
            View <ChevronRight className="w-4 h-4" />
          </span>
        ),
        size: 70,
      },
    ],
    [],
  );

  const currentYear = activeRegistrationYear;

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="text-2xl font-bold text-textDark">Unit Registration Payments</h1>
        <p className="text-sm text-textMuted mt-1">
          One row per unit per season. Click a row to review payment proofs for that registration
          year. Active season: {currentYear - 1}–{currentYear}.
        </p>
      </div>

      <Card noPadding>
        <div className="px-4 pt-4 pb-3 flex items-center gap-3 flex-wrap">
          <p className="text-sm font-semibold text-textDark flex-1">Units</p>
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
            <option value="">All statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="PARTIAL">Partial Payment</option>
            <option value="FULLY_PAID">Fully Paid</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <DataTable
          data={unitSummaries}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No unit payment records found."
          onRowClick={setSelectedUnit}
        />
      </Card>

      {selectedUnit !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedUnit(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-borderColor flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-textDark">
                  {selectedUnit.unit_name ?? selectedUnit.username}
                </h3>
                <p className="text-sm text-textMuted">{selectedUnit.username}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant={paymentStatusBadgeVariant(selectedUnit.display_status)}>
                    {getUnitPaymentStatusLabel(selectedUnit.display_status)}
                  </Badge>
                  {selectedUnit.registration_year && (
                    <span className="text-xs text-textMuted">
                      Season {selectedUnit.registration_year - 1}–{selectedUnit.registration_year}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedUnit(null)}
                className="p-1 rounded-full hover:bg-bgLight text-textMuted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-borderColor bg-bgLight/40">
              <div>
                <p className="text-xs text-textMuted">Registration total</p>
                <p className="font-semibold text-textDark">
                  {selectedUnit.total_amount != null ? `₹${selectedUnit.total_amount}` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-textMuted">Paid so far</p>
                <p className="font-semibold text-success">₹{selectedUnit.paid_amount}</p>
              </div>
              <div>
                <p className="text-xs text-textMuted">Remaining</p>
                <p className="font-semibold text-warning">₹{selectedUnit.remaining_amount}</p>
              </div>
              <div>
                <p className="text-xs text-textMuted">Payment proofs</p>
                <p className="font-semibold text-textDark">{selectedUnit.submission_count}</p>
              </div>
            </div>

            <div className="overflow-y-auto px-6 py-4 space-y-3">
              <h4 className="text-sm font-semibold text-textDark">Payment history</h4>
              {selectedUnit.submissions.map((submission, index) => {
                const proofPaid = getProofPaidAmount(submission, selectedUnit.submissions);
                return (
                  <div
                    key={submission.id}
                    className="border border-borderColor rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-textDark">
                        Proof #{index + 1}
                      </p>
                      <p className="text-xs text-textMuted">
                        Submitted: {new Date(submission.submitted_at).toLocaleString()}
                      </p>
                      {submission.reviewed_at && (
                        <p className="text-xs text-textMuted">
                          Reviewed: {new Date(submission.reviewed_at).toLocaleString()}
                        </p>
                      )}
                      {submission.rejection_note && (
                        <p className="text-xs text-danger">Note: {submission.rejection_note}</p>
                      )}
                      {submission.status === 'APPROVED' && proofPaid != null && (
                        <p className="text-xs text-textMuted">
                          Approved paid: ₹{proofPaid}
                          {submission.balance_amount != null && submission.balance_amount > 0
                            ? ` · Remaining after approval: ₹${submission.balance_amount}`
                            : ' · Fully paid'}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {submission.file_url ? (
                        <a
                          href={getMediaUrl(submission.file_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary text-xs underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View proof <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-textMuted">No proof file</span>
                      )}
                      {submissionStatusBadge(submission.status)}
                      {submission.status === 'PENDING' && (
                        <div className="flex items-center gap-2">
                          <button
                            title="Approve"
                            onClick={(e) => {
                              e.stopPropagation();
                              openApproveDialog(submission);
                            }}
                            disabled={reviewingPaymentId === submission.id || approveMutation.isPending}
                            className="p-1.5 rounded-full bg-success/10 hover:bg-success/20 text-success transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            title="Reject"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRejectDialogId(submission.id);
                              setRejectionNote('');
                            }}
                            disabled={reviewingPaymentId === submission.id || rejectMutation.isPending}
                            className="p-1.5 rounded-full bg-danger/10 hover:bg-danger/20 text-danger transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {approveDialogPayment !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold text-textDark">Approve Payment Proof</h3>
            <p className="text-sm text-textMuted">
              Enter how much was paid in this proof for{' '}
              <strong>{approveDialogPayment.unit_name ?? approveDialogPayment.username}</strong>.
              The system will calculate the remaining balance automatically.
            </p>
            {approveDialogBalanceDue != null && (
              <p className="text-sm text-textDark">
                Balance due before this proof: <strong>₹{approveDialogBalanceDue}</strong>
              </p>
            )}
            {approveDialogPayment.total_amount != null && (
              <p className="text-sm text-textMuted">
                Registration total: <strong>₹{approveDialogPayment.total_amount}</strong>
              </p>
            )}
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                Amount paid in this proof (₹)
              </label>
              <input
                type="number"
                min={0}
                max={approveDialogBalanceDue ?? approveDialogPayment.total_amount ?? undefined}
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {approveDialogBalanceDue != null && paidAmount !== '' && (
              <p className="text-sm text-textDark">
                Remaining balance:{' '}
                <strong className="text-warning">
                  ₹
                  {Math.max(0, approveDialogBalanceDue - Number(paidAmount || 0))}
                </strong>
              </p>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setApproveDialogPayment(null);
                  setApproveDialogBalanceDue(null);
                  setPaidAmount('');
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
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
