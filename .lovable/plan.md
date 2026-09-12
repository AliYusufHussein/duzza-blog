# Duzza Content Polisher — Development Review (12 Sep 2026)

Based on the audit already run against the live code and database. Where something is untested, it says so. Items with no real data (budget, team velocity, code coverage, uptime) are marked "not tracked" rather than invented.

## App overview

- Name: Duzza Content Polisher (shown in-app as "Blogger Finalizer").
- Problem it solves: raw AI-generated drafts arrive unpolished and in one format. The app turns a draft into a publish-ready blog post and then into posts for 10 social platforms, in one guided flow.
- Users: you and your content team — a single operator today, one account exists.
- Platform: web, works in a phone browser. No app store build.

## Current status

- Overall: ~80% toward a usable v1 for one operator; ~60% for a public multi-user product.
- Phase: feature-complete build, now in hardening and cleanup before launch.

## Completed

- Email sign-up, sign-in, password reset — working end to end.
- Inbox intake from the Generator (28 items received).
- 5-step flow: Polish (with a "use as-is" skip), SEO, Blogger-ready HTML, Preview, Repurpose.
- Repurposing to 10 platforms with rich-text editing.
- Exports: copy, HTML, DOCX, PDF, carousel image ZIP.
- Send to Pipeline, plus a Finished button that closes a draft.
- Article history: 41 articles (39 drafts, 1 completed, 1 published).
- Agent (MCP) access with 5 article tools, scoped to your account.

## In progress

Fixing the issues the audit surfaced. Nothing half-built is visible to you in the app; the open work is security, reliability and phone polish. Estimated 1–2 working sessions for the critical items, 3–4 for the full list.

## Pending work, in priority order

1. Most critical: lock the Inbox down so only your own items are readable. Today any signed-in account could read every incoming article.
2. Next: settle one correct Pipeline address — the "From Pipeline" list and "Send to Pipeline" point at two different outside projects, so that queue may silently always be empty.
3. Show Pipeline send failures instead of silently swallowing them.
4. Remove debug logging that prints article content in the browser.
5. Handle a bad AI reply on the SEO step with a retry instead of a blank panel.
6. Make carousel slide detection tolerant of any AI wording.
7. Move the shared Pipeline password and both outside addresses out of the app's own code.
8. Bounce signed-out visitors before the page draws, and keep private screens out of search results.
9. Phone polish: bigger tap targets, header wrapping when the email is long, a scroll hint on the step strip.
10. Remove the unused pipeline table and dead scaffolding.

Needs testing: Pipeline round-trip (send and receive) against the correct project; the carousel ZIP; each of the 10 platform outputs; sign-out redirect; the whole flow on a real phone.

Must-have before release: items 1–4 above, plus a confirmed working Pipeline connection.

## Milestones

- Next milestone: "secure and reliable v1" — items 1–4 done and the Pipeline round-trip verified.
- Then: phone polish and cleanup (items 5–10).

## Next focus

- Primary goal: close the Inbox security hole and make the Pipeline connection trustworthy.
- Secondary goals: silence debug logging, harden AI-response handling, phone tap targets.

## Success metrics

MVP
- Core features required: intake, polish, SEO, format, preview/export, repurpose, send to Pipeline, article history, login. All present.
- Current status: ~80%.
- MVP criteria met: not yet — blocked on the Inbox permission fix and a verified Pipeline connection.

Ideal outcome
- Feature completeness: target includes roles/sharing and configurable channels; currently single-user with channels read from an outside project.
- Performance: no benchmarks measured. AI steps depend on the model's response time; everything else loads fast in the preview.
- User experience: desktop is comfortable; phone works but is cramped in places.

Quality standards
- Automated test coverage: none today (no test suite). Bug tracking is this review.
- Known open issues: 7 (listed above). No console errors in the current preview session; code compiles clean.
- Uptime/response time: not tracked.

## Risks

- Biggest risk: the app depends on two outside projects plus a shared password baked into the browser code. If an address changes or the password leaks, intake and sending break silently — and anyone reading the published page could post into your pipeline.
- The channel and tone list lives in the other project with no local fallback, so an outage empties the channel picker.
- AI replies are trusted to be well-formed; malformed output blanks the SEO panel or breaks carousel export.
- Single account, no roles — adding a teammate today gives them everything.

## Action items

Immediate
- Restrict Inbox reads to the owner.
- Pick the correct Pipeline address, use it in both places, and verify a real send and receive.

Short term
- Surface send failures, remove debug logs, validate the SEO reply, move secrets out of app code.
- Phone pass on tap targets and the step strip; keep private screens unindexed.

## Notes and decisions

- Backend, auth, storage and AI all run on Lovable Cloud; AI defaults to a fast Gemini model.
- Pipeline sending moved from a direct database write to a webhook — which is why the local pipeline table is now dead.
- Channels and tone profiles are deliberately read from the scheduler project, not duplicated here.
- The channel picker was rebuilt as an in-app list because the browser's native dropdown rendered unusably.
- Agent (MCP) access was added and is scoped per signed-in user.

## Follow-up review

- Review period: the previous audit was produced in the last session; this is a restatement in review form, so no new work has landed since. Days since last review: 0.
- Nothing has changed in scope, priorities, bug counts or timeline since that audit.
- No user feedback collected yet beyond your own use.
- Not tracked and not estimated here: team velocity, budget, burn rate, code coverage percentages, launch date.
- Next review: after the immediate actions above are done — focus on confirming the Inbox lockdown and a verified Pipeline round-trip.

## Pending decisions for you

- Do channels and tone profiles stay in the scheduler project, or move into this app so it works standalone?
- Will this stay a single-operator tool, or do we add teammates and roles before launch?
- Which Pipeline address is the live one?
