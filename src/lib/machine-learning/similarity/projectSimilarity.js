import { cosineSimilarity, createTextEmbedding, normalizeText } from "../embeddings/textVectorizer.js";

function listText(values) {
  if (!values) return "";
  if (Array.isArray(values)) return values.join(" ");
  if (typeof values === "object") return Object.values(values).map(listText).join(" ");
  return String(values);
}

function overlapScore(left = [], right = []) {
  const leftSet = new Set(left.map(normalizeText).filter(Boolean));
  const rightSet = new Set(right.map(normalizeText).filter(Boolean));
  if (!leftSet.size || !rightSet.size) return 0;
  const matches = [...leftSet].filter((item) => rightSet.has(item)).length;
  return matches / Math.max(leftSet.size, rightSet.size);
}

export function projectToSearchText(project = {}) {
  return [
    project.title,
    project.theme,
    project.problem,
    project.guidingQuestion,
    project.discipline,
    project.grade,
    listText(project.objectives),
    listText(project.bncc),
    listText(project.materials),
    listText(project.steam),
    listText(project.steamMatrix),
    listText(project.activityManual),
    listText(project.accessibility),
    listText(project.bibliography)
  ].filter(Boolean).join(" ");
}

export function buildProjectEmbedding(project = {}) {
  return createTextEmbedding(projectToSearchText(project));
}

export function scoreProjectSimilarity(reference = {}, candidate = {}) {
  const referenceEmbedding = buildProjectEmbedding(reference);
  const candidateEmbedding = buildProjectEmbedding(candidate);
  const textScore = cosineSimilarity(referenceEmbedding.values, candidateEmbedding.values);
  const steamScore = overlapScore(reference.steam || [], candidate.steam || []);
  const bnccScore = overlapScore(reference.bncc || [], candidate.bncc || []);
  const gradeScore = normalizeText(reference.grade) && normalizeText(reference.grade) === normalizeText(candidate.grade) ? 1 : 0;
  const disciplineScore =
    normalizeText(reference.discipline) && normalizeText(reference.discipline) === normalizeText(candidate.discipline) ? 1 : 0;

  return Number((
    textScore * 0.55 +
    steamScore * 0.15 +
    bnccScore * 0.15 +
    gradeScore * 0.08 +
    disciplineScore * 0.07
  ).toFixed(4));
}

export function rankSimilarProjects(reference = {}, candidates = [], limit = 5) {
  return candidates
    .filter((candidate) => candidate?.id !== reference?.id)
    .map((candidate) => ({
      project: candidate,
      score: scoreProjectSimilarity(reference, candidate)
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}
