// ============================================================
// generationContract.js
// Regras sistêmicas do gerador de planos de aula
// ============================================================
//
// Módulo isomórfico (sem dependências) que centraliza:
//  - modalidades "maker" e os títulos de etapa de cada uma
//    (substitui o conjunto único fixo de etapas "construir
//     objeto físico");
//  - detecção de recursos citados no texto e verificação de
//    materiais fora da lista do professor;
//  - auditoria de coerência do plano antes de entregá-lo;
//  - prompt de reparo e limpeza determinística de fallback.
//
// Nada aqui é específico de "mercado financeiro" ou de qualquer
// tema: tudo funciona a partir dos dados informados.
// ============================================================

// ------------------------------------------------------------
// Texto
// ------------------------------------------------------------

export function normalize(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function tokens(value = "") {
  return normalize(value)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4);
}

function flattenText(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(flattenText).join(" ");
  if (typeof value === "object") return Object.values(value).map(flattenText).join(" ");
  return String(value);
}

// ------------------------------------------------------------
// Modalidades "maker" — Cultura Maker não é só construir objeto 3D
// ------------------------------------------------------------

export const NEUTRAL_STAGE_TITLES = [
  "ETAPA 1 - Preparar e organizar",
  "ETAPA 2 - Desenvolver a solução",
  "ETAPA 3 - Aplicar e testar",
  "ETAPA 4 - Analisar resultados",
  "ETAPA 5 - Revisar e melhorar",
  "ETAPA 6 - Comunicar"
];

export const MAKER_MODALITIES = {
  construcao_fisica: {
    label: "Construção física",
    stageTitles: [
      "ETAPA 1 - Preparar a base e dividir materiais",
      "ETAPA 2 - Construir as partes principais",
      "ETAPA 3 - Montar o mecanismo de interação",
      "ETAPA 4 - Testar com uma situação real",
      "ETAPA 5 - Ajustar e testar novamente",
      "ETAPA 6 - Apresentar produto e evidências"
    ]
  },
  representacao_grafica: {
    label: "Representação gráfica / visual",
    stageTitles: [
      "ETAPA 1 - Definir o que representar e a escala",
      "ETAPA 2 - Construir a representação (gráfico, mapa, esquema)",
      "ETAPA 3 - Registrar os dados e eventos",
      "ETAPA 4 - Aplicar os cenários e ler a representação",
      "ETAPA 5 - Revisar a representação a partir das evidências",
      "ETAPA 6 - Apresentar a leitura e as conclusões"
    ]
  },
  calculo_analise: {
    label: "Cálculo e análise de dados",
    stageTitles: [
      "ETAPA 1 - Organizar os dados e o procedimento de cálculo",
      "ETAPA 2 - Montar a tabela e registrar os valores iniciais",
      "ETAPA 3 - Calcular os cenários passo a passo",
      "ETAPA 4 - Comparar os resultados dos cenários",
      "ETAPA 5 - Testar uma estratégia diferente e recalcular",
      "ETAPA 6 - Apresentar cálculos, comparação e conclusão"
    ]
  },
  investigacao_campo: {
    label: "Investigação / campo",
    stageTitles: [
      "ETAPA 1 - Definir a pergunta e o que observar",
      "ETAPA 2 - Preparar o instrumento de coleta",
      "ETAPA 3 - Coletar os dados",
      "ETAPA 4 - Organizar e analisar os dados",
      "ETAPA 5 - Revisar a análise e levantar novas questões",
      "ETAPA 6 - Comunicar os achados"
    ]
  },
  expressao_cenica: {
    label: "Expressão cênica / artística",
    stageTitles: [
      "ETAPA 1 - Definir a mensagem e o formato",
      "ETAPA 2 - Criar o roteiro ou a composição",
      "ETAPA 3 - Ensaiar e ajustar",
      "ETAPA 4 - Apresentar para um público de teste",
      "ETAPA 5 - Revisar a partir do retorno recebido",
      "ETAPA 6 - Apresentação final e registro"
    ]
  },
  jogo_simulacao: {
    label: "Jogo / simulação",
    stageTitles: [
      "ETAPA 1 - Definir objetivo, regras e componentes",
      "ETAPA 2 - Montar o tabuleiro, cartas ou peças",
      "ETAPA 3 - Testar uma partida completa",
      "ETAPA 4 - Analisar equilíbrio e clareza das regras",
      "ETAPA 5 - Ajustar regras/componentes e testar de novo",
      "ETAPA 6 - Apresentar o jogo e o que se aprende com ele"
    ]
  }
};

