import React, { useState } from 'react';
import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Button } from './ui';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (remarks?: string) => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  showRemarksField?: boolean;
  remarksLabel?: string;
  remarksPlaceholder?: string;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  showRemarksField = false,
  remarksLabel = 'Remarks',
  remarksPlaceholder = 'Enter remarks...',
  isLoading = false,
}) => {
  const [remarks, setRemarks] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(showRemarksField ? remarks : undefined);
    setRemarks('');
  };

  const handleClose = () => {
    setRemarks('');
    onClose();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-danger" />,
          iconBg: 'bg-red-100',
          confirmButton: 'danger',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-warning" />,
          iconBg: 'bg-yellow-100',
          confirmButton: 'primary',
        };
      case 'success':
        return {
          icon: <CheckCircle className="w-6 h-6 text-success" />,
          iconBg: 'bg-green-100',
          confirmButton: 'primary',
        };
      default:
        return {
          icon: <Info className="w-6 h-6 text-primary" />,
          iconBg: 'bg-blue-100',
          confirmButton: 'primary',
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-textDark/50 backdrop-blur-sm z-50 transition-opacity animate-fade-in"
        onClick={handleClose}
      />
      
      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-lg shadow-xl max-w-md w-full pointer-events-auto animate-slide-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start p-6 pb-4">
            <div className={`flex-shrink-0 ${variantStyles.iconBg} rounded-full p-3 mr-4`}>
              {variantStyles.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-textDark">{title}</h3>
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-1 rounded-md hover:bg-bgLight transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-textMuted" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-4">
            <p className="text-textMuted">{message}</p>
            
            {showRemarksField && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-textDark mb-2">
                  {remarksLabel}
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={remarksPlaceholder}
                  className="w-full px-3 py-2 border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-lg">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              variant={variantStyles.confirmButton as any}
              size="sm"
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};


