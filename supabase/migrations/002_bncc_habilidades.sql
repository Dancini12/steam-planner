-- ============================================================
-- BNCC - Ensino Fundamental, Anos Finais (6º ao 9º ano)
-- STEAM+ Cultura Maker
-- ============================================================
--
-- Objetivo:
--   Preparar a base relacional para armazenar e consultar habilidades
--   da BNCC usadas na geração de atividades do aplicativo.
--
-- Referência oficial para carga completa:
--   BNCC/MEC - Ensino Fundamental - Anos Finais
--   https://basenacionalcomum.mec.gov.br/
--
-- Importante:
--   Este arquivo cria a estrutura e insere poucos registros de teste.
--   Não é uma carga completa da BNCC. A importação oficial completa deve
--   ser feita posteriormente por CSV/planilha revisada contra o documento
--   oficial da BNCC/MEC.
-- ============================================================

-- Necessário para gen_random_uuid().
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- Função compartilhada para updated_at
-- ============================================================
-- Reaproveita o padrão do projeto. Caso a função já exista em outra
-- migration, apenas a substitui mantendo a assinatura.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Tabela auxiliar: áreas da BNCC
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bncc_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  etapa TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),

  CONSTRAINT bncc_areas_nome_etapa_unique UNIQUE (nome, etapa)
);

COMMENT ON TABLE public.bncc_areas IS
  'Áreas da BNCC por etapa. Usada para filtros e organização da navegação.';
COMMENT ON COLUMN public.bncc_areas.nome IS 'Nome da área, por exemplo: Matemática ou Ciências da Natureza.';
COMMENT ON COLUMN public.bncc_areas.etapa IS 'Etapa escolar, por exemplo: Ensino Fundamental - Anos Finais.';

-- ============================================================
-- Tabela auxiliar: componentes curriculares da BNCC
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bncc_componentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  area TEXT NOT NULL,
  etapa TEXT NOT NULL,
  anos TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),

  CONSTRAINT bncc_componentes_nome_etapa_unique UNIQUE (nome, etapa)
);

COMMENT ON TABLE public.bncc_componentes IS
  'Componentes curriculares da BNCC por área, etapa e anos atendidos.';
COMMENT ON COLUMN public.bncc_componentes.anos IS
  'Anos/séries atendidos pelo componente. Ex.: {6º ano,7º ano,8º ano,9º ano}.';

-- ============================================================
-- Tabela principal: habilidades da BNCC
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bncc_habilidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  etapa TEXT NOT NULL,
  ano TEXT NOT NULL,
  area TEXT,
  componente TEXT NOT NULL,
  unidade_tematica TEXT,
  objeto_conhecimento TEXT,
  descricao TEXT NOT NULL,
  palavras_chave TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  temas_relacionados TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  steam_relacionado TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  cultura_maker BOOLEAN NOT NULL DEFAULT FALSE,
  fonte_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

COMMENT ON TABLE public.bncc_habilidades IS
  'Habilidades da BNCC para consulta por ano, componente, tema, STEAM e Cultura Maker.';
COMMENT ON COLUMN public.bncc_habilidades.codigo IS
  'Código oficial da habilidade BNCC. Ex.: EF06CI01.';
COMMENT ON COLUMN public.bncc_habilidades.palavras_chave IS
  'Palavras-chave normalizadas para busca pedagógica.';
COMMENT ON COLUMN public.bncc_habilidades.temas_relacionados IS
  'Temas escolares ou cotidianos associados à habilidade.';
COMMENT ON COLUMN public.bncc_habilidades.steam_relacionado IS
  'Eixos STEAM associados: ciencia, tecnologia, engenharia, artes, matematica.';
COMMENT ON COLUMN public.bncc_habilidades.cultura_maker IS
  'Indica se a habilidade tem associação direta com práticas maker/prototipagem/investigação.';
COMMENT ON COLUMN public.bncc_habilidades.fonte_url IS
  'URL da fonte consultada para auditoria do registro.';
COMMENT ON COLUMN public.bncc_habilidades.observacoes IS
  'Notas internas sobre revisão, importação ou curadoria pedagógica.';

-- ============================================================
-- Índices para filtros e busca
-- ============================================================
-- B-tree para filtros diretos.
CREATE INDEX IF NOT EXISTS idx_bncc_habilidades_codigo
  ON public.bncc_habilidades (codigo);

CREATE INDEX IF NOT EXISTS idx_bncc_habilidades_ano
  ON public.bncc_habilidades (ano);

