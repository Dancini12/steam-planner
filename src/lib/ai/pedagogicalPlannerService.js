import { supabase } from '../supabaseClient.js'
import { AIProviderManager } from './AIProviderManager.js'

const COMPETENCY_TO_LETTER = {
  science: 'S',
  technology: 'T',
  engineering: 'E',
  arts: 'A',
  mathematics: 'M',
}

function buildPrompt({ discipline, grade, theme, steamCompetencies }) {
  const steamLetters = steamCompetencies
    .map((c) => COMPETENCY_TO_LETTER[String(c).toLowerCase()])
    .filter(Boolean)

  const uniqueLetters = [...new Set(steamLetters)]

  const steamMatrixShape = uniqueLetters.reduce((acc, letter) => {
    acc[letter] = { contribution: '...', activity: '...', evidence: '...' }
    return acc
  }, {})

  return `Você é especialista em educação STEAM, Cultura Maker e BNCC para o sistema educacional brasileiro.

Crie uma atividade pedagógica completa para:
- Disciplina principal: ${discipline}
- Série/Ano: ${grade}
- Tema central: ${theme}
- Áreas STEAM envolvidas: ${uniqueLetters.join(', ')}
- Cultura Maker: obrigatória em todas as fases

Diretrizes obrigatórias:
1. Materiais acessíveis para escolas públicas brasileiras (baixo custo)
2. Questão norteadora aberta e investigativa
3. Objetivos mensuráveis alinhados à série
4. Códigos BNCC reais (ex: EF07CI05, EF08MA03, EF06LP01)
5. Cultura Maker em todas as fases: mão na massa, prototipagem, iteração
6. Cada fase com descrição operacional detalhada de atividades concretas
7. Referências bibliográficas reais no formato ABNT

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
  "bncc": ["EF07CI05", "EF07MA03"],
  "materials": [
    "Material 1 (acessível)",
    "Material 2",
    "Material 3",
    "Material 4",
    "Material 5"
  ],
  "phaseDetails": {
    "imersao": "Descrição detalhada da fase Imersão: atividades concretas maker para professor e alunos, recursos, produto esperado.",
    "ideacao": "Descrição detalhada da fase Ideação: brainstorming, geração e seleção de ideias, esboços, decisão coletiva com elementos maker.",
    "prototipagem": "Descrição detalhada da fase Prototipagem: o que construir, como, com quais materiais, registro do processo maker.",
    "teste": "Descrição detalhada da fase Teste: como testar, métricas, coleta de dados, iteração e melhoria.",
    "compartilhamento": "Descrição detalhada da fase Compartilhamento: formato de apresentação, audiência, preparação, celebração do aprendizado."
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

function validateActivity(data) {
  const required = ['title', 'theme', 'duration', 'problem', 'guidingQuestion', 'steamMatrix', 'objectives', 'bncc', 'materials', 'phaseDetails']
  for (const field of required) {
    if (!data[field]) throw new Error(`Campo obrigatório ausente na resposta da IA: ${field}`)
  }
  const phases = ['imersao', 'ideacao', 'prototipagem', 'teste', 'compartilhamento']
  for (const phase of phases) {
    if (!data.phaseDetails[phase]) throw new Error(`Fase ausente na resposta da IA: ${phase}`)
  }
  return true
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

Responda APENAS com JSON válido, sem texto antes ou depois:

{
  "activityTitle": "Título do roteiro de aula",
  "targetAudience": "${project.grade || 'Ensino Fundamental'}",
  "duration": "X aulas de Y minutos",
  "objective": "O que os alunos vão aprender/fazer nesta aula.",
  "materials": ["material 1", "material 2"],
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

export class PedagogicalPlannerService {
  static async generatePedagogicalActivity(params) {
    const { discipline, grade, theme, steamCompetencies, userId } = params

    const prompt = buildPrompt({ discipline, grade, theme, steamCompetencies })

    const response = await AIProviderManager.request({
      requestType: 'pedagogicalactivity',
      prompt
    })

    const rawText = response.content
    if (!rawText || typeof rawText !== 'string') {
      throw new Error('A IA não retornou conteúdo válido.')
    }

    const jsonStr = extractJson(rawText)
    const parsed = JSON.parse(jsonStr)

    validateActivity(parsed)

    return {
      activity: parsed,
      generatedAt: new Date().toISOString(),
      competencies: steamCompetencies
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
    const parsed = JSON.parse(jsonStr)

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

