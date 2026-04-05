import React, { useState } from 'react';
import { FileText, Clock, CheckCircle, XCircle, Search } from 'lucide-react';
import { useYMAdminSubscriptions } from '../../../hooks/queries';
import { YMSubscriptionStatus } from '../../../types';

const STATUS_CONFIG: Record<YMSubscriptionStatus, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle size={12} />, label: 'Active' },
  expired: { bg: 'bg-gray-100', text: 'text-gray-600', icon: <XCircle size={12} />, label: 'Expired' },
  pending_payment: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <Clock size={12} />, label: 'Pending Payment' },
};

const STATUS_TABS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'pending_payment', label: 'Pending' },
  { value: 'expired', label: 'Expired' },
];

export const YMSubscriptionManagement: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 15;

  const { data, isLoading, error } = useYMAdminSubscriptions({
    status: statusFilter || undefined,
    skip: page * pageSize,
    limit: pageSize,
  });

  const subscriptions = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-textDark">Subscriptions</h1>
        <p className="text-sm text-textMuted mt-1">View and manage all user subscriptions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(0); }}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              statusFilter === tab.value
                ? 'bg-primary text-white'
                : 'bg-white text-textMuted border border-borderColor hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <span className="text-sm text-textMuted ml-auto">{total} total</span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-borderColor p-6">
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          Failed to load subscriptions.
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="bg-white rounded-xl border border-borderColor p-12 text-center">
          <FileText className="w-12 h-12 text-textMuted mx-auto mb-3" />
          <p className="text-textMuted">No subscriptions found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-borderColor overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-borderColor">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-textMuted uppercase">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-textMuted uppercase">User ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-textMuted uppercase">Plan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-textMuted uppercase">Price</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-textMuted uppercase">Duration</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-textMuted uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-textMuted uppercase">Start</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-textMuted uppercase">End</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => {
                  const cfg = STATUS_CONFIG[sub.status] || STATUS_CONFIG.pending_payment;
                  return (
                    <tr key={sub.id} className="border-b border-borderColor last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-textDark font-medium">#{sub.id}</td>
                      <td className="px-4 py-3 text-sm text-textMuted">#{sub.user_id}</td>
                      <td className="px-4 py-3 text-sm text-textDark">{sub.plan_name_snapshot}</td>
                      <td className="px-4 py-3 text-sm text-textDark">₹{sub.plan_price_snapshot}</td>
                      <td className="px-4 py-3 text-sm text-textMuted">{sub.plan_duration_snapshot} mo</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-textMuted">
                        {sub.start_date ? new Date(sub.start_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-textMuted">
                        {sub.end_date ? new Date(sub.end_date).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-textMuted">
            Page {page + 1} of {totalPages} ({total} records)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-sm border border-borderColor rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-sm border border-borderColor rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
