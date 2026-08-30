// ============================================================
// random.js — gerador pseudoaleatório com semente
// ============================================================
//
// Reprodutibilidade é requisito de um experimento de ML: com a
// mesma semente, o mesmo split treino/teste e a mesma
// inicialização do k-means++ são obtidos. mulberry32 é um PRNG
// simples, rápido e determinístico (não criptográfico).
// ============================================================

export function makeRng(seed = 42) {
  let state = seed >>> 0;
  return function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Embaralha uma cópia do array (Fisher–Yates) usando o rng dado.
export function shuffled(array, rng) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
