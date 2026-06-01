import { expect, test } from "@playwright/test";
import { openActivityPrintWindow } from "../src/lib/exportReport.js";

function buildActivity(overrides = {}) {
  return {
    title: "Desafio STEAM Maker",
    theme: "Investigação prática",
    discipline: "Componentes eletivos",
    duration: "2 aulas",
    objective: "Investigar um problema real, construir uma solução testável, registrar evidências e propor melhorias.",
    problem: "Como criar uma solução prática para melhorar uma situação observada na escola?",
    mission: "A equipe deve analisar o desafio, construir um protótipo, testar com uma situação real, registrar evidências, ajustar e apresentar o resultado.",
    makerChallenge: "Construir um protótipo manipulável, testar com critérios simples, registrar falhas e melhorar pelo menos um elemento antes da apresentação.",
    finalProduct: "Protótipo ou painel funcional apresentado com registro do teste, evidências coletadas e melhoria aplicada.",
    materials: [
      "Cartolina: 1 folha por grupo — base visual do protótipo — —",
      "Fichas de papel: 8 a 12 fichas por grupo — registrar dados e evidências — —",
      "Tesoura sem ponta: 1 unidade por grupo — recortar elementos móveis — Segura para o E.F.",
      "Canetinhas coloridas: 1 conjunto por grupo — diferenciar informações — —"
    ],
    materialFunctions: [
      "Cartolina: 1 folha por grupo — base visual do protótipo — —",
      "Fichas de papel: 8 a 12 fichas por grupo — registrar dados e evidências — —",
      "Tesoura sem ponta: 1 unidade por grupo — recortar elementos móveis — Segura para o E.F.",
      "Canetinhas coloridas: 1 conjunto por grupo — diferenciar informações — —"
    ],
    readyMaterials: [
      "CENÁRIO 1 - Aplicar o protótipo em uma situação real da turma, registrar resultado, falha observada e melhoria possível.",
      "TABELA DE TESTE - Cenário/Teste | Resultado Inicial | Falha Observada | Melhoria Aplicada | Resultado Após Melhoria."
    ],
    teacherGabarito: ["Resposta livre."],
    bibliography: ["BRASIL. Ministério da Educação. Base Nacional Comum Curricular. Brasília: MEC, 2018."],
    steamConnection: {
      science: "Investigar dados e evidências do problema.",
      technology: "Organizar registros e testar a solução.",
      engineering: "Planejar, construir e ajustar o protótipo.",
      art: "Comunicar visualmente as decisões da equipe.",
      mathematics: "Comparar resultados antes e depois do teste."
    },
    assessmentRubric: [
      { criterion: "Investigação", observation: "Usa evidências para compreender o problema." },
      { criterion: "Protótipo", observation: "Constrói solução testável e coerente." },
      { criterion: "Teste e melhoria", observation: "Registra falhas e aplica ajuste." },
      { criterion: "Comunicação", observation: "Apresenta produto e justificativas." }
    ],
    ...overrides
  };
}

function captureExport(activity) {
  let html = "";
  global.window = {
    open: () => ({
      document: {
        open() {},
        write(value) { html += value; },
        close() {}
      }
    })
  };
  global.alert = (message) => {
    throw new Error(message);
  };

  const originalInfo = console.info;
  const originalWarn = console.warn;
  console.info = () => {};
  console.warn = () => {};
  try {
    openActivityPrintWindow(activity);
  } finally {
    console.info = originalInfo;
    console.warn = originalWarn;
  }

  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "\n")
    .replace(/\s+/g, " ");
  return { html, text };
}

