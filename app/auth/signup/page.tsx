'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button, ButtonLink, FormField, Input, useToast } from '@/components/ui';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{
    displayName?: string;
    email?: string;
    password?: string;
    form?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  function validate() {
    const next: typeof errors = {};
    if (!displayName.trim()) next.displayName = 'Tell us your name';
    if (!email) next.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter a valid email';
    if (!password) next.password = 'Password is required';
    else if (password.length < 8) next.password = 'At least 8 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: displayName },
      },
    });

    if (error) {
      setErrors({ form: error.message });
      setLoading(false);
      return;
    }

    if (data.user && !data.session) {
      setNeedsConfirmation(true);
      setLoading(false);
      return;
    }

    toast({
      variant: 'success',
      title: 'Account created',
      description: 'Let\'s get your garden set up.',
    });
    router.push('/onboarding');
    router.refresh();
  }

  if (needsConfirmation) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="card space-y-4 text-center">
            <h1 className="text-3xl">Check your email</h1>
            <p className="text-ink-soft">
              We sent a confirmation link to <strong>{email}</strong>. Click it
              to activate your account.
            </p>
            <ButtonLink href="/auth/login" variant="secondary" fullWidth>
              Back to sign in
            </ButtonLink>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="card space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl">Get started</h1>
            <p className="text-sm text-ink-muted">
              Create your Garden Gnome account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <FormField
              label="Your name"
              htmlFor="displayName"
              required
              error={errors.displayName}
            >
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                hasError={!!errors.displayName}
                autoComplete="name"
                disabled={loading}
              />
            </FormField>

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
              helper="At least 8 characters"
              error={errors.password}
            >
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                hasError={!!errors.password}
                autoComplete="new-password"
                minLength={8}
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
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          <p className="text-sm text-ink-muted text-center">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="text-ivy hover:text-forest underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ivy rounded"
            >
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-xs text-ink-muted text-center mt-6">
          <Link
            href="/"
            className="hover:text-ink underline focus:outline-none focus-visible:ring-2 focus-visible:ring-stone rounded"
          >
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
