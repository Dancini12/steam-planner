-- Tabela para controle de uso do planejador pedagógico
CREATE TABLE IF NOT EXISTS pedagogical_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discipline TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  steam_competencies TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Garantir uma linha por usuário/disciplina/dia
  UNIQUE(user_id, discipline, date)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pedagogical_usage_user_date ON pedagogical_usage(user_id, date);
CREATE INDEX IF NOT EXISTS idx_pedagogical_usage_discipline ON pedagogical_usage(discipline);

-- Tabela para cache de atividades pedagógicas
CREATE TABLE IF NOT EXISTS pedagogical_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  discipline TEXT NOT NULL,
  grade TEXT NOT NULL,
  theme TEXT NOT NULL,
  steam_competencies TEXT[] NOT NULL,
  activity_content TEXT NOT NULL,
  resources JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Índice composto para busca eficiente
  UNIQUE(discipline, grade, theme, steam_competencies)
);

-- Índices para cache
CREATE INDEX IF NOT EXISTS idx_pedagogical_cache_search ON pedagogical_cache(discipline, grade, theme);
CREATE INDEX IF NOT EXISTS idx_pedagogical_cache_competencies ON pedagogical_cache USING GIN(steam_competencies);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_pedagogical_usage_updated_at
  BEFORE UPDATE ON pedagogical_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pedagogical_cache_updated_at
  BEFORE UPDATE ON pedagogical_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS (Row Level Security)
ALTER TABLE pedagogical_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedagogical_cache ENABLE ROW LEVEL SECURITY;

-- Políticas para pedagogical_usage
CREATE POLICY "Users can view own usage" ON pedagogical_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON pedagogical_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON pedagogical_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para pedagogical_cache (público para leitura, admin para escrita)
CREATE POLICY "Anyone can view cache" ON pedagogical_cache
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert cache" ON pedagogical_cache
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Políticas para atualização (apenas usuários autenticados)
CREATE POLICY "Authenticated users can update cache" ON pedagogical_cache
  FOR UPDATE USING (auth.role() = 'authenticated');