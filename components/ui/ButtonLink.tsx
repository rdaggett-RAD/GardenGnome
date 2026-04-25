import Link from 'next/link';
import type { ComponentProps } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonLinkProps extends Omit<ComponentProps<typeof Link>, 'className'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-forest text-cream hover:bg-forest-deep focus-visible:ring-ivy',
  secondary:
    'bg-paper-warm text-ink border border-stone hover:bg-stone-soft focus-visible:ring-ivy',
  ghost:
    'text-ink-soft hover:bg-paper-warm hover:text-ink focus-visible:ring-stone',
  destructive:
    'bg-terra text-cream hover:bg-terra-deep focus-visible:ring-terra',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'text-sm px-3 py-1.5 gap-1.5',
  md: 'text-base px-5 py-2.5 gap-2',
  lg: 'text-base px-6 py-3 gap-2',
};

/**
 * ButtonLink — same visual style as Button, but renders a Next.js <Link> for
 * client-side navigation. Use this whenever a button-shaped element navigates
 * to a route.
 */
export function ButtonLink({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={[
        'inline-flex items-center justify-center font-medium rounded-md transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </Link>
  );
}
