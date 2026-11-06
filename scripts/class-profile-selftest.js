// ============================================================
// class-profile-selftest.js
// Testes do perfil da turma (src/lib/classProfile.js).
// Sem framework. Garante que: perfil vazio não muda o prompt;
// a cascata e os "Outro" entram no texto; o resumo da Prévia
// mostra nomes de opções, não instruções técnicas. Sai !=0 em
// regressão.
// ============================================================

import {
  buildDefaultClassProfile,
  buildClassProfilePrompt,
  summarizeClassProfile,
  isClassProfileEmpty,
  CLASS_NOTES_MAX_LENGTH
} from "../src/lib/classProfile.js";

let failures = 0;
function check(name, cond, detail) {
  console.log(`[${cond ? "PASS" : "FAIL"}] ${name}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures += 1;
}

const profile = (patch) => ({ ...buildDefaultClassProfile(), ...patch });

// Perfil vazio (ou ausente, em atividades antigas) → prompt igual ao de antes.
{
  check("Perfil vazio → bloco vazio", buildClassProfilePrompt(buildDefaultClassProfile()) === "");
  check("Perfil ausente → bloco vazio", buildClassProfilePrompt(undefined) === "" && buildClassProfilePrompt(null) === "");
  check("Perfil vazio → resumo vazio", summarizeClassProfile(undefined).length === 0);
  check("Só espaços na observação conta como vazio", isClassProfileEmpty(profile({ notes: "   " })));
  check("'Outro' sem texto conta como vazio", isClassProfileEmpty(profile({ context: "outro", contextOther: "  " })));
}

// Cenário completo: rural + agricultura familiar, turma agitada.
{
  const p = profile({
    context: "rural",
    contextDetail: "agricultura-familiar",
    rhythm: "agitada",
    rhythmStrategies: ["movimento", "tarefas-curtas"],
    interests: ["esportes", "animais"],
    notes: "Muitos alunos ajudam os pais na colheita"
  });
  const prompt = buildClassProfilePrompt(p);
  check("Prompt traz o contexto com a cascata", prompt.includes("Rural / do campo — principal atividade da região: Agricultura familiar"));
  check("Prompt traz o ritmo e as estratégias", prompt.includes("agitada — costuma funcionar: atividades com movimento; tarefas curtas e cronometradas"));
  check("Prompt traz os interesses", prompt.includes("Futebol e esportes, Animais"));
  check("Prompt traz a observação do professor", prompt.includes('"Muitos alunos ajudam os pais na colheita"'));
  check("Prompt traz a regra contra estereótipos", prompt.includes("Evite estereótipos"));
  check("Prompt mantém os materiais acima do perfil", prompt.includes("restrições de materiais continuam valendo"));

  const summary = summarizeClassProfile(p);
  check("Resumo da Prévia usa nomes das opções", summary[0] === "Escola rural (do campo) · agricultura familiar", summary[0]);
  check("Resumo da Prévia não mostra instruções técnicas", !summary.join(" ").includes("Ancore"));
  check("Resumo da Prévia tem 4 linhas", summary.length === 4, String(summary.length));
}

// Segunda pergunta de outro contexto não vaza (ex.: troca de rural para urbana).
{
  const prompt = buildClassProfilePrompt(profile({ context: "urbana", contextDetail: "pecuaria" }));
  check("Detalhe de outra cascata é ignorado", !prompt.includes("Pecuária"));
}

// "Outro" digitado e limpeza do texto livre.
{
  const p = profile({
    context: "outro",
    contextOther: "Escola de assentamento",
    interests: ["outro"],
    interestsOther: "rodeio",
    notes: `  Turma "nova"\n\n com   muitos transferidos ${"x".repeat(400)}`
  });
  const prompt = buildClassProfilePrompt(p);
  check("'Outro' do contexto entra no prompt", prompt.includes("Contexto da escola: Escola de assentamento."));
  check("'Outro' dos interesses entra no prompt", prompt.includes("Interesses dos alunos: rodeio."));
  const notesLine = prompt.split("\n").find((line) => line.startsWith("- Observação do professor"));
  check("Observação vira uma linha só, sem aspas internas", notesLine && !notesLine.slice(29, -1).includes('"'), notesLine?.slice(0, 70));
  const summaryNotes = summarizeClassProfile(p).at(-1);
  check(`Observação respeita o limite de ${CLASS_NOTES_MAX_LENGTH} caracteres`, summaryNotes.length <= CLASS_NOTES_MAX_LENGTH + 2, String(summaryNotes.length));
}

// Estratégias de outro ritmo não vazam.
{
  const prompt = buildClassProfilePrompt(profile({ rhythm: "tranquila", rhythmStrategies: ["movimento", "discussao"] }));
  check("Só estratégias do ritmo escolhido entram", prompt.includes("discussão em roda") && !prompt.includes("movimento"));
}

if (failures) {
  console.error(`\n${failures} teste(s) falharam.`);
  process.exit(1);
}
console.log("\nTodos os testes do perfil da turma passaram.");
