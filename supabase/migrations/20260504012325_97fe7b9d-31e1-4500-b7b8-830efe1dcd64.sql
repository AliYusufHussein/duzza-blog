CREATE TABLE public.pipeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  idea TEXT NOT NULL DEFAULT '',
  channel TEXT NOT NULL DEFAULT '',
  platform TEXT NOT NULL DEFAULT '',
  hook TEXT NOT NULL DEFAULT '',
  date DATE,
  status TEXT NOT NULL DEFAULT 'Drafting',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pipeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_pipeline" ON public.pipeline FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_pipeline" ON public.pipeline FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_pipeline" ON public.pipeline FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_delete_own_pipeline" ON public.pipeline FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER pipeline_set_updated_at BEFORE UPDATE ON public.pipeline FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();