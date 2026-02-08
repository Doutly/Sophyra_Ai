import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';

interface ToastProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ type, message, onClose, duration = 5000 }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  const config = {
    success: {
      icon: CheckCircle,
      bg: 'bg-swiss-status-approved',
      text: 'text-swiss-status-approved-text',
      border: 'border-green-300',
    },
    error: {
      icon: XCircle,
      bg: 'bg-swiss-status-rejected',
      text: 'text-swiss-status-rejected-text',
      border: 'border-red-300',
    },
    warning: {
      icon: AlertCircle,
      bg: 'bg-swiss-status-pending',
      text: 'text-swiss-status-pending-text',
      border: 'border-yellow-300',
    },
    info: {
      icon: Info,
      bg: 'bg-swiss-status-completed',
      text: 'text-swiss-status-completed-text',
      border: 'border-blue-300',
    },
  };

  const { icon: Icon, bg, text, border } = config[type];

  return (
    <div
      className={`fixed top-4 right-4 z-50 ${
        isExiting ? 'animate-slide-up' : 'animate-slide-in-right'
      }`}
    >
      <div className={`${bg} ${text} border ${border} rounded-lg shadow-swiss-lg p-4 pr-12 max-w-md`}>
        <div className="flex items-start">
          <Icon className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={handleClose}
          className={`absolute top-3 right-3 ${text} hover:opacity-70 transition-opacity`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
