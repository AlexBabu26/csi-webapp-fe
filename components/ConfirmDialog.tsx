import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Button } from './ui';
import { Portal } from './Portal';

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

  // Lock body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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
    <Portal>
      {/* Backdrop - darker for better focus */}
      <div 
        className="fixed inset-0 bg-black/35 backdrop-blur z-[100] transition-opacity animate-fade-in"
        onClick={handleClose}
        aria-hidden="true"
      />
      
      {/* Dialog */}
      <div 
        className="fixed inset-0 z-[101] flex items-center justify-center p-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div 
          className="bg-white rounded-xl shadow-2xl max-w-sm w-full pointer-events-auto animate-slide-in relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 p-2 rounded-lg text-textMuted hover:text-textDark hover:bg-bgLight transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-start px-5 pt-5 pb-3">
            <div className={`flex-shrink-0 ${variantStyles.iconBg} rounded-full p-2.5 mr-3`}>
              {variantStyles.icon}
            </div>
            <div className="flex-1 pt-1">
              <h3 id="confirm-dialog-title" className="text-base font-semibold text-textDark">{title}</h3>
            </div>
          </div>

          {/* Content */}
          <div className="px-5 pb-4">
            <p className="text-sm text-textMuted leading-relaxed">{message}</p>
            
            {showRemarksField && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-textDark mb-1.5">
                  {remarksLabel}
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={remarksPlaceholder}
                  className="w-full px-3 py-2 bg-white text-textDark border border-borderColor rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none placeholder:text-textMuted"
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-borderColor">
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
    </Portal>
  );
};


