import React, { useState, useMemo } from 'react';
import { Card, Badge, Button } from '../../../components/ui';
import { CheckCircle, XCircle, Eye, Download, Search, Filter, Calendar, CreditCard, TrendingUp, FileText, X, User, MapPin, Hash, Clock, FileImage, Loader2 } from 'lucide-react';
import { useToast } from '../../../components/Toast';
import { Portal } from '../../../components/Portal';
import { useKalamelaPayments, useApproveKalamelaPayment, useDeclineKalamelaPayment } from '../../../hooks/queries';
import { api } from '../../../services/api';

type StatusFilter = 'all' | 'Pending' | 'Approved' | 'Declined';

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
  const { data: paymentsData, isLoading: loading, error, isError } = useKalamelaPayments();
  const approveMutation = useApproveKalamelaPayment();
  const declineMutation = useDeclineKalamelaPayment();
  
  // Log for debugging
  console.log('ManagePayments - loading:', loading, 'error:', error, 'data:', paymentsData);
  
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
  const [selectedPayment, setSelectedPayment] = useState<NormalizedPayment | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'decline'>('approve');
  const [declineReason, setDeclineReason] = useState('');
  
  // Payment Details Dialog state
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [detailsPayment, setDetailsPayment] = useState<NormalizedPayment | null>(null);
  
  // Proof modal state
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [proofPayment, setProofPayment] = useState<NormalizedPayment | null>(null);
  const [loadingProofId, setLoadingProofId] = useState<number | null>(null);

  // Open payment details dialog
  const openDetailsDialog = (payment: NormalizedPayment) => {
    setDetailsPayment(payment);
    setShowDetailsDialog(true);
  };

  // Handle viewing payment proof - fetches pre-signed URL and shows in modal
  const handleViewProof = async (payment: NormalizedPayment) => {
    if (!payment.proof_file_url) {
      addToast('No payment proof available', 'warning');
      return;
    }

    try {
      setLoadingProofId(payment.id);
      const response = await api.getFileUrl(payment.proof_file_url);
      setProofUrl(response.data.url);
      setProofPayment(payment);
      setShowProofModal(true);
    } catch (err: any) {
      addToast(err.message || 'Failed to load payment proof', 'error');
    } finally {
      setLoadingProofId(null);
    }
  };

  // Check if proof is a PDF based on file extension
  const isPdfProof = (url: string | null): boolean => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes('.pdf') || lowerUrl.includes('application/pdf');
  };
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

  if (isError) {
    return (
      <div className="space-y-6 animate-slide-in">
        <h1 className="text-2xl font-bold text-textDark">Payment Management</h1>
        <Card className="text-center py-12 border-danger/20 bg-danger/5">
          <XCircle className="w-12 h-12 text-danger mx-auto mb-4" />
          <p className="text-danger font-semibold mb-2">Failed to load payments</p>
          <p className="text-textMuted text-sm mb-4">
            {error instanceof Error ? error.message : 'An error occurred while fetching payments'}
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProof(payment);
                        }}
                        disabled={loadingProofId === payment.id}
                      >
                        {loadingProofId === payment.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Eye className="w-4 h-4 mr-2" />
                        )}
                        {loadingProofId === payment.id ? 'Loading...' : 'View Proof'}
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
              <Card 
                key={payment.id} 
                className="bg-success/5 border-success/20 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openDetailsDialog(payment)}
              >
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
                  <div className="flex gap-2">
                    {payment.proof_file_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProof(payment);
                        }}
                        disabled={loadingProofId === payment.id}
                      >
                        {loadingProofId === payment.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Eye className="w-4 h-4 mr-2" />
                        )}
                        {loadingProofId === payment.id ? 'Loading...' : 'View Proof'}
                      </Button>
                    )}
                    <Button
                      variant="light"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetailsDialog(payment);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Details
                    </Button>
                  </div>
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
              <Card 
                key={payment.id} 
                className="bg-danger/5 border-danger/20 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openDetailsDialog(payment)}
              >
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
                  <div className="flex gap-2">
                    {payment.proof_file_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProof(payment);
                        }}
                        disabled={loadingProofId === payment.id}
                      >
                        {loadingProofId === payment.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Eye className="w-4 h-4 mr-2" />
                        )}
                        {loadingProofId === payment.id ? 'Loading...' : 'View Proof'}
                      </Button>
                    )}
                    <Button
                      variant="light"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetailsDialog(payment);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Details
                    </Button>
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

      {/* Payment Details Dialog */}
      {showDetailsDialog && detailsPayment && (
        <Portal>
          <div 
            className="fixed inset-0 bg-black/35 backdrop-blur z-[100] transition-opacity" 
            onClick={() => setShowDetailsDialog(false)} 
            aria-hidden="true" 
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full pointer-events-auto animate-slide-in max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className={`p-5 border-b ${
                detailsPayment.status === 'Approved' 
                  ? 'bg-gradient-to-r from-success/10 to-success/5' 
                  : detailsPayment.status === 'Declined'
                    ? 'bg-gradient-to-r from-danger/10 to-danger/5'
                    : 'bg-gradient-to-r from-warning/10 to-warning/5'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-textDark">Payment Details</h3>
                    <p className="text-sm text-textMuted mt-1">Payment ID: #{detailsPayment.id}</p>
                  </div>
                  <button 
                    onClick={() => setShowDetailsDialog(false)}
                    className="p-2 hover:bg-black/5 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-textMuted" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 overflow-y-auto flex-1">
                {/* Status Badge */}
                <div className="flex justify-center mb-5">
                  <Badge 
                    variant={
                      detailsPayment.status === 'Approved' 
                        ? 'success' 
                        : detailsPayment.status === 'Declined' 
                          ? 'danger' 
                          : 'warning'
                    }
                    className="text-base px-4 py-1.5"
                  >
                    {detailsPayment.status === 'Approved' && <CheckCircle className="w-4 h-4 mr-2" />}
                    {detailsPayment.status === 'Declined' && <XCircle className="w-4 h-4 mr-2" />}
                    {detailsPayment.status === 'Pending' && <Clock className="w-4 h-4 mr-2" />}
                    {detailsPayment.status}
                  </Badge>
                </div>

                {/* Unit & District Info */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="p-3 bg-bgLight rounded-lg">
                    <div className="flex items-center gap-2 text-textMuted mb-1">
                      <User className="w-4 h-4" />
                      <span className="text-xs font-medium">Unit Name</span>
                    </div>
                    <p className="font-semibold text-textDark">{detailsPayment.unit_name}</p>
                  </div>
                  <div className="p-3 bg-bgLight rounded-lg">
                    <div className="flex items-center gap-2 text-textMuted mb-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-xs font-medium">District</span>
                    </div>
                    <p className="font-semibold text-textDark">{detailsPayment.district_name}</p>
                  </div>
                </div>

                {/* Amount Card */}
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg mb-5">
                  <p className="text-sm text-textMuted mb-1">Total Amount</p>
                  <p className="text-3xl font-bold text-primary">₹{detailsPayment.amount?.toLocaleString('en-IN')}</p>
                </div>

                {/* Event Breakdown */}
                <div className="mb-5">
                  <h4 className="text-sm font-semibold text-textDark mb-3">Event Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-bgLight rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-textDark">Individual Events</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-textDark">{detailsPayment.individual_events_count || 0}</span>
                        <span className="text-xs text-textMuted ml-2">× ₹50 = ₹{(detailsPayment.individual_events_count || 0) * 50}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-bgLight rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                          <Hash className="w-4 h-4 text-success" />
                        </div>
                        <span className="text-textDark">Group Events</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-textDark">{detailsPayment.group_events_count || 0}</span>
                        <span className="text-xs text-textMuted ml-2">× ₹100 = ₹{(detailsPayment.group_events_count || 0) * 100}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline / Dates */}
                <div className="mb-5">
                  <h4 className="text-sm font-semibold text-textDark mb-3">Timeline</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <div className="flex-1">
                        <p className="text-sm text-textDark">Submitted</p>
                        <p className="text-xs text-textMuted">
                          {detailsPayment.created_on 
                            ? new Date(detailsPayment.created_on).toLocaleString('en-IN', {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                              })
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>
                    {detailsPayment.approved_at && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-success"></div>
                        <div className="flex-1">
                          <p className="text-sm text-textDark">Approved</p>
                          <p className="text-xs text-textMuted">
                            {new Date(detailsPayment.approved_at).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                    {detailsPayment.declined_at && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-danger"></div>
                        <div className="flex-1">
                          <p className="text-sm text-textDark">Declined</p>
                          <p className="text-xs text-textMuted">
                            {new Date(detailsPayment.declined_at).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Decline Reason */}
                {detailsPayment.decline_reason && (
                  <div className="mb-5 p-4 bg-danger/5 border border-danger/20 rounded-lg">
                    <h4 className="text-sm font-semibold text-danger mb-2">Decline Reason</h4>
                    <p className="text-sm text-textDark">{detailsPayment.decline_reason}</p>
                  </div>
                )}

                {/* Payment Proof */}
                {detailsPayment.proof_file_url && (
                  <div>
                    <h4 className="text-sm font-semibold text-textDark mb-3">Payment Proof</h4>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleViewProof(detailsPayment)}
                      disabled={loadingProofId === detailsPayment.id}
                    >
                      {loadingProofId === detailsPayment.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <FileImage className="w-4 h-4 mr-2" />
                      )}
                      {loadingProofId === detailsPayment.id ? 'Loading...' : 'View Payment Proof'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t bg-bgLight">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowDetailsDialog(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Payment Proof Modal */}
      {showProofModal && proofUrl && (
        <Portal>
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] transition-opacity" 
            onClick={() => {
              setShowProofModal(false);
              setProofUrl(null);
              setProofPayment(null);
            }} 
            aria-hidden="true" 
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] pointer-events-auto animate-slide-in flex flex-col">
              {/* Header */}
              <div className="p-4 border-b flex items-center justify-between bg-bgLight rounded-t-xl">
                <div>
                  <h3 className="text-lg font-bold text-textDark">Payment Proof</h3>
                  {proofPayment && (
                    <p className="text-sm text-textMuted">
                      {proofPayment.unit_name} • ₹{proofPayment.amount?.toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(proofUrl, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Open in New Tab
                  </Button>
                  <button 
                    onClick={() => {
                      setShowProofModal(false);
                      setProofUrl(null);
                      setProofPayment(null);
                    }}
                    className="p-2 hover:bg-black/5 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-textMuted" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-4 bg-gray-100 flex items-center justify-center min-h-[400px]">
                {isPdfProof(proofPayment?.proof_file_url || proofUrl) ? (
                  <iframe
                    src={proofUrl}
                    className="w-full h-full min-h-[500px] rounded-lg border border-borderColor"
                    title="Payment Proof PDF"
                  />
                ) : (
                  <img
                    src={proofUrl}
                    alt="Payment Proof"
                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                    onError={(e) => {
                      // If image fails to load, show error message
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement?.insertAdjacentHTML(
                        'beforeend',
                        '<div class="text-center p-8"><p class="text-danger">Failed to load image</p><p class="text-sm text-textMuted mt-2">Try opening in a new tab</p></div>'
                      );
                    }}
                  />
                )}
              </div>

              {/* Footer with payment info */}
              {proofPayment && (
                <div className="p-4 border-t bg-bgLight rounded-b-xl">
                  <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-textMuted">
                        District: <span className="font-medium text-textDark">{proofPayment.district_name}</span>
                      </span>
                      <span className="text-textMuted">
                        Individual: <span className="font-medium text-textDark">{proofPayment.individual_events_count}</span>
                      </span>
                      <span className="text-textMuted">
                        Group: <span className="font-medium text-textDark">{proofPayment.group_events_count}</span>
                      </span>
                    </div>
                    <Badge 
                      variant={
                        proofPayment.status === 'Approved' 
                          ? 'success' 
                          : proofPayment.status === 'Declined' 
                            ? 'danger' 
                            : 'warning'
                      }
                    >
                      {proofPayment.status}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};
