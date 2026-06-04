import { expect, test } from "@playwright/test";
import { openActivityPrintWindow } from "../src/lib/exportReport.js";
import { normalizeLearningExperience } from "../src/lib/learningExperience.js";
import { validationActivities } from "./fixtures/steamActivities.js";

const REQUIRED_SECTIONS = [
  "Experiência de Aprendizagem STEAM + Cultura Maker",
  "Objetivo geral",
  "Problema/desafio",
  "Materiais",
  "Desenvolvimento e montagem da atividade",
  "Desafio Maker",
  "Produto final",
  "Conexão STEAM + Maker",
  "Avaliação",
  "Referências",
  "GABARITO DO PROFESSOR"
];

const ALLOWED_UNITS = new Set(["por grupo", "por aluno", "para a turma", "conforme disponibilidade"]);
const TRUNCATED_RE = /\b(?:e\s+as|e\s+os|com|para|de|as|os|e)\.\s*(?:$|\n)/i;
const LOWERCASE_AFTER_PERIOD_RE = /[.!?]\s+[a-záàâãéêíóôõúç]/;

function captureExport(activity) {
  let html = "";
  const originalWindow = global.window;
  const originalAlert = global.alert;
  const originalFetch = global.fetch;
  const originalInfo = console.info;
  const originalWarn = console.warn;

  global.window = {
    open: () => ({
      document: {
        open() {},
        write(value) { html += value; },
        close() {}
      }
    })
  };
  global.alert = (message) => {
    throw new Error(message);
  };
  global.fetch = () => {
    throw new Error("Chamadas externas/IA nao sao permitidas nos testes de validacao deterministica.");
  };
  console.info = () => {};
  console.warn = () => {};

  try {
    openActivityPrintWindow(activity);
  } finally {
    global.window = originalWindow;
    global.alert = originalAlert;
    global.fetch = originalFetch;
    console.info = originalInfo;
    console.warn = originalWarn;
  }

  return {
    html,
    text: html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, "\n")
      .replace(/\s+/g, " ")
      .trim()
  };
}

function stripTags(value) {
  return String(value || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function getMaterialsRows(html) {
  const table = html.match(/<table class="materials-table">([\s\S]*?)<\/table>/i)?.[1] || "";
  return [...table.matchAll(/<tr>\s*<td>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/gi)]
    .map((match) => ({
      item: stripTags(match[1]),
      qty: stripTags(match[2]),
      unit: stripTags(match[3]).toLowerCase(),
      use: stripTags(match[4]),
      obs: stripTags(match[5])
    }));
}

function expectApprovedTemplate({ activity, html, text }) {
  expect(text).not.toContain("Exportação bloqueada");

  for (const section of REQUIRED_SECTIONS) {
    expect(text).toContain(section);
  }

  expect(html).toContain('class="materials-table"');
  expect(html).toContain("<th>Item</th><th>Qtd.</th><th>Unidade</th><th>Uso na atividade</th><th>Observação</th>");
  expect(html).toContain('class="test-table');
  expect(html).toContain('class="rubric-table"');
  expect(html).toContain('class="stage"');
  expect(html).toContain('class="gabarito-page"');
  expect(html).toMatch(/\.materials-table th[^}]*border:\s*1px/i);
  expect(html).toMatch(/\.test-table th[^}]*border:\s*1px/i);
  expect(html).toMatch(/\.rubric-table th,\s*\.rubric-table td[^}]*border:\s*1px/i);
  expect(html).toMatch(/\.stage\s*\{[^}]*border:\s*1px/i);
  expect(html).toMatch(/\.gabarito-page\s*\{[\s\S]*page-break-before:\s*always/i);

  const materialRows = getMaterialsRows(html);
  expect(materialRows.length).toBeGreaterThanOrEqual(4);
  for (const row of materialRows) {
    expect(row.item).not.toEqual("");
    expect(row.qty).toMatch(/\d|conforme disponibilidade/i);
    expect(ALLOWED_UNITS.has(row.unit)).toBe(true);
    expect(row.use).not.toEqual("");
    expect(row.obs).not.toEqual("");
    if (/tesoura/i.test(row.item)) {
      expect(row.item).toMatch(/tesoura sem ponta/i);
    }
  }

  expect(text).toContain(activity.expectedReferenceTerm);
  expect(text).not.toMatch(/wikipedia/i);
  expect(text).not.toMatch(/blob:http|localhost|127\.0\.0\.1|https?:\/\/|<br>|<\/p>|\*\*|\|\s*---/i);
  expect(text).not.toMatch(TRUNCATED_RE);
  expect(text).not.toMatch(LOWERCASE_AFTER_PERIOD_RE);

  if (activity.openEnded) {
    expect(text).toContain("Critérios de análise:");
    expect(text).toContain("Indicadores de aprendizagem:");
    expect(text).not.toMatch(/resposta\s+(?:correta|única)/i);
  }

  if (activity.expectedText) {
    expect(text).toContain(activity.expectedText);
  }
}

