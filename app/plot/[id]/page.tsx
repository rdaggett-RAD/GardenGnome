import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ErrorState } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import type {
  Database,
  PlotCategory,
  VarietySource,
} from '@/lib/supabase/types';
import { PlotDetailTabs } from './PlotDetailTabs';

type Plot = Database['public']['Tables']['plots']['Row'];
type Property = Database['public']['Tables']['properties']['Row'];
type Planting = Database['public']['Tables']['plantings']['Row'];
type Variety = Database['public']['Views']['all_varieties']['Row'];
type ExistingTreePlanting = Pick<Planting, 'variety_id' | 'variety_table'>;
type TreeSuitability =
  Database['public']['Functions']['trees_suitable_for_property']['Returns'][number];

interface SuitabilityInfo {
  status: 'suitable' | 'outside_zone' | 'needs_chill';
  reason: string;
}

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

const varietySourceByPlotCategory: Partial<Record<PlotCategory, VarietySource>> =
  {
    orchard: 'trees',
    kitchen_garden: 'kitchen_plants',
    cut_flower_bed: 'cut_flowers',
    field_crop: 'field_crops',
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

function buildExistingTreeIds(plantings: ExistingTreePlanting[] | null): string[] {
  return Array.from(
    new Set(
      (plantings ?? [])
        .filter((planting) => planting.variety_table === 'trees')
        .map((planting) => planting.variety_id)
    )
  );
}

function parseZoneNumber(zone: string | null): number | null {
  if (!zone) return null;
  const match = zone.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function suitabilityKey(varietyTable: string, varietyId: string) {
  return `${varietyTable}:${varietyId}`;
}

function zoneFits(
  zone: number,
  min: number | null,
  max: number | null
): boolean {
  if (min === null || max === null) return true;
  return zone >= min && zone <= max;
}

function buildTreeSuitability(
  rows: TreeSuitability[] | null
): Record<string, SuitabilityInfo> {
  return Object.fromEntries(
    (rows ?? []).map((row) => {
      const status: SuitabilityInfo['status'] = !row.zone_fit
        ? 'outside_zone'
        : !row.chill_fit
          ? 'needs_chill'
          : 'suitable';

      return [
        suitabilityKey('trees', row.variety_id),
        {
          status,
          reason: row.notes,
        },
      ];
    })
  );
}

function buildZoneSuitability(
  zone: number,
  varieties: Variety[],
  kitchenRows: Array<{
    variety_id: string;
    usda_zone_min: number | null;
    usda_zone_max: number | null;
  }>,
  flowerRows: Array<{
    variety_id: string;
    usda_zone_perennial_min: number | null;
    usda_zone_perennial_max: number | null;
  }>
): Record<string, SuitabilityInfo> {
  const kitchenById = new Map(
    kitchenRows.map((row) => [row.variety_id, row])
  );
  const flowersById = new Map(flowerRows.map((row) => [row.variety_id, row]));
  const entries: Array<[string, SuitabilityInfo]> = [];

  for (const variety of varieties) {
    if (variety.variety_table === 'kitchen_plants') {
      const row = kitchenById.get(variety.variety_id);
      if (!row) continue;
      const fits = zoneFits(zone, row.usda_zone_min, row.usda_zone_max);
      entries.push([
        suitabilityKey(variety.variety_table, variety.variety_id),
        {
          status: fits ? 'suitable' : 'outside_zone',
          reason: fits
            ? 'Suitable'
            : `Outside hardiness zone (${row.usda_zone_min}-${row.usda_zone_max})`,
        },
      ]);
    }

    if (variety.variety_table === 'cut_flowers') {
      const row = flowersById.get(variety.variety_id);
      if (!row) continue;
      const min = row.usda_zone_perennial_min;
      const max = row.usda_zone_perennial_max;
      if (min === null || max === null) continue;
      const fits = zoneFits(zone, min, max);
      entries.push([
        suitabilityKey(variety.variety_table, variety.variety_id),
        {
          status: fits ? 'suitable' : 'outside_zone',
          reason: fits ? 'Suitable' : `Outside hardiness zone (${min}-${max})`,
        },
      ]);
    }
  }

  return Object.fromEntries(entries);
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

  const { data: property } = await supabase
    .from('properties')
    .select('id,usda_zone,annual_chill_hours')
    .eq('id', plot.property_id)
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: plantings, error: plantingsError } = await supabase
    .from('plantings')
    .select('*')
    .eq('plot_id', plot.id)
    .order('created_at', { ascending: false });

  const { data: varieties } =
    plantings && plantings.length > 0
      ? await supabase.from('all_varieties').select('*')
      : { data: [] };

  const varietySource = varietySourceByPlotCategory[plot.category];
  const { data: availableVarieties, error: availableVarietiesError } =
    varietySource
      ? await supabase
          .from('all_varieties')
          .select('*')
          .eq('variety_table', varietySource)
          .order('species', { ascending: true })
          .order('variety_name', { ascending: true })
      : await supabase
          .from('all_varieties')
          .select('*')
          .order('species', { ascending: true })
          .order('variety_name', { ascending: true });

  const orchardPlotIds =
    plot.category === 'orchard'
      ? (
          await supabase
            .from('plots')
            .select('id')
            .eq('property_id', plot.property_id)
            .eq('category', 'orchard')
        ).data?.map((orchardPlot) => orchardPlot.id) ?? []
      : [];

  const { data: existingOrchardTreePlantings } =
    orchardPlotIds.length > 0
      ? await supabase
          .from('plantings')
          .select('variety_id,variety_table')
          .in('plot_id', orchardPlotIds)
          .eq('variety_table', 'trees')
      : { data: [] };

  const { data: treeDetails } =
    plot.category === 'orchard'
      ? await supabase
          .from('trees')
          .select('variety_id,variety_name,self_fertile')
      : { data: [] };

  const zoneNumber = parseZoneNumber((property as Pick<
    Property,
    'usda_zone'
  > | null)?.usda_zone ?? null);

  const { data: treeSuitability } =
    zoneNumber !== null && plot.category === 'orchard'
      ? await supabase.rpc('trees_suitable_for_property', {
          zone_num: zoneNumber,
          available_chill_hours:
            (property as Pick<Property, 'annual_chill_hours'> | null)
              ?.annual_chill_hours ?? 0,
        })
      : { data: [] };

  const { data: kitchenZoneRows } =
    zoneNumber !== null
      ? await supabase
          .from('kitchen_plants')
          .select('variety_id,usda_zone_min,usda_zone_max')
      : { data: [] };

  const { data: flowerZoneRows } =
    zoneNumber !== null
      ? await supabase
          .from('cut_flowers')
          .select(
            'variety_id,usda_zone_perennial_min,usda_zone_perennial_max'
          )
      : { data: [] };

  const plantingCards = buildPlantingCards(plantings ?? [], varieties ?? []);
  const existingTreeVarietyIds = buildExistingTreeIds(
    existingOrchardTreePlantings ?? []
  );
  const suitability =
    zoneNumber === null
      ? {}
      : {
          ...buildTreeSuitability(treeSuitability ?? []),
          ...buildZoneSuitability(
            zoneNumber,
            availableVarieties ?? [],
            kitchenZoneRows ?? [],
            flowerZoneRows ?? []
          ),
        };

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
          ) : availableVarietiesError ? (
            <ErrorState
              title="Couldn't load varieties"
              description={availableVarietiesError.message}
            />
          ) : (
            <PlotDetailTabs
              plantings={plantingCards}
              varieties={availableVarieties ?? []}
              plotId={plot.id}
              userId={user.id}
              isOrchardPlot={plot.category === 'orchard'}
              existingTreeVarietyIds={existingTreeVarietyIds}
              treeDetails={treeDetails ?? []}
              suitability={suitability}
            />
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
