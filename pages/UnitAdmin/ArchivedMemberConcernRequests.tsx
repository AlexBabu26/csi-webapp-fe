import React, { useMemo, useState } from 'react';
import { Card, Badge, Button } from '../../components/ui';
import { DataTable, ColumnDef } from '../../components/DataTable';
import { Archive, Check, X } from 'lucide-react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ArchivedMemberConcernRequest, RequestStatus } from '../../types';
import { useArchivedMemberConcernRequests, useRequestActions } from '../../hooks/queries';

export const ArchivedMemberConcernRequests: React.FC = () => {
  const { data: requests = [], isLoading: loading } = useArchivedMemberConcernRequests();
  const { approve, reject, isProcessing } = useRequestActions('Archived Member Concern');

  const [selectedRequest, setSelectedRequest] = useState<ArchivedMemberConcernRequest | null>(null);
  const [dialogAction, setDialogAction] = useState<'approve' | 'reject' | null>(null);

  const openDialog = (request: ArchivedMemberConcernRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setDialogAction(action);
  };

  const closeDialog = () => {
    setSelectedRequest(null);
    setDialogAction(null);
  };

  const handleConfirmAction = async (remarks?: string) => {
    if (!selectedRequest || !dialogAction) return;
    const params = { requestId: selectedRequest.id, remarks };
    if (dialogAction === 'approve') {
      approve.mutate(params, { onSuccess: closeDialog });
    } else {
      reject.mutate(params, { onSuccess: closeDialog });
    }
  };

  const getStatusBadge = (status: RequestStatus) => {
    const variants = {
      PENDING: 'warning',
      APPROVED: 'success',
      REJECTED: 'danger',
    } as const;
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const columns = useMemo<ColumnDef<ArchivedMemberConcernRequest, any>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: 'Submitted',
        cell: ({ row }) => (
          <span className="text-textMuted text-sm whitespace-nowrap">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
        size: 110,
      },
      {
        accessorKey: 'unitName',
        header: 'Unit',
        cell: ({ row }) => (
          <span className="font-medium text-textDark text-sm">{row.original.unitName}</span>
        ),
      },
      {
        id: 'member',
        header: 'Archived Member',
        cell: ({ row }) => (
          <div className="text-sm">
            <span className="font-medium text-textDark block">{row.original.archivedMemberName}</span>
            {row.original.archiveYear && (
              <span className="text-textMuted">Season {row.original.archiveYear}</span>
            )}
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'concernText',
        header: 'Concern',
        cell: ({ row }) => (
          <span className="text-textMuted text-sm line-clamp-3">{row.original.concernText}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => getStatusBadge(row.original.status),
        size: 110,
      },
      {
        id: 'adminResponse',
        header: 'Admin Response',
        cell: ({ row }) => (
          <span className="text-textMuted text-sm line-clamp-2">
            {row.original.adminResponse || '—'}
          </span>
        ),
        enableSorting: false,
      },
      {
        id: 'actions',
        header: 'Action',
        cell: ({ row }) => {
          if (row.original.status !== 'PENDING') {
            return <span className="text-textMuted text-sm">—</span>;
          }
          return (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => openDialog(row.original, 'approve')}
                disabled={isProcessing}
              >
                <Check className="w-4 h-4 mr-1" />
                Resolve
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => openDialog(row.original, 'reject')}
                disabled={isProcessing}
              >
                <X className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </div>
          );
        },
        enableSorting: false,
        size: 180,
      },
    ],
    [isProcessing],
  );

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center gap-2">
        <Archive className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">
            Archive Concerns
          </h1>
          <p className="text-sm text-textMuted mt-1">
            Review concerns raised by units about recently archived members.
          </p>
        </div>
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={requests}
          isLoading={loading}
          emptyMessage="No archive concerns submitted yet."
        />
      </Card>

      <ConfirmDialog
        isOpen={!!selectedRequest && !!dialogAction}
        onClose={closeDialog}
        onConfirm={handleConfirmAction}
        title={
          dialogAction === 'approve'
            ? 'Resolve concern'
            : 'Reject concern'
        }
        message={
          dialogAction === 'approve'
            ? `Mark the concern for ${selectedRequest?.archivedMemberName} as reviewed and resolved. You may restore the member separately from Archived Members if appropriate.`
            : `Confirm the archival was correct for ${selectedRequest?.archivedMemberName} and close this concern.`
        }
        confirmText={dialogAction === 'approve' ? 'Resolve' : 'Reject'}
        variant={dialogAction === 'approve' ? 'success' : 'danger'}
        showRemarksField
        remarksLabel="Admin response (optional)"
        remarksPlaceholder="Add a note for the unit..."
        isLoading={isProcessing}
      />
    </div>
  );
};