test.describe("validacao deterministica sem IA para exportacao", () => {
  for (const activity of validationActivities) {
    test(`${activity.discipline} - ${activity.title}`, () => {
      const captured = captureExport(activity);
      expectApprovedTemplate({ activity, ...captured });
    });
  }

  test("autocorrige atividade fraca antes de exportar PDF aprovado", () => {
    const { text } = captureExport({
      title: "Resumo teorico",
      theme: "Conteudo expositivo",
      discipline: "Matemática",
      duration: "1 aula",
      objective: "Ler um texto e responder perguntas simples.",
      problem: "Lista de perguntas teoricas.",
      mission: "Copiar respostas do quadro.",
      makerChallenge: "Responder perguntas do livro.",
      finalProduct: "Relatorio escrito apresentado com respostas copiadas do texto e entrega individual.",
      materials: ["Folha sulfite: 1 folha por aluno — responder perguntas — —"],
      materialFunctions: ["Folha sulfite: 1 folha por aluno — responder perguntas — —"],
      readyMaterials: ["CENÁRIO 1", "Questionario teorico de leitura."],
      teacherGabarito: ["Resposta correta unica."],
      bibliography: ["BRASIL. Ministerio da Educacao. Base Nacional Comum Curricular. Brasilia: MEC, 2018."],
      steamConnection: {},
      assessmentRubric: [{ criterion: "Resposta", observation: "Confere se copiou." }],
      stages: [{ number: 1, title: "Responder", description: "Responder perguntas." }]
    });

    expect(text).not.toContain("Exportação bloqueada");
    expect(text).toContain("construindo uma solução testável com registro de evidências e melhoria");
    expect(text).toContain("GABARITO DO PROFESSOR");
  });

  test("diversifica pacote generico quando a IA retorna cartolina como padrão", () => {
    const normalized = normalizeLearningExperience({
      theme: "Orçamento familiar",
      materials: [
        "Cartolina: 1 folha por grupo",
        "Fichas de papel: 8 a 12 por grupo",
        "Canetinhas coloridas: 1 conjunto por grupo",
        "Tesoura sem ponta: 1 por grupo"
      ],
      materialFunctions: [
        "Cartolina: 1 folha por grupo — base do protótipo.",
        "Fichas de papel: 8 a 12 por grupo — cartões de simulação.",
        "Canetinhas coloridas: 1 conjunto por grupo — registro visual.",
        "Tesoura sem ponta: 1 por grupo — recorte das peças."
      ]
    });

    expect(normalized.materials.join(" ")).not.toMatch(/\bcartolina\b/i);
    expect(normalized.materialFunctions.join(" ")).not.toMatch(/\bcartolina\b/i);
    expect(normalized.materials.join(" ")).toMatch(/Fichas de receita e despesa|Envelopes|Planilha impressa/i);
  });
});
