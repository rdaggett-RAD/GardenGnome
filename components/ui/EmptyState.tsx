import type { LucideIcon } from 'lucide-react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { ButtonLink } from './ButtonLink';

// ============================================================================
// EmptyState — for lists/views with no data, always with a CTA
// ============================================================================

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Primary CTA — give it a link OR a click handler, not both. */
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="card text-center py-12 px-6">
      {Icon && (
        <div className="inline-flex items-center justify-center w-12 h-12 bg-paper-warm rounded-full mb-4">
          <Icon size={22} className="text-ink-soft" />
        </div>
      )}
      <h3 className="text-ink mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-ink-soft max-w-sm mx-auto mb-5">
          {description}
        </p>
      )}
      {actionLabel && actionHref && (
        <ButtonLink href={actionHref}>{actionLabel}</ButtonLink>
      )}
      {actionLabel && onAction && !actionHref && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}

// ============================================================================
// ErrorState — for failed loads, with retry
// ============================================================================

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We couldn\'t load this. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="card text-center py-10 px-6 border-terra/30 bg-terra/5">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-terra/15 rounded-full mb-4">
        <AlertCircle size={22} className="text-terra-deep" />
      </div>
      <h3 className="text-ink mb-1">{title}</h3>
      <p className="text-sm text-ink-soft max-w-sm mx-auto mb-5">
        {description}
      </p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} leftIcon={<RefreshCw size={16} />}>
          Try again
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// Skeleton — placeholder block while content loads
// ============================================================================

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-paper-warm rounded ${className ?? ''}`}
      aria-hidden="true"
    />
  );
}

/**
 * SkeletonCard — full card-shaped skeleton, common pattern for grids.
 */
export function SkeletonCard() {
  return (
    <div className="card space-y-3">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-1/3" />
      <div className="pt-2">
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