export const MAKER_MODALITY_IDS = Object.keys(MAKER_MODALITIES);

export const MAKER_VERBS =
  "criar, testar, representar, desenhar, prototipar, calcular, modelar, modificar, comparar, experimentar e revisar";

export function stageTitlesForModality(modality) {
  const key = normalize(modality || "").replace(/\s+/g, "_");
  return MAKER_MODALITIES[key]?.stageTitles || NEUTRAL_STAGE_TITLES;
}

// Heurística de fallback: se o modelo não informar makerModality,
// inferir a partir dos materiais do professor + texto da atividade.
export function inferModality({ availableMaterials = "", activityText = "" } = {}) {
  const mat = normalize(availableMaterials);
  const txt = normalize(`${availableMaterials} ${activityText}`);
  const onlyPaper =
    mat &&
    !/[a-z]/.test(
      mat
        .replace(/(folha|caderno|papel|sulfite|a4|lapis|lápis|caneta|borracha|grafite|;|,|e|de|do|da|-)/g, "")
        .trim()
    );

  if (/encena|teatro|cena|roteiro|m[uú]sica|coreografia|performance|dan[cç]a/.test(txt)) return "expressao_cenica";
  if (/\bjogo\b|tabuleiro|cartas|dado|partida|regras do jogo/.test(txt)) return "jogo_simulacao";
  if (/\bcoleta\b|campo|entrevista|censo|amostragem|observa[cç][aã]o de campo/.test(txt)) return "investigacao_campo";
  if (/gr[aá]fico|mapa|linha do tempo|croqui|esquema|plano cartesiano|maquete visual/.test(txt)) return "representacao_grafica";
  if (onlyPaper || /porcentagem|c[aá]lculo|planilha|tabela de dados|varia[cç][aã]o percentual|or[cç]amento/.test(txt))
    return "calculo_analise";
  if (/circuito|sensor|arduino|prot[oó]tipo|maquete|estrutura|mecanismo/.test(txt)) return "construcao_fisica";
  return onlyPaper ? "calculo_analise" : "construcao_fisica";
}

// ------------------------------------------------------------
// Recursos citados / materiais fora da lista
// ------------------------------------------------------------

