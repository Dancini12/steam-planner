// ============================================================
// logreg.js — Regressão Logística treinada do zero
// ============================================================
//
// Classificador binário linear. Hipótese:
//     p = sigmoid(w · x + b)
// Perda: entropia cruzada binária (log loss) com regularização
// L2 nos pesos. Otimização: gradiente descendente em lote
// (batch), com taxa de aprendizado fixa.
//
// Isto é ML de fato: há parâmetros (w, b) APRENDIDOS a partir
// dos dados minimizando uma função de perda — diferente da soma
// ponderada com pesos escolhidos à mão que existia antes.
// ============================================================

import { dot } from "./linalg.js";

export function sigmoid(z) {
  if (z >= 0) {
    const e = Math.exp(-z);
    return 1 / (1 + e);
  }
  const e = Math.exp(z);
  return e / (1 + e);
}

// X: number[n][d] já padronizado. y: 0|1[n].
export function trainLogReg(
  X,
  y,
  { epochs = 400, learningRate = 0.1, l2 = 1e-3 } = {}
) {
  const n = X.length;
  const d = n ? X[0].length : 0;
  const w = new Array(d).fill(0);
  let b = 0;
  const lossCurve = [];

  for (let epoch = 0; epoch < epochs; epoch += 1) {
    const gradW = new Array(d).fill(0);
    let gradB = 0;
    let loss = 0;

    for (let i = 0; i < n; i += 1) {
      const p = sigmoid(dot(w, X[i]) + b);
      const error = p - y[i];
      for (let j = 0; j < d; j += 1) gradW[j] += error * X[i][j];
      gradB += error;

      const eps = 1e-12;
      loss += -(y[i] * Math.log(p + eps) + (1 - y[i]) * Math.log(1 - p + eps));
    }

    let reg = 0;
    for (let j = 0; j < d; j += 1) reg += w[j] * w[j];
    loss = loss / Math.max(n, 1) + (l2 / 2) * reg;
    lossCurve.push(Number(loss.toFixed(6)));

    for (let j = 0; j < d; j += 1) {
      w[j] -= learningRate * (gradW[j] / Math.max(n, 1) + l2 * w[j]);
    }
    b -= learningRate * (gradB / Math.max(n, 1));
  }

  return { w, b, lossCurve, epochs, learningRate, l2 };
}

export function predictProbaLogReg(model, x) {
  return sigmoid(dot(model.w, x) + model.b);
}
