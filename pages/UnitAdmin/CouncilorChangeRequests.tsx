import React, { useEffect, useState, useMemo } from 'react';
import { Card, Badge, IconButton } from '../../components/ui';
import { DataTable, ColumnDef } from '../../components/DataTable';
import { FileText, ExternalLink, Check, X, RotateCcw } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';
import { CouncilorChangeRequest, RequestStatus } from '../../types';

export const CouncilorChangeRequests: React.FC = () => {
  const { addToast } = useToast();
  
  const [requests, setRequests] = useState<CouncilorChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await api.getCouncilorChangeRequests();
      setRequests(response.data);
    } catch (err) {
      console.error("Failed to load councilor change requests", err);
      addToast("Failed to load requests", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    try {
      await api.approveRequest(requestId, 'Councilor Change');
      addToast("Councilor change request approved", "success");
      loadRequests();
    } catch (err) {
      addToast("Failed to approve request", "error");
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      await api.rejectRequest(requestId, 'Councilor Change');
      addToast("Councilor change request rejected", "success");
      loadRequests();
    } catch (err) {
      addToast("Failed to reject request", "error");
    }
  };

  const handleRevert = async (requestId: number) => {
    try {
      await api.revertRequest(requestId, 'Councilor Change');
      addToast("Councilor change request reverted", "success");
      loadRequests();
    } catch (err) {
      addToast("Failed to revert request", "error");
    }
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
        size: 120,
      },
      {
        accessorKey: 'unitName',
        header: 'Unit Name',
        cell: ({ row }) => (
          <span className="font-medium text-textDark">{row.original.unitName}</span>
        ),
      },
      {
        id: 'originalCouncilor',
        header: 'Original Councilor',
        cell: ({ row }) => (
          <span className="text-textMuted text-sm">{row.original.originalMemberName}</span>
        ),
      },
      {
        id: 'newCouncilor',
        header: 'New Councilor',
        cell: ({ row }) => (
          <span className="text-textDark text-sm font-medium">
            {row.original.newMemberName || 'No new member selected'}
          </span>
        ),
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
            searchPlaceholder="Search by unit or councilor name..."
            pageSize={10}
            emptyMessage="No councilor change requests found"
            emptyIcon={<FileText className="w-8 h-8 text-textMuted" />}
          />
        </div>
      </Card>
    </div>
  );
};


