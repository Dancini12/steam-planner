const STAGE_TITLES = [
  "ETAPA 1 - Introdução rápida do desafio",
  "ETAPA 2 - Investigação do problema",
  "ETAPA 3 - Planejamento da solução",
  "ETAPA 4 - Construção do protótipo",
  "ETAPA 5 - Teste e melhoria",
  "ETAPA 6 - Apresentação final"
];

const DEFAULT_STAGE_DESCRIPTIONS = [
  "Apresente o problema real em uma frase. Mostre uma evidência curta e explique a missão da equipe.",
  "Os alunos observam dados, objetos ou exemplos do cotidiano. Registram hipóteses e critérios para a solução funcionar.",
  "Cada equipe esboça uma solução simples. Define materiais, papéis e como vai medir se o protótipo funcionou.",
  "Os alunos montam a primeira versão física, visual, digital ou estrutural. O professor circula e faz perguntas de decisão.",
  "As equipes testam, comparam resultados e anotam falhas. Ajustam pelo menos um ponto e testam novamente.",
  "Cada equipe apresenta produto, teste realizado, melhoria feita e próximo ajuste possível."
];

const DEFAULT_ASSESSMENT = [
  "A solução responde ao problema real.",
  "O protótipo foi construído, testado e melhorado.",
  "A equipe usou registros para justificar ajustes.",
  "A apresentação mostra evidências do teste."
];

const FALLBACK_REFERENCE =
  "BRASIL. Ministério da Educação. Base Nacional Comum Curricular. Brasília: MEC, 2018.";

const LIMITS = {
  title: 70,
  objective: 170,
  problem: 360,
  mission: 190,
  material: 90,
  stage: 300,
  stageTight: 220,
  makerChallenge: 320,
  finalProduct: 220,
  assessment: 110,
  reference: 190,
  maxChars: 5600
};

export const LEARNING_EXPERIENCE_SECTIONS = [
  "Título",
  "Objetivo geral curto",
  "Problema/desafio",
  "Materiais",
  "Desenvolvimento da atividade",
  "Desafio Maker",
  "Produto final",
  "Avaliação",
  "Referência do conteúdo utilizado"
];

export function getLearningExperienceStageTitles() {
  return [...STAGE_TITLES];
}

function cleanText(value) {
  if (value == null) return "";
  return String(value)
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/[\uFE0F\u200D]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .trim();
}

function limitText(value, maxChars) {
  const text = cleanText(value);
  if (text.length <= maxChars) return text;

  const slice = text.slice(0, maxChars + 1);
  const sentenceBreak = Math.max(
    slice.lastIndexOf("."),
    slice.lastIndexOf("?"),
    slice.lastIndexOf("!"),
    slice.lastIndexOf(";")
  );
  const wordBreak = slice.lastIndexOf(" ");
  const cutAt = sentenceBreak > maxChars * 0.55 ? sentenceBreak + 1 : wordBreak;

  return `${slice.slice(0, cutAt > 0 ? cutAt : maxChars).trim()}...`;
}

function toTextArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item?.text) return item.text;
        if (item?.description) return item.description;
        if (item?.criterion) return item.criterion;
        return "";
      })
      .map(cleanText)
      .filter(Boolean);
  }

  return cleanText(value)
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter(Boolean);
}

function compactArray(value, maxItems, maxChars, fallback = []) {
  const items = toTextArray(value).length ? toTextArray(value) : fallback;
  return items
    .slice(0, maxItems)
    .map((item) => limitText(item, maxChars))
    .filter(Boolean);
}

function getFirstText(...values) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const first = toTextArray(value)[0];
      if (first) return first;
      continue;
    }
    const text = cleanText(value);
    if (text) return text;
  }
  return "";
}

function buildDefaultProblem(theme) {
  const cleanTheme = cleanText(theme || "o tema estudado").toLowerCase();
  return `Como criar uma solução prática para um problema real relacionado a ${cleanTheme} na escola ou na comunidade?`;
}

function buildDefaultMission(theme) {
  const cleanTheme = cleanText(theme || "esse desafio");
  return `Sua equipe deverá investigar ${cleanTheme}, construir uma solução simples, testar e melhorar o resultado.`;
}

function buildDefaultProduct(theme) {
  const cleanTheme = cleanText(theme || "problema investigado").toLowerCase();
  return `Protótipo físico, visual ou digital que responda ao desafio sobre ${cleanTheme}, acompanhado de registro do teste e da melhoria feita.`;
}

function buildDefaultMakerChallenge(theme) {
  const cleanTheme = cleanText(theme || "problema").toLowerCase();
  return `Construir uma primeira solução para ${cleanTheme}, testar com critérios simples, registrar falhas e melhorar pelo menos um elemento antes da apresentação.`;
}

function normalizeStages(stages, compact = false) {
  const candidates = Array.isArray(stages) ? stages : [];
  const maxChars = compact ? LIMITS.stageTight : LIMITS.stage;

  return STAGE_TITLES.map((requiredTitle, index) => {
    const stage = candidates[index] || {};
    const rawDescription =
      typeof stage === "string"
        ? stage
        : getFirstText(stage.description, stage.action, stage.text, stage.procedure);

    return {
      number: index + 1,
      title: requiredTitle,
      description: limitText(rawDescription || DEFAULT_STAGE_DESCRIPTIONS[index], maxChars)
    };
  });
}

function buildActivityManual(stages) {
  return stages
    .map((stage) => `${stage.title}\n${stage.description}`)
    .join("\n\n");
}