CREATE INDEX IF NOT EXISTS idx_bncc_habilidades_componente
  ON public.bncc_habilidades (componente);

CREATE INDEX IF NOT EXISTS idx_bncc_habilidades_area
  ON public.bncc_habilidades (area);

CREATE INDEX IF NOT EXISTS idx_bncc_habilidades_unidade_tematica
  ON public.bncc_habilidades (unidade_tematica);

CREATE INDEX IF NOT EXISTS idx_bncc_habilidades_objeto_conhecimento
  ON public.bncc_habilidades (objeto_conhecimento);

-- GIN para campos array.
CREATE INDEX IF NOT EXISTS idx_bncc_habilidades_palavras_chave
  ON public.bncc_habilidades USING GIN (palavras_chave);

CREATE INDEX IF NOT EXISTS idx_bncc_habilidades_temas_relacionados
  ON public.bncc_habilidades USING GIN (temas_relacionados);

CREATE INDEX IF NOT EXISTS idx_bncc_habilidades_steam_relacionado
  ON public.bncc_habilidades USING GIN (steam_relacionado);

-- Índice composto útil para a tela de geração: disciplina + série.
CREATE INDEX IF NOT EXISTS idx_bncc_habilidades_gerador
  ON public.bncc_habilidades (componente, ano, cultura_maker);

-- Índices auxiliares das tabelas de catálogo.
CREATE INDEX IF NOT EXISTS idx_bncc_componentes_area
  ON public.bncc_componentes (area);

CREATE INDEX IF NOT EXISTS idx_bncc_componentes_anos
  ON public.bncc_componentes USING GIN (anos);

CREATE INDEX IF NOT EXISTS idx_bncc_areas_etapa
  ON public.bncc_areas (etapa);

-- ============================================================
-- Trigger para updated_at
-- ============================================================
DROP TRIGGER IF EXISTS update_bncc_habilidades_updated_at ON public.bncc_habilidades;
CREATE TRIGGER update_bncc_habilidades_updated_at
  BEFORE UPDATE ON public.bncc_habilidades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Função utilitária para políticas de admin
-- ============================================================
-- A política considera admin o usuário autenticado cujo JWT possua:
--   app_metadata.role = 'admin'
--   OU app_metadata.roles contendo 'admin'
-- Ajuste esta função se o projeto usar outra estratégia de perfis/admin.
CREATE OR REPLACE FUNCTION public.is_bncc_admin()
RETURNS BOOLEAN AS $$
  SELECT
    auth.role() = 'authenticated'
    AND (
      auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
      OR COALESCE(auth.jwt() -> 'app_metadata' -> 'roles', '[]'::jsonb) ? 'admin'
    );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.is_bncc_admin() IS
  'Retorna true quando o usuário autenticado possui papel admin no app_metadata do JWT.';

