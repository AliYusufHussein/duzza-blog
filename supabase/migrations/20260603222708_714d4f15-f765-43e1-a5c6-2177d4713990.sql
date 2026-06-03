CREATE TABLE public.channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  brand text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.channels TO authenticated;
GRANT ALL ON public.channels TO service_role;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own_channels" ON public.channels FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_channels" ON public.channels FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_channels" ON public.channels FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_delete_own_channels" ON public.channels FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER channels_set_updated_at BEFORE UPDATE ON public.channels FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.tone_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL UNIQUE REFERENCES public.channels(id) ON DELETE CASCADE,
  brand_voice text NOT NULL,
  tone_keywords text[] NOT NULL DEFAULT '{}',
  audience text NOT NULL,
  avoid text NOT NULL,
  sample_line text NOT NULL,
  telegram_format_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tone_profiles TO authenticated;
GRANT ALL ON public.tone_profiles TO service_role;
ALTER TABLE public.tone_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own_tone_profiles" ON public.tone_profiles FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.channels c WHERE c.id = channel_id AND c.user_id = auth.uid()));
CREATE POLICY "users_insert_own_tone_profiles" ON public.tone_profiles FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.channels c WHERE c.id = channel_id AND c.user_id = auth.uid()));
CREATE POLICY "users_update_own_tone_profiles" ON public.tone_profiles FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.channels c WHERE c.id = channel_id AND c.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.channels c WHERE c.id = channel_id AND c.user_id = auth.uid()));
CREATE POLICY "users_delete_own_tone_profiles" ON public.tone_profiles FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.channels c WHERE c.id = channel_id AND c.user_id = auth.uid()));
CREATE TRIGGER tone_profiles_set_updated_at BEFORE UPDATE ON public.tone_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();