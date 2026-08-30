# Relatório do Schema do Banco de Dados — Steam Planner

Fontes analisadas: `supabase-projects.sql`, `supabase/migrations/001` a `007`, `src/lib/knowledge/migration.sql`. Estado consolidado após todas as migrations.

## Núcleo: usuários, projetos e feedback

**app_admins** — email (PK, text), created_at. Lista de e-mails com privilégio admin.

**app_profiles** — id (PK, FK → auth.users.id), email, name, school, area, created_at, last_seen_at.

**projects** — id (PK, text), owner_id (FK → auth.users.id), usuario_id (FK → auth.users.id, redundante/legado), title, theme, grade, duration, steam (text[]), created_via, is_public (bool), project_data (jsonb), created_at, updated_at.

**project_private_data** — project_id (PK, FK → projects.id, cascade), owner_id (FK → auth.users.id), private_data (jsonb), created_at, updated_at. Extensão 1:1 de projects.

**app_usage_events** — id (PK, bigserial), user_id (FK → auth.users.id), event_type, metadata (jsonb), created_at.

**app_metric_snapshots** — id (PK, bigserial), title, metrics (jsonb), created_at.

**feedback** — id (PK, uuid), user_id (FK → auth.users.id, SET NULL), category, message, sender_name, sender_email, created_at.

**feedbacks** — id (PK, uuid), user_id (FK → auth.users.id, SET NULL), mensagem, nota (numeric), category, created_at. Tabela irmã de feedback (dados migrados de feedback → feedbacks).

## Módulo pedagógico (uso e cache)

**pedagogical_usage** — id (PK, uuid), user_id (FK), discipline, count, date, steam_competencies (text[]), created_at, updated_at. UNIQUE(user_id, discipline, date).

**pedagogical_cache** — id (PK, uuid), discipline, grade, theme, steam_competencies (text[]), activity_content, resources (jsonb), created_at, updated_at. UNIQUE(discipline, grade, theme, steam_competencies). Sem FK a usuário (compartilhado).

## Base curricular BNCC

**bncc_areas** — id (PK, uuid), nome, etapa, created_at. UNIQUE(nome, etapa).
**bncc_componentes** — id (PK, uuid), nome, area (sem FK), etapa, anos (text[]), created_at.
**bncc_habilidades** — id (PK, uuid), codigo (UNIQUE), etapa, ano, area, componente, unidade_tematica, objeto_conhecimento, descricao, palavras_chave (text[]), temas_relacionados (text[]), steam_relacionado (text[]), cultura_maker (bool), fonte_url, observacoes, created_at, updated_at.
(Sem FK física entre as 3 tabelas BNCC — relação lógica por nome/área.)

## Módulo de Machine Learning / personalização (todas FK → auth.users)

- **ml_usage_history** — id, user_id (FK), action_type, entity_type, entity_id, metadata, created_at
- **ml_behavior_events** — id, user_id (FK), event_type, metadata, context, created_at
- **ml_user_preferences** — user_id (PK, FK), top_disciplines/grades/themes/steam_areas/bncc (jsonb), updated_at
- **ml_recommendations** — id, user_id (FK), recommendation_type, source/target entity, score, reason, metadata, created_at, expires_at
- **ml_embeddings** — id, owner_id (FK), entity_type, entity_id, embedding_model, dimensions, embedding (jsonb), text_hash, metadata. UNIQUE(owner_id, entity_type, entity_id)
- **ml_analytics_snapshots** — id, user_id (FK), snapshot_type, metrics, created_at
- **ml_interactions** — id, user_id (FK), interaction_type, entity_type, entity_id, metadata, created_at
- **ml_metrics** — id, user_id (FK), metric_name, metric_value, dimensions, measured_at

## Fontes acadêmicas

**verified_sources** — id (PK), project_id (FK → projects.id), user_id (FK), title, authors, year, journal, doi, url, publisher, api_source, abnt, status, created_at.
**bibliography_references** — id (PK), project_id (FK → projects.id), user_id (FK), raw_text, doi, status, confidence, note, check_source, checked_at, created_at.

## Base de conhecimento (knowledge.sql)

**knowledge_base** — id (PK), title, summary, content, source_url, source_name, authors (jsonb), year, doi (unique parcial), topic, subject, grade_level, steam_areas (text[]), maker_connection (bool), bncc_codes (text[]), keywords (text[]), reliability_score, abnt_citation, created_at, updated_at.
**knowledge_embeddings** — id (PK), knowledge_id (FK → knowledge_base.id, unique), embedding (jsonb), topic, keywords (text[]), created_at.
**source_validation** — id (PK), source_url (unique), source_name, validation_status, reliability_score, last_checked_at (sem FK).

## Relacionamentos (para o diagrama ER)

- auth.users → projects (owner_id, usuario_id)
- auth.users → project_private_data (owner_id); projects → project_private_data (project_id, 1:1)
- auth.users → app_profiles (id, 1:1)
- auth.users → app_usage_events, feedback, feedbacks (user_id)
- auth.users → pedagogical_usage (user_id)
- auth.users → todas as tabelas ml_* (user_id/owner_id)
- projects → verified_sources, projects → bibliography_references (project_id); auth.users → ambas (user_id)
- knowledge_base → knowledge_embeddings (knowledge_id, 1:1)
- app_admins: relação lógica (não FK) via e-mail do JWT em RLS de várias tabelas
- bncc_areas / bncc_componentes / bncc_habilidades: relação apenas lógica (nome/área), sem FK
- pedagogical_cache, knowledge_base, source_validation: sem FK, tabelas de cache/compartilhadas
