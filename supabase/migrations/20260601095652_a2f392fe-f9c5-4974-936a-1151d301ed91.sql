ALTER TABLE public.polisher_inbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_polisher_inbox"
ON public.polisher_inbox
FOR SELECT
TO authenticated
USING (true);