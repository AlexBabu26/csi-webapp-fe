import React, { useEffect, useState, useMemo } from 'react';
import { Card, Badge, Button, IconButton } from '../../components/ui';
import { DataTable, ColumnDef } from '../../components/DataTable';
import { Download, RotateCcw, Archive } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { api } from '../../services/api';
import { ArchivedMember } from '../../types';

export const ArchivedMembers: React.FC = () => {
  const { addToast } = useToast();
  
  const [members, setMembers] = useState<ArchivedMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<ArchivedMember | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    loadArchivedMembers();
  }, []);

  const loadArchivedMembers = async () => {
    try {
      setLoading(true);
      const response = await api.getArchivedMembers();
      setMembers(response.data);
    } catch (err) {
      console.error("Failed to load archived members", err);
      addToast("Failed to load archived members", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (member: ArchivedMember) => {
    setSelectedMember(member);
    setShowRestoreDialog(true);
  };

  const handleConfirmRestore = async () => {
    if (!selectedMember) return;
    
    try {
      setIsRestoring(true);
      await api.restoreMember(selectedMember.id);
      addToast(`${selectedMember.name} restored successfully`, "success");
      setShowRestoreDialog(false);
      setSelectedMember(null);
      // Reload the list
      loadArchivedMembers();
    } catch (err) {
      addToast("Failed to restore member", "error");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleExport = async () => {
    try {
      await api.exportData('archived-members');
      addToast("Archived members data exported successfully", "success");
    } catch (err) {
      addToast("Failed to export data", "error");
    }
  };

  const columns = useMemo<ColumnDef<ArchivedMember, any>[]>(
    () => [
      {
        accessorKey: 'archivedAt',
        header: 'Archived Date',
        cell: ({ row }) => (
          <span className="text-textMuted text-sm">
            {new Date(row.original.archivedAt).toLocaleDateString()}
          </span>
        ),
        size: 120,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <span className="font-medium text-textDark">{row.original.name}</span>
        ),
      },
      {
        accessorKey: 'unitName',
        header: 'Unit',
        cell: ({ row }) => (
          <span className="text-textMuted text-sm">{row.original.unitName}</span>
        ),
      },
      {
        accessorKey: 'gender',
        header: 'Gender',
        cell: ({ row }) => (
          <Badge variant="light">{row.original.gender === 'M' ? 'Male' : 'Female'}</Badge>
        ),
        size: 80,
      },
      {
        accessorKey: 'number',
        header: 'Contact',
        cell: ({ row }) => (
          <span className="font-mono text-textMuted text-sm">+91 {row.original.number}</span>
        ),
        size: 140,
      },
      {
        accessorKey: 'age',
        header: 'Age',
        cell: ({ row }) => (
          <span className="text-textMuted">{row.original.age} years</span>
        ),
        size: 80,
      },
      {
        accessorKey: 'dob',
        header: 'DOB',
        cell: ({ row }) => (
          <span className="text-textMuted text-sm">{new Date(row.original.dob).toLocaleDateString()}</span>
        ),
        size: 100,
      },
      {
        accessorKey: 'qualification',
        header: 'Qualification',
        cell: ({ row }) => (
          <span className="text-textMuted text-sm">{row.original.qualification || '-'}</span>
        ),
      },
      {
        accessorKey: 'bloodGroup',
        header: 'Blood Group',
        cell: ({ row }) => (
          <span className="text-textMuted">{row.original.bloodGroup || '-'}</span>
        ),
        size: 100,
      },
      {
        accessorKey: 'archiveReason',
        header: 'Reason',
        cell: ({ row }) => (
          <span className="text-textMuted text-sm">{row.original.archiveReason || 'Not specified'}</span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <IconButton
            icon={<RotateCcw className="w-4 h-4" />}
            tooltip="Restore Member"
            variant="info"
            onClick={() => handleRestore(row.original)}
          />
        ),
        enableSorting: false,
        size: 80,
      },
    ],
    []
  );

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">Archived Members</h1>
          <p className="mt-1 text-sm text-textMuted">View and restore archived unit members</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export to Excel
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-l-4 border-l-primary">
        <div className="flex items-start gap-3">
          <Archive className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-textDark">About Archived Members</h3>
            <p className="text-sm text-textMuted mt-1">
              Members are archived when they are no longer active in the unit. Archived members can be restored if needed.
              Common reasons include age limit exceeded, transfer to another diocese, or personal request.
            </p>
          </div>
        </div>
      </Card>

      {/* Archived Members Table */}
      <Card noPadding className="overflow-hidden">
        <div className="px-6 py-4 border-b border-borderColor bg-gray-50/50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-textDark">Archived Members List</h3>
            <Badge variant="light">{members.length} Archived</Badge>
          </div>
        </div>
        <div className="p-4">
          <DataTable
            data={members}
            columns={columns}
            isLoading={loading}
            showRowSelection={false}
            searchPlaceholder="Search archived members..."
            pageSize={15}
            emptyMessage="No archived members found"
            emptyIcon={<Archive className="w-8 h-8 text-textMuted" />}
          />
        </div>
      </Card>

      {/* Restore Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showRestoreDialog}
        onClose={() => {
          setShowRestoreDialog(false);
          setSelectedMember(null);
        }}
        onConfirm={handleConfirmRestore}
        title="Restore Member"
        message={`Are you sure you want to restore ${selectedMember?.name}? This will move them back to the active members list.`}
        confirmText="Restore"
        cancelText="Cancel"
        variant="info"
        isLoading={isRestoring}
      />
    </div>
  );
};


