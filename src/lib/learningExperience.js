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

const ASSEMBLY_STEP_TITLES = [
  "ETAPA 1 - Preparar a base",
  "ETAPA 2 - Construir as partes principais",
  "ETAPA 3 - Criar o mecanismo de interação",
  "ETAPA 4 - Simular uma situação real",
  "ETAPA 5 - Ajustar e melhorar"
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
  materialFunction: 145,
  assemblyStep: 420,
  assemblyStepTight: 300,
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

export function getPracticalAssemblyStepTitles() {
  return [...ASSEMBLY_STEP_TITLES];
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

function getMaterialName(material) {
  return cleanText(material).split(/\s[-–—]\s/)[0].trim();
}

function buildDefaultMaterialFunctions(materials) {
  const roles = [
    "base ou superfície principal do protótipo",
    "fixação das partes e reforço da estrutura",
    "recorte, dobra ou separação das peças móveis",
    "marcação de medidas, valores, setas, legenda e registro do teste",
    "controle do tempo, comparação ou simulação do funcionamento",
    "peça extra para ajustes, acabamento ou melhoria após o teste"
  ];

  return materials.map((material, index) => {
    const materialName = getMaterialName(material) || `Material ${index + 1}`;
    return `${materialName}: use como ${roles[index] || "parte funcional do protótipo"}.`;
  });
}

function materialNamesForText(materials) {
  const names = materials.map(getMaterialName).filter(Boolean).slice(0, 4);
  if (!names.length) return "os materiais listados";
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;
}

function buildDefaultAssemblyDescriptions(theme, materials) {
  const cleanTheme = cleanText(theme || "problema investigado").toLowerCase();
  const materialText = materialNamesForText(materials);

  return [
    `Escolha o material mais rígido, como cartolina ou papelão, para formar a base. Marque nela o espaço do problema, a área da solução e o local onde os testes serão registrados.`,
    `Monte as partes principais usando ${materialText}. Separe a estrutura fixa, as peças móveis e a área de registro; cada parte deve mostrar uma decisão da solução.`,
    `Crie uma forma de interação: cartões que mudam de lugar, abas que abrem, setas que indicam fluxo, peças que deslizam ou uma simulação digital simples. O protótipo deve permitir manipular a solução, não apenas observá-la.`,
    `Teste o protótipo com um cenário real sobre ${cleanTheme}. A equipe deve executar pelo menos dois testes: um caso esperado e uma situação-problema com restrição, falha ou imprevisto.`,
    `Compare o resultado com os critérios definidos. Identifique uma falha visível, ajuste material, posição, medida, regra ou comunicação visual e repita o teste para verificar a melhoria.`
  ];
}

function isGenericAssemblyText(text) {
  const cleaned = cleanText(text).toLowerCase();
  if (!cleaned) return true;
  if (cleaned.split(/\s+/).length < 14) return true;

  return [
    "construa um modelo interativo",
    "faça um protótipo",
    "use os materiais disponíveis",
    "teste a solução",
    "melhore o projeto",
    "monte o protótipo",
    "desenvolva a solução"
  ].some((phrase) => cleaned === phrase || cleaned.includes(`${phrase}.`));
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

function normalizeAssemblySteps(activity, materials, theme, compact = false) {
  const candidates = Array.isArray(activity.assemblySteps)
    ? activity.assemblySteps
    : Array.isArray(activity.practicalAssembly?.steps)
      ? activity.practicalAssembly.steps
      : Array.isArray(activity.assemblyGuide)
        ? activity.assemblyGuide
        : [];
  const defaultDescriptions = buildDefaultAssemblyDescriptions(theme, materials);
  const maxChars = compact ? LIMITS.assemblyStepTight : LIMITS.assemblyStep;

  return ASSEMBLY_STEP_TITLES.map((requiredTitle, index) => {
    const step = candidates[index] || {};
    const rawDescription =
      typeof step === "string"
        ? step
        : getFirstText(step.description, step.instruction, step.action, step.text);
    const description = isGenericAssemblyText(rawDescription)
      ? defaultDescriptions[index]
      : rawDescription;

    return {
      number: index + 1,
      title: requiredTitle,
      description: limitText(description, maxChars)
    };
  });
}

function buildActivityManual(stages, assemblySteps) {
  const stageText = stages
    .map((stage) => `${stage.title}\n${stage.description}`)
    .join("\n\n");
  const assemblyText = assemblySteps
    .map((step) => `${step.title}\n${step.description}`)
    .join("\n\n");

  return `${stageText}\n\nCOMO MONTAR A ATIVIDADE NA PRÁTICA\n${assemblyText}`;
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
    ...(activity.materialFunctions || []),
    ...(activity.stages || []).map((stage) => `${stage.title} ${stage.description}`),
    ...(activity.assemblySteps || []).map((step) => `${step.title} ${step.description}`)
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
  let assemblySteps = normalizeAssemblySteps(activity, materials, theme);
  const sourceMaterialFunctions = toTextArray(activity.materialFunctions);
  const materialFunctions = compactArray(
    sourceMaterialFunctions.length >= materials.length ? sourceMaterialFunctions : [],
    materials.length || 6,
    LIMITS.materialFunction,
    buildDefaultMaterialFunctions(materials)
  );

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
    materialFunctions,
    stages,
    developmentStages: stages,
    assemblySteps,
    practicalAssembly: {
      title: "COMO MONTAR A ATIVIDADE NA PRÁTICA",
      steps: assemblySteps
    },
    makerChallenge,
    finalProduct,
    assessment,
    bibliography,
    summary: buildSummary({ problem, mission, finalProduct }),
    activityManual: buildActivityManual(stages, assemblySteps),
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
    assemblySteps = normalizeAssemblySteps(activity, materials, theme, true);
    normalized = {
      ...normalized,
      problem: limitText(problem, 280),
      mission: limitText(mission, 150),
      stages,
      developmentStages: stages,
      materialFunctions: materialFunctions.map((item) => limitText(item, 110)),
      assemblySteps,
      practicalAssembly: {
        title: "COMO MONTAR A ATIVIDADE NA PRÁTICA",
        steps: assemblySteps
      },
      makerChallenge: limitText(makerChallenge, 250),
      finalProduct: limitText(finalProduct, 180),
      assessment: assessment.slice(0, 3).map((item) => limitText(item, 90)),
      bibliography: bibliography.slice(0, 2).map((item) => limitText(item, 160)),
      activityManual: buildActivityManual(stages, assemblySteps),
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
    ...(activity.materialFunctions || []),
    ...(activity.stages || []).map((stage) => stage.description || "")
      .concat((activity.assemblySteps || []).map((step) => step.description || ""))
  ]
    .join(" ")
    .toLowerCase();

  const missing = [];
  if (!activity.title) missing.push("título");
  if (!activity.objective && !(activity.objectives || []).length) missing.push("objetivo geral");
  if (!activity.problem) missing.push("problema/desafio");
  if (!activity.mission) missing.push("missão");
  if (!(activity.materials || []).length) missing.push("materiais");
  if (!(activity.materialFunctions || []).length) missing.push("função dos materiais");
  if ((activity.stages || []).length !== 6) missing.push("6 etapas obrigatórias");
  if ((activity.assemblySteps || []).length !== 5) missing.push("como montar na prática");
  if (!/investig/.test(text)) missing.push("investigação");
  if (!/constru|mont|cria|prototip/.test(text)) missing.push("construção/prototipagem");
  if (!/test/.test(text)) missing.push("teste prático");
  if (!/melhor|ajust|redesign|modific/.test(text)) missing.push("melhoria/redesign");
  if (!/base/.test(text)) missing.push("preparo da base");
  if (!/simula|cen[aá]rio|situa[cç][aã]o real/.test(text)) missing.push("simulação real");
  if (!activity.makerChallenge) missing.push("desafio maker");
  if (!activity.finalProduct) missing.push("produto final");
  if (!(activity.assessment || []).length) missing.push("avaliação");
  if (!(activity.bibliography || []).length) missing.push("referência");

  return {
    valid: missing.length === 0,
    missing
  };
}
