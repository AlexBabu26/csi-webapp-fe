import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  FileText,
  RotateCcw,
  Upload,
} from 'lucide-react';
import { Badge, Button } from '../../components/ui';
import { useApplicationForm, useUnitPaymentStatus } from '../../hooks/queries';
import { FeeSummary } from './components/FeeSummary';
import { PaymentModal } from './PaymentModal';
import { isRegistrationComplete } from './utils';
import { getMediaUrl } from '../../services/http';
import { formatRegistrationSeason } from '../../services/authRouting';

export const RegistrationComplete: React.FC = () => {
  const { data: formData, isLoading: formLoading } = useApplicationForm();
  const { data: paymentData, isLoading: paymentLoading, refetch: refetchPayment } =
    useUnitPaymentStatus();

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const isLoading = formLoading || paymentLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bgLight flex items-center justify-center">
        <p className="text-textMuted">Loading...</p>
      </div>
    );
  }

  if (formData && !isRegistrationComplete(formData.registration_status)) {
    return <Navigate to="/register/wizard" replace />;
  }

  const overallStatus = paymentData?.overall_status ?? 'not_submitted';
  const isPaid = overallStatus === 'approved';
  const isRejected = overallStatus === 'rejected';
  const isPending = overallStatus === 'pending';

  const totalAmount = formData?.total_amount ?? 0;
  const qrUrl = paymentData?.qr_url ?? null;

  return (
    <div className="min-h-screen bg-bgLight flex flex-col justify-center py-12 px-4">
      <div className="max-w-lg mx-auto w-full text-center">
        {/* Success icon */}
        <div className="h-16 w-16 bg-success/10 rounded-full mx-auto flex items-center justify-center mb-4">
          <CheckCircle size={36} className="text-success" />
        </div>
        <h1 className="text-2xl font-bold text-textDark">Registration Complete</h1>
        <p className="mt-2 text-sm text-textMuted">
          Your unit registration for{' '}
          {formData ? (
            <strong>{formatRegistrationSeason(formData.registration_year)}</strong>
          ) : (
            'this year'
          )}{' '}
          has been submitted successfully.
        </p>

        {formData && (
          <>
            <p className="mt-4 text-sm text-textDark">
              Unit: <strong>{formData.user_data.unit_name}</strong>
            </p>
            <p className="text-sm text-textMuted">
              Registration ID: {formData.user_data.username}
            </p>
            <div className="mt-6 text-left">
              <FeeSummary
                memberCount={formData.member_count}
                unitRegistrationFee={formData.unit_registration_fee}
                unitMemberFee={formData.unit_member_fee}
                membersAmount={formData.members_amount}
                totalAmount={formData.total_amount}
              />
            </div>
          </>
        )}

        {/* ── Payment status banner ── */}
        {isPaid && (
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-success/10 border border-success/30 px-4 py-3 text-left">
            <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
            <p className="text-sm text-success font-medium">
              Payment verified! You can now download your registration form.
            </p>
          </div>
        )}

        {isPending && (
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-warning/10 border border-warning/30 px-4 py-3 text-left">
            <Clock className="w-5 h-5 text-warning flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-textDark">Payment proof submitted</p>
              <p className="text-textMuted mt-0.5">
                Awaiting admin review. The form download will be available once approved. You can
                submit additional proofs if needed.
              </p>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="mt-4 rounded-lg bg-danger/10 border border-danger/30 px-4 py-3 text-left space-y-1">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" />
              <p className="text-sm font-medium text-danger">Payment proof rejected</p>
            </div>
            {paymentData?.latest_rejection_note && (
              <p className="text-sm text-textMuted pl-7">
                <span className="font-medium text-textDark">Reason: </span>
                {paymentData.latest_rejection_note}
              </p>
            )}
            <p className="text-xs text-textMuted pl-7">
              Please make the payment again and upload a new proof.
            </p>
          </div>
        )}

        {/* ── Submission history ── */}
        {paymentData && paymentData.submissions.length > 0 && (
          <div className="mt-4 text-left">
            <p className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-2">
              Payment submissions
            </p>
            <div className="space-y-2">
              {paymentData.submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between rounded-lg border border-borderColor bg-white px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-textMuted flex-shrink-0" />
                    <div>
                      <a
                        href={getMediaUrl(sub.file_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline text-xs"
                      >
                        View proof
                      </a>
                      <p className="text-xs text-textMuted">
                        {new Date(sub.submitted_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      sub.status === 'APPROVED'
                        ? 'success'
                        : sub.status === 'REJECTED'
                        ? 'danger'
                        : 'warning'
                    }
                  >
                    {sub.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Next steps card ── */}
        <div className="mt-6 p-4 bg-white border border-borderColor rounded-lg text-left text-sm text-textMuted">
          <div className="flex items-center gap-2 mb-2 text-textDark font-medium">
            <FileText className="w-4 h-4" />
            Next Steps
          </div>
          {isPaid ? (
            <p>
              Download your registration form and submit the hard copy to the Youth Office before
              the deadline, by post or in person.
            </p>
          ) : (
            <p>
              Pay the registration fee of <strong>₹{totalAmount}</strong> using the QR code, then
              upload the payment proof. The registration form will be available after admin
              approval.
            </p>
          )}
        </div>

        {/* ── Action buttons ── */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
          {/* Payment CTA — shown when not yet approved */}
          {!isPaid && (
            <Button
              variant="primary"
              onClick={() => setShowPaymentModal(true)}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {isRejected ? 'Re-pay & Upload Proof' : isPending ? 'Add Another Proof' : 'Pay Now'}
            </Button>
          )}

          {/* Form download — only when payment approved */}
          {isPaid && (
            <>
              <Link to="/register/form?download=1">
                <Button variant="primary">
                  <Download className="w-4 h-4 mr-2" />
                  Download Registration Form
                </Button>
              </Link>
              <Link to="/register/form">
                <Button variant="outline">Preview Form</Button>
              </Link>
            </>
          )}

          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <Link to="/unit/my-requests">
            <Button variant="outline">View My Requests</Button>
          </Link>
        </div>
      </div>

      {/* Payment modal */}
      {showPaymentModal && (
        <PaymentModal
          totalAmount={totalAmount}
          qrUrl={qrUrl}
          onClose={() => setShowPaymentModal(false)}
          onProofSubmitted={() => {
            setShowPaymentModal(false);
            refetchPayment();
          }}
        />
      )}
    </div>
  );
};