// Léxico domínio-neutro de objetos, ferramentas e equipamentos
// que costumam aparecer em atividades escolares. Serve para
// detectar quando o plano passou a depender de algo que o
// professor não informou.
export const RESOURCE_LEXICON = [
  "regua", "esquadro", "compasso", "transferidor", "tesoura", "estilete", "cola", "fita adesiva",
  "fita crepe", "durex", "grampeador", "clipe", "percevejo", "alfinete", "barbante", "linha", "la",
  "novelo", "elastico", "arame", "prego", "parafuso", "porca", "martelo", "chave de fenda",
  "palito", "palito de picole", "palito de fosforo", "espeto", "canudo", "cotonete",
  "moeda", "ficha", "botao", "tampinha", "tampa", "rolha", "clips",
  "cartolina", "papel cartao", "papelao", "caixa", "caixa de sapato", "isopor", "eva", "feltro",
  "tnt", "papel crepom", "papel seda", "papel manteiga", "papel milimetrado", "papel quadriculado",
  "cola quente", "pistola de cola", "tinta", "guache", "pincel", "giz", "giz de cera", "carvao",
  "marcador", "canetinha", "hidrocor", "lapis de cor", "apontador",
  "computador", "notebook", "tablet", "celular", "smartphone", "projetor", "datashow", "impressora",
  "scanner", "camera", "filmadora", "microfone", "caixa de som", "fone",
  "arduino", "raspberry", "microcontrolador", "protoboard", "jumper", "resistor", "led", "diodo",
  "sensor", "servo", "motor", "pilha", "bateria", "multimetro", "ferro de solda", "fio", "cabo",
  "balanca", "termometro", "cronometro", "trena", "paquimetro", "proveta", "becher", "pipeta",
  "conta-gotas", "seringa", "funil", "peneira", "coador", "filtro", "recipiente", "garrafa pet",
  "copo", "colher", "prato", "bandeja", "balde", "bacia", "mangueira",
  "calculadora", "abaco", "dado", "dados", "cronometro digital", "gps",
  "terra", "adubo", "semente", "vaso", "muda", "pedra", "areia", "carvao ativado",
  "lanterna", "espelho", "lupa", "microscopio", "ima", "bussola",
  "revista", "jornal", "livro didatico", "atlas", "globo terrestre", "mapa impresso",
  "prendedor", "pregador", "velcro", "botao de pressao", "zíper", "agulha"
];

const ABSTRACT_STOPWORDS = new Set([
  "problema", "solucao", "solucoes", "ideia", "ideias", "grupo", "grupos", "equipe", "equipes",
  "aluno", "alunos", "professor", "professora", "turma", "atividade", "etapa", "etapas", "teste",
  "testes", "cenario", "cenarios", "resultado", "resultados", "evidencia", "evidencias", "dado",
  "dados", "tabela", "grafico", "registro", "registros", "melhoria", "melhorias", "conclusao",
  "estrategia", "estrategias", "conceito", "conceitos", "processo", "informacao", "informacoes",
  "escala", "medida", "medidas", "calculo", "calculos", "valor", "valores", "tempo", "espaco",
  "material", "materiais", "recurso", "recursos", "produto", "prototipo", "modelo", "apresentacao",
  "pergunta", "perguntas", "resposta", "respostas", "criterio", "criterios", "objetivo", "missao"
]);

// Sinônimos frequentes → nome canônico do léxico
const RESOURCE_ALIASES = [
  [/r[eé]guas?/, "regua"],
  [/tesouras?/, "tesoura"],
  [/palitos?\s+(de\s+)?(picol[eé]|f[oó]sforo|sorvete|churrasco)/, "palito"],
  [/palitos?/, "palito"],
  [/moedas?/, "moeda"],
  [/fios?\s+de\s+(l[aã]|linha|nylon|cobre)/, "fio"],
  [/fios?/, "fio"],
  [/barbantes?/, "barbante"],
  [/cartolinas?/, "cartolina"],
  [/papel[aã]o|caixas?\s+de\s+papel[aã]o/, "papelao"],
  [/computadores?|notebooks?|laptops?/, "computador"],
  [/celulares?|smartphones?/, "celular"],
  [/impressoras?/, "impressora"],
  [/calculadoras?/, "calculadora"],
  [/canetinhas?|hidrocor(es)?|marcadores?/, "canetinha"],
  [/l[aá]pis\s+de\s+cor/, "lapis de cor"],
  [/colas?\s+(quente|bast[aã]o|branca|isopor)?/, "cola"],
  [/fitas?\s+(adesiva|crepe|isolante|dupla\s+face)?/, "fita adesiva"],
  [/el[aá]sticos?/, "elastico"],
  [/tampas?|tampinhas?/, "tampa"],
  [/bot[oõ]es?/, "botao"],
  [/dados?\b/, "dado"],
  [/garrafas?\s+pet/, "garrafa pet"],
  [/arduinos?/, "arduino"],
  [/sensores?/, "sensor"],
  [/leds?/, "led"],
  [/pilhas?|baterias?/, "pilha"]
];

