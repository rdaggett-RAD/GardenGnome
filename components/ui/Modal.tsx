'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Maximum width — defaults to 'md' (28rem). */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** When true, clicking the backdrop will not close the modal. Default false. */
  preventBackdropClose?: boolean;
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/**
 * Modal that closes on:
 *   - × button click
 *   - Escape key
 *   - backdrop click (unless preventBackdropClose)
 *
 * Manages body scroll lock and focus trapping (basic version).
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  preventBackdropClose = false,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Escape to close
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Focus management — focus first focusable element on open, restore on close
  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement;

    const focusable = dialogRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();

    return () => {
      previouslyFocused.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget && !preventBackdropClose) {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? 'modal-description' : undefined}
        className={`relative w-full ${sizeClasses[size]} bg-cream border border-stone-soft rounded-lg shadow-card`}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            <h2 id="modal-title" className="text-xl font-serif text-ink">
              {title}
            </h2>
            {description && (
              <p id="modal-description" className="text-sm text-ink-soft mt-1">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-ink-muted hover:text-ink transition-colors p-1 -m-1 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
