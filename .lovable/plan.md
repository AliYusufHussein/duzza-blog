# Duzza Content Polisher — Full Audit + Fix Plan

Honest status, verified against the live code and database today. Where something is untested, it says so.

## 1. Stack and architecture

Implemented: React 19 + TypeScript + TanStack Start/Router + Tailwind v4 + shadcn components + Lovable Cloud (Supabase) + Tiptap editor + AI through the Lovable AI gateway (Gemini 2.5 Flash default). Export uses DOCX/PDF/ZIP libraries. An agent (MCP) connector is live at `/mcp` with OAuth.

Backend is fully connected: 41 articles, 28 inbox items, 1 user account. No database linter issues.

Oddities: `nitro` is pinned to a beta version and `jspdf` to an unusual major; both build fine today but are worth pinning deliberately. The app also talks to **two outside projects** — one for channels/tone profiles, one for the pipeline — and the addresses don't agree (see §7).

## 2. Login and access control

- Email sign-up/sign-in, password reset, and reset-password screens all work end to end.
- Protection is **client-side only**. `/dashboard` and `/editor/:id` check the session inside the page and then redirect. No data leaks (queries wait for a signed-in user), but a signed-out visitor sees a flash of the app shell instead of an immediate bounce to login.
- There are no roles or permission levels — every signed-in user is a full user. Single-account app today.
- Private screens are indexable by search engines (no "noindex") and reuse the public preview text.

## 3. Screen-by-screen status

| Screen | State | Notes |
|---|---|---|
| Home redirect | Built | Sends everyone to My Articles |
| Login / Reset password | Built | Real backend, no gaps |
| My Articles (dashboard) | Built | Real data. Inbox works (28 items). "From Pipeline" calls an outside address that no longer matches the one the editor posts to — unverified whether it still responds |
| Editor step 1 Polish | Built | AI polish + "Use as-is" |
| Step 2 SEO | Built | AI output is parsed without validation; a malformed reply can blank the SEO panel |
| Step 3 Format | Built | Blogger-ready HTML |
| Step 4 Preview | Built | Copy, HTML, DOCX, PDF |
| Step 5 Repurpose | Built | 10 platforms, Tiptap editing, carousel images, Send to Pipeline, Finished button |
| Agent connector (MCP) | Built | 5 article tools, OAuth-scoped per user |

No mock or placeholder data anywhere; everything reads the real backend.

## 4. Feature audit

- Article intake from Generator inbox — Done
- 5-step polish workflow — Done
- Channel + tone profile driven prompts — Partial: the channel list lives in the other project and reads as anonymous; the two channel tables inside this app are empty, so nothing falls back if the outside project is unreachable
- Repurposing to 10 platforms — Done
- Exports (copy/HTML/DOCX/PDF/carousel ZIP) — Done
- Send to Pipeline — Partial: address mismatch between the two screens; shared password sits in the app's own code
- Draft/Finished lifecycle — Done (39 drafts, 1 completed, 1 published)
- Pipeline table inside this app — Missing/dead: 0 rows, nothing writes to it any more
- Agent/MCP access — Done
- Roles, teams, sharing — Missing (not requested so far)

## 5. Database audit

- `articles` (41) — fully wired, owner-only access. Correct.
- `polisher_inbox` (28) — **security problem**: every signed-in user can read every row. Also not in the generated types, so the code bypasses type safety with casts.
- `pipeline` (0) — orphaned; no code writes to it since sending moved to the webhook.
- `channels` (0) and `tone_profiles` (0) — empty here; the app reads the equivalents from the outside scheduler project instead.
- Hardcoded in the front end that shouldn't be: two outside project addresses, the shared pipeline password, and the AI model name.

## 6. Phone experience

Works, with rough edges: the delete "×" and the Tiptap toolbar buttons are smaller than a comfortable thumb target; the header can crowd when the email address is long; the 5-step progress strip needs sideways scrolling with no hint; the channel picker rows are borderline tappable; preview boxes use fixed heights that waste space on tall phones. Nothing is broken — untested on a real device, judged from the layout code.

## 7. Known bugs and broken flows

1. Inbox is readable by any signed-in user (security).
2. "From Pipeline" points at a different outside project than "Send to Pipeline" — one of them is stale, so that queue may silently always be empty.
3. Opening a pipeline item ignores failures completely (`.catch(() => {})`), so it can report success when nothing was sent.
4. Debug `console.log` lines still print article payloads in the browser.
5. Carousel image export throws unless the AI happens to write "Slide 1", "Slide 2" — fragile.
6. SEO step trusts the AI to return valid JSON.
7. Signed-out flash on protected screens.
8. No console errors observed in the current preview session.

TypeScript compiles clean with zero errors.

## 8. Launch readiness

Roughly **80% toward a usable v1** for a single operator; ~60% if you mean multi-user and publicly launchable.

Fix plan, in priority order:

1. Lock down the inbox so only your own items are readable.
2. Settle one correct pipeline address and use it in both places.
3. Surface pipeline send failures instead of swallowing them.
4. Remove the debug logging.
5. Validate the SEO reply and show a clear retry instead of a blank panel.
6. Make carousel slide detection tolerant of any AI phrasing.
7. Move the pipeline password and both outside addresses into secrets/config rather than app code.
8. Redirect signed-out visitors before the page renders, and mark private screens noindex.
9. Phone polish: bigger tap targets, header wrapping, progress-strip scroll hint.
10. Drop the unused `pipeline` table and unused scaffold code; decide whether channels live here or in the other project.

Descope for speed: roles/teams/sharing, and the empty local channel tables.

Biggest risk: the app depends on **two outside Supabase projects plus a shared password baked into the browser bundle**. If either address changes or that password leaks, intake and sending break with no fallback and no alerting — and anyone reading the published page's code can post into your pipeline.

## Technical notes

- Auth guards are `useEffect` redirects in `src/routes/dashboard.tsx:68` and `src/routes/editor.$id.tsx:131`; move to an `_authenticated` layout.
- `PIPELINE_*` constants at `src/routes/dashboard.tsx:54-56` vs `TRACKER_WEBHOOK_URL` at `src/routes/editor.$id.tsx:34` disagree on project ref.
- Remove the `authenticated_read_polisher_inbox` `USING (true)` policy; add owner scoping or keep intake service-role-only.
- Regenerate Supabase types so `polisher_inbox` stops needing `as never` casts.
- Dead: `src/hooks/use-mobile.tsx`, unused shadcn `sidebar.tsx`/`table.tsx`, `public.pipeline`.
