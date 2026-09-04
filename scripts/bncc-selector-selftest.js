// ============================================================
// bncc-selector-selftest.js
// Testes do seletor de habilidades BNCC (src/lib/bnccSelector.js).
// Sem framework: verifica que disciplinas sem componente oficial
// mapeado (ex.: "Educação Financeira") não caem numa busca cega
// no banco inteiro (todas as áreas), o que gerava sugestões sem
// nenhuma relação com o tema (ex.: EF09MA16 — geometria analítica
// — em atividades de orçamento familiar). Sai !=0 em regressão.
// ============================================================

import { selectBnccHabilidades } from "../src/lib/bnccSelector.js";

let failures = 0;
function check(name, cond, detail) {
  console.log(`[${cond ? "PASS" : "FAIL"}] ${name}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures += 1;
}

// Caso de origem: 3 atividades reais de "Orçamento familiar" (2026-09-04)
// vieram com códigos de Língua Portuguesa/Geografia sem relação nenhuma
// com o conteúdo, porque "Educação Financeira" não tinha componente BNCC
// mapeado e a busca caía no banco inteiro.
{
  const result = selectBnccHabilidades({
    grade: "9º ano - Ensino Fundamental",
    discipline: "Educação Financeira",
    theme: "Orçamento Familiar: Equilibrando Receitas e Despesas",
    steamCompetencies: ["mathematics"],
    limit: 5
  });
  check(
    "Educação Financeira → só sugere habilidades de Matemática",
    result.length > 0 && result.every((h) => h.componente === "Matemática"),
    result.map((h) => `${h.codigo} (${h.componente})`).join(", ")
  );
}

// Física/Química/Biologia não são componentes próprios no Fundamental —
// a BNCC cobre esses temas em Ciências.
for (const discipline of ["Física", "Química", "Biologia"]) {
  const result = selectBnccHabilidades({
    grade: "8º ano - Ensino Fundamental",
    discipline,
    theme: "Energia e transformações",
    steamCompetencies: ["science"],
    limit: 3
  });
  check(
    `${discipline} → só sugere habilidades de Ciências`,
    result.length > 0 && result.every((h) => h.componente === "Ciências"),
    result.map((h) => `${h.codigo} (${h.componente})`).join(", ")
  );
}

// Regressão: discipline já mapeada antes continua funcionando.
{
  const result = selectBnccHabilidades({
    grade: "7º ano - Ensino Fundamental",
    discipline: "Matemática",
    theme: "Frações e decimais",
    steamCompetencies: ["mathematics"],
    limit: 3
  });
  check(
    "Matemática (já mapeada) continua restringindo ao componente",
    result.length > 0 && result.every((h) => h.componente === "Matemática"),
    result.map((h) => h.codigo).join(", ")
  );
}

if (failures) {
  console.log(`\n${failures} falha(s).`);
  process.exit(1);
}
console.log("\nOK — seletor de habilidades BNCC validado.");
