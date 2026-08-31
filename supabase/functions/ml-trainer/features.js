// ============================================================
// features.js — engenharia de atributos do recomendador
// ============================================================
//
// Converte os dados brutos (projetos, eventos de comportamento,
// biblioteca) em pares (professor, item) com um vetor de
// atributos e um rótulo 0/1 ("o professor adotaria este item?").
//
// Atributos por par:
//   0 cos_tfidf          similaridade lexical perfil × item
//   1 overlap_steam      interseção de áreas STEAM
//   2 overlap_bncc       interseção de habilidades BNCC
//   3 match_grade        série em comum (0/1)
//   4 match_discipline   disciplina em comum (0/1)
//   5 popularity         adoções globais do item (normalizado)
//   6 profile_strength   ln(1 + nº de itens já adotados)
// ============================================================

import { cosine, normalizeL2 } from "../_shared/ml/linalg.js";
import { transformTfidf } from "../_shared/ml/tfidf.js";
import { makeRng, shuffled } from "../_shared/ml/random.js";

export const FEATURE_NAMES = [
  "cos_tfidf",
  "overlap_steam",
  "overlap_bncc",
  "match_grade",
  "match_discipline",
  "popularity",
  "profile_strength"
];

// Eventos que indicam "o professor adotou / valorizou" um item.
// Os nomes batem com os usados em src/lib/analytics.js (trackEvent)
// e src/lib/machine-learning/.../behaviorTracker.js.
export const POSITIVE_EVENTS = new Set([
  "activity_generated",
  "classroom_activity_generated",
  "library_model_used",
  "report_exported",
  "activity_printed",
  "project_created",
  "activity_rated",
  "project_learned"
]);

const BNCC_DISCIPLINE = {
  CI: "ciencias",
  MA: "matematica",
  LP: "lingua portuguesa",
  LI: "lingua inglesa",
  GE: "geografia",
  HI: "historia",
  AR: "arte",
  EF: "educacao fisica",
  ER: "ensino religioso",
  CH: "ciencias humanas",
  CN: "ciencias da natureza",
  LG: "linguagens"
};

export function listText(value) {
  if (!value) return "";
  if (Array.isArray(value)) return value.map(listText).join(" ");
  if (typeof value === "object") return Object.values(value).map(listText).join(" ");
  return String(value);
}

// Texto representativo do item para o TF-IDF. Campos curtos e de
// alto sinal — evita `activityManual`/`stages` (texto longo) que
// inflava o custo de tokenização no Edge Runtime.
export function itemToSearchText(item = {}) {
  return [
    item.title,
    item.theme,
    item.problem,
    item.guidingQuestion,
    item.discipline,
    item.grade,
    listText(item.objectives),
    listText(item.bncc),
    listText(item.materials),
    listText(item.steam),
    listText(item.summary)
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 4000);
}

export function gradeYears(grade = "") {
  const years = new Set();
  const matches = String(grade).match(/\d/g) || [];
  for (const m of matches) years.add(m);
  return years;
}

export function disciplineOf(item = {}) {
  if (item.discipline) return String(item.discipline).toLowerCase().trim();
  const codes = Array.isArray(item.bncc) ? item.bncc : [];
  const tally = {};
  for (const code of codes) {
    const prefix = String(code).replace(/^EF\d{0,2}/i, "").slice(0, 2).toUpperCase();
    const name = BNCC_DISCIPLINE[prefix];
    if (name) tally[name] = (tally[name] || 0) + 1;
  }
  const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : "";
}

export function overlap(a = [], b = []) {
  const setA = new Set((a || []).map((v) => String(v).toLowerCase().trim()).filter(Boolean));
  const setB = new Set((b || []).map((v) => String(v).toLowerCase().trim()).filter(Boolean));
  if (!setA.size || !setB.size) return 0;
  let matches = 0;
  for (const v of setA) if (setB.has(v)) matches += 1;
  return matches / Math.max(setA.size, setB.size);
}

function eventItemId(event = {}) {
  const meta = event.metadata || {};
  return (
    meta.templateId ||
    meta.projectId ||
    meta.libraryId ||
    meta.id ||
    (event.entity_type === "project" ? event.entity_id : null) ||
    null
  );
}

function isPositive(event = {}) {
  if (!POSITIVE_EVENTS.has(event.event_type)) return false;
  if (event.event_type === "activity_rated") {
    return (event.metadata || {}).rating === "positive" || (event.metadata || {}).rating === 1;
  }
  return true;
}

// Constrói o catálogo (biblioteca + projetos dos usuários, sem
// duplicar por id) e a popularidade global de cada item.
export function buildCatalog(library = [], projects = []) {
  const byId = new Map();
  for (const item of library) {
    if (item && item.id) byId.set(item.id, { ...item, _source: "library" });
  }
  for (const row of projects) {
    const data = row.project_data || row;
    const id = row.id || data.id;
    if (!id || byId.has(id)) continue;
    byId.set(id, { ...data, id, _source: "project", _ownerId: row.owner_id || data.ownerId });
  }
  return [...byId.values()];
}

