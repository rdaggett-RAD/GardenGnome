import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/Sidebar';
import { IntegrationsChecklist } from './IntegrationsChecklist';

export default async function SetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('user_id', user!.id)
    .single();

  return (
    <div className="flex min-h-screen">
      <Sidebar displayName={profile?.display_name ?? null} />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-content mx-auto space-y-6">
          <header>
            <h1>Setup</h1>
            <p className="text-ink-soft mt-2">
              Connect external services to unlock features. Keys are stored as
              Supabase secrets, never in the browser.
            </p>
          </header>

          <IntegrationsChecklist />
        </div>
      </main>
    </div>
  );
}
