create table if not exists public.app_admins (
  email text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Projeto sem título',
  theme text not null default '',
  grade text not null default '',
  duration text not null default '',
  steam text[] not null default '{}',
  created_via text not null default 'blank',
  is_public boolean not null default true,
  project_data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects
add column if not exists owner_id uuid references auth.users(id) on delete cascade,
add column if not exists usuario_id uuid references auth.users(id) on delete cascade,
add column if not exists title text not null default 'Projeto sem título',
add column if not exists theme text not null default '',
add column if not exists grade text not null default '',
add column if not exists duration text not null default '',
add column if not exists steam text[] not null default '{}',
add column if not exists created_via text not null default 'blank',
add column if not exists is_public boolean not null default true,
add column if not exists project_data jsonb not null default '{}'::jsonb,
add column if not exists created_at timestamptz not null default now(),
add column if not exists updated_at timestamptz not null default now();

update public.projects
set
  owner_id = coalesce(owner_id, usuario_id),
  usuario_id = coalesce(usuario_id, owner_id),
  title = coalesce(title, 'Projeto sem título'),
  theme = coalesce(theme, ''),
  grade = coalesce(grade, ''),
  duration = coalesce(duration, ''),
  steam = coalesce(steam, '{}'::text[]),
  created_via = coalesce(created_via, 'blank'),
  is_public = coalesce(is_public, true),
  project_data = coalesce(project_data, '{}'::jsonb),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now());

alter table public.projects
alter column usuario_id drop not null,
alter column title set default 'Projeto sem título',
alter column theme set default '',
alter column grade set default '',
alter column duration set default '',
alter column steam set default '{}'::text[],
alter column created_via set default 'blank',
alter column is_public set default true,
alter column project_data set default '{}'::jsonb,
alter column created_at set default now(),
alter column updated_at set default now();

alter table public.projects
alter column title set not null,
alter column theme set not null,
alter column grade set not null,
alter column duration set not null,
alter column steam set not null,
alter column created_via set not null,
alter column is_public set not null,
alter column project_data set not null,
alter column created_at set not null,
alter column updated_at set not null;

alter table public.projects enable row level security;

drop policy if exists "Projetos publicos podem ser consultados" on public.projects;
create policy "Projetos publicos podem ser consultados"
on public.projects
for select
using (
  auth.uid() is not null
  and (
    is_public = true
    or owner_id = auth.uid()
    or usuario_id = auth.uid()
  )
);

drop policy if exists "Usuarios criam seus projetos" on public.projects;
create policy "Usuarios criam seus projetos"
on public.projects
for insert
with check (
  owner_id = auth.uid()
  or usuario_id = auth.uid()
);

drop policy if exists "Usuarios editam seus projetos" on public.projects;
create policy "Usuarios editam seus projetos"
on public.projects
for update
using (owner_id = auth.uid() or usuario_id = auth.uid())
with check (owner_id = auth.uid() or usuario_id = auth.uid());

drop policy if exists "Usuarios excluem seus projetos" on public.projects;
create policy "Usuarios excluem seus projetos"
on public.projects
for delete
using (owner_id = auth.uid() or usuario_id = auth.uid());

create index if not exists projects_owner_id_idx on public.projects(owner_id);
create index if not exists projects_is_public_updated_at_idx on public.projects(is_public, updated_at desc);

create table if not exists public.project_private_data (
  project_id text primary key references public.projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  private_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.project_private_data
add column if not exists owner_id uuid references auth.users(id) on delete cascade,
add column if not exists private_data jsonb not null default '{}'::jsonb,
add column if not exists created_at timestamptz not null default now(),
add column if not exists updated_at timestamptz not null default now();

update public.project_private_data
set
  private_data = coalesce(private_data, '{}'::jsonb),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now());

alter table public.project_private_data
alter column private_data set default '{}'::jsonb,
alter column created_at set default now(),
alter column updated_at set default now();

alter table public.project_private_data
alter column private_data set not null,
alter column created_at set not null,
alter column updated_at set not null;

alter table public.project_private_data enable row level security;

drop policy if exists "Usuarios consultam dados privados dos seus projetos" on public.project_private_data;
create policy "Usuarios consultam dados privados dos seus projetos"
on public.project_private_data
for select
using (
  owner_id = auth.uid()
  or exists (
    select 1 from public.app_admins admins
    where lower(admins.email) = lower(auth.jwt() ->> 'email')
  )
);

