'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

// ============================================================================
// Types
// ============================================================================

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** When true, the confirm button uses the destructive (terra) variant. */
  destructive?: boolean;
}

interface ConfirmContextValue {
  /**
   * Opens a confirm dialog and returns a promise that resolves to true (confirmed)
   * or false (cancelled / dismissed).
   */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

// ============================================================================
// Context
// ============================================================================

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used inside <ConfirmProvider>');
  }
  return ctx.confirm;
}

// ============================================================================
// Provider
// ============================================================================

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  const handleResolve = useCallback(
    (value: boolean) => {
      if (pending) {
        pending.resolve(value);
        setPending(null);
      }
    },
    [pending]
  );

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      <Modal
        open={pending !== null}
        onClose={() => handleResolve(false)}
        title={pending?.title ?? ''}
        description={pending?.description}
        size="sm"
      >
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-2">
          <Button variant="secondary" onClick={() => handleResolve(false)}>
            {pending?.cancelLabel ?? 'Cancel'}
          </Button>
          <Button
            variant={pending?.destructive ? 'destructive' : 'primary'}
            onClick={() => handleResolve(true)}
          >
            {pending?.confirmLabel ?? 'Confirm'}
          </Button>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}
