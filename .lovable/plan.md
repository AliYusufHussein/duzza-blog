# Add Repurpose Step (Multi-Platform Content)

The uploaded file's standout feature is a **Repurpose** stage that turns a finished blog post into publish-ready content for 10 platforms. Everything else in the upload is already covered (or improved) by the current app. This plan integrates only the new value.

## What gets added

A 5th step after Preview: **Repurpose**. User picks a platform → AI returns a structured, ready-to-paste output following that platform's prompt template. Outputs are saved per-platform so users can revisit them.

### Platforms (from upload)
X/Twitter Thread · LinkedIn Post · LinkedIn Carousel · Instagram Caption · Instagram Carousel · TikTok/Reels Script · YouTube Long-Form Script · Email Newsletter · Telegram/WhatsApp Broadcast · Facebook Post

Each has a detailed structural prompt (hook → framework → breakdown → CTA, plus variation options and a completion report) — copied verbatim from the upload.

## Changes

### 1. Database
Add one nullable column to `articles`:
- `repurposed jsonb` — `{ [platformId]: { content: string, generatedAt: string } }`

Migration via the standard tool. RLS already covers it.

### 2. Prompt library
New file `src/lib/repurpose-prompts.ts` — exports `PLATFORMS` array (id, label, emoji) and `PLATFORM_PROMPTS` map, lifted from the uploaded file.

### 3. Editor flow (`src/routes/editor.$id.tsx`)
- Extend `STEPS` to `["Polish", "SEO", "Format", "Preview", "Repurpose"]`.
- New step UI: grid of platform tiles → on select, show generate/regenerate button + output panel with copy button.
- Reuses existing `runAI` server function. Input = `formatted ?? polished ?? draft` + chosen platform's prompt + title/keyword context.
- Persist results into `articles.repurposed` via existing `updateArticle` patch.
- Hydrate `repurposed` alongside other fields.

### 4. Types
Regenerated automatically from the migration — no manual edits.

### 5. Landing/dashboard copy
Update tagline to include "Repurpose" so users know the step exists.

## Out of scope (intentionally not ported)
- localStorage auth from the upload — current Supabase auth + RLS is strictly better.
- Inline `<style>` blocks and inline-style primitives — current `bf-ui` + Tailwind is cleaner.
- Font imports — already loaded in `styles.css`.

## Technical notes
- Server function: existing `runAI` already accepts arbitrary system + user prompts, so no new server function needed.
- Output format: store raw markdown/text returned by the model; render in a `<pre>`-style panel with monospace + copy button (matches Preview step look).
- Token budget: outputs can be long (carousels, YouTube scripts) — no truncation; let the model finish.
