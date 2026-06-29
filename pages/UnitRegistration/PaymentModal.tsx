import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle,
  Clock,
  Upload,
  X,
  FileText,
  QrCode,
} from 'lucide-react';
import { Button } from '../../components/ui';
import { useSubmitUnitPaymentProof } from '../../hooks/queries';
import { getMediaUrl } from '../../services/http';
import {
  extractPaymentAmountFromImage,
  isPdfFile,
  preloadPaymentOcrWorker,
} from '../../utils/paymentOcr';

const TIMER_SECONDS = 4 * 60; // 4 minutes

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

interface PaymentModalProps {
  totalAmount: number;
  qrUrl: string | null;
  isPartialPayment?: boolean;
  onClose: () => void;
  onProofSubmitted: () => void;
}

type Step = 'qr' | 'upload' | 'done';

export const PaymentModal: React.FC<PaymentModalProps> = ({
  totalAmount,
  qrUrl,
  isPartialPayment = false,
  onClose,
  onProofSubmitted,
}) => {
  const [step, setStep] = useState<Step>('qr');
  const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS);
  const [timerExpired, setTimerExpired] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const detectedAmountRef = useRef<number | null>(null);
  const scanPromiseRef = useRef<Promise<void> | null>(null);

  const submitMutation = useSubmitUnitPaymentProof();

  useEffect(() => {
    preloadPaymentOcrWorker();
  }, []);

  useEffect(() => {
    if (step !== 'qr') return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setTimerExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [step]);

  const resetFileState = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsPdf(false);
    detectedAmountRef.current = null;
    scanPromiseRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const scanImageForAmount = (file: File) => {
    detectedAmountRef.current = null;
    scanPromiseRef.current = extractPaymentAmountFromImage(file)
      .then((amount) => {
        detectedAmountRef.current = amount;
      })
      .catch(() => {
        detectedAmountRef.current = null;
      });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File must be under 5 MB');
      return;
    }

    setSelectedFile(file);
    const pdf = isPdfFile(file);
    setIsPdf(pdf);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
      scanImageForAmount(file);
    } else {
      setPreviewUrl(null);
      detectedAmountRef.current = null;
      scanPromiseRef.current = null;
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    if (scanPromiseRef.current) {
      await scanPromiseRef.current;
    }

    submitMutation.mutate(
      {
        file: selectedFile,
        detectedAmount: isPdf ? undefined : detectedAmountRef.current,
      },
      {
        onSuccess: () => {
          setStep('done');
        },
      },
    );
  };

  const resetTimer = () => {
    setSecondsLeft(TIMER_SECONDS);
    setTimerExpired(false);
  };

  const timerColor =
    secondsLeft <= 60 ? 'text-danger' : secondsLeft <= 120 ? 'text-warning' : 'text-primary';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-borderColor">
          <h2 className="text-lg font-bold text-textDark">
            {step === 'qr' && 'Scan & Pay'}
            {step === 'upload' && 'Upload Payment Proof'}
            {step === 'done' && 'Submission Received'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-bgLight text-textMuted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {step === 'qr' && (
            <>
              <div className="text-center">
                <p className="text-sm text-textMuted">
                  {isPartialPayment ? 'Remaining balance to pay' : 'Amount to pay'}
                </p>
                <p className="text-3xl font-bold text-primary mt-1">₹{totalAmount}</p>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${timerColor}`} />
                  <span className={`text-2xl font-mono font-semibold ${timerColor}`}>
                    {formatTime(secondsLeft)}
                  </span>
                </div>
                {timerExpired ? (
                  <p className="text-xs text-danger">
                    Timer expired.{' '}
                    <button className="underline font-medium" onClick={resetTimer}>
                      Restart
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-textMuted">Time remaining to complete payment</p>
                )}
              </div>

              <div className="flex justify-center">
                {qrUrl ? (
                  <img
                    src={getMediaUrl(qrUrl)}
                    alt="Payment QR code"
                    className="w-52 h-52 object-contain rounded-lg border border-borderColor"
                  />
                ) : (
                  <div className="w-52 h-52 rounded-lg border-2 border-dashed border-borderColor flex flex-col items-center justify-center text-textMuted gap-2">
                    <QrCode className="w-12 h-12" />
                    <p className="text-xs text-center px-4">
                      QR code not set yet. Contact admin.
                    </p>
                  </div>
                )}
              </div>

              <p className="text-xs text-center text-textMuted">
                Scan the QR code with any UPI app (GPay, PhonePe, Paytm, etc.) and complete the
                {isPartialPayment ? ' remaining balance ' : ' payment '}
                of <strong>₹{totalAmount}</strong>.
              </p>

              <Button
                variant="primary"
                className="w-full"
                onClick={() => {
                  clearInterval(timerRef.current!);
                  setStep('upload');
                }}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                I have Paid — Upload Proof
              </Button>
            </>
          )}

          {step === 'upload' && (
            <>
              <p className="text-sm text-textMuted">
                Upload a screenshot or PDF of your payment confirmation. You can submit multiple
                proofs if your payment was split.
              </p>

              <div
                className="border-2 border-dashed border-borderColor rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/60 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-36 object-contain rounded"
                  />
                ) : selectedFile ? (
                  <FileText className="w-10 h-10 text-primary" />
                ) : (
                  <Upload className="w-10 h-10 text-textMuted" />
                )}
                <p className="text-sm font-medium text-textDark">
                  {selectedFile ? selectedFile.name : 'Click to browse file'}
                </p>
                <p className="text-xs text-textMuted">PNG, JPG, JPEG, PDF · max 5 MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {selectedFile && (
                <p className="text-xs text-textMuted text-center">
                  {(selectedFile.size / 1024).toFixed(1)} KB ·{' '}
                  <button className="underline text-primary" onClick={resetFileState}>
                    Remove
                  </button>
                </p>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep('qr')}
                  disabled={submitMutation.isPending}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  disabled={!selectedFile || submitMutation.isPending}
                  isLoading={submitMutation.isPending}
                  onClick={handleSubmit}
                >
                  Submit Proof
                </Button>
              </div>
            </>
          )}

          {step === 'done' && (
            <div className="text-center py-4 space-y-4">
              <div className="h-16 w-16 bg-success/10 rounded-full mx-auto flex items-center justify-center">
                <CheckCircle className="w-9 h-9 text-success" />
              </div>
              <div>
                <p className="font-semibold text-textDark">Proof submitted!</p>
                <p className="text-sm text-textMuted mt-1">
                  Your payment proof is under review. The registration form download will be
                  enabled once the full registration fee is approved.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  onProofSubmitted();
                  onClose();
                }}
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