const cases = [
  {
    name: "Matemática com cálculo",
    activity: buildActivity({
      discipline: "Matemática",
      theme: "Porcentagem e orçamento",
      readyMaterials: [
        "CENÁRIO 1",
        "Receita total: R$ 4.500,00",
        "Despesas fixas: R$ 2.000,00",
        "Despesas variáveis: R$ 1.500,00"
      ],
      teacherGabarito: ["Cenário 1: cálculo antigo inconsistente."]
    }),
    expected: "Saldo final: R$ 4.500,00 - R$ 3.500,00 = R$ 1.000,00."
  },
  {
    name: "Língua Portuguesa com interpretação",
    activity: buildActivity({
      discipline: "Língua Portuguesa",
      theme: "Leitura crítica de notícia",
      readyMaterials: ["Texto-base curto sobre a escola. Questões: identificar ideia central, inferência e proposta de reescrita para comunicar a solução."],
      finalProduct: "Painel de leitura crítica com respostas justificadas, reescrita colaborativa, evidências do texto e apresentação oral."
    })
  },
  {
    name: "Ciências com experimento",
    activity: buildActivity({
      discipline: "Ciências",
      theme: "Filtração da água",
      readyMaterials: ["Hipótese: o filtro com camadas diferentes altera a aparência da água. Procedimento: montar filtro, observar, registrar resultado e melhorar a camada filtrante."],
      finalProduct: "Protótipo de filtro apresentado com hipótese, procedimento, tabela de observação, resultado do teste e melhoria aplicada."
    })
  },
  {
    name: "História com análise de fonte",
    activity: buildActivity({
      discipline: "História",
      theme: "Memória e fontes históricas",
      readyMaterials: ["Fonte histórica simulada: carta de morador do bairro. Analisar contexto, temporalidade, causa e consequência antes de montar linha do tempo."],
      finalProduct: "Linha do tempo visual com análise da fonte, evidências registradas, comparação histórica e apresentação das conclusões."
    })
  },
  {
    name: "Geografia com mapa e território",
    activity: buildActivity({
      discipline: "Geografia",
      theme: "Território e mobilidade",
      readyMaterials: ["Mapa simplificado do entorno da escola. Marcar rotas, pontos de risco, escala aproximada, paisagem e proposta de melhoria no território."],
      finalProduct: "Mapa colaborativo apresentado com legenda, registro de evidências, proposta de melhoria territorial e justificativa da equipe."
    })
  },
  {
    name: "Arte com produção visual",
    activity: buildActivity({
      discipline: "Arte",
      theme: "Composição visual e identidade",
      readyMaterials: ["Referências visuais da turma. Criar composição artística, testar contraste, revisar comunicação visual e apresentar apreciação estética."],
      finalProduct: "Composição visual autoral apresentada com registro do processo criativo, teste de leitura visual e melhoria aplicada."
    })
  },
  {
    name: "Educação Física com prática corporal",
    activity: buildActivity({
      discipline: "Educação Física",
      theme: "Jogo cooperativo",
      readyMaterials: ["Desafio corporal: criar regra de jogo cooperativo, testar participação, registrar segurança, adaptar movimento e apresentar reflexão."],
      finalProduct: "Jogo cooperativo adaptado apresentado com regras, registro de participação, evidências de segurança e melhoria após teste."
    })
  },
  {
    name: "Língua Inglesa com vocabulário",
    activity: buildActivity({
      discipline: "Língua Inglesa",
      theme: "Vocabulary in school routines",
      readyMaterials: ["Vocabulary cards: school, recycle, save, help. Students create short English commands, test oralidade and revise unclear phrases."],
      finalProduct: "Painel bilíngue com vocabulary cards, comandos em inglês, registro de teste oral e melhoria das frases."
    })
  },
  {
    name: "Robótica com protótipo",
    activity: buildActivity({
      discipline: "Robótica",
      theme: "Circuito de alerta",
      readyMaterials: ["Circuito simples com LED e sensor simulado. Montar, testar funcionamento, registrar falha, ajustar conexão e apresentar protótipo."],
      finalProduct: "Protótipo de circuito de alerta apresentado com esquema, teste de funcionamento, falha registrada e ajuste aplicado."
    })
  },
  {
    name: "Pensamento Computacional com algoritmo",
    activity: buildActivity({
      discipline: "Pensamento Computacional",
      theme: "Algoritmos do cotidiano",
      readyMaterials: ["Sequência lógica: decompor problema, criar algoritmo em cartões, testar ordem, depurar erro e apresentar versão final."],
      finalProduct: "Fluxograma em cartões apresentado com algoritmo testado, erro depurado, registro de evidências e melhoria da sequência."
    })
  },
  {
    name: "Empreendedorismo com problema e solução",
    activity: buildActivity({
      discipline: "Empreendedorismo",
      theme: "Proposta de valor",
      readyMaterials: ["Problema do público: desperdício de material. Criar solução, estimar recursos, testar proposta de valor e ajustar apresentação."],
      finalProduct: "Protótipo de solução empreendedora apresentado com público-alvo, proposta de valor, teste com critérios e melhoria aplicada."
    })
  },
  {
    name: "Atividade interdisciplinar STEAM Maker",
    activity: buildActivity({
      discipline: "Componentes eletivos",
      theme: "Sustentabilidade na escola",
      readyMaterials: ["Desafio interdisciplinar STEAM: investigar consumo, construir painel de decisão, testar cenário, registrar dados e melhorar a solução."],
      finalProduct: "Painel STEAM Maker apresentado com dados, protótipo manipulável, evidências do teste e melhoria interdisciplinar."
    })
  }
];

test.describe("validação global STEAM + Maker", () => {
  for (const item of cases) {
    test(item.name, () => {
      const { html, text } = captureExport(item.activity);

      expect(text).not.toContain("Exportação bloqueada");
      expect(text).toContain("GABARITO DO PROFESSOR");
      expect(text).toContain(item.expected || "Critérios de análise:");
      expect(html).toContain(".materials-table");
      expect(html).toContain(".rubric-table");
      expect(html).toContain(".stage");
      expect(text).not.toMatch(/blob:http|localhost|127\.0\.0\.1|<br>|<\/p>|\*\*|\|\s*---/i);
    });
  }
});
