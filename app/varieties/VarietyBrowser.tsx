'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Modal } from '@/components/ui';
import type { Database, VarietySource } from '@/lib/supabase/types';

type Variety = Database['public']['Views']['all_varieties']['Row'];

const categoryLabels: Record<VarietySource, string> = {
  trees: 'Tree',
  kitchen_plants: 'Kitchen',
  cut_flowers: 'Cut Flower',
  field_crops: 'Field Crop',
};

const categoryColors: Record<VarietySource, string> = {
  trees: 'bg-moss/15 text-forest-deep',
  kitchen_plants: 'bg-ivy/15 text-forest-deep',
  cut_flowers: 'bg-terra/15 text-terra-deep',
  field_crops: 'bg-rust/15 text-rust',
};

const confidenceColors: Record<string, string> = {
  high: 'bg-moss',
  medium: 'bg-stone',
  low: 'bg-terra',
};

export function VarietyBrowser({ varieties }: { varieties: Variety[] }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<VarietySource | 'all'>('all');
  const [selected, setSelected] = useState<Variety | null>(null);

  const filtered = useMemo(() => {
    let result = varieties;

    if (activeCategory !== 'all') {
      result = result.filter((v) => v.variety_table === activeCategory);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (v) =>
          v.variety_name.toLowerCase().includes(q) ||
          v.species.toLowerCase().includes(q) ||
          v.scientific_name.toLowerCase().includes(q)
      );
    }

    return result;
  }, [varieties, search, activeCategory]);

  const categoryCounts = useMemo(() => {
    return varieties.reduce<Record<string, number>>((acc, v) => {
      acc[v.variety_table] = (acc[v.variety_table] ?? 0) + 1;
      return acc;
    }, {});
  }, [varieties]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by variety name, species, or scientific name…"
          aria-label="Search varieties"
          className="pl-10 pr-10"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink p-0.5 rounded"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filter by category"
      >
        <CategoryPill
          active={activeCategory === 'all'}
          onClick={() => setActiveCategory('all')}
          label={`All (${varieties.length})`}
        />
        {(Object.keys(categoryLabels) as VarietySource[]).map((cat) => (
          <CategoryPill
            key={cat}
            active={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
            label={`${categoryLabels[cat]} (${categoryCounts[cat] ?? 0})`}
          />
        ))}
      </div>

      <div>
        <p className="text-sm text-ink-muted mb-3" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? 'variety' : 'varieties'}
        </p>

        {filtered.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-ink-soft mb-1 font-medium">No matches</p>
            <p className="text-sm text-ink-muted">
              Try a different search term or category.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0">
            {filtered.map((variety) => (
              <li key={`${variety.variety_table}-${variety.variety_id}`}>
                <VarietyCard
                  variety={variety}
                  onClick={() => setSelected(variety)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <VarietyDetailModal
        variety={selected}
        open={selected !== null}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function CategoryPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ivy ${
        active
          ? 'bg-forest text-cream'
          : 'bg-paper-warm text-ink-soft hover:bg-stone-soft hover:text-ink'
      }`}
    >
      {label}
    </button>
  );
}

function VarietyCard({
  variety,
  onClick,
}: {
  variety: Variety;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card text-left w-full hover:shadow-card transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-ivy"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-lg leading-tight">{variety.variety_name}</h3>
        <span
          className={`badge ${categoryColors[variety.variety_table]} flex-shrink-0`}
        >
          {categoryLabels[variety.variety_table]}
        </span>
      </div>

      <p className="text-sm text-ink-soft capitalize">
        {variety.species.replace(/_/g, ' ')}
      </p>

      <p className="text-xs text-ink-muted italic mt-1 truncate">
        {variety.scientific_name}
      </p>

      {variety.notes && (
        <p className="text-sm text-ink-soft mt-3 line-clamp-3">{variety.notes}</p>
      )}

      <div className="mt-3 pt-3 border-t border-stone-soft flex items-center gap-2">
        <span
          aria-hidden="true"
          className={`w-2 h-2 rounded-full ${confidenceColors[variety.confidence] ?? 'bg-stone'}`}
        />
        <span className="text-xs text-ink-muted capitalize">
          {variety.confidence} confidence
        </span>
      </div>
    </button>
  );
}

function VarietyDetailModal({
  variety,
  open,
  onClose,
}: {
  variety: Variety | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!variety) {
    return <Modal open={open} onClose={onClose} title="" size="lg">{null}</Modal>;
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={variety.variety_name}
      description={`${variety.species.replace(/_/g, ' ')} · ${variety.scientific_name}`}
      size="lg"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`badge ${categoryColors[variety.variety_table]}`}>
            {categoryLabels[variety.variety_table]}
          </span>
          <div className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={`w-2 h-2 rounded-full ${confidenceColors[variety.confidence] ?? 'bg-stone'}`}
            />
            <span className="text-xs text-ink-muted capitalize">
              {variety.confidence} confidence
            </span>
          </div>
        </div>

        {variety.notes && (
          <div>
            <h4 className="text-sm font-medium text-ink-soft mb-1">Notes</h4>
            <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">
              {variety.notes}
            </p>
          </div>
        )}

        <p className="text-xs text-ink-muted pt-2 border-t border-stone-soft">
          Full variety details (days to maturity, spacing, pollination, etc.)
          will be shown here in Phase 2.
        </p>
      </div>
    </Modal>
  );
}
