-- ============================================================
-- 008_project_folders.sql
-- Pastas para organizar os planos de aula em "MEUS PROJETOS"
-- ============================================================
--
-- Cada pasta pertence a um usuario (owner_id). A associacao
-- plano -> pasta e guardada no proprio objeto do projeto
-- (campo folderId dentro de project_data jsonb da tabela
-- public.projects), portanto NAO ha migracao da tabela
-- projects aqui.
-- ============================================================

create table if not exists public.project_folders (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Nova pasta',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.project_folders
add column if not exists owner_id uuid references auth.users(id) on delete cascade,
add column if not exists name text not null default 'Nova pasta',
add column if not exists created_at timestamptz not null default now(),
add column if not exists updated_at timestamptz not null default now();

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
