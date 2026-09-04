// ============================================================
// exportreport-selftest.js
// Testes do parser financeiro determinístico usado para montar
// o gabarito do professor (src/lib/exportReport.js). Sem
// framework: monta cenários conhecidos e verifica os totais.
// Sai !=0 em regressão.
//
// Carrega o módulo via vm (mesma técnica de
// tests/financial-export.spec.js) em vez de exportar internos —
// exportReport.js só expõe openXWindow como API pública.
//
// Caso de origem: atividade "Orçamento em Ação" gerada em
// 2026-09-04, onde o gabarito impresso trocava Transporte (fixa)
// por Farmácia (variável) no Cenário 1 e lia "receita reduzida em
// R$ 500" como se a nova receita fosse R$ 500 no Cenário 2.
// ============================================================

import fs from "node:fs";
import vm from "node:vm";
import { normalizeBnccCodes, getBnccResumo } from "../src/lib/bnccSelector.js";

function loadExportInternals() {
  const source = fs.readFileSync("src/lib/exportReport.js", "utf8")
    .replace(/^import[^;]+;\n/gm, "")
    .replace(/export function/g, "function");
  const context = {
    console: { info() {}, warn() {}, log() {} },
    Intl,
    normalizeLearningExperience: (activity) => activity || {},
    normalizeBnccCodes,
    getBnccResumo
  };

  vm.runInNewContext(`${source}
this.__test = {
  extractFinancialScenarioData,
  buildFinancialGabaritoFromReadyMaterials
};`, context);

  return context.__test;
}

const { extractFinancialScenarioData, buildFinancialGabaritoFromReadyMaterials } = loadExportInternals();

let failures = 0;
function check(name, cond, detail) {
  console.log(`[${cond ? "PASS" : "FAIL"}] ${name}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures += 1;
}

const READY_MATERIALS = [
  "CENÁRIO 1 - Situação Inicial: Uma família tem uma Receita Mensal total de R$ 4.500,00. Suas Despesas Fixas são: Aluguel (R$ 1.500,00), Energia (R$ 250,00), Água (R$ 100,00), Internet (R$ 80,00), Transporte (R$ 200,00). As Despesas Variáveis estimadas são: Alimentação (R$ 1.000,00), Lazer (R$ 300,00), Farmácia (R$ 120,00). O objetivo é destinar 10% da receita para uma poupança de emergência. Calcule o Saldo Financeiro da família e o valor destinado à poupança.",
  "CENÁRIO 2 - Imprevisto e Ajuste: No mês seguinte, a família enfrenta um imprevisto: o valor da energia aumenta 20% e há uma despesa extra não prevista de R$ 350,00 com manutenção de um eletrodoméstico. Além disso, a receita de um dos membros da família será reduzida em R$ 500,00 neste mês. Proponha ajustes nas despesas variáveis para que a família consiga cobrir os gastos e ainda destinar pelo menos 5% da nova receita para a poupança de emergência."
];

const financialData = extractFinancialScenarioData({ readyMaterials: READY_MATERIALS });
const [c1, c2] = financialData;

// ---- Cenário 1 ----
check("Cenário 1: receita = R$4.500", c1.receitaTotal === 4500, `recebido ${c1.receitaTotal}`);
check("Cenário 1: despesas fixas = R$2.130 (inclui Transporte)", c1.despesasFixasTotal === 2130, `recebido ${c1.despesasFixasTotal}`);
check("Cenário 1: despesas variáveis = R$1.420 (inclui Farmácia)", c1.despesasVariaveisTotal === 1420, `recebido ${c1.despesasVariaveisTotal}`);
check("Cenário 1: saldo = R$950", c1.saldo === 950, `recebido ${c1.saldo}`);
check("Cenário 1: meta de poupança = 10% de R$4.500 = R$450", c1.savingsGoalValue === 450, `recebido ${c1.savingsGoalValue}`);

const c1Transporte = c1.structured.despesasFixas.find((i) => /transporte/i.test(i.descricao || i.rawLabel || ""));
const c1Farmacia = c1.structured.despesasVariaveis.find((i) => /farm[aá]cia/i.test(i.descricao || i.rawLabel || ""));
check("Cenário 1: Transporte classificado como despesa FIXA", Boolean(c1Transporte), JSON.stringify(c1.structured.despesasFixas.map((i) => i.rawLabel)));
check("Cenário 1: Farmácia classificada como despesa VARIÁVEL", Boolean(c1Farmacia), JSON.stringify(c1.structured.despesasVariaveis.map((i) => i.rawLabel)));

// ---- Cenário 2 ----
check("Cenário 2: receita = R$4.500 - R$500 = R$4.000 (não R$500)", c2.receitaTotal === 4000, `recebido ${c2.receitaTotal}`);
check(
  "Cenário 2: despesas anteriores ajustadas = R$3.550 + energia(+20%: +R$50) = R$3.600",
  c2.despesasAnterioresTotal === 3600,
  `recebido ${c2.despesasAnterioresTotal}`
);
check("Cenário 2: imprevisto de manutenção = R$350", c2.imprevistosTotal === 350, `recebido ${c2.imprevistosTotal}`);
check("Cenário 2: compromisso total = R$3.950", c2.compromissoTotal === 3950, `recebido ${c2.compromissoTotal}`);
check("Cenário 2: saldo = R$4.000 - R$3.950 = R$50", c2.saldo === 50, `recebido ${c2.saldo}`);
check("Cenário 2: meta de poupança = 5% de R$4.000 = R$200", c2.savingsGoalValue === 200, `recebido ${c2.savingsGoalValue}`);

// ---- Gabarito final: a melhoria sugerida deve fechar a meta de poupança ----
const gabarito = buildFinancialGabaritoFromReadyMaterials(READY_MATERIALS);
const improvementCard = gabarito[gabarito.length - 1] || "";
check(
  "Melhoria sugerida cobre o valor que falta para a meta de poupança (R$150, não um placeholder arbitrário)",
  /reduzir\s+r\$\s*150,00/i.test(improvementCard),
  improvementCard
);

// ---- Regressão: cenário simples sem ajustes continua funcionando ----
const simpleData = extractFinancialScenarioData({
  readyMaterials: [
    "CENÁRIO 1 - Uma família recebe R$ 3.000,00 de salário. Despesas: Aluguel R$ 900,00, Alimentação R$ 600,00, Lazer R$ 200,00."
  ]
});
check("Cenário simples: receita = R$3.000", simpleData[0].receitaTotal === 3000, `recebido ${simpleData[0].receitaTotal}`);
check("Cenário simples: saldo = R$3.000 - R$1.700 = R$1.300", simpleData[0].saldo === 1300, `recebido ${simpleData[0].saldo}`);

if (failures) {
  console.log(`\n${failures} falha(s).`);
  process.exit(1);
}
console.log("\nOK — parser financeiro (gabarito determinístico) validado.");
