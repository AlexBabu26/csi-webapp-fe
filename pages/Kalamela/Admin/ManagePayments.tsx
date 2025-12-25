import React, { useState, useMemo } from 'react';
import { Card, Badge, Button } from '../../../components/ui';
import { CheckCircle, XCircle, Eye, Download, Search, Filter, Calendar, CreditCard, TrendingUp, FileText } from 'lucide-react';
import { useToast } from '../../../components/Toast';
import { Portal } from '../../../components/Portal';
import { useKalamelaPayments, useApproveKalamelaPayment, useDeclineKalamelaPayment } from '../../../hooks/queries';

type StatusFilter = 'all' | 'Pending' | 'Approved' | 'Declined';

// Helper to get full URL for proof files
const getProofUrl = (path: string | null): string | null => {
  if (!path) return null;
  // If it's already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // Get base URL from environment or use default
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  // Remove trailing slash from base URL and leading slash from path to avoid double slashes
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBaseUrl}${cleanPath}`;
};

// Normalize API response to consistent field names
interface NormalizedPayment {
  id: number;
  payment_id: number;
  paid_by_id: number;
  unit_name: string;
  district_name: string;
  individual_events_count: number;
  group_events_count: number;
  amount: number;
  proof_file_url: string | null;
  status: string;
  created_on: string;
  approved_at?: string;
  declined_at?: string;
  decline_reason?: string;
}

const normalizePayment = (raw: any): NormalizedPayment => {
  // Normalize payment_status: backend uses "Paid", frontend expects "Approved"
  let status = raw.payment_status || 'Pending';
  if (status === 'Paid') status = 'Approved';
  if (status === 'PENDING') status = 'Pending';
  if (status === 'DECLINED') status = 'Declined';
  if (status === 'PAID') status = 'Approved';
  if (status === 'PROOF_UPLOADED') status = 'Pending'; // Treat as pending review
  
  return {
    id: raw.id,
    payment_id: raw.id, // Use id as payment_id for mutations
    paid_by_id: raw.paid_by_id,
    unit_name: raw.paid_by_name || raw.unit_name || `Unit #${raw.paid_by_id}`, // Use paid_by_name first
    district_name: raw.district_name || 'Unknown District',
    individual_events_count: raw.individual_events_count || 0,
    group_events_count: raw.group_events_count || 0,
    amount: raw.total_amount_to_pay || 0,
    proof_file_url: raw.payment_proof_path || null,
    status,
    created_on: raw.created_on,
    approved_at: raw.approved_at,
    declined_at: raw.declined_at,
    decline_reason: raw.decline_reason,
  };
};

