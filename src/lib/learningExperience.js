const STAGE_TITLES = [
  "ETAPA 1 - Preparar a base e dividir materiais",
  "ETAPA 2 - Construir as partes principais",
  "ETAPA 3 - Criar o mecanismo de interação",
  "ETAPA 4 - Testar com situação real",
  "ETAPA 5 - Ajustar e testar novamente",
  "ETAPA 6 - Apresentar produto e evidências"
];

const DEFAULT_STAGE_DESCRIPTIONS = [
  "O professor entrega a missão e os materiais. A equipe usa a base mais rígida, divide áreas de problema, solução, teste e melhoria, e separa peças móveis.",
  "Os alunos montam as partes principais do protótipo. Cada peça deve ter função visível: entrada de dados, decisão, fluxo, medida, comparação ou registro.",
  "A equipe cria a interação com cartões, fichas, abas, setas, encaixes, escala, planilha ou simulação simples. O protótipo precisa ser manipulado durante o teste.",
  "Aplique o Cenário 1 e registre o resultado. Depois aplique o Cenário 2 ou 3 para comparar, observar falhas e medir se a solução funciona.",
  "A equipe identifica uma falha, muda material, regra, posição, medida ou comunicação visual e repete o teste. Registre o antes e o depois.",
  "Cada equipe apresenta o protótipo, o cenário testado, a falha encontrada, a melhoria feita e a evidência de que o ajuste funcionou."
];

const ASSEMBLY_STEP_TITLES = STAGE_TITLES;

const DEFAULT_ASSESSMENT = [
  "Protótipo | Representa o problema e pode ser testado?",
  "Teste | O grupo aplicou o cenário e registrou resultado?",
  "Melhoria | O grupo ajustou o protótipo após identificar falha?",
  "Comunicação | O grupo explicou solução, teste e melhoria?"
];

const FALLBACK_REFERENCE =
  "BRASIL. Ministério da Educação. Base Nacional Comum Curricular. Brasília: MEC, 2018.";
const FINANCIAL_REFERENCES = [
  "BANCO CENTRAL DO BRASIL. Caderno de educação financeira: gestão de finanças pessoais. Brasília: Banco Central do Brasil, 2013.",
  "BRASIL. Decreto nº 10.393, de 9 de junho de 2020. Institui a nova Estratégia Nacional de Educação Financeira - ENEF e o Fórum Brasileiro de Educação Financeira - FBEF. Diário Oficial da União: Brasília, DF, 10 jun. 2020."
];

const LIMITS = {
  title: 80,
  objective: 280,
  problem: 520,
  mission: 320,
  material: 120,
  stage: 440,
  stageTight: 380,
  materialFunction: 200,
  readyMaterial: 520,
  readyMaterialTight: 440,
  makerChallenge: 380,
  finalProduct: 300,
  assessment: 180,
  maxChars: 7000
};

