
import React, { useEffect, useState } from 'react';
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
import { Card, Table, TableRow, TableCell, Badge, Button, Skeleton } from '../components/ui';
import { Download, Filter, Plus, MoreHorizontal, AlertCircle } from 'lucide-react';
import { useToast } from '../components/Toast';
import { api } from '../services/api';
import { Metric, Participant } from '../types';

export const AdminDashboard: React.FC = () => {
  const { addToast } = useToast();
  
  // Local state for data
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [registrations, setRegistrations] = useState<Participant[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-border-color shadow-card rounded-[6px] min-w-[150px]">
          <p className="text-sm font-semibold text-gray-900 mb-1">{label}</p>
          <div className="flex items-center justify-between">
             <span className="text-xs text-gray-500">Participants</span>
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
        <h3 className="text-lg font-medium text-gray-900">Unable to load dashboard</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} variant="primary">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Overview of CSI Kalamela '24 progress.</p>
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
            metrics.map((metric, index) => (
            <Card key={index} className="hover:shadow-card-hover transition-shadow cursor-default bg-white border-l-4 border-l-primary/20">
                <dt className="text-sm font-medium text-gray-500 truncate">{metric.label}</dt>
                <dd className="mt-2 text-3xl font-bold text-gray-900">{metric.value}</dd>
                <div className="mt-2 flex items-center text-sm">
                <span className={`font-medium ${metric.trend === 'up' ? 'text-success' : metric.trend === 'down' ? 'text-danger' : 'text-gray-500'}`}>
                    {metric.change}
                </span>
                <span className="ml-2 text-gray-400">vs last week</span>
                </div>
            </Card>
            ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 flex flex-col">
            <Card className="flex-1 min-h-[400px]">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Participation by District</h3>
                        <p className="text-xs text-gray-500 mt-1">Real-time registration statistics</p>
                    </div>
                    <Badge variant="info" className="animate-pulse">Live Updates</Badge>
                </div>
                <div className="h-[300px] w-full">
                    {loading ? (
                        <Skeleton className="w-full h-full rounded" />
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    dy={10} 
                                    style={{ fontSize: '12px', fill: '#6b7280', fontWeight: 500 }} 
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    style={{ fontSize: '12px', fill: '#6b7280' }} 
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
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
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
                 <h3 className="text-lg font-bold text-gray-900 mb-4">System Status</h3>
                 <div className="space-y-4">
                     <div>
                         <div className="flex justify-between text-sm mb-1.5">
                             <span className="text-gray-600 font-medium">Server Load</span>
                             <span className="font-bold text-success text-xs">Optimal</span>
                         </div>
                         <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-success h-2 rounded-full transition-all duration-500" style={{ width: '25%' }}></div>
                         </div>
                     </div>
                     <div>
                         <div className="flex justify-between text-sm mb-1.5">
                             <span className="text-gray-600 font-medium">Storage Usage</span>
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

      {/* Recent Registrations Table */}
      <Card noPadding className="overflow-hidden">
        <div className="px-6 py-4 border-b border-border-color flex justify-between items-center bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900">Recent Registrations</h3>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary-hover hover:bg-primary/5">
                View All
            </Button>
        </div>
        <Table headers={['Chest No', 'Name', 'Unit', 'District', 'Category', 'Status', 'Actions']}>
            {loading ? (
                 Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    </TableRow>
                 ))
            ) : (
                registrations.map((row) => (
                    <TableRow key={row.id}>
                        <TableCell className="font-mono text-gray-500 font-medium">#{row.chestNumber}</TableCell>
                        <TableCell className="font-medium text-gray-900">{row.name}</TableCell>
                        <TableCell>{row.unit}</TableCell>
                        <TableCell>
                            <Badge variant="light" className="border-gray-200">{row.district}</Badge>
                        </TableCell>
                        <TableCell>{row.category}</TableCell>
                        <TableCell>
                            <Badge variant="success">Approved</Badge>
                        </TableCell>
                        <TableCell align="right">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleAction(`Edit ${row.name}`)}>
                                <MoreHorizontal className="w-4 h-4 text-gray-500" />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))
            )}
        </Table>
      </Card>
    </div>
  );
};
