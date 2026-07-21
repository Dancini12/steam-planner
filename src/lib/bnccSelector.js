import { bnccHabilidades } from "../data/bncc.js";

const DISCIPLINE_COMPONENT = {
  artes: "Arte",
  arte: "Arte",
  ciencias: "Ciências",
  ciencia: "Ciências",
  geografia: "Geografia",
  historia: "História",
  ingles: "Língua Inglesa",
  "lingua inglesa": "Língua Inglesa",
  "lingua portuguesa": "Língua Portuguesa",
  matematica: "Matemática"
};

const STEAM_TERMS = {
  science: "ciencia",
  technology: "tecnologia",
  engineering: "engenharia",
  arts: "artes",
  mathematics: "matematica",
  S: "ciencia",
  T: "tecnologia",
  E: "engenharia",
  A: "artes",
  M: "matematica"
};

function normalize(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getGradeLabel(grade = "") {
  const match = String(grade).match(/[6-9]º ano/i);
  return match ? match[0] : "";
}

function getDisciplineComponent(discipline = "") {
  return DISCIPLINE_COMPONENT[normalize(discipline)] || "";
}

function tokenize(value = "") {
  return normalize(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function habilidadeText(habilidade) {
  return normalize([
    habilidade.codigo,
    habilidade.descricao,
    habilidade.componente,
    habilidade.area,
    habilidade.unidade_tematica,
    habilidade.objeto_conhecimento,
    ...(habilidade.palavras_chave || []),
    ...(habilidade.temas_relacionados || []),
    ...(habilidade.steam_relacionado || [])
  ].join(" "));
}

function scoreHabilidade(habilidade, { component, themeTokens, steamTerms }) {
  const searchable = habilidadeText(habilidade);
  let score = 0;

  if (component && habilidade.componente === component) score += 8;
  if (habilidade.cultura_maker) score += 2;

  steamTerms.forEach((term) => {
    if ((habilidade.steam_relacionado || []).map(normalize).includes(term)) {
      score += 3;
    }
    if (searchable.includes(term)) score += 1;
  });

  themeTokens.forEach((token) => {
    if (searchable.includes(token)) score += 2;
  });

  return score;
}

export function selectBnccHabilidades({
  grade = "",
  discipline = "",
  theme = "",
  steamCompetencies = [],
  steamAreas = [],
  limit = 5
} = {}) {
  const ano = getGradeLabel(grade);
  const component = getDisciplineComponent(discipline);
  const themeTokens = tokenize(theme);
  const steamTerms = unique([...steamCompetencies, ...steamAreas].map((item) => STEAM_TERMS[item] || normalize(item)));

  const gradeMatches = bnccHabilidades.filter((habilidade) => {
    if (!ano) return true;
    return habilidade.ano.split(";").map((item) => item.trim()).includes(ano);
  });

  const primaryPool = component
    ? gradeMatches.filter((habilidade) => habilidade.componente === component)
    : [];
  const pool = primaryPool.length > 0 ? primaryPool : gradeMatches;

  return pool
    .map((habilidade) => ({
      habilidade,
      score: scoreHabilidade(habilidade, { component, themeTokens, steamTerms })
    }))
    .sort((a, b) => b.score - a.score || a.habilidade.codigo.localeCompare(b.habilidade.codigo))
    .slice(0, limit)
    .map(({ habilidade }) => ({
      codigo: habilidade.codigo,
      componente: habilidade.componente,
      descricao: habilidade.descricao
    }));
}

export function formatBnccSuggestions(habilidades = []) {
  if (!habilidades.length) return "(nenhuma habilidade encontrada no banco offline)";
  return habilidades
    .map((habilidade) => `- ${habilidade.codigo} (${habilidade.componente}): ${habilidade.descricao}`)
    .join("\n");
}

export function normalizeBnccCode(value = "") {
  const text = String(value || "").trim().toUpperCase();
  const match = text.match(/\b[A-Z]{2}\d{2}[A-Z]{2}\d{2}\b/);
  if (match) return match[0];
  return text.split(/[—-]/)[0].trim();
}

export function normalizeBnccCodes(values = []) {
  return unique(
    values
      .map(normalizeBnccCode)
      .filter(Boolean)
  );
}

export function getBnccCodes(habilidades = []) {
  return habilidades.map((habilidade) => habilidade.codigo);
}

export function getBnccResumo(codes = []) {
  return normalizeBnccCodes(codes)
    .map((codigo) => bnccHabilidades.find((habilidade) => habilidade.codigo === codigo))
    .filter(Boolean)
    .map((habilidade) => ({
      codigo: habilidade.codigo,
      componente: habilidade.componente,
      resumo: habilidade.descricao
    }));
}
