# Camada de ML — recomendador de projetos

## Situação

Antes: `src/lib/machine-learning/` era só heurística determinística (feature
hashing, soma ponderada com pesos fixos, contagem de frequência). **Sem treino,
sem parâmetros aprendidos, sem avaliação.**

Agora: há um **modelo de ML treinado de verdade**, implementado do zero (sem
bibliotecas), que treina na nuvem com os dados de uso de **todos os professores**
(aprendizado colaborativo) e substitui os pesos que antes eram escolhidos à mão.
As heurísticas antigas continuam apenas como *fallback* (cold start / sem
consentimento / função indisponível).

## Arquitetura

```
Front (React)                     Supabase
────────────                      ────────
Library.jsx ──fetchRecommendations─▶ Edge Function  ──▶ ml_models (pesos)
Dashboard.jsx ──trainModels────────▶ "ml-trainer"   ──▶ ml_model_evaluations
                                     (Deno/TS)           (métricas)
                                        │
                                        └─ lê projects + ml_behavior_events
```

- Código dos algoritmos: `supabase/functions/_shared/ml/*.js` (JS puro, ESM,
  reaproveitado pelo auto-teste em Node — `scripts/ml-selftest.js`,
  `npm run test:ml`).
- Orquestração: `supabase/functions/ml-trainer/{index.ts,train.js,features.js,recommend.js}`.
- Retreino: botão no painel admin (`Dashboard.jsx` → "MODELOS DE IA") **e** cron
  noturno opcional (`supabase/migrations/010_ml_retrain_cron.sql`, pg_cron/pg_net).

## Modelos

### 1. TF-IDF ajustado ao corpus — `_shared/ml/tfidf.js`
Transformador com fase de **fit**: aprende vocabulário (frequência de documento
≥ 2, no máx. 800 termos) e o vetor **IDF** a partir do corpus (biblioteca +
projetos dos usuários). `tfidf = tf · idf`, normalizado em L2. Substitui o
"feature hashing" determinístico anterior.

### 2. Regressão Logística — `_shared/ml/logreg.js`
Classificador binário: `p = σ(w·x + b)`. Estima **P(o professor adotaria este
projeto)**.

- **Amostras**: pares (professor, projeto). Positivos = projetos que o professor
  gerou/usou/exportou/avaliou 👍 (eventos `ml_behavior_events`). Negativos =
  amostragem de projetos da biblioteca não adotados (3 por positivo).
- **Atributos** (`features.js`): `cos_tfidf` (perfil × projeto), `overlap_steam`,
  `overlap_bncc`, `match_grade`, `match_discipline`, `popularity` (adoções
  globais), `profile_strength`. Padronizados por z-score (média/desvio guardados
  no modelo).
- **Treino**: gradiente descendente em lote, perda de entropia cruzada binária
  (log loss) + regularização L2. `w`, `b` e a curva de perda são persistidos.

Os **pesos `w`** são exatamente o que antes era `0.55 / 0.15 / 0.15 / 0.08 /
0.07` chutado à mão — agora **aprendidos** minimizando o erro.

## Protocolo de avaliação — `_shared/ml/metrics.js`

- Split **estratificado 80/20** (semente fixa) dos pares; padronização ajustada
  só no treino (sem vazamento).
- Métricas de classificação: acurácia, precisão, recall, F1, **ROC-AUC**
  (estatística de Mann–Whitney), **log loss**, matriz de confusão.
- Métricas de ranking (k=5): **precision@k**, **recall@k**, **MAP@k**.
- Curva de perda por época (convergência do gradiente).
- Tudo salvo em `ml_model_evaluations.metrics` e exibido no painel admin.

Auto-teste (`npm run test:ml`): em dado sintético linearmente separável a
regressão logística atinge AUC > 0.99 e acurácia > 0.94, e reduz o peso da
feature de ruído — evidência de que o treino de fato aprende.

## O que continua heurístico (fallback / não trocado)

- `recommendation/recommendationEngine.js`, `similarity/projectSimilarity.js` —
  usados quando não há modelo ativo.
- `project-continuity/continuityEngine.js` — sugestões por template de texto.
- `user-profile/profileBuilder.js` — contagem de frequência (alimenta o perfil).
- `embeddings/textVectorizer.js` — hashing legado, ainda usado por
  `knowledge/knowledgeBaseService.js`.

## Tabelas

- `public.ml_models(kind, params jsonb, feature_spec, n_samples, trained_at,
  is_active)` — `kind ∈ {tfidf, logreg_recommender}`. Leitura para autenticado
  (só vetores numéricos, sem PII); escrita só service role.
- `public.ml_model_evaluations(model_id, metrics jsonb, created_at)`.
- Fonte de treino: `ml_behavior_events` (+ `app_usage_events`) e `projects`.

## Limitações honestas para a dissertação

- **Cold start**: com poucos eventos o treino recusa (`nSamples < 8`) e o app usa
  o fallback heurístico; o painel admin mostra `nSamples`.
- Rótulo por *implicit feedback* (adoção), com amostragem negativa — não há
  "não gostei" explícito além do 👎.
- Modelo linear (por transparência e por caber numa Edge Function sem deps);
  não captura interações não lineares entre atributos.
- Treino colaborativo global (um modelo para todos), não um modelo por professor.
