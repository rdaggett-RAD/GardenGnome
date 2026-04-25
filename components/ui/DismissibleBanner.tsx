'use client';

import { useEffect, useState } from 'react';
import { X, Info, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type BannerVariant = 'info' | 'warning' | 'error' | 'success';

interface DismissibleBannerProps {
  /**
   * Stable key for this banner. Used to remember dismissal in localStorage.
   * Change the key when the message materially changes so users see it again.
   * Pass `null` to make the banner non-persistent (re-shown on every page load).
   */
  storageKey: string | null;
  variant?: BannerVariant;
  title: string;
  description?: string;
  /** Optional inline action (e.g., a Link) shown to the right of the description. */
  action?: React.ReactNode;
}

const variantStyles: Record<
  BannerVariant,
  { bg: string; border: string; icon: LucideIcon; iconColor: string }
> = {
  info: {
    bg: 'bg-paper-ivory',
    border: 'border-stone-soft',
    icon: Info,
    iconColor: 'text-ivy',
  },
  warning: {
    bg: 'bg-paper-warm',
    border: 'border-stone',
    icon: AlertTriangle,
    iconColor: 'text-rust',
  },
  error: {
    bg: 'bg-terra/10',
    border: 'border-terra/40',
    icon: AlertCircle,
    iconColor: 'text-terra-deep',
  },
  success: {
    bg: 'bg-moss/10',
    border: 'border-moss/40',
    icon: CheckCircle2,
    iconColor: 'text-forest',
  },
};

const STORAGE_PREFIX = 'gg.banner-dismissed.';

export function DismissibleBanner({
  storageKey,
  variant = 'info',
  title,
  description,
  action,
}: DismissibleBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // On mount, check localStorage. Avoids SSR hydration flash.
  useEffect(() => {
    setHydrated(true);
    if (storageKey) {
      const stored = localStorage.getItem(STORAGE_PREFIX + storageKey);
      if (stored === '1') {
        setDismissed(true);
      }
    }
  }, [storageKey]);

  function handleDismiss() {
    setDismissed(true);
    if (storageKey) {
      localStorage.setItem(STORAGE_PREFIX + storageKey, '1');
    }
  }

  if (!hydrated || dismissed) return null;

  const styles = variantStyles[variant];
  const Icon = styles.icon;

  return (
    <div
      role="status"
      className={`flex gap-3 items-start ${styles.bg} ${styles.border} border rounded-lg p-4`}
    >
      <Icon size={20} className={`${styles.iconColor} flex-shrink-0 mt-0.5`} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink">{title}</p>
        {description && (
          <p className="text-sm text-ink-soft mt-0.5">{description}</p>
        )}
        {action && <div className="mt-2">{action}</div>}
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        className="flex-shrink-0 text-ink-muted hover:text-ink transition-colors p-0.5 -m-0.5 rounded"
        aria-label="Dismiss this notice"
      >
        <X size={18} />
      </button>
    </div>
  );
}
