// ============================================================
// tfidf.js — Vetorizador TF-IDF com fase de ajuste (fit)
// ============================================================
//
// Diferente do "feature hashing" determinístico anterior, aqui
// há um passo de APRENDIZADO sobre o corpus: fitTfidf() aprende
// o vocabulário e o vetor IDF (inverse document frequency) a
// partir da coleção de documentos. transformTfidf() aplica esse
// modelo a um texto novo.
//
//   tf(t,d)   = freq. relativa do termo t no documento d
//   idf(t)    = ln( (1 + N) / (1 + df(t)) ) + 1     (suavizado)
//   tfidf     = tf * idf, com normalização L2 no fim
// ============================================================

import { normalizeL2 } from "./linalg.js";

// Lista de stopwords em português alinhada à do vetorizador
// heurístico legado (src/lib/machine-learning/embeddings/textVectorizer.js).
const STOPWORDS = new Set([
  "ainda", "aluno", "alunos", "anos", "aos", "apos", "aquela", "aquele",
  "atividade", "atividades", "cada", "como", "com", "das", "dos", "de",
  "depois", "durante", "essa", "esse", "esta", "este", "para", "pela",
  "pelo", "por", "professor", "professora", "projeto", "projetos", "que",
  "sao", "sera", "serao", "sobre", "sua", "suas", "seu", "seus", "uma",
  "usar", "utilizar", "the", "and", "com", "sem", "num", "numa"
]);

export function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function tokenize(value = "") {
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

// docs: string[]. Aprende vocabulário (df >= minDf, no máximo
// maxFeatures termos mais frequentes) e IDF.
export function fitTfidf(docs, { minDf = 2, maxFeatures = 800 } = {}) {
  const df = new Map();
  const tokenizedDocs = docs.map((doc) => {
    const tokens = tokenize(doc);
    const seen = new Set(tokens);
    for (const token of seen) df.set(token, (df.get(token) || 0) + 1);
    return tokens;
  });

  const n = docs.length;
  const kept = [...df.entries()]
    .filter(([, count]) => count >= Math.min(minDf, n))
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxFeatures);

  const vocab = {};
  const idf = [];
  kept.forEach(([token, count], index) => {
    vocab[token] = index;
    idf.push(Math.log((1 + n) / (1 + count)) + 1);
  });

  return { vocab, idf, size: idf.length, tokenizedDocs };
}

export function transformTfidf(model, text) {
  const { vocab, idf, size } = model;
  const vector = new Array(size).fill(0);
  const tokens = tokenize(text);
  if (!tokens.length || size === 0) return vector;

  const counts = new Map();
  for (const token of tokens) counts.set(token, (counts.get(token) || 0) + 1);

  for (const [token, count] of counts) {
    const idx = vocab[token];
    if (idx == null) continue;
    const tf = count / tokens.length;
    vector[idx] = tf * idf[idx];
  }

  return normalizeL2(vector);
}
