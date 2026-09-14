# Plan: Unify Pipeline URLs and Surface Pipeline Errors

## Goal
Point all pipeline queue/receive URLs at the `bdslxjkfnziyyqomtzso` Supabase project and stop silently swallowing pipeline fetch failures.

## Changes

### 1. Update dashboard pipeline URLs
**File:** `src/routes/dashboard.tsx`  
**Lines:** 54–55

Replace the project ref in both constants from `ckuqonmxezoscasdbjhm` to `bdslxjkfnziyyqomtzso`, keeping the same function paths and `PIPELINE_SECRET` unchanged.

```text
Before:
  https://ckuqonmxezoscasdbjhm.supabase.co/functions/v1/serve-polisher-queue
  https://ckuqonmxezoscasdbjhm.supabase.co/functions/v1/receive-from-polisher

After:
  https://bdslxjkfnziyyqomtzso.supabase.co/functions/v1/serve-polisher-queue
  https://bdslxjkfnziyyqomtzso.supabase.co/functions/v1/receive-from-polisher
```

### 2. Fix silent error swallowing when opening a pipeline item
**File:** `src/routes/dashboard.tsx`  
**Lines:** 183–193

The `fetch` to `PIPELINE_RECEIVE_URL` currently ends with `.catch(() => {})`, so network/HTTP failures are invisible to the user and the article still appears to open successfully.

Replace the silent catch with explicit error handling:
- Await the response and check `res.ok`.
- If the response is not OK, throw an error containing the status and response body.
- Let the mutation `onError` show a `toast.error` with the actual message.
- Do not navigate or show success state when the receive call fails.

The Supabase article insert and the `onSuccess` navigation remain unchanged.

### 3. Verify editor pipeline send already surfaces errors
**File:** `src/routes/editor.$id.tsx`  
**Lines:** 231–271

Current `sendToScheduler` already wraps the fetch in `try/catch` and shows `toast.error` on network failure, and shows `toast.error` for non-OK HTTP responses without showing success. No silent `.catch(() => {})` exists in this file. The plan is to confirm this state and leave the success/error paths untouched.

## Out of scope
- `PIPELINE_SECRET` value remains unchanged.
- `TRACKER_WEBHOOK_URL` in `editor.$id.tsx` already points to `bdslxjkfnziyyqomtzso` and is not modified.
- Request payloads, success-path logic, and UI copy are unchanged.

## Verification
- Build/typecheck the project after edits.
- Confirm `dashboard.tsx` constants match the `bdslxjkfnziyyqomtzso` domain.
- Confirm no `.catch(() => {})` remains on pipeline fetches in `dashboard.tsx`.
