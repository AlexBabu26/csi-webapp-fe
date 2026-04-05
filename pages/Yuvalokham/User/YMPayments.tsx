import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Plus, Eye, Clock, CheckCircle, XCircle, X, Download } from 'lucide-react';
import { useYMPayments } from '../../../hooks/queries';
import { API_BASE_URL } from '../../../services/http';

const resolveFileUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const serverBase = API_BASE_URL.replace(/\/api\/?$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${serverBase}${path}`;
};

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <Clock size={12} /> },
  approved: { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle size={12} /> },
  rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: <XCircle size={12} /> },
};

export const YMPayments: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const pageSize = 10;
  const { data, isLoading, error } = useYMPayments(page * pageSize, pageSize);
  const payments = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const isPdf = (url: string) => url.toLowerCase().endsWith('.pdf');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-textDark">Payment History</h1>
          <p className="text-sm text-textMuted mt-1">View all your payment submissions</p>
        </div>
        <button
          onClick={() => navigate('/yuvalokham/user/payments/new')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          New Payment
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          Failed to load payments. Please try again.
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-xl border border-borderColor p-12 text-center">
          <CreditCard className="w-12 h-12 text-textMuted mx-auto mb-3" />
          <p className="text-textMuted">No payments found</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-borderColor overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-borderColor">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-textMuted uppercase">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-textMuted uppercase">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-textMuted uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-textMuted uppercase">Remarks</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-textMuted uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-textMuted uppercase">Proof</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => {
                  const style = STATUS_STYLES[p.status] || STATUS_STYLES.pending;
                  return (
                    <tr key={p.id} className="border-b border-borderColor last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-textDark">#{p.id}</td>
                      <td className="px-4 py-3 text-sm font-medium text-textDark">₹{p.amount}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                          {style.icon}
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-textMuted max-w-[200px] truncate">
                        {p.admin_remarks || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-textMuted">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {p.proof_file_url && (
                          <button
                            onClick={() => setPreviewUrl(resolveFileUrl(p.proof_file_url))}
                            className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                          >
                            <Eye size={14} />
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-textMuted">
                Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

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
