export const ACCESSIBILITY_ADAPTATIONS = [
  {
    id: "daltonismo",
    label: "Alternativas para daltonismo",
    guidance:
      "Quando a atividade usar cores para classificar, filtrar, separar grupos, identificar respostas ou destacar informações, use também padrões não dependentes de cor: listras, bolinhas, zigue-zague, símbolos, etiquetas com texto, formatos diferentes ou furos. Sempre explique aos alunos que a identificação não deve depender apenas da cor.",
    materialGuidance:
      "Prepare etiquetas, cartões ou peças com dupla codificação: cor + padrão visual/tátil. Exemplos: vermelho com listras, azul com bolinhas, verde com zigue-zague, amarelo com furos ou marcação em relevo."
  },
  {
    id: "baixa_visao",
    label: "Baixa visão",
    guidance:
      "Use contraste alto, letras ampliadas, espaçamento generoso, poucos elementos por página ou cartão e organização visual simples. Evite depender de detalhes pequenos para concluir a tarefa.",
    materialGuidance:
      "Priorize folhas em tamanho maior, canetas grossas, cartões com fonte ampliada e materiais com contorno bem marcado."
  },
  {
    id: "grupos_colaborativos",
    label: "Grupos colaborativos",
    guidance:
      "Organize papéis claros nos grupos para incluir estudantes com diferentes ritmos: leitor, registrador, montador, relator, observador e responsável pelos materiais.",
    materialGuidance:
      "Distribua os materiais por função e deixe visível quem será responsável por buscar, montar, registrar e guardar cada item."
  }
];

export function getAccessibilityAdaptations(ids = []) {
  const selected = new Set(ids);
  return ACCESSIBILITY_ADAPTATIONS.filter((item) => selected.has(item.id));
}
