
CREATE TABLE public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  draft TEXT NOT NULL DEFAULT '',
  tone TEXT NOT NULL DEFAULT 'Conversational',
  category TEXT NOT NULL DEFAULT 'Tech',
  target_keyword TEXT NOT NULL DEFAULT '',
  polished TEXT,
  seo_data JSONB,
  formatted TEXT,
  step INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_articles" ON public.articles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_articles" ON public.articles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_articles" ON public.articles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_delete_own_articles" ON public.articles FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX articles_user_updated_idx ON public.articles (user_id, updated_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER articles_set_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
