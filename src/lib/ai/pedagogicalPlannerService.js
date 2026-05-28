import { supabase } from '../supabaseClient.js'
import { AIProviderManager } from './AIProviderManager.js'
import {
  formatBnccSuggestions,
  getBnccCodes,
  normalizeBnccCode,
  normalizeBnccCodes,
  selectBnccHabilidades
} from '../bnccSelector.js'
import { findSourcesForActivity } from '../sources/index.js'
import {
  getContextForActivity,
  saveSourcesAsync,
} from '../knowledge/knowledgeBaseService.js'
import { getQualityPatterns } from '../machine-learning/behavior-tracking/behaviorTracker.js'
import {
  getLearningExperienceStageTitles,
  normalizeLearningExperience,
  validateLearningExperience
} from '../learningExperience.js'

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

  const classesInfo = numberOfClasses ? `- Duração total: ${numberOfClasses} aulas` : ''
  const modalityInfo = modality === 'individual'
    ? '- Modalidade: INDIVIDUAL - o aluno constrói, testa, registra e melhora sua solução'
    : '- Modalidade: EM GRUPO - organize equipes com papéis simples: construtor, testador, registrador e apresentador'

  const stageTitles = getLearningExperienceStageTitles()
    .map((title) => `- ${title}`)
    .join('\n')

  return `Você é especialista em educação STEAM, Cultura Maker e BNCC para o sistema educacional brasileiro.

MUDANÇA CENTRAL:
Não gere plano tradicional, apostila, fundamentação acadêmica ou texto pedagógico longo.
Gere uma EXPERIÊNCIA DE APRENDIZAGEM STEAM + CULTURA MAKER: problema real, investigação, missão, construção, teste, falha, melhoria e apresentação.

Dados da experiência:
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

REGRA CENTRAL:
Toda experiência precisa nascer de:
1. um problema real;
2. um desafio investigativo;
3. uma missão prática curta;
4. uma construção/prototipagem física, visual, digital, mecânica, eletrônica ou estrutural;
5. um teste prático com observação/comparação;
6. uma melhoria/redesign da solução.

LIMITE OBRIGATÓRIO:
- A atividade final deve caber em no máximo 2 páginas A4.
- Escreva conteúdo compacto, leitura rápida e aplicação imediata.
- Reduza explicações narrativas, contextualizações, repetições e frases acadêmicas.
- Cada etapa deve ter no máximo 3 frases curtas, com foco em ação.
- Não inclua seções extras, material do aluno, vocabulário, fundamentação, matriz STEAM, Design Thinking, anexos ou explicação sobre Cultura Maker.

ESTRUTURA VISÍVEL OBRIGATÓRIA - somente estas 9 seções:
1. Título
2. Objetivo geral curto
3. Problema/desafio
4. Materiais
5. Desenvolvimento da atividade
6. Desafio Maker
7. Produto final
8. Avaliação
9. Referência do conteúdo utilizado

Desenvolvimento da atividade - títulos obrigatórios:
${stageTitles}

Regras de conteúdo:
- "objective": 1 frase, até 20 palavras.
- "problem": problema real, concreto e contextualizado, até 45 palavras.
- "mission": frase curta começando com "Sua equipe deverá..." ou equivalente individual.
- "materials": máximo 6 itens acessíveis, com quantidade por grupo.
- "stages": exatamente 6 etapas, na ordem obrigatória acima.
- "makerChallenge": deve dizer claramente o que construir, como testar e o que melhorar.
- "finalProduct": protótipo ou produto concreto final.
- "assessment": máximo 4 critérios curtos, observáveis e ligados ao processo.
- "bibliography": use fontes verificadas abaixo quando houver. Nunca use Wikipedia. Se não houver fonte específica, inclua apenas a BNCC como referência oficial.
- "bncc": use APENAS códigos da lista offline acima; não invente códigos.
- Não use emojis, slogans, texto promocional ou linguagem de apostila.

${verifiedSources.length > 0
  ? `Fontes verificadas em bases acadêmicas reais (Crossref, OpenAlex, SciELO, Semantic Scholar):\n${verifiedSources.map((s, i) => `${i + 1}. ${s.abnt}`).join('\n')}`
  : 'Nenhuma fonte específica localizada automaticamente. Use a BNCC como referência oficial do conteúdo curricular.'}
${knowledgeContext ? `\nBase de conhecimento pedagógico local (use para enriquecer a atividade — conteúdo já validado):\n${knowledgeContext}` : ''}

Responda APENAS com JSON válido, sem texto antes ou depois:

{
  "title": "Título curto da experiência",
  "theme": "${theme}",
  "duration": "${numberOfClasses || 1} aula${numberOfClasses > 1 ? 's' : ''}",
  "objective": "Objetivo geral curto com verbo de ação.",
  "problem": "Problema real ou situação desafiadora que inicia a experiência.",
  "mission": "Sua equipe deverá desenvolver uma solução prática para o problema.",
  "bncc": ${JSON.stringify(getBnccCodes(bnccSuggestions))},
  "materials": [
    "Material 1 - quantidade por grupo",
    "Material 2 - quantidade por grupo"
  ],
  "stages": [
    {
      "number": 1,
      "title": "ETAPA 1 - Introdução rápida do desafio",
      "description": "Apresente o problema real e a missão. Mostre uma evidência rápida. Combine o produto esperado."
    },
    {
      "number": 2,
      "title": "ETAPA 2 - Investigação do problema",
      "description": "Os alunos observam dados, exemplos ou materiais. Levantam hipóteses. Definem critérios para a solução funcionar."
    },
    {
      "number": 3,
      "title": "ETAPA 3 - Planejamento da solução",
      "description": "Cada equipe esboça a ideia. Escolhe materiais. Decide como testar e comparar o resultado."
    },
    {
      "number": 4,
      "title": "ETAPA 4 - Construção do protótipo",
      "description": "Os alunos constroem a primeira versão. Registram decisões. O professor acompanha com perguntas práticas."
    },
    {
      "number": 5,
      "title": "ETAPA 5 - Teste e melhoria",
      "description": "Cada equipe testa o protótipo. Compara resultados com os critérios. Ajusta pelo menos um ponto e testa novamente."
    },
    {
      "number": 6,
      "title": "ETAPA 6 - Apresentação final",
      "description": "Cada equipe apresenta produto, teste e melhoria. A turma compara soluções. Feche com uma decisão de próximo ajuste."
    }
  ],
  "makerChallenge": "Construir, testar, comparar e melhorar uma solução para o problema.",
  "finalProduct": "Protótipo final com registro do teste e da melhoria feita.",
  "assessment": [
    "Critério curto ligado à investigação.",
    "Critério curto ligado à construção e ao teste.",
    "Critério curto ligado à melhoria da solução."
  ],
  "bibliography": [
    "${verifiedSources[0]?.abnt || 'BRASIL. Ministério da Educação. Base Nacional Comum Curricular. Brasília: MEC, 2018.'}"
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
  const validation = validateLearningExperience(data)
  if (!validation.valid) {
    throw new Error(`Experiência STEAM + Maker incompleta: ${validation.missing.join(', ')}`)
  }
  return true
}

function buildSteamMatrixFromCompetencies(steamCompetencies = []) {
  return steamCompetencies
    .map((c) => COMPETENCY_TO_LETTER[String(c).toLowerCase()])
    .filter(Boolean)
    .reduce((acc, letter) => {
      acc[letter] = {
        contribution: 'Investigação, construção, teste e melhoria aplicados ao desafio.',
        activity: 'Ação prática integrada ao protótipo.',
        evidence: 'Registro do protótipo, teste e melhoria.'
      }
      return acc
    }, {})
}

function applyOfflineBncc(data, bnccSuggestions) {
  const offlineCodes = getBnccCodes(bnccSuggestions)
  if (offlineCodes.length === 0) {
    return {
      ...data,
      bncc: Array.isArray(data.bncc) ? normalizeBnccCodes(data.bncc) : []
    }
  }

  // AI may return "EF09CI01 — description" or plain "EF09CI01"
  const extractCode = (s) => normalizeBnccCode(s)

  const selectedItems = Array.isArray(data.bncc)
    ? data.bncc.map(extractCode).filter((code) => offlineCodes.includes(code))
    : []

  return {
    ...data,
    bncc: selectedItems.length > 0 ? selectedItems : offlineCodes.slice(0, 3)
  }
}

function buildClassroomPrompt(project) {
  const stageTitles = getLearningExperienceStageTitles()
    .map((title) => `- ${title}`)
    .join('\n')

  const objectives = (project.objectives || []).map((o, i) => `${i + 1}. ${o}`).join('\n')
  const bncc = (project.bncc || []).join(', ')
  const materials = (project.materials || []).map((m) => `- ${m}`).join('\n')
  const phaseLines = Object.entries(project.phases || {})
    .map(([id, p]) => p.plan ? `  Fase ${id}: ${p.plan}` : null)
    .filter(Boolean)
    .join('\n')

  return `Você é especialista em educação STEAM e Cultura Maker para o sistema educacional brasileiro.

