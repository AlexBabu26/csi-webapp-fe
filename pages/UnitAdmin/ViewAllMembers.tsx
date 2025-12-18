import React, { useEffect, useState, useMemo } from 'react';
import { Card, Badge, Button } from '../../components/ui';
import { DataTable, ColumnDef } from '../../components/DataTable';
import { Download, Users, Trash2 } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';
import { UnitMember } from '../../types';

export const ViewAllMembers: React.FC = () => {
  const { addToast } = useToast();
  
  const [members, setMembers] = useState<UnitMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<UnitMember[]>([]);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoading(true);
        const response = await api.getUnitMembers();
        setMembers(response.data);
      } catch (err) {
        console.error("Failed to load members", err);
        addToast("Failed to load members", "error");
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [addToast]);

  const handleExport = async () => {
    try {
      await api.exportData('members');
      addToast("Members data exported successfully", "success");
    } catch (err) {
      addToast("Failed to export data", "error");
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedRows.length === 0) {
      addToast('Please select at least one member', 'warning');
      return;
    }
    addToast(`${action} ${selectedRows.length} member(s)`, 'info');
  };

  const columns = useMemo<ColumnDef<UnitMember, any>[]>(
    () => [
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
        accessorKey: 'number',
        header: 'Contact',
        cell: ({ row }) => (
          <span className="font-mono text-textMuted text-sm">+91 {row.original.number}</span>
        ),
        size: 140,
      },
      {
        accessorKey: 'age',
        header: 'Age / DOB',
        cell: ({ row }) => (
          <div>
            <span className="text-textDark font-medium block">{row.original.age} years</span>
            <span className="text-xs text-textMuted">{new Date(row.original.dob).toLocaleDateString()}</span>
          </div>
        ),
        size: 120,
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
    ],
    []
  );

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">Unit Members</h1>
          <p className="mt-1 text-sm text-textMuted">View all unit members across districts</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export to Excel
          </Button>
        </div>
      </div>

      {/* Members Table */}
      <Card noPadding className="overflow-hidden">
        <div className="px-6 py-4 border-b border-borderColor flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-50/50">
          <h3 className="text-lg font-bold text-textDark">Unit Members Details</h3>
          <div className="flex items-center gap-2">
            {selectedRows.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={() => handleBulkAction('Export')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Selected
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleBulkAction('Remove')}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Selected
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="p-4">
          <DataTable
            data={members}
            columns={columns}
            isLoading={loading}
            showRowSelection={true}
            onRowSelectionChange={setSelectedRows}
            searchPlaceholder="Search by name, unit, qualification..."
            pageSize={20}
            emptyMessage="No members found"
            emptyIcon={<Users className="w-8 h-8 text-textMuted" />}
          />
        </div>
      </Card>
    </div>
  );
};


