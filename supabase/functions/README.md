# Supabase Edge Functions

This directory holds Supabase Edge Functions — server-side code that runs
on Supabase's edge runtime. They handle calls to external APIs that need
secret keys (Google Geocoding, NOAA, OpenWeather, Anthropic).

## Why Edge Functions?

API keys with secrets must NEVER live in frontend code (`NEXT_PUBLIC_*` env
vars are bundled into the JavaScript sent to browsers). Edge Functions read
keys from Supabase's secret manager and proxy the API calls server-side.

## Deploying an Edge Function

You'll need the Supabase CLI:

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

Then for each function:

```bash
# Set the secret (one time per key)
supabase secrets set GOOGLE_GEOCODING_API_KEY=AIza...

# Deploy the function
supabase functions deploy geocode-address
```

## Functions to build

These are referenced from the frontend. The frontend gracefully handles them
not being deployed yet — features just stay disabled.

### `geocode-address` (Phase 1, TODO)

- **Input:** `{ address: string }`
- **Output:** `{ latitude: number, longitude: number, formattedAddress: string }`
- **Calls:** Google Geocoding API
- **Secret:** `GOOGLE_GEOCODING_API_KEY`
- **Used by:** Property creation form

### `fetch-frost-dates` (Phase 1.5, TODO)

- **Input:** `{ latitude: number, longitude: number }`
- **Output:** `{ avgLastFrost: string, avgFirstFrost: string, growingSeasonDays: number }`
- **Calls:** NOAA Climate Data API
- **Secret:** `NOAA_API_TOKEN`
- **Used by:** Property creation, dashboard climate card

### `fetch-usda-zone` (Phase 1.5, TODO — no secret needed)

- **Input:** `{ latitude: number, longitude: number }`
- **Output:** `{ zone: string }`
- **Calls:** USDA Plant Hardiness Zone API (public, no key)
- **Used by:** Property creation, variety filtering

### `fetch-soil-data` (Phase 1.5, TODO — no secret needed)

- **Input:** `{ latitude: number, longitude: number }`
- **Output:** `{ soilType: string, phMin: number, phMax: number, drainageClass: string }`
- **Calls:** USDA Soil Data Access (SSURGO) API (public, no key)
- **Used by:** Property creation

---

## Function template

A barebones template for new functions. Save under `functions/<name>/index.ts`:

```typescript
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { address } = await req.json();
    if (!address) {
      return new Response(JSON.stringify({ error: 'address is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('GOOGLE_GEOCODING_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('address', address);
    url.searchParams.set('key', apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' || !data.results[0]) {
      return new Response(
        JSON.stringify({ error: 'No results for that address' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = data.results[0];
    return new Response(
      JSON.stringify({
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```
