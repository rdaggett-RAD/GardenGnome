'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration?: number; // ms; 0 = no auto-dismiss
}

interface ToastContextValue {
  toast: (toast: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

// ============================================================================
// Context
// ============================================================================

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return ctx;
}

// ============================================================================
// Provider
// ============================================================================

const DEFAULT_DURATION = 5000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current[id];
    if (timer) {
      clearTimeout(timer);
      delete timersRef.current[id];
    }
  }, []);

  const dismissAll = useCallback(() => {
    Object.values(timersRef.current).forEach(clearTimeout);
    timersRef.current = {};
    setToasts([]);
  }, []);

  const toast = useCallback(
    (input: Omit<Toast, 'id'>) => {
      const id = crypto.randomUUID();
      const duration = input.duration ?? DEFAULT_DURATION;
      const newToast: Toast = { id, ...input };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        timersRef.current[id] = setTimeout(() => dismiss(id), duration);
      }

      return id;
    },
    [dismiss]
  );

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss, dismissAll }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ============================================================================
// Visual components
// ============================================================================

const variantStyles: Record<
  ToastVariant,
  { bg: string; border: string; icon: typeof CheckCircle2; iconColor: string }
> = {
  success: {
    bg: 'bg-moss/10',
    border: 'border-moss/40',
    icon: CheckCircle2,
    iconColor: 'text-forest',
  },
  error: {
    bg: 'bg-terra/10',
    border: 'border-terra/40',
    icon: AlertCircle,
    iconColor: 'text-terra-deep',
  },
  warning: {
    bg: 'bg-paper-warm',
    border: 'border-stone',
    icon: AlertTriangle,
    iconColor: 'text-rust',
  },
  info: {
    bg: 'bg-paper-ivory',
    border: 'border-stone-soft',
    icon: Info,
    iconColor: 'text-ivy',
  },
};

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const styles = variantStyles[toast.variant];
  const Icon = styles.icon;

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex gap-3 items-start ${styles.bg} ${styles.border} border rounded-lg shadow-card p-4 animate-in slide-in-from-right`}
    >
      <Icon size={20} className={`${styles.iconColor} flex-shrink-0 mt-0.5`} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink">{toast.title}</p>
        {toast.description && (
          <p className="text-sm text-ink-soft mt-0.5">{toast.description}</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 text-ink-muted hover:text-ink transition-colors p-0.5 -m-0.5 rounded"
        aria-label="Dismiss notification"
      >
        <X size={18} />
      </button>
    </div>
  );
}
