
CREATE TABLE public.polisher_inbox (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID,
  title TEXT NOT NULL DEFAULT '',
  article TEXT NOT NULL DEFAULT '',
  extraction JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.polisher_inbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_select_inbox"
  ON public.polisher_inbox FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_update_inbox"
  ON public.polisher_inbox FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_polisher_inbox_status_created ON public.polisher_inbox(status, created_at DESC);