drop policy if exists "Usuarios criam dados privados dos seus projetos" on public.project_private_data;
create policy "Usuarios criam dados privados dos seus projetos"
on public.project_private_data
for insert
with check (owner_id = auth.uid());

drop policy if exists "Usuarios editam dados privados dos seus projetos" on public.project_private_data;
create policy "Usuarios editam dados privados dos seus projetos"
on public.project_private_data
for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Usuarios excluem dados privados dos seus projetos" on public.project_private_data;
create policy "Usuarios excluem dados privados dos seus projetos"
on public.project_private_data
for delete
using (owner_id = auth.uid());

create index if not exists project_private_data_owner_id_idx on public.project_private_data(owner_id);

grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.project_private_data to authenticated;

create table if not exists public.app_admins (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;

drop policy if exists "Administradores consultam lista de administradores" on public.app_admins;
create policy "Administradores consultam lista de administradores"
on public.app_admins
for select
using (auth.uid() is not null);

create table if not exists public.app_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null default '',
  school text not null default '',
  area text not null default '',
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table public.app_profiles enable row level security;

drop policy if exists "Usuarios criam seu perfil" on public.app_profiles;
create policy "Usuarios criam seu perfil"
on public.app_profiles
for insert
with check (id = auth.uid());

drop policy if exists "Usuarios atualizam seu perfil" on public.app_profiles;
create policy "Usuarios atualizam seu perfil"
on public.app_profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Usuarios consultam seu perfil" on public.app_profiles;
create policy "Usuarios consultam seu perfil"
on public.app_profiles
for select
using (
  id = auth.uid()
  or exists (
    select 1 from public.app_admins admins
    where lower(admins.email) = lower(auth.jwt() ->> 'email')
  )
);

create table if not exists public.app_usage_events (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.app_usage_events enable row level security;

drop policy if exists "Usuarios registram seu uso" on public.app_usage_events;
create policy "Usuarios registram seu uso"
on public.app_usage_events
for insert
with check (user_id = auth.uid());

drop policy if exists "Administradores consultam uso" on public.app_usage_events;
create policy "Administradores consultam uso"
on public.app_usage_events
for select
using (
  exists (
    select 1 from public.app_admins admins
    where lower(admins.email) = lower(auth.jwt() ->> 'email')
  )
);

drop policy if exists "Administradores consultam todos os projetos" on public.projects;
create policy "Administradores consultam todos os projetos"
on public.projects
for select
using (
  exists (
    select 1 from public.app_admins admins
    where lower(admins.email) = lower(auth.jwt() ->> 'email')
  )
);

create index if not exists app_profiles_email_idx on public.app_profiles(email);
create index if not exists app_usage_events_user_id_idx on public.app_usage_events(user_id);
create index if not exists app_usage_events_created_at_idx on public.app_usage_events(created_at desc);

grant select on public.app_admins to authenticated;
grant select, insert, update on public.app_profiles to authenticated;
grant select, insert on public.app_usage_events to authenticated;

create table if not exists public.app_metric_snapshots (
  id bigserial primary key,
  title text not null default 'Leitura dos indicadores',
  metrics jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.app_metric_snapshots enable row level security;

drop policy if exists "Administradores consultam snapshots" on public.app_metric_snapshots;
create policy "Administradores consultam snapshots"
on public.app_metric_snapshots
for select
using (
  exists (
    select 1 from public.app_admins admins
    where lower(admins.email) = lower(auth.jwt() ->> 'email')
  )
);

drop policy if exists "Administradores salvam snapshots" on public.app_metric_snapshots;
create policy "Administradores salvam snapshots"
on public.app_metric_snapshots
for insert
with check (
  exists (
    select 1 from public.app_admins admins
    where lower(admins.email) = lower(auth.jwt() ->> 'email')
  )
);

grant select, insert on public.app_metric_snapshots to authenticated;

create table if not exists public.feedback (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete set null,
  category     text,
  message      text not null,
  sender_name  text,
  sender_email text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_feedback_created_at on public.feedback(created_at desc);

alter table public.feedback enable row level security;

drop policy if exists "Service role full access" on public.feedback;
create policy "Service role full access"
on public.feedback
using (auth.role() = 'service_role');

drop policy if exists "Administradores consultam feedback" on public.feedback;
create policy "Administradores consultam feedback"
on public.feedback
for select
using (
  exists (
    select 1 from public.app_admins admins
    where lower(admins.email) = lower(auth.jwt() ->> 'email')
  )
);

grant select on public.feedback to authenticated;

create table if not exists public.feedbacks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete set null,
  mensagem   text not null,
  nota       numeric,
  category   text,
  created_at timestamptz not null default now()
);

create index if not exists idx_feedbacks_created_at on public.feedbacks(created_at desc);

alter table public.feedbacks enable row level security;

drop policy if exists "Service role full access" on public.feedbacks;
create policy "Service role full access"
on public.feedbacks
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Painel admin le feedbacks" on public.feedbacks;
create policy "Painel admin le feedbacks"
on public.feedbacks
for select
using (true);

grant select on public.feedbacks to anon;
grant select on public.feedbacks to authenticated;

-- ============================================================
-- Pastas de "MEUS PROJETOS" (organizacao dos planos de aula)
-- Ver tambem: supabase/migrations/008_project_folders.sql
-- A associacao plano -> pasta fica em project_data.folderId
-- (jsonb da tabela public.projects), sem migracao adicional.
-- ============================================================

create table if not exists public.project_folders (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Nova pasta',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.project_folders enable row level security;

drop policy if exists "Usuarios consultam suas pastas" on public.project_folders;
create policy "Usuarios consultam suas pastas"
on public.project_folders
for select
using (owner_id = auth.uid());

drop policy if exists "Usuarios criam suas pastas" on public.project_folders;
create policy "Usuarios criam suas pastas"
on public.project_folders
for insert
with check (owner_id = auth.uid());

drop policy if exists "Usuarios editam suas pastas" on public.project_folders;
create policy "Usuarios editam suas pastas"
on public.project_folders
for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Usuarios excluem suas pastas" on public.project_folders;
create policy "Usuarios excluem suas pastas"
on public.project_folders
for delete
using (owner_id = auth.uid());

create index if not exists project_folders_owner_id_idx on public.project_folders(owner_id);

grant select, insert, update, delete on public.project_folders to authenticated;

-- ============================================================
-- Modelos de ML treinados + avaliacoes
-- Ver tambem: supabase/migrations/009_ml_models.sql
-- Pesos aprendidos pela Edge Function ml-trainer (TF-IDF + regressao
-- logistica). Sem PII: leitura liberada p/ autenticado, escrita so
-- pela service role.
-- ============================================================

create table if not exists public.ml_models (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
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
  on public.ml_models for select using (auth.uid() is not null);

drop policy if exists "Usuarios autenticados leem avaliacoes" on public.ml_model_evaluations;
create policy "Usuarios autenticados leem avaliacoes"
  on public.ml_model_evaluations for select using (auth.uid() is not null);

grant select on public.ml_models to authenticated;
grant select on public.ml_model_evaluations to authenticated;
grant all on public.ml_models to service_role;
grant all on public.ml_model_evaluations to service_role;

-- ============================================================
-- Console administrativo (<app>/#admin)
-- Ver tambem: supabase/migrations/011_admin_console.sql e
--             supabase/migrations/012_fix_admin_recursion.sql
-- Primeiro admin + gestao de admins (sem recursao de RLS).
-- ============================================================

insert into public.app_admins (email)
values ('marceldancini@gmail.com')
on conflict (email) do nothing;

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_admins a
    where lower(a.email) = lower(auth.jwt() ->> 'email')
  );
$$;

grant execute on function public.is_app_admin() to authenticated;

drop policy if exists "Administradores gerenciam administradores" on public.app_admins;

drop policy if exists "Administradores inserem administradores" on public.app_admins;
create policy "Administradores inserem administradores"
on public.app_admins for insert with check (public.is_app_admin());

drop policy if exists "Administradores atualizam administradores" on public.app_admins;
create policy "Administradores atualizam administradores"
on public.app_admins for update
using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists "Administradores removem administradores" on public.app_admins;
create policy "Administradores removem administradores"
on public.app_admins for delete using (public.is_app_admin());

grant select, insert, update, delete on public.app_admins to authenticated;
