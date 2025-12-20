import React, { useMemo } from 'react';
import { Card, Badge, Button } from '../../components/ui';
import { DataTable, ColumnDef } from '../../components/DataTable';
import { Download, Users } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';
import { UnitOfficial } from '../../types';
import { useOfficials } from '../../hooks/queries';

export const ViewAllOfficials: React.FC = () => {
  const { addToast } = useToast();
  
  // Use TanStack Query
  const { data: officials = [], isLoading: loading } = useOfficials();

  const handleExport = async () => {
    try {
      await api.exportData('officials');
      addToast("Officials data exported successfully", "success");
    } catch (err) {
      addToast("Failed to export data", "error");
    }
  };

  const columns = useMemo<ColumnDef<UnitOfficial, any>[]>(
    () => [
      {
        accessorKey: 'unitName',
        header: 'Unit Name',
        cell: ({ row }) => (
          <div className="min-w-[200px]">
            <span className="font-medium text-textDark block">{row.original.unitName}</span>
          </div>
        ),
      },
      {
        id: 'president',
        header: 'President',
        cell: ({ row }) => (
          <div className="min-w-[180px]">
            <span className="font-medium text-textDark block">
              {row.original.presidentDesignation && `${row.original.presidentDesignation} `}
              {row.original.presidentName}
            </span>
            <span className="text-xs text-textMuted">+91 {row.original.presidentPhone}</span>
          </div>
        ),
        enableSorting: false,
      },
      {
        id: 'vicePresident',
        header: 'Vice President',
        cell: ({ row }) => (
          <div className="min-w-[160px]">
            <span className="font-medium text-textDark block">{row.original.vicePresidentName}</span>
            <span className="text-xs text-textMuted">+91 {row.original.vicePresidentPhone}</span>
          </div>
        ),
        enableSorting: false,
      },
      {
        id: 'secretary',
        header: 'Secretary',
        cell: ({ row }) => (
          <div className="min-w-[160px]">
            <span className="font-medium text-textDark block">{row.original.secretaryName}</span>
            <span className="text-xs text-textMuted">+91 {row.original.secretaryPhone}</span>
          </div>
        ),
        enableSorting: false,
      },
      {
        id: 'jointSecretary',
        header: 'Joint Secretary',
        cell: ({ row }) => (
          <div className="min-w-[160px]">
            <span className="font-medium text-textDark block">{row.original.jointSecretaryName}</span>
            <span className="text-xs text-textMuted">+91 {row.original.jointSecretaryPhone}</span>
          </div>
        ),
        enableSorting: false,
      },
      {
        id: 'treasurer',
        header: 'Treasurer',
        cell: ({ row }) => (
          <div className="min-w-[160px]">
            <span className="font-medium text-textDark block">{row.original.treasurerName}</span>
            <span className="text-xs text-textMuted">+91 {row.original.treasurerPhone}</span>
          </div>
        ),
        enableSorting: false,
      },
    ],
    []
  );

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">Unit Officials</h1>
          <p className="mt-1 text-sm text-textMuted">View all unit officials across districts</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export to Excel
          </Button>
        </div>
      </div>

      {/* Officials Table */}
      <Card noPadding className="overflow-hidden">
        <div className="px-6 py-4 border-b border-borderColor bg-gray-50/50">
          <h3 className="text-lg font-bold text-textDark">Unit Officials Details</h3>
        </div>
        <div className="p-4">
          <DataTable
            data={officials}
            columns={columns}
            isLoading={loading}
            showRowSelection={false}
            searchPlaceholder="Search by unit name or official name..."
            pageSize={10}
            emptyMessage="No officials found"
            emptyIcon={<Users className="w-8 h-8 text-textMuted" />}
          />
        </div>
      </Card>
    </div>
  );
};


