import React, { useState, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Upload,
  FileText,
  X,
  QrCode,
  AlertCircle,
  CheckCircle,
  Image,
} from 'lucide-react';
import { Card, Button, Skeleton } from '../../../components/ui';
import { useToast } from '../../../components/Toast';
import {
  useYMQrCode,
  useYMSubmitPayment,
  useYMActiveSubscription,
} from '../../../hooks/queries';

export const YMPaymentNew: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: qrData, isLoading: qrLoading } = useYMQrCode();
  const { data: activeSub, isLoading: subLoading } = useYMActiveSubscription();
  const submitPayment = useYMSubmitPayment();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const subscriptionId = useMemo(() => {
    const paramId = searchParams.get('subscription_id');
    if (paramId) return Number(paramId);
    if (activeSub?.status === 'pending_payment') return activeSub.id;
    return null;
  }, [searchParams, activeSub]);

  const isLoading = qrLoading || subLoading;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      addToast('Please select an image or PDF file', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast('File size must be less than 5MB', 'error');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = () => {
    if (!subscriptionId) {
      addToast('No pending subscription found', 'error');
      return;
    }
    if (!selectedFile) {
      addToast('Please upload payment proof', 'error');
      return;
    }

    submitPayment.mutate(
      { subscriptionId, proof: selectedFile },
      {
        onSuccess: () => {
          addToast('Payment proof submitted successfully!');
          navigate('/yuvalokham/user/payments');
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.detail || 'Failed to submit payment';
          addToast(typeof msg === 'string' ? msg : 'Failed to submit payment', 'error');
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (!subscriptionId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-textDark">Submit Payment</h1>
        </div>
        <Card>
          <div className="text-center py-10">
            <div className="w-14 h-14 bg-bgLight rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-7 h-7 text-textMuted" />
            </div>
            <h3 className="text-lg font-medium text-textDark">No pending subscription</h3>
            <p className="text-textMuted text-sm mt-1 mb-4">
              You don't have any subscription awaiting payment.
            </p>
            <Button variant="outline" onClick={() => navigate('/yuvalokham/user/plans')}>
              Browse Plans
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-textDark">Submit Payment</h1>
        <p className="text-textMuted mt-1">Scan the QR code, make your payment, and upload proof below.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code Section */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <QrCode className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-textDark">Payment QR Code</h3>
          </div>

          {qrData?.qr_image_url ? (
            <div className="text-center">
              <div className="inline-block bg-white border border-borderColor rounded-lg p-4">
                <img
                  src={qrData.qr_image_url}
                  alt="Payment QR Code"
                  className="w-56 h-56 object-contain mx-auto"
                />
              </div>
              {qrData.description && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
                  <p className="text-sm font-medium text-blue-800 mb-1">Payment Instructions</p>
                  <p className="text-sm text-blue-700 whitespace-pre-line">{qrData.description}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <QrCode className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-textMuted text-sm">QR code not available. Please contact admin.</p>
            </div>
          )}
        </Card>

        {/* Upload Section */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Upload className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-textDark">Upload Payment Proof</h3>
          </div>

          <p className="text-sm text-textMuted mb-4">
            After making the payment, upload a screenshot or PDF receipt as proof.
          </p>

          {selectedFile ? (
            <div className="border border-borderColor rounded-lg p-4 mb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded-lg border border-borderColor"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-bgLight rounded-lg flex items-center justify-center">
                      <FileText className="w-8 h-8 text-textMuted" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-textDark truncate">{selectedFile.name}</p>
                    <p className="text-sm text-textMuted">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearFile}
                  className="p-1 hover:bg-bgLight rounded-full flex-shrink-0"
                >
                  <X className="w-5 h-5 text-textMuted" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-borderColor rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors mb-4"
            >
              <Upload className="w-10 h-10 text-textMuted mx-auto mb-3" />
              <p className="text-textDark font-medium mb-1">Click to upload</p>
              <p className="text-sm text-textMuted">PNG, JPG, or PDF (max 5MB)</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!selectedFile || submitPayment.isPending}
            isLoading={submitPayment.isPending}
          >
            <CheckCircle className="w-4 h-4 mr-1.5" />
            Submit Payment Proof
          </Button>
        </Card>
      </div>
    </div>
  );
};
