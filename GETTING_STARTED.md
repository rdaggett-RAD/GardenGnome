# Getting started — push this to GitHub and hand off to Codex

## Step 1: Get the scaffold into your GitHub repo

The simplest path is to give the zip directly to Codex and let it handle
the git work. Codex has a real terminal and runs git commands properly.

### Codex prompt — initial setup

Open Codex, attach `garden-gnome.zip`, and paste this prompt verbatim:

> I'm starting a new project called Garden Gnome. I have a complete
> scaffold in the attached `garden-gnome.zip`. The repo is at
> `https://github.com/rdaggett-RAD/GardenGnome` and currently contains
> only a README. Please:
>
> 1. Clone the repo
> 2. Extract the zip and copy ALL contents (everything inside the
>    `garden-gnome/` folder, not the wrapping folder itself) into the
>    repo root, preserving folder structure
> 3. Use the new README from the scaffold (overwrite the existing one)
> 4. Run `npm install`, then `npm run typecheck`, `npm run lint`, and
>    `npm run build` — confirm all pass with zero errors before
>    committing
> 5. If anything fails, fix it before committing
> 6. Commit with the message "Initial scaffold: Next.js + Supabase + UI
>    primitives + house rules" and push to main
> 7. Show me the file tree (e.g., `find . -type d -maxdepth 3`) so I
>    can verify the structure is correct
>
> After this, BEFORE you write any new features, read these two files
> end-to-end:
> - `docs/BRIEF.md` — the product spec
> - `docs/HOUSE_RULES.md` — the standards I expect every change to meet
>
> Then summarize back to me:
> - What the product is, in 2-3 sentences
> - The phase the scaffold is currently at
> - The 3-4 most important rules from HOUSE_RULES.md that you'll
>   prioritize on every change
> - Any questions you have before starting Phase 2

## Step 2: Run it locally

After Codex pushes the scaffold, on your laptop:

```bash
git clone https://github.com/rdaggett-RAD/GardenGnome.git
cd GardenGnome
npm install
cp .env.example .env.local
# Edit .env.local — paste your Supabase URL and anon key
npm run dev
```

Open `http://localhost:3000`, sign up, and confirm you see the dashboard.

## Step 3: Configure Supabase auth

In your Supabase project → **Authentication → URL Configuration**:
- **Site URL:** `http://localhost:3000` (and your Render URL once deployed)
- **Redirect URLs:** add `http://localhost:3000/auth/callback`

If you have email confirmation turned ON, click the link in the
confirmation email after signup. To skip during development:
**Authentication → Providers → Email → "Confirm email"** toggle off.

## Step 4: Deploy to Render

1. [render.com](https://render.com) → **New** → **Blueprint**
2. Connect GitHub, select `rdaggett-RAD/GardenGnome`
3. Render reads `render.yaml`, proposes the service
4. Add environment variables in Render dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click Apply. First deploy ≈ 3 minutes.
6. Add Render URL to Supabase Auth URL Configuration.

## Step 5: Hand off Phase 2 to Codex

Once you've confirmed the scaffold runs locally and on Render, give Codex
this prompt to start the next phase:

> The scaffold is deployed and running. Now build Phase 2 from
> `docs/BRIEF.md`: the Plots feature.
>
> Specifically:
> - A "Plots" page at `/plots` with a list of all plots for the user's
>   primary property
> - "Add plot" flow with the form fields specified in BRIEF.md section
>   7 step 5 (name, category, dimensions, sun exposure)
> - "Plot detail" page at `/plot/[id]` with tabs for Plantings, Notes,
>   Harvests (Plantings is the only one with content for Phase 2)
> - Add "Plots" link to the sidebar nav
>
> Constraints:
> - Use the existing UI primitives (`Button`, `FormField`, `EmptyState`,
>   `Modal`, `useToast`, `useConfirm`). Do not roll your own.
> - Follow HOUSE_RULES.md exactly. Every CTA wired, every form
>   validated, every empty state with a real action.
> - Run `npm run typecheck`, `npm run lint`, `npm run build` before
>   reporting done. Tell me which commands succeeded.
> - Trace the happy path: I sign in → click Plots → click Add Plot →
>   fill form → submit → see the new plot in the list. Confirm every
>   step is wired before reporting done.
> - If you need a Supabase migration, an env var, or any third-party
>   config: STOP and tell me exactly what I need to add and where. Do
>   not generate placeholders or silently degrade.
>
> Before you start, confirm you've read `docs/HOUSE_RULES.md` sections
> "Database safety," "Verification," and "Stopping points." Tell me in
> plain language what each section means for this work.

## What's verified in the scaffold

Already confirmed working:

- ✅ TypeScript compiles cleanly (0 errors)
- ✅ ESLint passes with 0 warnings
- ✅ Production build succeeds (12 routes generated)
- ✅ Supabase client correctly typed against the live schema
- ✅ All UI primitives wired (Toast, Modal, ConfirmDialog, Button,
      FormField, EmptyState, DismissibleBanner)
- ✅ Auth flow end-to-end (sign-up → email confirm → sign-in → dashboard)
- ✅ Variety library queries live Supabase data

Still to do (Codex will build these in subsequent phases):

- ⚠️ Deploy `geocode-address` Edge Function (template in `supabase/functions/README.md`)
- ⚠️ Plots, plantings, tasks, harvests, notes (Phase 2-5)
- ⚠️ Property map with Google Maps (Phase 4)
- ⚠️ Horticultural rules engine (Phase 3 — `lib/horticulture/`)
- ⚠️ Dashboard "what's ripening" + "today's tasks" (Phase 6)

## Why Codex over Lovable

The previous Lovable build hit two patterns the House Rules now explicitly
prevent:

1. **Silent infrastructure changes.** Lovable accidentally created a new
   Supabase project and pointed the app at the empty one, almost losing
   the seed data. Rules 36-39 (Database safety) forbid this class of
   action without explicit user approval.

2. **Declaring work done without verification.** Lovable would generate
   code, claim it was complete, and the user would discover the form
   didn't submit, the button didn't fire, the data didn't load. Rules
   40-44 (Verification) require Codex to actually run typecheck, lint,
   and build, and to trace happy paths before reporting done.

Codex respects these rules better when they're explicit. The prompts
above include reminders to read the rules before starting — keep that
pattern as you assign new work.
