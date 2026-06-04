const STEAM_AREA_NAMES = { S: 'Ciências', T: 'Tecnologia', E: 'Engenharia', A: 'Arte', M: 'Matemática' };
const ALL_STEAM = ['S', 'T', 'E', 'A', 'M'];

export function suggestProjectContinuity(project = {}, profile = null, limit = 4) {
  const theme = project.theme || project.title || 'tema trabalhado';
  const grade = project.grade || 'turma';
  const steam = project.steam
    || Object.keys(project.steamMatrix || {}).filter((k) => ALL_STEAM.includes(k));

  const suggestions = [];

  // 1. Conectar com tema que o professor já explorou (aprendizado do perfil)
  const profileThemes = profile?.top_themes || [];
  const otherTheme = profileThemes.find((t) => t.value && t.value !== theme && t.value !== project.title);
  if (otherTheme) {
    suggestions.push({
      title: `Conectar com "${otherTheme.value}"`,
      description: `Você já trabalhou "${otherTheme.value}" com essa turma. Crie uma ponte entre os dois temas para consolidar aprendizagens e ampliar conexões disciplinares.`,
    });
  }

  // 2. Área STEAM ainda não usada nesta atividade (análise de lacunas)
  const unusedAreas = ALL_STEAM.filter((a) => !steam.includes(a));
  if (unusedAreas.length > 0) {
    const nextArea = unusedAreas[0];
    suggestions.push({
      title: `Ampliar com ${STEAM_AREA_NAMES[nextArea]}`,
      description: `Esta atividade ainda não integrou ${STEAM_AREA_NAMES[nextArea]}. Inclua essa área na próxima proposta para enriquecer a abordagem com mais perspectivas disciplinares.`,
    });
  }

  // 3. Protótipo revisado com base em evidências dos alunos
  suggestions.push({
    title: 'Revisitar e melhorar',
    description: `Use os registros e produções dos alunos para revisar materiais, critérios de teste e o produto final. O que funcionou bem? O que deve mudar para a ${grade}?`,
  });

  // 4. Conexão com a comunidade
  suggestions.push({
    title: 'Conexão com a comunidade',
    description: `Transforme o desafio em uma solução comunicável para escola, famílias ou território. Apresentar para a comunidade real fortalece o protagonismo e dá significado social ao que foi aprendido.`,
  });

  // 5. Nova habilidade BNCC no mesmo tema
  suggestions.push({
    title: 'Nova habilidade BNCC',
    description: `Mantenha "${theme}" como fio condutor e amplie o foco para uma habilidade BNCC complementar, conectando diferentes componentes curriculares da ${grade}.`,
  });

  // 6. Aprofundar o tema com investigação mais aplicada
  suggestions.push({
    title: `Aprofundar: ${theme}`,
    description: `Retome as evidências do projeto anterior e proponha uma investigação mais aplicada, partindo das descobertas já feitas com a ${grade}.`,
  });

  return suggestions.slice(0, limit);
}
