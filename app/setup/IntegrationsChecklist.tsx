'use client';

import { ExternalLink, Check, AlertTriangle, Square } from 'lucide-react';

type Status = 'connected' | 'partial' | 'missing';

interface Integration {
  id: string;
  name: string;
  description: string;
  required: boolean;
  status: Status;
  getKeyUrl: string;
  /** Where the key lives — frontend env var or Supabase secret. */
  storage: 'frontend-env' | 'supabase-secret';
  envVar?: string;
  secretName?: string;
}

/**
 * Phase 1 placeholder: status is hardcoded. Phase 5 will replace this with a
 * real status check via Edge Function (testing each API call).
 */
const integrations: Integration[] = [
  {
    id: 'google-maps',
    name: 'Google Maps',
    description: 'Property map, address autocomplete, plot polygon drawing',
    required: true,
    status: 'missing',
    getKeyUrl: 'https://console.cloud.google.com/apis/library',
    storage: 'frontend-env',
    envVar: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
  },
  {
    id: 'google-geocoding',
    name: 'Google Geocoding',
    description: 'Convert addresses to lat/lng for property setup',
    required: true,
    status: 'missing',
    getKeyUrl: 'https://console.cloud.google.com/apis/library',
    storage: 'supabase-secret',
    secretName: 'GOOGLE_GEOCODING_API_KEY',
  },
  {
    id: 'usda-zone',
    name: 'USDA Plant Hardiness Zone',
    description: 'Determine your USDA growing zone — no key required',
    required: true,
    status: 'connected',
    getKeyUrl: 'https://planthardiness.ars.usda.gov/',
    storage: 'supabase-secret',
  },
  {
    id: 'usda-soil',
    name: 'USDA Soil Data Access',
    description: 'Soil type, pH, and drainage data — no key required',
    required: false,
    status: 'connected',
    getKeyUrl: 'https://sdmdataaccess.sc.egov.usda.gov/',
    storage: 'supabase-secret',
  },
  {
    id: 'noaa',
    name: 'NOAA Climate Data',
    description: 'Historical first/last frost dates for your property',
    required: false,
    status: 'missing',
    getKeyUrl: 'https://www.ncdc.noaa.gov/cdo-web/token',
    storage: 'supabase-secret',
    secretName: 'NOAA_API_TOKEN',
  },
  {
    id: 'openweather',
    name: 'OpenWeatherMap',
    description: 'Current weather on the dashboard',
    required: false,
    status: 'missing',
    getKeyUrl: 'https://openweathermap.org/api',
    storage: 'supabase-secret',
    secretName: 'OPENWEATHER_API_KEY',
  },
  {
    id: 'perenual',
    name: 'Perenual',
    description: 'Plant photo enrichment for varieties',
    required: false,
    status: 'missing',
    getKeyUrl: 'https://perenual.com/docs/api',
    storage: 'supabase-secret',
    secretName: 'PERENUAL_API_KEY',
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'AI-powered planning suggestions and gnome chat',
    required: false,
    status: 'missing',
    getKeyUrl: 'https://console.anthropic.com/',
    storage: 'supabase-secret',
    secretName: 'ANTHROPIC_API_KEY',
  },
];

export function IntegrationsChecklist() {
  const required = integrations.filter((i) => i.required);
  const optional = integrations.filter((i) => !i.required);

  return (
    <div className="space-y-8">
      <section aria-labelledby="required-heading">
        <h2 id="required-heading" className="text-xl mb-4">
          Required
        </h2>
        <div className="space-y-3">
          {required.map((integration) => (
            <IntegrationRow key={integration.id} integration={integration} />
          ))}
        </div>
      </section>

      <section aria-labelledby="optional-heading">
        <h2 id="optional-heading" className="text-xl mb-1">
          Optional
        </h2>
        <p className="text-sm text-ink-muted mb-4">
          Features will be hidden or limited until these are connected.
        </p>
        <div className="space-y-3">
          {optional.map((integration) => (
            <IntegrationRow key={integration.id} integration={integration} />
          ))}
        </div>
      </section>

      <div className="card bg-paper-warm border-stone">
        <h3 className="text-base mb-2">Adding keys</h3>
        <ol className="text-sm text-ink-soft space-y-2 list-decimal pl-5">
          <li>
            For <strong>frontend keys</strong> (
            <code className="text-xs bg-paper-ivory px-1 py-0.5 rounded">
              NEXT_PUBLIC_*
            </code>
            ): add to your{' '}
            <code className="text-xs bg-paper-ivory px-1 py-0.5 rounded">
              .env.local
            </code>{' '}
            file and on Render under Environment.
          </li>
          <li>
            For <strong>Supabase secrets</strong>: go to your Supabase
            project → Project Settings → Edge Functions → Manage secrets, and
            add each key there. The Edge Functions read them server-side.
          </li>
          <li>
            Restart the dev server after adding{' '}
            <code className="text-xs bg-paper-ivory px-1 py-0.5 rounded">
              .env.local
            </code>{' '}
            keys.
          </li>
        </ol>
      </div>
    </div>
  );
}

function IntegrationRow({ integration }: { integration: Integration }) {
  return (
    <article
      className="card flex items-start gap-4"
      aria-label={integration.name}
    >
      <StatusIcon status={integration.status} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-base font-medium text-ink">{integration.name}</h3>
          {integration.status === 'connected' && (
            <span className="badge badge-moss">Connected</span>
          )}
          {integration.status === 'partial' && (
            <span className="badge badge-terra">Needs attention</span>
          )}
        </div>
        <p className="text-sm text-ink-soft mt-1">{integration.description}</p>

        {integration.envVar && (
          <p className="text-xs text-ink-muted mt-2">
            Env var:{' '}
            <code className="bg-paper-warm px-1 py-0.5 rounded">
              {integration.envVar}
            </code>
          </p>
        )}
        {integration.secretName && (
          <p className="text-xs text-ink-muted mt-2">
            Supabase secret:{' '}
            <code className="bg-paper-warm px-1 py-0.5 rounded">
              {integration.secretName}
            </code>
          </p>
        )}
      </div>

      <a
        href={integration.getKeyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-ivy hover:text-forest underline whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-ivy rounded inline-flex items-center gap-1 flex-shrink-0"
      >
        Get key
        <ExternalLink size={12} aria-hidden="true" />
      </a>
    </article>
  );
}

function StatusIcon({ status }: { status: Status }) {
  if (status === 'connected') {
    return (
      <div
        className="bg-moss/15 p-2 rounded-md flex-shrink-0"
        aria-label="Connected"
      >
        <Check size={20} className="text-forest" aria-hidden="true" />
      </div>
    );
  }
  if (status === 'partial') {
    return (
      <div
        className="bg-terra/15 p-2 rounded-md flex-shrink-0"
        aria-label="Needs attention"
      >
        <AlertTriangle
          size={20}
          className="text-terra-deep"
          aria-hidden="true"
        />
      </div>
    );
  }
  return (
    <div
      className="bg-stone-soft/50 p-2 rounded-md flex-shrink-0"
      aria-label="Not configured"
    >
      <Square size={20} className="text-ink-muted" aria-hidden="true" />
    </div>
  );
}
