// ============================================================
// evaluation.js
// Estrutura da Avaliação em Fases — núcleo da pesquisa
// ============================================================
//
// A Avaliação em Fases é a abordagem que esta pesquisa de
// mestrado propõe e operacionaliza. Fundamenta-se em:
//
// - Hadji (2001): avaliação como diálogo formativo
// - Luckesi (2011): avaliação como ato amoroso e construtivo
// - Earl (2003): avaliação como aprendizagem (Assessment as Learning)
// - Wiggins e McTighe (2005): backward design e compreensão
// - Andrade (2005): rubricas e autoavaliação no processo
//
// Diferente da avaliação somativa tradicional (uma nota
// final), a Avaliação em Fases acontece DURANTE cada fase
// do projeto, formando um histórico processual rico e
// contínuo da aprendizagem dos estudantes.
//
// Cada fase tem 3 componentes operacionais:
// 1. Plano pedagógico (intencionalidade do professor)
// 2. Diário de bordo (registros do que aconteceu)
// 3. Avaliação em fases (análise estruturada)
// ============================================================

// ------------------------------------------------------------
// NÍVEIS DE DESENVOLVIMENTO
// ------------------------------------------------------------
// Quatro níveis de desenvolvimento que substituem as notas
// tradicionais. Cada nível descreve um estado qualitativo
// da aprendizagem da turma na fase, sem hierarquia rígida.
// ------------------------------------------------------------

export const EVALUATION_LEVELS = [
  {
    id: "iniciando",
    label: "Iniciando",
    color: "#C9A14A",
    description:
      "A turma está começando a se apropriar dos conceitos e práticas da fase. Há dúvidas, hesitações e dependência de mediação."
  },
  {
    id: "em-desenvolvimento",
    label: "Em desenvolvimento",
    color: "#3B95F2",
    description:
      "A turma demonstra avanço significativo, com momentos de autonomia e momentos que ainda exigem apoio do professor."
  },
  {
    id: "consolidado",
    label: "Consolidado",
    color: "#5B8266",
    description:
      "A turma demonstra domínio dos conceitos e práticas da fase, atuando com autonomia e tomando decisões fundamentadas."
  },
  {
    id: "expandido",
    label: "Expandido",
    color: "#A050F0",
    description:
      "A turma transcende o esperado, fazendo conexões originais, ensinando colegas e propondo novos caminhos."
  }
];

// ------------------------------------------------------------
// INSTRUMENTOS AVALIATIVOS DISPONÍVEIS
// ------------------------------------------------------------
// Nove instrumentos que podem ser usados ao longo das fases.
// O professor escolhe quais aplicar em cada fase conforme a
// natureza das atividades e dos aprendizados em foco.
// ------------------------------------------------------------

export const EVALUATION_INSTRUMENTS = [
  {
    id: "observacao",
    name: "Observação dirigida",
    description:
      "Acompanhamento sistemático da turma em ação, com registro de comportamentos, falas e interações relevantes."
  },
  {
    id: "diario",
    name: "Diário de bordo do estudante",
    description:
      "Registros pessoais dos estudantes sobre o que aprenderam, o que sentiram e o que ainda querem investigar."
  },
  {
    id: "rubrica",
    name: "Rubrica analítica",
    description:
      "Critérios objetivos e descritores claros para avaliação de produções em níveis qualitativos."
  },
  {
    id: "autoavaliacao",
    name: "Autoavaliação",
    description:
      "Reflexão estruturada em que o estudante avalia o próprio processo e produto."
  },
  {
    id: "avaliacao-pares",
    name: "Avaliação por pares",
    description:
      "Feedback construtivo entre estudantes sobre as produções uns dos outros, com critérios claros."
  },
  {
    id: "portfolio",
    name: "Portfólio de processo",
    description:
      "Coletânea organizada de produções que mostra a trajetória da aprendizagem ao longo do projeto."
  },
  {
    id: "apresentacao",
    name: "Apresentação oral",
    description:
      "Comunicação dos achados para audiência real, com avaliação da clareza, propriedade e postura."
  },
  {
    id: "produto-final",
    name: "Produto final",
    description:
      "Análise da solução construída quanto à coerência com o desafio, qualidade técnica e impacto."
  },
  {
    id: "prova-contextualizada",
    name: "Prova contextualizada",
    description:
      "Avaliação escrita com situações-problema próximas ao contexto do projeto, não desconectadas dele."
  }
];

// ------------------------------------------------------------
// SUGESTÕES DE INSTRUMENTOS POR FASE
// ------------------------------------------------------------
// Para cada fase, indicamos os instrumentos mais coerentes
// com a natureza das atividades. São sugestões, não regras —
// o professor decide o que faz sentido na sua turma.
// ------------------------------------------------------------

export const SUGGESTED_INSTRUMENTS_BY_PHASE = {
  imersao: ["observacao", "diario", "autoavaliacao"],
  ideacao: ["observacao", "rubrica", "avaliacao-pares"],
  prototipagem: ["observacao", "diario", "rubrica", "portfolio"],
  teste: ["rubrica", "autoavaliacao", "produto-final"],
  compartilhamento: ["apresentacao", "rubrica", "avaliacao-pares", "portfolio"]
};

// ------------------------------------------------------------
// FUNÇÕES AUXILIARES
// ------------------------------------------------------------

export function getInstrumentById(id) {
  return EVALUATION_INSTRUMENTS.find((i) => i.id === id);
}

export function getLevelById(id) {
  return EVALUATION_LEVELS.find((l) => l.id === id);
}

export function getSuggestedInstrumentsForPhase(phaseId) {
  const ids = SUGGESTED_INSTRUMENTS_BY_PHASE[phaseId] || [];
  return ids.map((id) => getInstrumentById(id)).filter(Boolean);
}
