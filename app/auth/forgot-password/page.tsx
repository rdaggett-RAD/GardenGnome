import Link from 'next/link';
import { ForgotPasswordForm } from './ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <ForgotPasswordForm />

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
