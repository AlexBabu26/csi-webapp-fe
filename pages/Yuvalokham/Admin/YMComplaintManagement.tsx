import React, { useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  XCircle,
} from 'lucide-react';
import { Card, Badge, Button, Skeleton } from '../../../components/ui';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import {
  useYMAdminComplaints,
  useYMAdminRespondComplaint,
  useYMAdminCloseComplaint,
} from '../../../hooks/queries';
import { useToast } from '../../../components/Toast';
import { YMComplaint, YMComplaintStatus, YMComplaintCategory } from '../../../types';

const PAGE_SIZE = 20;

const statusColors: Record<YMComplaintStatus, 'warning' | 'success' | 'light'> = {
  open: 'warning',
  resolved: 'success',
  closed: 'light',
};

const CATEGORIES: { value: string; label: string }[] = [
  { value: '', label: 'All Categories' },
  { value: 'delivery_issue', label: 'Delivery Issue' },
  { value: 'payment_dispute', label: 'Payment Dispute' },
  { value: 'content_issue', label: 'Content Issue' },
  { value: 'subscription_problem', label: 'Subscription Problem' },
  { value: 'other', label: 'Other' },
];

export const YMComplaintManagement: React.FC = () => {
  const { addToast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [respondId, setRespondId] = useState<number | null>(null);
  const [respondText, setRespondText] = useState('');
  const [closeId, setCloseId] = useState<number | null>(null);

  const { data, isLoading, error } = useYMAdminComplaints({
    status: statusFilter || undefined,
    category: categoryFilter || undefined,
    skip: page * PAGE_SIZE,
    limit: PAGE_SIZE,
  });

  const respondComplaint = useYMAdminRespondComplaint();
  const closeComplaint = useYMAdminCloseComplaint();

  const handleRespond = () => {
    if (respondId === null || !respondText.trim()) {
      addToast('Please enter a response', 'warning');
      return;
    }
    respondComplaint.mutate(
      { id: respondId, response: respondText },
      {
        onSuccess: () => {
          addToast('Response sent', 'success');
          setRespondId(null);
          setRespondText('');
        },
        onError: () => addToast('Failed to respond', 'error'),
      }
    );
  };

  const handleClose = () => {
    if (closeId === null) return;
    closeComplaint.mutate(closeId, {
      onSuccess: () => { addToast('Complaint closed', 'success'); setCloseId(null); },
      onError: () => addToast('Failed to close complaint', 'error'),
    });
  };

  const complaints = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const formatCategory = (cat: YMComplaintCategory) =>
    cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-textDark">Complaint Management</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2">
          {['open', 'resolved', 'closed', ''].map((s) => (
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
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}
          className="px-3 py-2 text-sm border border-borderColor rounded-md bg-white text-textDark focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
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
          Failed to load complaints.
        </div>
      ) : (
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-borderColor">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-textMuted uppercase w-8" />
                  <th className="px-4 py-3 text-left text-xs font-medium text-textMuted uppercase">User ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-textMuted uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-textMuted uppercase">Subject</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-textMuted uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-textMuted uppercase hidden md:table-cell">Created</th>
                  {statusFilter === 'open' && (
                    <th className="px-4 py-3 text-center text-xs font-medium text-textMuted uppercase">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-borderColor">
                {complaints.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-textMuted">
                      No complaints found.
                    </td>
                  </tr>
                ) : (
                  (complaints as YMComplaint[]).map((c) => (
                    <React.Fragment key={c.id}>
                      <tr
                        className="hover:bg-bgLight transition-colors cursor-pointer"
                        onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                      >
                        <td className="px-4 py-3 text-textMuted">
                          {expandedId === c.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </td>
                        <td className="px-4 py-3 text-sm text-textDark">{c.user_id}</td>
                        <td className="px-4 py-3 text-sm text-textDark">{formatCategory(c.category)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-textDark truncate max-w-[200px]">
                          {c.subject}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={statusColors[c.status]}>{c.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-textMuted hidden md:table-cell">
                          {new Date(c.created_at).toLocaleDateString('en-IN')}
                        </td>
                        {statusFilter === 'open' && (
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => { setRespondId(c.id); setRespondText(''); }}
                                className="p-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                title="Respond"
                              >
                                <MessageSquare size={16} />
                              </button>
                              <button
                                onClick={() => setCloseId(c.id)}
                                className="p-1.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                title="Close"
                              >
                                <XCircle size={16} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                      {expandedId === c.id && (
                        <tr className="bg-bgLight">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="space-y-3 text-sm">
                              <div>
                                <span className="font-medium text-textDark">Description:</span>
                                <p className="text-textMuted mt-1 whitespace-pre-wrap">{c.description}</p>
                              </div>
                              {c.admin_response && (
                                <div className="p-3 bg-white border border-borderColor rounded-md">
                                  <span className="font-medium text-textDark">Admin Response:</span>
                                  <p className="text-textMuted mt-1">{c.admin_response}</p>
                                  {c.responded_at && (
                                    <p className="text-xs text-textMuted mt-1">
                                      Responded on {new Date(c.responded_at).toLocaleDateString('en-IN')}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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

      {/* Respond dialog */}
      {respondId !== null && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur z-[100]" onClick={() => setRespondId(null)} />
      )}
      {respondId !== null && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-textDark mb-3">Respond to Complaint</h3>
            <textarea
              value={respondText}
              onChange={(e) => setRespondText(e.target.value)}
              placeholder="Type your response..."
              rows={4}
              className="w-full px-3 py-2 text-sm border border-borderColor rounded-md bg-white text-textDark placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setRespondId(null)}>Cancel</Button>
              <Button size="sm" onClick={handleRespond} isLoading={respondComplaint.isPending}>
                Send Response
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Close confirmation */}
      <ConfirmDialog
        isOpen={closeId !== null}
        onClose={() => setCloseId(null)}
        onConfirm={handleClose}
        title="Close Complaint"
        message="Are you sure you want to close this complaint? This action cannot be undone."
        confirmText="Close Complaint"
        variant="warning"
        isLoading={closeComplaint.isPending}
      />
    </div>
  );
};
