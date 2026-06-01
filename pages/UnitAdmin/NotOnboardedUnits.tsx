import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button } from '../../components/ui';
import { DataTable, ColumnDef } from '../../components/DataTable';
import { ArrowLeft, Building, UserPlus } from 'lucide-react';
import { MasterListUnit } from '../../types';
import { useNotOnboardedUnits } from '../../hooks/queries';

export const NotOnboardedUnits: React.FC = () => {
  const navigate = useNavigate();
  const { data: units = [], isLoading: loading } = useNotOnboardedUnits();

  const districtOptions = useMemo(() => {
    const districts = Array.from(new Set(units.map((unit) => unit.clergyDistrict))).sort();
    return districts.map((district) => ({ value: district, label: district }));
  }, [units]);

  const districtFilter = useMemo(
    () =>
      districtOptions.length > 0
        ? ({
            columnId: 'clergyDistrict',
            label: 'District',
            allLabel: 'All districts',
            options: districtOptions,
          } as const)
        : null,
    [districtOptions],
  );

  const columns = useMemo<ColumnDef<MasterListUnit, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Church / Unit Name',
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
        filterFn: (row, columnId, filterValue) =>
          !filterValue || row.getValue(columnId) === filterValue,
        enableSorting: true,
        size: 180,
      },
      {
        id: 'status',
        header: 'Platform Status',
        cell: () => <Badge variant="warning">Not onboarded</Badge>,
        enableSorting: false,
        size: 150,
      },
    ],
    [],
  );

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/admin/dashboard')}
            className="inline-flex items-center gap-1.5 text-sm text-textMuted hover:text-primary mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">
            Not Onboarded Units
          </h1>
          <p className="mt-1 text-sm text-textMuted max-w-2xl">
            Churches on the diocese master list that do not yet have an active platform
            registration account. These units cannot log in or start seasonal registration until
            onboarded.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/user-management')}>
            <UserPlus className="w-4 h-4 mr-2" />
            User Management
          </Button>
        </div>
      </div>

      <Card className="border-l-4 border-l-warning">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
            <Building className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-textMuted">Units without platform accounts</p>
            <p className="text-2xl font-bold text-textDark">{loading ? '—' : units.length}</p>
          </div>
        </div>
      </Card>

      <Card noPadding className="overflow-hidden">
        <div className="px-6 py-4 border-b border-borderColor bg-gray-50/50">
          <h3 className="text-lg font-bold text-textDark">Master List — Awaiting Onboarding</h3>
        </div>
        <div className="p-4">
          <DataTable
            data={units}
            columns={columns}
            isLoading={loading}
            showRowSelection={false}
            searchPlaceholder="Search by church name or district..."
            pageSize={20}
            emptyMessage="All master-list units have platform accounts"
            emptyIcon={<Building className="w-8 h-8 text-textMuted" />}
            columnFiltersConfig={districtFilter ? [districtFilter] : undefined}
          />
        </div>
      </Card>
    </div>
  );
};
