'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button, FormField, Input, useToast } from '@/components/ui';

export function ForgotPasswordForm() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter a valid email';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      setErrors({ form: error.message });
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
    toast({
      variant: 'success',
      title: 'Check your email',
      description: 'We sent a password reset link if that account exists.',
    });
  }

  return (
    <div className="card space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl">Reset your password</h1>
        <p className="text-sm text-ink-muted">
          Enter your email and we&apos;ll send you a secure reset link.
        </p>
      </div>

      {sent ? (
        <div className="space-y-4">
          <div className="text-sm text-moss bg-moss/10 border border-moss/30 rounded-md px-3 py-2">
            Check your email for a password reset link. The link will bring you
            back here to choose a new password.
          </div>
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={() => setSent(false)}
          >
            Send another email
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField label="Email" htmlFor="email" required error={errors.email}>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              hasError={!!errors.email}
              autoComplete="email"
              disabled={loading}
              autoFocus
            />
          </FormField>

          {errors.form && (
            <div
              role="alert"
              className="text-sm text-terra-deep bg-terra/10 border border-terra/30 rounded-md px-3 py-2"
            >
              {errors.form}
            </div>
          )}

          <Button type="submit" loading={loading} fullWidth>
            {loading ? 'Sending...' : 'Send reset link'}
          </Button>
        </form>
      )}

      <p className="text-sm text-ink-muted text-center">
        Remember your password?{' '}
        <Link
          href="/auth/login"
          className="text-ivy hover:text-forest underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ivy rounded"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
