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
  extractPercentageImprovement,
  calculateImprovementValue,
  validateAnswerKeyText,
  fixAnswerKeyText,
  sanitizeReferenceText,
  sanitizeAnswerKeyText,
  sanitizeFinalRenderedHTML,
  validateFinalRenderedHTML,
  buildActivityPrintHTMLFromExperience
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

  test("economia com finalidade de viagem vira meta de poupança", () => {
    const api = loadExportInternals();
    const readyMaterials = [
      "CENÁRIO 1",
      "Receita total: R$ 4.500,00",
      "Despesas totais: R$ 3.480,00",
      "CENÁRIO 2",
      "A família quer economizar R$ 400,00 para uma viagem."
    ];
    const scenarios = api.extractFinancialScenarioData({ readyMaterials });
    const scenario2 = scenarios[1];
    const gabarito = api.buildFinancialGabaritoFromReadyMaterials(readyMaterials).join("\n");
    const { text } = captureExportText(buildActivity({
      readyMaterials,
      teacherGabarito: ["Cenário 1: cálculo antigo inconsistente."]
    }));

    expect(scenario2.metasPoupancaTotal).toBe(400);
    expect(scenario2.melhoriasTotal).toBe(0);
    expect(scenario2.summary.compromissoTotal).toBe(3880);
    expect(gabarito).toContain("Meta de poupança para viagem: R$ 400,00.");
    expect(text).not.toContain("Exportação bloqueada");
    expect(text).not.toContain("total de metas ficou zerado");
  });

  test("economia para preservar poupança continua melhoria", () => {
    const api = loadExportInternals();
    const readyMaterials = [
      "CENÁRIO 1",
      "Receita total: R$ 4.500,00",
      "Despesas totais: R$ 3.480,00",
      "CENÁRIO 2",
      "Reduzir R$ 100,00 para preservar parte da poupança."
    ];
    const scenario2 = api.extractFinancialScenarioData({ readyMaterials })[1];
    const { text } = captureExportText(buildActivity({
      readyMaterials,
      teacherGabarito: ["Cenário 1: cálculo antigo inconsistente."]
    }));

    expect(scenario2.metasPoupancaTotal).toBe(0);
    expect(scenario2.melhoriasTotal).toBe(100);
    expect(text).not.toContain("Exportação bloqueada");
    expect(text).not.toContain("total de metas ficou zerado");
  });

  test("poupança percentual é calculada como melhoria", () => {
    const api = loadExportInternals();
    const readyMaterials = [
      "CENÁRIO 1",
      "Receita total: R$ 4.500,00",
      "Despesas fixas: R$ 1.530,00",
      "Despesas variáveis: R$ 2.000,00",
      "CENÁRIO 2",
      "Para melhorar o orçamento, reduzir 10% das despesas variáveis."
    ];
    const scenarios = api.extractFinancialScenarioData({ readyMaterials });
    const scenario2 = scenarios[1];
    const gabarito = api.buildFinancialGabaritoFromReadyMaterials(readyMaterials).join("\n");

    expect(scenario2.melhoriasTotal).toBe(200);
    expect(scenario2.metasPoupancaTotal).toBe(0);
    expect(scenario2.summary.saldoAntesMelhoria).toBe(970);
    expect(scenario2.summary.saldoAposMelhoria).toBe(1170);
    expect(gabarito).toContain("Reduzir R$ 200,00 do gasto com despesas variáveis.");
    expect(gabarito).toContain("R$ 970,00 + R$ 200,00 = R$ 1.170,00.");
  });

  test("melhoria percentual usa o valor real do lazer", () => {
    const api = loadExportInternals();
    const readyMaterials = [
      "CENÁRIO 1",
      "Receita total: R$ 4.500,00.",
      "Despesas fixas: R$ 2.000,00.",
      "Despesas variáveis: Alimentação R$ 1.000,00. Transporte R$ 300,00. Lazer R$ 200,00.",
      "CENÁRIO 2",
      "Imprevisto: manutenção inesperada no carro de R$ 350,00.",
      "Melhoria: reduzir em 50% o gasto com Lazer do mês."
    ];
    const scenarios = api.extractFinancialScenarioData({ readyMaterials });
    const scenario2 = scenarios[1];
    const gabarito = api.buildFinancialGabaritoFromReadyMaterials(readyMaterials).join("\n");

    expect(scenario2.explicitImprovement).toMatchObject({
      type: "percentage",
      percentage: 50,
      target: "lazer",
      targetCategory: "despesa_variavel",
      baseValue: 200,
      improvementValue: 100,
      value: 100,
      calculable: true
    });
    expect(api.calculateImprovementValue(200, 50)).toBe(100);
    expect(scenario2.melhoriasTotal).toBe(100);
    expect(scenario2.summary.saldoAntesMelhoria).toBe(650);
    expect(scenario2.summary.saldoAposMelhoria).toBe(750);
    expect(gabarito).toContain("Reduzir R$ 100,00 do gasto com lazer.");
    expect(gabarito).toContain("R$ 650,00 + R$ 100,00 = R$ 750,00.");
    expect(gabarito).not.toContain("R$ 150,00");
  });

  test("cortar 30% do transporte usa o item transporte", () => {
    const api = loadExportInternals();
    const readyMaterials = [
      "CENÁRIO 1",
      "Receita total: R$ 4.500,00.",
      "Despesas fixas: R$ 2.000,00.",
      "Despesas variáveis: Alimentação R$ 1.000,00. Transporte R$ 300,00. Lazer R$ 200,00.",
      "CENÁRIO 2",
      "Cortar 30% do transporte."
    ];
    const scenario2 = api.extractFinancialScenarioData({ readyMaterials })[1];

    expect(scenario2.explicitImprovement).toMatchObject({
      type: "percentage",
      percentage: 30,
      target: "transporte",
      baseValue: 300,
      improvementValue: 90
    });
    expect(scenario2.melhoriasTotal).toBe(90);
  });

  test("economizar 20% da alimentação usa o item alimentação", () => {
    const api = loadExportInternals();
    const readyMaterials = [
      "CENÁRIO 1",
      "Receita total: R$ 4.500,00.",
      "Despesas fixas: R$ 2.000,00.",
      "Despesas variáveis: Alimentação R$ 1.000,00. Transporte R$ 300,00. Lazer R$ 200,00.",
      "CENÁRIO 2",
      "Economizar 20% da alimentação."
    ];
    const scenario2 = api.extractFinancialScenarioData({ readyMaterials })[1];

    expect(scenario2.explicitImprovement).toMatchObject({
      type: "percentage",
      percentage: 20,
      target: "alimentação",
      baseValue: 1000,
      improvementValue: 200
    });
    expect(scenario2.melhoriasTotal).toBe(200);
  });

  test("reduzir pela metade o lazer interpreta 50%", () => {
    const api = loadExportInternals();
    const readyMaterials = [
      "CENÁRIO 1",
      "Receita total: R$ 4.500,00.",
      "Despesas fixas: R$ 2.000,00.",
      "Despesas variáveis: Alimentação R$ 1.000,00. Transporte R$ 300,00. Lazer R$ 200,00.",
      "CENÁRIO 2",
      "Reduzir pela metade o lazer."
    ];
    const scenario2 = api.extractFinancialScenarioData({ readyMaterials })[1];

    expect(scenario2.explicitImprovement).toMatchObject({
      type: "percentage",
      percentage: 50,
      target: "lazer",
      baseValue: 200,
      improvementValue: 100
    });
    expect(scenario2.melhoriasTotal).toBe(100);
  });

  test("melhoria percentual com item inexistente bloqueia gabarito numérico", () => {
    const api = loadExportInternals();
    const readyMaterials = [
      "CENÁRIO 1",
      "Receita total: R$ 4.500,00.",
      "Despesas fixas: R$ 2.000,00.",
      "Despesas variáveis: Alimentação R$ 1.000,00. Transporte R$ 300,00. Lazer R$ 200,00.",
      "CENÁRIO 2",
      "Reduzir em 40% o gasto com assinatura de streaming."
    ];
    const scenarios = api.extractFinancialScenarioData({ readyMaterials });
    const scenario2 = scenarios[1];
    const validation = api.validateExportedExperience(buildActivity({
      readyMaterials,
      teacherGabarito: [
        "Cenário 1: cálculo financeiro conferido.",
        "Cenário 2: cálculo financeiro pendente."
      ]
    }));

    expect(scenario2.unresolvedPercentageImprovement).toMatchObject({
      type: "percentage",
      percentage: 40,
      target: "assinatura de streaming",
      baseValue: null,
      improvementValue: null,
      calculable: false,
      reason: "target_not_found"
    });
    expect(validation.blocking.join(" ")).toContain('melhoria percentual sem valor-base encontrado para "assinatura de streaming"');
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

  test("poupança vinda do cenário anterior não vira meta nova", () => {
    const api = loadExportInternals();
    const readyMaterials = [
      "CENÁRIO 1",
      "Receita total: R$ 3.500,00.",
      "Despesas fixas: R$ 1.800,00.",
      "Despesas variáveis: R$ 1.200,00.",
      "CENÁRIO 2",
      "Os R$ 500,00 do Cenário 1 foram para poupança. Surge um imprevisto de saúde de R$ 400,00. Para compensar, a família decide reduzir R$ 150,00 do lazer."
    ];
    const scenarios = api.extractFinancialScenarioData({ readyMaterials });
    const gabarito = api.buildFinancialGabaritoFromReadyMaterials(readyMaterials).join("\n");
    const { text } = captureExportText(buildActivity({
      readyMaterials,
      teacherGabarito: [
        "Cenário 1: cálculo antigo.",
        "Cenário 2: Meta de poupança planejada: R$ 500,00. Resultado após melhoria: -R$ 400,00 + R$ 150,00 = -R$ 250,00."
      ]
    }));

    expect(scenarios[0].despesasFixasTotal).toBe(1800);
    expect(scenarios[0].despesasVariaveisTotal).toBe(1200);
    expect(scenarios[0].saldo).toBe(500);
    expect(scenarios[1].metasPoupancaTotal).toBe(0);
    expect(scenarios[1].imprevistosTotal).toBe(400);
    expect(scenarios[1].melhoriasTotal).toBe(150);
    expect(scenarios[1].compromissoTotal).toBe(3400);
    expect(scenarios[1].saldo).toBe(100);
    expect(scenarios[1].saldoAfterImprovement).toBe(250);
    expect(gabarito).toContain("Despesas fixas: R$ 1.800,00.");
    expect(gabarito).toContain("Despesas variáveis: R$ 1.200,00.");
    expect(gabarito).toContain("Despesas totais: R$ 1.800,00 + R$ 1.200,00 = R$ 3.000,00.");
    expect(gabarito).toContain("Despesas do Cenário 1: R$ 3.000,00.");
    expect(gabarito).toContain("Despesa médica inesperada: R$ 400,00.");
    expect(gabarito).toContain("Compromisso total: R$ 3.000,00 + R$ 400,00 = R$ 3.400,00.");
    expect(gabarito).toContain("Saldo antes da melhoria: R$ 3.500,00 - R$ 3.400,00 = R$ 100,00.");
    expect(gabarito).toContain("Resultado após melhoria:\nR$ 100,00 + R$ 150,00 = R$ 250,00.");
    expect(gabarito).not.toContain("Meta de poupança planejada: R$ 500,00.");
    expect(text).not.toContain("Exportação bloqueada");
    expect(text).toContain("Resultado após melhoria: R$ 100,00 + R$ 150,00 = R$ 250,00.");
  });

  test("preserva despesas fixas e variáveis em frase compactada", () => {
    const api = loadExportInternals();
    const [scenario] = api.extractFinancialScenarioData({
      readyMaterials: [
        "CENÁRIO 1",
        "Receita total: R$ 3.500,00. Despesas fixas: R$ 1.800,00 e variáveis: R$ 1.200,00."
      ]
    });

    expect(scenario.receitaTotal).toBe(3500);
    expect(scenario.despesasFixasTotal).toBe(1800);
    expect(scenario.despesasVariaveisTotal).toBe(1200);
    expect(scenario.metasPoupancaTotal).toBe(0);
    expect(scenario.saldo).toBe(500);
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

  test("gabarito respeita melhoria explícita descrita na Etapa 5", () => {
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
    const stageImprovement = "ETAPA 5 - Teste e melhoria: testar como cortar R$ 100 do Lazer e recalcular o saldo.";
    const gabarito = api.buildFinancialGabaritoFromReadyMaterials(readyMaterials, stageImprovement).join("\n");
    const { text } = captureExportText(buildActivity({
      readyMaterials,
      stages: [
        { number: 1, title: "Preparar a base", description: "Organizar cartões de receitas e despesas." },
        { number: 2, title: "Investigar", description: "Comparar saldo inicial e compromissos." },
        { number: 3, title: "Planejar", description: "Escolher quais cartões serão reorganizados." },
        { number: 4, title: "Construir", description: "Montar o painel financeiro manipulável." },
        { number: 5, title: "Teste e melhoria", description: "Testar como cortar R$ 100 do Lazer e recalcular o saldo." },
        { number: 6, title: "Apresentar", description: "Explicar o ajuste realizado e o novo saldo." }
      ],
      teacherGabarito: ["Cenário 1: cálculo antigo inconsistente."]
    }));

    expect(api.extractExplicitImprovement(stageImprovement)).toEqual({
      action: "Cortar",
      value: 100,
      target: "lazer"
    });
    expect(gabarito).toContain("Saldo antes da melhoria: R$ 4.500,00 - R$ 4.130,00 = R$ 370,00.");
    expect(gabarito).toContain("Melhoria sugerida:\nCortar R$ 100,00 do gasto com lazer.");
    expect(gabarito).toContain("Resultado após melhoria:\nR$ 370,00 + R$ 100,00 = R$ 470,00.");
    expect(gabarito).not.toContain("Reduzir R$ 150,00 em despesas variáveis");
    expect(text).toContain("Cortar R$ 100,00 do gasto com lazer.");
    expect(text).toContain("Resultado após melhoria: R$ 370,00 + R$ 100,00 = R$ 470,00.");
    expect(text).not.toContain("Reduzir R$ 150,00 em despesas variáveis");
    expect(text).not.toContain("R$ 370,00 + R$ 150,00 = R$ 520,00");
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
    expect(api.cleanFinancialItemLabel("surge um gasto inesperado com remédios de", "imprevisto")).toBe("Gasto inesperado com remédios");
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
    expect(gabarito).toContain("Gasto inesperado com remédios: R$ 350,00.");
    expect(gabarito).toContain("Compromisso total: R$ 3.530,00 + R$ 350,00 = R$ 3.880,00.");
    expect(gabarito).toContain("Saldo antes da melhoria: R$ 4.500,00 - R$ 3.880,00 = R$ 620,00.");
    expect(gabarito).toContain("Melhoria sugerida:\nReduzir R$ 100,00 do gasto com lazer.");
    expect(gabarito).toContain("Resultado após melhoria:\nR$ 620,00 + R$ 100,00 = R$ 720,00.");
    expect(gabarito).toContain("Interpretação:\nA melhoria aumenta o saldo final e ajuda a preservar parte da poupança.");
    expect(gabarito).not.toContain("Imprevisto com surge");
    expect(gabarito).not.toContain("lazer, transporte ou compras não essenciais");
    expect(api.validateAnswerKeyText(gabarito).ok).toBe(true);
    expect(text).not.toContain("Exportação bloqueada");
    expect(text).toContain("Gasto inesperado com remédios: R$ 350,00.");
    expect(text).toContain("Reduzir R$ 100,00 do gasto com lazer.");
    expect(html).toContain(".materials-table");
    expect(html).toContain(".stage");
  });

  test("normaliza rótulos financeiros malformados e DOI corrompido", () => {
    const api = loadExportInternals();
    const genericGoal = api.buildFinancialGabaritoFromReadyMaterials([
      "CENÁRIO 1",
      "Receita total: R$ 4.500,00",
      "Despesas totais: R$ 3.000,00",
      "CENÁRIO 2",
      "há uma meta de poupança de R$ 300,00"
    ]).join("\n");
    const travelGoal = api.buildFinancialGabaritoFromReadyMaterials([
      "CENÁRIO 1",
      "Receita total: R$ 4.500,00",
      "Despesas totais: R$ 3.000,00",
      "CENÁRIO 2",
      "deseja guardar R$ 400,00 para uma viagem"
    ]).join("\n");
    const medicalUnexpected = api.buildFinancialGabaritoFromReadyMaterials([
      "CENÁRIO 1",
      "Receita total: R$ 4.500,00",
      "Despesas totais: R$ 3.000,00",
      "CENÁRIO 2",
      "surge uma despesa médica inesperada de R$ 400,00"
    ]).join("\n");
    const explicitImprovement = api.cleanFinancialItemLabel(
      "a família decide reduzir R$ 100 do gasto com lazer",
      "melhoria"
    );
    const fixedBadText = api.fixAnswerKeyText("Imprevisto com surge uma despesa médica inesperada");

    expect(genericGoal).toContain("Meta de poupança planejada: R$ 300,00.");
    expect(genericGoal).not.toContain("Meta de poupança para há");
    expect(travelGoal).toContain("Meta de poupança para viagem: R$ 400,00.");
    expect(medicalUnexpected).toContain("Despesa médica inesperada: R$ 400,00.");
    expect(medicalUnexpected).not.toContain("Imprevisto com uma médica");
    expect(explicitImprovement).toBe("Reduzir R$ 100,00 do gasto com lazer");
    expect(api.validateAnswerKeyText("Imprevisto com surge uma despesa médica inesperada").ok).toBe(false);
    expect(fixedBadText).toBe("Despesa médica inesperada.");
    expect(api.validateAnswerKeyText(fixedBadText).ok).toBe(true);
    expect(api.sanitizeReferenceText("10.29327/cb-multiplos￾olhares-educacao-1.599854"))
      .toBe("DOI: 10.29327/cb-multiplos-olhares-educacao-1.599854.");
  });

  test("sanitiza referências e padroniza DOI sem alterar o gabarito", () => {
    const api = loadExportInternals();

    expect(api.sanitizeReferenceText("10.29327/cb-multiplos-olhares￾educacao-1.599854"))
      .toBe("DOI: 10.29327/cb-multiplos-olhares-educacao-1.599854.");
    expect(api.sanitizeReferenceText("Educação, 2023. 10.29327/cb-multiplos-olhares-educacao-1.599854."))
      .toBe("Educação, 2023. DOI: 10.29327/cb-multiplos-olhares-educacao-1.599854.");
    expect(api.sanitizeReferenceText("Educação Online, 2021. DOI: 10.36556/eol.v16i38.843."))
      .toBe("Educação Online, 2021. DOI: 10.36556/eol.v16i38.843.");
    expect(api.sanitizeReferenceText("10.54751/revistafoco.v18n11-163"))
      .toBe("DOI: 10.54751/revistafoco.v18n11-163.");
    expect(api.sanitizeReferenceText("Educação Financeira<br>Ensino Fundamental. DOI: 10.1234/teste."))
      .toBe("Educação Financeira Ensino Fundamental. DOI: 10.1234/teste.");
    expect(api.sanitizeReferenceText("**Educação Financeira**. DOI: 10.1234/teste."))
      .toBe("Educação Financeira. DOI: 10.1234/teste.");
  });

  test("sanitiza gabarito e HTML final imediatamente antes da renderização", () => {
    const api = loadExportInternals();
    const dirtyHtml = "<html><body>10.29327/cb-multiplos￾olhares-educacao-1.599854</body></html>";
    const cleanHtml = api.sanitizeFinalRenderedHTML(dirtyHtml);
    const dirtyGabaritoDoi = "Referência do conteúdo usado no gabarito: 10.29327/cb-multiplos￾olhares-educacao-1.599854";
    const activity = buildActivity({
      bibliography: ["10.29327/cb-multiplos￾olhares-educacao-1.599854"],
      teacherGabarito: [
        "Cenário 1:\nReceita total: R$ 4.500,00.\nDespesas totais: R$ 3.530,00.\nSaldo final: R$ 4.500,00 - R$ 3.530,00 = R$ 970,00.",
        "Cenário 2:\nImprevisto com um conserto urgente de eletrodoméstico: R$ 450,00.",
        dirtyGabaritoDoi
      ]
    });
    const finalHtml = api.buildActivityPrintHTMLFromExperience(activity);

    expect(api.sanitizeAnswerKeyText("Imprevisto com um conserto urgente de eletrodoméstico: R$ 450,00."))
      .toBe("Conserto urgente de eletrodoméstico: R$ 450,00.");
    expect(api.sanitizeAnswerKeyText(dirtyGabaritoDoi))
      .toBe("Referência do conteúdo usado no gabarito: DOI: 10.29327/cb-multiplos-olhares-educacao-1.599854.");
    expect(api.validateFinalRenderedHTML(dirtyHtml).ok).toBe(false);
    expect(api.validateFinalRenderedHTML(cleanHtml).ok).toBe(true);
    expect(cleanHtml).toContain("DOI: 10.29327/cb-multiplos-olhares-educacao-1.599854.");
    expect(finalHtml).toContain("DOI: 10.29327/cb-multiplos-olhares-educacao-1.599854.");
    expect(finalHtml).toContain("Conserto urgente de eletrodoméstico: R$ 450,00.");
    expect(finalHtml).not.toContain("￾");
    expect(finalHtml).not.toContain("10.29327/cb-multiplos￾olhares-educacao-1.599854");
    expect(finalHtml).not.toContain("Imprevisto com um conserto urgente");
    expect(finalHtml).not.toContain("Exportação bloqueada");
  });
});
