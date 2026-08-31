// ============================================================
// generator-selftest.js
// Testes das regras sistêmicas do gerador de planos de aula
// (src/lib/ai/generationContract.js). Sem framework: monta
// entradas conhecidas e verifica a saída. Sai !=0 em regressão.
// ============================================================

import {
  buildAllowedSet,
  findForbiddenResources,
  extractMentionedResources,
  stageTitlesForModality,
  inferModality,
  checkConsistency,
  deterministicCleanup,
  MAKER_MODALITY_IDS
} from "../src/lib/ai/generationContract.js";

let failures = 0;
function check(name, cond, detail) {
  console.log(`[${cond ? "PASS" : "FAIL"}] ${name}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures += 1;
}

// 1. MaterialGuard — recursos fora da lista do professor
{
  const allowed = buildAllowedSet(["folha de caderno", "lápis", "caneta"]);
  const bad = findForbiddenResources(
    "Monte o gráfico com palitos de picolé e régua; use moedas como fichas e fios de lã para ligar os pontos.",
    allowed
  );
  check("detecta régua/palito/moeda/fio fora da lista", ["regua", "palito", "moeda", "fio"].every((r) => bad.includes(r)), bad.join(","));

  const clean = findForbiddenResources(
    "Desenhe o gráfico na folha do caderno com o lápis e calcule as variações; anote com a caneta.",
    allowed
  );
  check("texto só com materiais permitidos → nada barrado", clean.length === 0, clean.join(","));

  check("extractMentionedResources acha 'computador'", extractMentionedResources("Pesquise no computador da sala").includes("computador"));
}

// 2. Modalidade maker
{
  check("stageTitlesForModality(calculo_analise) tem 6 títulos", stageTitlesForModality("calculo_analise").length === 6);
  check("modalidade desconhecida → títulos neutros", stageTitlesForModality("xyz")[0].includes("ETAPA 1"));
  check(
    "inferModality com só papel/lápis → calculo_analise",
    inferModality({ availableMaterials: "folha de caderno; lápis; caneta", activityText: "simular variações e calcular porcentagem" }) === "calculo_analise"
  );
  check("todas as modalidades expostas", MAKER_MODALITY_IDS.length >= 5);
}

// 3. Auditoria de coerência — atividade ruim
{
  const badActivity = {
    theme: "Simulador de mercado financeiro pessoal",
    objective: "Simular o mercado financeiro para compreender investimentos",
    problem: "Como visualizar variações de um investimento?",
    finalProduct: "Simulador físico com palitos, moedas e fios de lã",
    materials: ["folha de caderno", "lápis", "caneta", "régua", "palitos de picolé", "moedas", "fios de lã"],
    stages: [{ title: "ETAPA 1", description: "Monte a base com palitos e conecte os valores com fios de lã." }],
    readyMaterials: [
      "CENÁRIO 1 - Você investe R$ 1.000,00; sobe 10%, cai 5%, sobe 15%.",
      "TABELA DE TESTE - Cenário | Receita Total | Despesas Fixas | Despesas Variáveis | Saldo Inicial | Melhoria Aplicada | Saldo Final Após Melhoria"
    ],
    teacherGabarito: [
      { type: "calculo", text: "analisar o cenário, aplicar o protótipo ou procedimento planejado, registrar evidências" }
    ],
    bncc: ["EF06MA21", "EF06MA22", "EF06MA14"],
    bnccJustification: {}
  };
  const { pass, violations } = checkConsistency(badActivity, {
    strictMaterials: true,
    availableMaterialsList: ["folha de caderno", "lápis", "caneta"]
  });
  const kinds = new Set(violations.map((v) => v.check));
  check("atividade ruim NÃO passa", pass === false);
  check("acusa materiais fora da lista", kinds.has("materiais"), [...kinds].join(","));
  check("acusa gabarito genérico/sem número", kinds.has("gabarito"));
  check("acusa template financeiro reaproveitado", kinds.has("template"));
  check("acusa BNCC sem justificativa", kinds.has("bncc"));
  check("acusa produto inviável", kinds.has("produto"));

  const cleaned = deterministicCleanup(badActivity, violations);
  check("deterministicCleanup gera avisos", Array.isArray(cleaned._warnings) && cleaned._warnings.length > 0);
}

// 4. Auditoria — atividade boa passa
{
  const goodActivity = {
    theme: "Variação percentual de um investimento",
    objective: "Analisar como variações percentuais afetam o valor de um investimento ao longo do tempo, usando cálculo e gráfico para comparar cenários",
    problem: "Como calcular e comparar o efeito de altas e quedas percentuais sobre um investimento?",
    finalProduct: "Gráfico no caderno com a evolução do investimento e a comparação de dois cenários",
    materials: ["folha de caderno - 2 por grupo", "lápis - 1 por aluno", "caneta - 1 por aluno"],
    stages: Array.from({ length: 6 }, (_, i) => ({ title: `ETAPA ${i + 1}`, description: "Os alunos calculam a variação percentual e registram o novo valor no gráfico, comparando os cenários." })),
    dataPlan: { collected: ["valor inicial", "variação"], calculated: ["valor após cada mês"], compared: ["cenário 1 x cenário 2"] },
    testTable: { columns: ["Mês", "Variação (%)", "Valor anterior", "Valor final"], rows: [] },
    readyMaterials: ["CENÁRIO 1 - R$ 1.000; +10%, -5%, +15%.", "CENÁRIO 2 - No 4º mês, -20%; aporte de R$ 200."],
    teacherGabarito: [
      { type: "calculo", text: "Mês 1: 1000 x 1,10 = R$ 1.100,00. Mês 2: 1100 x 0,95 = R$ 1.045,00. Mês 3: 1045 x 1,15 = R$ 1.201,75. O investimento cresceu apesar da queda no mês 2." }
    ],
    bncc: ["EF06MA02"],
    bnccJustification: { EF06MA02: "Etapa 3 — cálculo da variação percentual mês a mês" },
    glossary: ["valor do investimento", "variação percentual", "cenário"]
  };
  const { pass } = checkConsistency(goodActivity, {
    strictMaterials: true,
    availableMaterialsList: ["folha de caderno", "lápis", "caneta"]
  });
  check("atividade coerente PASSA", pass === true);
}

console.log(failures === 0 ? "\nOK — regras do gerador validadas." : `\n${failures} verificação(ões) falharam.`);
process.exit(failures === 0 ? 0 : 1);