const MATERIAL_MENTION_RE =
  /\b(?:com|usando|utilize|utilizando|use\s+(?:o|a|os|as)?|por\s+meio\s+de|atrav[eé]s\s+de|a\s+partir\s+de|munidos?\s+de|com\s+aux[ií]lio\s+de)\s+([a-zçãõáéíóúâêô\s]{3,40}?)(?:[.,;:)]|$|\s+e\s+|\s+para\s+|\s+que\s+)/gi;

// looseCapture: além do léxico, tenta pegar substantivos citados após
// "com/usando ...". Só use isso para exibição/insight — para BARRAR
// material (findForbiddenResources) fica FALSE, senão gera falso
// positivo com palavras abstratas ("com a evolução do investimento").
export function extractMentionedResources(value, { looseCapture = true } = {}) {
  const text = normalize(flattenText(value));
  if (!text) return [];
  const found = new Set();

  for (const [re, canon] of RESOURCE_ALIASES) {
    if (re.test(text)) found.add(canon);
  }
  for (const resource of RESOURCE_LEXICON) {
    const re = new RegExp(`(^|[^a-z])${resource.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}(s)?([^a-z]|$)`);
    if (re.test(text)) found.add(resource);
  }
  if (looseCapture) {
    let m;
    const re = new RegExp(MATERIAL_MENTION_RE.source, "gi");
    while ((m = re.exec(text))) {
      const phrase = m[1].trim();
      const head = phrase.split(/\s+(?:de|do|da|para|com|e)\s+/)[0].replace(/^(o|a|os|as|um|uma|seu|sua)\s+/, "").trim();
      const word = head.split(/\s+/).slice(0, 2).join(" ");
      if (word.length >= 4 && !ABSTRACT_STOPWORDS.has(word) && !ABSTRACT_STOPWORDS.has(word.split(" ")[0])) {
        found.add(word);
      }
    }
  }
  return [...found];
}

// allowed: array de nomes de materiais informados pelo professor
export function buildAllowedSet(allowed = []) {
  const set = new Set();
  for (const raw of allowed) {
    const n = normalize(raw).replace(/\d+/g, " ");
    for (const tok of n.split(/[^a-zçãõáéíóúâêô]+/).filter((t) => t.length >= 3)) {
      set.add(tok);
      for (const [re, canon] of RESOURCE_ALIASES) if (re.test(tok)) set.add(canon);
    }
    for (const [re, canon] of RESOURCE_ALIASES) if (re.test(n)) set.add(canon);
  }
  // termos de "papel" que são equivalentes
  if ([...set].some((t) => /folha|caderno|papel|sulfite|a4/.test(t))) {
    ["folha", "caderno", "papel", "sulfite"].forEach((t) => set.add(t));
  }
  return set;
}

function resourceIsAllowed(resource, allowedSet) {
  const n = normalize(resource);
  if (allowedSet.has(n)) return true;
  for (const tok of n.split(/\s+/)) if (allowedSet.has(tok)) return true;
  // "papel milimetrado/quadriculado" contam como papel
  if (/^papel\b/.test(n) && [...allowedSet].some((t) => /folha|caderno|papel|sulfite/.test(t))) return true;
  return false;
}

export function findForbiddenResources(value, allowedSet) {
  if (!allowedSet || allowedSet.size === 0) return [];
  return extractMentionedResources(value, { looseCapture: false }).filter(
    (r) => !resourceIsAllowed(r, allowedSet)
  );
}

// ------------------------------------------------------------
// Auditoria de coerência (os 10 CHECKs)
// ------------------------------------------------------------

const CLICHE_PHRASES = [
  "analisar o cenario",
  "aplicar o prototipo ou procedimento planejado",
  "registrar evidencias e justificar a decisao",
  "faca um prototipo",
  "use os materiais disponiveis",
  "teste a solucao",
  "melhore o projeto"
];

