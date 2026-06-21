import React, { useMemo } from 'react';
import { Card, Badge, IconButton } from '../../components/ui';
import { DataTable, ColumnDef } from '../../components/DataTable';
import { FileText, Check, X, RotateCcw } from 'lucide-react';
import { ProofViewButton } from '../../components/ProofDocumentViewer';
import { useToast } from '../../components/Toast';
import { CouncilorChangeRequest, RequestStatus } from '../../types';
import { useCouncilorChangeRequests, useRequestActions } from '../../hooks/queries';
import {
  REQUEST_STATUS_FILTER,
  enumMatchFilter,
  nonSortableActionColumn,
  textIncludesFilter,
} from './adminTableUtils';

export const CouncilorChangeRequests: React.FC = () => {
  // Use TanStack Query
  const { data: requests = [], isLoading: loading } = useCouncilorChangeRequests();
  const { approve, reject, revert } = useRequestActions('Councilor Change');

  const handleApprove = async (requestId: number) => {
    approve.mutate({ requestId });
  };

  const handleReject = async (requestId: number) => {
    reject.mutate({ requestId });
  };

  const handleRevert = async (requestId: number) => {
    revert.mutate({ requestId });
  };

  const getStatusBadge = (status: RequestStatus) => {
    const variants = {
      PENDING: 'warning',
      APPROVED: 'success',
      REJECTED: 'danger',
    };
    return <Badge variant={variants[status] as any}>{status}</Badge>;
  };

  const columns = useMemo<ColumnDef<CouncilorChangeRequest, any>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: 'Created Date',
        cell: ({ row }) => (
          <span className="text-textMuted text-sm">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
        filterFn: textIncludesFilter,
        size: 120,
      },
      {
        accessorKey: 'unitName',
        header: 'Unit Name',
        cell: ({ row }) => (
          <span className="font-medium text-textDark">
            {row.original.unitName || '—'}
          </span>
        ),
        filterFn: textIncludesFilter,
      },
      {
        accessorKey: 'originalMemberName',
        header: 'Original Councilor',
        cell: ({ row }) => (
          <span className="text-textMuted text-sm">{row.original.originalMemberName}</span>
        ),
        filterFn: textIncludesFilter,
      },
      {
        accessorKey: 'newMemberName',
        header: 'New Councilor',
        cell: ({ row }) => (
          <span className="text-textDark text-sm font-medium">
            {row.original.newMemberName || 'No new member selected'}
          </span>
        ),
        filterFn: textIncludesFilter,
      },
      {
        accessorKey: 'reason',
        header: 'Reason',
        cell: ({ row }) => (
          <span className="text-textMuted text-sm line-clamp-2">{row.original.reason}</span>
        ),
        filterFn: textIncludesFilter,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => getStatusBadge(row.original.status),
        filterFn: enumMatchFilter,
        size: 100,
      },
      {
        id: 'proof',
        header: 'Proof',
        cell: ({ row }) => (
          <ProofViewButton
            proof={row.original.proof}
            title="Councilor Change Proof"
            subtitle={row.original.unitName}
          />
        ),
        ...nonSortableActionColumn,
        size: 80,
      },
      {
        id: 'actions',
        header: 'Action',
        cell: ({ row }) => {
          const status = row.original.status;
          if (status === 'APPROVED') {
            return (
              <IconButton
                icon={<RotateCcw className="w-4 h-4" />}
                tooltip="Revert"
                variant="warning"
                onClick={() => handleRevert(row.original.id)}
              />
            );
          } else if (status === 'PENDING') {
            return (
              <div className="flex items-center gap-1">
                <IconButton
                  icon={<Check className="w-4 h-4" />}
                  tooltip="Approve"
                  variant="success"
                  onClick={() => handleApprove(row.original.id)}
                />
                <IconButton
                  icon={<X className="w-4 h-4" />}
                  tooltip="Reject"
                  variant="danger"
                  onClick={() => handleReject(row.original.id)}
                />
              </div>
            );
          } else {
            return <span className="text-textMuted text-sm">{status}</span>;
          }
        },
        ...nonSortableActionColumn,
        size: 100,
      },
    ],
    []
  );

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">Unit Councilor Change Requests</h1>
          <p className="mt-1 text-sm text-textMuted">Manage councilor replacement requests</p>
        </div>
      </div>

      {/* Requests Table */}
      <Card noPadding className="overflow-hidden">
        <div className="px-6 py-4 border-b border-borderColor bg-gray-50/50">
          <h3 className="text-lg font-bold text-textDark">Councilor Change Requests</h3>
        </div>
        <div className="p-4">
          <DataTable
            data={requests}
            columns={columns}
            isLoading={loading}
            showRowSelection={false}
            showColumnFilters
            searchPlaceholder="Search by unit or councilor name..."
            pageSize={10}
            emptyMessage="No councilor change requests found"
            emptyIcon={<FileText className="w-8 h-8 text-textMuted" />}
            columnFiltersConfig={[REQUEST_STATUS_FILTER]}
          />
        </div>
      </Card>
    </div>
  );
};


