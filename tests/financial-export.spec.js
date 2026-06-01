import { expect, test } from "@playwright/test";
import fs from "node:fs";
import vm from "node:vm";
import { openActivityPrintWindow } from "../src/lib/exportReport.js";

function loadExportInternals() {
  const source = fs.readFileSync("src/lib/exportReport.js", "utf8")
    .replace(/^import[^;]+;\n/gm, "")
    .replace(/export function/g, "function");
  const context = {
    console: { info() {}, warn() {}, log() {} },
    Intl,
    normalizeLearningExperience: (activity) => activity || {}
  };

  vm.runInNewContext(`${source}
this.__test = {
  extractFinancialScenarioData,
  validateFinancialSummary,
  validateExportedExperience,
  buildFinancialGabaritoFromReadyMaterials,
  fixTruncatedSentences,
  cleanFinancialItemLabel,
  extractExplicitImprovement,
  validateAnswerKeyText
};`, context);

  return context.__test;
}

function buildActivity(overrides = {}) {
  return {
    title: "Orçamento familiar",
    theme: "Educação financeira",
    duration: "2 aulas",
    objective: "Calcular receitas, despesas, metas de poupança e saldo em orçamento familiar.",
    problem: "Como reorganizar o orçamento familiar diante de imprevistos e metas de poupança?",
    mission: "Organizar um painel financeiro e testar decisões de ajuste.",
    makerChallenge: "Construir um painel manipulável de orçamento com cartões e simulações.",
    finalProduct: "Painel de orçamento revisado com os resultados dos cenários e as melhorias aplicadas.",
    materials: ["Cartolina: 1 folha por grupo"],
    materialFunctions: ["Cartolina: base do painel"],
    readyMaterials: [],
    teacherGabarito: ["Cenário 1: conferir os cálculos do cenário apresentado."],
    bibliography: ["BANCO CENTRAL DO BRASIL. Caderno de educação financeira: gestão de finanças pessoais. Brasília: Banco Central do Brasil, 2013."],
    steamConnection: {
      science: "Analisar consumo.",
      technology: "Organizar dados.",
      engineering: "Montar painel.",
      art: "Comunicar visualmente.",
      mathematics: "Calcular saldo."
    },
    assessmentRubric: [{ criterion: "Cálculo financeiro", observation: "Confere saldos." }],
    stages: [{ number: 1, title: "Preparar a base", description: "Separar cartões e testar cenários." }],
    ...overrides
  };
}

function captureExportText(activity) {
  let html = "";
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

  const originalInfo = console.info;
  const originalWarn = console.warn;
  console.info = () => {};
  console.warn = () => {};
  try {
    openActivityPrintWindow(activity);
  } finally {
    console.info = originalInfo;
    console.warn = originalWarn;
  }

  return {
    html,
    text: html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, "\n")
      .replace(/\s+/g, " ")
  };
}

