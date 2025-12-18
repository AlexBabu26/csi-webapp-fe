import React, { useEffect, useState, useMemo } from 'react';
import { Card, Badge, Button, IconButton } from '../../components/ui';
import { DataTable, ColumnDef } from '../../components/DataTable';
import { Download, Building, Shield, UserCheck } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';
import { Unit, ClergyDistrict } from '../../types';

export const ExportData: React.FC = () => {
  const { addToast } = useToast();
  
  const [districts, setDistricts] = useState<ClergyDistrict[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState<number>(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [districtsRes, unitsRes] = await Promise.all([
          api.getClergyDistricts(),
          api.getUnits()
        ]);
        
        setDistricts(districtsRes.data);
        setUnits(unitsRes.data);
        if (districtsRes.data.length > 0) {
          setSelectedDistrict(districtsRes.data[0].id);
        }
      } catch (err) {
        console.error("Failed to load data", err);
        addToast("Failed to load data", "error");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [addToast]);

  const handleDistrictOfficialsExport = async () => {
    if (!selectedDistrict) {
      addToast("Please select a district", "warning");
      return;
    }
    try {
      await api.exportData('district-officials', selectedDistrict);
      addToast("District officials data exported successfully", "success");
    } catch (err) {
      addToast("Failed to export data", "error");
    }
  };

  const handleDistrictCouncilorsExport = async () => {
    if (!selectedDistrict) {
      addToast("Please select a district", "warning");
      return;
    }
    try {
      await api.exportData('district-councilors', selectedDistrict);
      addToast("District councilors data exported successfully", "success");
    } catch (err) {
      addToast("Failed to export data", "error");
    }
  };

  const handleUnitOfficialsExport = async (unitId: number) => {
    try {
      await api.exportData('unit-officials', unitId);
      addToast("Unit officials data exported successfully", "success");
    } catch (err) {
      addToast("Failed to export data", "error");
    }
  };

  const handleUnitCouncilorsExport = async (unitId: number) => {
    try {
      await api.exportData('unit-councilors', unitId);
      addToast("Unit councilors data exported successfully", "success");
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
        header: 'District',
        cell: ({ row }) => (
          <Badge variant="light">{row.original.clergyDistrict}</Badge>
        ),
        size: 140,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <IconButton
              icon={<Shield className="w-4 h-4" />}
              tooltip="Export Officials"
              variant="primary"
              onClick={() => handleUnitOfficialsExport(row.original.id)}
            />
            <IconButton
              icon={<UserCheck className="w-4 h-4" />}
              tooltip="Export Councilors"
              variant="success"
              onClick={() => handleUnitCouncilorsExport(row.original.id)}
            />
          </div>
        ),
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
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">Export Data</h1>
          <p className="mt-1 text-sm text-textMuted">Export unit officials and councilors data to Excel</p>
        </div>
      </div>

      {/* District-wise Export Section */}
      <Card>
        <h3 className="text-lg font-bold text-textDark mb-4">Export District-wise Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* District Officials */}
          <div>
            <p className="text-sm font-medium text-textMuted mb-2">District Wise Officials Data</p>
            <select
              className="w-full px-3 py-2 border border-borderColor rounded-md bg-white text-textDark focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary mb-3"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(Number(e.target.value))}
              disabled={loading}
            >
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDistrictOfficialsExport}
              disabled={loading || !selectedDistrict}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Get Officials Data
            </Button>
          </div>

          {/* District Councilors */}
          <div>
            <p className="text-sm font-medium text-textMuted mb-2">District Wise Councilors Data</p>
            <select
              className="w-full px-3 py-2 border border-borderColor rounded-md bg-white text-textDark focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary mb-3"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(Number(e.target.value))}
              disabled={loading}
            >
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDistrictCouncilorsExport}
              disabled={loading || !selectedDistrict}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Get Councilors Data
            </Button>
          </div>
        </div>
      </Card>

      {/* Unit-wise Export Section */}
      <Card noPadding className="overflow-hidden">
        <div className="px-6 py-4 border-b border-borderColor bg-gray-50/50">
          <h3 className="text-lg font-bold text-textDark">Export Unit-wise Data</h3>
          <p className="text-sm text-textMuted mt-1">Select a unit to export its officials and councilors data</p>
        </div>
        <div className="p-4">
          <DataTable
            data={units}
            columns={columns}
            isLoading={loading}
            showRowSelection={false}
            searchPlaceholder="Search units..."
            pageSize={10}
            emptyMessage="No units found"
            emptyIcon={<Building className="w-8 h-8 text-textMuted" />}
          />
        </div>
      </Card>
    </div>
  );
};