function estimateContentChars(activity) {
  const pieces = [
    activity.title,
    activity.objective,
    activity.problem,
    activity.mission,
    activity.makerChallenge,
    activity.finalProduct,
    ...(activity.materials || []),
    ...(activity.assessment || []),
    ...(activity.bibliography || []),
    ...(activity.stages || []).map((stage) => `${stage.title} ${stage.description}`)
  ];

  return pieces.join(" ").length;
}

function buildSummary(activity) {
  return limitText(
    `${activity.problem} Missão: ${activity.mission} Produto final: ${activity.finalProduct}`,
    360
  );
}

export function normalizeLearningExperience(activity = {}, context = {}) {
  const theme = getFirstText(activity.theme, context.theme);
  const title = limitText(
    getFirstText(activity.title, activity.activityTitle) || `Desafio Maker: ${theme || "Solução prática"}`,
    LIMITS.title
  );

  const objective = limitText(
    getFirstText(activity.objective, activity.generalObjective, activity.objectives) ||
      "Investigar um problema real, construir uma solução, testar resultados e propor melhoria.",
    LIMITS.objective
  );

  const problem = limitText(
    getFirstText(activity.problem, activity.challenge, activity.situationProblem) || buildDefaultProblem(theme),
    LIMITS.problem
  );

  const mission = limitText(
    getFirstText(activity.mission) || buildDefaultMission(theme),
    LIMITS.mission
  );

  const materials = compactArray(activity.materials, 6, LIMITS.material, [
    "Materiais recicláveis ou de papelaria - quantidade por grupo",
    "Fita adesiva ou cola - 1 por grupo",
    "Tesoura sem ponta - 1 por grupo",
    "Régua, lápis e papel para registro",
    "Cronômetro ou celular do professor para teste"
  ]);

  const sourceStages = activity.developmentStages || activity.stages || activity.steps || [];
  let stages = normalizeStages(sourceStages);

  const makerChallenge = limitText(
    getFirstText(activity.makerChallenge, activity.investigativeChallenge, activity.guidingQuestion) ||
      buildDefaultMakerChallenge(theme),
    LIMITS.makerChallenge
  );

  const finalProduct = limitText(
    getFirstText(activity.finalProduct, activity.product, activity.productFinal) || buildDefaultProduct(theme),
    LIMITS.finalProduct
  );

  const assessment = compactArray(activity.assessment, 4, LIMITS.assessment, DEFAULT_ASSESSMENT);
  const bibliography = compactArray(
    activity.bibliography || activity.references,
    3,
    LIMITS.reference,
    [FALLBACK_REFERENCE]
  );

  let normalized = {
    ...activity,
    title,
    theme,
    objective,
    objectives: [objective],
    problem,
    mission,
    guidingQuestion: makerChallenge,
    materials,
    stages,
    developmentStages: stages,
    makerChallenge,
    finalProduct,
    assessment,
    bibliography,
    summary: buildSummary({ problem, mission, finalProduct }),
    activityManual: buildActivityManual(stages),
    priorKnowledge: [],
    vocabulary: [],
    safetyNotes: [],
    activityScaling: {},
    assemblyGuide: [],
    studentActivity: null
  };

  const originalChars = estimateContentChars(normalized);
  if (originalChars > LIMITS.maxChars) {
    stages = normalizeStages(sourceStages, true);
    normalized = {
      ...normalized,
      problem: limitText(problem, 280),
      mission: limitText(mission, 150),
      stages,
      developmentStages: stages,
      makerChallenge: limitText(makerChallenge, 250),
      finalProduct: limitText(finalProduct, 180),
      assessment: assessment.slice(0, 3).map((item) => limitText(item, 90)),
      bibliography: bibliography.slice(0, 2).map((item) => limitText(item, 160)),
      activityManual: buildActivityManual(stages),
      compactedForTwoPages: true,
      validatedForTwoPages: true
    };
    normalized.summary = buildSummary(normalized);
  } else {
    normalized.compactedForTwoPages = false;
    normalized.validatedForTwoPages = true;
  }

  return normalized;
}

export function validateLearningExperience(activity) {
  const text = [
    activity.problem,
    activity.mission,
    activity.makerChallenge,
    activity.finalProduct,
    activity.activityManual,
    ...(activity.stages || []).map((stage) => stage.description || "")
  ]
    .join(" ")
    .toLowerCase();

  const missing = [];
  if (!activity.title) missing.push("título");
  if (!activity.objective && !(activity.objectives || []).length) missing.push("objetivo geral");
  if (!activity.problem) missing.push("problema/desafio");
  if (!activity.mission) missing.push("missão");
  if (!(activity.materials || []).length) missing.push("materiais");
  if ((activity.stages || []).length !== 6) missing.push("6 etapas obrigatórias");
  if (!/investig/.test(text)) missing.push("investigação");
  if (!/constru|mont|cria|prototip/.test(text)) missing.push("construção/prototipagem");
  if (!/test/.test(text)) missing.push("teste prático");
  if (!/melhor|ajust|redesign|modific/.test(text)) missing.push("melhoria/redesign");
  if (!activity.makerChallenge) missing.push("desafio maker");
  if (!activity.finalProduct) missing.push("produto final");
  if (!(activity.assessment || []).length) missing.push("avaliação");
  if (!(activity.bibliography || []).length) missing.push("referência");

  return {
    valid: missing.length === 0,
    missing
  };
}
