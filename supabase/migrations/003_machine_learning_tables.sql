create extension if not exists pgcrypto;

create table if not exists ml_usage_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists ml_behavior_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists ml_user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  top_disciplines jsonb not null default '[]'::jsonb,
  top_grades jsonb not null default '[]'::jsonb,
  top_themes jsonb not null default '[]'::jsonb,
  top_steam_areas jsonb not null default '[]'::jsonb,
  top_bncc jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists ml_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recommendation_type text not null,
  source_entity_type text,
  source_entity_id text,
  target_entity_type text,
  target_entity_id text,
  score numeric not null default 0,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create table if not exists ml_embeddings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  embedding_model text not null,
  dimensions integer not null,
  embedding jsonb not null default '[]'::jsonb,
  text_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, entity_type, entity_id)
);

create table if not exists ml_analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_type text not null,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists ml_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  interaction_type text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists ml_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  metric_name text not null,
  metric_value numeric not null default 0,
  dimensions jsonb not null default '{}'::jsonb,
  measured_at timestamptz not null default now()
);

create index if not exists idx_ml_usage_history_user_created on ml_usage_history(user_id, created_at desc);
create index if not exists idx_ml_behavior_events_user_created on ml_behavior_events(user_id, created_at desc);
create index if not exists idx_ml_behavior_events_type on ml_behavior_events(event_type);
create index if not exists idx_ml_recommendations_user_type on ml_recommendations(user_id, recommendation_type, score desc);
create index if not exists idx_ml_embeddings_owner_entity on ml_embeddings(owner_id, entity_type, entity_id);
create index if not exists idx_ml_embeddings_metadata on ml_embeddings using gin(metadata);
create index if not exists idx_ml_interactions_user_created on ml_interactions(user_id, created_at desc);
create index if not exists idx_ml_metrics_user_name on ml_metrics(user_id, metric_name, measured_at desc);

alter table ml_usage_history enable row level security;
alter table ml_behavior_events enable row level security;
alter table ml_user_preferences enable row level security;
alter table ml_recommendations enable row level security;
alter table ml_embeddings enable row level security;
alter table ml_analytics_snapshots enable row level security;
alter table ml_interactions enable row level security;
alter table ml_metrics enable row level security;

drop policy if exists "Users manage own ml usage history" on ml_usage_history;
create policy "Users manage own ml usage history"
  on ml_usage_history for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own ml behavior events" on ml_behavior_events;
create policy "Users manage own ml behavior events"
  on ml_behavior_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own ml preferences" on ml_user_preferences;
create policy "Users manage own ml preferences"
  on ml_user_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own ml recommendations" on ml_recommendations;
create policy "Users manage own ml recommendations"
  on ml_recommendations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own ml embeddings" on ml_embeddings;
create policy "Users manage own ml embeddings"
  on ml_embeddings for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Users manage own ml snapshots" on ml_analytics_snapshots;
create policy "Users manage own ml snapshots"
  on ml_analytics_snapshots for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own ml interactions" on ml_interactions;
create policy "Users manage own ml interactions"
  on ml_interactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own ml metrics" on ml_metrics;
create policy "Users manage own ml metrics"
  on ml_metrics for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
