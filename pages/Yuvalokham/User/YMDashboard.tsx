import React from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutGrid,
  BookOpen,
  CreditCard,
  AlertTriangle,
  Crown,
  CalendarClock,
  ArrowRight,
} from 'lucide-react';
import { Card, Badge, Skeleton, Button } from '../../../components/ui';
import { useYMProfile, useYMActiveSubscription } from '../../../hooks/queries';

export const YMDashboard: React.FC = () => {
  const { data: profile, isLoading: profileLoading, isError: profileError } = useYMProfile();
  const { data: subscription, isLoading: subLoading, isError: subError } = useYMActiveSubscription();

  const isLoading = profileLoading || subLoading;

  const daysUntilExpiry = React.useMemo(() => {
    if (!subscription?.end_date) return null;
    const end = new Date(subscription.end_date);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }, [subscription?.end_date]);

  const showRenewalWarning = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    );
  }

  if (profileError || subError) {
    return (
      <Card>
        <div className="text-center py-8">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-textDark font-medium">Failed to load dashboard</p>
          <p className="text-textMuted text-sm mt-1">Please try refreshing the page.</p>
        </div>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'expired':
        return <Badge variant="light">Expired</Badge>;
      case 'pending_payment':
        return <Badge variant="warning">Pending Payment</Badge>;
      default:
        return <Badge variant="light">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-textDark">
          Welcome back, {profile?.name?.split(' ')[0] || 'User'}!
        </h1>
        <p className="text-textMuted mt-1">Here's your Yuvalokham subscription overview.</p>
      </div>

      {/* Renewal Warning */}
      {showRenewalWarning && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-amber-800">Subscription expiring soon</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Your subscription expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}. Renew now to continue reading magazines.
            </p>
          </div>
          <Link to="/yuvalokham/user/plans">
            <Button size="sm">Renew</Button>
          </Link>
        </div>
      )}

      {/* Active Subscription Card */}
      {subscription && subscription.status !== 'expired' ? (
        <Card>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Crown className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-semibold text-textDark">
                  {subscription.plan_name_snapshot}
                </h3>
                {getStatusBadge(subscription.status)}
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-textMuted mt-2">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" />
                  ₹{subscription.plan_price_snapshot}
                </span>
                {subscription.end_date && (
                  <span className="flex items-center gap-1.5">
                    <CalendarClock className="w-4 h-4" />
                    Expires {new Date(subscription.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>

              {subscription.status === 'pending_payment' && (
                <Link
                  to="/yuvalokham/user/payments/new"
                  className="inline-flex items-center gap-1 text-sm text-primary font-medium mt-3 hover:underline"
                >
                  Complete payment <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-bgLight rounded-full flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-7 h-7 text-textMuted" />
            </div>
            <h3 className="text-lg font-medium text-textDark">No active subscription</h3>
            <p className="text-textMuted text-sm mt-1 mb-4">
              Subscribe to a plan to start reading Yuvalokham magazines.
            </p>
            <Link to="/yuvalokham/user/plans">
              <Button>
                Subscribe Now <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-semibold text-textDark mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/yuvalokham/user/plans" className="group">
            <Card className="hover:border-primary transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <LayoutGrid className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-textDark">View Plans</p>
                  <p className="text-xs text-textMuted">Browse subscription plans</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/yuvalokham/user/magazines" className="group">
            <Card className="hover:border-primary transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-textDark">Browse Magazines</p>
                  <p className="text-xs text-textMuted">Read latest issues</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/yuvalokham/user/payments" className="group">
            <Card className="hover:border-primary transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-textDark">My Payments</p>
                  <p className="text-xs text-textMuted">View payment history</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};