export const LEARNING_EXPERIENCE_SECTIONS = [
  "Experiência de aprendizagem STEAM + Cultura Maker",
  "Objetivo geral",
  "Problema/desafio",
  "Materiais",
  "Desenvolvimento e montagem da atividade",
  "Desafio Maker",
  "Produto final",
  "Conexão STEAM + Maker",
  "Avaliação",
  "Referências",
  "Gabarito do professor"
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
    .replace(/&lt;\s*br\s*\/?\s*&gt;/gi, ". ")
    .replace(/&lt;[^&]+&gt;/gi, " ")
    .replace(/<\s*br\s*\/?\s*>/gi, ". ")
    .replace(/<\/\s*p\s*>/gi, ". ")
    .replace(/<\s*p[^>]*>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/[\uFE0F\u200D]/g, "")
    .replace(/\.{3,}|…/g, ".")
    .replace(/[Pp]ós-its?/g, "notas adesivas")
    .replace(/[Pp]ost-[Ii]ts?/g, "notas adesivas")
    .replace(/\b(tesouras?)(?!\s+sem\s+ponta)/gi, (m) => /s$/i.test(m) ? "Tesouras sem ponta" : "Tesoura sem ponta")
    .replace(/\*\*\*([^*]+)\*\*\*/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*\|.*\|\s*$/gm, "")
    .replace(/^\s*[-|: ]+\s*$/gm, "")
    .replace(/\s+([.!?,;:])/g, "$1")
    .replace(/([.!?])\s*([.!?])+/g, "$1")
    .replace(/[ \t]+/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .trim();
}

function finishSentence(text) {
  const cleaned = cleanText(text);
  if (!cleaned) return "";
  if (/[.!?:;)]$/.test(cleaned)) return cleaned;
  return `${cleaned}.`;
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

  let fragment = slice.slice(0, cutAt > 0 ? cutAt : maxChars).trimEnd();
  // Remove dangling conjunctions/prepositions to avoid "...e." or "...da."
  fragment = fragment.replace(/\s+(e|ou|de|da|do|dos|das|com|para|que|se|em|na|no|nas|nos|a|o|ao|por|pelo|pela|um|uma|mais|mas|nem|sobre|após|entre)$/i, "").trimEnd();
  return finishSentence(fragment);
}

function toTextArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item?.text) return item.text;
        if (item?.description) return item.description;
        if (item?.criterion) return item.criterion;
        if (item?.abnt) return item.abnt;
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

function isScenarioReadyMaterial(item) {
  return /^CEN[AÁ]RIO\s*\d*/i.test(cleanText(item));
}

function isTestTableReadyMaterial(item) {
  return /^TABELA\s+DE\s+TESTE/i.test(cleanText(item));
}

function groupReadyMaterialScenarios(value, fallback = []) {
  const sourceItems = toTextArray(value);
  const items = sourceItems.length ? sourceItems : fallback;
  const lines = items.flatMap((item) => cleanText(item)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean));
  const grouped = [];
  let currentScenario = null;

  const finishScenario = () => {
    if (currentScenario?.length) {
      grouped.push(currentScenario.join("\n"));
    }
    currentScenario = null;
  };

  lines.forEach((line) => {
    if (isScenarioReadyMaterial(line)) {
      finishScenario();
      currentScenario = [line];
      return;
    }

    if (isTestTableReadyMaterial(line)) {
      finishScenario();
      grouped.push(line);
      return;
    }

    if (currentScenario) {
      currentScenario.push(line);
      return;
    }

    grouped.push(line);
  });

  finishScenario();
  return grouped;
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

function inferMaterialQuantity(materialName, fallback = "1 por grupo") {
  const name = cleanText(materialName).toLowerCase();
  if (/cartolina|papel[-\s]?cart[aã]o|papel[aã]o|folha\s+a3|folha\s+a4/.test(name)) return "1 folha por grupo";
  if (/ficha|cart[aã]o|cartao|tarjeta/.test(name)) return "8 a 12 por grupo";
  if (/canetinha|marcador|l[aá]pis\s+colorido/.test(name)) return "1 conjunto por grupo";
  if (/nota[s]?\s+adesiva|adesivo/.test(name)) return "1 bloco por grupo";
  if (/tesoura/.test(name)) return "1 por grupo";
  if (/cola\s+bast[aã]o|cola branca|fita adesiva|fita crepe|r[eé]gua|trena|fita m[eé]trica/.test(name)) return "1 por grupo";
  return fallback;
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
    const full = cleanText(material);
    const qtyMatch = full.match(/[:\-–—]\s*(\d[\w\s]*?(?:por\s+grupo|por\s+equipe|para\s+a\s+turma|por\s+turma))/i);
    const materialName = getMaterialName(material) || `Material ${index + 1}`;
    const qty = inferMaterialQuantity(materialName, qtyMatch ? qtyMatch[1].trim() : "1 por grupo");
    const role = roles[index] || "parte funcional do protótipo";
    return `${materialName}: ${qty} — ${role}.`;
  });
}

