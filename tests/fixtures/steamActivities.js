const baseStages = [
  { number: 1, title: "Preparar materiais e organizar grupos", description: "Separar materiais, organizar equipes, revisar o desafio e registrar a hipótese inicial." },
  { number: 2, title: "Construir partes principais", description: "Construir o painel, protótipo, mapa, roteiro ou circuito com os materiais disponíveis." },
  { number: 3, title: "Criar mecanismo de interação", description: "Criar cartões, comandos, regras ou elementos móveis para simular decisões e coletar evidências." },
  { number: 4, title: "Testar com situação real", description: "Aplicar o produto em um cenário da turma, observar resultados, registrar dados e identificar falhas." },
  { number: 5, title: "Ajustar e testar novamente", description: "Revisar a solução, aplicar uma melhoria, testar novamente e comparar o resultado obtido." },
  { number: 6, title: "Apresentar produto e evidências", description: "Apresentar o produto final, explicar evidências, justificar decisões e socializar melhorias." }
];

const baseMaterials = [
  "Cartolina: 1 folha por grupo — base para o painel ou protótipo — —",
  "Fichas de papel: 8 a 12 fichas por grupo — registrar dados e evidências — —",
  "Tesoura sem ponta: 1 unidade por grupo — recortar elementos móveis — Segura para o E.F.",
  "Canetinhas coloridas: 1 conjunto por grupo — diferenciar informações — —",
  "Notas adesivas coloridas: 1 bloco por grupo — simular ajustes e melhorias — —"
];

const baseSteamConnection = {
  science: "Investiga evidências e resultados observáveis.",
  technology: "Organiza registros e apoia a comunicação das soluções.",
  engineering: "Planeja, constrói, testa e ajusta o produto.",
  art: "Cuida da composição visual e da clareza da apresentação.",
  mathematics: "Compara dados antes e depois do teste."
};

const baseAssessmentRubric = [
  { criterion: "Investigação", observation: "Usa dados, fontes ou evidências para compreender o problema." },
  { criterion: "Construção", observation: "Constrói produto coerente com o desafio e com os materiais." },
  { criterion: "Teste e melhoria", observation: "Registra falhas, aplica ajuste e compara resultados." },
  { criterion: "Comunicação", observation: "Apresenta produto, evidências e justificativas com clareza." }
];

function scenarioLines(context) {
  return [
    "CENÁRIO 1",
    context,
    "TABELA DE TESTE - Cenário/Teste | Resultado Inicial | Falha Observada | Melhoria Aplicada | Resultado Após Melhoria."
  ];
}

function activity(overrides) {
  return {
    title: overrides.title,
    theme: overrides.theme,
    discipline: overrides.discipline,
    grade: "Ensino Fundamental II",
    duration: "2 aulas",
    objective: overrides.objective || "Investigar um problema real, construir uma solução testável, registrar evidências e propor melhorias.",
    problem: overrides.problem || `Como aplicar ${overrides.theme.toLowerCase()} para resolver uma situação prática da escola?`,
    mission: overrides.mission || "A equipe deve analisar o desafio, construir uma solução, testar com situação real, registrar evidências, ajustar e apresentar o resultado.",
    makerChallenge: overrides.makerChallenge || "Construir um produto manipulável, testar com critérios simples, registrar falhas e melhorar pelo menos um elemento antes da apresentação.",
    finalProduct: overrides.finalProduct,
    materials: baseMaterials,
    materialFunctions: baseMaterials,
    readyMaterials: overrides.readyMaterials,
    teacherGabarito: overrides.teacherGabarito || ["Resposta livre."],
    bibliography: overrides.bibliography,
    steamConnection: baseSteamConnection,
    assessmentRubric: overrides.assessmentRubric || baseAssessmentRubric,
    stages: baseStages,
    expectedReferenceTerm: overrides.expectedReferenceTerm,
    openEnded: Boolean(overrides.openEnded),
    expectedText: overrides.expectedText || null
  };
}

