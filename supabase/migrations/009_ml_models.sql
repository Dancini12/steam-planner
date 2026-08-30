-- ============================================================
-- 009_ml_models.sql
-- Modelos de ML treinados (pesos aprendidos) + avaliações
-- ============================================================
--
-- ml_models guarda os PARÂMETROS APRENDIDOS pela Edge Function
-- ml-trainer: vocabulário/IDF do TF-IDF e os pesos da regressão
-- logística. Não há PII — só vetores numéricos e metadados —,
-- por isso a leitura é liberada para qualquer usuário
-- autenticado; a escrita é exclusiva da service role.
-- ============================================================

create table if not exists public.ml_models (
  id uuid primary key default gen_random_uuid(),
  kind text not null,                       -- 'tfidf' | 'logreg_recommender'
  version bigint not null default 0,
  params jsonb not null default '{}'::jsonb,
  feature_spec jsonb not null default '{}'::jsonb,
  n_samples integer not null default 0,
  trained_at timestamptz not null default now(),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.ml_model_evaluations (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.ml_models(id) on delete cascade,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ml_models_active_idx
  on public.ml_models(kind, trained_at desc) where is_active;
create index if not exists ml_model_evaluations_model_idx
  on public.ml_model_evaluations(model_id, created_at desc);

alter table public.ml_models enable row level security;
alter table public.ml_model_evaluations enable row level security;

drop policy if exists "Usuarios autenticados leem modelos" on public.ml_models;
create policy "Usuarios autenticados leem modelos"
  on public.ml_models for select
  using (auth.uid() is not null);

drop policy if exists "Usuarios autenticados leem avaliacoes" on public.ml_model_evaluations;
create policy "Usuarios autenticados leem avaliacoes"
  on public.ml_model_evaluations for select
  using (auth.uid() is not null);

-- Escrita: apenas service role (a Edge Function). Sem policy de
-- insert/update/delete para 'authenticated' → bloqueado por RLS.

grant select on public.ml_models to authenticated;
grant select on public.ml_model_evaluations to authenticated;
grant all on public.ml_models to service_role;
grant all on public.ml_model_evaluations to service_role;
