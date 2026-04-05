import React from 'react';
import {
  Users,
  CreditCard,
  IndianRupee,
  Clock,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import { Card, Badge, Skeleton } from '../../../components/ui';
import {
  useYMAdminSummary,
  useYMAdminTrends,
  useYMAdminExpiring,
} from '../../../hooks/queries';
import { YMAnalyticsSummary, YMAnalyticsTrend, YMExpiringSubscription } from '../../../types';

const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
}> = ({ label, value, icon, iconBg }) => (
  <Card>
    <div className="flex items-center gap-4">
      <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-textMuted">{label}</p>
        <p className="text-2xl font-bold text-textDark">{value}</p>
      </div>
    </div>
  </Card>
);

const StatsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <Card key={i}>
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-7 w-16" />
          </div>
        </div>
      </Card>
    ))}
  </div>
);

export const YMAdminDashboard: React.FC = () => {
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useYMAdminSummary();
  const { data: trends, isLoading: trendsLoading, error: trendsError } = useYMAdminTrends(12);
  const { data: expiring, isLoading: expiringLoading, error: expiringError } = useYMAdminExpiring(30);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-textDark">Dashboard</h1>

      {/* Stat cards */}
      {summaryLoading ? (
        <StatsSkeleton />
      ) : summaryError ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          Failed to load summary data.
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="Total Users"
            value={summary.total_users}
            icon={<Users size={22} className="text-blue-600" />}
            iconBg="bg-blue-100"
          />
          <StatCard
            label="Active Subscriptions"
            value={summary.active_subscriptions}
            icon={<CreditCard size={22} className="text-emerald-600" />}
            iconBg="bg-emerald-100"
          />
          <StatCard
            label="Total Revenue"
            value={`₹${Number(summary.total_revenue).toLocaleString('en-IN')}`}
            icon={<IndianRupee size={22} className="text-amber-600" />}
            iconBg="bg-amber-100"
          />
          <StatCard
            label="Pending Payments"
            value={summary.pending_payments}
            icon={<Clock size={22} className="text-orange-600" />}
            iconBg="bg-orange-100"
          />
          <StatCard
            label="Open Complaints"
            value={summary.open_complaints}
            icon={<MessageSquare size={22} className="text-red-600" />}
            iconBg="bg-red-100"
          />
        </div>
      ) : null}

      {/* Monthly trends */}
      <Card>
        <h2 className="text-lg font-semibold text-textDark mb-4">Monthly Trends</h2>
        {trendsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : trendsError ? (
          <p className="text-sm text-red-600">Failed to load trend data.</p>
        ) : trends && trends.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-borderColor">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-textMuted uppercase">Month</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-textMuted uppercase">New Users</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-textMuted uppercase">New Subscriptions</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-textMuted uppercase">Revenue (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderColor">
                {(trends as YMAnalyticsTrend[]).map((row) => (
                  <tr key={row.month} className="hover:bg-bgLight transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-textDark">{row.month}</td>
                    <td className="px-4 py-3 text-sm text-textDark text-right">{row.new_users}</td>
                    <td className="px-4 py-3 text-sm text-textDark text-right">{row.new_subscriptions}</td>
                    <td className="px-4 py-3 text-sm text-textDark text-right">
                      ₹{Number(row.revenue).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-textMuted">No trend data available.</p>
        )}
      </Card>

      {/* Expiring subscriptions */}
      <Card>
        <h2 className="text-lg font-semibold text-textDark mb-4">Expiring Subscriptions (Next 30 Days)</h2>
        {expiringLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : expiringError ? (
          <p className="text-sm text-red-600">Failed to load expiring subscriptions.</p>
        ) : expiring && expiring.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-borderColor">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-textMuted uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-textMuted uppercase">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-textMuted uppercase">End Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-textMuted uppercase">Days Left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderColor">
                {(expiring as YMExpiringSubscription[]).map((sub) => (
                  <tr key={sub.subscription_id} className="hover:bg-bgLight transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-textDark">{sub.user_name}</p>
                      <p className="text-xs text-textMuted">{sub.user_email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-textDark">{sub.plan_name}</td>
                    <td className="px-4 py-3 text-sm text-textDark">
                      {new Date(sub.end_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={sub.days_remaining < 7 ? 'danger' : sub.days_remaining < 15 ? 'warning' : 'light'}>
                        {sub.days_remaining} day{sub.days_remaining !== 1 ? 's' : ''}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-textMuted">No subscriptions expiring soon.</p>
        )}
      </Card>
    </div>
  );
};
