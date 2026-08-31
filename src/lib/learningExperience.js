import {
  NEUTRAL_STAGE_TITLES,
  stageTitlesForModality,
  inferModality,
  buildAllowedSet,
  findForbiddenResources,
  normalize as normalizeToken
} from "./ai/generationContract.js";

const STAGE_TITLES = [
  "ETAPA 1 - Preparar a base e dividir materiais",
  "ETAPA 2 - Construir as partes principais",
  "ETAPA 3 - Criar o mecanismo de interação",
  "ETAPA 4 - Testar com situação real",
  "ETAPA 5 - Ajustar e testar novamente",
  "ETAPA 6 - Apresentar produto e evidências"
];

const DEFAULT_STAGE_DESCRIPTIONS = [
  "O professor entrega a missão e os materiais. A equipe escolhe a base mais adequada ao produto, divide áreas de problema, solução, teste e melhoria, e separa peças móveis.",
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

function buildDefaultMaterials(theme) {
  const cleanTheme = cleanText(theme).toLowerCase();

  if (isBudgetTheme(cleanTheme)) {
    return [
      "Fichas de receita e despesa - 12 a 18 por grupo",
      "Envelopes ou divisorias de papel - 4 por grupo",
      "Calculadora simples ou celular do professor - 1 por grupo",
      "Planilha impressa de orçamento - 1 por grupo",
      "Lapis, borracha e regua - 1 conjunto por grupo"
    ];
  }

  if (/mapa|territ[oó]rio|bairro|cidade|rota|clima|temperatura|ru[ií]do|cartografia/.test(cleanTheme)) {
    return [
      "Mapa impresso, croqui ou planta baixa - 1 por grupo",
      "Adesivos ou marcadores removiveis - 8 a 12 por grupo",
      "Barbante ou fita crepe - 1 por grupo",
      "Regua ou trena - 1 por grupo",
      "Planilha de coleta de dados - 1 por grupo"
    ];
  }

  if (/agua|solo|planta|filtro|decomposi[cç][aã]o|mistura|energia|calor|experimento|ambiente/.test(cleanTheme)) {
    return [
      "Recipiente transparente reaproveitado - 1 por grupo",
      "Amostras ou elementos de teste seguros - conforme disponibilidade",
      "Conta-gotas, copo medidor ou colher - 1 por grupo",
      "Filtro de cafe, tecido ou peneira - 1 por grupo",
      "Ficha de observacao e tabela de resultados - 1 por grupo"
    ];
  }

  if (/hist[oó]ria|mem[oó]ria|patrim[oô]nio|fonte|tempo|cultura|biografia/.test(cleanTheme)) {
    return [
      "Cartoes de fonte, personagem ou evento - 8 a 12 por grupo",
      "Barbante, pregadores ou fita crepe - 1 conjunto por grupo",
      "Imagens impressas ou registros autorizados - conforme disponibilidade",
      "Etiquetas adesivas ou marcadores - 1 conjunto por grupo",
      "Celular do professor para registro - 1 para a turma"
    ];
  }

  if (/rob[oó]tica|circuito|sensor|programa|algoritmo|tecnologia|digital/.test(cleanTheme)) {
    return [
      "Cartoes de comando ou componentes simulados - 8 a 12 por grupo",
      "LED, pilha ou material de circuito seguro - conforme disponibilidade",
      "Fios, conectores ou tiras de papel condutor simulado - 1 conjunto por grupo",
      "Fluxograma impresso ou quadro de sequencia - 1 por grupo",
      "Cronometro ou celular do professor - 1 para a turma"
    ];
  }

  return [
    "Suporte reaproveitado, bandeja ou superficie de teste - 1 por grupo",
    "Pecas moveis, marcadores ou objetos cotidianos - 8 a 12 por grupo",
    "Fita crepe, barbante ou prendedores - 1 conjunto por grupo",
    "Regua, lapis e ficha de registro - 1 conjunto por grupo",
    "Cronometro ou celular do professor para teste - 1 para a turma"
  ];
}

function isGenericCartolinaMaterial(material) {
  const text = cleanText(material).toLowerCase();
  return /\bcartolinas?\b/.test(text);
}

function hasDefaultStationeryBundle(materials) {
  const text = materials.join(" ").toLowerCase();
  return [
    /fichas?\s+de\s+papel|cart[oõ]es?|tarjetas?/.test(text),
    /canetinhas?|marcadores?|l[aá]pis\s+colorido/.test(text),
    /notas?\s+adesivas?/.test(text),
    /tesouras?\s+sem\s+ponta|cola\s+bast[aã]o|fita\s+adesiva/.test(text)
  ].filter(Boolean).length >= 2;
}

function diversifyDefaultMaterialBundle(materials, theme) {
  const cartolinaIndex = materials.findIndex(isGenericCartolinaMaterial);
  if (cartolinaIndex === -1 || !hasDefaultStationeryBundle(materials)) {
    return { materials, diversified: false };
  }

  const replacements = buildDefaultMaterials(theme);
  const replacement = replacements.find((item) => !/\bcartolinas?\b/i.test(item)) || replacements[0];
  const nextMaterials = [...materials];
  nextMaterials[cartolinaIndex] = replacement;
  return { materials: nextMaterials, diversified: true };
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
    `Escolha a base de acordo com o produto final: mesa de teste, caixa, bandeja, mapa impresso, folha de registro, planilha ou suporte reaproveitado. Divida problema, solução, teste e melhoria; separe ${materialText} antes da montagem.`,
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

function normalizeStages(activity, materials, theme, compact = false, stageTitles = null) {
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
  const titles = Array.isArray(stageTitles) && stageTitles.length === 6 ? stageTitles : STAGE_TITLES;

  return titles.map((requiredTitle, index) => {
    const stage = candidates[index] || {};
    const rawDescription =
      typeof stage === "string"
        ? stage
        : getFirstText(stage.description, stage.action, stage.text, stage.procedure);
    const description = isGenericAssemblyText(rawDescription)
      ? defaultDescriptions[index]
      : rawDescription;
    // Se o modelo trouxe um título próprio (adaptado à modalidade), respeita-o
    const modelTitle = typeof stage === "object" ? cleanText(stage.title) : "";

    return {
      number: index + 1,
      title: modelTitle && /etapa\s*\d/i.test(modelTitle) ? modelTitle : requiredTitle,
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

const GABARITO_TYPES = new Set(["calculo", "aberta", "maker", "reflexiva"]);

function normalizeTeacherGabarito(activity) {
  const source = activity.teacherGabarito || activity.gabarito || activity.answerKey;
  if (!source) return [];
  // Preserva o formato tipado { title, type, text }; nunca trunca.
  if (Array.isArray(source) && source.some((item) => item && typeof item === "object" && (item.text || item.content))) {
    return source
      .map((item) => {
        if (typeof item === "string") return { title: "", type: "aberta", text: cleanText(item) };
        const type = normalizeToken(item.type || "");
        return {
          title: cleanText(item.title || item.scenario || item.question || ""),
          type: GABARITO_TYPES.has(type) ? type : "aberta",
          text: cleanText(item.text || item.content || item.answer || item.description || "")
        };
      })
      .filter((item) => item.text);
  }
  return toTextArray(source)
    .map((item) => cleanText(item))
    .filter(Boolean)
    .map((text) => ({ title: "", type: "aberta", text }));
}

const STEAM_WEIGHTS = new Set(["predominante", "complementar", "nao_se_aplica"]);

function normalizeSteamConnection(activity) {
  const sc = activity.steamConnection || {};
  const keys = ["science", "technology", "engineering", "art", "mathematics"];
  const result = {};
  for (const key of keys) {
    const raw = sc[key];
    let text = "";
    let weight = "";
    if (raw && typeof raw === "object") {
      text = cleanText(raw.text || raw.description || "");
      weight = normalizeToken(raw.weight || "");
    } else {
      text = cleanText(raw || "");
    }
    if (!STEAM_WEIGHTS.has(weight)) weight = text ? "complementar" : "nao_se_aplica";
    // Não fabrica texto onde o modelo não colocou ação real
    result[key] = { text: text ? limitText(text, 160) : "", weight };
  }
  return result;
}

function normalizeTestTable(activity) {
  const tt = activity.testTable || activity.dataTable;
  if (tt && typeof tt === "object" && Array.isArray(tt.columns) && tt.columns.length) {
    return {
      columns: tt.columns.map((c) => cleanText(c)).filter(Boolean).slice(0, 8),
      rows: Array.isArray(tt.rows)
        ? tt.rows
            .map((row) => (Array.isArray(row) ? row.map((c) => cleanText(c)) : []))
            .filter((row) => row.length)
            .slice(0, 12)
        : []
    };
  }
  // Legado: procura "TABELA DE TESTE - a | b | c" dentro de readyMaterials
  const legacy = (toTextArray(activity.readyMaterials) || []).find((item) =>
    /^tabela de teste/i.test(item)
  );
  if (legacy) {
    const cols = legacy
      .replace(/^tabela de teste\s*[-:]\s*/i, "")
      .split("|")
      .map((c) => cleanText(c).replace(/\.$/, ""))
      .filter(Boolean);
    if (cols.length >= 2) return { columns: cols.slice(0, 8), rows: [] };
  }
  return null;
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

function applyMaterialConstraints(materials, constraints) {
  const list = constraints?.availableMaterialsList || [];
  if (!constraints?.strictMaterials || !list.length) return { materials, filtered: false };
  const allowedSet = buildAllowedSet(list);
  const kept = materials.filter((m) => {
    const toks = normalizeToken(m).split(/[^a-zçãõáéíóúâêô]+/).filter((t) => t.length >= 3);
    return toks.some((t) => allowedSet.has(t)) || findForbiddenResources(m, allowedSet).length === 0;
  });
  // Se sobrou pouco, usa a própria lista do professor como materiais
  const finalMaterials = kept.length >= Math.min(2, list.length)
    ? kept
    : list.map((m) => m);
  return { materials: finalMaterials, filtered: finalMaterials.length !== materials.length };
}

export function normalizeLearningExperience(activity = {}, context = {}) {
  const constraints = context.constraints || null;
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

  const strict = Boolean(constraints?.strictMaterials && (constraints.availableMaterialsList || []).length);
  const materialFallback = strict
    ? (constraints.availableMaterialsList || []).map((m) => `${m} - quantidade por grupo`)
    : buildDefaultMaterials(theme);
  const rawMaterials = compactArray(activity.materials, 6, LIMITS.material, materialFallback);
  const materialBundle = strict
    ? { materials: rawMaterials, diversified: false }
    : diversifyDefaultMaterialBundle(rawMaterials, theme);
  const constrained = applyMaterialConstraints(materialBundle.materials, constraints);
  const materials = constrained.materials;

  const modality =
    normalizeToken(activity.makerModality || "") ||
    inferModality({
      availableMaterials: constraints?.availableMaterials || "",
      activityText: `${theme} ${activity.objective || ""} ${activity.makerChallenge || ""} ${(activity.stages || [])
        .map((s) => (typeof s === "string" ? s : s.description))
        .join(" ")}`
    });
  const stageTitles = stageTitlesForModality(modality);

  let stages = normalizeStages(activity, materials, theme, false, stageTitles);
  let assemblySteps = stages;
  const sourceMaterialFunctions = materialBundle.diversified ? [] : toTextArray(activity.materialFunctions);
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
  const testTable = normalizeTestTable(activity);
  const dataPlan = activity.dataPlan && typeof activity.dataPlan === "object"
    ? {
        collected: toTextArray(activity.dataPlan.collected).slice(0, 8),
        calculated: toTextArray(activity.dataPlan.calculated).slice(0, 8),
        compared: toTextArray(activity.dataPlan.compared).slice(0, 8)
      }
    : null;
  const glossary = toTextArray(activity.glossary).slice(0, 6);
  const bnccJustification =
    activity.bnccJustification && typeof activity.bnccJustification === "object"
      ? activity.bnccJustification
      : {};
  const optionalMaterials = toTextArray(activity.optionalMaterials).slice(0, 6);
  const figure =
    activity.figure && typeof activity.figure === "object" && cleanText(activity.figure.type)
      ? { type: cleanText(activity.figure.type), caption: cleanText(activity.figure.caption || "") }
      : null;

  // Recursos citados fora da lista rígida do professor → aviso
  const violations = [];
  if (strict) {
    const allowedSet = buildAllowedSet(constraints.availableMaterialsList);
    const scan = [
      ...materials,
      ...(stages || []).map((s) => s.description),
      makerChallenge,
      finalProduct,
      ...readyMaterials,
      ...(teacherGabarito || []).map((g) => g.text)
    ].join(" \n ");
    const forbidden = findForbiddenResources(scan, allowedSet);
    if (forbidden.length) violations.push({ type: "materiais", forbidden });
  }

  let normalized = {
    ...activity,
    title,
    theme,
    objective,
    objectives: [objective],
    problem,
    mission,
    guidingQuestion: makerChallenge,
    makerModality: modality,
    materials,
    optionalMaterials,
    materialFunctions,
    readyMaterials,
    dataPlan,
    testTable,
    glossary,
    bnccJustification,
    figure,
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
    _violations: violations,
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
    stages = normalizeStages(activity, materials, theme, true, stageTitles);
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
  if (!(activity.readyMaterials || []).length && !activity.testTable) missing.push("cenários ou tabela de teste");
  if ((activity.stages || []).length !== 6) missing.push("6 etapas de desenvolvimento e montagem");
  if ((activity.assemblySteps || []).length !== 6) missing.push("passo a passo de montagem");
  // "fazer maker" — construir OU calcular OU representar OU simular OU investigar
  if (!/constru|mont|cria|prototip|calcul|represent|desenh|model|simul|investig|elabor|planej/.test(text))
    missing.push("ação de criação (construir/calcular/representar/simular/investigar)");
  if (!/test/.test(text)) missing.push("teste prático");
  if (!/melhor|ajust|redesign|modific|revis/.test(text)) missing.push("melhoria/revisão");
  if (!/cen[aá]rio|situa[cç][aã]o|simula|compar/.test(text)) missing.push("cenário/comparação");
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