-- ============================================================
-- Função de busca para uso no app
-- ============================================================
-- Uso típico pela tela de geração de atividades:
--   select * from buscar_bncc_habilidades(
--     p_ano := '7º ano',
--     p_componente := 'Ciências',
--     p_palavra_chave := 'energia',
--     p_cultura_maker := true
--   );
--
-- A função aceita filtros opcionais. Quando um filtro é null, ele é ignorado.
CREATE OR REPLACE FUNCTION public.buscar_bncc_habilidades(
  p_ano TEXT DEFAULT NULL,
  p_componente TEXT DEFAULT NULL,
  p_area TEXT DEFAULT NULL,
  p_unidade_tematica TEXT DEFAULT NULL,
  p_palavra_chave TEXT DEFAULT NULL,
  p_tema_relacionado TEXT DEFAULT NULL,
  p_steam_relacionado TEXT DEFAULT NULL,
  p_cultura_maker BOOLEAN DEFAULT NULL,
  p_limite INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  codigo TEXT,
  etapa TEXT,
  ano TEXT,
  area TEXT,
  componente TEXT,
  unidade_tematica TEXT,
  objeto_conhecimento TEXT,
  descricao TEXT,
  palavras_chave TEXT[],
  temas_relacionados TEXT[],
  steam_relacionado TEXT[],
  cultura_maker BOOLEAN,
  score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    h.id,
    h.codigo,
    h.etapa,
    h.ano,
    h.area,
    h.componente,
    h.unidade_tematica,
    h.objeto_conhecimento,
    h.descricao,
    h.palavras_chave,
    h.temas_relacionados,
    h.steam_relacionado,
    h.cultura_maker,
    (
      CASE WHEN p_ano IS NOT NULL AND h.ano = p_ano THEN 10 ELSE 0 END +
      CASE WHEN p_componente IS NOT NULL AND h.componente ILIKE p_componente THEN 10 ELSE 0 END +
      CASE WHEN p_area IS NOT NULL AND h.area ILIKE p_area THEN 6 ELSE 0 END +
      CASE WHEN p_unidade_tematica IS NOT NULL AND h.unidade_tematica ILIKE p_unidade_tematica THEN 5 ELSE 0 END +
      CASE WHEN p_palavra_chave IS NOT NULL AND h.palavras_chave && ARRAY[p_palavra_chave]::TEXT[] THEN 8 ELSE 0 END +
      CASE WHEN p_tema_relacionado IS NOT NULL AND h.temas_relacionados && ARRAY[p_tema_relacionado]::TEXT[] THEN 8 ELSE 0 END +
      CASE WHEN p_steam_relacionado IS NOT NULL AND h.steam_relacionado && ARRAY[p_steam_relacionado]::TEXT[] THEN 8 ELSE 0 END +
      CASE WHEN p_cultura_maker IS NOT NULL AND h.cultura_maker = p_cultura_maker THEN 4 ELSE 0 END
    ) AS score
  FROM public.bncc_habilidades h
  WHERE
    (
      p_ano IS NULL
      OR h.ano = p_ano
      OR p_ano = ANY (
        SELECT trim(value)
        FROM unnest(string_to_array(h.ano, ';')) AS value
      )
    )
    AND (p_componente IS NULL OR h.componente ILIKE p_componente)
    AND (p_area IS NULL OR h.area ILIKE p_area)
    AND (p_unidade_tematica IS NULL OR h.unidade_tematica ILIKE p_unidade_tematica)
    AND (
      p_palavra_chave IS NULL
      OR h.palavras_chave && ARRAY[p_palavra_chave]::TEXT[]
      OR h.descricao ILIKE '%' || p_palavra_chave || '%'
      OR h.objeto_conhecimento ILIKE '%' || p_palavra_chave || '%'
    )
    AND (
      p_tema_relacionado IS NULL
      OR h.temas_relacionados && ARRAY[p_tema_relacionado]::TEXT[]
      OR h.descricao ILIKE '%' || p_tema_relacionado || '%'
    )
    AND (
      p_steam_relacionado IS NULL
      OR h.steam_relacionado && ARRAY[p_steam_relacionado]::TEXT[]
    )
    AND (p_cultura_maker IS NULL OR h.cultura_maker = p_cultura_maker)
  ORDER BY score DESC, h.codigo ASC
  LIMIT LEAST(COALESCE(p_limite, 20), 100);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.buscar_bncc_habilidades(
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  BOOLEAN,
  INTEGER
) IS
  'Busca habilidades BNCC por ano, componente, área, unidade temática, palavra-chave, tema, STEAM e Cultura Maker.';

-- ============================================================
-- RLS - leitura pública, escrita apenas por admin autenticado
-- ============================================================
ALTER TABLE public.bncc_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bncc_componentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bncc_habilidades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read BNCC areas" ON public.bncc_areas;
CREATE POLICY "Public can read BNCC areas"
  ON public.bncc_areas
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage BNCC areas" ON public.bncc_areas;
CREATE POLICY "Admins can manage BNCC areas"
  ON public.bncc_areas
  FOR ALL
  USING (public.is_bncc_admin())
  WITH CHECK (public.is_bncc_admin());

DROP POLICY IF EXISTS "Public can read BNCC componentes" ON public.bncc_componentes;
CREATE POLICY "Public can read BNCC componentes"
  ON public.bncc_componentes
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage BNCC componentes" ON public.bncc_componentes;
CREATE POLICY "Admins can manage BNCC componentes"
  ON public.bncc_componentes
  FOR ALL
  USING (public.is_bncc_admin())
  WITH CHECK (public.is_bncc_admin());

DROP POLICY IF EXISTS "Public can read BNCC habilidades" ON public.bncc_habilidades;
CREATE POLICY "Public can read BNCC habilidades"
  ON public.bncc_habilidades
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage BNCC habilidades" ON public.bncc_habilidades;
CREATE POLICY "Admins can manage BNCC habilidades"
  ON public.bncc_habilidades
  FOR ALL
  USING (public.is_bncc_admin())
  WITH CHECK (public.is_bncc_admin());

-- Grants necessários para uso via Supabase/PostgREST.
-- As políticas RLS acima continuam controlando o que cada papel pode fazer.
GRANT SELECT ON public.bncc_areas TO anon, authenticated;
GRANT SELECT ON public.bncc_componentes TO anon, authenticated;
GRANT SELECT ON public.bncc_habilidades TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON public.bncc_areas TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.bncc_componentes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.bncc_habilidades TO authenticated;

-- Permite que clientes anon/auth chamem a função RPC de busca.
GRANT EXECUTE ON FUNCTION public.buscar_bncc_habilidades(
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  BOOLEAN,
  INTEGER
) TO anon, authenticated;

-- ============================================================
-- Seeds mínimos de catálogo
-- ============================================================
INSERT INTO public.bncc_areas (nome, etapa)
VALUES
  ('Linguagens', 'Ensino Fundamental - Anos Finais'),
  ('Matemática', 'Ensino Fundamental - Anos Finais'),
  ('Ciências da Natureza', 'Ensino Fundamental - Anos Finais'),
  ('Ciências Humanas', 'Ensino Fundamental - Anos Finais'),
  ('Ensino Religioso', 'Ensino Fundamental - Anos Finais')
ON CONFLICT (nome, etapa) DO NOTHING;

INSERT INTO public.bncc_componentes (nome, area, etapa, anos)
VALUES
  ('Língua Portuguesa', 'Linguagens', 'Ensino Fundamental - Anos Finais', ARRAY['6º ano','7º ano','8º ano','9º ano']),
  ('Arte', 'Linguagens', 'Ensino Fundamental - Anos Finais', ARRAY['6º ano','7º ano','8º ano','9º ano']),
  ('Educação Física', 'Linguagens', 'Ensino Fundamental - Anos Finais', ARRAY['6º ano','7º ano','8º ano','9º ano']),
  ('Língua Inglesa', 'Linguagens', 'Ensino Fundamental - Anos Finais', ARRAY['6º ano','7º ano','8º ano','9º ano']),
  ('Matemática', 'Matemática', 'Ensino Fundamental - Anos Finais', ARRAY['6º ano','7º ano','8º ano','9º ano']),
  ('Ciências', 'Ciências da Natureza', 'Ensino Fundamental - Anos Finais', ARRAY['6º ano','7º ano','8º ano','9º ano']),
  ('Geografia', 'Ciências Humanas', 'Ensino Fundamental - Anos Finais', ARRAY['6º ano','7º ano','8º ano','9º ano']),
  ('História', 'Ciências Humanas', 'Ensino Fundamental - Anos Finais', ARRAY['6º ano','7º ano','8º ano','9º ano']),
  ('Ensino Religioso', 'Ensino Religioso', 'Ensino Fundamental - Anos Finais', ARRAY['6º ano','7º ano','8º ano','9º ano'])
ON CONFLICT (nome, etapa) DO UPDATE
SET area = EXCLUDED.area,
    anos = EXCLUDED.anos;

-- ============================================================
-- Registros de exemplo para teste
-- ============================================================
-- Estes exemplos usam códigos e descrições oficiais pontuais para
-- validar a estrutura. Revise unidade_tematica/objeto_conhecimento e
-- metadados pedagógicos na planilha final antes da carga completa.
INSERT INTO public.bncc_habilidades (
  codigo,
  etapa,
  ano,
  area,
  componente,
  unidade_tematica,
  objeto_conhecimento,
  descricao,
  palavras_chave,
  temas_relacionados,
  steam_relacionado,
  cultura_maker,
  fonte_url,
  observacoes
)
VALUES
  (
    'EF06CI01',
    'Ensino Fundamental - Anos Finais',
    '6º ano',
    'Ciências da Natureza',
    'Ciências',
    'Matéria e energia',
    'Misturas homogêneas e heterogêneas',
    'Classificar como homogênea ou heterogênea a mistura de dois ou mais materiais (água e sal, água e óleo, água e areia etc.).',
    ARRAY['misturas','materiais','homogenea','heterogenea'],
    ARRAY['experimentos','separacao de materiais','materiais do cotidiano'],
    ARRAY['ciencia','engenharia'],
    TRUE,
    'https://basenacionalcomum.mec.gov.br/',
    'Registro de exemplo para testar a estrutura. Revisar na carga oficial completa.'
  ),
  (
    'EF07CI01',
    'Ensino Fundamental - Anos Finais',
    '7º ano',
    'Ciências da Natureza',
    'Ciências',
    'Matéria e energia',
    'Máquinas simples',
    'Discutir a aplicação, ao longo da história, das máquinas simples e propor soluções e invenções para a realização de tarefas mecânicas cotidianas.',
    ARRAY['maquinas simples','inovacao','forca','movimento'],
    ARRAY['prototipagem','solucoes mecanicas','cotidiano'],
    ARRAY['ciencia','engenharia','tecnologia'],
    TRUE,
    'https://basenacionalcomum.mec.gov.br/',
    'Registro de exemplo para testar a estrutura. Revisar na carga oficial completa.'
  ),
  (
    'EF08CI02',
    'Ensino Fundamental - Anos Finais',
    '8º ano',
    'Ciências da Natureza',
    'Ciências',
    'Matéria e energia',
    'Circuitos elétricos',
    'Construir circuitos elétricos com pilha/bateria, fios e lâmpada ou outros dispositivos e compará-los a circuitos elétricos residenciais.',
    ARRAY['circuitos','eletricidade','energia','lampada'],
    ARRAY['prototipagem','energia eletrica','seguranca eletrica'],
    ARRAY['ciencia','tecnologia','engenharia'],
    TRUE,
    'https://basenacionalcomum.mec.gov.br/',
    'Registro de exemplo para testar a estrutura. Revisar na carga oficial completa.'
  ),
  (
    'EF09CI13',
    'Ensino Fundamental - Anos Finais',
    '9º ano',
    'Ciências da Natureza',
    'Ciências',
    'Vida e evolução',
    'Preservação da biodiversidade',
    'Propor iniciativas individuais e coletivas para a solução de problemas ambientais da cidade ou da comunidade, com base na análise de ações de consumo consciente e de sustentabilidade bem-sucedidas.',
    ARRAY['sustentabilidade','meio ambiente','consumo consciente','comunidade'],
    ARRAY['problemas ambientais','cidade','solucoes sustentaveis'],
    ARRAY['ciencia','tecnologia','engenharia','artes'],
    TRUE,
    'https://basenacionalcomum.mec.gov.br/',
    'Registro de exemplo para testar a estrutura. Revisar na carga oficial completa.'
  ),
  (
    'EF06MA24',
    'Ensino Fundamental - Anos Finais',
    '6º ano',
    'Matemática',
    'Matemática',
    'Grandezas e medidas',
    'Problemas sobre medidas envolvendo grandezas',
    'Resolver e elaborar problemas que envolvam as grandezas comprimento, massa, tempo, temperatura, área (triângulos e retângulos), capacidade e volume (sólidos formados por blocos retangulares), sem uso de fórmulas, inseridos, sempre que possível, em contextos oriundos de situações reais e/ou relacionadas às outras áreas do conhecimento.',
    ARRAY['medidas','comprimento','massa','tempo','temperatura','area','volume'],
    ARRAY['situacoes reais','prototipos','medicao'],
    ARRAY['matematica','engenharia','ciencia'],
    TRUE,
    'https://basenacionalcomum.mec.gov.br/',
    'Registro de exemplo para testar a estrutura. Revisar na carga oficial completa.'
  )
ON CONFLICT (codigo) DO UPDATE
SET etapa = EXCLUDED.etapa,
    ano = EXCLUDED.ano,
    area = EXCLUDED.area,
    componente = EXCLUDED.componente,
    unidade_tematica = EXCLUDED.unidade_tematica,
    objeto_conhecimento = EXCLUDED.objeto_conhecimento,
    descricao = EXCLUDED.descricao,
    palavras_chave = EXCLUDED.palavras_chave,
    temas_relacionados = EXCLUDED.temas_relacionados,
    steam_relacionado = EXCLUDED.steam_relacionado,
    cultura_maker = EXCLUDED.cultura_maker,
    fonte_url = EXCLUDED.fonte_url,
    observacoes = EXCLUDED.observacoes,
    updated_at = TIMEZONE('utc'::text, NOW());

-- ============================================================
-- Consultas de verificação pós-execução
-- ============================================================
-- select count(*) from public.bncc_habilidades;
-- select * from public.buscar_bncc_habilidades(
--   p_ano := '8º ano',
--   p_componente := 'Ciências',
--   p_palavra_chave := 'circuitos',
--   p_cultura_maker := true
-- );
