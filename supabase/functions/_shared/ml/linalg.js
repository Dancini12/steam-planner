// ============================================================
// linalg.js — operações vetoriais e padronização
// ============================================================
//
// Funções de álgebra linear em arrays JS puros. Sem
// dependências: é a base compartilhada pela regressão
// logística, pelo k-means e pelas métricas.
// ============================================================

export function dot(a, b) {
  let sum = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i += 1) sum += a[i] * b[i];
  return sum;
}

export function l2norm(a) {
  return Math.sqrt(dot(a, a));
}

export function normalizeL2(a) {
  const norm = l2norm(a) || 1;
  return a.map((v) => v / norm);
}

export function cosine(a, b) {
  const na = l2norm(a);
  const nb = l2norm(b);
  if (na === 0 || nb === 0) return 0;
  return dot(a, b) / (na * nb);
}

export function mean(values) {
  if (!values.length) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export function stddev(values, meanValue) {
  if (values.length < 2) return 0;
  const m = meanValue == null ? mean(values) : meanValue;
  const variance =
    values.reduce((s, v) => s + (v - m) * (v - m), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

// Aprende média/desvio por coluna e devolve a matriz padronizada
// (z-score). Guardamos means/stds no modelo para aplicar a mesma
// transformação na inferência.
export function fitStandardizer(matrix) {
  const rows = matrix.length;
  const cols = rows ? matrix[0].length : 0;
  const means = new Array(cols).fill(0);
  const stds = new Array(cols).fill(1);

  for (let c = 0; c < cols; c += 1) {
    const column = matrix.map((row) => row[c]);
    means[c] = mean(column);
    const sd = stddev(column, means[c]);
    stds[c] = sd < 1e-9 ? 1 : sd;
  }

  return { means, stds };
}

export function applyStandardizer(row, { means, stds }) {
  return row.map((v, c) => (v - means[c]) / stds[c]);
}
