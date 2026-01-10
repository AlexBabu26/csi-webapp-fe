import React, { useState, useMemo } from 'react';
import { Card, Badge, Button } from '../../../components/ui';
import { Download } from 'lucide-react';
import { useToast } from '../../../components/Toast';
import { api } from '../../../services/api';
import { useKalamelaUnitWiseResults, useKalamelaDistrictWiseResults } from '../../../hooks/queries';

type ViewType = 'unit' | 'district';

export const AdminResults: React.FC = () => {
  const { addToast } = useToast();
  
  const [activeView, setActiveView] = useState<ViewType>('unit');
  const [exporting, setExporting] = useState(false);
  
  // Use TanStack Query - fetch both but only use the active one
  const { data: unitWiseData, isLoading: loadingUnits } = useKalamelaUnitWiseResults();
  const { data: districtWiseData, isLoading: loadingDistricts } = useKalamelaDistrictWiseResults();
  
  const loading = loadingUnits || loadingDistricts;
  
  // Transform unit-wise data
  const transformedUnitData = useMemo(() => {
    if (!unitWiseData?.results_dict) return null;
    
    const units: any[] = [];
    let rank = 1;
    
    Object.entries(unitWiseData.results_dict).forEach(([unitName, unitData]: [string, any], index) => {
      if (!Array.isArray(unitData) || unitData.length === 0) {
        units.push({
          unit_id: index,
          unit_name: unitName,
          district_name: 'N/A',
          event_count: 0,
          individual_points: 0,
          group_points: 0,
          total_points: 0,
          rank: 0 // Will be set after sorting
        });
        return;
      }
      
      // Aggregate points from all unit_results
      let totalPoints = 0;
      let eventCount = 0;
      let individualPoints = 0;
      let groupPoints = 0;
      
      unitData.forEach((entry: any) => {
        if (entry.unit_results && Array.isArray(entry.unit_results)) {
          entry.unit_results.forEach((result: any) => {
            totalPoints += result.total_points || 0;
            eventCount++;
            // Note: API doesn't distinguish individual vs group, so we'll need to check event type
            // For now, assume all are individual points
            individualPoints += result.total_points || 0;
          });
        }
      });
      
      units.push({
        unit_id: index,
        unit_name: unitName,
        district_name: 'N/A', // API doesn't provide this, might need backend update
        event_count: eventCount,
        individual_points: individualPoints,
        group_points: groupPoints,
        total_points: totalPoints,
        rank: 0 // Will be set after sorting
      });
    });
    
    // Sort by total_points descending and update ranks
    units.sort((a, b) => b.total_points - a.total_points);
    units.forEach((unit, index) => {
      unit.rank = index + 1;
    });
    
    return { units };
  }, [unitWiseData]);
  
  // Transform district-wise data
  const transformedDistrictData = useMemo(() => {
    if (!districtWiseData?.results_dict) return null;
    
    const districts: any[] = [];
    let rank = 1;
    
    Object.entries(districtWiseData.results_dict).forEach(([districtName, districtData]: [string, any], index) => {
      if (!Array.isArray(districtData) || districtData.length === 0) {
        districts.push({
          district_id: index,
          district_name: districtName,
          unit_count: 0,
          individual_points: 0,
          group_points: 0,
          total_points: 0,
          rank: 0 // Will be set after sorting
        });
        return;
      }
      
      // Aggregate points from all district_results
      let totalPoints = 0;
      let unitCount = 0;
      let individualPoints = 0;
      let groupPoints = 0;
      
      districtData.forEach((entry: any) => {
        if (entry.total_points) {
          totalPoints += entry.total_points;
        }
        if (entry.district_results && Array.isArray(entry.district_results)) {
          // Count unique units from results (assuming each result has unit info)
          // For now, use the length as an approximation
          unitCount = Math.max(unitCount, entry.district_results.length);
          entry.district_results.forEach((result: any) => {
            // Note: API doesn't distinguish individual vs group
            individualPoints += result.total_points || 0;
          });
        }
      });
      
      districts.push({
        district_id: index,
        district_name: districtName,
        unit_count: unitCount,
        individual_points: individualPoints,
        group_points: groupPoints,
        total_points: totalPoints,
        rank: 0 // Will be set after sorting
      });
    });
    
    // Sort by total_points descending and update ranks
    districts.sort((a, b) => b.total_points - a.total_points);
    districts.forEach((district, index) => {
      district.rank = index + 1;
    });
    
    return { districts };
  }, [districtWiseData]);
  
  // Select the appropriate data based on active view
  const data = activeView === 'unit' ? transformedUnitData : transformedDistrictData;

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await api.exportKalamelaResults();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kalamela_${activeView}_results_${new Date().getTime()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      addToast("Results exported successfully", "success");
    } catch (err) {
      addToast("Failed to export results", "error");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-in">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        <Card className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-full mb-3"></div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">
            Kalamela Results
          </h1>
          <p className="mt-1 text-sm text-textMuted">
            View comprehensive results by {activeView === 'unit' ? 'unit' : 'district'}
          </p>
        </div>
        <Button variant="success" size="sm" onClick={handleExport} disabled={exporting}>
          <Download className="w-4 h-4 mr-2" />
          {exporting ? 'Exporting...' : 'Export Results'}
        </Button>
      </div>

      {/* View Toggle */}
      <Card className="p-1 inline-flex gap-1">
        <button
          onClick={() => setActiveView('unit')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeView === 'unit'
              ? 'bg-primary text-white'
              : 'text-textMuted hover:bg-bgLight'
          }`}
        >
          Unit-wise Results
        </button>
        <button
          onClick={() => setActiveView('district')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeView === 'district'
              ? 'bg-primary text-white'
              : 'text-textMuted hover:bg-bgLight'
          }`}
        >
          District-wise Results
        </button>
      </Card>

      {/* Results Table */}
      {activeView === 'unit' && data?.units ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-borderColor">
                  <th className="text-left p-3 text-sm font-semibold text-textDark">Rank</th>
                  <th className="text-left p-3 text-sm font-semibold text-textDark">Unit Name</th>
                  <th className="text-left p-3 text-sm font-semibold text-textDark">District</th>
                  <th className="text-center p-3 text-sm font-semibold text-textDark">Events</th>
                  <th className="text-center p-3 text-sm font-semibold text-textDark">Individual Pts</th>
                  <th className="text-center p-3 text-sm font-semibold text-textDark">Group Pts</th>
                  <th className="text-center p-3 text-sm font-semibold text-textDark">Total Points</th>
                </tr>
              </thead>
              <tbody>
                {data.units.map((unit, index) => (
                  <tr
                    key={unit.unit_id}
                    className={`border-b border-borderColor hover:bg-bgLight ${
                      unit.rank <= 3 ? 'bg-success/5' : ''
                    }`}
                  >
                    <td className="p-3">
                      <Badge variant={
                        unit.rank === 1 ? 'success' :
                        unit.rank === 2 ? 'warning' :
                        unit.rank === 3 ? 'primary' : 'light'
                      }>
                        #{unit.rank}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm font-medium text-textDark">{unit.unit_name}</td>
                    <td className="p-3 text-sm text-textMuted">{unit.district_name}</td>
                    <td className="p-3 text-center text-sm text-textDark">{unit.event_count}</td>
                    <td className="p-3 text-center text-sm font-semibold text-primary">{unit.individual_points}</td>
                    <td className="p-3 text-center text-sm font-semibold text-success">{unit.group_points}</td>
                    <td className="p-3 text-center text-lg font-bold text-textDark">{unit.total_points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : activeView === 'district' && data?.districts ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-borderColor">
                  <th className="text-left p-3 text-sm font-semibold text-textDark">Rank</th>
                  <th className="text-left p-3 text-sm font-semibold text-textDark">District Name</th>
                  <th className="text-center p-3 text-sm font-semibold text-textDark">Units</th>
                  <th className="text-center p-3 text-sm font-semibold text-textDark">Individual Pts</th>
                  <th className="text-center p-3 text-sm font-semibold text-textDark">Group Pts</th>
                  <th className="text-center p-3 text-sm font-semibold text-textDark">Total Points</th>
                </tr>
              </thead>
              <tbody>
                {data.districts.map((district) => (
                  <tr
                    key={district.district_id}
                    className={`border-b border-borderColor hover:bg-bgLight ${
                      district.rank <= 3 ? 'bg-success/5' : ''
                    }`}
                  >
                    <td className="p-3">
                      <Badge variant={
                        district.rank === 1 ? 'success' :
                        district.rank === 2 ? 'warning' :
                        district.rank === 3 ? 'primary' : 'light'
                      }>
                        #{district.rank}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm font-medium text-textDark">{district.district_name}</td>
                    <td className="p-3 text-center text-sm text-textDark">{district.unit_count}</td>
                    <td className="p-3 text-center text-sm font-semibold text-primary">{district.individual_points}</td>
                    <td className="p-3 text-center text-sm font-semibold text-success">{district.group_points}</td>
                    <td className="p-3 text-center text-lg font-bold text-textDark">{district.total_points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="text-center py-12">
          <p className="text-textMuted">No results available yet</p>
        </Card>
      )}
    </div>
  );
};


