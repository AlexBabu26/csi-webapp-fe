import { formatDateTimeIST } from '../../utils/datetime';
import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  AlertCircle,
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
import { RegistrationPaymentLedger } from '../../components/RegistrationPaymentLedger';
import { isRegistrationComplete, hasSubmittedDeclaration } from './utils';
import { getMediaUrl } from '../../services/http';
import { formatRegistrationSeason } from '../../services/authRouting';
import { getProofPaidAmount } from '../../utils/registrationPayment';
import { UnitRemovedMembersNotice } from '../../components/UnitRemovedMembersNotice';

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

  if (formData && !hasSubmittedDeclaration(formData.registration_status)) {
    return <Navigate to="/register/wizard" replace />;
  }

  const isAdminCompleted = isRegistrationComplete(formData?.registration_status ?? 'Not Started');

  const overallStatus = paymentData?.overall_status ?? 'not_submitted';
  const isPaid = overallStatus === 'approved';
  const isPartial = overallStatus === 'partial';
  const isRejected = overallStatus === 'rejected';
  const isPending = overallStatus === 'pending';

  const unitRegistrationFee = formData?.unit_registration_fee ?? 0;
  const unitMemberFee = formData?.unit_member_fee ?? 0;
  const liveMemberCount = formData?.member_count ?? 0;
  const liveTotalAmount = formData?.total_amount ?? 0;
  const snapshotMemberCount = paymentData?.registration_member_count ?? null;
  const snapshotTotalAmount = paymentData?.registration_total_amount ?? null;
  const feeMemberCount =
    snapshotMemberCount != null && snapshotMemberCount <= liveMemberCount
      ? snapshotMemberCount
      : liveMemberCount;
  const totalAmount =
    snapshotTotalAmount != null && snapshotTotalAmount <= liveTotalAmount
      ? snapshotTotalAmount
      : liveTotalAmount || snapshotTotalAmount || 0;
  const membersAmount =
    totalAmount > 0 && unitRegistrationFee >= 0
      ? Math.max(0, totalAmount - unitRegistrationFee)
      : feeMemberCount * unitMemberFee;
  const totalPaid = paymentData?.total_paid ?? 0;
  const paymentCredit = paymentData?.payment_credit ?? 0;
  const balanceDue = paymentData?.balance_due ?? 0;
  const paidAmount = isPartial && totalPaid > 0 ? totalPaid : null;
  const amountDue = isPartial && balanceDue > 0 ? balanceDue : totalAmount;
  const pendingSubmission = paymentData?.submissions.find(
    (submission) => submission.status === 'PENDING',
  );
  const hasPendingSubmission = pendingSubmission != null;
  const hasStalePendingPayment =
    pendingSubmission?.total_amount != null &&
    pendingSubmission.total_amount > totalAmount;
  const canSubmitPayment = !isPaid && (!hasPendingSubmission || hasStalePendingPayment);
  const qrUrl = paymentData?.qr_url ?? null;

  return (
    <div className="min-h-screen bg-bgLight py-12 px-4">
      <div className="max-w-2xl mx-auto w-full mb-6">
        <UnitRemovedMembersNotice />
      </div>
      <div className="max-w-lg mx-auto w-full text-center">
        {/* Success icon */}
        <div className="h-16 w-16 bg-success/10 rounded-full mx-auto flex items-center justify-center mb-4">
          <CheckCircle size={36} className="text-success" />
        </div>
        <h1 className="text-2xl font-bold text-textDark">
          {isAdminCompleted ? 'Registration Complete' : 'Declaration Submitted'}
        </h1>
        <p className="mt-2 text-sm text-textMuted">
          {isAdminCompleted ? (
            <>
              Your unit registration for{' '}
              {formData ? (
                <strong>{formatRegistrationSeason(formData.registration_year)}</strong>
              ) : (
                'this year'
              )}{' '}
              has been finalized by the admin.
            </>
          ) : (
            <>
              Your declaration for{' '}
              {formData ? (
                <strong>{formatRegistrationSeason(formData.registration_year)}</strong>
              ) : (
                'this year'
              )}{' '}
              has been submitted. Complete payment below while the admin finalizes your registration.
            </>
          )}
        </p>

        {!isAdminCompleted && (
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-left">
            <Clock className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-sm text-textDark">
              Registration will be marked complete by the admin after your payment is fully approved.
            </p>
          </div>
        )}

        {formData && (
          <>
            <p className="mt-4 text-sm text-textDark">
              Unit: <strong>{formData.user_data.unit_name}</strong>
            </p>
            <p className="text-sm text-textMuted">
              Registration ID: {formData.user_data.username}
            </p>
            <div className="mt-6 text-left space-y-4">
              <FeeSummary
                memberCount={feeMemberCount}
                unitRegistrationFee={unitRegistrationFee}
                unitMemberFee={unitMemberFee}
                membersAmount={membersAmount}
                totalAmount={totalAmount}
              />
              {(totalPaid > 0 || totalAmount > 0) && (
                <RegistrationPaymentLedger
                  data={{
                    memberCount: snapshotMemberCount ?? feeMemberCount,
                    feeOwed: totalAmount,
                    totalPaid,
                    balanceDue,
                    paymentCredit,
                  }}
                />
              )}
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

        {isPaid && paymentCredit > 0 && (
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-left">
            <CreditCard className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-sm text-textDark">
              You have <strong>₹{paymentCredit}</strong> in prepaid credit from prior payments.
              This will apply automatically if members are added during the season.
            </p>
          </div>
        )}

        {isPartial && balanceDue > 0 && (
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-warning/10 border border-warning/30 px-4 py-3 text-left">
            <Clock className="w-5 h-5 text-warning flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-textDark">Partial payment approved</p>
              {paidAmount != null && (
                <p className="text-textMuted mt-0.5">
                  Paid so far: <strong>₹{paidAmount}</strong> of <strong>₹{totalAmount}</strong>
                </p>
              )}
              <p className="text-textMuted mt-0.5">
                Remaining to pay: <strong>₹{balanceDue}</strong>. Pay the remaining amount and
                upload another proof to complete registration.
              </p>
            </div>
          </div>
        )}

        {(isPending || (isPartial && hasPendingSubmission)) && !hasStalePendingPayment && (
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-warning/10 border border-warning/30 px-4 py-3 text-left">
            <Clock className="w-5 h-5 text-warning flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-textDark">Payment proof submitted</p>
              <p className="text-textMuted mt-0.5">
                Awaiting admin review. The form download will be available once the full fee is
                approved. You can upload another proof after the admin approves or rejects this
                one.
              </p>
            </div>
          </div>
        )}

        {hasStalePendingPayment && (
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-left">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-textDark">Registration fee revised</p>
              <p className="text-textMuted mt-0.5">
                Your fee is now <strong>₹{totalAmount}</strong> after member updates. The proof
                submitted for ₹{pendingSubmission?.total_amount} is outdated — please upload a new
                payment proof for the revised amount.
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
              {paymentData.submissions.map((sub) => {
                const proofPaid =
                  sub.status === 'APPROVED'
                    ? getProofPaidAmount(sub, paymentData.submissions)
                    : null;
                return (
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
                        {formatDateTimeIST(sub.submitted_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
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
                    {sub.status === 'APPROVED' &&
                      proofPaid != null &&
                      sub.balance_amount != null &&
                      sub.balance_amount > 0 && (
                        <p className="text-xs text-textMuted">
                          Paid: ₹{proofPaid} · Remaining: ₹
                          {sub.balance_amount}
                        </p>
                      )}
                    {sub.status === 'APPROVED' &&
                      proofPaid != null &&
                      (sub.balance_amount == null || sub.balance_amount === 0) && (
                        <p className="text-xs text-success font-medium">
                          Paid: ₹{proofPaid} · Fully paid
                        </p>
                      )}
                    {sub.status === 'APPROVED' &&
                      proofPaid == null &&
                      (sub.balance_amount == null || sub.balance_amount === 0) && (
                        <p className="text-xs text-success font-medium">Fully paid</p>
                      )}
                  </div>
                </div>
              );
              })}
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
          ) : isPartial && balanceDue > 0 ? (
            <p>
              Pay the remaining balance of <strong>₹{balanceDue}</strong> using the QR code, then
              upload the payment proof. The registration form will be available once the full fee
              is approved.
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
          {!isPaid && canSubmitPayment && (
            <Button
              variant="primary"
              onClick={() => setShowPaymentModal(true)}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {isRejected || hasStalePendingPayment
                ? 'Re-pay & Upload Proof'
                : isPartial
                  ? 'Pay Remaining Balance'
                  : 'Pay Now'}
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

          <Link to="/unit/my-requests">
            <Button variant="outline">View My Requests</Button>
          </Link>
        </div>
      </div>

      {/* Payment modal */}
      {showPaymentModal && (
        <PaymentModal
          totalAmount={amountDue}
          qrUrl={qrUrl}
          isPartialPayment={isPartial}
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
