-- Permite que o painel admin leia todos os perfis (leitura pública)
drop policy if exists "Painel admin le perfis" on public.app_profiles;
create policy "Painel admin le perfis"
  on public.app_profiles for select using (true);

-- Permite que o painel admin leia todos os projetos (leitura pública)
drop policy if exists "Painel admin le projetos" on public.projects;
create policy "Painel admin le projetos"
  on public.projects for select using (true);

-- Permite que o painel admin leia todos os eventos (leitura pública)
drop policy if exists "Painel admin le eventos" on public.app_usage_events;
create policy "Painel admin le eventos"
  on public.app_usage_events for select using (true);
