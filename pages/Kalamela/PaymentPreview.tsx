import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button } from '../../components/ui';
import { ArrowLeft, CreditCard, Upload, CheckCircle, XCircle, Printer } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';
import { FileUpload } from '../../components/FileUpload';
import { Portal } from '../../components/Portal';
import { useKalamelaPaymentPreview } from '../../hooks/queries';

export const PaymentPreview: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  // Use TanStack Query
  const { data, isLoading: loading, refetch } = useKalamelaPaymentPreview();
  
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);

  const handleCreatePayment = async () => {
    try {
      const response = await api.createKalamelaPayment();
      addToast(response.message || "Payment record created", "success");
      refetch(); // Reload to get payment ID
      setShowUploadDialog(true);
    } catch (err: any) {
      addToast(err.message || "Failed to create payment", "error");
    }
  };

  const handleUploadProof = async () => {
    if (!paymentFile || !data?.payment_id) {
      addToast("Please select a file", "warning");
      return;
    }

    try {
      setUploading(true);
      await api.uploadKalamelaPaymentProof(data.payment_id, paymentFile);
      addToast("Payment proof uploaded successfully", "success");
      setShowUploadDialog(false);
      setPaymentFile(null);
      refetch();
    } catch (err: any) {
      addToast(err.message || "Failed to upload proof", "error");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-in">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        <Card className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-full mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const isPaid = data.payment_status === 'Approved';
  const isPending = data.payment_status === 'Pending';
  const hasParticipants = data.individual_events_count > 0 || data.group_events_count > 0;

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/kalamela/official/home')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-textDark">Payment Preview</h1>
          <p className="text-sm text-textMuted mt-1">Review your registrations and complete payment</p>
        </div>
        {isPaid && (
          <Button variant="primary" size="sm" onClick={() => navigate('/kalamela/official/print')}>
            <Printer className="w-4 h-4 mr-2" />
            Print Form
          </Button>
        )}
      </div>

      {/* Payment Status */}
      {data.payment_status && (
        <Card className={`${isPaid ? 'bg-success/5 border-success/20' : isPending ? 'bg-warning/5 border-warning/20' : 'bg-danger/5 border-danger/20'}`}>
          <div className="flex items-center gap-3">
            {isPaid ? (
              <CheckCircle className="w-6 h-6 text-success flex-shrink-0" />
            ) : isPending ? (
              <Upload className="w-6 h-6 text-warning flex-shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-danger flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-semibold text-textDark">Payment Status: {data.payment_status}</p>
              {isPending && (
                <p className="text-sm text-textMuted mt-1">Your payment is under review. You'll be notified once approved.</p>
              )}
              {isPaid && (
                <p className="text-sm text-textMuted mt-1">Your payment has been approved. You can now print your registration form.</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Summary Card */}
      <Card>
        <h2 className="text-lg font-bold text-textDark mb-4">Registration Summary</h2>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-borderColor">
            <div>
              <p className="text-textDark">Individual Events</p>
              <p className="text-sm text-textMuted">{data.individual_events_count} events × Rs.50</p>
            </div>
            <p className="font-semibold text-textDark">Rs.{data.individual_event_amount}</p>
          </div>

          <div className="flex justify-between items-center pb-3 border-b border-borderColor">
            <div>
              <p className="text-textDark">Group Events</p>
              <p className="text-sm text-textMuted">{data.group_events_count} events × Rs.100</p>
            </div>
            <p className="font-semibold text-textDark">Rs.{data.group_event_amount}</p>
          </div>

          <div className="flex justify-between items-center pt-3">
            <p className="text-lg font-bold text-textDark">Total Amount</p>
            <p className="text-2xl font-bold text-primary">Rs.{data.total_amount_to_pay}</p>
          </div>
        </div>
      </Card>

      {/* Registered Events */}
      {Object.keys(data.individual_event_participations).length > 0 && (
        <Card>
          <h3 className="font-semibold text-textDark mb-3">Individual Event Registrations</h3>
          <div className="space-y-2">
            {Object.entries(data.individual_event_participations).map(([eventName, participants]) => (
              <div key={eventName} className="p-3 bg-bgLight rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-textDark">{eventName}</p>
                  <Badge variant="primary">{participants.length} participant{participants.length !== 1 ? 's' : ''}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {Object.keys(data.group_event_participations).length > 0 && (
        <Card>
          <h3 className="font-semibold text-textDark mb-3">Group Event Registrations</h3>
          <div className="space-y-2">
            {Object.entries(data.group_event_participations).map(([eventName, teams]) => (
              <div key={eventName} className="p-3 bg-bgLight rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-textDark">{eventName}</p>
                  <Badge variant="success">{teams.length} team{teams.length !== 1 ? 's' : ''}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Actions */}
      {!hasParticipants ? (
        <Card className="text-center py-12">
          <p className="text-textMuted mb-4">No participants registered yet</p>
          <Button variant="primary" size="sm" onClick={() => navigate('/kalamela/official/home')}>
            Register Participants
          </Button>
        </Card>
      ) : !data.payment_status ? (
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate('/kalamela/official/participants')}>
            View Participants
          </Button>
          <Button variant="primary" onClick={handleCreatePayment}>
            <CreditCard className="w-4 h-4 mr-2" />
            Proceed to Payment
          </Button>
        </div>
      ) : isPending ? (
        <Card className="text-center py-8 bg-warning/5 border-warning/20">
          <p className="text-textMuted">
            Your payment proof has been submitted and is under review.
          </p>
          <p className="text-sm text-textMuted mt-2">
            You'll receive a notification once it's approved.
          </p>
        </Card>
      ) : null}

      {/* Upload Dialog - Using Portal to render at body level */}
      {showUploadDialog && (
        <Portal>
          <div className="fixed inset-0 bg-black/35 backdrop-blur z-[100] transition-opacity" onClick={() => setShowUploadDialog(false)} aria-hidden="true" />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full pointer-events-auto animate-slide-in">
              <div className="p-6">
                <h3 className="text-xl font-bold text-textDark mb-4">Upload Payment Proof</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-textMuted mb-3">
                      Total Amount: <span className="font-bold text-primary">Rs.{data.total_amount_to_pay}</span>
                    </p>
                    <p className="text-sm text-textMuted mb-4">
                      Please upload a clear image or PDF of your payment receipt.
                    </p>
                  </div>

                  <FileUpload
                    accept="image/*,application/pdf"
                    maxSize={5}
                    onFileSelect={setPaymentFile}
                    label="Select Payment Proof"
                  />

                  {paymentFile && (
                    <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                      <p className="text-sm font-medium text-textDark">{paymentFile.name}</p>
                      <p className="text-xs text-textMuted mt-1">
                        {(paymentFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => {
                      setShowUploadDialog(false);
                      setPaymentFile(null);
                    }}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleUploadProof}
                      disabled={!paymentFile || uploading}
                    >
                      {uploading ? 'Uploading...' : 'Upload Proof'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};


