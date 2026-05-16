const VECTOR_SIZE = 96;

const STOPWORDS = new Set([
  "ainda", "aluno", "alunos", "anos", "aos", "apos", "aquela", "aquele",
  "atividade", "atividades", "cada", "como", "com", "das", "dos", "de",
  "depois", "durante", "essa", "esse", "esta", "este", "para", "pela",
  "pelo", "por", "professor", "professora", "projeto", "projetos", "que",
  "sao", "sera", "serao", "sobre", "sua", "suas", "seu", "seus", "uma",
  "usar", "utilizar"
]);

export function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function tokenizeText(value = "") {
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function hashToken(token) {
  let hash = 2166136261;
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

export function createTextEmbedding(input = "") {
  const vector = Array(VECTOR_SIZE).fill(0);
  const frequencies = tokenizeText(input).reduce((acc, token) => {
    acc[token] = (acc[token] || 0) + 1;
    return acc;
  }, {});

  Object.entries(frequencies).forEach(([token, count]) => {
    const index = hashToken(token) % VECTOR_SIZE;
    vector[index] += 1 + Math.log(count);
  });

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;

  return {
    model: "local-hash-v1",
    dimensions: VECTOR_SIZE,
    values: vector.map((value) => Number((value / magnitude).toFixed(6)))
  };
}

export function cosineSimilarity(left = [], right = []) {
  const size = Math.min(left.length, right.length);
  if (!size) return 0;

  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < size; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] * left[index];
    rightMagnitude += right[index] * right[index];
  }

  if (!leftMagnitude || !rightMagnitude) return 0;
  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}
