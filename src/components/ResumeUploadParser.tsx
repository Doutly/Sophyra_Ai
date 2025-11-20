import { useState, useRef } from 'react';
import { Upload, CheckCircle, AlertCircle, X, FileText } from 'lucide-react';
import { parseResumeFile, ParsedResume } from '../lib/resumeParser';

interface ResumeUploadParserProps {
  onParseComplete: (parsedData: ParsedResume, file: File) => void;
  onParseStart?: () => void;
  onParseError?: (error: Error) => void;
  maxSize?: number;
  allowedTypes?: string[];
  accept?: string;
  label?: string;
  description?: string;
}

export default function ResumeUploadParser({
  onParseComplete,
  onParseStart,
  onParseError,
  maxSize = 15 * 1024 * 1024,
  allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
  accept = '.pdf,.doc,.docx,.txt',
  label = 'Upload Resume',
  description = 'Drag and drop or click to browse',
}: ResumeUploadParserProps) {
  const [parsing, setParsing] = useState(false);
  const [parsedFile, setParsedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size must be less than ${formatBytes(maxSize)}`,
      };
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type not allowed. Allowed types: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`,
      };
    }

    return { valid: true };
  };

  const handleFile = async (file: File) => {
    setError(null);

    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setParsing(true);
    setParsedFile(file);
    onParseStart?.();

    try {
      const parsed = await parseResumeFile(file);
      setParsedData(parsed);
      onParseComplete(parsed, file);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to parse resume';
      setError(errorMsg);
      onParseError?.(err);
    } finally {
      setParsing(false);
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
    setParsedFile(null);
    setParsedData(null);
    setError(null);
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
          ${isDragging ? 'border-teal-500 bg-teal-50' : 'border-gray-300'}
          ${parsing ? 'bg-gray-50' : 'hover:border-teal-400 cursor-pointer'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !parsing && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          onChange={handleFileSelect}
          accept={accept}
          className="hidden"
          disabled={parsing}
        />

        {parsing ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium text-gray-700">
                Parsing resume...
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Extracting name, skills, experience, and more
            </p>
          </div>
        ) : parsedFile && parsedData && !error ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900">{parsedFile.name}</p>
                <p className="text-sm text-gray-600">
                  {formatBytes(parsedFile.size)}
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

            {/* Show parsed data preview */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
              <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                <FileText className="w-3 h-3 mr-1" />
                Extracted Information
              </h4>
              <div className="space-y-1 text-xs text-gray-600">
                {parsedData.name && (
                  <p><span className="font-medium">Name:</span> {parsedData.name}</p>
                )}
                {parsedData.email && (
                  <p><span className="font-medium">Email:</span> {parsedData.email}</p>
                )}
                {parsedData.phone && (
                  <p><span className="font-medium">Phone:</span> {parsedData.phone}</p>
                )}
                {parsedData.skills.length > 0 && (
                  <p><span className="font-medium">Skills:</span> {parsedData.skills.slice(0, 5).join(', ')}{parsedData.skills.length > 5 ? ` +${parsedData.skills.length - 5} more` : ''}</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-700 font-medium mb-1">{description}</p>
            <p className="text-sm text-gray-500">
              {allowedTypes.map(t => t.split('/')[1]).join(', ').toUpperCase()}
              {' '}(max {formatBytes(maxSize)})
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Resume will be parsed instantly - no upload needed
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