test.describe("validação financeira da exportação", () => {
  test("receita não entra em despesa", () => {
    const api = loadExportInternals();
    const [scenario] = api.extractFinancialScenarioData({
      readyMaterials: [
        "CENÁRIO 1",
        "Receitas:",
        "Pai R$ 2.500,00",
        "Mãe R$ 1.800,00",
        "Despesas fixas:",
        "Aluguel R$ 1.200,00"
      ]
    });

    expect(scenario.receitaTotal).toBe(4300);
    expect(scenario.structured.receitas.map((item) => item.valor)).toEqual([2500, 1800]);
    expect(scenario.structured.despesasFixas.map((item) => item.valor)).toEqual([1200]);
  });

  test("despesa variável não vira fixa", () => {
    const api = loadExportInternals();
    const [scenario] = api.extractFinancialScenarioData({
      readyMaterials: [
        "CENÁRIO 1",
        "Receita total: R$ 3.000,00",
        "Despesas variáveis:",
        "Farmácia R$ 150,00"
      ]
    });

    expect(scenario.despesasFixasTotal).toBe(0);
    expect(scenario.despesasVariaveisTotal).toBe(150);
  });

  test("economia não vira despesa", () => {
    const api = loadExportInternals();
    const [scenario] = api.extractFinancialScenarioData({
      readyMaterials: [
        "CENÁRIO 1",
        "Receita total: R$ 3.500,00",
        "Despesas totais: R$ 2.800,00",
        "Onde poderiam economizar R$ 100,00?"
      ]
    });

    expect(scenario.melhoriasTotal).toBe(100);
    expect(scenario.summary.compromissoTotal).toBe(2800);
  });

  test("imprevisto não pode ser zerado", () => {
    const api = loadExportInternals();
    const [scenario] = api.extractFinancialScenarioData({
      readyMaterials: [
        "CENÁRIO 1",
        "Receita total: R$ 3.500,00",
        "Despesas totais: R$ 2.800,00",
        "Remédio de R$ 250,00"
      ]
    });

    expect(scenario.imprevistosTotal).toBe(250);
  });

  test("meta de poupança não vira despesa comum", () => {
    const api = loadExportInternals();
    const [scenario] = api.extractFinancialScenarioData({
      readyMaterials: [
        "CENÁRIO 1",
        "Receita total: R$ 3.500,00",
        "Despesas totais: R$ 2.800,00",
        "Guardar R$ 400,00 para uma viagem"
      ]
    });

    expect(scenario.metasPoupancaTotal).toBe(400);
    expect(scenario.summary.compromissoTotal).toBe(3200);
  });

  test("cenário 2 com imprevisto e meta calcula compromisso total", () => {
    const api = loadExportInternals();
    const readyMaterials = [
      "CENÁRIO 1",
      "Receita total: R$ 4.500,00",
      "Despesas fixas: R$ 2.030,00",
      "Despesas variáveis: R$ 1.450,00",
      "CENÁRIO 2",
      "Remédio: R$ 250,00",
      "Meta de poupança para viagem: R$ 400,00"
    ];
    const scenarios = api.extractFinancialScenarioData({ readyMaterials });
    const scenario2 = scenarios[1];
    const gabarito = api.buildFinancialGabaritoFromReadyMaterials(readyMaterials).join("\n");

    expect(scenario2.summary.compromissoTotal).toBe(4130);
    expect(scenario2.summary.saldoAntesMelhoria).toBe(370);
    expect(gabarito).toContain("Compromisso total: R$ 3.480,00 + R$ 250,00 + R$ 400,00 = R$ 4.130,00.");
    expect(gabarito).toContain("Saldo antes da melhoria: R$ 4.500,00 - R$ 4.130,00 = R$ 370,00.");
  });

  test("resultado absurdo é bloqueado pela validação", () => {
    const api = loadExportInternals();
    const result = api.validateExportedExperience(buildActivity({
      readyMaterials: [
        "CENÁRIO 1",
        "Receita total: R$ 4.500,00",
        "Despesas fixas: R$ 2.030,00",
        "Despesas variáveis: R$ 1.450,00",
        "CENÁRIO 2",
        "Remédio: R$ 250,00",
        "Meta de poupança para viagem: R$ 400,00"
      ],
      teacherGabarito: [
        "Cenário 1:\nReceita total: R$ 4.500,00.\nDespesas totais: R$ 3.480,00.\nSaldo final: R$ 4.500,00 - R$ 3.480,00 = R$ 1.020,00.",
        "Cenário 2:\nResultado após melhoria: R$ 4.100,00 + R$ 4.100,00 = R$ 8.200,00."
      ]
    }));

    expect(result.blocking.join(" ")).toContain("Resultado após melhoria maior que a receita total");
  });

  test("frase truncada é corrigida", () => {
    const api = loadExportInternals();
    expect(api.fixTruncatedSentences("com os resultados dos cenários e as."))
      .toBe("com os resultados dos cenários e as melhorias aplicadas.");
  });

  test("pergunta sobre poupança sem valor monetário não vira meta", () => {
    const { text } = captureExportText(buildActivity({
      readyMaterials: [
        "CENÁRIO 1",
        "Receitas: Pai R$ 2.500,00; Mãe R$ 1.800,00",
        "Despesas fixas: Aluguel R$ 1.200,00",
        "Despesas variáveis: Lazer R$ 200,00. Pergunta: Que ajuste poderia ser feito para preservar parte da poupança?"
      ],
      teacherGabarito: ["Cenário 1: errado."]
    }));

    expect(text).not.toContain("Exportação bloqueada");
    expect(text).toContain("Saldo final: R$ 4.300,00 - R$ 1.400,00 = R$ 2.900,00.");
  });

  test("exportação autocorrige gabarito financeiro antes de bloquear", () => {
    const { html, text } = captureExportText(buildActivity({
      finalProduct: "Painel de orçamento revisado com os resultados dos cenários e as.",
      readyMaterials: [
        "CENÁRIO 1",
        "Receita total: R$ 4.500,00",
        "Despesas fixas: R$ 2.030,00",
        "Despesas variáveis: R$ 1.450,00",
        "CENÁRIO 2",
        "Remédio: R$ 250,00",
        "Meta de poupança para viagem: R$ 400,00"
      ],
      teacherGabarito: [
        "Cenário 1: errado.",
        "Cenário 2: Despesas do Cenário 1: R$ 400,00. Imprevistos: R$ 0,00. Resultado após melhoria: R$ 4.100,00 + R$ 4.100,00 = R$ 8.200,00."
      ]
    }));

    expect(text).not.toContain("Exportação bloqueada");
    expect(text).toContain("Compromisso total: R$ 3.480,00 + R$ 250,00 + R$ 400,00 = R$ 4.130,00.");
    expect(text).toContain("Resultado após melhoria: R$ 370,00 + R$ 150,00 = R$ 520,00.");
    expect(text).not.toContain("R$ 8.200,00");
    expect(text).not.toMatch(/blob:http|localhost|127\.0\.0\.1/);
    expect(html).toContain(".materials-table");
    expect(html).toContain(".stage");
    expect(html).toContain("GABARITO DO PROFESSOR");
  });

  test("gabarito limpa imprevisto e preserva melhoria explícita do cenário", () => {
    const api = loadExportInternals();
    const readyMaterials = [
      "CENÁRIO 1:",
      "Receita Total: R$ 4.500.",
      "Despesas Fixas: Aluguel R$ 1.200, Luz R$ 150, Água R$ 80, Internet R$ 100.",
      "Despesas Variáveis: Alimentação R$ 1.500, Transporte R$ 300, Lazer R$ 200.",
      "CENÁRIO 2:",
      "Além das despesas do Cenário 1, surge um gasto inesperado com remédios de R$ 350.",
      "Para compensar, a família decide reduzir R$ 100 do gasto com lazer."
    ];
    const scenarios = api.extractFinancialScenarioData({ readyMaterials });
    const gabarito = api.buildFinancialGabaritoFromReadyMaterials(readyMaterials).join("\n");
    const { html, text } = captureExportText(buildActivity({
      readyMaterials,
      teacherGabarito: ["Cenário 1: cálculo antigo inconsistente."]
    }));

    expect(api.cleanFinancialItemLabel("surge um gasto inesperado com remédios de")).toBe("remédios");
    expect(api.extractExplicitImprovement(readyMaterials.join("\n"))).toEqual({
      action: "Reduzir",
      value: 100,
      target: "lazer"
    });
    expect(scenarios[1].imprevistosTotal).toBe(350);
    expect(scenarios[1].despesasAnterioresTotal).toBe(3530);
    expect(scenarios[1].melhoriasTotal).toBe(100);
    expect(gabarito).toContain("Cenário 1:");
    expect(gabarito).toContain("Receitas: R$ 4.500,00.");
    expect(gabarito).toContain("Despesas fixas: R$ 1.200,00 + R$ 150,00 + R$ 80,00 + R$ 100,00 = R$ 1.530,00.");
    expect(gabarito).toContain("Despesas variáveis: R$ 1.500,00 + R$ 300,00 + R$ 200,00 = R$ 2.000,00.");
    expect(gabarito).toContain("Despesas totais: R$ 1.530,00 + R$ 2.000,00 = R$ 3.530,00.");
    expect(gabarito).toContain("Saldo final: R$ 4.500,00 - R$ 3.530,00 = R$ 970,00.");
    expect(gabarito).toContain("Cenário 2:");
    expect(gabarito).toContain("Despesas do Cenário 1: R$ 3.530,00.");
    expect(gabarito).toContain("Imprevisto com remédios: R$ 350,00.");
    expect(gabarito).toContain("Compromisso total: R$ 3.530,00 + R$ 350,00 = R$ 3.880,00.");
    expect(gabarito).toContain("Saldo antes da melhoria: R$ 4.500,00 - R$ 3.880,00 = R$ 620,00.");
    expect(gabarito).toContain("Melhoria sugerida:\nReduzir R$ 100,00 do gasto com lazer.");
    expect(gabarito).toContain("Resultado após melhoria:\nR$ 620,00 + R$ 100,00 = R$ 720,00.");
    expect(gabarito).toContain("Interpretação:\nA melhoria aumenta o saldo final e ajuda a preservar parte da poupança.");
    expect(gabarito).not.toContain("Imprevisto com surge");
    expect(gabarito).not.toContain("lazer, transporte ou compras não essenciais");
    expect(api.validateAnswerKeyText(gabarito).ok).toBe(true);
    expect(text).not.toContain("Exportação bloqueada");
    expect(text).toContain("Imprevisto com remédios: R$ 350,00.");
    expect(text).toContain("Reduzir R$ 100,00 do gasto com lazer.");
    expect(html).toContain(".materials-table");
    expect(html).toContain(".stage");
  });
});
