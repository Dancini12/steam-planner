export function suggestProjectContinuity(project = {}, limit = 4) {
  const theme = project.theme || project.title || "tema trabalhado";
  const grade = project.grade || "turma";

  return [
    {
      title: `Aprofundar ${theme}`,
      description: `Retomar evidencias do projeto anterior e propor uma investigacao mais aplicada para a ${grade}.`
    },
    {
      title: "Prototipo melhorado",
      description: "Usar os resultados dos estudantes para revisar materiais, criterios de teste e produto final."
    },
    {
      title: "Conexao com comunidade",
      description: "Transformar o desafio em uma solucao comunicavel para escola, familias ou territorio."
    },
    {
      title: "Nova habilidade BNCC",
      description: "Manter o tema central e ampliar o foco para uma habilidade complementar."
    }
  ].slice(0, limit);
}
