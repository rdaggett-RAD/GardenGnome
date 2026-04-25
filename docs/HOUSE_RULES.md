# House Rules

These are non-negotiable standards every component, page, and feature in this
codebase must meet. Codex reads this file as context. When generating new code
or modifying existing code, every rule below must be satisfied before the work
is considered done.

If you encounter existing code that violates these rules, **fix it as part of
the work you're doing**, don't extend the violation.

---

## Interactive elements

1. **Every clickable element is a real `<button>` or `<Link>` (or `<a>` for
   external).** Never `<div onClick>` or `<span onClick>`.

2. **Every button uses the `<Button>` primitive** from `@/components/ui`. Never
   roll your own button styles inline. If you need a button-styled link, use
   `<ButtonLink>`.

3. **Every interactive element has visible focus.** The primitives handle this
   already; if you write a custom interactive element, add
   `focus:outline-none focus-visible:ring-2 focus-visible:ring-ivy`.

4. **Every link points somewhere real.** No `href="#"`, no empty `onClick`. If
   the destination doesn't exist yet, link to a placeholder page that says
   "Coming soon" with a back button — never a dead link.

5. **Every CTA leads to a clear next action.** The user should never wonder
   what happens when they click.

---

## Forms

6. **Every form has loading, error, and disabled states.** Inputs must be
   disabled while the form is submitting. Use the `loading` prop on
   `<Button>`.

7. **Every input has an associated `<label>`.** Use the `<FormField>` wrapper —
   it handles label, required marker, error display, and helper text.

8. **Every form validates client-side before submit** and shows inline errors
   per field. The `<FormField error={...}>` prop displays the error inline.

9. **Required fields are visually marked** with the asterisk built into
   `<FormField required>`.

10. **Every form has a back/cancel path.** Multi-step forms link back to the
    previous step. Modal forms close via the Modal's × button.

11. **Show a success toast after a successful save.** Use `useToast()` and
    `toast({ variant: 'success', title: '...' })`.

---

## Notifications

12. **Use `<ToastProvider>` and `useToast()` for transient notifications.**
    Toasts auto-dismiss after 5s and have a × close button. Never use
    `alert()`.

13. **Use `<DismissibleBanner storageKey="...">` for persistent inline notices.**
    The user can dismiss them and the dismissal sticks via localStorage. Pass a
    stable `storageKey` and bump it (e.g., `-v2`) when the message materially
    changes.

14. **Errors never just disappear.** They require user acknowledgment (a
    toast they can dismiss, or an inline error they fix).

---

## Modals and dialogs

15. **Use the `<Modal>` primitive** for any overlay dialog. It already handles:
    Escape key, backdrop click, × close button, body scroll lock, focus
    management.

16. **Use `useConfirm()` for destructive confirmations.** Never use
    `window.confirm()`. Mark destructive actions with `destructive: true` to
    use the terra-colored confirm button.

    ```tsx
    const confirm = useConfirm();
    const ok = await confirm({
      title: 'Delete this planting?',
      description: 'This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    ```

---

## Empty and error states

17. **Every list/grid has an empty state** with a clear CTA. Use
    `<EmptyState>`.

18. **Every async fetch has an error state** with a retry option when possible.
    Use `<ErrorState onRetry={...}>`.

19. **Loading states use skeletons, not spinners** (with the exception of
    button loading states, which use a small inline spinner). Use
    `<Skeleton>` and `<SkeletonCard>`.

---

## Navigation

20. **Active nav items are visually distinct** and have `aria-current="page"`.
    The `<Sidebar>` already handles this.

21. **Every authenticated page includes the sidebar** for consistent
    navigation.

