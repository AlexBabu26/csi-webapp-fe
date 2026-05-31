import React, { useEffect, useState } from 'react';
import { Card, Button } from '../../components/ui';
import { CreditCard, Save, Upload } from 'lucide-react';
import { getMediaUrl } from '../../services/http';
import {
  useSiteSettings,
  useUpdateSiteSettings,
  useUploadPaymentQr,
} from '../../hooks/queries';
import { SiteSettingsUpdate } from '../../types';

export const PaymentSettings: React.FC = () => {
  const { data: settings, isLoading } = useSiteSettings();
  const updateSettingsMutation = useUpdateSiteSettings();
  const uploadQrMutation = useUploadPaymentQr();

  const [fees, setFees] = useState({ unit_registration_fee: 100, unit_member_fee: 10 });
  const [qrFile, setQrFile] = useState<File | null>(null);

  useEffect(() => {
    if (settings) {
      setFees({
        unit_registration_fee: settings.unit_registration_fee ?? 100,
        unit_member_fee: settings.unit_member_fee ?? 10,
      });
    }
  }, [settings]);

  const handleSaveFees = () => {
    const payload: SiteSettingsUpdate = {
      unit_registration_fee: fees.unit_registration_fee,
      unit_member_fee: fees.unit_member_fee,
    };
    updateSettingsMutation.mutate(payload);
  };

  const handleQrUpload = () => {
    if (!qrFile) return;
    uploadQrMutation.mutate(qrFile, {
      onSuccess: () => setQrFile(null),
    });
  };

  const qrPreviewUrl = settings?.payment_qr_url ? getMediaUrl(settings.payment_qr_url) : null;

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-textMuted">Loading payment settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="text-2xl font-bold text-textDark">Payment Settings</h1>
        <p className="text-sm text-textMuted mt-1">
          Configure the UPI QR code and registration fee amounts shown to units during registration.
        </p>
      </div>

      <Card>
        <h2 className="text-base font-semibold text-textDark mb-1 flex items-center gap-2">
          <Upload className="w-4 h-4 text-primary" />
          Payment QR Code
        </h2>
        <p className="text-sm text-textMuted mb-4">
          This QR is displayed on the unit registration payment screen and payment modal.
        </p>

        {qrPreviewUrl ? (
          <div className="mb-4 inline-block rounded-lg border border-borderColor bg-white p-3">
            <p className="text-xs font-medium text-textMuted mb-2">Current QR</p>
            <img
              src={qrPreviewUrl}
              alt="Payment QR code"
              className="max-w-[220px] max-h-[220px] object-contain"
            />
          </div>
        ) : (
          <p className="text-sm text-warning mb-4">No payment QR uploaded yet.</p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            id="payment-qr-upload"
            className="hidden"
            onChange={(e) => setQrFile(e.target.files?.[0] ?? null)}
          />
          <label
            htmlFor="payment-qr-upload"
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md border border-borderColor text-sm font-medium text-textDark hover:bg-bgLight transition-colors"
          >
            <Upload className="w-4 h-4" />
            {qrFile ? qrFile.name : qrPreviewUrl ? 'Replace QR Image' : 'Choose QR Image'}
          </label>
          {qrFile && (
            <Button
              size="sm"
              variant="primary"
              isLoading={uploadQrMutation.isPending}
              onClick={handleQrUpload}
            >
              Upload QR
            </Button>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-textDark mb-1 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary" />
          Registration Fee Amounts (INR)
        </h2>
        <p className="text-sm text-textMuted mb-4">
          Used in the registration wizard, declaration, and payment total. Total = unit fee + (member count × per-member fee).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-textDark mb-1">Unit Registration Fee</label>
            <input
              type="number"
              min={0}
              value={fees.unit_registration_fee}
              onChange={(e) =>
                setFees({ ...fees, unit_registration_fee: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border border-borderColor rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textDark mb-1">Fee Per Member</label>
            <input
              type="number"
              min={0}
              value={fees.unit_member_fee}
              onChange={(e) =>
                setFees({ ...fees, unit_member_fee: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border border-borderColor rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>
        <div className="mt-4">
          <Button
            variant="primary"
            onClick={handleSaveFees}
            isLoading={updateSettingsMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Fee Amounts
          </Button>
        </div>
      </Card>
    </div>
  );
};
