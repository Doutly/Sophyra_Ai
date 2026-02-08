import { useState, useRef } from 'react';
import { Upload, CheckCircle, AlertCircle, X } from 'lucide-react';
import { fileUploader, validateFile, UploadProgress } from '../lib/fileUpload';

interface OptimizedFileUploadProps {
  onUploadComplete: (url: string, file: File) => void;
  onUploadStart?: () => void;
  onUploadError?: (error: Error) => void;
  maxSize?: number;
  allowedTypes?: string[];
  bucket: string;
  pathPrefix: string;
  accept?: string;
  label?: string;
  description?: string;
}

export default function OptimizedFileUpload({
  onUploadComplete,
  onUploadStart,
  onUploadError,
  maxSize = 15 * 1024 * 1024,
  allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  bucket,
  pathPrefix,
  accept = '.pdf,.doc,.docx',
  label = 'Upload File',
  description = 'Drag and drop or click to browse',
}: OptimizedFileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);

    const validation = validateFile(file, { maxSize, allowedTypes });
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setUploading(true);
    setUploadedFile(file);
    onUploadStart?.();

    try {
      const filePath = `${pathPrefix}/${Date.now()}-${file.name}`;

      const url = await fileUploader.uploadWithProgress(
        file,
        bucket,
        filePath,
        {
          onProgress: (prog) => {
            setProgress(prog);
          },
          onError: (err) => {
            setError(err.message);
            onUploadError?.(err);
          },
        }
      );

      onUploadComplete(url, file);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      onUploadError?.(err);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(null), 1000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const clearFile = () => {
    setUploadedFile(null);
    setError(null);
    setProgress(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>

      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-all
          ${isDragging ? 'border-brand-electric bg-blue-50' : 'border-gray-300'}
          ${uploading ? 'bg-gray-50' : 'hover:border-brand-electric-light cursor-pointer'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          onChange={handleFileSelect}
          accept={accept}
          className="hidden"
          disabled={uploading}
        />

        {uploading && progress ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-6 h-6 border-2 border-brand-electric border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium text-gray-700">
                Uploading... {Math.round(progress.percentage)}%
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-brand-electric h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-xs text-gray-600">
              <span>
                {fileUploader.formatBytes(progress.loaded)} / {fileUploader.formatBytes(progress.total)}
              </span>
              <span>
                {fileUploader.formatBytes(progress.speed)}/s
              </span>
              <span>
                {fileUploader.formatTime(progress.timeRemaining)} remaining
              </span>
            </div>
          </div>
        ) : uploadedFile && !error ? (
          <div className="flex items-center justify-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900">{uploadedFile.name}</p>
              <p className="text-sm text-gray-600">
                {fileUploader.formatBytes(uploadedFile.size)}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        ) : (
          <div>
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-700 font-medium mb-1">{description}</p>
            <p className="text-sm text-gray-500">
              {allowedTypes.map(t => t.split('/')[1]).join(', ').toUpperCase()}
              {' '}(max {fileUploader.formatBytes(maxSize)})
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