const TEMPLATE_TABLE_HEADERS = [
  "receita total",
  "despesas fixas",
  "despesas variaveis",
  "saldo inicial",
  "melhoria aplicada",
  "saldo final apos melhoria"
];

function activityTextFields(activity) {
  return [
    activity.objective,
    activity.problem,
    activity.mission,
    activity.makerChallenge,
    activity.finalProduct,
    activity.teacherOrientation,
    ...(activity.materialFunctions || []),
    ...(activity.readyMaterials || []),
    ...(activity.stages || []).map((s) => `${s.title} ${s.description}`),
    ...(activity.assemblySteps || []).map((s) => `${s.title} ${s.description}`),
    ...(activity.assessmentRubric || []).map((r) => `${r.criterion} ${r.observation}`),
    ...(Array.isArray(activity.teacherGabarito)
      ? activity.teacherGabarito.map((g) => (typeof g === "string" ? g : `${g.title || ""} ${g.text || g.content || ""}`))
      : []),
    flattenText(activity.steamConnection),
    flattenText(activity.testTable)
  ].filter(Boolean);
}

function hasNumericResult(text) {
  return /(r\$\s*[\d.]+,\d{2})|=\s*[\d.]+|[\d]+\s*%/.test(normalize(text));
}

export function checkConsistency(activity = {}, constraints = {}) {
  const violations = [];
  const add = (check, severity, detail, fields = []) =>
    violations.push({ check, severity, detail, fields });

  const allowedSet = constraints.strictMaterials
    ? buildAllowedSet(constraints.availableMaterialsList || [])
    : null;

  // CHECK 1 + 2 + 9 — materiais/recursos fora da lista do professor
  if (allowedSet && allowedSet.size) {
    const perField = [
      ["materials", (activity.materials || []).join(" ; ")],
      ["stages", (activity.stages || []).map((s) => s.description).join(" ")],
      ["makerChallenge", activity.makerChallenge],
      ["finalProduct", activity.finalProduct],
      ["readyMaterials", (activity.readyMaterials || []).join(" ")],
      ["testTable", flattenText(activity.testTable)],
      ["assessment", (activity.assessmentRubric || []).map((r) => `${r.criterion} ${r.observation}`).join(" ")],
      ["teacherGabarito", flattenText(activity.teacherGabarito)],
      ["teacherOrientation", activity.teacherOrientation]
    ];
    const forbiddenByField = perField
      .map(([field, text]) => [field, findForbiddenResources(text, allowedSet)])
      .filter(([, list]) => list.length);
    if (forbiddenByField.length) {
      add(
        "materiais",
        "hard",
        `Recursos não informados pelo professor: ${[
          ...new Set(forbiddenByField.flatMap(([, l]) => l))
        ].join(", ")}`,
        forbiddenByField.map(([f]) => f)
      );
    }
  }

  // CHECK 3 — cada BNCC tem etapa/ação correspondente
  const bnccCodes = (activity.bncc || []).map((c) => (typeof c === "string" ? c : c.codigo)).filter(Boolean);
  const justif = activity.bnccJustification || {};
  const unjustified = bnccCodes.filter((code) => !normalize(flattenText(justif[code])).length);
  if (bnccCodes.length && unjustified.length) {
    add("bncc", "soft", `Habilidades sem etapa concreta que as desenvolva: ${unjustified.join(", ")}`, ["bncc"]);
  }
  if (bnccCodes.length > 4) {
    add("bncc", "soft", `${bnccCodes.length} habilidades BNCC — prefira 2 a 3 altamente coerentes.`, ["bncc"]);
  }

  // CHECK 4 — objetivo alinhado a problema/desenvolvimento/produto/avaliação
  const objTokens = new Set(tokens(activity.objective));
  const bodyTokens = new Set(
    tokens(
      [
        activity.problem,
        activity.finalProduct,
        (activity.stages || []).map((s) => s.description).join(" "),
        (activity.assessmentRubric || []).map((r) => r.observation).join(" ")
      ].join(" ")
    )
  );
  const overlap = [...objTokens].filter((t) => bodyTokens.has(t)).length;
  if (activity.objective && objTokens.size >= 3 && overlap < 2) {
    add("alinhamento", "soft", "Objetivo geral pouco conectado ao problema, ao desenvolvimento e à avaliação.", ["objective"]);
  }

  // CHECK 5 — colunas da tabela ⊂ dados planejados
  const tt = activity.testTable;
  const dp = activity.dataPlan || {};
  if (tt && Array.isArray(tt.columns) && tt.columns.length) {
    const planText = normalize(flattenText([dp.collected, dp.calculated, dp.compared]));
    if (planText) {
      const orphan = tt.columns.filter((col) => {
        const colToks = tokens(col);
        return colToks.length && !colToks.some((t) => planText.includes(t));
      });
      if (orphan.length > Math.ceil(tt.columns.length / 2)) {
        add("tabela", "soft", `Colunas da tabela sem relação com os dados coletados/calculados: ${orphan.join(", ")}`, ["testTable"]);
      }
    }
  }

  // CHECK 6 — gabarito "cálculo" com resultado numérico
  const gab = Array.isArray(activity.teacherGabarito) ? activity.teacherGabarito : [];
  const calcMissingResult = gab
    .filter((g) => g && typeof g === "object" && normalize(g.type) === "calculo")
    .filter((g) => !hasNumericResult(`${g.text || g.content || ""}`));
  if (calcMissingResult.length) {
    add("gabarito", "hard", `${calcMissingResult.length} item(ns) de gabarito do tipo "cálculo" sem resultado numérico.`, ["teacherGabarito"]);
  }
  // gabarito genérico mesmo sem type
  const genericGab = gab.filter((g) => {
    const t = normalize(typeof g === "string" ? g : g.text || g.content || "");
    return t && CLICHE_PHRASES.some((p) => t.includes(p));
  });
  if (genericGab.length) {
    add("gabarito", "hard", "Gabarito com resposta genérica de template ('analisar o cenário / aplicar o protótipo...').", ["teacherGabarito"]);
  }

  // CHECK 7 — sobras de template
  const allText = normalize(activityTextFields(activity).map(flattenText).join(" \n "));
  const themeTok = new Set(tokens(activity.theme));
  const leakedHeaders = TEMPLATE_TABLE_HEADERS.filter((h) => allText.includes(h));
  if (leakedHeaders.length >= 3 && !["receita", "despesa", "salario", "renda"].some((k) => themeTok.has(k))) {
    add("template", "hard", `Cabeçalhos de tabela de outra atividade (Educação Financeira) reaproveitados: ${leakedHeaders.join(", ")}`, ["testTable", "readyMaterials"]);
  }
  const clicheHits = CLICHE_PHRASES.filter((p) => allText.includes(p));
  if (clicheHits.length) {
    add("template", "soft", `Frases-clichê de template: "${clicheHits[0]}"`, []);
  }

  // CHECK 8 — consistência terminológica do glossário
  const glossary = Array.isArray(activity.glossary) ? activity.glossary : [];
  // (checagem leve: se o glossário listar um termo mas o texto usar um par
  //  sinônimo conhecido, sinaliza — genérico via pares no próprio glossário)
  if (glossary.length >= 2) {
    const canon = glossary.map(normalize);
    const rivals = [
      ["valor do ativo", "valor do investimento"],
      ["saldo", "total"],
      ["aporte", "rendimento"]
    ];
    for (const [a, b] of rivals) {
      if (canon.includes(a) && allText.includes(b) && !canon.includes(b)) {
        add("terminologia", "soft", `O texto alterna "${a}" e "${b}"; use apenas o termo do glossário.`, ["glossary"]);
      }
    }
  }

  // CHECK 10 — produto final viável com os recursos
  if (allowedSet && allowedSet.size && findForbiddenResources(activity.finalProduct, allowedSet).length) {
    add("produto", "hard", "Produto final depende de recurso não disponível.", ["finalProduct"]);
  }

  return { pass: violations.filter((v) => v.severity === "hard").length === 0, violations };
}

