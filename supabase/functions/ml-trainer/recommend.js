// ============================================================
// recommend.js — inferência: rankeia a biblioteca para um professor
// ============================================================
//
// Usa os modelos ativos (TF-IDF + regressão logística) para
// estimar P(adoção) de cada projeto da biblioteca por um
// professor, dado o histórico dele e um contexto opcional
// (série/disciplina/tema da atividade que está criando).
// ============================================================

import { applyStandardizer } from "../_shared/ml/linalg.js";
import { predictProbaLogReg } from "../_shared/ml/logreg.js";
import {
  buildCatalog,
  buildTeacherProfiles,
  pairFeatures,
  gradeYears,
  disciplineOf
} from "./features.js";

function reasonFor(features, item) {
  const [cos, steam, bncc, grade, discipline] = features;
  const bits = [];
  if (grade) bits.push("mesma série que você costuma trabalhar");
  if (discipline) bits.push("mesma disciplina");
  if (steam >= 0.34) bits.push("áreas STEAM parecidas");
  if (bncc >= 0.34) bits.push("habilidades BNCC em comum");
  if (!bits.length && cos >= 0.15) bits.push("tema próximo do seu histórico");
  return bits.length
    ? `Recomendado por ${bits.slice(0, 2).join(" e ")}.`
    : "Sugestão para ampliar seu repertório.";
}

export function recommendForTeacher({
  userId,
  context = {},
  library = [],
  projects = [],
  events = [],
  tfidfParams,
  logregParams,
  limit = 6
}) {
  const tfidfModel = {
    vocab: tfidfParams.vocab,
    idf: tfidfParams.idf,
    size: tfidfParams.size
  };
  const model = { w: logregParams.w, b: logregParams.b };
  const standardizer = { means: logregParams.means, stds: logregParams.stds };
  const popularity = {
    counts: new Map(Object.entries(logregParams.popularity || {})),
    max: logregParams.popularityMax || 1
  };

  const catalog = buildCatalog(library, projects);
  const catalogById = new Map(catalog.map((it) => [it.id, it]));
  const profiles = buildTeacherProfiles(events, projects, catalogById);

  const profile = profiles.get(userId) || {
    userId,
    adoptedIds: new Set(),
    steam: [],
    bncc: [],
    grades: new Set(),
    disciplines: new Set(),
    eventCount: 0
  };

  // Injeta o contexto atual (o que o professor está criando agora)
  // como sinal de perfil, importante no cold start.
  if (Array.isArray(context.steam)) profile.steam = [...profile.steam, ...context.steam];
  if (Array.isArray(context.bncc)) profile.bncc = [...profile.bncc, ...context.bncc];
  if (context.grade) for (const y of gradeYears(context.grade)) profile.grades.add(y);
  if (context.discipline) {
    profile.disciplines.add(String(context.discipline).toLowerCase().trim());
  }

  const scored = library
    .filter((item) => item && item.id && !profile.adoptedIds.has(item.id))
    .map((item) => {
      const features = pairFeatures({
        profile,
        item,
        tfidfModel,
        popularity,
        catalogById,
        excludeId: null
      });
      const score = predictProbaLogReg(model, applyStandardizer(features, standardizer));
      return { item, score: Number(score.toFixed(4)), reason: reasonFor(features, item) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ item, score, reason }) => ({
    id: item.id,
    title: item.title,
    theme: item.theme,
    grade: item.grade,
    steam: item.steam || [],
    bncc: item.bncc || [],
    discipline: disciplineOf(item),
    score,
    reason
  }));
}
