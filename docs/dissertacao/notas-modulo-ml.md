# Módulo "machine-learning" — src/lib/machine-learning/

**Aviso central**: apesar do nome do diretório e das tabelas `ml_*`, NÃO há modelo de ML treinado (sem pesos, sem treinamento supervisionado, sem framework). É um conjunto de heurísticas determinísticas de contagem, hashing de texto e similaridade de cosseno, em JavaScript puro. Importante deixar isso claro e correto na dissertação.

## Submódulos

1. **embeddings/textVectorizer.js** — Bag-of-words hasheado (feature hashing FNV-1a mod 96), peso 1+log(freq), normalização L2. Não é embedding semântico real. Expõe `cosineSimilarity`.

2. **behavior-tracking/behaviorTracker.js** — Registra eventos: sempre em localStorage (`steam-ml-behavior-queue`, últimos 100, com consentimento de cookies) + Supabase em paralelo (`ml_behavior_events`, `ml_usage_history`, `ml_interactions`, `ml_metrics`). Também: `storeProjectEmbedding` (→ `ml_embeddings`), `updateUserPreferenceProfile` (contagem incremental top-N → `ml_user_preferences`), `getQualityPatterns`/`trackActivityRating` (agrega feedback 👍/👎).

3. **user-profile/profileBuilder.js** — `buildUserLearningProfile`: contagem de frequência (disciplina/série/tema/STEAM/BNCC/ação), retorna top-N. Pura contagem.

4. **similarity/projectSimilarity.js** — `scoreProjectSimilarity`: score linear com pesos fixos manualmente — cosseno de texto (0.55) + overlap STEAM (0.15) + overlap BNCC (0.15) + mesma série (0.08) + mesma disciplina (0.07).

5. **recommendation/recommendationEngine.js** — `rankRecommendedProjects`, `suggestThemesFromProfile`. NOTA: `rankRecommendedProjects`/`rankSimilarProjects` não têm chamador atual (código morto/preparado).

6. **bncc-suggestions/bnccRecommendation.js** — repassa perfil para `selectBnccHabilidades` (bnccSelector.js). Sem chamador externo detectado.

7. **project-continuity/continuityEngine.js** — `suggestProjectContinuity`: até 4 sugestões via templates de texto fixos + regras simples. Sem scoring estatístico.

8. **analytics/mlAnalytics.js** — `summarizeBehavior`: agregação de contagens.

## Fluxo de dados e consumidores reais (para diagrama de componentes/sequência)

- Origem: `src/lib/analytics.js` (`trackEvent`→`trackBehavior`) — grava local + Supabase (com consentimento).
- `src/hooks/useProjects.js` → `learnFromProject` (ao criar/usar projeto): dispara em paralelo `trackBehavior`, `storeProjectEmbedding`, `updateUserPreferenceProfile`, `storeContinuityRecommendations`.
- `src/pages/ActivityViewer.jsx` → botão 👍/👎 → `trackActivityRating` → alimenta `getQualityPatterns`.
- `src/lib/ai/pedagogicalPlannerService.js` → consome `getQualityPatterns(userId)` ao gerar atividade, injeta no PROMPT de texto enviado ao LLM (personalização via prompt, não score interno).
- `src/components/project/PedagogicalPlannerModal.jsx` → lê fila local do localStorage, chama `buildUserLearningProfile` + `suggestThemesFromProfile` para sugerir temas ao abrir o modal.
- `src/lib/knowledge/knowledgeBaseService.js` → usa o mesmo hash bag-of-words para buscar fontes/artigos semanticamente "próximos" em `knowledge_embeddings`.

**Conclusão**: camada de personalização por heurísticas de contagem + similaridade lexical, conectada em 3 pontos: (a) rastreamento passivo de eventos, (b) enriquecimento do prompt de IA generativa, (c) sugestões de tema/continuidade na UI — sempre com fallback local via localStorage.
