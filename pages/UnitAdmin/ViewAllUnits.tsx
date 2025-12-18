import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, IconButton } from '../../components/ui';
import { DataTable, ColumnDef } from '../../components/DataTable';
import { Download, Eye, Building } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';
import { Unit } from '../../types';

export const ViewAllUnits: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Unit[]>([]);

  useEffect(() => {
    const loadUnits = async () => {
      try {
        setLoading(true);
        const response = await api.getUnits();
        setUnits(response.data);
      } catch (err) {
        console.error("Failed to load units", err);
        addToast("Failed to load units", "error");
      } finally {
        setLoading(false);
      }
    };

    loadUnits();
  }, [addToast]);

  const handleExport = async () => {
    try {
      await api.exportData('units');
      addToast("Units data exported successfully", "success");
    } catch (err) {
      addToast("Failed to export data", "error");
    }
  };

  const columns = useMemo<ColumnDef<Unit, any>[]>(
    () => [
      {
        accessorKey: 'unitNumber',
        header: 'Unit Number',
        cell: ({ row }) => (
          <span className="font-mono text-textMuted font-medium">
            {row.original.unitNumber}
          </span>
        ),
        size: 120,
      },
      {
        accessorKey: 'name',
        header: 'Unit Name',
        cell: ({ row }) => (
          <span className="font-medium text-textDark">{row.original.name}</span>
        ),
      },
      {
        accessorKey: 'clergyDistrict',
        header: 'Clergy District',
        cell: ({ row }) => (
          <Badge variant="light">{row.original.clergyDistrict}</Badge>
        ),
      },
      {
        accessorKey: 'registrationYear',
        header: 'Reg. Year',
        cell: ({ row }) => (
          <span className="text-textMuted">{row.original.registrationYear}</span>
        ),
        size: 100,
      },
      {
        accessorKey: 'membersCount',
        header: 'Members',
        cell: ({ row }) => (
          <span className="text-textMuted font-medium">{row.original.membersCount}</span>
        ),
        size: 80,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          const variant = status === 'Completed' ? 'success' : status === 'Pending' ? 'warning' : 'light';
          return <Badge variant={variant}>{status}</Badge>;
        },
        enableSorting: false,
        size: 120,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <IconButton
            icon={<Eye className="w-4 h-4" />}
            tooltip="View Details"
            variant="info"
            onClick={() => navigate(`/admin/units/${row.original.id}`)}
          />
        ),
        enableSorting: false,
        size: 80,
      },
    ],
    [navigate]
  );

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">All Units</h1>
          <p className="mt-1 text-sm text-textMuted">View and manage registered units</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export to Excel
          </Button>
        </div>
      </div>

      {/* Units Table */}
      <Card noPadding className="overflow-hidden">
        <div className="px-6 py-4 border-b border-borderColor bg-gray-50/50">
          <h3 className="text-lg font-bold text-textDark">Unit Registration Details</h3>
        </div>
        <div className="p-4">
          <DataTable
            data={units}
            columns={columns}
            isLoading={loading}
            showRowSelection={false}
            searchPlaceholder="Search units by name, number, or district..."
            pageSize={15}
            emptyMessage="No units found"
            emptyIcon={<Building className="w-8 h-8 text-textMuted" />}
          />
        </div>
      </Card>
    </div>
  );
};


