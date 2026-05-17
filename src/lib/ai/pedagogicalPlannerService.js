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

Crie uma atividade pedagógica completa para:
- Disciplina principal: ${discipline}
- Série/Ano: ${grade}
- Tema central: ${theme}
- Áreas STEAM envolvidas: ${uniqueLetters.join(', ')}
${classesInfo}
- Cultura Maker: obrigatória na atividade
- Habilidades BNCC selecionadas do banco offline:
${formatBnccSuggestions(bnccSuggestions)}
${customInstructions?.trim() ? `\nSolicitações específicas do professor:\n${customInstructions.trim()}` : ''}

Diretrizes obrigatórias:
1. Materiais acessíveis para escolas públicas brasileiras (baixo custo)
2. Questão norteadora aberta e investigativa
3. Objetivos mensuráveis alinhados à série
4. Use no campo "bncc" apenas códigos da lista BNCC offline fornecida acima; não invente códigos novos
5. Cultura Maker ao longo da atividade: mão na massa, prototipagem, iteração
6. Não organize a resposta por fases, etapas de Design Thinking ou blocos como Imersão, Ideação, Prototipagem, Teste e Compartilhamento
7. Lista de materiais com quantidade por grupo e, quando fizer sentido, quantidade para a turma. Ex.: "2 folhas de cartolina por grupo", "4 canetas coloridas por grupo", "1 tesoura sem ponta por grupo"
8. Manual da atividade em três partes no campo "activityManual" (texto corrido, não JSON):
   - "Resumo das competências": texto conectando as áreas STEAM à atividade
   - "Materiais utilizados": lista explicando o uso de cada material
   - "Como montar e conduzir": visão geral da condução (o roteiro detalhado por etapas fica em "stages")
9. Referências bibliográficas: use SOMENTE as fontes verificadas listadas abaixo. NÃO invente autores, títulos, editoras, DOIs ou anos. Se a lista estiver vazia, deixe "bibliography": [].
10. Roteiro pedagógico detalhado (campo "stages"): gerar EXATAMENTE 8 etapas em array JSON. Cada etapa deve ter description com MÍNIMO DE 150 PALAVRAS, rica, explicativa e prática, além de teacherScript com roteiro direto para o professor e questions com perguntas sugeridas. As 8 etapas obrigatórias:
    • Etapa 1 — Introdução da aula: como o professor inicia, contextualiza o tema, desperta curiosidade, conecta ao cotidiano real dos alunos. Inclua frases-modelo de abertura.
    • Etapa 2 — Explicação inicial: quais conceitos o professor ensina, com exemplos concretos, analogias acessíveis, linguagem adequada à série. Como verificar compreensão.
    • Etapa 3 — Organização da atividade: como dividir os grupos (critérios, tamanhos), distribuir materiais (quem pega o quê), organizar o espaço físico, tempo estimado para cada parte.
    • Etapa 4 — Desenvolvimento prático: o que os alunos constroem ou fazem passo a passo, como o desafio Maker se desenvolve, como estimular criatividade e protagonismo.
    • Etapa 5 — Mediação do professor: como circular pela sala, como incentivar sem dar respostas prontas, perguntas de mediação, como trabalhar colaboração entre os grupos.
    • Etapa 6 — Testes e experimentação: como os alunos testam suas soluções, como identificar erros construtivos, como incentivar ciclos de melhoria e prototipagem iterativa.
    • Etapa 7 — Discussão e reflexão: perguntas para debate coletivo, como conectar com STEAM e cotidiano, como desenvolver pensamento crítico e síntese da aprendizagem.
    • Etapa 8 — Finalização e fechamento: como concluir, como organizar apresentações dos grupos, como fazer o fechamento pedagógico com síntese do que foi aprendido.
