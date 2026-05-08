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
