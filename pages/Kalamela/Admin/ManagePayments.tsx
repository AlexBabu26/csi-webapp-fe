import React, { useEffect, useState } from 'react';
import { Card, Badge, Button } from '../../../components/ui';
import { CheckCircle, XCircle, Eye, Download } from 'lucide-react';
import { useToast } from '../../../components/Toast';
import { api } from '../../../services/api';
import { ConfirmDialog } from '../../../components/ConfirmDialog';

export const ManagePayments: React.FC = () => {
  const { addToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'decline'>('approve');
  const [declineReason, setDeclineReason] = useState('');
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await api.getKalamelaAdminPayments();
      setPayments(response.data);
    } catch (err) {
      addToast("Failed to load payments", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedPayment) return;

    if (actionType === 'decline' && !declineReason.trim()) {
      addToast("Please provide a reason for declining", "warning");
      return;
    }

    try {
      setSubmitting(true);
      if (actionType === 'approve') {
        await api.approveKalamelaPayment(selectedPayment.payment_id);
        addToast("Payment approved successfully", "success");
      } else {
        await api.declineKalamelaPayment(selectedPayment.payment_id, declineReason);
        addToast("Payment declined", "success");
      }
      setShowDialog(false);
      setSelectedPayment(null);
      setDeclineReason('');
      loadPayments();
    } catch (err: any) {
      addToast(err.message || "Failed to process payment", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openDialog = (payment: any, action: 'approve' | 'decline') => {
    setSelectedPayment(payment);
    setActionType(action);
    setShowDialog(true);
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

  const pendingPayments = payments.filter(p => p.status === 'Pending');
  const approvedPayments = payments.filter(p => p.status === 'Approved');
  const declinedPayments = payments.filter(p => p.status === 'Declined');

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-textDark tracking-tight">
          Payment Management
        </h1>
        <p className="mt-1 text-sm text-textMuted">
          Review and approve unit payment submissions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-textMuted mb-2">Pending Review</p>
          <p className="text-3xl font-bold text-warning">{pendingPayments.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-textMuted mb-2">Approved</p>
          <p className="text-3xl font-bold text-success">{approvedPayments.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-textMuted mb-2">Declined</p>
          <p className="text-3xl font-bold text-danger">{declinedPayments.length}</p>
        </Card>
      </div>

      {/* Pending Payments */}
      {pendingPayments.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-textDark mb-4">Pending Payments</h2>
          <div className="space-y-3">
            {pendingPayments.map((payment) => (
              <Card key={payment.payment_id} className="bg-warning/5 border-warning/20">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-textDark">{payment.unit_name}</h3>
                      <Badge variant="warning">Pending</Badge>
                    </div>
                    <p className="text-sm text-textMuted">{payment.district_name}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm text-textMuted">
                        Amount: <span className="font-semibold text-primary">Rs.{payment.amount}</span>
                      </span>
                      <span className="text-sm text-textMuted">
                        Events: {payment.individual_events_count} Individual, {payment.group_events_count} Group
                      </span>
                    </div>
                    {payment.submitted_at && (
                      <p className="text-xs text-textMuted mt-1">
                        Submitted: {new Date(payment.submitted_at).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {payment.proof_file_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(payment.proof_file_url, '_blank')}
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
      {approvedPayments.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-textDark mb-4">Approved Payments</h2>
          <div className="space-y-3">
            {approvedPayments.map((payment) => (
              <Card key={payment.payment_id} className="bg-success/5 border-success/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-textDark">{payment.unit_name}</h3>
                      <Badge variant="success">Approved</Badge>
                    </div>
                    <p className="text-sm text-textMuted">
                      Rs.{payment.amount} • {payment.individual_events_count + payment.group_events_count} events
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
                      onClick={() => window.open(payment.proof_file_url, '_blank')}
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
      {declinedPayments.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-textDark mb-4">Declined Payments</h2>
          <div className="space-y-3">
            {declinedPayments.map((payment) => (
              <Card key={payment.payment_id} className="bg-danger/5 border-danger/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-textDark">{payment.unit_name}</h3>
                      <Badge variant="danger">Declined</Badge>
                    </div>
                    <p className="text-sm text-textMuted">Rs.{payment.amount}</p>
                    {payment.decline_reason && (
                      <p className="text-sm text-danger mt-1">Reason: {payment.decline_reason}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {payments.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-textMuted">No payment submissions yet</p>
        </Card>
      )}

      {/* Confirmation Dialog */}
      {showDialog && selectedPayment && (
        <>
          <div className="fixed inset-0 bg-textDark/50 backdrop-blur-sm z-50" onClick={() => setShowDialog(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full pointer-events-auto animate-slide-in">
              <div className="p-6">
                <h3 className="text-xl font-bold text-textDark mb-4">
                  {actionType === 'approve' ? 'Approve Payment' : 'Decline Payment'}
                </h3>
                
                <div className="mb-4">
                  <p className="text-sm text-textMuted mb-2">
                    Unit: <span className="font-semibold text-textDark">{selectedPayment.unit_name}</span>
                  </p>
                  <p className="text-sm text-textMuted">
                    Amount: <span className="font-semibold text-primary">Rs.{selectedPayment.amount}</span>
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
                    disabled={submitting}
                  >
                    {submitting ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Decline'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};


