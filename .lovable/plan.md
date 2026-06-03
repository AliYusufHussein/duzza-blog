## Plan

### 1. Database migration
Create two tables in this project (they only exist in the other Lovable project today):

- `public.channels` — `id uuid pk`, `user_id uuid not null`, `brand text not null`, `created_at`, `updated_at`. RLS: owner-only CRUD via `auth.uid() = user_id`. GRANTs to `authenticated` and `service_role`.
- `public.tone_profiles` — exact schema you described: `id`, `channel_id uuid fk channels(id) on delete cascade unique`, `brand_voice`, `tone_keywords text[]`, `audience`, `avoid`, `sample_line`, `telegram_format_notes`, timestamps. RLS: access only when the linked channel's `user_id = auth.uid()` (via subquery on `channels`). GRANTs same as above.
- `set_updated_at` trigger on both tables (function already exists).

No UI for managing channels/tone profiles is added here — you'll create rows in the other project's mirror or via DB.

### 2. Channel dropdown (scheduler dialog, `src/routes/editor.$id.tsx`)
- Add `useQuery(['channels'])` that selects `id, brand` from `channels`, enabled when `user` exists.
- Replace the free-text `<input>` at lines 680–686 with the shadcn `Select` (`@/components/ui/select`), options mapped from the query. `schedChannel` state continues to hold the selected channel's `id` (value); label shows `brand`.
- `sendToScheduler` is untouched — it will now POST the channel `id` instead of a name. Flagging this so you know the pipeline payload's `channel` field changes meaning.

### 3. Tone profile fetch + state
- New state: `toneProfile` (nullable).
- When `schedChannel` changes to a non-empty id, fetch the matching `tone_profiles` row (`select * from tone_profiles where channel_id = :id` via supabase client, `maybeSingle`). Store result (or null) in `toneProfile`.

### 4. Prompt injection in `runRepurpose` (line 320)
Build a prefix string when `toneProfile` is set:

```
CHANNEL TONE PROFILE:
Brand: {channel.brand}
Voice: {brand_voice}
Tone: {tone_keywords.join(", ")}
Audience: {audience}
Avoid: {avoid}
Sample line: {sample_line}

Apply this voice consistently. Platform formatting rules still apply.

```

Pass `prefix + PLATFORM_PROMPTS[platform]` as the system prompt. If `toneProfile` is null, pass `PLATFORM_PROMPTS[platform]` unchanged.

### UX note
The channel dropdown lives inside the "Send to Pipeline" dialog (where the original input was). Because tone injection happens at repurpose-generation time, you'd need to open the scheduler and pick a channel before clicking Generate for the tone profile to be applied. If you'd prefer the channel selector moved up next to the Generate button so tone always applies, say so and I'll adjust.

### Files touched
- New migration (channels + tone_profiles + RLS + grants + triggers)
- `src/routes/editor.$id.tsx` (dropdown swap, channels query, tone fetch, prompt prefix)

No changes to `sendToScheduler`, the Send button, or anything else.