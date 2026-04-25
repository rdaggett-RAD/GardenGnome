import Link from 'next/link';
import { Suspense } from 'react';
import { ResetPasswordForm } from './ResetPasswordForm';

function ResetPasswordFallback() {
  return (
    <div className="card space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl">Choose a new password</h1>
        <p className="text-sm text-ink-muted">
          Use a strong password for your Garden Gnome account.
        </p>
      </div>
      <div className="space-y-4">
        <div className="h-16 bg-paper-warm animate-pulse rounded-md" />
        <div className="h-16 bg-paper-warm animate-pulse rounded-md" />
        <div className="h-11 bg-paper-warm animate-pulse rounded-md" />
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Suspense fallback={<ResetPasswordFallback />}>
          <ResetPasswordForm />
        </Suspense>

        <p className="text-xs text-ink-muted text-center mt-6">
          <Link
            href="/"
            className="hover:text-ink underline focus:outline-none focus-visible:ring-2 focus-visible:ring-stone rounded"
          >
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