// ------------------------------------------------------------
// Reparo
// ------------------------------------------------------------

export function buildRepairPrompt(activity, violations, constraints = {}) {
  const list = violations
    .map((v, i) => `${i + 1}. [${v.check}] ${v.detail}${v.fields.length ? ` (campos: ${v.fields.join(", ")})` : ""}`)
    .join("\n");

  const materialsRule = constraints.strictMaterials
    ? `\nMATERIAIS PERMITIDOS (únicos): ${(constraints.availableMaterialsList || []).join(", ")}. NENHUM outro objeto, ferramenta ou recurso pode aparecer em qualquer seção, etapa, desafio, produto, avaliação ou gabarito.`
    : "";

  return `Você gerou este plano de aula (JSON abaixo). Uma auditoria encontrou problemas.
Corrija SOMENTE os itens listados, mantendo todo o resto igual. Devolva o JSON COMPLETO, válido, sem texto antes ou depois.
${materialsRule}

PROBLEMAS A CORRIGIR:
${list}

Regras da correção:
- Não introduza materiais, recursos ou seções novas além do necessário para corrigir.
- Gabarito do tipo "calculo": mostre a conta passo a passo e o resultado numérico final.
- Cada habilidade BNCC mantida precisa de uma entrada em "bnccJustification" indicando a etapa concreta que a desenvolve; remova as que não tiverem.
- Colunas de "testTable" devem sair de "dataPlan" (dados coletados/calculados/comparados) do próprio plano.
- Não use frases genéricas ("analisar o cenário", "aplicar o protótipo", "teste a solução").

PLANO ATUAL:
${JSON.stringify(activity)}`;
}

