import React, { useEffect, useState, useMemo } from 'react';
import { Card, Badge, Button, IconButton } from '../../components/ui';
import { DataTable, ColumnDef } from '../../components/DataTable';
import { FileText, ExternalLink, Check, X, RotateCcw } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { api } from '../../services/api';
import { TransferRequest, RequestStatus } from '../../types';

export const UnitTransferRequests: React.FC = () => {
  const { addToast } = useToast();
  
  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<TransferRequest | null>(null);
  const [dialogAction, setDialogAction] = useState<'approve' | 'reject' | 'revert' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await api.getTransferRequests();
      setRequests(response.data);
    } catch (err) {
      console.error("Failed to load transfer requests", err);
      addToast("Failed to load requests", "error");
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (request: TransferRequest, action: 'approve' | 'reject' | 'revert') => {
    setSelectedRequest(request);
    setDialogAction(action);
  };

  const closeDialog = () => {
    setSelectedRequest(null);
    setDialogAction(null);
  };

  const handleConfirmAction = async (remarks?: string) => {
    if (!selectedRequest || !dialogAction) return;
    
    try {
      setIsProcessing(true);
      
      if (dialogAction === 'approve') {
        await api.approveRequest(selectedRequest.id, 'Transfer', remarks);
        addToast("Transfer request approved", "success");
      } else if (dialogAction === 'reject') {
        await api.rejectRequest(selectedRequest.id, 'Transfer', remarks);
        addToast("Transfer request rejected", "success");
      } else if (dialogAction === 'revert') {
        await api.revertRequest(selectedRequest.id, 'Transfer', remarks);
        addToast("Transfer request reverted", "success");
      }
      
      closeDialog();
      loadRequests();
    } catch (err) {
      addToast(`Failed to ${dialogAction} request`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const getDialogConfig = () => {
    if (!selectedRequest || !dialogAction) return null;
    
    const configs = {
      approve: {
        title: 'Approve Transfer Request',
        message: `Are you sure you want to approve the transfer request for ${selectedRequest.memberName}?`,
        confirmText: 'Approve',
        variant: 'success' as const,
      },
      reject: {
        title: 'Reject Transfer Request',
        message: `Are you sure you want to reject the transfer request for ${selectedRequest.memberName}?`,
        confirmText: 'Reject',
        variant: 'danger' as const,
        showRemarksField: true,
        remarksLabel: 'Rejection Reason',
      },
      revert: {
        title: 'Revert Transfer Request',
        message: `Are you sure you want to revert this approved transfer request for ${selectedRequest.memberName}?`,
        confirmText: 'Revert',
        variant: 'warning' as const,
        showRemarksField: true,
        remarksLabel: 'Revert Reason',
      },
    };
    
    return configs[dialogAction];
  };

  const getStatusBadge = (status: RequestStatus) => {
    const variants = {
      PENDING: 'warning',
      APPROVED: 'success',
      REJECTED: 'danger',
    };
    return <Badge variant={variants[status] as any}>{status}</Badge>;
  };

  const columns = useMemo<ColumnDef<TransferRequest, any>[]>(
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
        accessorKey: 'memberName',
        header: 'Member Name',
        cell: ({ row }) => (
          <span className="font-medium text-textDark">{row.original.memberName}</span>
        ),
      },
      {
        id: 'transfer',
        header: 'Transfer Info',
        cell: ({ row }) => (
          <div className="text-sm">
            <span className="text-textMuted">From: </span>
            <span className="font-medium text-textDark">{row.original.currentUnitName}</span>
            <br />
            <span className="text-textMuted">To: </span>
            <span className="font-medium text-textDark">{row.original.destinationUnitName}</span>
          </div>
        ),
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
          row.original.proof ? (
            <a
              href={row.original.proof}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm inline-flex items-center gap-1"
            >
              View <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span className="text-textMuted text-sm">No proof</span>
          )
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
                onClick={() => openDialog(row.original, 'revert')}
              />
            );
          } else if (status === 'PENDING') {
            return (
              <div className="flex items-center gap-1">
                <IconButton
                  icon={<Check className="w-4 h-4" />}
                  tooltip="Approve"
                  variant="success"
                  onClick={() => openDialog(row.original, 'approve')}
                />
                <IconButton
                  icon={<X className="w-4 h-4" />}
                  tooltip="Reject"
                  variant="danger"
                  onClick={() => openDialog(row.original, 'reject')}
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
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">Unit Transfer Requests</h1>
          <p className="mt-1 text-sm text-textMuted">Manage member transfer requests between units</p>
        </div>
      </div>

      {/* Requests Table */}
      <Card noPadding className="overflow-hidden">
        <div className="px-6 py-4 border-b border-borderColor bg-gray-50/50">
          <h3 className="text-lg font-bold text-textDark">Transfer Requests</h3>
        </div>
        <div className="p-4">
          <DataTable
            data={requests}
            columns={columns}
            isLoading={loading}
            showRowSelection={false}
            searchPlaceholder="Search by member name or unit..."
            pageSize={10}
            emptyMessage="No transfer requests found"
            emptyIcon={<FileText className="w-8 h-8 text-textMuted" />}
          />
        </div>
      </Card>

      {/* Confirmation Dialog */}
      {selectedRequest && dialogAction && getDialogConfig() && (
        <ConfirmDialog
          isOpen={true}
          onClose={closeDialog}
          onConfirm={handleConfirmAction}
          {...getDialogConfig()!}
          isLoading={isProcessing}
        />
      )}
    </div>
  );
};

