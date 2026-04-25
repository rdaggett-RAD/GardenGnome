import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/Sidebar';
import { ErrorState } from '@/components/ui';
import { VarietyBrowser } from './VarietyBrowser';

export default async function VarietiesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('user_id', user!.id)
    .single();

  const { data: varieties, error } = await supabase
    .from('all_varieties')
    .select('*')
    .order('species', { ascending: true })
    .order('variety_name', { ascending: true });

  return (
    <div className="flex min-h-screen">
      <Sidebar displayName={profile?.display_name ?? null} />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-content mx-auto space-y-6">
          <header>
            <h1>Variety library</h1>
            <p className="text-ink-soft mt-2">
              {error
                ? 'We couldn\'t load varieties right now.'
                : `${varieties?.length ?? 0} varieties across orchards, kitchen gardens, cut flower beds, and field crops.`}
            </p>
          </header>

          {error ? (
            <ErrorState
              title="Couldn't load varieties"
              description={error.message}
            />
          ) : varieties && varieties.length > 0 ? (
            <VarietyBrowser varieties={varieties} />
          ) : (
            <ErrorState
              title="No varieties found"
              description="The seed database appears to be empty. Re-run 02_import_seed_data.sql in your Supabase SQL Editor."
            />
          )}
        </div>
      </main>
    </div>
  );
}
