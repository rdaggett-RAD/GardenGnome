import { ArrowRight, MapPin } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { ButtonLink, EmptyState, ErrorState } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import type { Database, PlotCategory } from '@/lib/supabase/types';
import { AddPlotForm } from './AddPlotForm';

type Plot = Database['public']['Tables']['plots']['Row'];
type Property = Database['public']['Tables']['properties']['Row'];

const categoryLabels: Record<PlotCategory, string> = {
  orchard: 'Orchard',
  kitchen_garden: 'Kitchen garden',
  cut_flower_bed: 'Cut flower bed',
  field_crop: 'Field crop',
  mixed: 'Mixed use',
};

const exposureLabels: Record<string, string> = {
  full_sun: 'Full sun',
  part_shade: 'Part shade',
  shade: 'Shade',
};

function formatArea(plot: Plot): string {
  if (plot.area_sqft) return `${Number(plot.area_sqft).toLocaleString()} sq ft`;
  if (plot.length_ft && plot.width_ft) {
    const area = Number(plot.length_ft) * Number(plot.width_ft);
    return `${Math.round(area).toLocaleString()} sq ft`;
  }
  return 'Area not set';
}

function formatDimensions(plot: Plot): string {
  if (!plot.length_ft || !plot.width_ft) return 'Dimensions not set';
  return `${Number(plot.length_ft)} ft x ${Number(plot.width_ft)} ft`;
}

function formatSun(plot: Plot): string {
  const exposure = plot.sun_exposure
    ? exposureLabels[plot.sun_exposure] ?? plot.sun_exposure
    : null;
  if (plot.sun_hours !== null && exposure) {
    return `${plot.sun_hours} hours, ${exposure.toLowerCase()}`;
  }
  if (plot.sun_hours !== null) return `${plot.sun_hours} hours of sun`;
  if (exposure) return exposure;
  return 'Sun not set';
}

export default async function PlotsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('user_id', user.id)
    .single();

  const { data: primaryProperty, error: primaryPropertyError } = await supabase
    .from('properties')
    .select('*')
    .eq('is_primary', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let property: Property | null = primaryProperty;
  let propertyError = primaryPropertyError;

  if (!property && !propertyError) {
    const { data: fallbackProperty, error: fallbackPropertyError } =
      await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    property = fallbackProperty;
    propertyError = fallbackPropertyError;
  }

  const {
    data: plots,
    error: plotsError,
  } = property
    ? await supabase
        .from('plots')
        .select('*')
        .eq('property_id', property.id)
        .order('created_at', { ascending: false })
    : { data: null, error: null };

  return (
    <div className="flex min-h-screen">
      <Sidebar displayName={profile?.display_name ?? null} />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-content mx-auto space-y-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1>Plots</h1>
              <p className="text-ink-soft mt-2">
                {property
                  ? `Garden areas for ${property.name}.`
                  : 'Create a property before adding garden plots.'}
              </p>
            </div>

            {property && (
              <AddPlotForm propertyId={property.id} userId={user.id} />
            )}
          </header>

          {propertyError ? (
            <ErrorState
              title="Couldn't load your property"
              description={propertyError.message}
            />
          ) : !property ? (
            <EmptyState
              icon={MapPin}
              title="Add your first property"
              description="Plots belong to a property. Set up your property first, then come back to define orchard rows, beds, or field sections."
              actionLabel="Set up property"
              actionHref="/onboarding"
            />
          ) : plotsError ? (
            <ErrorState
              title="Couldn't load plots"
              description={plotsError.message}
            />
          ) : plots && plots.length > 0 ? (
            <section aria-label="Plot list">
              <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 list-none p-0">
                {plots.map((plot) => (
                  <li key={plot.id}>
                    <PlotCard plot={plot} />
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <AddPlotForm
              propertyId={property.id}
              userId={user.id}
              triggerLabel="Add first plot"
              trigger="empty"
            />
          )}
        </div>
      </main>
    </div>
  );
}

function PlotCard({ plot }: { plot: Plot }) {
  return (
    <article className="card h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl leading-tight">{plot.name}</h2>
          <p className="text-sm text-ink-soft mt-1">
            {categoryLabels[plot.category]}
          </p>
        </div>
        <span className="badge bg-paper-warm text-ink-soft">
          {formatArea(plot)}
        </span>
      </div>

      {plot.description && (
        <p className="text-sm text-ink-soft mt-4 line-clamp-3">
          {plot.description}
        </p>
      )}

      <dl className="grid grid-cols-1 gap-3 mt-5 pt-4 border-t border-stone-soft text-sm">
        <div>
          <dt className="text-ink-muted">Dimensions</dt>
          <dd className="font-medium text-ink">{formatDimensions(plot)}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Sun</dt>
          <dd className="font-medium text-ink">{formatSun(plot)}</dd>
        </div>
      </dl>

      <div className="mt-5">
        <ButtonLink
          href={`/plot/${plot.id}`}
          variant="secondary"
          size="sm"
          rightIcon={<ArrowRight size={16} aria-hidden="true" />}
        >
          Open plot
        </ButtonLink>
      </div>
    </article>
  );
}