export const ManagePayments: React.FC = () => {
  const { addToast } = useToast();
  
  // Use TanStack Query
  const { data: paymentsData, isLoading: loading } = useKalamelaPayments();
  const approveMutation = useApproveKalamelaPayment();
  const declineMutation = useDeclineKalamelaPayment();
  
  // Normalize API data to consistent field names
  const payments: NormalizedPayment[] = (paymentsData ?? []).map(normalizePayment);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Dialog states
  const [showDialog, setShowDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'decline'>('approve');
  const [declineReason, setDeclineReason] = useState('');

  // Get unique districts for filter dropdown
  const districts = useMemo(() => {
    const uniqueDistricts = [...new Set(payments.map(p => p.district_name).filter(Boolean))];
    return uniqueDistricts.sort();
  }, [payments]);

  // Filter payments based on all criteria
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      // Search filter
      const matchesSearch = !searchTerm || 
        payment.unit_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.district_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
      
      // District filter
      const matchesDistrict = districtFilter === 'all' || payment.district_name === districtFilter;
      
      // Date range filter
      let matchesDateRange = true;
      if (dateFrom || dateTo) {
        const paymentDate = payment.created_on ? new Date(payment.created_on) : null;
        if (paymentDate) {
          if (dateFrom) {
            const fromDate = new Date(dateFrom);
            fromDate.setHours(0, 0, 0, 0);
            if (paymentDate < fromDate) matchesDateRange = false;
          }
          if (dateTo) {
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999);
            if (paymentDate > toDate) matchesDateRange = false;
          }
        } else {
          matchesDateRange = false;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDistrict && matchesDateRange;
    });
  }, [payments, searchTerm, statusFilter, districtFilter, dateFrom, dateTo]);

  // Calculate stats
  const stats = useMemo(() => {
    const pending = payments.filter(p => p.status === 'Pending');
    const approved = payments.filter(p => p.status === 'Approved');
    const declined = payments.filter(p => p.status === 'Declined');
    
    const totalCollected = approved.reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingAmount = pending.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    return {
      pendingCount: pending.length,
      approvedCount: approved.length,
      declinedCount: declined.length,
      totalCollected,
      pendingAmount,
      totalPayments: payments.length,
    };
  }, [payments]);

  // Group filtered payments by status
  const groupedPayments = useMemo(() => {
    return {
      pending: filteredPayments.filter(p => p.status === 'Pending'),
      approved: filteredPayments.filter(p => p.status === 'Approved'),
      declined: filteredPayments.filter(p => p.status === 'Declined'),
    };
  }, [filteredPayments]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Payment ID',
      'Unit Name',
      'District',
      'Individual Events',
      'Group Events',
      'Amount (Rs)',
      'Status',
      'Submitted Date',
      'Approved/Declined Date',
      'Decline Reason'
    ];
    
    const rows = filteredPayments.map(p => [
      p.id,
      p.unit_name || '',
      p.district_name || '',
      p.individual_events_count || 0,
      p.group_events_count || 0,
      p.amount || 0,
      p.status || '',
      p.created_on ? new Date(p.created_on).toLocaleString('en-IN') : '',
      p.approved_at ? new Date(p.approved_at).toLocaleString('en-IN') : (p.declined_at ? new Date(p.declined_at).toLocaleString('en-IN') : ''),
      p.decline_reason || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `kalamela_payments_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addToast(`Exported ${filteredPayments.length} payment records`, 'success');
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDistrictFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || districtFilter !== 'all' || dateFrom || dateTo;

  const handleAction = async () => {
    if (!selectedPayment) return;

    if (actionType === 'decline' && !declineReason.trim()) {
      addToast("Please provide a reason for declining", "warning");
      return;
    }

    if (actionType === 'approve') {
      approveMutation.mutate(selectedPayment.payment_id, {
        onSuccess: () => {
          setShowDialog(false);
          setSelectedPayment(null);
          setDeclineReason('');
        },
      });
    } else {
      declineMutation.mutate(
        { paymentId: selectedPayment.payment_id, reason: declineReason },
        {
          onSuccess: () => {
            setShowDialog(false);
            setSelectedPayment(null);
            setDeclineReason('');
          },
        }
      );
    }
  };

  const openDialog = (payment: any, action: 'approve' | 'decline') => {
    setSelectedPayment(payment);
    setActionType(action);
    setShowDialog(true);
  };

  const isSubmitting = approveMutation.isPending || declineMutation.isPending;

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-in">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </Card>
          ))}
        </div>
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
            Payment Management
          </h1>
          <p className="mt-1 text-sm text-textMuted">
            Review and approve unit payment submissions across all districts
          </p>
        </div>
        <Button variant="primary" onClick={handleExportCSV} disabled={filteredPayments.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-blue-600 font-medium">Total Payments</p>
              <p className="text-2xl font-bold text-blue-700">{stats.totalPayments}</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-amber-600 font-medium">Pending Review</p>
              <p className="text-2xl font-bold text-amber-700">{stats.pendingCount}</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-green-600 font-medium">Approved</p>
              <p className="text-2xl font-bold text-green-700">{stats.approvedCount}</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-red-600 font-medium">Declined</p>
              <p className="text-2xl font-bold text-red-700">{stats.declinedCount}</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-emerald-600 font-medium">Total Collected</p>
              <p className="text-2xl font-bold text-emerald-700">₹{stats.totalCollected.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-orange-600 font-medium">Pending Amount</p>
              <p className="text-2xl font-bold text-orange-700">₹{stats.pendingAmount.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
            <input
              type="text"
              placeholder="Search by unit or district name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-textMuted" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-3 py-2 border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Declined">Declined</option>
            </select>
          </div>
          
          {/* District Filter */}
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="px-3 py-2 border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[160px]"
          >
            <option value="all">All Districts ({districts.length})</option>
            {districts.map(district => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
          
          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-textMuted flex-shrink-0" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="From"
            />
            <span className="text-textMuted">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-borderColor rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="To"
            />
          </div>
          
          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
        
        {/* Filter Results Summary */}
        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-borderColor">
            <p className="text-sm text-textMuted">
              Showing <span className="font-semibold text-textDark">{filteredPayments.length}</span> of {payments.length} payments
            </p>
          </div>
        )}
      </Card>

      {/* Pending Payments */}
      {groupedPayments.pending.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-textDark mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-warning"></span>
            Pending Payments ({groupedPayments.pending.length})
          </h2>
          <div className="space-y-3">
            {groupedPayments.pending.map((payment) => (
              <Card key={payment.id} className="bg-warning/5 border-warning/20 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-bold text-textDark">{payment.unit_name}</h3>
                      <Badge variant="warning">Pending</Badge>
                      <Badge variant="light" className="text-xs">{payment.district_name}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                      <span className="text-textMuted">
                        Amount: <span className="font-semibold text-primary">₹{payment.amount?.toLocaleString('en-IN')}</span>
                      </span>
                      <span className="text-textMuted">
                        Individual: <span className="font-medium">{payment.individual_events_count || 0}</span>
                      </span>
                      <span className="text-textMuted">
                        Group: <span className="font-medium">{payment.group_events_count || 0}</span>
                      </span>
                    </div>
                    {payment.created_on && (
                      <p className="text-xs text-textMuted mt-2">
                        Submitted: {new Date(payment.created_on).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {payment.proof_file_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(getProofUrl(payment.proof_file_url), '_blank')}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Proof
                      </Button>
                    )}
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => openDialog(payment, 'approve')}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => openDialog(payment, 'decline')}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Decline
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Approved Payments */}
      {groupedPayments.approved.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-textDark mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-success"></span>
            Approved Payments ({groupedPayments.approved.length})
          </h2>
          <div className="space-y-3">
            {groupedPayments.approved.map((payment) => (
              <Card key={payment.id} className="bg-success/5 border-success/20 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-textDark">{payment.unit_name}</h3>
                      <Badge variant="success">Approved</Badge>
                      <Badge variant="light" className="text-xs">{payment.district_name}</Badge>
                    </div>
                    <p className="text-sm text-textMuted">
                      ₹{payment.amount?.toLocaleString('en-IN')} • {(payment.individual_events_count || 0) + (payment.group_events_count || 0)} events
                    </p>
                    {payment.approved_at && (
                      <p className="text-xs text-textMuted mt-1">
                        Approved: {new Date(payment.approved_at).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                  {payment.proof_file_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(getProofUrl(payment.proof_file_url), '_blank')}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Proof
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Declined Payments */}
      {groupedPayments.declined.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-textDark mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-danger"></span>
            Declined Payments ({groupedPayments.declined.length})
          </h2>
          <div className="space-y-3">
            {groupedPayments.declined.map((payment) => (
              <Card key={payment.id} className="bg-danger/5 border-danger/20 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-textDark">{payment.unit_name}</h3>
                      <Badge variant="danger">Declined</Badge>
                      <Badge variant="light" className="text-xs">{payment.district_name}</Badge>
                    </div>
                    <p className="text-sm text-textMuted">₹{payment.amount?.toLocaleString('en-IN')}</p>
                    {payment.decline_reason && (
                      <p className="text-sm text-danger mt-1">Reason: {payment.decline_reason}</p>
                    )}
                    {payment.declined_at && (
                      <p className="text-xs text-textMuted mt-1">
                        Declined: {new Date(payment.declined_at).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredPayments.length === 0 && (
        <Card className="text-center py-12">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          {hasActiveFilters ? (
            <>
              <p className="text-textMuted mb-2">No payments match your filters</p>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </>
          ) : (
            <p className="text-textMuted">No payment submissions yet</p>
          )}
        </Card>
      )}

      {/* Confirmation Dialog - Using Portal to render at body level */}
      {showDialog && selectedPayment && (
        <Portal>
          <div className="fixed inset-0 bg-black/35 backdrop-blur z-[100] transition-opacity" onClick={() => setShowDialog(false)} aria-hidden="true" />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full pointer-events-auto animate-slide-in">
              <div className="p-6">
                <h3 className="text-xl font-bold text-textDark mb-4">
                  {actionType === 'approve' ? 'Approve Payment' : 'Decline Payment'}
                </h3>
                
                <div className="mb-4 p-3 bg-bgLight rounded-lg">
                  <p className="text-sm text-textMuted mb-1">
                    Unit: <span className="font-semibold text-textDark">{selectedPayment.unit_name}</span>
                  </p>
                  <p className="text-sm text-textMuted mb-1">
                    District: <span className="font-semibold text-textDark">{selectedPayment.district_name}</span>
                  </p>
                  <p className="text-sm text-textMuted">
                    Amount: <span className="font-semibold text-primary">₹{selectedPayment.amount?.toLocaleString('en-IN')}</span>
                  </p>
                </div>

                {actionType === 'decline' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-textDark mb-2">
                      Reason for Declining <span className="text-danger">*</span>
                    </label>
                    <textarea
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      className="w-full px-3 py-2 border border-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-danger/20 resize-none"
                      rows={3}
                      placeholder="Enter reason..."
                      required
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => {
                    setShowDialog(false);
                    setDeclineReason('');
                  }}>
                    Cancel
                  </Button>
                  <Button
                    variant={actionType === 'approve' ? 'success' : 'danger'}
                    onClick={handleAction}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Decline'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};
