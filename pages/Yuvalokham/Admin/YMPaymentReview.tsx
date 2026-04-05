import React, { useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
  X,
  Check,
  X as XIcon,
} from 'lucide-react';
import { Card, Badge, Button, Skeleton } from '../../../components/ui';
import { API_BASE_URL } from '../../../services/http';

const resolveFileUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const serverBase = API_BASE_URL.replace(/\/api\/?$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${serverBase}${path}`;
};
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import {
  useYMAdminPayments,
  useYMAdminApprovePayment,
  useYMAdminRejectPayment,
} from '../../../hooks/queries';
import { useToast } from '../../../components/Toast';
import { YMPayment, YMPaymentStatus } from '../../../types';

const PAGE_SIZE = 20;

const statusColors: Record<YMPaymentStatus, 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

export const YMPaymentReview: React.FC = () => {
  const { addToast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [page, setPage] = useState(0);

  const [approveId, setApproveId] = useState<number | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isPdf = (url: string) => url.toLowerCase().endsWith('.pdf');

  const { data, isLoading, error } = useYMAdminPayments({
    status: statusFilter || undefined,
    skip: page * PAGE_SIZE,
    limit: PAGE_SIZE,
  });

  const approvePayment = useYMAdminApprovePayment();
  const rejectPayment = useYMAdminRejectPayment();

  const handleApprove = () => {
    if (approveId === null) return;
    approvePayment.mutate(approveId, {
      onSuccess: () => { addToast('Payment approved', 'success'); setApproveId(null); },
      onError: () => addToast('Failed to approve payment', 'error'),
    });
  };

  const handleReject = (remarks?: string) => {
    if (rejectId === null) return;
    rejectPayment.mutate(
      { id: rejectId, remarks: remarks || 'Rejected by admin' },
      {
        onSuccess: () => { addToast('Payment rejected', 'success'); setRejectId(null); },
        onError: () => addToast('Failed to reject payment', 'error'),
      }
    );
  };

  const payments = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-textDark">Payment Review</h1>

      {/* Status filter */}
      <div className="flex gap-2">
        {['pending', 'approved', 'rejected', ''].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(0); }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              statusFilter === s
                ? 'bg-primary text-white'
                : 'bg-white border border-borderColor text-textMuted hover:bg-bgLight'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <Card>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </Card>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          Failed to load payments.
        </div>
      ) : (
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-borderColor">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-textMuted uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-textMuted uppercase">User ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-textMuted uppercase">Subscription</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-textMuted uppercase">Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-textMuted uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-textMuted uppercase">Proof</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-textMuted uppercase hidden md:table-cell">Created</th>
                  {statusFilter === 'pending' && (
                    <th className="px-4 py-3 text-center text-xs font-medium text-textMuted uppercase">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-borderColor">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-textMuted">
                      No payments found.
                    </td>
                  </tr>
                ) : (
                  (payments as YMPayment[]).map((p) => (
                    <tr key={p.id} className="hover:bg-bgLight transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-textMuted">#{p.id}</td>
                      <td className="px-4 py-3 text-sm text-textDark">{p.user_id}</td>
                      <td className="px-4 py-3 text-sm text-textDark">{p.subscription_id}</td>
                      <td className="px-4 py-3 text-sm text-textDark text-right font-medium">
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={statusColors[p.status]}>{p.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.proof_file_url ? (
                          <button
                            onClick={() => setPreviewUrl(resolveFileUrl(p.proof_file_url))}
                            className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
                          >
                            <Eye size={13} /> View
                          </button>
                        ) : (
                          <span className="text-xs text-textMuted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-textMuted hidden md:table-cell">
                        {new Date(p.created_at).toLocaleDateString('en-IN')}
                      </td>
                      {statusFilter === 'pending' && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setApproveId(p.id)}
                              className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                              title="Approve"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => setRejectId(p.id)}
                              className="p-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                              title="Reject"
                            >
                              <XIcon size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-borderColor">
              <p className="text-sm text-textMuted">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 0}>
                  <ChevronLeft size={16} />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page + 1 >= totalPages}>
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Approve confirmation */}
      <ConfirmDialog
        isOpen={approveId !== null}
        onClose={() => setApproveId(null)}
        onConfirm={handleApprove}
        title="Approve Payment"
        message="Are you sure you want to approve this payment? This will activate the user's subscription."
        confirmText="Approve"
        variant="success"
        isLoading={approvePayment.isPending}
      />

      {/* Reject with remarks */}
      <ConfirmDialog
        isOpen={rejectId !== null}
        onClose={() => setRejectId(null)}
        onConfirm={handleReject}
        title="Reject Payment"
        message="Please provide a reason for rejecting this payment."
        confirmText="Reject"
        variant="danger"
        showRemarksField
        remarksLabel="Rejection Remarks"
        remarksPlaceholder="Enter reason for rejection..."
        isLoading={rejectPayment.isPending}
      />

      {/* Image Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-borderColor bg-gray-50">
              <h3 className="text-sm font-semibold text-textDark">Payment Proof</h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-md hover:bg-gray-200 text-textMuted transition-colors"
                  title="Open in new tab"
                >
                  <Download size={16} />
                </a>
                <button
                  onClick={() => setPreviewUrl(null)}
                  className="p-1.5 rounded-md hover:bg-gray-200 text-textMuted transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="p-4 flex items-center justify-center overflow-auto max-h-[calc(85vh-52px)] bg-gray-100">
              {isPdf(previewUrl) ? (
                <iframe src={previewUrl} className="w-full h-[70vh] border-0 rounded" title="Payment proof" />
              ) : (
                <img
                  src={previewUrl}
                  alt="Payment proof"
                  className="max-w-full max-h-[70vh] object-contain rounded shadow-sm"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
