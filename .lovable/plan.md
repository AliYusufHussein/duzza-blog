## Goal
After the `fetch` call to `TRACKER_WEBHOOK_URL` in `sendToScheduler` (in `src/routes/editor.$id.tsx`), display the raw HTTP response (status code + body text) in a toast — for both success and error responses — so the actual tracker webhook output is visible.

## Change
In `src/routes/editor.$id.tsx`, modify `sendToScheduler` (lines ~80–104) only:

- Always read `res.text()` once after the fetch (before checking `res.ok`).
- On `res.ok`: call `toast.success("Sent to Pipeline ✓ (" + res.status + ")", { description: bodyText })` and close the scheduler.
- On non-ok: call `toast.error("Pipeline error " + res.status, { description: bodyText })`.
- In the `catch` block (network/throw before response): `toast.error("Request failed", { description: (e as Error).message })`.

No other code, UI, payload, or files are changed.

## Notes
- Sonner `toast.success` / `toast.error` already support a `description` field — fits the existing toaster setup.
- Response body may be long; sonner will wrap it. No truncation added unless you want it.
