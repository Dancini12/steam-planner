-- ============================================================
-- 011_admin_console.sql
-- Primeiro administrador + gestão de admins pelo console
-- ============================================================
--
-- O console administrativo (<app>/#admin) lê e escreve em
-- public.app_admins. Aqui:
--   1. cadastra o primeiro administrador (bootstrap);
--   2. cria a policy que deixa um admin já existente
--      adicionar/remover outros admins.
-- ============================================================

insert into public.app_admins (email)
values ('marceldancini@gmail.com')
on conflict (email) do nothing;

-- Um administrador existente pode gerenciar a lista de admins.
drop policy if exists "Administradores gerenciam administradores" on public.app_admins;
create policy "Administradores gerenciam administradores"
on public.app_admins
for all
using (
  exists (
    select 1 from public.app_admins a
    where lower(a.email) = lower(auth.jwt() ->> 'email')
  )
)
with check (
  exists (
    select 1 from public.app_admins a
    where lower(a.email) = lower(auth.jwt() ->> 'email')
  )
);

grant select, insert, update, delete on public.app_admins to authenticated;
