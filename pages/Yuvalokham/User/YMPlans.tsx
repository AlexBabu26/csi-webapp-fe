import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertCircle, Upload, X, CheckCircle, Timer, AlertTriangle } from 'lucide-react';
import { Card, Button, Skeleton } from '../../../components/ui';
import { useToast } from '../../../components/Toast';
import {
  useYMPlans,
  useYMSubscribe,
  useYMActiveSubscription,
  useYMQrCode,
  useYMSubmitPayment,
} from '../../../hooks/queries';
import { YMPlan } from '../../../types';

const PAYMENT_TIMEOUT_SECONDS = 180; // 3 minutes

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export const YMPlans: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const { data: plans, isLoading, isError } = useYMPlans();
  const { data: activeSub, refetch: refetchActiveSub } = useYMActiveSubscription();
  const { data: qrData } = useYMQrCode();
  const subscribeMutation = useYMSubscribe();
  const submitPayment = useYMSubmitPayment();

  const hasPendingSub = activeSub?.status === 'pending_payment';

  // Payment modal state -- tracks the selected plan, NOT a subscription yet
  const [selectedPlan, setSelectedPlan] = useState<YMPlan | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [timeLeft, setTimeLeft] = useState(PAYMENT_TIMEOUT_SECONDS);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const closeModal = useCallback(() => {
    setSelectedPlan(null);
    setProofFile(null);
    setTimeLeft(PAYMENT_TIMEOUT_SECONDS);
    setPaymentSuccess(false);
    setIsSubmitting(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!selectedPlan || paymentSuccess) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          closeModal();
          addToast('Payment time expired. Please try again.', 'warning');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [selectedPlan, paymentSuccess, closeModal, addToast]);

  const handleSubscribeClick = (plan: YMPlan) => {
    if (!qrData?.qr_image_url) {
      addToast('Payment QR code is not available. Please contact the admin.', 'error');
      return;
    }
    // Only open the modal -- no API call yet
    setSelectedPlan(plan);
    setTimeLeft(PAYMENT_TIMEOUT_SECONDS);
    setProofFile(null);
    setPaymentSuccess(false);
    setIsSubmitting(false);
  };

  const handleSubmitProof = async () => {
    if (!selectedPlan || !proofFile) return;

    setIsSubmitting(true);
    try {
      // Step 1: Create subscription
      const sub: any = await new Promise((resolve, reject) => {
        subscribeMutation.mutate(selectedPlan.id, {
          onSuccess: resolve,
          onError: reject,
        });
      });

      const subId = sub?.id;
      if (!subId) throw new Error('Failed to create subscription');

      // Step 2: Upload payment proof
      await new Promise<void>((resolve, reject) => {
        submitPayment.mutate(
          { subscriptionId: subId, proof: proofFile },
          { onSuccess: () => resolve(), onError: reject },
        );
      });

      // Both succeeded
      setPaymentSuccess(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      refetchActiveSub();
    } catch (err: any) {
      const msg = err?.message || 'Payment submission failed. Please try again.';
      addToast(typeof msg === 'string' ? msg : 'Payment submission failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <div className="text-center py-8">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-textDark font-medium">Failed to load plans</p>
          <p className="text-textMuted text-sm mt-1">Please try refreshing the page.</p>
        </div>
      </Card>
    );
  }

  const timerWarning = timeLeft <= 30;
  const timerProgress = (timeLeft / PAYMENT_TIMEOUT_SECONDS) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-textDark">Subscription Plans</h1>
        <p className="text-textMuted mt-1">Choose a plan to start your Yuvalokham subscription.</p>
      </div>

      {hasPendingSub && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Pending subscription exists</p>
            <p className="text-sm text-amber-700 mt-0.5">
              You already have a subscription awaiting payment.{' '}
              <button
                onClick={() => navigate('/yuvalokham/user/payments')}
                className="underline font-medium hover:text-amber-900"
              >
                View payments
              </button>
            </p>
          </div>
        </div>
      )}

      {!plans || plans.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-textMuted">No plans available at the moment.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan: YMPlan) => (
            <div
              key={plan.id}
              className="bg-white rounded-lg border border-borderColor shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
            >
              <div className="bg-primary/5 px-6 pt-6 pb-4">
                <h3 className="text-lg font-semibold text-textDark">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-bold text-primary">₹{parseFloat(plan.price).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-textMuted mt-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{plan.duration_months} month{plan.duration_months !== 1 ? 's' : ''}</span>
                </div>
              </div>

              <div className="px-6 py-4 flex-1 flex flex-col">
                {plan.description && (
                  <p className="text-sm text-textMuted mb-4 flex-1">{plan.description}</p>
                )}
                {!plan.description && <div className="flex-1" />}

                <Button
                  className="w-full"
                  onClick={() => handleSubscribeClick(plan)}
                  disabled={hasPendingSub}
                >
                  {hasPendingSub ? 'Payment Pending' : 'Subscribe'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment QR Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
            {/* Header with timer */}
            <div className="bg-primary px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold">Complete Payment</h3>
                <p className="text-white/80 text-xs mt-0.5">{selectedPlan.name} — ₹{parseFloat(selectedPlan.price).toLocaleString('en-IN')}</p>
              </div>
              {!paymentSuccess && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-mono font-bold ${
                  timerWarning ? 'bg-red-500 text-white animate-pulse' : 'bg-white/20 text-white'
                }`}>
                  <Timer size={14} />
                  {formatTime(timeLeft)}
                </div>
              )}
              <button
                onClick={closeModal}
                className="p-1 rounded-md hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Timer progress bar */}
            {!paymentSuccess && (
              <div className="h-1 bg-gray-100">
                <div
                  className={`h-full transition-all duration-1000 ease-linear ${timerWarning ? 'bg-red-500' : 'bg-primary'}`}
                  style={{ width: `${timerProgress}%` }}
                />
              </div>
            )}

            {paymentSuccess ? (
              /* Success state */
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-lg font-semibold text-textDark">Payment Proof Submitted!</h4>
                <p className="text-sm text-textMuted mt-2">
                  Your payment is under review. You will be notified once the admin approves it.
                </p>
                <Button
                  className="mt-6"
                  onClick={() => { closeModal(); navigate('/yuvalokham/user/payments'); }}
                >
                  View Payment History
                </Button>
              </div>
            ) : (
              /* QR + Upload */
              <div className="p-5 space-y-4">
                {/* QR Code */}
                <div className="text-center">
                  <p className="text-sm font-medium text-textDark mb-3">Scan QR code to pay</p>
                  <div className="inline-block bg-white border-2 border-borderColor rounded-lg p-2">
                    <img
                      src={qrData?.qr_image_url || ''}
                      alt="Payment QR Code"
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                  {qrData?.description && (
                    <p className="text-xs text-textMuted mt-2 max-w-xs mx-auto">{qrData.description}</p>
                  )}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-borderColor" />
                  <span className="text-xs text-textMuted font-medium">THEN</span>
                  <div className="flex-1 border-t border-borderColor" />
                </div>

                {/* Upload proof */}
                <div>
                  <p className="text-sm font-medium text-textDark mb-2">Upload payment proof</p>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                      proofFile
                        ? 'border-primary bg-primary/5'
                        : 'border-borderColor hover:border-primary/50 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    />
                    {proofFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle size={16} className="text-primary" />
                        <span className="text-sm text-textDark font-medium truncate max-w-[200px]">{proofFile.name}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setProofFile(null); }}
                          className="p-0.5 rounded hover:bg-gray-200 text-textMuted"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload size={20} className="mx-auto text-textMuted mb-1" />
                        <p className="text-sm text-textMuted">Click to select screenshot or PDF</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Submit */}
                <Button
                  className="w-full"
                  onClick={handleSubmitProof}
                  disabled={!proofFile || isSubmitting}
                  isLoading={isSubmitting}
                >
                  <Upload size={16} className="mr-1.5" />
                  Submit Payment Proof
                </Button>

                {timerWarning && (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-md px-3 py-2">
                    <AlertTriangle size={14} className="flex-shrink-0" />
                    Time is running out! Upload your proof quickly.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
