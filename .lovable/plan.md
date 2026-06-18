## Plan

### 1. Parse extraction JSON in `dashboard.tsx` (Option B)

In `openInboxMut`, select the `extraction` column from `polisher_inbox` and map nested values into article columns when individual flat fields are missing. Mapping:

- `hook` ← `row.hook ?? extraction.hook ?? extraction.headline`
- `cta` ← `row.cta ?? extraction.cta`
- `target_keyword` ← `row.keyword ?? extraction.primary_keyword ?? ""`
- `framework` ← `row.framework ?? extraction.loop_name`
- `hook_stat` ← `row.hook_stat ?? extraction.trigger`
- `elements` ← `row.elements ?? buildElementsFromPhases(extraction)` — collect `phase_*_name` / `phase_*_output` pairs into an array of `{ name, output }`
- `channel`, `tone_profile`, `content_goal` ← unchanged (no extraction fallback)

Also extend the `select(...)` list and `InboxRow` type to include `extraction: unknown`.

No edge function changes — the generator already sends `extraction` and it's already stored.

### 2. "Use as-is" button in Polish step (step 0) of `editor.$id.tsx`

In the step 0 button row (around line 602–609), add a third button next to `✦ Polish with AI →` and `Save Draft`:

```tsx
<BfButton
  variant="ghost"
  onClick={() => { setPolished(draft); setStep(1); persist({ polished: draft, step: 1 }, true); }}
  disabled={!draft.trim()}
>
  Use as-is →
</BfButton>
```

This copies the current draft into `polished`, advances to step 1, and persists — skipping AI polish entirely. The user can still edit the polished text in step 1 before continuing.

### Files changed
- `src/routes/dashboard.tsx` — extraction fallback mapping in `openInboxMut`
- `src/routes/editor.$id.tsx` — add "Use as-is" button in step 0

No DB migration, no edge function changes.