function isBudgetTheme(theme) {
  return /or[cç]amento|financeir|renda|despesa|dinheiro|fam[ií]lia/.test(
    cleanText(theme).toLowerCase()
  );
}

function isFinancialReference(reference) {
  return /educa[cç][aã]o\s+financeira|finan[cç]as|financeir|or[cç]amento|renda|despesa|dinheiro|poupan[cç]a|investimento|banco\s+central|enef|ocde|oecd|matem[aá]tica\s+financeira|gest[aã]o\s+de\s+finan[cç]as/i.test(reference);
}

function isMethodologyReference(reference) {
  return /steam|maker|metodologias?\s+ativas?|aprendizagem\s+baseada\s+em\s+projetos?|project\s+based|cultura\s+maker|prototip|bncc|base\s+nacional\s+comum\s+curricular|common\s+european\s+framework|cefr|language|vocabulary/i.test(reference);
}

function sanitizeReferenceText(reference) {
  if (reference == null) return "";
  const source = String(reference)
    .replace(/&lt;\s*br\s*\/?\s*&gt;/gi, " ")
    .replace(/<\s*br\s*\/?\s*>/gi, " ")
    .replace(/&lt;\/?\s*p[^&]*&gt;/gi, " ")
    .replace(/<\/?\s*p[^>]*>/gi, " ");
  const cleaned = cleanText(source)
    .replace(/\s*[\uFFFE\uFFFF\uFFFD]+\s*/g, "-")
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/\b(?:doi\s*[:.]?\s*)?(10\.\d{4,9}\/[^\s,;]+)/gi, (_, doi) => {
      const safeDoi = doi
      .replace(/\s*[\uFFFE\uFFFF\uFFFD]+\s*/g, "-")
      .replace(/[\u200B\u200C\u200D\uFEFF]/g, "")
      .replace(/[\u0000-\u001F\u007F<>()[\]{}"']+/g, "")
      .replace(/[*_`]+/g, "")
      .replace(/\s+/g, "")
      .replace(/-{2,}/g, "-")
        .replace(/-+$/g, "")
        .replace(/[.,;:]+$/g, "");
      return /^10\.\d{4,9}\/\S+$/.test(safeDoi) ? `DOI: ${safeDoi}` : "";
    })
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  if (!cleaned) return "";
  return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`;
}

function buildDefaultReadyMaterials(theme) {
  const cleanTheme = cleanText(theme || "problema investigado").toLowerCase();

  if (isBudgetTheme(theme)) {
    return [
      "CENÁRIO 1 - Saldo positivo: renda R$ 3.500; aluguel R$ 900; alimentação R$ 800; transporte R$ 350; energia/água R$ 280; lazer R$ 200. Pergunta: quanto sobra?",
      "CENÁRIO 2 - Imprevisto: renda R$ 3.000; despesas fixas R$ 2.400; gasto médico R$ 600. Pergunta: ficou positivo ou negativo? O que ajustar?",
      "CENÁRIO 3 - Decisão: renda R$ 4.000; despesas R$ 3.200; celular R$ 1.200. Pergunta: comprar agora, parcelar ou adiar? Justifique.",
      "TABELA DE TESTE - Cenário | Receita Total | Despesas Fixas | Despesas Variáveis | Saldo Inicial | Melhoria Aplicada | Saldo Final Após Melhoria."
    ];
  }

  return [
    `CENÁRIO 1 - Funcionamento esperado: aplique o protótipo em uma situação comum de ${cleanTheme}. Registre resultado, medida ou decisão obtida.`,
    `CENÁRIO 2 - Imprevisto: retire um recurso, aumente a demanda ou crie uma restrição ligada a ${cleanTheme}. Compare com o primeiro teste.`,
    "CENÁRIO 3 - Decisão de melhoria: escolha uma falha observada, aplique uma mudança e teste novamente para verificar se houve avanço.",
    "TABELA DE TESTE - Cenário/Teste | Resultado Inicial | Falha Observada | Melhoria Aplicada | Resultado Após Melhoria."
  ];
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
    `Use cartolina, papelão ou folha como base. Divida em áreas: problema, solução, teste e melhoria; separe ${materialText} antes da montagem.`,
    `Monte as partes principais com ${materialText}. Defina a função de cada peça: entrada de dados, fluxo, decisão, medida, comparação ou registro.`,
    "Crie a interação com cartões, fichas, abas, setas, encaixes, escala, planilha ou simulação simples. O protótipo deve mudar quando o aluno aplica um cenário.",
    `Aplique os cenários prontos sobre ${cleanTheme}. Registre resultado, falha e comparação entre o teste esperado e o teste com imprevisto.`,
    "Ajuste uma falha concreta no material, regra, posição, medida ou comunicação visual. Repita o teste e registre o que melhorou.",
    "Apresente o protótipo final, o cenário usado, a falha encontrada, a melhoria feita e a evidência observada no novo teste."
  ];
}

function parseRubricItem(item) {
  if (!item) return null;
  if (typeof item === "object") {
    const criterion = cleanText(item.criterion || item.criteria || item.title || item.name);
    const observation = cleanText(item.observation || item.observe || item.description || item.text);
    if (criterion || observation) {
      return {
        criterion: criterion || "Critério",
        observation: finishSentence(observation || "Observar evidências do processo.")
      };
    }
  }

  const text = cleanText(item);
  if (!text) return null;
  const [criterion, ...rest] = text.split("|");
  if (rest.length) {
    return {
      criterion: cleanText(criterion),
      observation: finishSentence(rest.join("|"))
    };
  }
  const [beforeColon, ...afterColon] = text.split(":");
  if (afterColon.length) {
    return {
      criterion: cleanText(beforeColon),
      observation: finishSentence(afterColon.join(":"))
    };
  }
  return {
    criterion: text.split(/\s+/).slice(0, 3).join(" "),
    observation: finishSentence(text)
  };
}

function cleanCriterionName(value) {
  return cleanText(value).replace(/[.!?:;]+$/g, "").trim();
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

function normalizeStages(activity, materials, theme, compact = false) {
  const candidates = Array.isArray(activity.developmentAssemblySteps)
    ? activity.developmentAssemblySteps
    : Array.isArray(activity.assemblySteps)
      ? activity.assemblySteps
      : Array.isArray(activity.developmentStages)
        ? activity.developmentStages
        : Array.isArray(activity.stages)
          ? activity.stages
          : Array.isArray(activity.steps)
            ? activity.steps
            : [];
  const defaultDescriptions = buildDefaultAssemblyDescriptions(theme, materials);
  const maxChars = compact ? LIMITS.stageTight : LIMITS.stage;

  return STAGE_TITLES.map((requiredTitle, index) => {
    const stage = candidates[index] || {};
    const rawDescription =
      typeof stage === "string"
        ? stage
        : getFirstText(stage.description, stage.action, stage.text, stage.procedure);
    const description = isGenericAssemblyText(rawDescription)
      ? defaultDescriptions[index]
      : rawDescription;

    return {
      number: index + 1,
      title: requiredTitle,
      description: limitText(description || DEFAULT_STAGE_DESCRIPTIONS[index], maxChars)
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
  const maxChars = compact ? LIMITS.stageTight : LIMITS.stage;

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

function normalizeReadyMaterials(activity, theme, compact = false) {
  const source = activity.readyMaterials || activity.printableMaterials || activity.scenarios || activity.testScenarios;
  const fallback = buildDefaultReadyMaterials(theme);
  const maxChars = compact ? LIMITS.readyMaterialTight : LIMITS.readyMaterial;
  const groupedItems = groupReadyMaterialScenarios(source, fallback);
  const hasScenarios = groupedItems.some(isScenarioReadyMaterial);
  const maxItems = hasScenarios ? 6 : 4;
  const scenarioMaxChars = Math.max(maxChars, compact ? 1200 : 1400);

  return groupedItems
    .slice(0, maxItems)
    .map((item) => limitText(item, isScenarioReadyMaterial(item) ? scenarioMaxChars : maxChars))
    .filter(Boolean);
}

function normalizeAssessmentRubric(activity, compact = false) {
  const source = Array.isArray(activity.assessmentRubric) && activity.assessmentRubric.length
    ? activity.assessmentRubric
    : activity.assessment;
  const fallback = DEFAULT_ASSESSMENT.map(parseRubricItem).filter(Boolean);
  const items = Array.isArray(source)
    ? source.map(parseRubricItem).filter(Boolean)
    : toTextArray(source).map(parseRubricItem).filter(Boolean);
  const rubric = (items.length ? items : fallback).slice(0, 4);

  return rubric.map((item) => ({
    criterion: cleanCriterionName(limitText(item.criterion, 28)),
    observation: limitText(item.observation, compact ? 90 : LIMITS.assessment)
  }));
}

function normalizeReferences(value, compact = false, theme = "") {
  const references = toTextArray(value)
    .map(sanitizeReferenceText)
    .filter((item) => item && !/wikipedia/i.test(item));
  const budget = isBudgetTheme(theme);
  const aligned = references.filter((item) => (
    budget
      ? isFinancialReference(item) || /steam|maker|metodologias?\s+ativas?|aprendizagem\s+baseada\s+em\s+projetos?|project\s+based|cultura\s+maker|prototip/i.test(item)
      : isMethodologyReference(item) || cleanText(theme).split(/\s+/).some((token) => token.length >= 4 && item.toLowerCase().includes(token.toLowerCase()))
  ));
  const fallback = budget ? FINANCIAL_REFERENCES : [FALLBACK_REFERENCE];
  const selected = (aligned.length ? aligned : fallback).slice(0, 2);
  return selected.map((item) => finishSentence(item));
}

function normalizeTeacherOrientation(activity) {
  const source = activity.teacherOrientation || activity.teacherNote || activity.professorNote;
  if (!source) return "";
  return limitText(cleanText(source), 280);
}

function normalizeTeacherGabarito(activity) {
  const source = activity.teacherGabarito || activity.gabarito || activity.answerKey;
  if (!source) return [];
  // No limitText or slice — gabarito must never be truncated
  return toTextArray(source)
    .map((item) => cleanText(item))
    .filter(Boolean);
}

function normalizeSteamConnection(activity) {
  const sc = activity.steamConnection || {};
  const keys = ["science", "technology", "engineering", "art", "mathematics"];
  const result = {};
  for (const key of keys) {
    const value = cleanText(sc[key] || "");
    result[key] = value ? limitText(value, 140) : "";
  }
  return result;
}

function buildActivityManual(stages) {
  const stageText = stages
    .map((stage) => `${stage.title}\n${stage.description}`)
    .join("\n\n");

  return `DESENVOLVIMENTO E MONTAGEM DA ATIVIDADE\n${stageText}`;
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
    ...(activity.readyMaterials || []),
    ...(activity.bibliography || []),
    ...(activity.materialFunctions || []),
    ...(activity.assessmentRubric || []).map((item) => `${item.criterion} ${item.observation}`),
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

  let stages = normalizeStages(activity, materials, theme);
  let assemblySteps = stages;
  const sourceMaterialFunctions = toTextArray(activity.materialFunctions);
  const rawMaterialFunctions = compactArray(
    sourceMaterialFunctions.length >= materials.length ? sourceMaterialFunctions : [],
    materials.length || 6,
    LIMITS.materialFunction,
    buildDefaultMaterialFunctions(materials)
  );
  // Normalize separator: "qty, role" → "qty — role" for uniform display
  const materialFunctions = rawMaterialFunctions.map((item) =>
    item.replace(
      /(\d[^,—]*?(?:por\s+(?:grupo|turma|equipe)|para\s+a\s+turma)),\s+/gi,
      "$1 — "
    )
  );
  let readyMaterials = normalizeReadyMaterials(activity, theme);

  const makerChallenge = limitText(
    getFirstText(activity.makerChallenge, activity.investigativeChallenge, activity.guidingQuestion) ||
      buildDefaultMakerChallenge(theme),
    LIMITS.makerChallenge
  );

  const finalProduct = limitText(
    getFirstText(activity.finalProduct, activity.product, activity.productFinal) || buildDefaultProduct(theme),
    LIMITS.finalProduct
  );

  let assessmentRubric = normalizeAssessmentRubric(activity);
  let assessment = assessmentRubric.map((item) => `${item.criterion} | ${item.observation}`);
  let bibliography = normalizeReferences(activity.bibliography || activity.references, false, theme);
  const steamConnection = normalizeSteamConnection(activity);
  const teacherGabarito = normalizeTeacherGabarito(activity);
  const teacherOrientation = normalizeTeacherOrientation(activity);

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
    readyMaterials,
    stages,
    developmentStages: stages,
    developmentAssemblySteps: stages,
    assemblySteps,
    practicalAssembly: {
      title: "DESENVOLVIMENTO E MONTAGEM DA ATIVIDADE",
      steps: assemblySteps
    },
    makerChallenge,
    finalProduct,
    assessmentRubric,
    assessment,
    bibliography,
    steamConnection,
    teacherGabarito,
    teacherOrientation,
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
    stages = normalizeStages(activity, materials, theme, true);
    assemblySteps = stages;
    readyMaterials = normalizeReadyMaterials(activity, theme, true);
    assessmentRubric = normalizeAssessmentRubric(activity, true);
    assessment = assessmentRubric.map((item) => `${item.criterion} | ${item.observation}`);
    bibliography = normalizeReferences(activity.bibliography || activity.references, true, theme);
    normalized = {
      ...normalized,
      problem: limitText(problem, 460),
      mission: limitText(mission, 280),
      stages,
      developmentStages: stages,
      developmentAssemblySteps: stages,
      materialFunctions: materialFunctions.map((item) => limitText(item, 110)),
      readyMaterials,
      assemblySteps,
      practicalAssembly: {
        title: "DESENVOLVIMENTO E MONTAGEM DA ATIVIDADE",
        steps: assemblySteps
      },
      makerChallenge: limitText(makerChallenge, 250),
      finalProduct: limitText(finalProduct, 180),
      assessmentRubric,
      assessment,
      bibliography,
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
    ...(activity.materialFunctions || []),
    ...(activity.readyMaterials || []),
    ...(activity.assessmentRubric || []).map((item) => `${item.criterion || ""} ${item.observation || ""}`),
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
  if (!(activity.readyMaterials || []).length) missing.push("materiais prontos");
  if ((activity.stages || []).length !== 6) missing.push("6 etapas de desenvolvimento e montagem");
  if ((activity.assemblySteps || []).length !== 6) missing.push("passo a passo de montagem");
  if (!/constru|mont|cria|prototip/.test(text)) missing.push("construção/prototipagem");
  if (!/test/.test(text)) missing.push("teste prático");
  if (!/melhor|ajust|redesign|modific/.test(text)) missing.push("melhoria/redesign");
  if (!/base/.test(text)) missing.push("preparo da base");
  if (!/simula|cen[aá]rio|situa[cç][aã]o real/.test(text)) missing.push("simulação real");
  if (/\.{3,}|…/.test(text)) missing.push("texto truncado com reticências");
  if (!activity.makerChallenge) missing.push("desafio maker");
  if (!activity.finalProduct) missing.push("produto final");
  if (!(activity.assessmentRubric || []).length && !(activity.assessment || []).length) missing.push("avaliação");
  if (!(activity.bibliography || []).length) missing.push("referência");

  return {
    valid: missing.length === 0,
    missing
  };
}
