'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Button,
  ButtonLink,
  FormField,
  Input,
  useToast,
} from '@/components/ui';

type SessionState = 'checking' | 'ready' | 'invalid';

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [sessionState, setSessionState] = useState<SessionState>('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    form?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function prepareRecoverySession() {
      const supabase = createClient();
      const code = searchParams.get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (!cancelled) {
            setErrors({ form: error.message });
            setSessionState('invalid');
          }
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!cancelled) {
        setSessionState(session ? 'ready' : 'invalid');
      }
    }

    prepareRecoverySession();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  function validate() {
    const next: typeof errors = {};
    if (!password) next.password = 'New password is required';
    else if (password.length < 8) {
      next.password = 'Use at least 8 characters';
    }
    if (!confirmPassword) next.confirmPassword = 'Confirm your new password';
    else if (confirmPassword !== password) {
      next.confirmPassword = 'Passwords must match';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrors({ form: error.message });
      setLoading(false);
      return;
    }

    toast({
      variant: 'success',
      title: 'Password updated',
      description: 'You can keep planning your garden.',
    });
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="card space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl">Choose a new password</h1>
        <p className="text-sm text-ink-muted">
          Use a strong password for your Garden Gnome account.
        </p>
      </div>

      {sessionState === 'checking' ? (
        <div className="space-y-4" aria-live="polite">
          <div className="h-16 bg-paper-warm animate-pulse rounded-md" />
          <div className="h-16 bg-paper-warm animate-pulse rounded-md" />
          <div className="h-11 bg-paper-warm animate-pulse rounded-md" />
        </div>
      ) : sessionState === 'invalid' ? (
        <div className="space-y-4">
          <div
            role="alert"
            className="text-sm text-terra-deep bg-terra/10 border border-terra/30 rounded-md px-3 py-2"
          >
            {errors.form ||
              'This reset link is missing, expired, or already used. Request a new password reset email.'}
          </div>
          <ButtonLink href="/auth/forgot-password" fullWidth>
            Request a new link
          </ButtonLink>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField
            label="New password"
            htmlFor="password"
            required
            helper="Use at least 8 characters"
            error={errors.password}
          >
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hasError={!!errors.password}
              autoComplete="new-password"
              disabled={loading}
              autoFocus
            />
          </FormField>

          <FormField
            label="Confirm password"
            htmlFor="confirmPassword"
            required
            error={errors.confirmPassword}
          >
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              hasError={!!errors.confirmPassword}
              autoComplete="new-password"
              disabled={loading}
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
            {loading ? 'Updating...' : 'Update password'}
          </Button>
        </form>
      )}

      <p className="text-sm text-ink-muted text-center">
        <Link
          href="/auth/login"
          className="text-ivy hover:text-forest underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ivy rounded"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
