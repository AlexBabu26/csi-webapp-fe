import React, { useState } from 'react';
import { Download, Eye, X } from 'lucide-react';
import { Portal } from './Portal';
import { Button } from './ui';
import { useToast } from './Toast';
import {
  getProofFilename,
  isPdfProof,
  resolveProofDocumentUrl,
} from '../utils/proofDocument';

interface ProofViewButtonProps {
  proof?: string | null;
  title?: string;
  subtitle?: string;
  emptyLabel?: string;
  className?: string;
}

export const ProofViewButton: React.FC<ProofViewButtonProps> = ({
  proof,
  title = 'Document Proof',
  subtitle,
  emptyLabel = 'No proof',
  className = '',
}) => {
  const { addToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const closeModal = () => {
    setIsOpen(false);
    setProofUrl(null);
  };

  const handleView = async () => {
    if (!proof) return;

    try {
      setLoading(true);
      const url = await resolveProofDocumentUrl(proof);
      setProofUrl(url);
      setIsOpen(true);
    } catch {
      addToast('Failed to load proof document', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!proofUrl || !proof) return;

    const link = document.createElement('a');
    link.href = proofUrl;
    link.download = getProofFilename(proof);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!proof) {
    return <span className="text-textMuted text-sm">{emptyLabel}</span>;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleView}
        disabled={loading}
        className={`text-primary hover:underline text-sm inline-flex items-center gap-1 disabled:opacity-60 ${className}`}
      >
        <Eye className="w-3.5 h-3.5" />
        {loading ? 'Loading...' : 'View'}
      </button>

      {isOpen && proofUrl && (
        <Portal>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
            onClick={closeModal}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] pointer-events-auto animate-slide-in flex flex-col">
              <div className="p-4 border-b flex items-center justify-between bg-bgLight rounded-t-xl">
                <div>
                  <h3 className="text-lg font-bold text-textDark">{title}</h3>
                  {subtitle && <p className="text-sm text-textMuted mt-0.5">{subtitle}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="p-2 hover:bg-black/5 rounded-full transition-colors"
                    aria-label="Close proof preview"
                  >
                    <X className="w-5 h-5 text-textMuted" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 bg-gray-100 flex items-center justify-center min-h-[400px]">
                {isPdfProof(proof || proofUrl) ? (
                  <iframe
                    src={proofUrl}
                    className="w-full h-full min-h-[500px] rounded-lg border border-borderColor bg-white"
                    title={title}
                  />
                ) : (
                  <img
                    src={proofUrl}
                    alt={title}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                  />
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
};
