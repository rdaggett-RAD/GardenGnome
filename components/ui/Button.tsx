'use client';

import { Loader2 } from 'lucide-react';
import { forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and disables the button. */
  loading?: boolean;
  /** Optional left-aligned icon. */
  leftIcon?: React.ReactNode;
  /** Optional right-aligned icon. */
  rightIcon?: React.ReactNode;
  /** Stretches the button to full container width. */
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-forest text-cream hover:bg-forest-deep focus-visible:ring-ivy ' +
    'disabled:bg-stone disabled:text-ink-muted',
  secondary:
    'bg-paper-warm text-ink border border-stone hover:bg-stone-soft focus-visible:ring-ivy ' +
    'disabled:opacity-50',
  ghost:
    'text-ink-soft hover:bg-paper-warm hover:text-ink focus-visible:ring-stone ' +
    'disabled:opacity-50',
  destructive:
    'bg-terra text-cream hover:bg-terra-deep focus-visible:ring-terra ' +
    'disabled:bg-stone disabled:text-ink-muted',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'text-sm px-3 py-1.5 gap-1.5',
  md: 'text-base px-5 py-2.5 gap-2',
  lg: 'text-base px-6 py-3 gap-2',
};

/**
 * Button — primitive used throughout the app. Always renders an actual <button>,
 * always handles loading + disabled states, always has visible focus.
 *
 * For navigation, use <ButtonLink> (or wrap in <Link>) instead.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    children,
    disabled,
    className,
    type = 'button',
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={[
        'inline-flex items-center justify-center font-medium rounded-md transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
        'disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
});
