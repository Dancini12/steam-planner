CREATE TABLE IF NOT EXISTS public.feedback (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category     TEXT,
  message      TEXT NOT NULL,
  sender_name  TEXT,
  sender_email TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.feedback
  USING (auth.role() = 'service_role');

CREATE POLICY "Administradores consultam feedback" ON public.feedback
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.app_admins admins
      WHERE lower(admins.email) = lower(auth.jwt() ->> 'email')
    )
  );

grant select on public.feedback to authenticated;
