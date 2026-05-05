## Plan: `receive-from-generator` webhook edge function

### 1. Create edge function
File: `supabase/functions/receive-from-generator/index.ts`

Logic:
- Handle CORS preflight (OPTIONS) with permissive headers.
- Accept POST only; reject others with 405.
- Parse JSON body. On invalid JSON return 400 `{ error: "Invalid JSON" }`.
- If `secret !== "duzza_polisher_secret_2026"` return 401 `{ error: "Unauthorized" }`.
- Validate required fields `title` and `article` are strings (return 400 if missing).
- Create Supabase client using `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS, safe — only reachable behind secret check).
- Insert into `polisher_inbox`:
  - `campaign_id`: body.campaign_id (nullable)
  - `title`: body.title
  - `article`: body.article
  - `extraction`: body.extraction ?? null
  - `status`: `'pending'`
- On insert error return 500 `{ error: <message> }`.
- On success return 200 `{ success: true, inbox_id: data.id }`.

### 2. Configure as public webhook
Update `supabase/config.toml` to append:
```
[functions.receive-from-generator]
verify_jwt = false
```

### 3. Deploy
Use `supabase--deploy_edge_functions` for `receive-from-generator`.

### 4. Smoke test
Use `supabase--curl_edge_functions` to POST a sample payload and verify a row is inserted and `inbox_id` is returned. Also test the 401 path with wrong secret.

### 5. Output the URL
After deploy, the public URL is:
```
https://hckpfuipklzyzhkmicuz.supabase.co/functions/v1/receive-from-generator
```

### Notes
- The shared secret `duzza_polisher_secret_2026` is hardcoded as requested. Recommend later moving it to a Supabase secret (`POLISHER_SHARED_SECRET`) for easier rotation — happy to do that as a follow-up.
- No changes to existing UI or other functions.
