import React, { useEffect, useState, useMemo } from 'react';
import { Card, Badge, IconButton } from '../../components/ui';
import { DataTable, ColumnDef } from '../../components/DataTable';
import { FileText, ExternalLink, Check, X, RotateCcw } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';
import { OfficialsChangeRequest, RequestStatus } from '../../types';

export const OfficialsChangeRequests: React.FC = () => {
  const { addToast } = useToast();
  
  const [requests, setRequests] = useState<OfficialsChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await api.getOfficialsChangeRequests();
      setRequests(response.data);
    } catch (err) {
      console.error("Failed to load officials change requests", err);
      addToast("Failed to load requests", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    try {
      await api.approveRequest(requestId, 'Officials Change');
      addToast("Officials change request approved", "success");
      loadRequests();
    } catch (err) {
      addToast("Failed to approve request", "error");
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      await api.rejectRequest(requestId, 'Officials Change');
      addToast("Officials change request rejected", "success");
      loadRequests();
    } catch (err) {
      addToast("Failed to reject request", "error");
    }
  };

  const handleRevert = async (requestId: number) => {
    try {
      await api.revertRequest(requestId, 'Officials Change');
      addToast("Officials change request reverted", "success");
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
          <span className="font-medium text-textDark">{row.original.unitName}</span>
        ),
      },
      {
        id: 'changes',
        header: 'Requested Changes',
        cell: ({ row }) => {
          const changes = row.original.requestedChanges || {};
          const changeList: string[] = [];
          if (changes.presidentDesignation) changeList.push(`President Designation: ${changes.presidentDesignation}`);
          if (changes.presidentName) changeList.push(`President Name: ${changes.presidentName}`);
          if (changes.presidentPhone) changeList.push(`President Phone: ${changes.presidentPhone}`);
          if (changes.vicePresidentName) changeList.push(`VP Name: ${changes.vicePresidentName}`);
          if (changes.vicePresidentPhone) changeList.push(`VP Phone: ${changes.vicePresidentPhone}`);
          if (changes.secretaryName) changeList.push(`Secretary Name: ${changes.secretaryName}`);
          if (changes.secretaryPhone) changeList.push(`Secretary Phone: ${changes.secretaryPhone}`);
          if (changes.jointSecretaryName) changeList.push(`Joint Sec Name: ${changes.jointSecretaryName}`);
          if (changes.jointSecretaryPhone) changeList.push(`Joint Sec Phone: ${changes.jointSecretaryPhone}`);
          if (changes.treasurerName) changeList.push(`Treasurer Name: ${changes.treasurerName}`);
          if (changes.treasurerPhone) changeList.push(`Treasurer Phone: ${changes.treasurerPhone}`);
          
          return (
            <div className="text-sm text-textMuted max-w-xs">
              {changeList.length > 0 ? (
                <div className="space-y-1">
                  {changeList.slice(0, 3).map((change, idx) => (
                    <div key={idx} className="truncate">{change}</div>
                  ))}
                  {changeList.length > 3 && (
                    <div className="text-xs">+{changeList.length - 3} more</div>
                  )}
                </div>
              ) : (
                'No changes'
              )}
            </div>
          );
        },
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


