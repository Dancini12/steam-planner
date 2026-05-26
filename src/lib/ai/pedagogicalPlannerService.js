import { supabase } from '../supabaseClient.js'
import { AIProviderManager } from './AIProviderManager.js'
import {
  formatBnccSuggestions,
  getBnccCodes,
  selectBnccHabilidades
} from '../bnccSelector.js'
import { findSourcesForActivity } from '../sources/index.js'
import {
  getContextForActivity,
  saveSourcesAsync,
} from '../knowledge/knowledgeBaseService.js'
import { getQualityPatterns } from '../machine-learning/behavior-tracking/behaviorTracker.js'

const COMPETENCY_TO_LETTER = {
  science: 'S',
  technology: 'T',
  engineering: 'E',
  arts: 'A',
  mathematics: 'M',
}

function buildPrompt({ discipline, grade, theme, steamCompetencies, numberOfClasses, modality, customInstructions, bnccSuggestions, verifiedSources = [], knowledgeContext = '', qualityPatterns = null }) {
  const steamLetters = steamCompetencies
    .map((c) => COMPETENCY_TO_LETTER[String(c).toLowerCase()])
    .filter(Boolean)

  const uniqueLetters = [...new Set(steamLetters)]

  const steamMatrixShape = uniqueLetters.reduce((acc, letter) => {
    acc[letter] = { contribution: '...', activity: '...', evidence: '...' }
    return acc
  }, {})

  const classesInfo = numberOfClasses ? `- Duração total: ${numberOfClasses} aulas` : ''
  const modalityInfo = modality === 'individual'
    ? '- Modalidade: INDIVIDUAL — os alunos trabalham sozinhos; adapte etapas, materiais e Atividade do Aluno para trabalho solo com reflexão pessoal'
    : '- Modalidade: EM GRUPO — organize grupos de 3-4 alunos com papéis definidos (construtor, testador, registrador, apresentador)'

  return `Você é especialista em educação STEAM, Cultura Maker e BNCC para o sistema educacional brasileiro.

ESSÊNCIA OBRIGATÓRIA — toda atividade DEVE integrar:
- STEAM (${uniqueLetters.join(', ')}): mostrar claramente quais áreas estão sendo usadas, como cada uma aparece e como as disciplinas se conectam
- Cultura Maker: construção, criação, prototipagem, testes, experimentação, produção manual ou tecnológica — os alunos criam, testam, modificam, experimentam e desenvolvem soluções
- Aprendizagem ativa e protagonismo estudantil: aprender fazendo
- Resolução de problemas reais e investigação
- Criatividade como ferramenta pedagógica central
- Títulos: curtos e pedagógicos (máx. 6 palavras), próximos da sala de aula real. Ex.: "Ciências e o Lixo da Escola", "Luz, Sombra e Arte", "Matemática com Embalagens". Nunca títulos poéticos, elaborados ou "cinematográficos".
- STEAM pelo fazer, nunca pelo explicar: não escreva "aqui utilizamos Arte" ou "neste momento aparece a Matemática". Os alunos investigam, criam, constroem, analisam e experimentam — o STEAM emerge naturalmente das ações, sem precisar ser nomeado.

Crie uma atividade pedagógica completa para:
- Disciplina principal: ${discipline}
- Série/Ano: ${grade}
- Tema central: ${theme}
- Áreas STEAM envolvidas: ${uniqueLetters.join(', ')}
${classesInfo}
${modalityInfo}
- Habilidades BNCC selecionadas do banco offline:
${formatBnccSuggestions(bnccSuggestions)}
${customInstructions?.trim() ? `\nSolicitações específicas do professor:\n${customInstructions.trim()}` : ''}
${qualityPatterns && qualityPatterns.totalPositive > 0 ? `
Aprendizado de atividades anteriores bem avaliadas por este professor (${qualityPatterns.totalPositive} avaliações positivas):
${qualityPatterns.topDisciplines.length ? `- Disciplinas mais eficazes para este professor: ${qualityPatterns.topDisciplines.join(', ')}` : ''}
${qualityPatterns.topGrades.length ? `- Séries em que as atividades funcionaram melhor: ${qualityPatterns.topGrades.join(', ')}` : ''}
${qualityPatterns.topSteamAreas.length ? `- Áreas STEAM que geraram maior engajamento: ${qualityPatterns.topSteamAreas.join(', ')}` : ''}
Adapte a complexidade, a linguagem e a abordagem prática para se alinhar a esses padrões que funcionaram bem para este professor.` : ''}

ESTILO DE ESCRITA — aplicar em todos os campos:
- Escreva como professor experiente: humano, natural, prático — não como artigo científico
- Frases curtas, comandos claros e vocabulário simples
- Prefira listas objetivas a blocos narrativos longos
- Zero repetição de ideias entre campos
- Linguagem acolhedora, próxima da sala de aula real
- Use marcadores visuais: 💡 (dica), 📌 (atenção), 🛠 (momento maker), 🎯 (objetivo)

Diretrizes:
1. Materiais: máximo 6 itens acessíveis, com quantidade por grupo. Ex.: "2 cartolinas por grupo"
2. Questão norteadora: 1 frase aberta e investigativa
3. Objetivos: máximo 4, verbo de ação direto e mensurável
4. Campo "bncc": use APENAS os códigos da lista offline acima, no formato "CÓDIGO — descrição breve". Não invente códigos.
5. Cultura Maker obrigatória: construção + prototipagem + iteração (construir → testar → melhorar). Mesmo atividades teóricas devem ter produção prática ou representação visual.
6. Não organize por fases de Design Thinking
7. Campo "activityManual" no estilo de roteiro maker, com linguagem simples e objetiva:
   - "1. Materiais necessários": lista com quantidade e finalidade curta
   - "2. Passo a passo da atividade": etapas concretas de construção, investigação, teste e apresentação
   - "3. Integração STEAM e Cultura Maker": explique como investigar, criar, construir, testar, melhorar e explicar aparecem na prática
   Use frases curtas. Explique o que o professor faz e o que os alunos fazem.
8. Referências: use SOMENTE fontes verificadas abaixo. Aceitas também: BBC Brasil, ONU Brasil, National Geographic, Nova Escola, Porvir, InfoMoney, Canaltech. NUNCA Wikipedia. Não invente dados. Lista vazia → "bibliography": [].
9. Campo "stages" — EXATAMENTE 8 etapas, com instruções completas e objetivas. Cada etapa DEVE ter:
   - "objective": frase com 🎯, máx. 10 palavras
   - "description": 3 comandos práticos, com no máximo 50 palavras no total. Diga o que o professor faz e o que os alunos fazem.
   - "teacherScript": 1 fala curta do professor, com no máximo 25 palavras
   - "questions": 0-2 perguntas curtas e abertas
   Soma dos tempos = ${numberOfClasses ? numberOfClasses * 50 : 50} min (${numberOfClasses || 1} aula${numberOfClasses > 1 ? 's' : ''} de 50 min). Distribua os tempos de forma realista.
   Etapas: 1-Introdução · 2-Explicação · 3-Organização · 4-Desenvolvimento Maker · 5-Mediação · 6-Testes · 7-Reflexão · 8-Fechamento
10. Campo "beforeClass": 3-4 bullet points do que preparar antes (materiais, ambiente, grupos)
11. Campo "afterClass": 2-3 bullet points do que fazer após (registros, avaliação, devolutiva)
12. Campo "teacherTips": 6 dicas numeradas, 1 frase cada, práticas para: turmas agitadas, poucos recursos, alunos com dificuldade, tempo reduzido, turmas avançadas, escolas públicas
13. Campo "studentActivity": material completo para o aluno com textBase (mín. 150 palavras, linguagem da série), sourceInfo, situationProblem (2-3 frases ao aluno), investigativeChallenge (1 frase motivadora), questions (5 progressivas: compreensão → reflexão crítica), practicalActivity (passos claros, desafio Maker)

${verifiedSources.length > 0
  ? `Fontes verificadas em bases acadêmicas reais (Crossref, OpenAlex, SciELO, Semantic Scholar):\n${verifiedSources.map((s, i) => `${i + 1}. ${s.abnt}`).join('\n')}`
  : 'Nenhuma fonte localizada automaticamente. Deixe o campo "bibliography" vazio: [].'}
${knowledgeContext ? `\nBase de conhecimento pedagógico local (use para enriquecer a atividade — conteúdo já validado):\n${knowledgeContext}` : ''}

Responda APENAS com JSON válido, sem texto antes ou depois:

{
  "title": "Título envolvente da atividade",
  "theme": "Subtítulo curto",
  "duration": "X semanas · Y aulas de Z minutos",
  "problem": "Problema real e concreto que mobiliza a atividade",
  "guidingQuestion": "Pergunta norteadora aberta que orienta toda a investigação?",
  "steamMatrix": ${JSON.stringify(steamMatrixShape, null, 2)},
  "objectives": [
    "Objetivo 1 com verbo de ação mensurável",
    "Objetivo 2",
    "Objetivo 3",
    "Objetivo 4"
  ],
  "bncc": ${JSON.stringify(getBnccCodes(bnccSuggestions).map(c => `${c} — descrição breve da habilidade`))},
  "materials": [
    "Material 1 — quantidade por grupo e/ou turma (acessível)",
    "Material 2 — quantidade por grupo e/ou turma",
    "Material 3 — quantidade por grupo e/ou turma",
    "Material 4 — quantidade por grupo e/ou turma",
    "Material 5 — quantidade por grupo e/ou turma"
  ],
  "activityManual": "1. Materiais necessários\\n- Material 1 — quantidade e uso.\\n- Material 2 — quantidade e uso.\\n\\n2. Passo a passo da atividade\\nPreparação: organize os grupos, distribua os materiais e apresente o desafio.\\nConstrução maker: os alunos produzem uma primeira versão da solução com orientação do professor.\\nTeste e melhoria: os grupos testam, observam problemas e ajustam o produto.\\nSocialização: cada grupo apresenta o que fez, o que funcionou e o que mudaria.\\n\\n3. Integração STEAM e Cultura Maker\\nA atividade integra investigação, criação, construção, teste, melhoria e explicação das escolhas feitas pelos estudantes.",
  "stages": [
    {
      "number": 1,
      "title": "Etapa 1 — Introdução",
      "duration": "10 min",
      "objective": "🎯 A turma entende o desafio.",
      "description": "Mostre uma imagem, objeto ou notícia. Apresente o problema em linguagem simples. Peça que os alunos digam hipóteses e dúvidas iniciais.",
      "teacherScript": "💡 Hoje vamos investigar este problema e criar uma resposta prática.",
      "questions": ["Pergunta de abertura para despertar curiosidade?", "O que você já sabe sobre esse assunto?"]
    },
    {
      "number": 2,
      "title": "Etapa 2 — Explicação",
      "duration": "10-15 min",
      "objective": "🎯 A turma relembra conceitos essenciais.",
      "description": "Explique apenas 2 conceitos-chave. Use um exemplo do cotidiano. Faça uma pergunta de verificação antes da prática e anote palavras importantes no quadro.",
      "teacherScript": "📌 Guardem esta ideia: ela vai orientar a construção de vocês.",
      "questions": ["Pergunta de verificação de compreensão?", "Alguém consegue dar um exemplo parecido?"]
    },
    {
      "number": 3,
      "title": "Etapa 3 — Organização",
      "duration": "5-8 min",
      "objective": "🎯 Os grupos sabem o que fazer.",
      "description": "Forme grupos e defina papéis simples. Distribua materiais. Combine tempo, produto esperado, cuidado com materiais e regra de colaboração.",
      "teacherScript": "💡 Antes de começar: cada grupo precisa saber o que vai entregar.",
      "questions": []
    },
    {
      "number": 4,
      "title": "Etapa 4 — Desenvolvimento Maker",
      "duration": "20-30 min",
      "objective": "🛠 Os grupos criam uma primeira versão.",
      "description": "Os grupos constroem, desenham ou montam a solução. O professor circula, observa e faz perguntas. Avise o tempo restante e peça registro das decisões.",
      "teacherScript": "🛠 Façam uma primeira versão simples. Depois vamos melhorar.",
      "questions": []
    },
    {
      "number": 5,
      "title": "Etapa 5 — Mediação",
      "duration": "durante o desenvolvimento",
      "objective": "🎯 Os grupos destravam dificuldades.",
      "description": "Observe antes de intervir. Ajude com perguntas, não respostas prontas. Registre evidências rápidas sobre participação, colaboração e escolhas dos grupos.",
      "teacherScript": "📌 O que vocês já tentaram? O que pode ser testado agora?",
      "questions": ["O que vocês já tentaram?", "O que aconteceu quando fizeram isso?", "Que outras formas vocês podem testar?"]
    },
    {
      "number": 6,
      "title": "Etapa 6 — Testes e melhoria",
      "duration": "10-15 min",
      "objective": "🎯 Os grupos testam e melhoram.",
      "description": "Cada grupo testa a produção. Registra o que funcionou e o que precisa melhorar. Ajusta pelo menos uma coisa antes de apresentar.",
      "teacherScript": "💡 Erro é dado. Usem o teste para melhorar a solução.",
      "questions": ["O que funcionou?", "O que não funcionou e por quê?", "Como podemos melhorar?"]
    },
    {
      "number": 7,
      "title": "Etapa 7 — Reflexão coletiva",
      "duration": "10 min",
      "objective": "🎯 A turma socializa descobertas.",
      "description": "Cada grupo apresenta em 1 minuto. Peça uma descoberta, uma dificuldade e uma melhoria feita. Registre ideias comuns no quadro.",
      "teacherScript": "📌 Apresentem o que fizeram, o que funcionou e o que mudariam.",
      "questions": ["O que funcionou melhor?", "O que vocês mudariam?"]
    },
    {
      "number": 8,
      "title": "Etapa 8 — Fechamento",
      "duration": "8-10 min",
      "objective": "🎯 A turma fecha a aprendizagem.",
      "description": "Retome o desafio inicial. Destaque 2 aprendizagens. Combine entrega, registro, avaliação rápida ou próximo passo.",
      "teacherScript": "💡 Hoje vocês investigaram, criaram, testaram e melhoraram uma solução.",
      "questions": ["O que você aprendeu hoje?", "Onde isso aparece fora da escola?"]
    }
  ],
  "beforeClass": "• Material 1: onde conseguir e como preparar\\n• Material 2: quantidade e organização\\n• Ambiente: como reorganizar a sala\\n• 📌 Atenção: [algo específico a não esquecer]",
  "afterClass": "• Registre fotos das produções dos grupos\\n• Avaliação formativa: observe [o quê] em [quem]\\n• Devolutiva: [como e quando dar retorno aos alunos]",
  "teacherTips": "1. Turmas agitadas: [dica prática em 1 frase]\\n2. Poucos recursos: [dica prática em 1 frase]\\n3. Alunos com dificuldade: [dica prática em 1 frase]\\n4. Tempo reduzido: [dica prática em 1 frase]\\n5. Turmas avançadas: [dica prática em 1 frase]\\n6. Escolas públicas: [dica prática em 1 frase]",
  "studentActivity": {
    "textBase": "Texto-base completo com mínimo 150 palavras, linguagem adequada à série. Pode ser uma reportagem, notícia, situação real ou texto educativo que contextualiza o tema e mobiliza a investigação. Escreva de forma cativante e adequada à faixa etária.",
    "sourceInfo": "Fonte: Nome da Publicação, Ano. (ex: Fonte: Nova Escola, 2024. ou Fonte: Adaptado de National Geographic Brasil.)",
    "situationProblem": "Situação-problema concreta escrita diretamente ao aluno: apresente um desafio real e instigante relacionado ao texto-base que os alunos precisarão investigar.",
    "investigativeChallenge": "Desafio investigativo central: uma frase motivadora que orienta toda a atividade prática do aluno, conectando o texto-base ao desafio Maker.",
    "questions": [
      "Pergunta 1 — compreensão: o que o texto diz sobre...?",
      "Pergunta 2 — interpretação: por que isso acontece / o que significa...?",
      "Pergunta 3 — investigação: se você fosse investigar esse problema, por onde começaria?",
      "Pergunta 4 — conexão com a realidade: você já viveu ou viu algo parecido? Onde?",
      "Pergunta 5 — reflexão crítica: o que pode ser feito para mudar / melhorar essa situação?"
    ],
    "practicalActivity": "Descrição clara e motivadora do que o aluno vai fazer na prática: os passos da atividade mão-na-massa, o desafio Maker integrado e o que deve produzir, criar ou apresentar ao final. Escreva em linguagem direta ao aluno."
  },
  "bibliography": [
    "AUTOR, A. B. Título do livro. Cidade: Editora, ano.",
    "AUTOR, C. D. Título do artigo. Revista, v. X, n. Y, p. ZZ-ZZ, ano."
  ]
}`
}

