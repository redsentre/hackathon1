'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { MAX_PDF_SIZE_MB } from '@/lib/constants';

interface PdfUploadProps {
  onFileExtracted: (text: string) => void;
  isLoading: boolean;
  className?: string;
}

export function PdfUpload({ onFileExtracted, isLoading, className = '' }: PdfUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setError(null);
      setSuccess(false);

      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];

      if (file.size > MAX_PDF_SIZE_MB * 1024 * 1024) {
        setError(`File must be under ${MAX_PDF_SIZE_MB}MB`);
        return;
      }

      setFileName(file.name);
      setFileSize(`${(file.size / 1024).toFixed(1)} KB`);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('language', 'en');

        const response = await fetch('/api/analyze', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          setError(result.error || 'Failed to process PDF');
          return;
        }

        if (result.success && result.data) {
          setSuccess(true);
          setPageCount(result.data.pageCount || null);
          onFileExtracted(result.data.summary || 'PDF processed successfully');
        } else {
          setError(result.error || 'Failed to process PDF');
        }
      } catch (err) {
        setError('An error occurred while processing the PDF');
      }
    },
    [onFileExtracted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    disabled: isLoading,
  });

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : error
            ? 'border-danger bg-danger/5'
            : success
            ? 'border-success bg-success/5'
            : 'border-primary/20 hover:border-primary/40'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />

        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-muted">Extracting text from PDF...</p>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle className="w-12 h-12 text-success" />
            <p className="text-foreground font-medium">Text extracted successfully</p>
            {fileName && (
              <p className="text-sm text-muted">
                {fileName} · {fileSize} · {pageCount ? `${pageCount} pages` : ''}
              </p>
            )}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3">
            <AlertCircle className="w-12 h-12 text-danger" />
            <p className="text-danger font-medium">{error}</p>
            <p className="text-sm text-muted">Try again with a different file</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {isDragActive ? (
              <>
                <Upload className="w-12 h-12 text-primary" />
                <p className="text-foreground font-medium">Drop your PDF here</p>
              </>
            ) : (
              <>
                <FileText className="w-12 h-12 text-muted" />
                <p className="text-foreground font-medium">
                  Drop a PDF here or click to upload
                </p>
                <p className="text-sm text-muted">
                  Max {MAX_PDF_SIZE_MB}MB · Loan agreements, T&Cs, insurance policies
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
