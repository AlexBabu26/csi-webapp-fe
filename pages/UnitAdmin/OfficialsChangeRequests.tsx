import React, { useMemo, useState } from 'react';
import { Card, Badge, IconButton } from '../../components/ui';
import { DataTable, ColumnDef } from '../../components/DataTable';
import { FileText, Check, X, RotateCcw } from 'lucide-react';
import { ProofViewButton } from '../../components/ProofDocumentViewer';
import { OfficialsChangeRequest, RequestStatus } from '../../types';
import { useOfficialsChangeRequests, useRequestActions } from '../../hooks/queries';

const OFFICIAL_CHANGE_LABELS: Array<{ key: keyof NonNullable<OfficialsChangeRequest['requestedChanges']>; label: string }> = [
  { key: 'presidentDesignation', label: 'President Designation' },
  { key: 'presidentName', label: 'President Name' },
  { key: 'presidentPhone', label: 'President Phone' },
  { key: 'vicePresidentName', label: 'VP Name' },
  { key: 'vicePresidentPhone', label: 'VP Phone' },
  { key: 'secretaryName', label: 'Secretary Name' },
  { key: 'secretaryPhone', label: 'Secretary Phone' },
  { key: 'jointSecretaryName', label: 'Joint Sec Name' },
  { key: 'jointSecretaryPhone', label: 'Joint Sec Phone' },
  { key: 'treasurerName', label: 'Treasurer Name' },
  { key: 'treasurerPhone', label: 'Treasurer Phone' },
];

const buildChangeList = (changes: OfficialsChangeRequest['requestedChanges']): string[] =>
  OFFICIAL_CHANGE_LABELS
    .filter(({ key }) => changes?.[key])
    .map(({ key, label }) => `${label}: ${changes![key]}`);

const RequestedChangesCell: React.FC<{ changes: OfficialsChangeRequest['requestedChanges'] }> = ({ changes }) => {
  const [expanded, setExpanded] = useState(false);
  const changeList = buildChangeList(changes);
  const hiddenCount = Math.max(changeList.length - 3, 0);
  const visibleChanges = expanded ? changeList : changeList.slice(0, 3);

  if (changeList.length === 0) {
    return <span className="text-sm text-textMuted">No changes</span>;
  }

  return (
    <div className="text-sm text-textMuted max-w-xs">
      <div className="space-y-1">
        {visibleChanges.map((change, idx) => (
          <div key={idx}>{change}</div>
        ))}
        {hiddenCount > 0 && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-xs text-primary hover:underline font-medium"
          >
            +{hiddenCount} more
          </button>
        )}
        {expanded && changeList.length > 3 && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-xs text-primary hover:underline font-medium"
          >
            Show less
          </button>
        )}
      </div>
    </div>
  );
};

export const OfficialsChangeRequests: React.FC = () => {
  // Use TanStack Query
  const { data: requests = [], isLoading: loading } = useOfficialsChangeRequests();
  const { approve, reject, revert } = useRequestActions('Officials Change');

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

  const columns = useMemo<ColumnDef<OfficialsChangeRequest, any>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: 'Created Date',
        cell: ({ row }) => (
          <span className="text-textMuted text-sm">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
        size: 120,
      },
      {
        accessorKey: 'unitName',
        header: 'Unit Name',
        cell: ({ row }) => (
          <span className="font-medium text-textDark">{row.original.unitName || '-'}</span>
        ),
      },
      {
        id: 'changes',
        header: 'Requested Changes',
        cell: ({ row }) => <RequestedChangesCell changes={row.original.requestedChanges} />,
        enableSorting: false,
      },
      {
        accessorKey: 'reason',
        header: 'Reason',
        cell: ({ row }) => (
          <span className="text-textMuted text-sm line-clamp-2">{row.original.reason}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => getStatusBadge(row.original.status),
        size: 100,
      },
      {
        id: 'proof',
        header: 'Proof',
        cell: ({ row }) => (
          <ProofViewButton
            proof={row.original.proof}
            title="Officials Change Proof"
            subtitle={row.original.unitName}
          />
        ),
        enableSorting: false,
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
        enableSorting: false,
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
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">Unit Officials Change Requests</h1>
          <p className="mt-1 text-sm text-textMuted">Manage unit officials update requests</p>
        </div>
      </div>

      {/* Requests Table */}
      <Card noPadding className="overflow-hidden">
        <div className="px-6 py-4 border-b border-borderColor bg-gray-50/50">
          <h3 className="text-lg font-bold text-textDark">Officials Change Requests</h3>
        </div>
        <div className="p-4">
          <DataTable
            data={requests}
            columns={columns}
            isLoading={loading}
            showRowSelection={false}
            searchPlaceholder="Search by unit name..."
            pageSize={10}
            emptyMessage="No officials change requests found"
            emptyIcon={<FileText className="w-8 h-8 text-textMuted" />}
          />
        </div>
      </Card>
    </div>
  );
};


