-- ============================================================
-- 010_ml_retrain_cron.sql
-- Retreino automático noturno do recomendador (pg_cron + pg_net)
-- ============================================================
--
-- Agenda a Edge Function `ml-trainer` (action "train") todos os
-- dias às 03:00 (UTC). O cron autentica-se com a SERVICE ROLE
-- KEY, que a função aceita como equivalente a "admin".
--
-- Este bloco é DEFENSIVO: se `pg_cron`/`pg_net` não estiverem
-- habilitados, ou a chave não estiver configurada, o `db push`
-- NÃO falha — apenas emite um aviso. Para ativar depois:
--
--   1. Dashboard Supabase → Database → Extensions: habilite
--      `pg_cron` e `pg_net`.
--   2. Rode (uma vez), trocando pela sua service role key:
--        alter database postgres
--          set app.settings.ml_service_key = 'SEU_SERVICE_ROLE_KEY';
--        alter database postgres
--          set app.settings.ml_function_url =
--          'https://<project-ref>.supabase.co/functions/v1/ml-trainer';
--   3. Reaplique este arquivo (supabase db push) ou rode o bloco
--      DO abaixo manualmente.
-- ============================================================

do $$
declare
  v_url text := current_setting('app.settings.ml_function_url', true);
  v_key text := current_setting('app.settings.ml_service_key', true);
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice 'pg_cron ausente — retreino automático não agendado.';
    return;
  end if;
  if not exists (select 1 from pg_extension where extname = 'pg_net') then
    raise notice 'pg_net ausente — retreino automático não agendado.';
    return;
  end if;
  if v_url is null or v_key is null then
    raise notice 'app.settings.ml_function_url / ml_service_key não definidos — retreino automático não agendado.';
    return;
  end if;

  perform cron.unschedule('ml-retrain-nightly')
  where exists (select 1 from cron.job where jobname = 'ml-retrain-nightly');

  perform cron.schedule(
    'ml-retrain-nightly',
    '0 3 * * *',
    format(
      $cron$
        select net.http_post(
          url := %L,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || %L
          ),
          body := jsonb_build_object('action', 'train')
        );
      $cron$,
      v_url,
      v_key
    )
  );

  raise notice 'Retreino automático agendado: ml-retrain-nightly (03:00 UTC).';
exception
  when others then
    raise notice 'Não foi possível agendar o retreino automático: %', sqlerrm;
end
$$;
