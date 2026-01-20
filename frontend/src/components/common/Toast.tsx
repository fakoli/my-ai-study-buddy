import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import clsx from 'clsx';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onClose: (id: string) => void;
}

const variantConfig = {
  success: {
    icon: CheckCircle,
    containerClass: 'bg-green-50 border-green-200',
    iconClass: 'text-green-500',
    textClass: 'text-green-800',
  },
  error: {
    icon: AlertCircle,
    containerClass: 'bg-red-50 border-red-200',
    iconClass: 'text-red-500',
    textClass: 'text-red-800',
  },
  info: {
    icon: Info,
    containerClass: 'bg-blue-50 border-blue-200',
    iconClass: 'text-blue-500',
    textClass: 'text-blue-800',
  },
};

export function Toast({ id, message, variant = 'info', duration = 5000, onClose }: ToastProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onClose(id), duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={clsx(
        'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg min-w-[300px] max-w-md animate-slide-in',
        config.containerClass
      )}
    >
      <Icon className={clsx('w-5 h-5 flex-shrink-0', config.iconClass)} aria-hidden="true" />
      <p className={clsx('flex-1 text-sm font-medium', config.textClass)}>{message}</p>
      <button
        onClick={() => onClose(id)}
        className={clsx(
          'p-1 rounded-lg hover:bg-black/5 transition-colors flex-shrink-0',
          config.textClass
        )}
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}
