'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Sprout, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  Button,
  DismissibleBanner,
  EmptyState,
  FormField,
  Input,
  Modal,
  useToast,
} from '@/components/ui';
import type { Database } from '@/lib/supabase/types';

type Variety = Database['public']['Views']['all_varieties']['Row'];
type CompatiblePollinator =
  Database['public']['Functions']['list_compatible_pollinators']['Returns'][number];

interface TreeDetail {
  variety_id: string;
  variety_name: string;
  self_fertile: boolean | null;
}

interface PollinationWarning {
  varietyName: string;
  compatiblePollinators: CompatiblePollinator[];
}

const sourceLabels: Record<string, string> = {
  trees: 'Tree',
  kitchen_plants: 'Kitchen',
  cut_flowers: 'Cut flower',
  field_crops: 'Field crop',
};

const confidenceColors: Record<string, string> = {
  high: 'bg-moss',
  medium: 'bg-stone',
  low: 'bg-terra',
};

export function AddPlantingForm({
  plotId,
  userId,
  varieties,
  isOrchardPlot,
  existingTreeVarietyIds,
  treeDetails,
  trigger = 'button',
}: {
  plotId: string;
  userId: string;
  varieties: Variety[];
  isOrchardPlot: boolean;
  existingTreeVarietyIds: string[];
  treeDetails: TreeDetail[];
  trigger?: 'button' | 'empty';
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Variety | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingPollination, setCheckingPollination] = useState(false);
  const [pollinationWarning, setPollinationWarning] =
    useState<PollinationWarning | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const treeDetailById = useMemo(() => {
    return new Map(treeDetails.map((tree) => [tree.variety_id, tree]));
  }, [treeDetails]);

  const filtered = useMemo(() => {
    const trimmed = search.trim().toLowerCase();
    if (!trimmed) return varieties;

    return varieties.filter((variety) => {
      return (
        variety.variety_name.toLowerCase().includes(trimmed) ||
        variety.species.toLowerCase().includes(trimmed) ||
        variety.scientific_name.toLowerCase().includes(trimmed)
      );
    });
  }, [search, varieties]);

  function resetAndClose() {
    setOpen(false);
    setSearch('');
    setSelected(null);
    setLoading(false);
    setCheckingPollination(false);
    setPollinationWarning(null);
    setFormError(null);
  }

  async function evaluatePollination(variety: Variety) {
    setPollinationWarning(null);
    setFormError(null);

    if (!isOrchardPlot || variety.variety_table !== 'trees') {
      return;
    }

    const treeDetail = treeDetailById.get(variety.variety_id);
    if (!treeDetail || treeDetail.self_fertile !== false) {
      return;
    }

    setCheckingPollination(true);

    const supabase = createClient();
    const compatibilityResults = await Promise.all(
      existingTreeVarietyIds.map((existingId) =>
        supabase.rpc('check_pollination_compatible', {
          variety_a: variety.variety_id,
          variety_b: existingId,
        })
      )
    );

    const hasCompatiblePollinator = compatibilityResults.some((result) =>
      result.data?.some((row) => row.compatible)
    );

    if (hasCompatiblePollinator) {
      setCheckingPollination(false);
      return;
    }

    const { data: compatiblePollinators } = await supabase.rpc(
      'list_compatible_pollinators',
      { target_variety: variety.variety_id }
    );

    setPollinationWarning({
      varietyName: treeDetail.variety_name,
      compatiblePollinators: compatiblePollinators ?? [],
    });
    setCheckingPollination(false);
  }

  function selectVariety(variety: Variety) {
    setSelected(variety);
    void evaluatePollination(variety);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selected) {
      setFormError('Choose a variety to add');
      return;
    }

    setLoading(true);
    setFormError(null);

    const supabase = createClient();
    const { error } = await supabase.from('plantings').insert({
      plot_id: plotId,
      user_id: userId,
      variety_table: selected.variety_table,
      variety_id: selected.variety_id,
      season_year: new Date().getFullYear(),
      quantity: 1,
      quantity_unit: 'plants',
      status: 'planned',
    });

    if (error) {
      setFormError(error.message);
      setLoading(false);
      return;
    }

    toast({
      variant: 'success',
      title: 'Planting added',
      description: `${selected.variety_name} is planned for this plot.`,
    });
    resetAndClose();
    router.refresh();
  }

  return (
    <>
      {trigger === 'empty' ? (
        <EmptyState
          icon={Sprout}
          title="No plantings yet"
          description="This plot is ready for trees, vegetables, flowers, or field crops."
          actionLabel="Add planting"
          onAction={() => setOpen(true)}
        />
      ) : (
        <Button
          type="button"
          onClick={() => setOpen(true)}
          leftIcon={<Plus size={18} aria-hidden="true" />}
        >
          Add planting
        </Button>
      )}

      <Modal
        open={open}
        onClose={resetAndClose}
        title="Add planting"
        description="Search the variety library and add one planned planting."
        size="xl"
        preventBackdropClose={loading}
      >
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <FormField
            label="Search varieties"
            htmlFor="variety-search"
            helper={`${filtered.length} ${filtered.length === 1 ? 'match' : 'matches'}`}
          >
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
                aria-hidden="true"
              />
              <Input
                id="variety-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, species, or scientific name"
                className="pl-10 pr-10"
                disabled={loading}
                autoFocus
              />
              {search && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2"
                  disabled={loading}
                >
                  <X size={16} aria-hidden="true" />
                </Button>
              )}
            </div>
          </FormField>

          <div
            className="max-h-[22rem] overflow-y-auto pr-1"
            aria-label="Variety results"
          >
            {filtered.length > 0 ? (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 list-none p-0">
                {filtered.map((variety) => {
                  const active =
                    selected?.variety_table === variety.variety_table &&
                    selected?.variety_id === variety.variety_id;

                  return (
                    <li key={`${variety.variety_table}-${variety.variety_id}`}>
                      <article
                        className={`card h-full ${active ? 'ring-2 ring-ivy' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg leading-tight">
                              {variety.variety_name}
                            </h3>
                            <p className="text-sm text-ink-soft capitalize mt-1">
                              {variety.species.replace(/_/g, ' ')}
                            </p>
                          </div>
                          <span className="badge bg-paper-warm text-ink-soft">
                            {sourceLabels[variety.variety_table]}
                          </span>
                        </div>

                        <p className="text-xs text-ink-muted italic mt-2 truncate">
                          {variety.scientific_name}
                        </p>

                        {variety.notes && (
                          <p className="text-sm text-ink-soft mt-3 line-clamp-2">
                            {variety.notes}
                          </p>
                        )}

                        <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-stone-soft">
                          <div className="flex items-center gap-2">
                            <span
                              aria-hidden="true"
                              className={`w-2 h-2 rounded-full ${
                                confidenceColors[variety.confidence] ?? 'bg-stone'
                              }`}
                            />
                            <span className="text-xs text-ink-muted capitalize">
                              {variety.confidence} confidence
                            </span>
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            variant={active ? 'primary' : 'secondary'}
                            onClick={() => selectVariety(variety)}
                            disabled={loading}
                          >
                            {active ? 'Selected' : 'Select'}
                          </Button>
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="card text-center py-10">
                <p className="font-medium text-ink">No matching varieties</p>
                <p className="text-sm text-ink-muted mt-1">
                  Try another name, species, or scientific name.
                </p>
              </div>
            )}
          </div>

          {selected && (
            <div className="rounded-md border border-stone-soft bg-paper-ivory px-3 py-2 text-sm text-ink-soft">
              Selected:{' '}
              <span className="font-medium text-ink">
                {selected.variety_name}
              </span>
            </div>
          )}

          {formError && (
            <div
              role="alert"
              className="text-sm text-terra-deep bg-terra/10 border border-terra/30 rounded-md px-3 py-2"
            >
              {formError}
            </div>
          )}

          {checkingPollination && (
            <div className="text-sm text-ink-soft bg-paper-ivory border border-stone-soft rounded-md px-3 py-2">
              Checking pollination fit...
            </div>
          )}

          {pollinationWarning && !checkingPollination && (
            <DismissibleBanner
              storageKey={null}
              variant="warning"
              title={`${pollinationWarning.varietyName} needs a pollinator`}
              description="No compatible pollinator is planned in this property's orchard plots yet. You can still add it now and plant a partner nearby."
              action={
                pollinationWarning.compatiblePollinators.length > 0 ? (
                  <div>
                    <p className="text-xs font-medium text-ink-soft mb-1">
                      Plant one of these nearby:
                    </p>
                    <ul className="flex flex-wrap gap-2 list-none p-0">
                      {pollinationWarning.compatiblePollinators
                        .slice(0, 6)
                        .map((pollinator) => (
                          <li
                            key={pollinator.pollinator_variety_id}
                            className="badge bg-cream text-ink-soft border border-stone-soft"
                          >
                            {pollinator.pollinator_variety_name}
                          </li>
                        ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-xs text-ink-soft">
                    No compatible pollinators are listed for this variety.
                  </p>
                )
              }
            />
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-between pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={resetAndClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {loading ? 'Adding...' : 'Add planned planting'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