Transforme o projeto abaixo em uma EXPERIÊNCIA DE APRENDIZAGEM STEAM + CULTURA MAKER compacta.
Não gere plano tradicional, apostila, fundamentação longa, matriz STEAM, material do aluno ou anexos.

DADOS DO PROJETO:
- Título: ${project.title || ''}
- Tema: ${project.theme || ''}
- Série/Ano: ${project.grade || ''}
- Duração total: ${project.duration || ''}
- Problema central: ${project.problem || ''}
- Pergunta norteadora: ${project.guidingQuestion || ''}
- Produto final esperado: ${project.finalProduct || ''}
- Habilidades BNCC: ${bncc}
- Materiais disponíveis:
${materials}
- Objetivos de aprendizagem:
${objectives}
- Planejamento das fases (preenchido pelo professor):
${phaseLines || '  (sem planos específicos registrados)'}

TAREFA:
Gere somente as 9 seções obrigatórias:
1. Título
2. Objetivo geral curto
3. Problema/desafio
4. Materiais
5. Desenvolvimento da atividade
6. Desafio Maker
7. Produto final
8. Avaliação
9. Referência do conteúdo utilizado

Regras:
- Deve caber em no máximo 2 páginas A4.
- Toda etapa deve ter ação prática, não explicação longa.
- A experiência deve incluir problema real, missão, investigação, construção/prototipagem, teste, comparação e melhoria.
- Desenvolvimento deve ter exatamente estes títulos:
${stageTitles}
- Cada etapa: máximo 3 frases curtas.
- Materiais: máximo 6 itens acessíveis.
- Avaliação: máximo 4 critérios curtos.
- Referências: máximo 3 itens. Use as referências do projeto se houver; não invente fonte.
- Não use emojis.

