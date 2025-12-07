
import React, { useEffect, useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Card, Badge, Button, Skeleton } from '../components/ui';
import { DataTable, ColumnDef } from '../components/DataTable';
import { Download, Filter, Plus, AlertCircle, Edit, Trash2, Eye, Users } from 'lucide-react';
import { useToast } from '../components/Toast';
import { api } from '../services/api';
import { Metric, Participant } from '../types';

// Shorter labels for KPI cards
const KPI_LABELS: { [key: string]: { short: string; full: string } } = {
  'Total Registrations': { short: 'Registrations', full: 'Total Registrations' },
  'Events Scheduled': { short: 'Events', full: 'Events Scheduled' },
  'Results Published': { short: 'Results', full: 'Results Published' },
  'Pending Appeals': { short: 'Appeals', full: 'Pending Appeals' },
};

export const AdminDashboard: React.FC = () => {
  const { addToast } = useToast();
  
  // Local state for data
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [registrations, setRegistrations] = useState<Participant[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Participant[]>([]);

  // Fetch data on mount
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // Parallel data fetching for efficiency
        const [metricsRes, regsRes, chartRes] = await Promise.all([
          api.getDashboardMetrics(),
          api.getRecentRegistrations(),
          api.getChartData()
        ]);

        setMetrics(metricsRes.data);
        setRegistrations(regsRes.data);
        setChartData(chartRes.data);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
        setError("Failed to load dashboard data. Please try again.");
        addToast("Connection failed", "error");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [addToast]);

  const handleAction = (action: string) => {
    addToast(`${action} action triggered`, 'info');
  };

  const handleBulkAction = (action: string) => {
    if (selectedRows.length === 0) {
      addToast('Please select at least one row', 'warning');
      return;
    }
    addToast(`${action} ${selectedRows.length} participant(s)`, 'info');
  };

  // Define table columns
  const columns = useMemo<ColumnDef<Participant, any>[]>(
    () => [
      {
        accessorKey: 'chestNumber',
        header: 'Chest No',
        cell: ({ row }) => (
          <span className="font-mono text-textMuted font-medium">
            #{row.original.chestNumber}
          </span>
        ),
        size: 100,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <span className="font-medium text-textDark">{row.original.name}</span>
        ),
      },
      {
        accessorKey: 'unit',
        header: 'Unit',
        cell: ({ row }) => (
          <span className="text-textMuted">{row.original.unit}</span>
        ),
      },
      {
        accessorKey: 'district',
        header: 'District',
        cell: ({ row }) => (
          <Badge variant="light">{row.original.district}</Badge>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => (
          <span className="text-textMuted">{row.original.category}</span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: () => <Badge variant="success">Approved</Badge>,
        enableSorting: false,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleAction(`View ${row.original.name}`)}
              className="p-1.5 rounded-md hover:bg-bgLight transition-colors"
              aria-label="View details"
            >
              <Eye className="w-4 h-4 text-textMuted hover:text-textDark" />
            </button>
            <button
              onClick={() => handleAction(`Edit ${row.original.name}`)}
              className="p-1.5 rounded-md hover:bg-bgLight transition-colors"
              aria-label="Edit"
            >
              <Edit className="w-4 h-4 text-textMuted hover:text-textDark" />
            </button>
            <button
              onClick={() => handleAction(`Delete ${row.original.name}`)}
              className="p-1.5 rounded-md hover:bg-red-50 transition-colors"
              aria-label="Delete"
            >
              <Trash2 className="w-4 h-4 text-textMuted hover:text-danger" />
            </button>
          </div>
        ),
        enableSorting: false,
        size: 120,
      },
    ],
    []
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-borderColor shadow-lg rounded-md min-w-[150px]">
          <p className="text-sm font-semibold text-textDark mb-1">{label}</p>
          <div className="flex items-center justify-between">
             <span className="text-xs text-textMuted">Participants</span>
             <span className="text-sm font-bold text-primary">{payload[0].value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (error) {
    return (
      <div className="p-8 text-center bg-white rounded-lg shadow-sm border border-red-100 mt-8">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-textDark">Unable to load dashboard</h3>
        <p className="text-textMuted mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} variant="primary">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-textMuted">Overview of CSI Kalamela '24 progress.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => handleAction('Filter')}>
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="primary" size="sm" onClick={() => handleAction('Export Report')}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {loading ? (
            Array(4).fill(0).map((_, i) => (
                <Card key={i} className="h-32 border-l-4 border-l-gray-200">
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-8 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/3" />
                </Card>
            ))
        ) : (
            metrics.map((metric, index) => {
              const labels = KPI_LABELS[metric.label] || { short: metric.label, full: metric.label };
              return (
                <Card key={index} className="hover:shadow-md transition-shadow cursor-default bg-white border-l-4 border-l-primary/20">
                    <dt className="text-sm font-medium text-textMuted" title={labels.full}>
                      <span className="hidden sm:inline">{labels.full}</span>
                      <span className="sm:hidden">{labels.short}</span>
                    </dt>
                    <dd className="mt-2 text-3xl font-bold text-textDark">{metric.value}</dd>
                    <div className="mt-2 flex items-center text-sm">
                    <span className={`font-medium ${metric.trend === 'up' ? 'text-success' : metric.trend === 'down' ? 'text-danger' : 'text-textMuted'}`}>
                        {metric.change}
                    </span>
                    <span className="ml-2 text-gray-400 text-xs">vs last week</span>
                    </div>
                </Card>
              );
            })
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 flex flex-col">
            <Card className="flex-1 min-h-[400px]">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-textDark">Participation by District</h3>
                        <p className="text-xs text-textMuted mt-1">Real-time registration statistics</p>
                    </div>
                    <Badge variant="info" className="animate-pulse">Live Updates</Badge>
                </div>
                <div className="h-[300px] w-full">
                    {loading ? (
                        <Skeleton className="w-full h-full rounded" />
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    dy={10} 
                                    style={{ fontSize: '11px', fill: '#757575', fontWeight: 500 }} 
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    style={{ fontSize: '11px', fill: '#757575' }} 
                                    width={40}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
                                <Bar dataKey="participants" radius={[4, 4, 0, 0]} maxBarSize={50}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill="#007faf" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </Card>
        </div>

        {/* Quick Actions / Summary */}
        <div className="lg:col-span-1 space-y-6">
             <Card>
                <h3 className="text-lg font-bold text-textDark mb-4">Quick Actions</h3>
                <div className="space-y-3">
                    <Button className="w-full justify-start text-left" variant="outline" onClick={() => handleAction('Add Unit')}>
                        <Plus className="w-4 h-4 mr-2 text-primary" />
                        Add New Unit
                    </Button>
                    <Button className="w-full justify-start text-left" variant="outline" onClick={() => handleAction('Register Participant')}>
                        <Plus className="w-4 h-4 mr-2 text-primary" />
                        Register Participant
                    </Button>
                     <Button className="w-full justify-start text-left" variant="outline" onClick={() => handleAction('Download Sheets')}>
                        <Download className="w-4 h-4 mr-2 text-primary" />
                        Download Score Sheets
                    </Button>
                </div>
             </Card>
             
             <Card>
                 <h3 className="text-lg font-bold text-textDark mb-4">System Status</h3>
                 <div className="space-y-4">
                     <div>
                         <div className="flex justify-between text-sm mb-1.5">
                             <span className="text-textMuted font-medium">Server Load</span>
                             <span className="font-bold text-success text-xs">Optimal</span>
                         </div>
                         <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-success h-2 rounded-full transition-all duration-500" style={{ width: '25%' }}></div>
                         </div>
                     </div>
                     <div>
                         <div className="flex justify-between text-sm mb-1.5">
                             <span className="text-textMuted font-medium">Storage Usage</span>
                             <span className="font-bold text-warning text-xs">68%</span>
                         </div>
                         <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-warning h-2 rounded-full transition-all duration-500" style={{ width: '68%' }}></div>
                         </div>
                     </div>
                 </div>
             </Card>
        </div>
      </div>

      {/* Recent Registrations Table with DataTable */}
      <Card noPadding className="overflow-hidden">
        <div className="px-6 py-4 border-b border-borderColor flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-50/50">
            <h3 className="text-lg font-bold text-textDark">Recent Registrations</h3>
            <div className="flex items-center gap-2">
              {selectedRows.length > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={() => handleBulkAction('Export')}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Selected
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleBulkAction('Delete')}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </Button>
                </>
              )}
            </div>
        </div>
        <div className="p-4">
          <DataTable
            data={registrations}
            columns={columns}
            isLoading={loading}
            showRowSelection={true}
            onRowSelectionChange={setSelectedRows}
            searchPlaceholder="Search participants..."
            pageSize={5}
            emptyMessage="No registrations found"
            emptyIcon={<Users className="w-8 h-8 text-textMuted" />}
          />
        </div>
      </Card>
    </div>
  );
};
