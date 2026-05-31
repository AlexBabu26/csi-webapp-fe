
import React, { useEffect, useMemo } from 'react';
import { 
  BarChart, 
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Label
} from 'recharts';
import { Card, Badge, Button, Skeleton, IconButton } from '../components/ui';
import { DataTable, ColumnDef } from '../components/DataTable';
import { Download, AlertCircle, Eye, Users, Building, UserCheck, FileText, TrendingUp, Droplets, CreditCard } from 'lucide-react';
import { useToast } from '../components/Toast';
import { useNavigate } from 'react-router-dom';
import { Unit } from '../types';
import { useDashboardData } from '../hooks/queries';
import { formatRegistrationSeason } from '../services/authRouting';

const unitStatusVariant = (status: Unit['status']) => {
  if (status === 'Completed') return 'success';
  if (status === 'In Progress') return 'warning';
  return 'light';
};

const paymentStatusLabel: Record<NonNullable<Unit['paymentStatus']>, string> = {
  not_submitted: 'Not submitted',
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
};

const paymentStatusVariant = (status?: Unit['paymentStatus']) => {
  if (status === 'approved') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'rejected') return 'danger';
  return 'light';
};

export const AdminDashboard: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  // Use TanStack Query for data fetching
  const { stats, units, chartData, isLoading: loading, error } = useDashboardData();

  // Show error toast on query error
  useEffect(() => {
    if (error) {
      addToast("Connection failed", "error");
    }
  }, [error, addToast]);

  const registrationSeason = stats
    ? formatRegistrationSeason(stats.currentRegistrationYear)
    : null;

  // Define table columns for unit registrations
  const columns = useMemo<ColumnDef<Unit, any>[]>(
    () => [
      {
        accessorKey: 'unitNumber',
        header: 'Unit No',
        cell: ({ row }) => (
          <span className="font-mono text-textMuted font-medium">
            {row.original.unitNumber}
          </span>
        ),
        size: 100,
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
        accessorKey: 'membersCount',
        header: 'Members',
        cell: ({ row }) => (
          <span className="text-textMuted">{row.original.membersCount}</span>
        ),
        size: 80,
      },
      {
        accessorKey: 'registrationYear',
        header: 'Season',
        cell: ({ row }) => (
          <span className="text-sm text-textMuted">
            {formatRegistrationSeason(row.original.registrationYear)}
          </span>
        ),
        size: 110,
      },
      {
        accessorKey: 'status',
        header: 'Registration',
        cell: ({ row }) => (
          <Badge variant={unitStatusVariant(row.original.status)}>{row.original.status}</Badge>
        ),
        enableSorting: false,
        size: 120,
      },
      {
        accessorKey: 'paymentStatus',
        header: 'Payment',
        cell: ({ row }) => {
          const paymentStatus = row.original.paymentStatus ?? 'not_submitted';
          return (
            <Badge variant={paymentStatusVariant(paymentStatus)}>
              {paymentStatusLabel[paymentStatus]}
            </Badge>
          );
        },
        enableSorting: false,
        size: 130,
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

  // Enhanced Custom Tooltip with dark theme
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl border border-slate-700">
          <p className="text-sm font-semibold mb-1">{label}</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
            <span className="text-xs text-slate-300">Members:</span>
            <span className="text-sm font-bold text-cyan-400">{payload[0].value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Pie chart tooltip
  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl border border-slate-700">
          <p className="text-sm font-semibold mb-1">{payload[0].name}</p>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: payload[0].payload.fill }}
            ></div>
            <span className="text-xs text-slate-300">Units:</span>
            <span className="text-sm font-bold text-white">{payload[0].value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Center label for donut chart
  const renderCenterLabel = ({ viewBox }: any) => {
    const { cx, cy } = viewBox;
    const completionRate = stats ? Math.round((stats.completedUnits / stats.totalUnits) * 100) : 0;
    return (
      <g>
        <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="middle" className="fill-slate-800" style={{ fontSize: '28px', fontWeight: 700 }}>
          {completionRate}%
        </text>
        <text x={cx} y={cy + 18} textAnchor="middle" dominantBaseline="middle" className="fill-slate-500" style={{ fontSize: '13px' }}>
          Complete
        </text>
      </g>
    );
  };

  // Pie chart data with gradient colors
  const pieData = stats ? [
    { name: 'Completed', value: stats.completedUnits, fill: '#0891b2' },
    { name: 'In Progress', value: stats.inProgressUnits, fill: '#f59e0b' },
    { name: 'Not Started', value: stats.notStartedUnits, fill: '#94a3b8' },
  ].filter((item) => item.value > 0) : [];

  const notStartedUnits = units.filter(u => u.status === 'Not Started');
  const inProgressUnitsList = units.filter(u => u.status === 'In Progress');
  const notStartedDistricts = notStartedUnits.length > 0
    ? Array.from(new Set(notStartedUnits.map(u => u.clergyDistrict)))
    : [];

  if (error) {
    return (
      <div className="p-8 text-center bg-white rounded-lg shadow-sm border border-red-100 mt-8">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-textDark">Unable to load dashboard</h3>
        <p className="text-textMuted mb-4">Failed to load dashboard data. Please try again.</p>
        <Button onClick={() => window.location.reload()} variant="primary">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">Unit Admin Dashboard</h1>
          <p className="mt-1 text-sm text-textMuted">
            CSI Madhya Kerala Diocese Youth Movement
            {registrationSeason && (
              <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {registrationSeason} Registration Season
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={() => navigate('/admin/export')}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
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
        ) : stats ? (
            <>
              <Card className="hover:shadow-md transition-shadow cursor-default bg-white border-l-4 border-l-primary/20">
                <dt className="text-sm font-medium text-textMuted flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Total Units
                </dt>
                <dd className="mt-2 text-3xl font-bold text-textDark">{stats.totalUnits}</dd>
                <div className="mt-2 text-sm text-textMuted">
                  <span className="text-success font-medium">{stats.completedUnits} completed</span>
                  {registrationSeason && <span className="ml-1">for {registrationSeason}</span>}
                </div>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-default bg-white border-l-4 border-l-primary/20">
                <dt className="text-sm font-medium text-textMuted flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  In Progress
                </dt>
                <dd className="mt-2 text-3xl font-bold text-textDark">{stats.inProgressUnits}</dd>
                <div className="mt-2 text-sm text-textMuted">
                  <span>{stats.notStartedUnits} not started yet</span>
                </div>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-default bg-white border-l-4 border-l-primary/20">
                <dt className="text-sm font-medium text-textMuted flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Total Members
                </dt>
                <dd className="mt-2 text-3xl font-bold text-textDark">{stats.totalMembers}</dd>
                <div className="mt-2 text-sm text-textMuted">
                  <span>{stats.maleMembers} M / {stats.femaleMembers} F</span>
                </div>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-default bg-white border-l-4 border-l-warning/20">
                <dt className="text-sm font-medium text-textMuted flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Pending Payments
                </dt>
                <dd className="mt-2 text-3xl font-bold text-textDark">{stats.pendingPayments}</dd>
                <div className="mt-2 text-sm text-textMuted">
                  <button
                    onClick={() => navigate('/admin/payments')}
                    className="text-primary hover:underline"
                  >
                    Review unit payments
                  </button>
                </div>
              </Card>
            </>
        ) : null}
      </div>

      {/* Secondary KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="h-24 border-l-4 border-l-gray-200">
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-8 w-3/4" />
            </Card>
          ))
        ) : stats ? (
          <>
              <Card className="hover:shadow-md transition-shadow cursor-default bg-white border-l-4 border-l-primary/20">
                <dt className="text-sm font-medium text-textMuted flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Districts Completed
                </dt>
                <dd className="mt-2 text-2xl font-bold text-textDark">
                  {stats.completedDistricts}/{stats.totalDistricts}
                </dd>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-default bg-white border-l-4 border-l-primary/20">
                <dt className="text-sm font-medium text-textMuted flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Pending Change Requests
                </dt>
                <dd className="mt-2 text-2xl font-bold text-textDark">{stats.pendingRequests}</dd>
                <div className="mt-2 text-sm text-textMuted">
                  <button
                    onClick={() => navigate('/admin/requests/transfers')}
                    className="text-primary hover:underline"
                  >
                    View all requests
                  </button>
                </div>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-default bg-white border-l-4 border-l-primary/20">
                <dt className="text-sm font-medium text-textMuted flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Largest Unit
                </dt>
                <dd className="mt-2 text-lg font-bold text-textDark truncate">{stats.maxMemberUnit}</dd>
                <div className="mt-2 text-sm text-textMuted">{stats.maxMemberCount} members</div>
              </Card>
            </>
        ) : null}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Members', icon: <Users className="w-5 h-5 text-primary" />, path: '/admin/members', bg: 'bg-blue-50' },
          { label: 'Export Data', icon: <Download className="w-5 h-5 text-green-600" />, path: '/admin/export', bg: 'bg-green-50' },
          { label: 'Archive Members', icon: <FileText className="w-5 h-5 text-amber-600" />, path: '/admin/archived-members', bg: 'bg-amber-50' },
          { label: 'Unit Payments', icon: <CreditCard className="w-5 h-5 text-indigo-600" />, path: '/admin/payments', bg: 'bg-indigo-50' },
          { label: 'Blood Bank', icon: <Droplets className="w-5 h-5 text-red-600" />, path: '/admin/blood-donor-search', bg: 'bg-red-50' },
        ].map((link) => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            className="bg-white rounded-xl border border-borderColor p-4 flex flex-col items-center gap-2 hover:shadow-md hover:border-gray-300 transition-all text-center group"
          >
            <div className={`w-10 h-10 ${link.bg} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform`}>
              {link.icon}
            </div>
            <span className="text-xs font-semibold text-textDark">{link.label}</span>
          </button>
        ))}
      </div>

      {/* Summary Stats */}
      {stats && !loading && (
        <Card>
          <h3 className="text-lg font-bold text-textDark mb-4">
            {registrationSeason ? `${registrationSeason} Registration Summary` : 'Registration Summary'}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-textMuted">Current registration season:</span>
              <span className="font-medium text-textDark">
                {registrationSeason ?? '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-textMuted">Units completed this season:</span>
              <span className="font-medium text-success">{stats.completedUnits}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-textMuted">Units in progress:</span>
              <span className="font-medium text-warning">{stats.inProgressUnits}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-textMuted">Units not started:</span>
              <span className="font-medium text-textDark">{stats.notStartedUnits}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-textMuted">Payments awaiting review:</span>
              <span className="font-medium text-primary">{stats.pendingPayments}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-textMuted">Unit with highest members:</span>
              <span className="font-medium text-textDark">{stats.maxMemberUnit} ({stats.maxMemberCount} members)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-textMuted">Total Number of Members:</span>
              <span className="font-medium text-primary">{stats.totalMembers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-textMuted">Male Members:</span>
              <span className="font-medium text-textDark">{stats.maleMembers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-textMuted">Female Members:</span>
              <span className="font-medium text-textDark">{stats.femaleMembers}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* District Bar Chart */}
        <Card className="min-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-textDark">Members by District</h3>
              <p className="text-xs text-textMuted mt-1">Distribution across clergy districts</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            {loading ? (
              <Skeleton className="w-full h-full rounded" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#0891b2" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    dy={10} 
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#94a3b8' }} 
                    width={45}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(6, 182, 212, 0.1)' }} />
                  <Bar 
                    dataKey="participants" 
                    fill="url(#barGradient)" 
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={55}
                    animationDuration={800}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Units Completion Donut Chart */}
        <Card className="min-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-textDark">Registration Status by Unit</h3>
              <p className="text-xs text-textMuted mt-1">
                {registrationSeason ? `${registrationSeason} season progress` : 'Current season progress'}
              </p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            {loading ? (
              <Skeleton className="w-full h-full rounded" />
            ) : pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <linearGradient id="completedGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#0891b2" />
                    </linearGradient>
                    <linearGradient id="inProgressGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                    <linearGradient id="notStartedGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#cbd5e1" />
                      <stop offset="100%" stopColor="#94a3b8" />
                    </linearGradient>
                  </defs>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    animationDuration={800}
                    animationBegin={200}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={
                          entry.name === 'Completed'
                            ? 'url(#completedGradient)'
                            : entry.name === 'In Progress'
                              ? 'url(#inProgressGradient)'
                              : 'url(#notStartedGradient)'
                        }
                      />
                    ))}
                    <Label content={renderCenterLabel} />
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend 
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={10}
                    formatter={(value) => <span className="text-slate-600 text-sm ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-textMuted">
                No registration data for the current season yet.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Progress Bars Section */}
      {stats && !loading && (
        <Card>
          <h3 className="text-lg font-bold text-textDark mb-6">
            {registrationSeason ? `${registrationSeason} Progress Overview` : 'Progress Overview'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Units Progress */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">Units Completed</span>
                <span className="text-sm font-bold text-cyan-600">
                  {stats.completedUnits}/{stats.totalUnits} ({Math.round((stats.completedUnits / stats.totalUnits) * 100)}%)
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full transition-all duration-1000"
                  style={{ width: `${(stats.completedUnits / stats.totalUnits) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">Units In Progress</span>
                <span className="text-sm font-bold text-amber-600">
                  {stats.inProgressUnits}/{stats.totalUnits} ({Math.round((stats.inProgressUnits / stats.totalUnits) * 100)}%)
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-1000"
                  style={{ width: `${(stats.inProgressUnits / stats.totalUnits) * 100}%` }}
                />
              </div>
            </div>

            {/* Districts Progress */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">Districts Completed</span>
                <span className="text-sm font-bold text-emerald-600">
                  {stats.completedDistricts}/{stats.totalDistricts} ({Math.round((stats.completedDistricts / stats.totalDistricts) * 100)}%)
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-1000"
                  style={{ width: `${(stats.completedDistricts / stats.totalDistricts) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Gender Distribution */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-sm font-semibold text-slate-700 mb-4">Gender Distribution</p>
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-500 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    Male
                  </span>
                  <span className="text-sm font-semibold text-slate-700">{stats.maleMembers}</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-1000"
                    style={{ width: `${(stats.maleMembers / stats.totalMembers) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-500 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-pink-500"></span>
                    Female
                  </span>
                  <span className="text-sm font-semibold text-slate-700">{stats.femaleMembers}</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-pink-400 to-pink-600 rounded-full transition-all duration-1000"
                    style={{ width: `${(stats.femaleMembers / stats.totalMembers) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {(notStartedDistricts.length > 0 || inProgressUnitsList.length > 0) && !loading && (
        <Card className="border-l-4 border-l-warning">
          <h3 className="text-lg font-bold text-textDark mb-4">
            {registrationSeason
              ? `Units Not Yet Completed for ${registrationSeason}`
              : 'Units Not Yet Completed This Season'}
          </h3>
          <div className="space-y-3">
            {notStartedDistricts.length > 0 && (
              <div>
                <p className="text-sm font-medium text-textMuted mb-2">Districts with not-started units:</p>
                <div className="flex flex-wrap gap-2">
                  {notStartedDistricts.map((district, idx) => (
                    <Badge key={idx} variant="warning">{district}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-textMuted mb-2">Not started units:</p>
              <div className="flex flex-wrap gap-2">
                {notStartedUnits.slice(0, 10).map((unit) => (
                  <Badge key={unit.id} variant="danger">{unit.name}</Badge>
                ))}
                {notStartedUnits.length > 10 && (
                  <span className="text-sm text-textMuted">+{notStartedUnits.length - 10} more</span>
                )}
                {notStartedUnits.length === 0 && (
                  <span className="text-sm text-textMuted">All registered units have started this season.</span>
                )}
              </div>
            </div>
            {inProgressUnitsList.length > 0 && (
              <div>
                <p className="text-sm font-medium text-textMuted mb-2">In progress ({inProgressUnitsList.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {inProgressUnitsList.slice(0, 8).map((unit) => (
                    <Badge key={unit.id} variant="warning">{unit.name}</Badge>
                  ))}
                  {inProgressUnitsList.length > 8 && (
                    <span className="text-sm text-textMuted">+{inProgressUnitsList.length - 8} more</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Unit Registration Details */}
      <Card noPadding className="overflow-hidden">
        <div className="px-6 py-4 border-b border-borderColor flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-50/50">
            <div>
              <h3 className="text-lg font-bold text-textDark">Current Season Registrations</h3>
              {registrationSeason && (
                <p className="text-xs text-textMuted mt-1">{registrationSeason} cycle status and payments</p>
              )}
            </div>
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
