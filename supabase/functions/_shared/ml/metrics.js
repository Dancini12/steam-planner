// ============================================================
// metrics.js — métricas de avaliação (do zero)
// ============================================================
//
// Protocolo de avaliação supervisionada: a partir de rótulos
// verdadeiros e das probabilidades previstas pelo modelo,
// calcula acurácia, precisão, recall, F1, ROC-AUC, log loss e
// matriz de confusão. Para o uso como ranking, precision@k,
// recall@k e MAP@k.
// ============================================================

export function confusionMatrix(yTrue, yPred) {
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  for (let i = 0; i < yTrue.length; i += 1) {
    if (yPred[i] === 1 && yTrue[i] === 1) tp += 1;
    else if (yPred[i] === 1 && yTrue[i] === 0) fp += 1;
    else if (yPred[i] === 0 && yTrue[i] === 0) tn += 1;
    else fn += 1;
  }
  return { tp, fp, tn, fn };
}

export function classificationReport(yTrue, yProba, threshold = 0.5) {
  const yPred = yProba.map((p) => (p >= threshold ? 1 : 0));
  const { tp, fp, tn, fn } = confusionMatrix(yTrue, yPred);
  const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
  const f1 =
    precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  const accuracy = (tp + tn) / Math.max(yTrue.length, 1);

  return {
    accuracy: round(accuracy),
    precision: round(precision),
    recall: round(recall),
    f1: round(f1),
    confusion: { tp, fp, tn, fn }
  };
}

// ROC-AUC via estatística de Mann–Whitney (probabilidade de um
// positivo aleatório receber score maior que um negativo).
export function rocAuc(yTrue, yScore) {
  const pos = [];
  const neg = [];
  for (let i = 0; i < yTrue.length; i += 1) {
    (yTrue[i] === 1 ? pos : neg).push(yScore[i]);
  }
  if (!pos.length || !neg.length) return 0.5;

  const order = yScore
    .map((s, i) => ({ s, y: yTrue[i] }))
    .sort((a, b) => a.s - b.s);

  // ranks médios (trata empates)
  const ranks = new Array(order.length);
  let i = 0;
  while (i < order.length) {
    let j = i;
    while (j < order.length - 1 && order[j + 1].s === order[i].s) j += 1;
    const avgRank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k += 1) ranks[k] = avgRank;
    i = j + 1;
  }

  let sumRankPos = 0;
  for (let k = 0; k < order.length; k += 1) {
    if (order[k].y === 1) sumRankPos += ranks[k];
  }
  const auc =
    (sumRankPos - (pos.length * (pos.length + 1)) / 2) / (pos.length * neg.length);
  return round(auc);
}

export function logLoss(yTrue, yProba) {
  const eps = 1e-12;
  let sum = 0;
  for (let i = 0; i < yTrue.length; i += 1) {
    const p = Math.min(Math.max(yProba[i], eps), 1 - eps);
    sum += -(yTrue[i] * Math.log(p) + (1 - yTrue[i]) * Math.log(1 - p));
  }
  return round(sum / Math.max(yTrue.length, 1));
}

// rankingsPorUsuario: [{ scores:number[], relevantes:boolean[] }]
export function rankingMetricsAtK(rankings, k = 5) {
  let precisionSum = 0;
  let recallSum = 0;
  let apSum = 0;
  let valid = 0;

  for (const { scores, relevantes } of rankings) {
    const totalRelevant = relevantes.filter(Boolean).length;
    if (totalRelevant === 0) continue;
    valid += 1;

    const order = scores
      .map((s, i) => ({ s, rel: relevantes[i] }))
      .sort((a, b) => b.s - a.s)
      .slice(0, k);

    const hits = order.filter((o) => o.rel).length;
    precisionSum += hits / k;
    recallSum += hits / totalRelevant;

    let running = 0;
    let ap = 0;
    order.forEach((o, idx) => {
      if (o.rel) {
        running += 1;
        ap += running / (idx + 1);
      }
    });
    apSum += ap / Math.min(totalRelevant, k);
  }

  if (valid === 0) return { precisionAtK: 0, recallAtK: 0, mapAtK: 0, k, users: 0 };
  return {
    precisionAtK: round(precisionSum / valid),
    recallAtK: round(recallSum / valid),
    mapAtK: round(apSum / valid),
    k,
    users: valid
  };
}

function round(v) {
  return Number(v.toFixed(4));
}
