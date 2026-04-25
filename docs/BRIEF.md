# Your Friendly Garden Gnome — Lovable Build Brief

**Project:** A whole-property homestead planner that handles the tedious horticultural research (frost dates, companion planting, pollination compatibility, chill hours) so users can focus on the fun part of planning a garden.

**Scale:** Up to 50 users. Personal tool being shared with friends. Not a commercial SaaS.

**How to use this brief:** Paste this entire document into your Lovable project's initial prompt, or attach it as context. Lovable should read it end-to-end before generating code. Specific sections are labeled so you can re-paste them later to focus Lovable on a particular feature.

---

## Table of contents

1. [Product identity and audience](#1-product-identity-and-audience)
2. [Tech stack decisions (already made)](#2-tech-stack-decisions-already-made)
3. [Supabase connection — required first step](#3-supabase-connection--required-first-step)
4. [APIs to integrate — what to build vs what to flag](#4-apis-to-integrate--what-to-build-vs-what-to-flag)
5. [Database schema (already provisioned)](#5-database-schema-already-provisioned)
6. [Design system](#6-design-system)
7. [The eight-step onboarding flow](#7-the-eight-step-onboarding-flow)
8. [The three primary views](#8-the-three-primary-views)
9. [Critical horticultural rules the app must enforce](#9-critical-horticultural-rules-the-app-must-enforce)
10. [Build priority order](#10-build-priority-order)
11. [What NOT to build](#11-what-not-to-build)

---

## 1. Product identity and audience

### Voice and tone

The product persona is a **Friendly Garden Gnome** — knowledgeable, warm, encouraging, never condescending. It does the research so the user doesn't have to. When the gnome flags a problem (e.g., "Lambert cherry won't pollinate Bing cherry — same S-allele group"), it explains why in one sentence, then offers the fix.

The gnome is NOT cutesy, NOT gamified, NOT childish. Think "thoughtful old friend who happens to be a horticulturist," not "cartoon mascot." No exclamation points in copy. No emojis. The visual design is warm-paper, botanical-illustration adjacent.

### Primary user

Home gardeners planning a whole property — not just a single raised bed. Typical user has:
- A yard or small acreage (0.1 to 5 acres)
- Interest in multiple garden types simultaneously (fruit trees + vegetables + cut flowers + maybe a corn patch)
- Enough experience to know what they want to grow but not enough time to research every variety
- A desire to *plan* before planting (not a real-time "my plant is sick" diagnostic tool)

### What the product is NOT

- NOT a plant identification app (no photo ID)
- NOT a weather app (uses weather data, doesn't display it as a primary feature)
- NOT a social network (no user-to-user features in v1)
- NOT a marketplace (no buying seeds through the app)
- NOT a pest diagnostic tool (no "what's wrong with my plant" flow)
- NOT a plant-care reminder app with push notifications on day one (tasks exist, but notifications are v2)

---

## 2. Tech stack decisions (already made)

- **Frontend:** React (whatever Lovable generates — Next.js or Vite is fine)
- **Database + Auth + Storage:** Supabase (already provisioned, schema loaded, 257 seed varieties imported)
- **Styling:** Tailwind with the custom design tokens in section 6
- **Fonts:** Fraunces (serif) + DM Sans (sans) from Google Fonts
- **Maps:** Google Maps JavaScript API (user provides key)
- **AI features (optional, v2):** Anthropic Claude API (user provides key)

Lovable should **not** add a separate backend server, ORM, or state management library beyond what's idiomatic for the generated framework. Supabase client library is sufficient for all data access.

---

## 3. Supabase connection — required first step

Before Lovable generates any data-aware screens, the Supabase connection must be established.

### What the user will provide

The user already has a working Supabase project with:
- All tables created (see section 5)
- 257 seed data rows loaded (92 trees, 71 kitchen plants, 53 cut flowers, 41 field crops)
- Row Level Security enabled on all user tables
- Helper views and pollination functions created

The user will paste two values into Lovable's Supabase integration panel:
- **Supabase URL** (found at Supabase dashboard → Project Settings → API → Project URL)
- **Supabase anon key** (found at Supabase dashboard → Project Settings → API → Project API keys → `anon` `public`)

### What Lovable should do

1. Use Lovable's built-in Supabase integration to wire these credentials.
2. Generate a typed Supabase client using the existing schema. The database tables to expect are listed in section 5 — do not recreate or migrate them, they already exist.
3. All data queries go through the Supabase client. Do NOT generate mock data or local JSON fixtures.
4. On app load, the user must be authenticated (Supabase Auth email/password is fine for v1). Unauthenticated users see a simple sign-in/sign-up screen.

### What Lovable should explicitly flag to the user

After the initial scaffold, Lovable should surface a "Setup Checklist" somewhere visible in the app (an admin panel or a first-run banner) showing what's configured vs what still needs keys. See section 4.

---

## 4. APIs to integrate — what to build vs what to flag

The app needs several external APIs. Lovable should **build the integration points** but **clearly flag which keys the user needs to add** before each feature works. Each integration should gracefully degrade — missing a key should disable the feature with a clear message, not break the app.

Build a central "Integrations" or "Setup" admin screen where the user can see which services are connected and paste in keys for any that aren't. Store API keys as **Supabase secrets** (via the Supabase dashboard → Project Settings → Edge Functions → Secrets), not in the frontend code. Any API call that needs a key should go through a Supabase Edge Function that reads the key from the server-side secret — never call these APIs directly from the browser.

### Required APIs (user must provide keys)

| API | What it does | Where to get the key | Frontend or Edge Function? |
|---|---|---|---|
| **Google Maps JavaScript API** | Interactive property map, address autocomplete, drawing plot polygons | console.cloud.google.com → Enable "Maps JavaScript API" + "Places API" + "Geocoding API" | Frontend — restrict key to user's domain |
| **Google Geocoding API** | Convert address → lat/lng when user enters property address | Same as above | Edge Function |
| **OpenWeatherMap** | Current weather for property dashboard; not critical | openweathermap.org → free tier is enough | Edge Function |
| **NOAA Climate Data API** | Historical frost dates for the property's location | cdo.ncdc.noaa.gov/cdoweb/token — free, takes 1 day | Edge Function |
| **USDA Plant Hardiness Zone** | Determine zone from lat/lng | planthardiness.ars.usda.gov — **no key needed**, public API | Edge Function |

### Optional APIs (features hidden if missing)

| API | What it does | Feature disabled without it |
|---|---|---|
| **Perenual** | Fill in plant photos the seed database doesn't have | Plant imagery falls back to a generic illustration |
| **Trefle** | Additional botanical data | N/A — redundant with seed data |
| **Anthropic Claude API** | Gnome-voice explanations, natural language planning | AI-powered suggestions hidden |

### The Setup Checklist UI

Show a simple list on an admin route (`/setup` or `/settings/integrations`) with:

- ✅ green check if the key is present in Supabase secrets AND a test call succeeded
- ⚠️ yellow warning if the key is present but the test call failed
- ⬜ gray empty if no key is saved

Each row has: the service name, a one-line description of what it powers, a "Get key" link to the provider, and a paste field to save the key. The paste field should POST to a Supabase Edge Function that stores the value via Supabase's secret management (not in a user-accessible table).

**Importantly**: don't hide features that have missing keys behind an impenetrable error. The relevant UI should still render with a clear, calm message like "Connect Google Maps to see your property on a map" and a button linking to `/setup`.

---

## 5. Database schema (already provisioned)

**Critical:** these tables already exist in the user's Supabase project. Do NOT recreate, migrate, or alter them. Use them as-is.

### Seed tables (read-only reference data — user cannot edit)

All seed tables have `variety_id` as the primary key (TEXT), plus `species`, `variety_name`, `scientific_name`, `sources TEXT[]`, `confidence` (enum: low/medium/high), and `last_verified_date`.

- **`trees`** (92 rows) — orchard varieties. Key fields: `chill_hours_min/max`, `self_fertile` BOOL, `pollinators TEXT[]` (array of compatible pollinator variety_ids), `years_to_first_fruit_min/max`, `ripening_season`, `usda_zone_min/max`, `mature_height_ft_min/max`, `tree_spacing_ft_min/max`, `training_system`, `disease_notes`, `variety_notes`.

- **`kitchen_plants`** (71 rows) — vegetables, herbs, perennial edibles. Key fields: `plant_type` (annual/perennial/biennial), `days_to_maturity_min/max`, `sun_requirement`, `spacing_inches_min/max`, `row_spacing_inches`, `start_method`, `plants_per_sqft`, `growth_habit`, `mature_height_inches_min/max`, `first_harvest_year` (for perennials), `productive_lifespan_years_min/max`, `usda_zone_min/max`, `disease_resistance`, `companion_notes`, `variety_notes`.

- **`cut_flowers`** (53 rows) — cutting garden varieties. Key fields: `plant_type`, `days_to_maturity_min/max`, `sun_requirement`, `spacing_inches_min/max`, `start_method`, `pinch_at_height_inches`, `stem_length_inches_min/max`, `bloom_size_inches_min/max`, `vase_life_days_min/max`, `cut_and_come_again` BOOL, `succession_interval_days`, `bloom_color`, `usda_zone_perennial_min/max`, `overwintering_method`, `variety_notes`.

- **`field_crops`** (41 rows) — corn, pumpkins, grains, cover crops. Key fields: `crop_type` (sweet corn / dent corn / popcorn / pumpkin / etc.), `sugar_genetic_type` (su/se/sh2/synergistic for corn), `days_to_maturity_min/max`, `ear_length_inches_min/max`, `plant_height_ft_min/max`, `rows_per_ear_min/max`, `plant_spacing_inches`, `row_spacing_inches_min/max`, `min_block_rows`, `isolation_requirement` (critical text field about cross-pollination), `use_types TEXT[]`, `soil_temp_minimum_f`, `open_pollinated_or_hybrid`, `disease_resistance`, `variety_notes`.

### User tables (per-user, RLS-enforced)

- **`profiles`** — extends auth.users. Has `display_name`, `units_preference` (imperial/metric), `experience_level`, `timezone`, `onboarding_completed_at`.

- **`properties`** — a user can have multiple (home + cabin). Has `name`, `address`, `latitude`, `longitude`, `elevation_ft`, `total_acreage`, and cached climate data: `usda_zone`, `avg_last_frost_date`, `avg_first_frost_date`, `growing_season_days`, `annual_chill_hours`, `climate_refreshed_at`. Also `soil_type`, `soil_ph_min/max`, `soil_notes`.

- **`plots`** — sections within a property. Has `property_id`, `name`, `category` (enum: orchard / kitchen_garden / cut_flower_bed / field_crop / mixed), `length_ft`, `width_ft`, `area_sqft` (generated), `sun_hours`, `sun_exposure`, `slope_direction`, `slope_percent`, `map_geometry` JSONB (GeoJSON polygon), `description`, `soil_amendments`, `irrigation_type`.

- **`plantings`** — a variety planted in a plot for a season. Polymorphic reference via `variety_table` (enum) + `variety_id`. Has `plot_id`, `season_year`, `planned_start_date`, `actual_planted_date`, `expected_harvest_start/end`, `quantity`, `quantity_unit`, `status` (enum: planned/planted/harvested/failed/archived), `notes`, `failure_reason`.

- **`tasks`** — auto-generated or user-created. Has `title`, `description`, `due_date`, `priority` (1-5), `source` (auto_generated/user_created), `status` (pending/done/skipped/overdue). Links to `property_id`, `plot_id`, or `planting_id` (all optional).

- **`harvests`** — tracked yields. Has `planting_id`, `harvest_date`, `quantity`, `quantity_unit` (lbs/count/bushels/stems/pints), `quality_rating` (1-5), `notes`, `photo_urls TEXT[]`.

- **`notes`** — freeform markdown observations. Links to property/plot/planting optionally. Has `content`, `photo_urls`, `tags TEXT[]`, `observed_at`.

### Helper views and functions

- **`all_varieties`** view — unified lookup across the four seed tables with `variety_table` column indicating source. Use this for the variety search/browse surface.

- **`check_pollination_compatible(variety_a, variety_b)`** — returns `(compatible BOOLEAN, reason TEXT)`. Call this when a user is picking a second tree for pollination.

- **`list_compatible_pollinators(target_variety)`** — returns rows of varieties that will pollinate the target. Use for "which tree should I add next to my Lambert cherry?" flows.

- **`trees_suitable_for_property(zone, chill_hours)`** — returns every tree variety with `zone_fit` and `chill_fit` boolean flags plus a `notes` explanation. Use to filter or annotate the tree picker.

---

## 6. Design system

Exact values from the approved mockups. Do not substitute different colors or fonts without user approval.

### Color tokens (use exactly these — add to Tailwind config as custom colors)

```css
--cream: #fdf6e4;        /* primary background */
--paper-ivory: #faf3de;  /* card surfaces */
--paper: #f5ecd3;        /* alternate surface */
--paper-warm: #ebe0be;   /* hover / secondary */
--stone-soft: #dfd3ad;   /* dividers, subtle borders */
--stone: #d0c49f;        /* stronger borders */

--ink: #2e2a1f;          /* primary text, deep warm brown */
--ink-soft: #6b5f45;     /* secondary text */
--ink-muted: #8a7e62;    /* tertiary text, captions */

--forest-deep: #2a3820;  /* primary accent — strongest greens */
--forest: #3d4f2a;       /* headings, icons */
--ivy: #556b3a;          /* links, active states */
--moss: #7a8c5a;         /* success, "planted" status */

--terra: #b5552a;        /* warm accent — warnings, highlights */
--terra-deep: #8b3e1d;   /* pressed states, errors */
--rust: #9e5436;         /* alternate terra */
```

### Typography

- **Serif (headings, data labels):** `Fraunces` from Google Fonts. Weights: 400, 500, 600. Use for h1–h3, variety names, section titles.
- **Sans (body, UI):** `DM Sans` from Google Fonts. Weights: 400, 500, 700. Use for paragraphs, buttons, form labels.
- **Monospace (numeric data, technical specs):** system monospace stack.

Add to `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
```

### Visual character

- **Surfaces feel like cream paper.** Avoid pure white backgrounds. Default background is `--cream`.
- **Cards have warm subtle borders** (`--stone-soft` 1px) and gentle shadows. No sharp modern drop shadows — think soft, diffused.
- **Corners:** 6-10px border-radius. Not sharp, not pill-shaped.
- **Buttons:** filled primary = `--forest`, text white. Secondary = `--paper-warm` background, `--ink` text, border `--stone`. Destructive = `--terra`. Never use pure red.
- **Icons:** line-weight Lucide icons in `--forest` or `--ink-soft`. No filled/colorful icons.
- **Data visualizations:** use the full palette, but prefer earthy greens and terracottas over saturated brights. No neon.

### Layout

- **Max content width:** ~1200px for primary screens. Sidebar nav 240px fixed. Main content area centered within remaining space.
- **Padding generosity:** 24px standard card padding, 16px on mobile. Scale up to 32-40px for hero sections.
- **Generous vertical rhythm:** paragraph line-height 1.6, sections separated by 48-64px vertical space.
- **Mobile responsive** but **desktop-first design** — the primary use case is planning at a laptop, not a phone.

---

## 7. The eight-step onboarding flow

First-run experience. After sign-up, the user moves through these steps. Each step saves to Supabase on completion — users can pause and resume. Mark `profiles.onboarding_completed_at` when done.

### Step 1: Welcome and set expectations

One screen, centered content. Headline: "Your garden, properly planned." Subcopy explains: "The Garden Gnome handles frost dates, pollination groups, companion planting, and chill hours — so you can focus on what to grow." One "Let's begin" button.

### Step 2: Create your property

Form: `name` (required, e.g., "Home" or "The Farm"), `address` (autocomplete via Google Places API), `total_acreage` (optional, defaults to the smallest sensible value).

When address is selected:
- Geocode to get lat/lng (Edge Function)
- Call USDA Plant Hardiness Zone API for the zone
- Call NOAA API for historical first/last frost dates
- Save all of this to `properties` table
- Show a confirmation card: "You're in zone 6b, with a growing season of ~175 days from May 5 to Oct 26."

If any API is unavailable, let the user proceed with fields blank and explain the feature will unlock when they add the relevant key in Setup.

### Step 3: Soil basics

Simple form for `soil_type` (dropdown: clay / loam / sandy / rocky / unsure), `soil_ph_min/max` (optional, slider 4.5–8.0). "Skip for now" is prominent. Don't gate progress on this.

### Step 4: Choose garden types

Multi-select cards — large, visual. Options:
- Orchard (fruit and nut trees)
- Kitchen Garden (vegetables and herbs)
- Cut Flower Bed
- Field Crops (corn, pumpkins, grains)
- Mixed Use

Selections determine which plot categories are available in the next step. Store on `profiles` (add a column if needed) or derive from plots created.

### Step 5: Define your first plot

For each garden type selected, show a guided "define your plot" form:
- `name` (e.g., "South Orchard", "Raised Bed #1")
- `category` (prefilled from step 4)
- `length_ft` × `width_ft` (area auto-calculated)
- `sun_hours` (slider 0–14)
- `sun_exposure` (auto-derived from sun_hours but editable)
- "Draw on map" button — opens Google Maps overlay centered on property, user draws a polygon → saved to `map_geometry`

"Add another plot" or "Move on" buttons. User can skip the map step.

### Step 6: Pick varieties to grow

For each plot, show a filtered variety picker:
- Filters applied automatically: zone fit (using `trees_suitable_for_property` or equivalent logic for other categories), plot category
- Search bar at top
- Faceted filters: species, days to maturity range, sun requirement
- Variety cards show: name (Fraunces), species, days to maturity, confidence dot, key callout (e.g., "Self-fertile" or "Needs pollinator")
- Click a card → detail sheet with full variety notes, disease resistance, source list

User taps varieties to add them as `plantings` with `status='planned'`, `season_year=current year`. Quantities default to 1.

**For orchard plots specifically:** when a user adds a non-self-fertile tree, show a gentle inline warning: "Lambert cherry needs a pollinator nearby. Here are compatible varieties:" and render the output of `list_compatible_pollinators`.

### Step 7: Review plan

Summary screen: "Your plan for [current year]" with cards grouped by plot. Each card shows plot name + list of planned varieties + total area used. User can remove plantings or go back to edit.

At the bottom: estimated calendar of major dates (last frost → first plantings → first harvests → first frost). Pull from frost data + variety days-to-maturity.

### Step 8: Your dashboard is ready

Final screen celebrates completion (subtly — no confetti). Explains the three views they'll use going forward (section 8). CTA: "Open my dashboard."

Set `profiles.onboarding_completed_at = now()`.

---

## 8. The three primary views

After onboarding, the app has three main navigation destinations. These are the persistent screens a user returns to across the season.

### View 1: Homestead Dashboard (route: `/`)

The landing page for returning users. Top of screen shows property identity and current-year summary.

**Must include:**
- Property selector (if user has multiple) — dropdown
- Climate summary card — zone, days until next frost, chill hours accumulated so far this season (if orchard exists), current weather (from OpenWeather if connected)
- "Today's tasks" — pending tasks with `due_date <= today+3`, grouped by property, sortable
- "What's ripening" — plantings with `expected_harvest_start` within the next 30 days
- "Garden at a glance" — small visual summary showing each plot with count of active plantings
- Recent notes (last 5 notes across any plot or planting)

Keep it scannable. No walls of text. Cards with clear hierarchy. If a user has nothing yet, empty states gently point to what to do next.

### View 2: Property Map (route: `/property/:id/map`)

Google Maps embed centered on the property. Polygons overlaid for each plot, colored by category using the design tokens. Clicking a plot opens a side panel with plot details and its plantings. User can edit plot shape, add new plots, move existing ones.

This is the spatial view. It's for "where things are" rather than "what things are."

**Include a legend** showing which color = which category (orchard = forest-deep, kitchen = ivy, cut flowers = terra, field crops = rust, mixed = stone).

### View 3: Plot Detail (route: `/plot/:id`)

The deep view into one plot. Tabs or sections:

- **Plantings** — list of all plantings in this plot, across seasons. Filterable by year and status. "Add planting" button opens the variety picker.
- **Timeline** — horizontal calendar-style view showing planned_start → planted → expected_harvest for each planting in the current year.
- **Notes** — freeform notes and photos tied to this plot.
- **Harvests** — when any planting in this plot reaches `status='harvested'`, show harvest records here.

For **orchard** plots: show pollination compatibility diagram. For each non-self-fertile tree, visually connect it to its pollinator(s) with lines, and flag any trees without a partner.

For **field crop** plots with corn: show isolation distance warnings. If two corn varieties of different `sugar_genetic_type` are planted in the same plot or within 200 feet (can't compute distance without map geometry, so check within-plot), show a warning card.

---

## 9. Critical horticultural rules the app must enforce

These are the domain facts baked into the seed data and helper functions. The app should surface them at the right moment — not overwhelm the user with all warnings at once, but intercept genuine mistakes before they commit.

### Orchard / tree rules

1. **Self-fertility check.** When a user adds a tree to a plot, check `trees.self_fertile`. If FALSE and no compatible pollinator is already in the same property's orchard plots, show a warning and list compatible pollinators via `list_compatible_pollinators()`.

2. **S-allele incompatibility (sweet cherry).** Lambert, Bing, and Royal Ann all share an S-allele group and cannot pollinate each other. This is already encoded in the `pollinators` arrays — don't reimplement the logic, just use `check_pollination_compatible()`.

3. **Apple bloom group compatibility.** Honeycrisp is in bloom group 4; Cosmic Crisp shares parentage and they cannot pollinate each other. Same — use the helper function.

4. **Triploid sterility.** Arkansas Black and Stayman Winesap have sterile pollen. They can receive pollen but cannot pollinate others. Reflected in data: these varieties have empty pollinators arrays and are absent from every other variety's pollinators array.

5. **Pecan Type I vs Type II.** Pawnee is Type I (protandrous); Kanza, Lakota, Stuart, Mohawk are Type II (protogynous). A Type I needs a Type II partner and vice versa. Encoded in pollinators arrays.

6. **Zone and chill-hour fit.** Before suggesting a tree, call `trees_suitable_for_property(zone, chill_hours)`. If a user explicitly adds a tree outside their zone or below chill-hour requirement, don't block them — warn them with the specific reason: "Honeycrisp needs 800+ chill hours; your area gets ~600."

7. **Pawpaw is self-incompatible.** Even with multiple pawpaw trees, if they're clones (same variety), they won't set fruit. Two different named varieties needed.

8. **European vs Japanese plums cannot cross.** The species column distinguishes these — `check_pollination_compatible()` already returns false across species.

### Kitchen garden rules

9. **Onion day-length sensitivity.** Long-day onions (Walla Walla, Yellow Sweet Spanish) won't bulb south of ~37°N latitude. Short-day onions (Red Burgundy) won't bulb north of ~35°N. Day-neutral (Candy) work in most of the country. When user adds an onion, compare their property latitude to the variety's day-length category (implicit in the variety notes — surface in the warning).

10. **Garlic hardneck vs softneck.** Hardneck (Music, German Extra Hardy, Chesnok Red) needs cold winters; warn if user's zone is 9+. Softneck (Inchelium Red) handles warmer zones better. Surface at variety pick time.

11. **Asparagus and rhubarb are long-term commitments.** When user adds either, show a note: "Asparagus gives its first real harvest in year 3. Plant it where it can stay for 20 years."

12. **Rhubarb leaves are toxic.** When user adds rhubarb, surface this once as a safety note.

13. **Cilantro bolts in heat.** When user adds cilantro, auto-suggest succession plantings every 2-3 weeks.

14. **Mint spreads aggressively.** When user adds mint, show a gentle warning: "Mint spreads through underground runners. Consider growing in a buried container."

15. **Squash vine borer species routing.** `Cucurbita moschata` (butternut, some tromboncino) resists vine borers. `C. pepo` (zucchini, acorn, most pumpkins) does not. When user adds a C. pepo squash, mention this once if the user is in a vine-borer-prevalent zone (really, just mention it always — it's universally relevant).

### Cut flower rules

16. **Sweet pea seeds are poisonous.** Unlike garden peas. Surface as a safety note when user adds any sweet pea variety.

17. **Iceland poppies need stem searing.** When user adds `poppy_iceland_*`, note: "Harvest when buds show color; sear stem ends in boiling water 7-10 seconds or the flowers wilt within hours."

18. **Larkspur and Bells of Ireland need cold stratification.** Surface at variety pick time: "These seeds need 2 weeks in the fridge before planting. Or direct-sow in late fall."

19. **Lisianthus is extremely hard from seed.** When user adds lisianthus, strongly recommend buying plugs instead.

20. **Dinnerplate dahlias have shorter vase life.** When user adds a dinnerplate dahlia, note that ball-form dahlias last longer if vase life matters to them.

### Field crop rules

21. **Sweet corn genetic type isolation.** If user plants two sweet corns of different `sugar_genetic_type` (su/se/sh2/synergistic) in the same plot, warn about cross-pollination ruining the supersweet (sh2) variety. Suggest: plant only one genetic type, or isolate by 200+ feet, or stagger by 12+ days.

22. **Supersweet corn needs 65°F+ soil.** If user plans a sh2 variety with `actual_planted_date` too early, warn.

23. **Pumpkin species won't cross with each other but within species they do.** C. pepo, C. moschata, and C. maxima are separate species. Within-species varieties (two C. pepos) will cross if seed-saving. Informational note only.

### Cover crop rules

24. **Rye overwinters and must be terminated; oats winter-kill.** When user adds a cover crop, surface the termination plan.

### General timing rules

25. **Days to maturity are from transplant, not seed.** Most varieties. Cilantro and carrots and some direct-sown crops count from seed. Variety notes indicate when relevant.

26. **Frost dates drive everything.** Use `properties.avg_last_frost_date` and `avg_first_frost_date`. When scheduling a planting:
    - Cool-season crops: last frost - (days to maturity + margin)
    - Warm-season crops: last frost + 1-2 weeks → harvest before first frost
    - Overwintering: plant before first frost with enough time to establish

---

## 10. Build priority order

Do NOT try to build everything at once. Build in this order, confirm each works, then continue:

### Phase 1: Authentication and property setup (the bare skeleton)

1. Sign-up / sign-in flow using Supabase Auth
2. Onboarding step 1 (welcome) and step 2 (create property with address geocoding)
3. Empty dashboard that says "Welcome, [name]"
4. Setup / Integrations page stubbed with checklist UI

At this point, the user should be able to: create an account, create a property with an address, see their dashboard. Nothing else.

### Phase 2: Plots and variety picker

5. Onboarding steps 3-5 (soil, garden types, first plot)
6. Plot Detail view (without map geometry — just the list/tabs)
7. Variety picker driven by the Supabase seed data, with search and category filters
8. Adding a planting in planned status

### Phase 3: The gnome's intelligence

9. Pollination compatibility warnings in the variety picker
10. Zone / chill-hour fit annotations on tree cards
11. Onion day-length warning
12. The key horticultural rules from section 9

### Phase 4: Property map

13. Google Maps integration on the property view
14. Drawing plot polygons
15. Map legend and plot click-to-detail

### Phase 5: Tasks, harvests, notes

16. Auto-generated tasks based on planting schedules
17. Manual task creation
18. Harvest logging
19. Notes system

### Phase 6: Polish

20. Dashboard "what's ripening" and "today's tasks"
21. Timeline view on plot detail
22. Mobile responsive refinement
23. Empty states throughout

**Do not** build v2 features yet: multi-user collaboration, push notifications, AI gnome chat, PDF export, seed ordering integration.

---

## 11. What NOT to build

- **Do not generate seed data.** All 257 varieties are already in Supabase. Query them, don't duplicate them.
- **Do not create a separate backend server.** Supabase Edge Functions handle everything server-side.
- **Do not use localStorage for persistent data** except UI preferences (sidebar collapsed, theme, etc.). All real data lives in Supabase.
- **Do not build a CMS for editing seed varieties.** These are curated and should not be user-editable in v1.
- **Do not add collaborator / sharing features.** One user per property in v1.
- **Do not build push notifications, email digests, or SMS.** Tasks have due dates, user checks them manually.
- **Do not build plant photo ID from camera.** No ML, no image recognition.
- **Do not integrate with seed retailers or nurseries.** No affiliate links, no "buy now" buttons.
- **Do not build social features.** No comments, no likes, no public gardens.
- **Do not gamify.** No badges, no XP, no streaks.

---

## Appendix: Running example to sanity-check everything works

Once Phase 1-3 are built, the following should work end-to-end:

1. User "rd@example.com" signs up.
2. Creates property "Home" at address "123 Main St, Peoria AZ."
3. App geocodes, determines zone 9b, returns frost dates.
4. User creates a plot called "South Orchard" with category=orchard, 400 sqft, full sun.
5. User opens variety picker, filters to trees.
6. User adds `cherry_lambert` to the plot.
7. **The app warns:** "Lambert sweet cherry needs a pollinator. Compatible varieties: Van, Stella, Rainier..."
8. User adds `cherry_bing` as the second tree.
9. **The app warns:** "Bing and Lambert can't pollinate each other — same S-allele group. Try Van or Stella instead."
10. User switches to `cherry_van`. Warning clears.
11. User navigates to `/plot/:id`, sees both trees listed, sees pollination diagram showing Van → Lambert connection.
12. User goes to dashboard, sees "2 plantings in planned status" and "Today's tasks: Start cherry trees by Feb 15."

If this runs cleanly end to end, the core product works. Everything else is embellishment.

---

**End of brief.** Lovable should use this as a complete specification. Any ambiguity should be resolved by asking the user (RD) directly before generating code in that area.
