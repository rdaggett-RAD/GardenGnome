import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ButtonLink } from '@/components/ui';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user already has a property, skip to dashboard
  const { count } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true });

  if ((count ?? 0) > 0) {
    redirect('/dashboard');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('user_id', user!.id)
    .single();

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="max-w-2xl text-center space-y-8">
        <div className="space-y-4">
          <p className="text-sm text-ink-muted uppercase tracking-wider">
            Step 1 of 3
          </p>
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-forest-deep">
            {profile?.display_name
              ? `Welcome, ${profile.display_name}.`
              : 'Welcome.'}
            <br />
            Let&apos;s plan your garden.
          </h1>
          <p className="text-lg text-ink-soft leading-relaxed max-w-xl mx-auto">
            We&apos;ll start by setting up your property. The Garden Gnome will
            pull frost dates, USDA zone, and soil data automatically.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <ButtonLink href="/onboarding/property" size="lg">
            Set up property
          </ButtonLink>
          <Link
            href="/dashboard"
            className="text-sm text-ink-muted hover:text-ink underline self-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ivy rounded"
          >
            Skip for now
          </Link>
        </div>

        <div className="text-xs text-ink-muted pt-12 max-w-md mx-auto">
          Takes about 2 minutes. You can always edit details later.
        </div>
      </div>
    </main>
  );
}
