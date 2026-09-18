-- Contador de visitantes únicos do site.
-- Guarda apenas um hash do IP (nunca o IP em si) para identificar
-- acessos repetidos do mesmo visitante sem armazenar dado pessoal
-- diretamente identificável. Só a função serverless (service role)
-- grava e lê esta tabela — o frontend nunca acessa via anon key.
CREATE TABLE IF NOT EXISTS public.site_visitors (
  ip_hash       TEXT PRIMARY KEY,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.site_visitors
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
