import { supabase } from '../supabaseClient.js'
import { AIProviderManager } from './AIProviderManager.js'
import {
  formatBnccSuggestions,
  getBnccCodes,
  selectBnccHabilidades
} from '../bnccSelector.js'
import { applyAccessibilityAdaptations } from '../accessibilityAdapter.js'
import { getAccessibilityAdaptations } from '../../data/accessibilityAdaptations.js'
import { GeminiService } from './geminiService.js'
import { findSourcesForActivity } from '../sources/index.js'
import {
  getContextForActivity,
  saveSourcesAsync,
} from '../knowledge/knowledgeBaseService.js'

const COMPETENCY_TO_LETTER = {
  science: 'S',
  technology: 'T',
  engineering: 'E',
  arts: 'A',
  mathematics: 'M',
}

function buildPrompt({ discipline, grade, theme, steamCompetencies, numberOfClasses, customInstructions, bnccSuggestions, verifiedSources = [], knowledgeContext = '' }) {
  const steamLetters = steamCompetencies
    .map((c) => COMPETENCY_TO_LETTER[String(c).toLowerCase()])
    .filter(Boolean)

  const uniqueLetters = [...new Set(steamLetters)]

  const steamMatrixShape = uniqueLetters.reduce((acc, letter) => {
    acc[letter] = { contribution: '...', activity: '...', evidence: '...' }
    return acc
  }, {})

  const classesInfo = numberOfClasses ? `- Duração total: ${numberOfClasses} aulas` : ''

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
- Habilidades BNCC selecionadas do banco offline:
${formatBnccSuggestions(bnccSuggestions)}
${customInstructions?.trim() ? `\nSolicitações específicas do professor:\n${customInstructions.trim()}` : ''}

ESTILO DE ESCRITA — aplicar em todos os campos:
- Escreva como professor experiente: humano, natural, prático — não como artigo científico
- Máximo 2-3 frases por parágrafo; prefira bullet points a blocos narrativos longos
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
7. Campo "activityManual" em 3 partes, máximo 80 palavras no total:
   - "Resumo das competências": 2 frases conectando STEAM à atividade
   - "Materiais utilizados": lista curta com função de cada item
   - "Como montar e conduzir": 2-3 frases sobre a condução geral
8. Referências: use SOMENTE fontes verificadas abaixo. Aceitas também: BBC Brasil, ONU Brasil, National Geographic, Nova Escola, Porvir, InfoMoney, Canaltech. NUNCA Wikipedia. Não invente dados. Lista vazia → "bibliography": [].
9. Campo "stages" — EXATAMENTE 8 etapas. Cada etapa DEVE ter:
   - "objective": frase com 🎯, máx. 12 palavras — o que o aluno conquista nesta etapa
   - "description": 50-70 palavras, linguagem natural e prática, sem repetir o teacherScript
   - "teacherScript": 30-50 palavras, linguagem coloquial do professor, use 💡 ou 📌 quando útil
   - "questions": 1-3 perguntas curtas e abertas
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
  "activityManual": "Resumo das competências:\\nTexto conectando as áreas STEAM à atividade.\\n\\nMateriais utilizados:\\n- Material 1: para que serve e como usar.\\n- Material 2: para que serve e como usar.\\n\\nComo montar e conduzir:\\nVisão geral da condução (detalhes completos estão nas etapas).",
  "stages": [
    {
      "number": 1,
      "title": "Etapa 1 — Introdução",
      "duration": "10 min",
      "objective": "🎯 Os alunos se conectam ao tema e levantam curiosidades sobre o problema.",
      "description": "50-70 palavras: inicie com uma provocação do cotidiano dos alunos. Apresente o problema real da atividade e mostre como as áreas STEAM (liste quais) aparecem neste desafio. Desperte a curiosidade antes de qualquer explicação formal.",
      "teacherScript": "💡 Abra com: [frase provocadora ligada ao tema]. Mostre imagem/objeto/notícia. Peça 2-3 alunos para falarem o que já sabem. Não corrija ainda — o objetivo é curiosidade.",
      "questions": ["Pergunta de abertura para despertar curiosidade?", "O que você já sabe sobre esse assunto?"]
    },
    {
      "number": 2,
      "title": "Etapa 2 — Explicação",
      "duration": "10-15 min",
      "objective": "🎯 Os alunos compreendem os conceitos-chave necessários para o desafio.",
      "description": "50-70 palavras: apresente os 2-3 conceitos essenciais com exemplos concretos da realidade dos alunos. Use analogias simples. Verifique a compreensão com uma pergunta rápida antes de avançar. Evite explicações longas — o foco é mobilizar para a prática.",
      "teacherScript": "📌 Explique o conceito com exemplo do dia a dia. Use o quadro para 1 diagrama simples. Faça a pergunta de verificação para a turma toda antes de seguir.",
      "questions": ["Pergunta de verificação de compreensão?", "Alguém consegue dar um exemplo parecido?"]
    },
    {
      "number": 3,
      "title": "Etapa 3 — Organização",
      "duration": "5-8 min",
      "objective": "🎯 Os grupos estão formados e prontos para iniciar o desafio.",
      "description": "50-70 palavras: forme grupos de 3-4 alunos com perfis complementares. Distribua os materiais de forma organizada (um representante por grupo). Organize o espaço da sala para o trabalho prático. Explique os critérios do desafio antes de liberar os grupos.",
      "teacherScript": "💡 Diga claramente: quem forma cada grupo, como pegar os materiais e o que cada grupo deve produzir. Reserve 1 min para perguntas antes de começar.",
      "questions": []
    },
    {
      "number": 4,
      "title": "Etapa 4 — Desenvolvimento Maker",
      "duration": "20-30 min",
      "objective": "🛠 Os alunos constroem, criam e testam a primeira versão da sua solução.",
      "description": "50-70 palavras: os grupos trabalham no desafio Maker de forma autônoma. Cada grupo deve produzir algo concreto (modelo, protótipo, representação visual ou solução prática). Estimule o protagonismo: o professor não resolve — orienta. Registre com fotos ou anotações das soluções emergentes.",
      "teacherScript": "🛠 Lance o desafio: [frase de lançamento do desafio]. Circule discretamente. Se um grupo travar, pergunte — não responda. Avise o tempo restante a cada 10 min.",
      "questions": []
    },
    {
      "number": 5,
      "title": "Etapa 5 — Mediação",
      "duration": "durante o desenvolvimento",
      "objective": "🎯 Os alunos avançam com autonomia, apoiados pelo professor facilitador.",
      "description": "50-70 palavras: circule entre os grupos com postura de facilitador — observe antes de intervir. Incentive grupos travados com perguntas abertas, não com respostas. Estimule a colaboração dentro e entre grupos. Documente evidências de aprendizagem (fotos, anotações rápidas).",
      "teacherScript": "📌 Perguntas de mediação: O que vocês já tentaram? O que aconteceu? Que outras formas existem? Evite falar mais que os alunos. Seu papel é provocar, não resolver.",
      "questions": ["O que vocês já tentaram?", "O que aconteceu quando fizeram isso?", "Que outras formas vocês podem testar?"]
    },
    {
      "number": 6,
      "title": "Etapa 6 — Testes e melhoria",
      "duration": "10-15 min",
      "objective": "🎯 Os alunos identificam erros, refinam e melhoram suas soluções.",
      "description": "50-70 palavras: cada grupo testa sua solução e registra o que funcionou e o que não funcionou. Incentive ao menos um ciclo de melhoria (construir → testar → ajustar). Normalize o erro como parte do processo — quem errou e melhorou aprendeu mais.",
      "teacherScript": "💡 Diga: Erro não é fracasso — é dado. O que mudaria se tivessem mais 5 minutos? Estimule os grupos a ajustar pelo menos 1 coisa antes da apresentação.",
      "questions": ["O que funcionou?", "O que não funcionou e por quê?", "Como podemos melhorar?"]
    },
    {
      "number": 7,
      "title": "Etapa 7 — Reflexão coletiva",
      "duration": "10 min",
      "objective": "🎯 Os alunos conectam o que fizeram com as áreas STEAM e a realidade.",
      "description": "50-70 palavras: promova uma roda rápida de conversa. Cada grupo compartilha 1 descoberta e 1 dificuldade. Registre as conclusões no quadro. Conecte explicitamente a atividade com as áreas STEAM usadas e com situações reais do cotidiano dos alunos.",
      "teacherScript": "📌 Abra a roda: Cada grupo tem 1 minuto. Anote no quadro: O que aprendemos + Onde isso aparece na vida real. Conduza para que TODOS os grupos falem.",
      "questions": ["Como o que fizemos hoje aparece na vida real?", "Como as áreas STEAM se conectaram nesta atividade?", "O que você mudaria?"]
    },
    {
      "number": 8,
      "title": "Etapa 8 — Fechamento",
      "duration": "8-10 min",
      "objective": "🎯 Os alunos sintetizam as aprendizagens e recebem encaminhamentos.",
      "description": "50-70 palavras: conclua com uma síntese das aprendizagens do dia — o que foi construído, investigado e descoberto. Celebre os resultados de todos os grupos. Anuncie o próximo passo (continuação, avaliação ou nova atividade). Reserve 2 minutos para organização da sala.",
      "teacherScript": "💡 Diga: Hoje vocês [síntese do que foi feito]. Destaque 2-3 pontos-chave. Pergunte: O que você vai lembrar desta aula amanhã? Encerre com energia positiva.",
      "questions": ["O que cada grupo aprendeu hoje?", "Como podemos levar esse conhecimento para fora da escola?"]
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
Gere um roteiro de aula completo, prático e pronto para o professor usar em sala. O roteiro deve ser sequenciado, com tempos estimados, ações concretas e linguagem direta. Deve caber em 2–3 aulas (ajuste conforme a duração do projeto).

Regras obrigatórias para o roteiro:
1. Detalhe cada momento com instruções executáveis, evitando descrições genéricas.
2. Liste materiais com quantidades por grupo e/ou por turma.
3. Não crie adaptações de acessibilidade; elas serão aplicadas pelo sistema a partir do banco local.

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
      "time": "10 min",
      "actor": "Professor",
      "title": "Título do momento",
      "description": "Descrição detalhada e operacional do que fazer. Use linguagem direta: 'Apresente...', 'Pergunte...', 'Organize...'"
    },
    {
      "time": "20 min",
      "actor": "Alunos",
      "title": "Título do momento",
      "description": "O que os alunos fazem concretamente neste momento."
    }
  ],
  "discussionQuestions": [
    "Pergunta para discussão em sala 1?",
    "Pergunta para reflexão 2?"
  ],
  "assessment": "Como o professor avalia a participação e aprendizagem nesta aula (observação, produto, apresentação, etc.).",
  "tips": "2–3 dicas práticas para o professor: como lidar com imprevistos, diferenciar para alunos com dificuldade, etc.",
  "bncc": ["EF07CI05", "EF07MA03"]
}`
}

function applyProjectAccessibility(data, project) {
  const accessibility = Array.isArray(project.accessibility)
    ? project.accessibility.join(" ")
    : project.accessibility || ""

  return {
    ...data,
    accessibility
  }
}

export class PedagogicalPlannerService {
  static async generatePedagogicalActivity(params) {
    const { discipline, grade, theme, steamCompetencies, numberOfClasses, customInstructions, personalization, userId } = params

    const bnccSuggestions = selectBnccHabilidades({
      grade,
      discipline,
      theme,
      steamCompetencies,
      limit: 5
    })

    // ── 1. Consulta a base de conhecimento local antes de qualquer API externa ──
    const kb = await getContextForActivity({ theme, discipline, grade, steamCompetencies })

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

    // ── 3. Gera prompt com contexto local (reduz alucinações e tokens da IA) ──
    const prompt = buildPrompt({
      discipline, grade, theme, steamCompetencies, numberOfClasses,
      customInstructions, bnccSuggestions, verifiedSources,
      knowledgeContext: kb.contextSummary,
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
    const parsed = applyAccessibilityAdaptations(
      applyOfflineBncc(safeParseJson(jsonStr), bnccSuggestions),
      personalization?.accessibility || []
    )

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
      activity: parsed,
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
      requestType: 'pedagogicalactivity',
      prompt
    })

    const rawText = response.content
    if (!rawText || typeof rawText !== 'string') {
      throw new Error('A IA não retornou conteúdo válido.')
    }

    const jsonStr = extractJson(rawText)
    const parsed = applyProjectAccessibility(safeParseJson(jsonStr), project)

    if (!parsed.activityTitle || !parsed.steps || !Array.isArray(parsed.steps)) {
      throw new Error('Resposta da IA incompleta: campos obrigatórios ausentes.')
    }

    return parsed
  }

  static async adaptActivityFromPDF(base64Content, selectedAdaptationIds = []) {
    const adaptations = getAccessibilityAdaptations(selectedAdaptationIds)

    const adaptationDetails = adaptations
      .map((a) => `- ${a.label}: ${a.guidance} ${a.materialGuidance}`)
      .join('\n')

    const colorblindRule = selectedAdaptationIds.includes('daltonismo')
      ? 'Para daltonismo: onde a atividade usar cor para classificar, separar grupos, identificar ou filtrar, reescreva obrigatoriamente usando padrão alternativo (listras, bolinhas, zigue-zague, furos, relevo). Descreva nos materiais e nas instruções como produzir e usar cada padrão.'
      : ''

    const prompt = `Você é especialista em educação inclusiva e STEAM.

Analise a atividade pedagógica no PDF enviado e GERE UMA VERSÃO COMPLETA E ADAPTADA dela, incorporando todas as modificações necessárias para os seguintes perfis de acessibilidade:

${adaptationDetails}

REGRAS OBRIGATÓRIAS:
1. Preserve o objetivo pedagógico original da atividade.
2. Reescreva as instruções, adaptando todos os elementos que apresentem barreiras de acessibilidade.
${colorblindRule ? `3. ${colorblindRule}` : ''}
4. A atividade deve estar completa e pronta para impressão e uso em sala de aula.
5. Ao final, inclua uma seção "Notas para o professor" explicando brevemente cada adaptação realizada.

ESTRUTURA OBRIGATÓRIA DA RESPOSTA (use exatamente estes títulos):
## Título da atividade
## Público-alvo e duração
## Objetivo
## Materiais necessários
## Desenvolvimento
## Notas para o professor`

    return GeminiService.summarizeDocument(prompt, {
      type: 'pdf',
      content: base64Content,
      mimeType: 'application/pdf'
    })
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
