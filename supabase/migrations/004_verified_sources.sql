-- Fontes acadêmicas verificadas vinculadas a projetos pedagógicos
CREATE TABLE IF NOT EXISTS verified_sources (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  authors       TEXT,
  year          INTEGER,
  journal       TEXT,
  doi           TEXT,
  url           TEXT,
  publisher     TEXT,
  api_source    TEXT,                    -- 'crossref' | 'openalex' | 'scielo' | 'semanticscholar'
  abnt          TEXT,                    -- formatted ABNT citation
  status        TEXT NOT NULL DEFAULT 'unverified'
                CHECK (status IN ('verified', 'incomplete', 'unverified')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verified_sources_project ON verified_sources(project_id);
CREATE INDEX IF NOT EXISTS idx_verified_sources_doi     ON verified_sources(doi) WHERE doi IS NOT NULL;

-- Referências bibliográficas geradas pela IA com status de verificação
CREATE TABLE IF NOT EXISTS bibliography_references (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_text      TEXT NOT NULL,           -- string exata gerada pela IA
  doi           TEXT,
  status        TEXT NOT NULL DEFAULT 'unverified'
                CHECK (status IN ('real', 'doubtful', 'fabricated', 'unverified')),
  confidence    REAL,                    -- 0.0–1.0
  note          TEXT,                    -- explicação da avaliação
  check_source  TEXT,                    -- 'crossref' | 'ai'
  checked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bibliography_refs_project ON bibliography_references(project_id);

-- RLS
ALTER TABLE verified_sources       ENABLE ROW LEVEL SECURITY;
ALTER TABLE bibliography_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_verified_sources"
  ON verified_sources FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "users_own_bibliography_refs"
  ON bibliography_references FOR ALL
  USING (auth.uid() = user_id);
