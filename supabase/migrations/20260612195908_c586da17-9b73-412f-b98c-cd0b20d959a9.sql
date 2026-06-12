
ALTER TABLE public.polisher_inbox
  ADD COLUMN IF NOT EXISTS channel text,
  ADD COLUMN IF NOT EXISTS tone_profile jsonb,
  ADD COLUMN IF NOT EXISTS content_goal text,
  ADD COLUMN IF NOT EXISTS framework text,
  ADD COLUMN IF NOT EXISTS hook text,
  ADD COLUMN IF NOT EXISTS elements jsonb,
  ADD COLUMN IF NOT EXISTS cta text,
  ADD COLUMN IF NOT EXISTS keyword text,
  ADD COLUMN IF NOT EXISTS hook_stat text;

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS channel text,
  ADD COLUMN IF NOT EXISTS tone_profile jsonb,
  ADD COLUMN IF NOT EXISTS content_goal text,
  ADD COLUMN IF NOT EXISTS framework text,
  ADD COLUMN IF NOT EXISTS hook text,
  ADD COLUMN IF NOT EXISTS elements jsonb,
  ADD COLUMN IF NOT EXISTS cta text,
  ADD COLUMN IF NOT EXISTS hook_stat text;
