import React, { useMemo } from 'react';
import { Card, Badge, Button } from '../../components/ui';
import { DataTable, ColumnDef } from '../../components/DataTable';
import { Download, UserCheck } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';
import { UnitCouncilor } from '../../types';
import { useCouncilors } from '../../hooks/queries';

export const ViewAllCouncilors: React.FC = () => {
  const { addToast } = useToast();
  
  // Use TanStack Query
  const { data: councilors = [], isLoading: loading } = useCouncilors();

  const handleExport = async () => {
    try {
      await api.exportData('councilors');
      addToast("Councilors data exported successfully", "success");
    } catch (err) {
      addToast("Failed to export data", "error");
    }
  };

  const columns = useMemo<ColumnDef<UnitCouncilor, any>[]>(
    () => [
      {
        accessorKey: 'unitName',
        header: 'Unit Name',
        cell: ({ row }) => (
          <span className="font-medium text-textDark">{row.original.unitName}</span>
        ),
      },
      {
        accessorKey: 'memberName',
        header: 'Councilor Name',
        cell: ({ row }) => (
          <span className="font-medium text-textDark">{row.original.memberName}</span>
        ),
      },
      {
        accessorKey: 'memberPhone',
        header: 'Phone Number',
        cell: ({ row }) => (
          <span className="font-mono text-textMuted">+91 {row.original.memberPhone}</span>
        ),
        size: 140,
      },
      {
        accessorKey: 'memberGender',
        header: 'Gender',
        cell: ({ row }) => (
          <Badge variant="light">{row.original.memberGender === 'M' ? 'Male' : 'Female'}</Badge>
        ),
        size: 80,
      },
      {
        accessorKey: 'memberDob',
        header: 'Date of Birth',
        cell: ({ row }) => (
          <span className="text-textMuted">{new Date(row.original.memberDob).toLocaleDateString()}</span>
        ),
        size: 120,
      },
      {
        accessorKey: 'memberQualification',
        header: 'Qualification',
        cell: ({ row }) => (
          <span className="text-textMuted">{row.original.memberQualification || '-'}</span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">Unit Councilors</h1>
          <p className="mt-1 text-sm text-textMuted">View all unit councilors across districts</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export to Excel
          </Button>
        </div>
      </div>

      {/* Councilors Table */}
      <Card noPadding className="overflow-hidden">
        <div className="px-6 py-4 border-b border-borderColor bg-gray-50/50">
          <h3 className="text-lg font-bold text-textDark">Unit Councilors Details</h3>
        </div>
        <div className="p-4">
          <DataTable
            data={councilors}
            columns={columns}
            isLoading={loading}
            showRowSelection={false}
            searchPlaceholder="Search by unit or councilor name..."
            pageSize={15}
            emptyMessage="No councilors found"
            emptyIcon={<UserCheck className="w-8 h-8 text-textMuted" />}
          />
        </div>
      </Card>
    </div>
  );
};


