import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui';

interface FileUploadProps {
  accept?: string;
  maxSize?: number; // in MB
  onFileSelect: (file: File | null) => void;
  label?: string;
  helperText?: string;
  required?: boolean;
  error?: string;
  value?: File | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  accept = '.pdf,.png,.jpg,.jpeg',
  maxSize = 5,
  onFileSelect,
  label = 'Upload File',
  helperText,
  required = false,
  error,
  value,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(value || null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    
    if (!file) {
      handleClearFile();
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      setUploadError(`File size must be less than ${maxSize}MB`);
      handleClearFile();
      return;
    }

    setUploadError(null);
    setSelectedFile(file);
    onFileSelect(file);

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setUploadError(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = () => {
    if (!selectedFile) return <Upload className="w-5 h-5" />;
    if (selectedFile.type.startsWith('image/')) return <ImageIcon className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const displayError = error || uploadError;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-textDark mb-2">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Upload Area */}
      {!selectedFile ? (
        <div
          onClick={handleBrowseClick}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
            ${displayError 
              ? 'border-danger bg-red-50 hover:bg-red-100' 
              : 'border-borderColor bg-bgLight hover:bg-gray-100 hover:border-primary'
            }
          `}
        >
          <div className="flex flex-col items-center">
            <div className={`p-3 rounded-full mb-3 ${displayError ? 'bg-red-200' : 'bg-white'}`}>
              {displayError ? (
                <AlertCircle className="w-6 h-6 text-danger" />
              ) : (
                <Upload className="w-6 h-6 text-textMuted" />
              )}
            </div>
            <p className="text-sm font-medium text-textDark mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-textMuted">
              {accept.split(',').join(', ')} (max {maxSize}MB)
            </p>
          </div>
        </div>
      ) : (
        <div className="border border-borderColor rounded-lg p-4 bg-white">
          <div className="flex items-start gap-3">
            {/* Preview or Icon */}
            {preview ? (
              <div className="flex-shrink-0">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded border border-borderColor"
                />
              </div>
            ) : (
              <div className="flex-shrink-0 p-3 bg-bgLight rounded">
                {getFileIcon()}
              </div>
            )}

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-textDark truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-textMuted mt-1">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <button
                  onClick={handleClearFile}
                  className="flex-shrink-0 p-1 rounded hover:bg-bgLight transition-colors"
                  aria-label="Remove file"
                >
                  <X className="w-4 h-4 text-textMuted hover:text-danger" />
                </button>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-xs text-success font-medium">File ready to upload</span>
              </div>
            </div>
          </div>

          {/* Change File Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleBrowseClick}
            className="mt-3 w-full"
          >
            Change File
          </Button>
        </div>
      )}

      {/* Helper Text or Error */}
      {displayError ? (
        <p className="mt-2 text-sm text-danger flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {displayError}
        </p>
      ) : helperText ? (
        <p className="mt-2 text-sm text-textMuted">{helperText}</p>
      ) : null}
    </div>
  );
};


