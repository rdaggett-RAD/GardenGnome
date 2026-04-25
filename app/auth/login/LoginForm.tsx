'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button, FormField, Input, useToast } from '@/components/ui';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    form?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const next: typeof errors = {};
    if (!email) next.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter a valid email';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrors({ form: error.message });
      setLoading(false);
      return;
    }

    toast({ variant: 'success', title: 'Welcome back' });
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="card space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl">Welcome back</h1>
        <p className="text-sm text-ink-muted">
          Sign in to your Garden Gnome account
        </p>
      </div>

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
          />
        </FormField>

        <FormField
          label="Password"
          htmlFor="password"
          required
          error={errors.password}
        >
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hasError={!!errors.password}
            autoComplete="current-password"
            disabled={loading}
          />
        </FormField>

        <div className="text-right">
          <Link
            href="/auth/forgot-password"
            className="text-sm text-ivy hover:text-forest underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ivy rounded"
          >
            Forgot password?
          </Link>
        </div>

        {errors.form && (
          <div
            role="alert"
            className="text-sm text-terra-deep bg-terra/10 border border-terra/30 rounded-md px-3 py-2"
          >
            {errors.form}
          </div>
        )}

        <Button type="submit" loading={loading} fullWidth>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="text-sm text-ink-muted text-center">
        Don&apos;t have an account?{' '}
        <Link
          href="/auth/signup"
          className="text-ivy hover:text-forest underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ivy rounded"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
