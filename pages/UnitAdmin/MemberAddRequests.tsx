import React, { useEffect, useState, useMemo } from 'react';
import { Card, Badge, IconButton } from '../../components/ui';
import { DataTable, ColumnDef } from '../../components/DataTable';
import { FileText, ExternalLink, Check, X } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';
import { MemberAddRequest, RequestStatus } from '../../types';

export const MemberAddRequests: React.FC = () => {
  const { addToast } = useToast();
  
  const [requests, setRequests] = useState<MemberAddRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await api.getMemberAddRequests();
      setRequests(response.data);
    } catch (err) {
      console.error("Failed to load member add requests", err);
      addToast("Failed to load requests", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    try {
      await api.approveRequest(requestId, 'Member Add');
      addToast("Member add request approved", "success");
      loadRequests();
    } catch (err) {
      addToast("Failed to approve request", "error");
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      await api.rejectRequest(requestId, 'Member Add');
      addToast("Member add request rejected", "success");
      loadRequests();
    } catch (err) {
      addToast("Failed to reject request", "error");
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

  const columns = useMemo<ColumnDef<MemberAddRequest, any>[]>(
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
        header: 'Unit',
        cell: ({ row }) => (
          <span className="font-medium text-textDark text-sm">{row.original.unitName}</span>
        ),
      },
      {
        id: 'memberDetails',
        header: 'Member Details',
        cell: ({ row }) => (
          <div className="text-sm">
            <span className="font-medium text-textDark block">{row.original.name}</span>
            <span className="text-textMuted">
              {row.original.gender === 'M' ? 'Male' : 'Female'} • 
              {new Date(row.original.dob).toLocaleDateString()} •
              +91 {row.original.number}
            </span>
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'qualification',
        header: 'Qualification',
        cell: ({ row }) => (
          <span className="text-textMuted text-sm">{row.original.qualification || '-'}</span>
        ),
        size: 120,
      },
      {
        accessorKey: 'bloodGroup',
        header: 'Blood Group',
        cell: ({ row }) => (
          <span className="text-textMuted text-sm">{row.original.bloodGroup || '-'}</span>
        ),
        size: 100,
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
          if (status === 'PENDING') {
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
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">Unit Member Add Requests</h1>
          <p className="mt-1 text-sm text-textMuted">Manage new member addition requests</p>
        </div>
      </div>

      {/* Requests Table */}
      <Card noPadding className="overflow-hidden">
        <div className="px-6 py-4 border-b border-borderColor bg-gray-50/50">
          <h3 className="text-lg font-bold text-textDark">Member Add Requests</h3>
        </div>
        <div className="p-4">
          <DataTable
            data={requests}
            columns={columns}
            isLoading={loading}
            showRowSelection={false}
            searchPlaceholder="Search by member name or unit..."
            pageSize={10}
            emptyMessage="No member add requests found"
            emptyIcon={<FileText className="w-8 h-8 text-textMuted" />}
          />
        </div>
      </Card>
    </div>
  );
};