22. **Detail/nested pages have a back link** to the parent page (e.g., "← Back
    to plots").

---

## Data feedback

23. **Every save shows a toast.** Success → green moss toast. Error → red
    terra toast.

24. **Every destructive action requires confirmation** via `useConfirm()`.

25. **Every async operation shows progress** via button loading state or
    skeleton.

---

## Accessibility

26. **Every page has exactly one `<h1>`.** Section headings step down (`<h2>`,
    `<h3>`, etc.) without skipping levels.

27. **Decorative icons are marked `aria-hidden="true"`.** Meaningful icons need
    an `aria-label`.

28. **Touch targets are at least 44px on mobile.** The default Button sizes
    already meet this.

29. **Color is never the only signal.** Pair color with text, an icon, or a
    badge for status.

---

## Styling

30. **Never use raw hex colors in component code.** Use the Tailwind tokens:
    `forest`, `forest-deep`, `ivy`, `moss`, `terra`, `terra-deep`, `rust`,
    `cream`, `paper-ivory`, `paper-warm`, `stone`, `stone-soft`, `ink`,
    `ink-soft`, `ink-muted`. Defined in `tailwind.config.ts`.

31. **Use the global `card`, `btn-primary`, `btn-secondary`, `btn-ghost`,
    and `badge-*` classes** for consistent styling, OR use the primitives —
    don't redefine these patterns inline.

32. **Use `font-serif` for headings** (Fraunces) and the default `font-sans`
    for body text (DM Sans).

---

## Database access

33. **All data access goes through the Supabase client.** Server components
    use `createClient()` from `@/lib/supabase/server`. Client components use
    `createClient()` from `@/lib/supabase/client`.

34. **Never bypass Row Level Security.** The anon key plus RLS policies are
    sufficient for all user data. Service role key is for admin scripts only,
    never embedded in client code.

35. **Seed tables (`trees`, `kitchen_plants`, `cut_flowers`, `field_crops`)
    are read-only.** Don't generate INSERT/UPDATE/DELETE queries against them
    from the app — they're managed via SQL imports.

---

## Database safety — read this twice

These rules exist because a previous AI builder accidentally created a NEW
Supabase project and silently switched the app to point at the empty one,
nearly losing 257 rows of carefully-curated seed data. That cannot happen
again.

36. **NEVER run commands that create, swap, or reset Supabase projects.**
    Specifically forbidden without an explicit, in-message user approval:
    - `supabase init`, `supabase link`, `supabase start`
    - `supabase db reset`, `supabase db push`
    - Any tool/menu action labeled "Enable Cloud," "Create Project,"
      "Connect new database," or similar
    - Anything that modifies which Supabase project the app talks to

    If you encounter a missing migration tool or a "project not connected"
    error, **STOP and ask the user**. Do not call alternative tools or
    commands that might fix it by creating new infrastructure. The user has
    an existing Supabase project with real data — assume it exists and
    something is misconfigured, never that a new one needs to be created.

37. **NEVER modify environment variables or `.env*` files programmatically.**
    If a feature needs a new env var, write it into `.env.example` with a
    comment explaining what it's for, tell the user in your response what
    they need to add to `.env.local` (and to Render in production), and
    stop. Do not assume a key, generate a placeholder, or silently degrade
    behavior.

38. **All schema changes go through SQL files in `docs/sql/`.** When the
    schema needs to evolve, write a new file (e.g., `04_add_tasks_index.sql`)
    with both the change and a verification query at the end. Tell the user
    to run it manually in the Supabase SQL Editor and confirm the
    verification query returns the expected result. Do not run migrations
    via CLI or other tooling without an explicit per-message user request.

39. **Never delete user data without explicit approval.** Deleting a row,
    truncating a table, or dropping a column requires the user to confirm
    in the same message. Default behavior on any destructive change is to
    write the SQL, show it to the user, and wait.

---

## Verification — your work isn't done until it actually works

These rules also exist because of past AI builder failures. Specifically:
generating code, declaring it complete, and discovering on the next message
that the form didn't submit, the button didn't fire, the data didn't load,
or a state transition silently broke. The user is not your QA team.

40. **Before you say a feature is done, run it.** This means at minimum:
    - `npm run typecheck` — must return 0 errors
    - `npm run lint` — must return 0 warnings
    - `npm run build` — must succeed
    If any of these fail, fix it before reporting completion. Don't tell
    the user "this should work" — tell them "I ran the build and confirmed
    it succeeds."

41. **For features with user interactions (forms, buttons, navigation):
    explicitly trace the happy path in your head before reporting done.**
    Walk through:
    - User clicks the CTA → does the handler exist?
    - Form submits → is it wired to the right endpoint?
    - Server returns success → does the UI update?
    - Server returns an error → is the error displayed?
    - User clicks the back/cancel button → does it go somewhere real?
    If any of those steps doesn't have a clear answer, fix it now. Do not
    leave broken interactions for the user to find.

42. **For features that touch the database: write a verification query.**
    After implementing "save planting," show the user the SQL they can run
    in Supabase to confirm the row landed correctly:
    ```sql
    SELECT * FROM plantings WHERE plot_id = '...' ORDER BY created_at DESC LIMIT 1;
    ```
    The user should be able to verify your work without clicking through
    the UI.

43. **Don't claim a feature works without evidence.** "I implemented the
    variety picker" is not a complete report. "I implemented the variety
    picker, ran `npm run build` (succeeded), traced the flow Add Plot →
    Open Picker → Filter by Tree → Click Variety → Save Planting (all
    handlers wired, all states handled), and confirmed the planting INSERT
    matches the schema in `01_schema.sql`" is a complete report.

44. **When you can't verify something yourself, say so explicitly and ask
    the user to test.** Examples:
    - "I can't run the dev server in this environment. Please run
      `npm run dev`, navigate to /onboarding, and confirm the form submits
      and you land on /dashboard."
    - "This feature requires a Google Maps API key, which I don't have
      access to. Please add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to your
      `.env.local` and confirm the map renders."
    A clear "I need you to test X" is much better than "this should work."

---

## Stopping points — when to ask the user instead of guessing

45. **If you need an API key, secret, or environment variable, STOP and
    ask.** Don't generate placeholder values. Don't comment out the code.
    Don't degrade silently. Tell the user exactly:
    - Which env var you need
    - Where the user gets the key (link to the provider's signup page)
    - Whether it's a frontend var (`NEXT_PUBLIC_*` in `.env.local`) or a
      Supabase secret (set via `supabase secrets set` or the Dashboard)
    - Where it should be added in production (Render Environment tab)

46. **If a Supabase Edge Function is needed, STOP and ask before deploying.**
    Show the function code, tell the user the deploy command
    (`supabase functions deploy <n>`), and wait for confirmation that
    they've deployed it before continuing.

47. **If a migration is needed, STOP and ask.** Write the SQL file in
    `docs/sql/`, tell the user to run it in the Supabase SQL Editor, and
    wait for them to confirm the verification query returned the expected
    result before building features that depend on the new schema.

48. **If a third-party service needs configuration the user must do
    themselves (Render env vars, Supabase Auth redirect URLs, Google Cloud
    Console API enablement), STOP and ask.** Provide a checklist the user
    can follow, then wait for confirmation.

49. **If you encounter unexpected state — a missing table, an empty result
    where data was expected, an auth error — STOP and ask the user before
    "fixing" it.** The fix is rarely "create what's missing" — it's usually
    "the user has it configured somewhere I'm not looking." Ask first.

---

## API integrations

50. **Optional APIs gracefully degrade.** If a key is missing, the relevant
    feature shows a calm message ("Connect Google Maps in Setup to draw plot
    polygons") with a link to `/setup`. The app never crashes because a key
    is missing.

51. **API keys with secrets go through Edge Functions.** Never embed a server
    key in `NEXT_PUBLIC_*` env vars. Frontend keys are domain-restricted at
    the provider.

52. **Long-running API calls show progress.** Use loading states; for very
    long operations (geocoding chains, NOAA fetches) consider an explicit
    "Fetching frost dates…" message.

---

## Definition of done

Before considering any work complete, walk through this checklist and
confirm each item is satisfied. Don't tell the user a feature is done
until you've actually verified these.

**Code quality:**
- [ ] All CTAs link to real destinations or working handlers
- [ ] All forms validate, show errors, and show loading state
- [ ] All async operations have loading + error + empty states
- [ ] All toasts/banners/modals can be dismissed
- [ ] All destructive actions require confirmation
- [ ] All buttons use the `<Button>` primitive
- [ ] All forms use `<FormField>` for labels/errors
- [ ] All colors come from Tailwind tokens, no inline hex
- [ ] Keyboard navigation works (Tab through all interactive elements,
      Escape closes modals, Enter submits forms)
- [ ] Mobile layout works at 375px wide
- [ ] No console errors in the browser

**Verification (these are commands you actually run, not aspirations):**
- [ ] `npm run typecheck` returned 0 errors
- [ ] `npm run lint` returned 0 warnings
- [ ] `npm run build` succeeded
- [ ] Traced the happy path manually: every CTA → handler → state change
      → UI update has been thought through
- [ ] Database INSERT/UPDATE statements match the schema (cross-checked
      against `docs/sql/01_schema.sql`)
- [ ] If the feature touches an external API, either you tested it or
      you told the user exactly what to test and how
- [ ] If you couldn't fully verify something, you stated that explicitly
      with the exact testing steps for the user

**Database safety:**
- [ ] No commands run that could create or swap Supabase projects
- [ ] No `.env*` files modified programmatically
- [ ] Any schema changes are in a new SQL file in `docs/sql/`, not run
      via CLI tooling
- [ ] No destructive SQL run without explicit user approval
