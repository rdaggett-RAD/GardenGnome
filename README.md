# Your Friendly Garden Gnome

A whole-property homestead planner that handles frost dates, pollination
groups, companion planting, and chill hours — so you can focus on what to
grow.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind · Supabase
(Postgres + Auth) · Render (hosting)

---

## Quickstart

### Prerequisites

- Node.js 20 or later
- A Supabase project with the schema and seed data already loaded
- Git

### Local setup

```bash
# 1. Clone this repo
git clone https://github.com/rdaggett-RAD/GardenGnome.git
cd GardenGnome

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Open .env.local and fill in:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
# (see Supabase Setup below for where to find these)

# 4. Run the dev server
npm run dev

# 5. Open http://localhost:3000
```

That's it. Sign up, sign in, and you should land on the dashboard.

---

## Supabase setup

If you're starting from scratch and your Supabase project isn't loaded yet:

1. Create a new project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run the files in this order:
   - `docs/sql/01_schema.sql` — creates tables, RLS policies, triggers
   - `docs/sql/02_import_seed_data.sql` — loads the 257 variety reference rows
     (you'll need to upload the CSVs in `docs/seed_data/` to the staging
     tables first — see `docs/sql/02_import_plan.md`)
   - `docs/sql/03_functions_and_views.sql` — adds helper views and pollination
     compatibility functions
3. Verify counts: trees 92, kitchen_plants 71, cut_flowers 53, field_crops 41.
4. Go to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **`anon` `public` key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Configure auth:
   - **Authentication → URL Configuration → Site URL**: your Render URL (or
     `http://localhost:3000` for local)
   - **Authentication → URL Configuration → Redirect URLs**: add
     `http://localhost:3000/auth/callback` and your production
     `/auth/callback` URL.
   - **Authentication → Providers → Email**: configure as desired (you can
     turn off email confirmation for development).

---

## Deploying to Render

This repo includes a `render.yaml` that defines the deployment.

1. Push the repo to GitHub (you've already done this if you're reading this).
2. Go to [render.com](https://render.com) → **New** → **Blueprint**.
3. Connect your GitHub account and select this repo.
4. Render reads `render.yaml` and proposes a service named `garden-gnome`.
5. **Set environment variables** in the Render dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (optional for v1)
   - others as needed (see `.env.example`)
6. Click **Apply**. Render runs `npm install && npm run build`, then starts
   the server.
7. Once live, copy your Render URL and add it to Supabase → Authentication →
   URL Configuration → Site URL and Redirect URLs.

Subsequent pushes to the `main` branch trigger automatic redeploys.

---

## Project structure

```
.
├── app/                       # Next.js App Router pages
│   ├── auth/                  # Sign-in, sign-up, email callback
│   ├── dashboard/             # Authenticated landing page
│   ├── onboarding/            # First-run property setup flow
│   ├── varieties/             # Variety library (browse all 257)
│   ├── setup/                 # API integrations checklist
│   ├── globals.css            # Global styles + design tokens
│   ├── layout.tsx             # Root layout, fonts, providers
│   └── page.tsx               # Landing page
│
├── components/
│   ├── ui/                    # Foundation primitives — USE THESE
│   │   ├── Button.tsx
│   │   ├── ButtonLink.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── FormField.tsx
│   │   ├── EmptyState.tsx
│   │   ├── DismissibleBanner.tsx
│   │   └── index.ts           # Barrel export
│   ├── layout/
│   │   └── Sidebar.tsx        # Authenticated nav
│   └── Providers.tsx          # ToastProvider + ConfirmProvider
│
├── lib/
│   └── supabase/
│       ├── client.ts          # Browser Supabase client
│       ├── server.ts          # Server Supabase client
│       ├── middleware.ts      # Session refresh
│       └── types.ts           # Database type definitions
│
├── docs/
│   ├── BRIEF.md               # Full product spec (READ THIS FIRST)
│   ├── HOUSE_RULES.md         # Code standards, every PR follows these
│   ├── sql/                   # Database setup SQL
│   ├── seed_data/             # Variety CSVs (sources for SQL imports)
│   └── mockups/               # Visual design references (HTML)
│
├── middleware.ts              # Next.js middleware (auth session refresh)
├── render.yaml                # Render deployment config
├── tailwind.config.ts         # Design tokens (colors, fonts)
└── package.json
```

---

## How to add a new feature

The product is designed to be built in phases. See `docs/BRIEF.md` for the
complete plan. Phases 1-3 are scaffolded; Phases 4-6 still need to be built.

### Working with Codex (or another AI coding tool)

When asking AI to build a new feature, **point it at three files first**:

1. `docs/BRIEF.md` — the product spec
2. `docs/HOUSE_RULES.md` — the standards every component must meet
3. The closest existing similar feature (e.g., to build the Plot Detail view,
   point at `app/dashboard/page.tsx` for the page pattern and
   `app/varieties/VarietyBrowser.tsx` for client-side interactivity)

The House Rules ensure consistency: every CTA wired up, every modal
dismissable, every form validating, every list with a proper empty state.

**Build expectations for autonomous AI coding:**

- Codex should run `npm run typecheck`, `npm run lint`, and `npm run build`
  before declaring work done. Reports without verification are incomplete.
- Codex should trace happy paths and error paths in its head before
  reporting done. "I implemented the variety picker" is not enough — see
  House Rules sections "Verification" and "Definition of done."
- Codex should STOP and ask the user when it needs a secret, an API key,
  a Supabase migration to be run, an Edge Function deployed, or any
  third-party config (Render env vars, Supabase Auth redirect URLs).
  See House Rules section "Stopping points."
- Codex should NEVER create new Supabase projects, modify `.env*` files
  programmatically, or run migrations via CLI tooling. See House Rules
  section "Database safety."

### Working manually

```bash
# Type-check before committing
npm run typecheck

# Lint
npm run lint

# Build (catches issues that lint doesn't)
npm run build
```

---

## Phase status

- ✅ **Phase 1** — Auth, dashboard, scaffold (this codebase)
- ✅ **Phase 1.5** — Variety library (browse the 257 reference varieties)
- 🚧 **Phase 2** — Plots, plot detail, variety picker for adding plantings
- 🚧 **Phase 3** — Pollination warnings, zone fit, horticultural rules engine
- ⬜ **Phase 4** — Property map (Google Maps + plot polygon drawing)
- ⬜ **Phase 5** — Tasks, harvests, notes
- ⬜ **Phase 6** — Polish, mobile refinement, dashboard ripening view

---

## Common questions

**Why is the variety library read-only?**

The 257 varieties were carefully researched and source-tagged. Letting users
edit them would corrupt the data over time. Future versions may allow user-
specific overrides.

**Why does the "Add property" flow ask for an address but skip the map?**

Phase 1 doesn't include Google Maps. The address is geocoded if a Maps key is
configured, otherwise the form continues with text-only address. Phase 4
adds the interactive map.

**Where do I add a new horticultural rule?**

The rules live in two places:

1. **Data-driven rules** (e.g., "Lambert pollinates Van") — encoded in the
   `pollinators` array of the seed CSVs. Re-import the CSVs or update via SQL.
2. **App-level rules** (e.g., "warn user about onion day-length") — a TBD
   rules engine in `lib/horticulture/`. See Phase 3 in the BRIEF.

**My deployment is broken / Supabase queries return nothing.**

Check Row Level Security. RLS is enabled on all user tables; if you're
querying without an authenticated session, results will be empty. Check
`Supabase Dashboard → Authentication → Users` to confirm your test account
exists.

---

## License

Personal project. All rights reserved.
