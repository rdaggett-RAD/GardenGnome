'use client';

import { useState } from 'react';
import { NotebookText, Wheat } from 'lucide-react';
import { Button, EmptyState } from '@/components/ui';
import type { Database } from '@/lib/supabase/types';
import { AddPlantingForm } from './AddPlantingForm';

type TabId = 'plantings' | 'notes' | 'harvests';
type Variety = Database['public']['Views']['all_varieties']['Row'];

interface TreeDetail {
  variety_id: string;
  variety_name: string;
  self_fertile: boolean | null;
}

interface PlantingCard {
  id: string;
  varietyName: string;
  species: string;
  varietyTable: string;
  seasonYear: number;
  quantity: number;
  quantityUnit: string;
  status: string;
}

const tabs: Array<{ id: TabId; label: string }> = [
  { id: 'plantings', label: 'Plantings' },
  { id: 'notes', label: 'Notes' },
  { id: 'harvests', label: 'Harvests' },
];

const sourceLabels: Record<string, string> = {
  trees: 'Tree',
  kitchen_plants: 'Kitchen',
  cut_flowers: 'Cut flower',
  field_crops: 'Field crop',
};

export function PlotDetailTabs({
  plantings,
  varieties,
  plotId,
  userId,
  isOrchardPlot,
  existingTreeVarietyIds,
  treeDetails,
}: {
  plantings: PlantingCard[];
  varieties: Variety[];
  plotId: string;
  userId: string;
  isOrchardPlot: boolean;
  existingTreeVarietyIds: string[];
  treeDetails: TreeDetail[];
}) {
  const [activeTab, setActiveTab] = useState<TabId>('plantings');

  return (
    <section className="space-y-5" aria-label="Plot details">
      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Plot detail sections"
      >
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            type="button"
            id={`${tab.id}-tab`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-panel`}
            variant={activeTab === tab.id ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div
        id="plantings-panel"
        role="tabpanel"
        aria-labelledby="plantings-tab"
        hidden={activeTab !== 'plantings'}
      >
        <div className="space-y-4">
          {plantings.length > 0 && (
            <div className="flex justify-end">
              <AddPlantingForm
                plotId={plotId}
                userId={userId}
                varieties={varieties}
                isOrchardPlot={isOrchardPlot}
                existingTreeVarietyIds={existingTreeVarietyIds}
                treeDetails={treeDetails}
              />
            </div>
          )}

          {plantings.length > 0 ? (
            <PlantingList plantings={plantings} />
          ) : (
            <AddPlantingForm
              plotId={plotId}
              userId={userId}
              varieties={varieties}
              isOrchardPlot={isOrchardPlot}
              existingTreeVarietyIds={existingTreeVarietyIds}
              treeDetails={treeDetails}
              trigger="empty"
            />
          )}
        </div>
      </div>

      <div
        id="notes-panel"
        role="tabpanel"
        aria-labelledby="notes-tab"
        hidden={activeTab !== 'notes'}
      >
        <EmptyState
          icon={NotebookText}
          title="Notes are coming in Phase 5"
          description="Soon this plot will collect observations, photos, and seasonal notes in one calm place."
        />
      </div>

      <div
        id="harvests-panel"
        role="tabpanel"
        aria-labelledby="harvests-tab"
        hidden={activeTab !== 'harvests'}
      >
        <EmptyState
          icon={Wheat}
          title="Harvests are coming in Phase 5"
          description="Later, harvest records will help compare yields and learn from each season."
        />
      </div>
    </section>
  );
}

function PlantingList({ plantings }: { plantings: PlantingCard[] }) {
  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0">
      {plantings.map((planting) => (
        <li key={planting.id}>
          <article className="card h-full">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl leading-tight">
                  {planting.varietyName}
                </h2>
                <p className="text-sm text-ink-soft mt-1">
                  {planting.species}
                </p>
              </div>
              <span className="badge bg-paper-warm text-ink-soft">
                {sourceLabels[planting.varietyTable] ?? planting.varietyTable}
              </span>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-stone-soft text-sm">
              <div>
                <dt className="text-ink-muted">Season</dt>
                <dd className="font-medium text-ink">
                  {planting.seasonYear}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Quantity</dt>
                <dd className="font-medium text-ink">
                  {planting.quantity} {planting.quantityUnit}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Status</dt>
                <dd className="font-medium text-ink capitalize">
                  {planting.status}
                </dd>
              </div>
            </dl>
          </article>
        </li>
      ))}
    </ul>
  );
}
