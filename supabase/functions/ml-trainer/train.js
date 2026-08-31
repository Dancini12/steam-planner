// ============================================================
// train.js — orquestra o treino e a avaliação do recomendador
// ============================================================
//
// Pipeline:
//   1. Ajusta o TF-IDF no corpus (biblioteca + projetos).
//   2. Monta pares (professor, item) rotulados.
//   3. Split estratificado 80/20 (semente fixa).
//   4. Padroniza (z-score) com estatísticas do treino.
//   5. Treina a regressão logística por gradiente descendente.
//   6. Avalia no conjunto de teste: acurácia, precisão, recall,
//      F1, ROC-AUC, log loss, matriz de confusão, precision@k.
// ============================================================

import { fitTfidf } from "../_shared/ml/tfidf.js";
import { fitStandardizer, applyStandardizer } from "../_shared/ml/linalg.js";
import { trainLogReg, predictProbaLogReg } from "../_shared/ml/logreg.js";
import {
  classificationReport,
  rocAuc,
  logLoss,
  rankingMetricsAtK
} from "../_shared/ml/metrics.js";
import { makeRng, shuffled } from "../_shared/ml/random.js";
import {
  FEATURE_NAMES,
  buildCatalog,
  buildTeacherProfiles,
  itemToSearchText,
  assembleSamples
} from "./features.js";

function stratifiedSplit(y, groups, testFrac, seed) {
  const rng = makeRng(seed);
  const byClass = { 0: [], 1: [] };
  y.forEach((label, i) => byClass[label].push(i));

  const testSet = new Set();
  for (const label of [0, 1]) {
    const idx = shuffled(byClass[label], rng);
    const nTest = Math.max(1, Math.round(idx.length * testFrac));
    for (let i = 0; i < nTest && i < idx.length; i += 1) testSet.add(idx[i]);
  }

  const train = [];
  const test = [];
  for (let i = 0; i < y.length; i += 1) (testSet.has(i) ? test : train).push(i);
  return { train, test };
}

function evaluate(model, standardizer, X, y, groups, testIdx) {
  const proba = [];
  const yTrue = [];
  const perUser = new Map();

  for (const i of testIdx) {
    const p = predictProbaLogReg(model, applyStandardizer(X[i], standardizer));
    proba.push(p);
    yTrue.push(y[i]);
    const u = groups[i];
    if (!perUser.has(u)) perUser.set(u, { scores: [], relevantes: [] });
    perUser.get(u).scores.push(p);
    perUser.get(u).relevantes.push(y[i] === 1);
  }

  const report = classificationReport(yTrue, proba, 0.5);
  const ranking = rankingMetricsAtK([...perUser.values()], 5);

  return {
    nTest: testIdx.length,
    accuracy: report.accuracy,
    precision: report.precision,
    recall: report.recall,
    f1: report.f1,
    rocAuc: rocAuc(yTrue, proba),
    logLoss: logLoss(yTrue, proba),
    confusion: report.confusion,
    precisionAtK: ranking.precisionAtK,
    recallAtK: ranking.recallAtK,
    mapAtK: ranking.mapAtK,
    rankingUsers: ranking.users
  };
}

const NEG_RATIO = 3;
const TFIDF_OPTS = { minDf: 2, maxFeatures: 400 };

// Diagnóstico barato: só contagens, sem construir a matriz de
// atributos (evita estourar CPU/memória do Edge Runtime).
export function diagnoseTrainingData({ library = [], projects = [], events = [] }) {
  const catalog = buildCatalog(library, projects);
  const catalogIds = new Set(catalog.map((it) => it.id));
  const catalogById = new Map(catalog.map((it) => [it.id, it]));
  const profiles = buildTeacherProfiles(events, projects, catalogById);

  const eventBreakdown = {};
  for (const e of events) {
    eventBreakdown[e.event_type] = (eventBreakdown[e.event_type] || 0) + 1;
  }

  let teachersWithPositives = 0;
  let nPositives = 0;
  for (const p of profiles.values()) {
    let pos = 0;
    for (const id of p.adoptedIds) if (catalogIds.has(id)) pos += 1;
    if (pos > 0) {
      teachersWithPositives += 1;
      nPositives += pos;
    }
  }
  const nSamples = nPositives * (1 + NEG_RATIO); // estimativa

  return {
    projects: projects.length,
    events: events.length,
    eventBreakdown,
    catalogItems: catalog.length,
    teachers: profiles.size,
    teachersWithPositives,
    nPositives,
    nSamples,
    canTrain: nSamples >= 8 && nPositives >= 2
  };
}

