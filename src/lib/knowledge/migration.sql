-- ============================================================
-- STEAM Planner — Knowledge Base Migration
-- Execute no Supabase SQL Editor (uma única vez)
-- ============================================================

-- 1. Base de conhecimento pedagógico
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_base (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT        NOT NULL,
  summary        TEXT        NOT NULL DEFAULT '',
  content        TEXT        NOT NULL DEFAULT '',
  source_url     TEXT        NOT NULL DEFAULT '',
  source_name    TEXT        NOT NULL DEFAULT '',
  authors        JSONB       NOT NULL DEFAULT '[]'::jsonb,
  year           INTEGER,
  doi            TEXT,
  topic          TEXT        NOT NULL DEFAULT 'geral',
  subject        TEXT        NOT NULL DEFAULT '',
  grade_level    TEXT        NOT NULL DEFAULT '',
  steam_areas    TEXT[]      NOT NULL DEFAULT '{}',
  maker_connection BOOLEAN   NOT NULL DEFAULT false,
  bncc_codes     TEXT[]      NOT NULL DEFAULT '{}',
  keywords       TEXT[]      NOT NULL DEFAULT '{}',
  reliability_score INTEGER  NOT NULL DEFAULT 0,
  abnt_citation  TEXT        NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DOI único apenas quando preenchido (NULL é permitido em múltiplos registros)
CREATE UNIQUE INDEX IF NOT EXISTS knowledge_base_doi_unique
  ON knowledge_base (doi)
  WHERE doi IS NOT NULL AND doi <> '';

CREATE INDEX IF NOT EXISTS idx_kb_topic    ON knowledge_base (topic);
CREATE INDEX IF NOT EXISTS idx_kb_score    ON knowledge_base (reliability_score DESC);
CREATE INDEX IF NOT EXISTS idx_kb_subject  ON knowledge_base (subject);
CREATE INDEX IF NOT EXISTS idx_kb_updated  ON knowledge_base (updated_at);

-- 2. Embeddings para busca por similaridade
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_embeddings (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_id UUID        NOT NULL REFERENCES knowledge_base(id) ON DELETE CASCADE,
  embedding    JSONB       NOT NULL,        -- vetor float[] de 96 dimensões
  topic        TEXT        NOT NULL DEFAULT '',
  keywords     TEXT[]      NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS knowledge_embeddings_kid_unique
  ON knowledge_embeddings (knowledge_id);

CREATE INDEX IF NOT EXISTS idx_emb_topic ON knowledge_embeddings (topic);

-- 3. Rastreamento de validação de fontes
-- ============================================================
CREATE TABLE IF NOT EXISTS source_validation (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url        TEXT        NOT NULL,
  source_name       TEXT        NOT NULL DEFAULT '',
  validation_status TEXT        NOT NULL DEFAULT 'pending',
  reliability_score INTEGER     NOT NULL DEFAULT 0,
  last_checked_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS source_validation_url_unique
  ON source_validation (source_url);

-- 4. Desabilita RLS (habilite e configure políticas quando necessário)
-- ============================================================
ALTER TABLE knowledge_base       DISABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_embeddings DISABLE ROW LEVEL SECURITY;
ALTER TABLE source_validation    DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- Pronto. Tabelas criadas com sucesso.
-- ============================================================
