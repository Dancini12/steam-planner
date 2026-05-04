// ============================================================
// phases.js
// Definição das 5 fases do ciclo STEAM Design Thinking
// ============================================================
//
// As fases representam o ciclo iterativo do Design Thinking
// adaptado ao contexto educacional STEAM, conforme proposto
// por Brown (2010), IDEO (2013) e Bacich e Holanda (2020).
//
// Cada fase tem:
// - Identificação visual (id, cor)
// - Descrição didática (nome, subtítulo, descrição)
// - Orientações para professor e estudantes
// - Foco avaliativo específico
// ============================================================

export const PHASES = [
  {
    id: "imersao",
    number: 1,
    name: "Imersão",
    subtitle: "Investigar e compreender o contexto",
    color: "#3FD64C",
    description:
      "Fase de pesquisa e empatia. Os estudantes investigam o problema, o contexto e os atores envolvidos. É o momento de fazer perguntas, observar a realidade e construir uma compreensão profunda do desafio antes de partir para soluções.",
    studentActions: [
      "Pesquisar sobre o tema em diferentes fontes",
      "Observar e registrar o contexto real",
      "Entrevistar pessoas envolvidas com o problema",
      "Compartilhar descobertas em grupo"
    ],
    teacherActions: [
      "Apresentar o desafio e a questão norteadora",
      "Provocar perguntas abertas e investigativas",
      "Mediar discussões e organizar achados",
      "Oferecer fontes confiáveis de pesquisa"
    ],
    evaluationFocus:
      "Avaliar a profundidade da investigação, a qualidade das fontes e a capacidade de fazer perguntas relevantes."
  },
  {
    id: "ideacao",
    number: 2,
    name: "Ideação",
    subtitle: "Pesquisa e geração de ideias",
    color: "#3B95F2",
    description:
      "Fase de criatividade e divergência. Com base na compreensão construída, os estudantes geram múltiplas ideias possíveis para solucionar o desafio. É o momento de pensar livremente, sem julgamento prévio, e depois selecionar coletivamente as ideias mais promissoras.",
    studentActions: [
      "Gerar muitas ideias sem julgamento (brainstorming)",
      "Combinar e refinar ideias em grupo",
      "Esboçar soluções em rascunhos rápidos",
      "Selecionar a ideia mais promissora com critérios claros"
    ],
    teacherActions: [
      "Propor técnicas de criatividade (brainstorming, SCAMPER)",
      "Garantir ambiente seguro para todas as ideias",
      "Mediar a convergência com critérios objetivos",
      "Apoiar a tomada de decisão coletiva"
    ],
    evaluationFocus:
      "Avaliar a fluência criativa, a originalidade e a capacidade de tomar decisões com critérios."
  },
  {
    id: "prototipagem",
    number: 3,
    name: "Prototipagem",
    subtitle: "Construir e materializar a solução",
    color: "#FF8C1A",
    description:
      "Fase de construção. Os estudantes transformam a ideia em algo tangível: um protótipo, um modelo, um circuito, uma maquete ou uma simulação. O foco é aprender fazendo, errando e ajustando. O protótipo não precisa ser perfeito — precisa ser testável.",
    studentActions: [
      "Planejar o protótipo com esboço técnico",
      "Construir o protótipo com os materiais escolhidos",
      "Documentar o processo com fotos e anotações",
      "Resolver problemas técnicos conforme aparecem"
    ],
    teacherActions: [
      "Apoiar tecnicamente sem dar a solução pronta",
      "Mediar o uso seguro de ferramentas e materiais",
      "Estimular a documentação do processo",
      "Acolher erros como oportunidades de aprendizagem"
    ],
    evaluationFocus:
      "Avaliar a coerência entre planejamento e execução, a capacidade de resolver problemas e a qualidade do registro."
  },
  {
    id: "teste",
    number: 4,
    name: "Teste",
    subtitle: "Validar e refinar a solução",
    color: "#E8358A",
    description:
      "Fase de validação. Os estudantes testam o protótipo em situações reais ou simuladas, coletam dados, identificam falhas e fazem ajustes. É o momento de aprender com os resultados e iterar a solução para deixá-la melhor.",
    studentActions: [
      "Definir critérios objetivos de avaliação",
      "Testar o protótipo em condições controladas",
      "Coletar dados quantitativos e qualitativos",
      "Refinar a solução com base nos resultados"
    ],
    teacherActions: [
      "Auxiliar na definição de métricas válidas",
      "Mediar a análise crítica dos resultados",
      "Estimular ciclos de iteração",
      "Conectar achados ao conhecimento sistematizado"
    ],
    evaluationFocus:
      "Avaliar a capacidade analítica, o uso de evidências e a disposição para refinar a partir do feedback."
  },
  {
    id: "compartilhamento",
    number: 5,
    name: "Compartilhamento",
    subtitle: "Comunicar aprendizagens à comunidade",
    color: "#A050F0",
    description:
      "Fase de comunicação e impacto. Os estudantes apresentam o que construíram e o que aprenderam para uma audiência real — colegas, família, comunidade escolar ou externa. É o momento de tornar o conhecimento público e gerar impacto além da sala de aula.",
    studentActions: [
      "Preparar materiais de apresentação",
      "Ensaiar a comunicação para diferentes públicos",
      "Apresentar com clareza e propriedade",
      "Receber e responder perguntas com fundamentação"
    ],
    teacherActions: [
      "Conectar o projeto a uma audiência autêntica",
      "Apoiar a preparação técnica e expressiva",
      "Mediar feedbacks da audiência",
      "Celebrar conquistas e reconhecer trajetórias"
    ],
    evaluationFocus:
      "Avaliar a clareza comunicativa, a propriedade no domínio do conteúdo e a postura diante do público."
  }
];

// ------------------------------------------------------------
// FUNÇÕES AUXILIARES
// ------------------------------------------------------------

// Busca uma fase pelo seu identificador.
export function getPhaseById(id) {
  return PHASES.find((phase) => phase.id === id);
}

// Lista de IDs das fases na ordem correta (útil para iterar).
export const PHASE_IDS = PHASES.map((p) => p.id);
