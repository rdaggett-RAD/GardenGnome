import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/Sidebar';
import { ButtonLink, DismissibleBanner, EmptyState } from '@/components/ui';
import { MapPin, Sprout } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user!.id)
    .single();

  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false });

  const { count: plotCount } = await supabase
    .from('plots')
    .select('*', { count: 'exact', head: true });

  const { count: plantingCount } = await supabase
    .from('plantings')
    .select('*', { count: 'exact', head: true });

  const hasProperty = (properties?.length ?? 0) > 0;
  const primaryProperty = properties?.[0];

  return (
    <div className="flex min-h-screen">
      <Sidebar displayName={profile?.display_name ?? null} />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-content mx-auto space-y-8">
          <header>
            <h1>
              Welcome back
              {profile?.display_name ? `, ${profile.display_name}` : ''}
            </h1>
            <p className="text-ink-soft mt-2">
              {hasProperty
                ? `Planning ${primaryProperty?.name}`
                : 'Let\'s get your garden set up.'}
            </p>
          </header>

          {!hasProperty ? (
            <EmptyState
              icon={MapPin}
              title="Add your first property"
              description="Start by telling us where you garden. We'll pull frost dates, USDA zone, and soil data automatically."
              actionLabel="Set up property"
              actionHref="/onboarding"
            />
          ) : (
            <>
              <section
                aria-label="Property summary"
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <div className="card">
                  <p className="text-sm text-ink-muted">Property</p>
                  <p className="text-2xl font-serif mt-1 truncate">
                    {primaryProperty?.name}
                  </p>
                  {primaryProperty?.usda_zone && (
                    <p className="text-sm text-ink-soft mt-2">
                      Zone {primaryProperty.usda_zone}
                    </p>
                  )}
                </div>

                <div className="card">
                  <p className="text-sm text-ink-muted">Plots</p>
                  <p className="text-2xl font-serif mt-1">{plotCount ?? 0}</p>
                  <p className="text-sm text-ink-soft mt-2">
                    {plotCount === 0
                      ? 'No plots yet'
                      : `Active garden ${plotCount === 1 ? 'plot' : 'plots'}`}
                  </p>
                </div>

                <div className="card">
                  <p className="text-sm text-ink-muted">Plantings</p>
                  <p className="text-2xl font-serif mt-1">
                    {plantingCount ?? 0}
                  </p>
                  <p className="text-sm text-ink-soft mt-2">
                    {plantingCount === 0
                      ? 'Add your first variety'
                      : 'Across all plots and seasons'}
                  </p>
                </div>
              </section>

              <section className="card" aria-label="Browse varieties">
                <h3 className="mb-1">Browse the variety library</h3>
                <p className="text-ink-soft text-sm mb-4">
                  257 carefully researched varieties — fruit trees, vegetables,
                  cut flowers, and field crops.
                </p>
                <ButtonLink
                  href="/varieties"
                  variant="secondary"
                  leftIcon={<Sprout size={18} aria-hidden="true" />}
                >
                  Open library
                </ButtonLink>
              </section>
            </>
          )}

          <DismissibleBanner
            storageKey="phase1-scaffold-info-v1"
            variant="info"
            title="This is the Phase 1 scaffold"
            description="The dashboard, auth, and variety library are wired up. Phase 2 builds plots, the variety picker, and the property map. See docs/BRIEF.md."
          />
        </div>
      </main>
    </div>
  );
}
