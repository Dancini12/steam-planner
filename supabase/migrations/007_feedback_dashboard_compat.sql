CREATE TABLE IF NOT EXISTS public.feedbacks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  mensagem   TEXT NOT NULL,
  nota       NUMERIC,
  category   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feedbacks ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.feedbacks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.feedbacks ADD COLUMN IF NOT EXISTS mensagem TEXT;
ALTER TABLE public.feedbacks ADD COLUMN IF NOT EXISTS nota NUMERIC;
ALTER TABLE public.feedbacks ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.feedbacks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON public.feedbacks(created_at DESC);

ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON public.feedbacks;
CREATE POLICY "Service role full access" ON public.feedbacks
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Painel admin le feedbacks" ON public.feedbacks;
CREATE POLICY "Painel admin le feedbacks" ON public.feedbacks
  FOR SELECT
  USING (true);

GRANT SELECT ON public.feedbacks TO anon;
GRANT SELECT ON public.feedbacks TO authenticated;

INSERT INTO public.feedbacks (user_id, mensagem, nota, category, created_at)
SELECT feedback.user_id, feedback.message, NULL, feedback.category, feedback.created_at
FROM public.feedback
WHERE NOT EXISTS (
  SELECT 1
  FROM public.feedbacks
  WHERE feedbacks.created_at = feedback.created_at
    AND feedbacks.mensagem = feedback.message
    AND feedbacks.user_id IS NOT DISTINCT FROM feedback.user_id
);