export const validationActivities = [
  activity({
    title: "Matematica em escala",
    theme: "Area, perimetro e escala",
    discipline: "Matemática",
    readyMaterials: scenarioLines("Medidas do canteiro: comprimento 4 m, largura 3 m. Construir maquete em escala, calcular area e perimetro, testar proporcao e ajustar legenda."),
    finalProduct: "Maquete em escala apresentada com tabela de medidas, calculos conferidos, registro do teste de proporcao e melhoria aplicada.",
    bibliography: ["BRASIL. Ministerio da Educacao. Base Nacional Comum Curricular. Brasilia: MEC, 2018."],
    expectedReferenceTerm: "Base Nacional"
  }),
  activity({
    title: "Orcamento familiar maker",
    theme: "Educacao financeira e orcamento",
    discipline: "Educação Financeira",
    readyMaterials: [
      "CENÁRIO 1",
      "Receitas: Pai R$ 2.500,00; Mae R$ 1.800,00",
      "Despesas fixas: Aluguel R$ 1.200,00; Escola R$ 400,00; Agua/Luz R$ 300,00; Internet R$ 100,00",
      "Despesas variaveis: Alimentacao R$ 1.500,00; Transporte R$ 250,00; Lazer R$ 200,00",
      "CENÁRIO 2",
      "A familia quer economizar R$ 400,00 para uma viagem.",
      "TABELA DE TESTE - Cenário | Receita Total | Despesas Fixas | Despesas Variáveis | Saldo Inicial | Melhoria Aplicada | Saldo Final Após Melhoria."
    ],
    teacherGabarito: ["Cenário 1: calculo antigo inconsistente."],
    finalProduct: "Painel de orcamento apresentado com receitas, despesas, meta de poupanca, tabela de teste e melhoria aplicada.",
    bibliography: ["BANCO CENTRAL DO BRASIL. Caderno de educacao financeira: gestao de financas pessoais. Brasilia: Banco Central do Brasil, 2013."],
    expectedReferenceTerm: "Banco Central",
    expectedText: "Meta de poupança para viagem: R$ 400,00."
  }),
  activity({
    title: "Leitura critica em painel",
    theme: "Interpretacao de texto e reescrita",
    discipline: "Língua Portuguesa",
    readyMaterials: scenarioLines("Texto-base sobre campanha escolar. Identificar tese, evidencias, inferencia, publico-alvo, reescrever trecho e testar clareza com outra equipe."),
    finalProduct: "Painel de leitura critica com respostas justificadas, reescrita colaborativa, evidencias do texto e apresentacao oral.",
    bibliography: ["BRASIL. Ministerio da Educacao. Base Nacional Comum Curricular. Brasilia: MEC, 2018."],
    expectedReferenceTerm: "Base Nacional",
    openEnded: true
  }),
  activity({
    title: "Filtro de agua experimental",
    theme: "Misturas e filtracao",
    discipline: "Ciências",
    readyMaterials: scenarioLines("Hipotese: camadas de areia, algodao e pedrinhas alteram a aparencia da agua. Montar filtro, observar, registrar resultado, revisar camada filtrante e testar novamente."),
    finalProduct: "Prototipo de filtro apresentado com hipotese, procedimento, tabela de observacao, resultado do teste e melhoria aplicada.",
    bibliography: ["BRASIL. Ministerio da Educacao. Base Nacional Comum Curricular. Brasilia: MEC, 2018."],
    expectedReferenceTerm: "Base Nacional"
  }),
  activity({
    title: "Fonte historica em linha do tempo",
    theme: "Memoria e fontes historicas",
    discipline: "História",
    readyMaterials: scenarioLines("Fonte simulada: carta de morador do bairro. Analisar contexto, temporalidade, personagens, causa, consequencia e montar linha do tempo revisada."),
    finalProduct: "Linha do tempo visual com analise da fonte, evidencias registradas, comparacao historica e apresentacao das conclusoes.",
    bibliography: ["BRASIL. Ministerio da Educacao. Base Nacional Comum Curricular. Brasilia: MEC, 2018."],
    expectedReferenceTerm: "Base Nacional",
    openEnded: true
  }),
  activity({
    title: "Mapa do territorio escolar",
    theme: "Territorio, paisagem e mobilidade",
    discipline: "Geografia",
    readyMaterials: scenarioLines("Mapa simplificado do entorno da escola. Marcar rotas, escala aproximada, paisagem, pontos de risco, dados socioambientais e melhoria territorial."),
    finalProduct: "Mapa colaborativo apresentado com legenda, escala, registro de evidencias, proposta de melhoria territorial e justificativa da equipe.",
    bibliography: ["BRASIL. Ministerio da Educacao. Base Nacional Comum Curricular. Brasilia: MEC, 2018."],
    expectedReferenceTerm: "Base Nacional"
  }),
  activity({
    title: "Composicao visual da turma",
    theme: "Arte, composicao e identidade",
    discipline: "Arte",
    readyMaterials: scenarioLines("Referencias visuais da turma. Criar composicao artistica, testar contraste, revisar comunicacao visual, registrar apreciacao estetica e apresentar processo criativo."),
    finalProduct: "Composicao visual autoral apresentada com registro do processo criativo, teste de leitura visual e melhoria aplicada.",
    bibliography: ["BRASIL. Ministerio da Educacao. Base Nacional Comum Curricular. Brasilia: MEC, 2018."],
    expectedReferenceTerm: "Base Nacional",
    openEnded: true
  }),
  activity({
    title: "Jogo cooperativo seguro",
    theme: "Praticas corporais cooperativas",
    discipline: "Educação Física",
    readyMaterials: scenarioLines("Criar regra de jogo cooperativo, testar movimento corporal, observar seguranca, adaptar participacao, registrar cooperacao e apresentar reflexao."),
    finalProduct: "Jogo cooperativo adaptado apresentado com regras, registro de participacao, evidencias de seguranca e melhoria apos teste.",
    bibliography: ["BRASIL. Ministerio da Educacao. Base Nacional Comum Curricular. Brasilia: MEC, 2018."],
    expectedReferenceTerm: "Base Nacional"
  }),
  activity({
    title: "School routine vocabulary",
    theme: "Vocabulary and classroom commands",
    discipline: "Língua Inglesa",
    readyMaterials: scenarioLines("Vocabulary cards: school, recycle, save, help. Create short English commands, test oralidade, revisar frases pouco claras and present the bilingual panel."),
    finalProduct: "Painel bilingue com vocabulary cards, comandos em ingles, registro de teste oral e melhoria das frases.",
    bibliography: ["COUNCIL OF EUROPE. Common European Framework of Reference for Languages: learning, teaching, assessment. Cambridge: Cambridge University Press, 2001."],
    expectedReferenceTerm: "Common European"
  }),
  activity({
    title: "Circuito de alerta",
    theme: "Robotica e sensores",
    discipline: "Robótica",
    readyMaterials: scenarioLines("Circuito simples com LED e sensor simulado. Montar componentes, testar funcionamento, registrar falha, ajustar conexao e apresentar prototipo."),
    finalProduct: "Prototipo de circuito de alerta apresentado com esquema, teste de funcionamento, falha registrada e ajuste aplicado.",
    bibliography: ["BRASIL. Ministerio da Educacao. Base Nacional Comum Curricular. Brasilia: MEC, 2018."],
    expectedReferenceTerm: "Base Nacional"
  }),
  activity({
    title: "Algoritmo em cartoes",
    theme: "Pensamento computacional e depuracao",
    discipline: "Pensamento Computacional",
    readyMaterials: scenarioLines("Decompor problema cotidiano, criar algoritmo em cartoes, testar sequencia, identificar padrao, depurar erro e apresentar versao final."),
    finalProduct: "Fluxograma em cartoes apresentado com algoritmo testado, erro depurado, registro de evidencias e melhoria da sequencia.",
    bibliography: ["BRASIL. Ministerio da Educacao. Base Nacional Comum Curricular. Brasilia: MEC, 2018."],
    expectedReferenceTerm: "Base Nacional"
  }),
  activity({
    title: "Proposta de valor escolar",
    theme: "Empreendedorismo e solucao",
    discipline: "Empreendedorismo",
    readyMaterials: scenarioLines("Problema do publico: desperdicio de material. Criar solucao, estimar recursos e custos, testar proposta de valor, ajustar pitch e apresentar."),
    finalProduct: "Prototipo de solucao empreendedora apresentado com publico-alvo, proposta de valor, teste com criterios e melhoria aplicada.",
    bibliography: ["DORNELAS, Jose Carlos Assis. Empreendedorismo: transformando ideias em negocios. Rio de Janeiro: LTC, 2018."],
    expectedReferenceTerm: "Empreendedorismo",
    openEnded: true
  }),
  activity({
    title: "Debate maker com solucoes",
    theme: "Atividade aberta sem resposta unica",
    discipline: "Componentes eletivos",
    readyMaterials: scenarioLines("Cada equipe escolhe uma solucao para melhorar a convivencia, cria prototipo de campanha, testa argumento, registra evidencias e revisa comunicacao."),
    finalProduct: "Prototipo de campanha apresentado com argumentos, evidencias do teste, criterios de analise e melhoria da proposta.",
    bibliography: ["BACICH, Lilian; MORAN, Jose. Metodologias ativas para uma educacao inovadora. Porto Alegre: Penso, 2018."],
    expectedReferenceTerm: "Metodologias ativas",
    openEnded: true
  }),
  activity({
    title: "Sustentabilidade STEAM na escola",
    theme: "Interdisciplinaridade STEAM Maker",
    discipline: "Componentes eletivos",
    readyMaterials: scenarioLines("Investigar consumo de materiais, construir painel de decisao, testar cenario, registrar dados, propor melhoria ambiental e apresentar solucao interdisciplinar."),
    finalProduct: "Painel STEAM Maker apresentado com dados, prototipo manipulavel, evidencias do teste e melhoria interdisciplinar.",
    bibliography: ["BACICH, Lilian; MORAN, Jose. Metodologias ativas para uma educacao inovadora. Porto Alegre: Penso, 2018."],
    expectedReferenceTerm: "Metodologias ativas",
    openEnded: true
  })
];
