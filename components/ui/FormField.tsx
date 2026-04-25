'use client';

import { forwardRef } from 'react';

// ============================================================================
// FormField — wraps any input with label, error, helper text, required marker
// ============================================================================

interface FormFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  /** Helper text shown below the input when there's no error. */
  helper?: string;
  /** Error message — when set, replaces helper and styles the input. */
  error?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  htmlFor,
  required,
  helper,
  error,
  children,
}: FormFieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor}>
        {label}
        {required && (
          <span className="text-terra ml-0.5" aria-label="required">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p
          id={`${htmlFor}-error`}
          className="text-xs text-terra-deep mt-1"
          role="alert"
        >
          {error}
        </p>
      ) : helper ? (
        <p id={`${htmlFor}-helper`} className="text-xs text-ink-muted mt-1">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

// ============================================================================
// Input
// ============================================================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { hasError, className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      aria-invalid={hasError || undefined}
      className={[
        hasError ? 'border-terra focus:border-terra focus:ring-terra' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
});

// ============================================================================
// Textarea
// ============================================================================

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ hasError, className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        aria-invalid={hasError || undefined}
        className={[
          hasError ? 'border-terra focus:border-terra focus:ring-terra' : '',
          className ?? '',
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
    );
  }
);

// ============================================================================
// Select — styled to match other inputs
// ============================================================================

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { hasError, className, children, ...props },
  ref
) {
  return (
    <select
      ref={ref}
      aria-invalid={hasError || undefined}
      className={[
        hasError ? 'border-terra focus:border-terra focus:ring-terra' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </select>
  );
});
