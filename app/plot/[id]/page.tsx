import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ErrorState } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import type { Database, PlotCategory } from '@/lib/supabase/types';
import { PlotDetailTabs } from './PlotDetailTabs';

type Plot = Database['public']['Tables']['plots']['Row'];
type Planting = Database['public']['Tables']['plantings']['Row'];
type Variety = Database['public']['Views']['all_varieties']['Row'];

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

function buildPlantingCards(plantings: Planting[], varieties: Variety[]) {
  const varietyLookup = new Map(
    varieties.map((variety) => [
      `${variety.variety_table}:${variety.variety_id}`,
      variety,
    ])
  );

  return plantings.map((planting) => {
    const variety = varietyLookup.get(
      `${planting.variety_table}:${planting.variety_id}`
    );

    return {
      id: planting.id,
      varietyName: variety?.variety_name ?? planting.variety_id,
      species: variety?.species.replace(/_/g, ' ') ?? planting.variety_table,
      varietyTable: planting.variety_table,
      seasonYear: planting.season_year,
      quantity: planting.quantity,
      quantityUnit: planting.quantity_unit,
      status: planting.status,
    };
  });
}

export default async function PlotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: plot, error: plotError } = await supabase
    .from('plots')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (plotError) {
    return (
      <div className="flex min-h-screen">
        <Sidebar displayName={profile?.display_name ?? null} />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-content mx-auto">
            <ErrorState
              title="Couldn't load plot"
              description={plotError.message}
            />
          </div>
        </main>
      </div>
    );
  }

  if (!plot) {
    notFound();
  }

  const { data: plantings, error: plantingsError } = await supabase
    .from('plantings')
    .select('*')
    .eq('plot_id', plot.id)
    .order('created_at', { ascending: false });

  const { data: varieties } =
    plantings && plantings.length > 0
      ? await supabase.from('all_varieties').select('*')
      : { data: [] };

  const plantingCards = buildPlantingCards(plantings ?? [], varieties ?? []);

  return (
    <div className="flex min-h-screen">
      <Sidebar displayName={profile?.display_name ?? null} />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-content mx-auto space-y-6">
          <Link
            href="/plots"
            className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ivy rounded"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to plots
          </Link>

          <header className="space-y-4">
            <div>
              <p className="text-sm text-ink-muted uppercase tracking-wider">
                {categoryLabels[plot.category]}
              </p>
              <h1>{plot.name}</h1>
              {plot.description && (
                <p className="text-ink-soft mt-2 max-w-2xl">
                  {plot.description}
                </p>
              )}
            </div>

            <section
              aria-label="Plot summary"
              className="grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              <SummaryCard label="Area" value={formatArea(plot)} />
              <SummaryCard label="Dimensions" value={formatDimensions(plot)} />
              <SummaryCard label="Sun" value={formatSun(plot)} />
              <SummaryCard
                label="Map"
                value={plot.map_geometry ? 'Geometry saved' : 'Not mapped'}
                icon={<MapPin size={18} aria-hidden="true" />}
              />
            </section>
          </header>

          {plantingsError ? (
            <ErrorState
              title="Couldn't load plantings"
              description={plantingsError.message}
            />
          ) : (
            <PlotDetailTabs plantings={plantingCards} />
          )}
        </div>
      </main>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">{label}</p>
        {icon}
      </div>
      <p className="text-lg font-serif mt-1">{value}</p>
    </div>
  );
}
