-- ============================================================
-- 012_fix_admin_recursion.sql
-- Corrige recursão infinita na RLS de public.app_admins
-- ============================================================
--
-- A policy "Administradores gerenciam administradores" (011) era
-- `for all` e o seu USING lia public.app_admins — ao avaliar a
-- policy de SELECT da própria tabela, ela se reinvocava
-- (erro 42P17: infinite recursion detected in policy).
--
-- Solução padrão: função SECURITY DEFINER que checa o admin sem
-- passar por RLS, e policies de escrita separadas (insert/update/
-- delete) — o SELECT continua com a policy não recursiva
-- "Administradores consultam lista de administradores".
-- ============================================================

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
on public.app_admins for insert
with check (public.is_app_admin());

drop policy if exists "Administradores atualizam administradores" on public.app_admins;
create policy "Administradores atualizam administradores"
on public.app_admins for update
using (public.is_app_admin())
with check (public.is_app_admin());

drop policy if exists "Administradores removem administradores" on public.app_admins;
create policy "Administradores removem administradores"
on public.app_admins for delete
using (public.is_app_admin());