// Última linha de defesa quando o reparo por IA não resolve tudo.
export function deterministicCleanup(activity, violations) {
  const out = { ...activity };
  const warnings = [...(activity._warnings || [])];

  const materialViolation = violations.find((v) => v.check === "materiais" || v.check === "produto");
  if (materialViolation) {
    warnings.push(
      "Alguns recursos citados não constavam na lista de materiais do professor. Revise as etapas destacadas antes de aplicar."
    );
  }

  const gabViolation = violations.find((v) => v.check === "gabarito" && v.severity === "hard");
  if (gabViolation && Array.isArray(out.teacherGabarito)) {
    out.teacherGabarito = out.teacherGabarito.map((g) => {
      if (g && typeof g === "object" && normalize(g.type) === "calculo" && !hasNumericResult(`${g.text || g.content || ""}`)) {
        return { ...g, text: `${g.text || g.content || ""}`.trim() || "Cálculo a ser conferido pelo professor com os valores do cenário." };
      }
      return g;
    });
    warnings.push("O gabarito de cálculo pode estar incompleto — confira os resultados numéricos.");
  }

  if (violations.some((v) => v.check === "template")) {
    warnings.push("O plano pode conter trechos genéricos de modelo; revise a tabela e o gabarito.");
  }

  const bnccViolation = violations.find((v) => v.check === "bncc");
  if (bnccViolation && Array.isArray(out.bncc) && out.bnccJustification) {
    out.bncc = out.bncc.filter((c) => {
      const code = typeof c === "string" ? c : c.codigo;
      return normalize(flattenText(out.bnccJustification[code])).length > 0;
    });
    if (!out.bncc.length && Array.isArray(activity.bncc)) out.bncc = activity.bncc.slice(0, 2);
  }

  if (warnings.length) out._warnings = [...new Set(warnings)];
  return out;
}