function extractJson(text) {
  const start = text.indexOf('{')
  if (start === -1) throw new Error('Nenhum JSON encontrado na resposta da IA')

  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < text.length; i++) {
    const char = text[i]
    if (escaped) { escaped = false; continue }
    if (char === '\\') { escaped = true; continue }
    if (char === '"') { inString = !inString; continue }
    if (inString) continue
    if (char === '{') depth++
    if (char === '}') {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  throw new Error('JSON incompleto na resposta da IA')
}

function repairJson(raw) {
  let result = ''
  let inString = false
  let escaped = false

  for (let i = 0; i < raw.length; i++) {
    const c = raw[i]
    if (escaped) { escaped = false; result += c; continue }
    if (c === '\\') { escaped = true; result += c; continue }

    if (c === '"') {
      if (!inString) {
        inString = true
        result += c
        continue
      }
      // Lookahead past whitespace to decide: closing quote or unescaped quote inside string?
      let j = i + 1
      while (j < raw.length && /[ \t\n\r]/.test(raw[j])) j++
      const next = raw[j]
      if (next === undefined || next === ':' || next === ',' || next === '}' || next === ']') {
        // Looks like a closing quote — exit string
        inString = false
        result += c
      } else {
        // Unescaped quote inside string value — escape it
        result += '\\"'
      }
      continue
    }

    if (inString) {
      if (c === '\n') { result += '\\n'; continue }
      if (c === '\r') { result += '\\r'; continue }
      if (c === '\t') { result += '\\t'; continue }
      if (c.charCodeAt(0) < 0x20) continue
    }
    result += c
  }
  return result
}

function safeParseJson(raw) {
  try { return JSON.parse(raw) } catch { /* try repair */ }
  try { return JSON.parse(repairJson(raw)) } catch (e) {
    throw new Error(`JSON inválido na resposta da IA: ${e.message}`)
  }
}

function validateActivity(data) {
  const required = ['title', 'theme', 'duration', 'problem', 'guidingQuestion', 'steamMatrix', 'objectives', 'bncc', 'materials', 'activityManual']
  for (const field of required) {
    if (!data[field]) throw new Error(`Campo obrigatório ausente na resposta da IA: ${field}`)
  }
  return true
}

function applyOfflineBncc(data, bnccSuggestions) {
  const offlineCodes = getBnccCodes(bnccSuggestions)
  if (offlineCodes.length === 0) return data

  // AI may return "EF09CI01 — description" or plain "EF09CI01"
  const extractCode = (s) => (typeof s === 'string' ? s.split(' — ')[0].trim() : '')

  const selectedItems = Array.isArray(data.bncc)
    ? data.bncc.filter((item) => offlineCodes.includes(extractCode(item)))
    : []

  return {
    ...data,
    bncc: selectedItems.length > 0 ? selectedItems : offlineCodes.slice(0, 3)
  }
}

function buildClassroomPrompt(project) {
  const steamAreas = (project.steam || []).join(', ')
  const objectives = (project.objectives || []).map((o, i) => `${i + 1}. ${o}`).join('\n')
  const bncc = (project.bncc || []).join(', ')
  const materials = (project.materials || []).map((m) => `- ${m}`).join('\n')

  const matrixLines = Object.entries(project.steamMatrix || {})
    .map(([letter, m]) => `  ${letter}: contribuição="${m.contribution || ''}", atividade="${m.activity || ''}"`)
    .join('\n')

  const phaseLines = Object.entries(project.phases || {})
    .map(([id, p]) => p.plan ? `  Fase ${id}: ${p.plan}` : null)
    .filter(Boolean)
    .join('\n')

  return `Você é especialista em educação STEAM e Cultura Maker para o sistema educacional brasileiro.

Um professor planejou o seguinte projeto STEAM e precisa de um ROTEIRO DE AULA PRÁTICO para aplicar em sala de aula.

DADOS DO PROJETO:
- Título: ${project.title || ''}
- Tema: ${project.theme || ''}
- Série/Ano: ${project.grade || ''}
- Duração total: ${project.duration || ''}
- Problema central: ${project.problem || ''}
- Pergunta norteadora: ${project.guidingQuestion || ''}
- Áreas STEAM: ${steamAreas}
- Habilidades BNCC: ${bncc}
- Materiais disponíveis:
${materials}
- Objetivos de aprendizagem:
${objectives}
- Matriz STEAM:
${matrixLines}
- Planejamento das fases (preenchido pelo professor):
${phaseLines || '  (sem planos específicos registrados)'}

TAREFA:
Gere uma atividade prática no estilo de roteiro maker para aplicar em sala. O resultado deve ficar parecido com este formato: "Projeto: [nome]", "1. Materiais Necessários", "2. Passo a Passo da Construção/Atividade", "3. Integração das Disciplinas". Use linguagem simples, objetiva e direta.

Regras obrigatórias para o roteiro:
1. Liste materiais com quantidades e finalidade curta.
2. Use de 4 a 6 passos práticos, organizados como construção/aplicação da atividade.
3. Cada passo pode agrupar áreas, como "Engenharia e Matemática", "Ciência e Tecnologia", "Teste e Arte", quando fizer sentido.
4. Em cada passo, diga exatamente o que o professor prepara/orienta e o que os alunos fazem.
5. Mostre como o STEAM e a Cultura Maker acontecem na prática: investigar, criar, construir, testar, melhorar e explicar.
6. Evite teoria longa. Quando precisar explicar conceito, use 1 frase simples ligada ao que foi feito.
7. Use linguagem direta, simples e adequada ao professor.
8. Inclua "steamIntegration" com S, T, E, A, M, cada item com 1 frase curta e aplicada ao projeto.
9. "assessment" deve ter no máximo 3 frases simples.
10. "tips" deve ter no máximo 4 bullets curtos.

Responda APENAS com JSON válido, sem texto antes ou depois:

{
  "activityTitle": "Título do roteiro de aula",
  "targetAudience": "${project.grade || 'Ensino Fundamental'}",
  "duration": "X aulas de Y minutos",
  "objective": "O que os alunos vão aprender/fazer nesta aula.",
  "materials": [
    "material 1 — quantidade por grupo e/ou turma",
    "material 2 — quantidade por grupo e/ou turma"
  ],
  "steps": [
    {
      "time": "Antes da aula",
      "actor": "Professor",
      "title": "Preparação",
      "description": "Separe os materiais por grupo e organize o espaço da sala. Deixe claro qual produto os alunos deverão construir, testar e apresentar."
    },
    {
      "time": "10 min",
      "actor": "Professor",
      "title": "Abertura",
      "description": "Apresente o problema em uma frase e conecte com a realidade dos alunos. Peça que a turma levante hipóteses rápidas."
    },
    {
      "time": "20 min",
      "actor": "Alunos",
      "title": "Engenharia e Matemática",
      "description": "Organize os grupos e entregue os materiais. Peça que montem a estrutura, observem medidas, alinhamento, equilíbrio ou organização dos elementos."
    },
    {
      "time": "20 min",
      "actor": "Alunos",
      "title": "Ciência e Tecnologia",
      "description": "Peça que investiguem o funcionamento da solução e testem uma primeira versão. Oriente os grupos a registrar o que funcionou e o que precisa melhorar."
    },
    {
      "time": "15 min",
      "actor": "Alunos",
      "title": "Teste, melhoria e Arte",
      "description": "Peça que ajustem a produção, melhorem a apresentação visual e testem novamente. Feche com apresentação curta de cada grupo."
    }
  ],
  "steamIntegration": {
    "S": "Ciências: explica o fenômeno, causa, efeito ou funcionamento observado na atividade.",
    "T": "Tecnologia: usa materiais, ferramentas ou técnicas para melhorar a solução.",
    "E": "Engenharia: orienta o desenho, montagem, equilíbrio, estrutura ou funcionamento do produto.",
    "A": "Artes: aparece no design visual, comunicação, criatividade e acabamento.",
    "M": "Matemática: aparece em medidas, comparação, contagem, proporção, distância, tempo ou organização dos dados."
  },
  "discussionQuestions": [
    "O que funcionou melhor?",
    "O que vocês mudariam?"
  ],
  "assessment": "Observe participação, colaboração, registro das ideias e melhoria da solução. Use a apresentação curta como evidência de aprendizagem. Valorize o processo, não apenas o produto final.",
  "tips": "• Pouco tempo: reduza a produção para um esboço testável.\\n• Poucos materiais: trabalhe com papel, caneta e reaproveitamento.\\n• Dificuldade: entregue um exemplo simples para iniciar.\\n• Turma agitada: combine papéis e tempo para cada grupo.",
  "bncc": ["EF07CI05", "EF07MA03"]
}`
}

export class PedagogicalPlannerService {
  static async generatePedagogicalActivity(params) {
    const { discipline, grade, theme, steamCompetencies, numberOfClasses, modality, customInstructions, personalization, userId } = params

    const bnccSuggestions = selectBnccHabilidades({
      grade,
      discipline,
      theme,
      steamCompetencies,
      limit: 5
    })

    // ── 1. Carrega padrões de qualidade aprendidos + base de conhecimento em paralelo ──
    const [kb, qualityPatterns] = await Promise.all([
      getContextForActivity({ theme, discipline, grade, steamCompetencies }),
      getQualityPatterns(userId).catch(() => null),
    ])

    // ── 2. Se KB tem >= 3 fontes confiáveis, ignora as chamadas externas (4 APIs) ──
    const externalSources = kb.skipSourceSearch
      ? []
      : await findSourcesForActivity({ theme, discipline, grade, limit: 5 }).catch(() => [])

    // Mescla fontes KB + externas, desduplicando por DOI
    const seenDois = new Set()
    const verifiedSources = [...externalSources, ...kb.sources].filter((s) => {
      if (!s.doi) return true
      if (seenDois.has(s.doi)) return false
      seenDois.add(s.doi)
      return true
    }).slice(0, 7)

    // ── 3. Gera prompt com contexto local + padrões aprendidos ──
    const prompt = buildPrompt({
      discipline, grade, theme, steamCompetencies, numberOfClasses, modality,
      customInstructions, bnccSuggestions, verifiedSources,
      knowledgeContext: kb.contextSummary,
      qualityPatterns,
    })

    const response = await AIProviderManager.request({
      requestType: 'pedagogicalactivity',
      prompt
    })

    const rawText = response.content
    if (!rawText || typeof rawText !== 'string') {
      throw new Error('A IA não retornou conteúdo válido.')
    }

    const jsonStr = extractJson(rawText)
    const parsed = applyOfflineBncc(safeParseJson(jsonStr), bnccSuggestions)

    validateActivity(parsed)

    // ── 4. Salva fontes novas na KB de forma assíncrona (fire-and-forget) ──
    if (externalSources.length) {
      saveSourcesAsync(externalSources, {
        theme,
        discipline,
        grade,
        steamAreas: steamCompetencies,
        bnccCodes: getBnccCodes(bnccSuggestions),
      })
    }

    return {
      activity: { ...parsed, modality: modality || 'grupo' },
      generatedAt: new Date().toISOString(),
      competencies: steamCompetencies,
      provider: response.provider || null,
      verifiedSources,
      usedLocalKnowledge: kb.skipSourceSearch,
    }
  }

  static async generateClassroomActivity(project) {
    const prompt = buildClassroomPrompt(project)

    const response = await AIProviderManager.request({
      requestType: 'classroomactivity',
      prompt
    })

    const rawText = response.content
    if (!rawText || typeof rawText !== 'string') {
      throw new Error('A IA não retornou conteúdo válido.')
    }

    const jsonStr = extractJson(rawText)
    const parsed = safeParseJson(jsonStr)

    if (!parsed.activityTitle || !parsed.steps || !Array.isArray(parsed.steps)) {
      throw new Error('Resposta da IA incompleta: campos obrigatórios ausentes.')
    }

    return parsed
  }

  // Incrementa contador só após o projeto ser salvo com sucesso
  static async incrementUsage(userId, discipline, steamCompetencies) {
    try {
      const today = new Date().toISOString().split('T')[0]

      const { data: existing } = await supabase
        .from('pedagogical_usage')
        .select('count')
        .eq('user_id', userId)
        .eq('discipline', discipline)
        .eq('date', today)
        .single()

      if (existing) {
        await supabase
          .from('pedagogical_usage')
          .update({ count: existing.count + 1 })
          .eq('user_id', userId)
          .eq('discipline', discipline)
          .eq('date', today)
      } else {
        await supabase
          .from('pedagogical_usage')
          .insert({
            user_id: userId,
            discipline,
            count: 1,
            date: today,
            steam_competencies: steamCompetencies || []
          })
      }
    } catch (error) {
      console.error('Erro ao incrementar uso:', error)
    }
  }
}
