# Pipeline de geração de atividade pedagógica com IA (já mapeado nesta conversa)

## Componentes envolvidos (para diagrama de componentes)

- **PedagogicalPlannerModal.jsx** (`src/components/project/`) — wizard de UI (9 passos: disciplina, série, tema, materiais, competências STEAM, nº de aulas, modalidade, personalização, prévia). No passo de prévia, chama `selectBnccHabilidades` (bnccSelector.js) para mostrar competências BNCC reais (código + descrição) antes de gerar.
- **PedagogicalPlannerService** (`src/lib/ai/pedagogicalPlannerService.js`) — orquestra a geração:
  - `generateActivity()` / `generateClassroomActivity()`
  - Busca contexto: `getContextForActivity` (knowledge base), `getQualityPatterns` (padrões aprendidos), `findSourcesForActivity` (fontes externas), `selectBnccHabilidades` (BNCC offline)
  - `buildPrompt()` monta o prompt com todo o contexto
  - Chama `AIProviderManager.request({ requestType, prompt })`
  - Recebe `response.content` (texto bruto), extrai JSON (`extractJson`/`cleanJsonResponse`), faz parse com reparo (`safeParseJson`/`repairJson`)
  - `applyOfflineBncc` valida os códigos BNCC retornados contra a base offline (nunca aceita código inventado pela IA)
  - `normalizeLearningExperience` (learningExperience.js) normaliza/preenche campos faltantes, aplica limites de tamanho
  - `validateActivity` valida completude
- **AIProviderManager** (`src/lib/ai/AIProviderManager.js`) — abstrai múltiplos provedores de IA, define ordem/fallback (Gemini como principal, Cerebras como fallback), tenta candidatos em sequência até um funcionar
- **GeminiProvider / CerebrasProvider** (`src/lib/ai/providers/*/index.js`) — adaptam a chamada genérica para cada serviço
- **GeminiService / CerebrasService** (`src/lib/ai/geminiService.js`, `cerebrasService.js`) — chamam Supabase Edge Functions via `supabase.functions.invoke('gemini'|'cerebras', { body })`
- **Supabase Edge Functions** (`supabase/functions/gemini/index.ts`, `cerebras/index.ts`) — rodam no servidor (Deno), chamam as APIs externas:
  - Gemini: `generativelanguage.googleapis.com` (modelo `gemini-2.5-flash`, com `thinkingConfig.thinkingBudget` limitado + `maxOutputTokens: 16384`, corrigido nesta conversa para evitar truncamento)
  - Cerebras: API compatível com chat completions (modelo `gpt-oss-120b`)
- **learningExperience.js** — funções puras de normalização/validação/limite de texto (`normalizeLearningExperience`, `validateLearningExperience`, `limitText`, etc.) — é o "modelo de domínio" da atividade pedagógica (Experiência de Aprendizagem STEAM + Cultura Maker)
- **bnccSelector.js** — seleciona habilidades BNCC reais da base offline (`src/data/bncc.js`) por série/disciplina/tema/competência STEAM (`selectBnccHabilidades`), e resolve código→descrição (`getBnccResumo`)
- **exportReport.js** — módulo grande (>4000 linhas) responsável por:
  - `prepareExperienceForExport` — valida e AUTO-REPARA a atividade antes de exportar (até 3 tentativas), incluindo lógica financeira específica (orçamento familiar)
  - `buildActivityPrintHTMLFromExperience` — gera o HTML final do PDF (seções numeradas: título, objetivo, problema/missão, materiais, desenvolvimento/etapas, desafio maker, produto final, conexão STEAM, avaliação, referências, gabarito do professor — página separada)
  - `openActivityPrintWindow` — abre nova janela do navegador com o HTML e aciona impressão/"Salvar como PDF" (não usa lib de PDF, é impressão HTML→PDF nativa do navegador)
  - Validações de qualidade: detecta frases truncadas, rótulos financeiros malformados, DOIs corrompidos, e AUTO-CORRIGE antes de bloquear a exportação

## Fluxo de sequência principal (para diagrama de sequência)

1. Professor preenche o wizard (`PedagogicalPlannerModal`) → clica em "Gerar atividade"
2. `PedagogicalPlannerModal` chama `PedagogicalPlannerService.generateActivity(params)`
3. Service busca contexto (KB local + fontes externas + padrões de qualidade do usuário) — chamadas paralelas
4. Service seleciona habilidades BNCC offline (`selectBnccHabilidades`)
5. Service monta prompt (`buildPrompt`) e chama `AIProviderManager.request()`
6. Manager escolhe provedor primário (Gemini) → `GeminiProvider.execute()` → `GeminiService.generateText()` → `supabase.functions.invoke('gemini')`
7. Edge Function `gemini` chama a API do Google Gemini, retorna texto bruto (JSON dentro de markdown, às vezes)
8. Se falhar, Manager tenta fallback (Cerebras) — mesmo caminho via edge function `cerebras`
9. Service recebe texto, extrai/repara JSON, valida contra BNCC offline, normaliza (`normalizeLearningExperience`), valida completude
10. Retorna atividade normalizada para o Modal → salva no projeto (Supabase, tabela `projects`, campo `project_data` jsonb)
11. Professor revisa em `ActivityViewer.jsx`, pode editar campos, salvar (`editProject`) ou imprimir/exportar
12. Ao exportar: `openActivityPrintWindow(activity)` → `prepareExperienceForExport` (valida + repara, várias tentativas) → `buildActivityPrintHTMLFromExperience` (monta HTML com chips BNCC, tabelas, gabarito) → abre janela do navegador → professor imprime/salva como PDF

## Observação importante para o artigo
O sistema usa MÚLTIPLOS provedores de IA com fallback automático (arquitetura resiliente), mas TODA validação factual crítica (códigos BNCC, dados financeiros, referências bibliográficas/DOI) é feita por regras determinísticas no frontend — a IA nunca é a fonte de verdade final, apenas gera o rascunho que é validado/corrigido por código determinístico antes de chegar ao professor. Isso é um ponto forte para destacar na dissertação (mitigação de alucinação).
