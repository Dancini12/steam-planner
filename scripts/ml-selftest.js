// ============================================================
// ml-selftest.js
// Auto-teste da matemática de ML implementada do zero
// (supabase/functions/_shared/ml/*.js). Sem framework: gera
// dados sintéticos com resposta conhecida e verifica se os
// algoritmos aprendem/generalizam. Sai com código !=0 em
// qualquer regressão — serve de "teste de unidade" no CI.
// ============================================================

import { makeRng } from "../supabase/functions/_shared/ml/random.js";
import {
  fitStandardizer,
  applyStandardizer,
  cosine
} from "../supabase/functions/_shared/ml/linalg.js";
import { trainLogReg, predictProbaLogReg } from "../supabase/functions/_shared/ml/logreg.js";
import {
  classificationReport,
  rocAuc,
  logLoss,
  rankingMetricsAtK
} from "../supabase/functions/_shared/ml/metrics.js";
import { fitTfidf, transformTfidf } from "../supabase/functions/_shared/ml/tfidf.js";

let failures = 0;
function check(name, condition, detail) {
  const status = condition ? "PASS" : "FAIL";
  if (!condition) failures += 1;
  console.log(`[${status}] ${name}${detail ? ` — ${detail}` : ""}`);
}

// ------------------------------------------------------------
// 1. Regressão logística num problema linearmente separável
// ------------------------------------------------------------
function makeDataset(n, rng) {
  const X = [];
  const y = [];
  for (let i = 0; i < n; i += 1) {
    const x0 = rng() * 4 - 2;
    const x1 = rng() * 4 - 2;
    const x2 = rng() * 4 - 2;
    const noise = (rng() - 0.5) * 1.2;
    const logit = 2.0 * x0 - 1.3 * x1 + 0.7 * x2 + noise;
    X.push([x0, x1, x2, rng()]); // 4ª feature = ruído puro
    y.push(logit > 0 ? 1 : 0);
  }
  return { X, y };
}

{
  const rng = makeRng(7);
  const { X: Xtr, y: ytr } = makeDataset(400, rng);
  const { X: Xte, y: yte } = makeDataset(200, rng);

  const std = fitStandardizer(Xtr);
  const XtrS = Xtr.map((r) => applyStandardizer(r, std));
  const XteS = Xte.map((r) => applyStandardizer(r, std));

  const model = trainLogReg(XtrS, ytr, { epochs: 500, learningRate: 0.3, l2: 1e-4 });
  const proba = XteS.map((r) => predictProbaLogReg(model, r));

  const report = classificationReport(yte, proba, 0.5);
  const auc = rocAuc(yte, proba);
  const loss = logLoss(yte, proba);
  const lossDropped =
    model.lossCurve[0] - model.lossCurve[model.lossCurve.length - 1] > 0.05;

  check("logreg: perda cai durante o treino", lossDropped,
    `${model.lossCurve[0].toFixed(3)} → ${model.lossCurve.at(-1).toFixed(3)}`);
  check("logreg: ROC-AUC > 0.9 no teste", auc > 0.9, `AUC=${auc}`);
  check("logreg: acurácia > 0.85 no teste", report.accuracy > 0.85, `acc=${report.accuracy}`);
  check("logreg: log loss < 0.5 no teste", loss < 0.5, `logloss=${loss}`);
  check("logreg: feature de ruído recebe |peso| pequeno",
    Math.abs(model.w[3]) < Math.abs(model.w[0]),
    `|w_ruido|=${Math.abs(model.w[3]).toFixed(3)} vs |w0|=${Math.abs(model.w[0]).toFixed(3)}`);
}

// ------------------------------------------------------------
// 2. TF-IDF ajustado separa documentos por tema
// ------------------------------------------------------------
{
  const docsA = [
    "sensores arduino clima temperatura umidade dados",
    "arduino circuito eletronico sensor programacao dados clima",
    "estacao meteorologica sensores medicao temperatura registro"
  ];
  const docsB = [
    "teatro roteiro cena figurino ensaio expressao corporal",
    "artes visuais pintura colagem exposicao mostra cultural",
    "musica ritmo composicao performance palco publico"
  ];
  const model = fitTfidf([...docsA, ...docsB], { minDf: 1, maxFeatures: 200 });
  const vecs = [...docsA, ...docsB].map((d) => transformTfidf(model, d));

  const intra =
    (cosine(vecs[0], vecs[1]) + cosine(vecs[1], vecs[2]) + cosine(vecs[0], vecs[2]) +
      cosine(vecs[3], vecs[4]) + cosine(vecs[4], vecs[5]) + cosine(vecs[3], vecs[5])) / 6;
  const inter =
    (cosine(vecs[0], vecs[3]) + cosine(vecs[1], vecs[4]) + cosine(vecs[2], vecs[5])) / 3;

  check("tfidf: vocabulário não vazio", model.size > 5, `size=${model.size}`);
  check("tfidf: similaridade intra-tema > inter-tema",
    intra > inter + 0.1, `intra=${intra.toFixed(3)} inter=${inter.toFixed(3)}`);
}

// ------------------------------------------------------------
// 3. precision@k coerente
// ------------------------------------------------------------
{
  const rankings = [
    { scores: [0.9, 0.8, 0.7, 0.2, 0.1], relevantes: [true, true, false, false, true] },
    { scores: [0.6, 0.5, 0.4, 0.3], relevantes: [false, true, false, true] }
  ];
  const m = rankingMetricsAtK(rankings, 3);
  check("ranking: precision@3 em [0,1]", m.precisionAtK >= 0 && m.precisionAtK <= 1, JSON.stringify(m));
  check("ranking: MAP@3 > 0 com relevantes no topo", m.mapAtK > 0, `map=${m.mapAtK}`);
}

console.log(failures === 0 ? "\nOK — todos os testes de ML passaram." : `\n${failures} teste(s) de ML falharam.`);
process.exit(failures === 0 ? 0 : 1);