export function trainRecommender({ library = [], projects = [], events = [], seed = 42 }) {
  // 1. TF-IDF sobre o corpus
  const catalog = buildCatalog(library, projects);
  const corpus = catalog.map(itemToSearchText).filter(Boolean);
  const tfidfModel = fitTfidf(corpus, TFIDF_OPTS);

  // 2. perfis + pares rotulados
  const catalogById = new Map(catalog.map((it) => [it.id, it]));
  const profiles = buildTeacherProfiles(events, projects, catalogById);
  const { X, y, groups, popularity } = assembleSamples({
    profiles,
    catalog,
    tfidfModel,
    negRatio: NEG_RATIO,
    seed
  });

  const nSamples = X.length;
  const nPositives = y.filter((v) => v === 1).length;

  if (nSamples < 8 || nPositives < 2 || nPositives === nSamples) {
    return {
      ok: false,
      reason: "dados insuficientes para treinar (poucos exemplos ou sem variação de rótulo)",
      nSamples,
      nPositives
    };
  }

  // 3. split + 4. padronização (estatísticas só do treino)
  const { train, test } = stratifiedSplit(y, groups, 0.2, seed);
  const trainMatrix = train.map((i) => X[i]);
  const standardizer = fitStandardizer(trainMatrix);
  const Xtrain = trainMatrix.map((row) => applyStandardizer(row, standardizer));
  const ytrain = train.map((i) => y[i]);

  // 5. treino
  const logreg = trainLogReg(Xtrain, ytrain, {
    epochs: 500,
    learningRate: 0.2,
    l2: 1e-3
  });

  // 6. avaliação
  const trainMetrics = evaluate(logreg, standardizer, X, y, groups, train);
  const testMetrics = evaluate(logreg, standardizer, X, y, groups, test);

  const weightsByFeature = {};
  FEATURE_NAMES.forEach((name, i) => {
    weightsByFeature[name] = Number(logreg.w[i].toFixed(5));
  });

  const trainedAt = new Date().toISOString();

  return {
    ok: true,
    trainedAt,
    nSamples,
    nPositives,
    tfidfModel: {
      kind: "tfidf",
      params: { vocab: tfidfModel.vocab, idf: tfidfModel.idf, size: tfidfModel.size },
      feature_spec: { minDf: 2, maxFeatures: 800, corpusDocs: corpus.length },
      n_samples: corpus.length,
      trained_at: trainedAt
    },
    logregModel: {
      kind: "logreg_recommender",
      params: {
        w: logreg.w.map((v) => Number(v.toFixed(6))),
        b: Number(logreg.b.toFixed(6)),
        means: standardizer.means.map((v) => Number(v.toFixed(6))),
        stds: standardizer.stds.map((v) => Number(v.toFixed(6))),
        featureNames: FEATURE_NAMES,
        popularity: Object.fromEntries(popularity.counts),
        popularityMax: popularity.max,
        hyperparams: { epochs: logreg.epochs, learningRate: logreg.learningRate, l2: logreg.l2 }
      },
      feature_spec: { features: FEATURE_NAMES, negRatio: 3, testFrac: 0.2, seed },
      n_samples: nSamples,
      trained_at: trainedAt
    },
    metrics: {
      trainedAt,
      nSamples,
      nPositives,
      nTeachers: profiles.size,
      features: FEATURE_NAMES,
      weightsByFeature,
      lossCurve: logreg.lossCurve,
      epochs: logreg.epochs,
      train: trainMetrics,
      test: testMetrics
    }
  };
}