Responda APENAS com JSON válido, sem texto antes ou depois:

{
  "title": "Título curto da experiência",
  "theme": "${project.theme || project.title || ''}",
  "duration": "${project.duration || '1 aula'}",
  "objective": "Objetivo geral curto.",
  "problem": "Problema real que inicia a atividade.",
  "mission": "Sua equipe deverá construir e melhorar uma solução.",
  "materials": [
    "material 1 - quantidade por grupo",
    "material 2 - quantidade por grupo"
  ],
  "stages": [
    {
      "number": 1,
      "title": "ETAPA 1 - Introdução rápida do desafio",
      "description": "Apresente o problema e a missão. Mostre uma evidência rápida. Combine o produto esperado."
    },
    {
      "number": 2,
      "title": "ETAPA 2 - Investigação do problema",
      "description": "Os alunos observam dados ou exemplos. Levantam hipóteses. Definem critérios de sucesso."
    },
    {
      "number": 3,
      "title": "ETAPA 3 - Planejamento da solução",
      "description": "Cada equipe esboça a ideia. Escolhe materiais. Planeja como testar."
    },
    {
      "number": 4,
      "title": "ETAPA 4 - Construção do protótipo",
      "description": "Os alunos constroem a primeira versão. Registram decisões. Ajustam a montagem durante a execução."
    },
    {
      "number": 5,
      "title": "ETAPA 5 - Teste e melhoria",
      "description": "Cada equipe testa o protótipo. Compara resultados. Melhora um ponto e testa novamente."
    },
    {
      "number": 6,
      "title": "ETAPA 6 - Apresentação final",
      "description": "Cada equipe apresenta produto, teste e melhoria. A turma compara soluções. Registra próximos ajustes."
    }
  ],
  "makerChallenge": "Construir, testar, comparar e melhorar uma solução para o problema.",
  "finalProduct": "Protótipo final com registro do teste e da melhoria feita.",
  "assessment": [
    "Critério curto de investigação.",
    "Critério curto de construção e teste.",
    "Critério curto de melhoria."
  ],
  "bibliography": ${JSON.stringify(project.bibliography?.length ? project.bibliography.slice(0, 3) : ['BRASIL. Ministério da Educação. Base Nacional Comum Curricular. Brasília: MEC, 2018.'])},
  "bncc": ${JSON.stringify(project.bncc || [])}
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
    const normalized = normalizeLearningExperience(parsed, { theme, grade, discipline })

    validateActivity(normalized)

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
      activity: {
        ...normalized,
        grade,
        discipline,
        duration: normalized.duration || `${numberOfClasses || 1} aula${numberOfClasses > 1 ? 's' : ''}`,
        steamMatrix: normalized.steamMatrix || buildSteamMatrixFromCompetencies(steamCompetencies),
        modality: modality || 'grupo'
      },
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
    const normalized = normalizeLearningExperience(
      {
        ...parsed,
        title: parsed.title || parsed.activityTitle,
        stages: parsed.stages || parsed.steps,
        problem: parsed.problem || project.problem,
        finalProduct: parsed.finalProduct || project.finalProduct,
        bibliography: parsed.bibliography || project.bibliography,
        bncc: parsed.bncc || project.bncc,
        materials: parsed.materials || project.materials
      },
      {
        theme: project.theme || project.title,
        grade: project.grade,
        discipline: project.discipline
      }
    )

    validateActivity(normalized)

    return normalized
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
