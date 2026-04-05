import React, { useState, useRef, useEffect } from 'react';
import { QrCode, Upload, Save, AlertTriangle } from 'lucide-react';
import { Card, Button, Skeleton } from '../../../components/ui';
import { useYMAdminQrSettings, useYMAdminUpdateQrSettings } from '../../../hooks/queries';
import { useToast } from '../../../components/Toast';

export const YMQRSettings: React.FC = () => {
  const { addToast } = useToast();
  const { data: settings, isLoading, error } = useYMAdminQrSettings();
  const updateSettings = useYMAdminUpdateQrSettings();

  const [description, setDescription] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const selectedFile = useRef<File | null>(null);

  useEffect(() => {
    if (settings) {
      setDescription(settings.description ?? '');
    }
  }, [settings]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      selectedFile.current = file;
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSave = () => {
    const data: { qr_image?: File; description?: string } = {};

    if (selectedFile.current) {
      data.qr_image = selectedFile.current;
    }
    if (description !== (settings?.description ?? '')) {
      data.description = description;
    }

    if (!data.qr_image && data.description === undefined) {
      addToast('No changes to save', 'info');
      return;
    }

    updateSettings.mutate(data, {
      onSuccess: () => {
        addToast('QR settings updated', 'success');
        selectedFile.current = null;
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
      },
      onError: () => addToast('Failed to update settings', 'error'),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-textDark">QR Settings</h1>
        <Card>
          <Skeleton className="h-64 w-64 mx-auto mb-4" />
          <Skeleton className="h-10 w-full mb-3" />
          <Skeleton className="h-10 w-32" />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-textDark">QR Settings</h1>
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          Failed to load QR settings.
        </div>
      </div>
    );
  }

  const displayUrl = previewUrl || settings?.qr_image_url;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-textDark">QR Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code preview */}
        <Card>
          <h2 className="text-lg font-semibold text-textDark mb-4">Current QR Code</h2>
          <div className="flex items-center justify-center p-6 bg-gray-50 border border-borderColor rounded-lg mb-4">
            {displayUrl ? (
              <img
                src={displayUrl}
                alt="QR Code"
                className="max-w-[280px] max-h-[280px] object-contain rounded"
              />
            ) : (
              <div className="flex flex-col items-center text-textMuted py-8">
                <QrCode size={48} className="mb-2 text-gray-300" />
                <p className="text-sm">No QR code uploaded yet</p>
              </div>
            )}
          </div>

          {previewUrl && (
            <p className="text-xs text-textMuted text-center mb-2">
              Preview — save to apply changes
            </p>
          )}

          {/* Upload */}
          <div>
            <label className="block text-sm font-medium text-textDark mb-1.5">
              Upload New QR Image
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm text-textDark file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
          </div>
        </Card>

        {/* Description / Instructions */}
        <Card>
          <h2 className="text-lg font-semibold text-textDark mb-4">Payment Instructions</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-textDark mb-1.5">
              Description / Instructions
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
              placeholder="Enter payment instructions shown alongside the QR code..."
              className="w-full px-3 py-2.5 text-sm border border-borderColor rounded-md bg-white text-textDark placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <Button onClick={handleSave} isLoading={updateSettings.isPending}>
            <Save size={16} className="mr-1.5" /> Save Changes
          </Button>
        </Card>
      </div>
    </div>
  );
};