11. Antes da aula (campo "beforeClass"): texto de 100+ palavras sobre o que o professor deve preparar, organizar e providenciar ANTES da aula — materiais, ambiente, agrupamentos, impressões, recursos digitais ou físicos.
12. Após a aula (campo "afterClass"): texto de 80+ palavras sobre o que fazer APÓS a aula — como registrar evidências, como fazer avaliação formativa, como dar devolutiva, como encaminhar a continuidade do aprendizado.
13. Dicas para o professor (campo "teacherTips"): mínimo 6 dicas numeradas, práticas e acolhedoras sobre como adaptar a atividade a turmas agitadas, poucos recursos, escolas públicas, alunos com dificuldade, tempo reduzido e turmas avançadas.

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
  "bncc": ${JSON.stringify(getBnccCodes(bnccSuggestions))},
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
      "title": "Etapa 1 — Introdução da aula",
      "duration": "10 a 15 minutos",
      "description": "Texto rico de 150+ palavras: como iniciar a aula, apresentar o tema, despertar curiosidade dos alunos, fazer conexão com situações do cotidiano deles e com o problema real da atividade. Inclua exemplos de como o professor pode abrir a conversa.",
      "teacherScript": "Roteiro prático: o que o professor diz, como se posiciona, que recursos usa para introduzir. Inclua frases-modelo e tom de voz sugerido.",
      "questions": ["Pergunta de abertura para despertar curiosidade 1?", "Pergunta para conectar ao cotidiano 2?"]
    },
    {
      "number": 2,
      "title": "Etapa 2 — Explicação inicial",
      "duration": "15 a 20 minutos",
      "description": "Texto rico de 150+ palavras: quais conceitos o professor apresenta, como explicar de forma simples e acessível para a série, que exemplos concretos e analogias usar, como verificar se os alunos compreenderam antes de avançar.",
      "teacherScript": "O que o professor explica, como usa exemplos do dia a dia, que vocabulário adota, como faz perguntas de verificação de compreensão.",
      "questions": ["Pergunta de verificação de compreensão 1?", "O que você já sabe sobre esse assunto?"]
    },
    {
      "number": 3,
      "title": "Etapa 3 — Organização da atividade",
      "duration": "10 minutos",
      "description": "Texto rico de 150+ palavras: como dividir os grupos (critérios, tamanho ideal, perfis complementares), como distribuir os materiais (quem pega o quê, onde ficam), como organizar o espaço físico da sala, tempo estimado de cada parte, cuidados importantes de segurança e convivência.",
      "teacherScript": "Instruções diretas para a turma sobre formação dos grupos, posicionamento na sala e recebimento dos materiais.",
      "questions": []
    },
    {
      "number": 4,
      "title": "Etapa 4 — Desenvolvimento prático",
      "duration": "30 a 40 minutos",
      "description": "Texto rico de 150+ palavras: o que os alunos constroem, criam ou fazem passo a passo, como o desafio Maker se desenvolve na prática, como o professor estimula criatividade e protagonismo dos grupos, como garantir que todos participem ativamente.",
      "teacherScript": "Como o professor lança o desafio, que instruções dá no início e no decorrer, como estimula os grupos sem fazer por eles.",
      "questions": []
    },
    {
      "number": 5,
      "title": "Etapa 5 — Mediação do professor",
      "duration": "durante o desenvolvimento",
      "description": "Texto rico de 150+ palavras: como o professor deve circular pela sala sem interromper o fluxo, como incentiva grupos que travam, como estimula pensamento crítico com perguntas abertas, como trabalha colaboração e resolve conflitos sem tomar partido, como documenta evidências de aprendizagem.",
      "teacherScript": "Perguntas de mediação que o professor faz ao visitar cada grupo, postura corporal, tom de voz e atitude de facilitador.",
      "questions": ["O que vocês já tentaram?", "O que aconteceu quando fizeram isso?", "Que outras formas vocês podem testar?"]
    },
    {
      "number": 6,
      "title": "Etapa 6 — Testes e experimentação",
      "duration": "15 a 20 minutos",
      "description": "Texto rico de 150+ palavras: como os alunos testam suas soluções de forma estruturada, como identificar e nomear os erros de forma construtiva, como o professor incentiva os ciclos de melhoria (construir → testar → ajustar → testar novamente), como cultivar a mentalidade de que errar faz parte do processo.",
      "teacherScript": "Como o professor conduz a etapa de testes, que linguagem usa para normalizar o erro, como orienta o registro das tentativas.",
      "questions": ["O que funcionou como esperado?", "O que não funcionou e por quê?", "Como podemos melhorar isso?"]
    },
    {
      "number": 7,
      "title": "Etapa 7 — Discussão e reflexão",
      "duration": "15 minutos",
      "description": "Texto rico de 150+ palavras: como o professor conduz o debate coletivo, que perguntas usa para estimular reflexão profunda, como conecta a atividade com situações reais e com as áreas STEAM, como desenvolver o pensamento crítico e a capacidade de argumentação dos alunos.",
      "teacherScript": "Como abrir a roda de conversa, como distribuir a fala entre grupos diferentes, como registrar as conclusões coletivas no quadro ou em cartaz.",
      "questions": ["Como o que fizemos hoje aparece na vida real?", "O que foi mais surpreendente neste processo?", "Como as áreas STEAM se conectam nesta atividade?", "O que você mudaria se fosse repetir?"]
    },
    {
      "number": 8,
      "title": "Etapa 8 — Finalização e fechamento",
      "duration": "10 a 15 minutos",
      "description": "Texto rico de 150+ palavras: como concluir a atividade de forma marcante, como organizar as apresentações dos grupos (tempo, formato, critérios), como o professor faz o fechamento pedagógico sintetizando aprendizagens, como conectar o que foi aprendido ao próximo passo do currículo.",
      "teacherScript": "Roteiro do fechamento: o que o professor fala para concluir, como celebra os resultados, que síntese faz das aprendizagens, que encaminhamento dá.",
      "questions": ["O que cada grupo aprendeu hoje?", "Como podemos levar esse conhecimento para fora da escola?"]
    }
  ],
  "beforeClass": "Texto de 100+ palavras: o que o professor deve preparar, organizar e providenciar ANTES da aula — quais materiais separar e como, como reorganizar o espaço físico, se há algo para imprimir ou baixar, como pré-definir os grupos se necessário, quanto tempo de preparação estimar.",
  "afterClass": "Texto de 80+ palavras: o que fazer APÓS a aula — como registrar as evidências de aprendizagem, como fazer avaliação formativa, como dar devolutiva significativa aos alunos, como guardar as produções, como encaminhar a continuidade para a próxima aula.",
  "teacherTips": "1. Dica para turmas agitadas: ...\\n2. Dica para poucos recursos: ...\\n3. Dica para escolas públicas: ...\\n4. Dica para alunos com dificuldade: ...\\n5. Dica para tempo reduzido: ...\\n6. Dica para turmas avançadas: ...",
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

  const selectedCodes = Array.isArray(data.bncc)
    ? data.bncc.filter((code) => offlineCodes.includes(code))
    : []

  return {
    ...data,
    bncc: selectedCodes.length > 0 ? selectedCodes : offlineCodes.slice(0, 3)
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
