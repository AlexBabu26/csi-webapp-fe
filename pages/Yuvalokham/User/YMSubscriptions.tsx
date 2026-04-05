import React, { useState } from 'react';
import { ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Card,
  Badge,
  Skeleton,
  Button,
  Table,
  TableRow,
  TableCell,
  EmptyState,
} from '../../../components/ui';
import { useYMSubscriptions } from '../../../hooks/queries';
import { YMSubscription } from '../../../types';

const PAGE_SIZE = 10;

const statusBadge = (status: string) => {
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

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const YMSubscriptions: React.FC = () => {
  const [page, setPage] = useState(0);
  const skip = page * PAGE_SIZE;
  const { data, isLoading, isError } = useYMSubscriptions(skip, PAGE_SIZE);

  const items: YMSubscription[] = data?.items ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-textDark font-medium">Failed to load subscriptions</p>
          <p className="text-textMuted text-sm mt-1">Please try refreshing the page.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-textDark">Subscription History</h1>
        <p className="text-textMuted mt-1">View all your past and current subscriptions.</p>
      </div>

      <Card noPadding>
        {items.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="w-7 h-7 text-textMuted" />}
            title="No subscriptions yet"
            description="You haven't subscribed to any plans. Browse plans to get started."
          />
        ) : (
          <>
            <Table headers={['Plan', 'Price', 'Duration', 'Status', 'Start Date', 'End Date']}>
              {items.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <span className="font-medium">{sub.plan_name_snapshot}</span>
                  </TableCell>
                  <TableCell>₹{parseFloat(sub.plan_price_snapshot).toLocaleString('en-IN')}</TableCell>
                  <TableCell>{sub.plan_duration_snapshot} mo</TableCell>
                  <TableCell>{statusBadge(sub.status)}</TableCell>
                  <TableCell>{fmtDate(sub.start_date)}</TableCell>
                  <TableCell>{fmtDate(sub.end_date)}</TableCell>
                </TableRow>
              ))}
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-borderColor">
                <p className="text-sm text-textMuted">
                  Showing {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-textDark font-medium px-1">
                    {page + 1} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};
