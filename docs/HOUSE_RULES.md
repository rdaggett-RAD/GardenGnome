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

## API integrations

36. **Optional APIs gracefully degrade.** If a key is missing, the relevant
    feature shows a calm message ("Connect Google Maps in Setup to draw plot
    polygons") with a link to `/setup`. The app never crashes because a key
    is missing.

37. **API keys with secrets go through Edge Functions.** Never embed a server
    key in `NEXT_PUBLIC_*` env vars. Frontend keys are domain-restricted at
    the provider.

38. **Long-running API calls show progress.** Use loading states; for very
    long operations (geocoding chains, NOAA fetches) consider an explicit
    "Fetching frost dates…" message.

---

## Definition of done

Before considering any work complete, walk through this checklist:

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
- [ ] No TypeScript errors (`npm run typecheck` passes)
