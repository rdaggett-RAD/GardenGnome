import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PropertyForm } from './PropertyForm';

export default async function PropertySetupPage() {
  const supabase = await createClient();

  const { count } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true });

  if ((count ?? 0) > 0) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <p className="text-sm text-ink-muted uppercase tracking-wider mb-2">
            Step 2 of 3
          </p>
          <h1>Tell us about your property</h1>
          <p className="text-ink-soft mt-2 max-w-md mx-auto">
            We&apos;ll use your location to fetch climate data, frost dates, and
            soil information.
          </p>
        </div>

        <div className="card">
          <PropertyForm />
        </div>
      </div>
    </main>
  );
}
