import { normalizeText, tokenizeText } from "../embeddings/textVectorizer.js";

function increment(map, key, amount = 1) {
  const normalized = normalizeText(key);
  if (!normalized) return;
  map[normalized] = (map[normalized] || 0) + amount;
}

function topEntries(map, limit = 8) {
  return Object.entries(map)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

export function buildUserLearningProfile({ events = [], projects = [] } = {}) {
  const disciplines = {};
  const grades = {};
  const themes = {};
  const steamAreas = {};
  const bncc = {};
  const actions = {};

  events.forEach((event) => {
    increment(actions, event.event_type || event.type);
    const metadata = event.metadata || {};
    increment(disciplines, metadata.discipline);
    increment(grades, metadata.grade);
    increment(themes, metadata.theme);
    (metadata.steam || metadata.steamAreas || []).forEach((area) => increment(steamAreas, area));
    (metadata.bncc || metadata.competencies || []).forEach((code) => increment(bncc, code));
    tokenizeText(metadata.query || "").forEach((token) => increment(themes, token, 0.5));
  });

  projects.forEach((project) => {
    increment(disciplines, project.discipline);
    increment(grades, project.grade);
    increment(themes, project.theme || project.title);
    (project.steam || []).forEach((area) => increment(steamAreas, area));
    (project.bncc || []).forEach((code) => increment(bncc, code));
  });

  return {
    updatedAt: new Date().toISOString(),
    topDisciplines: topEntries(disciplines),
    topGrades: topEntries(grades),
    topThemes: topEntries(themes, 12),
    topSteamAreas: topEntries(steamAreas),
    topBncc: topEntries(bncc, 12),
    actionFrequency: topEntries(actions, 20)
  };
}

export function getProfileKeywords(profile = {}) {
  return [
    ...(profile.topThemes || []).map((item) => item.value),
    ...(profile.topDisciplines || []).map((item) => item.value),
    ...(profile.topSteamAreas || []).map((item) => item.value),
    ...(profile.topBncc || []).map((item) => item.value)
  ].filter(Boolean);
}