// Agrega o perfil de cada professor a partir dos eventos e dos
// projetos que ele mesmo criou.
export function buildTeacherProfiles(events = [], projects = [], catalogById) {
  const profiles = new Map();

  const ensure = (userId) => {
    if (!profiles.has(userId)) {
      profiles.set(userId, {
        userId,
        adoptedIds: new Set(),
        steam: [],
        bncc: [],
        grades: new Set(),
        disciplines: new Set(),
        eventCount: 0
      });
    }
    return profiles.get(userId);
  };

  for (const event of events) {
    const userId = event.user_id;
    if (!userId) continue;
    const profile = ensure(userId);
    profile.eventCount += 1;
    if (!isPositive(event)) continue;
    const itemId = eventItemId(event);
    if (itemId && catalogById.has(itemId)) profile.adoptedIds.add(itemId);
    const meta = event.metadata || {};
    if (Array.isArray(meta.steam)) profile.steam.push(...meta.steam);
    if (Array.isArray(meta.bncc)) profile.bncc.push(...meta.bncc);
    if (meta.grade) for (const y of gradeYears(meta.grade)) profile.grades.add(y);
    if (meta.discipline) profile.disciplines.add(String(meta.discipline).toLowerCase().trim());
  }

  for (const row of projects) {
    const data = row.project_data || row;
    const userId = row.owner_id || data.ownerId;
    if (!userId) continue;
    const profile = ensure(userId);
    const id = row.id || data.id;
    if (id && catalogById.has(id)) profile.adoptedIds.add(id);
    if (Array.isArray(data.steam)) profile.steam.push(...data.steam);
    if (Array.isArray(data.bncc)) profile.bncc.push(...data.bncc);
    for (const y of gradeYears(data.grade)) profile.grades.add(y);
    const disc = disciplineOf(data);
    if (disc) profile.disciplines.add(disc);
  }

  return profiles;
}

function popularityMap(profiles, catalog) {
  const counts = new Map();
  for (const profile of profiles.values()) {
    for (const id of profile.adoptedIds) counts.set(id, (counts.get(id) || 0) + 1);
  }
  let max = 1;
  for (const v of counts.values()) if (v > max) max = v;
  return { counts, max };
}

// Pré-computa o vetor TF-IDF de cada item do catálogo UMA vez —
// evita re-tokenizar textões a cada par (era o que estourava o
// Edge Runtime).
export function buildItemVectors(catalog, tfidfModel) {
  const map = new Map();
  for (const item of catalog) {
    map.set(item.id, transformTfidf(tfidfModel, itemToSearchText(item)));
  }
  return map;
}

// Vetor do perfil = média (L2-normalizada) dos vetores dos itens
// já adotados. Sem re-tokenização.
export function profileVector(adoptedIds, itemVecById, dim) {
  const acc = new Array(dim).fill(0);
  let n = 0;
  for (const id of adoptedIds) {
    const v = itemVecById.get(id);
    if (!v) continue;
    for (let i = 0; i < dim; i += 1) acc[i] += v[i];
    n += 1;
  }
  if (n === 0) return acc;
  for (let i = 0; i < dim; i += 1) acc[i] /= n;
  return normalizeL2(acc);
}

// Vetor de atributos de um par (perfil, item), usando vetores já
// prontos.
export function pairFeatures({ profile, profileVec, item, itemVec, popularity }) {
  const cos = profileVec && itemVec && profileVec.length ? cosine(profileVec, itemVec) : 0;
  const itemYears = [...gradeYears(item.grade)];
  const gradeMatch = itemYears.some((yr) => profile.grades.has(yr)) ? 1 : 0;
  const disciplineMatch = profile.disciplines.has(disciplineOf(item)) ? 1 : 0;
  const pop = (popularity.counts.get(item.id) || 0) / popularity.max;
  const strength = Math.log1p(profile.adoptedIds.size);

  return [
    cos,
    overlap(profile.steam, item.steam),
    overlap(profile.bncc, item.bncc),
    gradeMatch,
    disciplineMatch,
    pop,
    strength
  ];
}

const MAX_POSITIVES_PER_TEACHER = 60;

// Monta X, y e grupos (userId por linha) para treino/avaliação.
export function assembleSamples({ profiles, catalog, tfidfModel, negRatio = 3, seed = 42 }) {
  const catalogById = new Map(catalog.map((it) => [it.id, it]));
  const itemVecById = buildItemVectors(catalog, tfidfModel);
  const dim = tfidfModel.size;
  const popularity = popularityMap(profiles, catalog);
  const rng = makeRng(seed);

  const X = [];
  const y = [];
  const groups = [];

  for (const profile of profiles.values()) {
    let positives = [...profile.adoptedIds].filter((id) => catalogById.has(id));
    if (!positives.length) continue;
    if (positives.length > MAX_POSITIVES_PER_TEACHER) {
      positives = shuffled(positives, rng).slice(0, MAX_POSITIVES_PER_TEACHER);
    }

    const pVec = profileVector(profile.adoptedIds, itemVecById, dim);
    const negativePool = shuffled(
      catalog.filter((it) => !profile.adoptedIds.has(it.id)),
      rng
    ).slice(0, Math.max(negRatio * positives.length, negRatio));

    for (const id of positives) {
      X.push(
        pairFeatures({
          profile,
          profileVec: pVec,
          item: catalogById.get(id),
          itemVec: itemVecById.get(id),
          popularity
        })
      );
      y.push(1);
      groups.push(profile.userId);
    }
    for (const item of negativePool) {
      X.push(
        pairFeatures({
          profile,
          profileVec: pVec,
          item,
          itemVec: itemVecById.get(item.id),
          popularity
        })
      );
      y.push(0);
      groups.push(profile.userId);
    }
  }

  return { X, y, groups, popularity, catalogById };
}
