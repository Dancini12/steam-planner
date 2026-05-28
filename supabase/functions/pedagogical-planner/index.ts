import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PedagogicalRequest {
  discipline: string
  grade: string
  theme: string
  steamCompetencies: string[]
  numberOfClasses?: string | number
  userId: string
}

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Supabase configuration is missing')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const COMPETENCY_TO_LETTER: Record<string, string> = {
  science: 'S',
  technology: 'T',
  engineering: 'E',
  arts: 'A',
  mathematics: 'M',
}

const STAGE_TITLES = [
  'ETAPA 1 - Introdução rápida do desafio',
  'ETAPA 2 - Investigação do problema',
  'ETAPA 3 - Planejamento da solução',
  'ETAPA 4 - Construção do protótipo',
  'ETAPA 5 - Teste e melhoria',
  'ETAPA 6 - Apresentação final',
]

const DEFAULT_STAGE_DESCRIPTIONS = [
  'Apresente o problema real em uma frase. Mostre uma evidência curta e explique a missão da equipe.',
  'Os alunos observam dados, objetos ou exemplos do cotidiano. Registram hipóteses e critérios para a solução funcionar.',
  'Cada equipe esboça uma solução simples. Define materiais, papéis e como vai medir se o protótipo funcionou.',
  'Os alunos montam a primeira versão física, visual, digital ou estrutural. O professor circula e faz perguntas de decisão.',
  'As equipes testam, comparam resultados e anotam falhas. Ajustam pelo menos um ponto e testam novamente.',
  'Cada equipe apresenta produto, teste realizado, melhoria feita e próximo ajuste possível.',
]

const DEFAULT_ASSESSMENT = [
  'A solução responde ao problema real.',
  'O protótipo foi construído, testado e melhorado.',
  'A equipe usou registros para justificar ajustes.',
]

const DEFAULT_MATERIALS = [
  'Materiais recicláveis ou de papelaria - quantidade por grupo',
  'Fita adesiva ou cola - 1 por grupo',
  'Tesoura sem ponta - 1 por grupo',
  'Régua, lápis e papel para registro',
  'Cronômetro ou celular do professor para teste',
]

const FALLBACK_REFERENCE = 'BRASIL. Ministério da Educação. Base Nacional Comum Curricular. Brasília: MEC, 2018.'

function cleanText(value: unknown): string {
  if (value == null) return ''
  return String(value).replace(/\s+/g, ' ').trim()
}

function limitText(value: unknown, maxChars: number): string {
  const text = cleanText(value)
  if (text.length <= maxChars) return text
  const slice = text.slice(0, maxChars + 1)
  const wordBreak = slice.lastIndexOf(' ')
  return `${slice.slice(0, wordBreak > 0 ? wordBreak : maxChars).trim()}...`
}

function toTextArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === 'string') return cleanText(item)
      if (item && typeof item === 'object') {
        const objectItem = item as Record<string, unknown>
        return cleanText(objectItem.text || objectItem.description || objectItem.criterion || '')
      }
      return ''
    }).filter(Boolean)
  }

  return cleanText(value)
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter(Boolean)
}

function normalizeStages(stages: unknown): Record<string, unknown>[] {
  const source = Array.isArray(stages) ? stages : []
  return STAGE_TITLES.map((title, index) => {
    const raw = source[index]
    const stage = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}
    const description = typeof raw === 'string'
      ? raw
      : cleanText(stage.description || stage.action || stage.text || stage.procedure || '')

    return {
      number: index + 1,
      title,
      description: limitText(description || DEFAULT_STAGE_DESCRIPTIONS[index], 280),
    }
  })
}

function normalizeActivity(raw: Record<string, unknown>, request: PedagogicalRequest): Record<string, unknown> {
  const theme = cleanText(raw.theme || request.theme)
  const stages = normalizeStages(raw.stages || raw.steps)
  const objective = limitText(raw.objective || toTextArray(raw.objectives)[0] || 'Investigar um problema real, construir uma solução, testar resultados e propor melhoria.', 170)
  const problem = limitText(raw.problem || `Como criar uma solução prática para um problema real relacionado a ${theme.toLowerCase()}?`, 340)
  const mission = limitText(raw.mission || `Sua equipe deverá investigar ${theme}, construir uma solução simples, testar e melhorar o resultado.`, 180)
  const makerChallenge = limitText(raw.makerChallenge || raw.guidingQuestion || `Construir uma primeira solução para ${theme.toLowerCase()}, testar, registrar falhas e melhorar pelo menos um elemento.`, 300)
  const finalProduct = limitText(raw.finalProduct || `Protótipo físico, visual ou digital sobre ${theme.toLowerCase()}, com registro do teste e da melhoria feita.`, 220)
  const materials = toTextArray(raw.materials).length ? toTextArray(raw.materials) : DEFAULT_MATERIALS

  return {
    ...raw,
    title: limitText(raw.title || `Desafio Maker: ${theme}`, 70),
    theme,
    duration: raw.duration || `${request.numberOfClasses || 1} aula${request.numberOfClasses && String(request.numberOfClasses) !== '1' ? 's' : ''}`,
    objective,
    objectives: [objective],
    problem,
    mission,
    guidingQuestion: makerChallenge,
    materials: materials.slice(0, 6).map((item) => limitText(item, 90)),
    stages,
    developmentStages: stages,
    activityManual: stages.map((stage) => `${stage.title}\n${stage.description}`).join('\n\n'),
    makerChallenge,
    finalProduct,
    assessment: (toTextArray(raw.assessment).length ? toTextArray(raw.assessment) : DEFAULT_ASSESSMENT)
      .slice(0, 4)
      .map((item) => limitText(item, 110)),
    bibliography: (toTextArray(raw.bibliography).length ? toTextArray(raw.bibliography) : [FALLBACK_REFERENCE])
      .slice(0, 3)
      .map((item) => limitText(item, 190)),
    priorKnowledge: [],
    vocabulary: [],
    safetyNotes: [],
    activityScaling: {},
    assemblyGuide: [],
    studentActivity: null,
    compactedForTwoPages: true,
    validatedForTwoPages: true,
  }
}

function validateLearningExperience(activity: Record<string, unknown>) {
  const text = [
    activity.problem,
    activity.mission,
    activity.makerChallenge,
    activity.finalProduct,
    activity.activityManual,
  ].join(' ').toLowerCase()

  const missing: string[] = []
  if (!activity.title) missing.push('title')
  if (!activity.objective) missing.push('objective')
  if (!activity.problem) missing.push('problem')
  if (!activity.mission) missing.push('mission')
  if (!Array.isArray(activity.materials) || activity.materials.length === 0) missing.push('materials')
  if (!Array.isArray(activity.stages) || activity.stages.length !== 6) missing.push('stages')
  if (!/investig/.test(text)) missing.push('investigation')
  if (!/constru|mont|cria|prototip/.test(text)) missing.push('prototype')
  if (!/test/.test(text)) missing.push('test')
  if (!/melhor|ajust|redesign|modific/.test(text)) missing.push('improvement')
  if (!activity.makerChallenge) missing.push('makerChallenge')
  if (!activity.finalProduct) missing.push('finalProduct')
  if (!Array.isArray(activity.assessment) || activity.assessment.length === 0) missing.push('assessment')
  if (!Array.isArray(activity.bibliography) || activity.bibliography.length === 0) missing.push('bibliography')
  if (missing.length) throw new Error(`Experiência STEAM + Maker incompleta: ${missing.join(', ')}`)
}

async function incrementUsage(userId: string, discipline: string, steamCompetencies: string[]) {
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
        .insert({ user_id: userId, discipline, count: 1, date: today, steam_competencies: steamCompetencies })
    }
  } catch (error) {
    console.error('Error in incrementUsage:', error)
  }
}

function buildPrompt(request: PedagogicalRequest): string {
  const steamLetters = request.steamCompetencies
    .map((c) => COMPETENCY_TO_LETTER[c.toLowerCase()])
    .filter(Boolean)

  const classesInfo = request.numberOfClasses ? `- Duração total: ${request.numberOfClasses} aulas` : ''
  const stageTitles = STAGE_TITLES.map((title) => `- ${title}`).join('\n')

  return `Você é especialista em educação STEAM, Cultura Maker e BNCC para o sistema educacional brasileiro.

Gere uma EXPERIÊNCIA DE APRENDIZAGEM STEAM + CULTURA MAKER, não uma apostila, artigo ou plano tradicional.

Parâmetros:
- Disciplina principal: ${request.discipline}
- Série/Ano: ${request.grade}
- Tema central: ${request.theme}
- Áreas STEAM envolvidas: ${steamLetters.join(', ')}
${classesInfo}

REGRA CENTRAL:
Toda atividade deve nascer de um problema real, desafio investigativo, missão prática, construção/prototipagem, teste e melhoria da solução.

LIMITE:
- Máximo de 2 páginas A4.
- Texto compacto, leitura rápida e aplicação imediata.
- Reduza explicações narrativas, contextualização excessiva, repetição e frases acadêmicas.
- Priorize ação, construção, investigação, teste e melhoria.

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

Desenvolvimento obrigatório:
${stageTitles}

Regras:
- "objective": 1 frase, até 20 palavras.
- "problem": problema real e concreto, até 45 palavras.
- "mission": frase curta começando com "Sua equipe deverá..." quando for grupo.
- "materials": máximo 6 itens acessíveis, com quantidade por grupo.
- "stages": exatamente 6 etapas, na ordem acima, cada uma com até 3 frases curtas.
- "makerChallenge": deve indicar o que construir, como testar e o que melhorar.
- "finalProduct": produto ou protótipo concreto.
- "assessment": máximo 4 critérios curtos e observáveis.
- "bibliography": use referência real. Se não tiver fonte específica, use a BNCC.
- Não use emojis, matriz STEAM, Design Thinking, fundamentação, material do aluno, vocabulário ou anexos.

Responda APENAS com JSON válido, sem texto antes ou depois:

{
  "title": "Título curto da experiência",
  "theme": "${request.theme}",
  "duration": "${request.numberOfClasses || 1} aula${request.numberOfClasses && String(request.numberOfClasses) !== '1' ? 's' : ''}",
  "objective": "Objetivo geral curto.",
  "problem": "Problema real que inicia a experiência.",
  "mission": "Sua equipe deverá desenvolver uma solução prática para o problema.",
  "bncc": ["EF07CI01", "EF07MA01", "EF07LP02"],
  "materials": [
    "Material 1 - quantidade por grupo",
    "Material 2 - quantidade por grupo"
  ],
  "stages": [
    { "number": 1, "title": "ETAPA 1 - Introdução rápida do desafio", "description": "Apresente o problema e a missão. Mostre uma evidência rápida. Combine o produto esperado." },
    { "number": 2, "title": "ETAPA 2 - Investigação do problema", "description": "Os alunos observam dados ou exemplos. Levantam hipóteses. Definem critérios de sucesso." },
    { "number": 3, "title": "ETAPA 3 - Planejamento da solução", "description": "Cada equipe esboça a ideia. Escolhe materiais. Planeja como testar." },
    { "number": 4, "title": "ETAPA 4 - Construção do protótipo", "description": "Os alunos constroem a primeira versão. Registram decisões. Ajustam a montagem durante a execução." },
    { "number": 5, "title": "ETAPA 5 - Teste e melhoria", "description": "Cada equipe testa o protótipo. Compara resultados. Melhora um ponto e testa novamente." },
    { "number": 6, "title": "ETAPA 6 - Apresentação final", "description": "Cada equipe apresenta produto, teste e melhoria. A turma compara soluções. Registra próximos ajustes." }
  ],
  "makerChallenge": "Construir, testar, comparar e melhorar uma solução para o problema.",
  "finalProduct": "Protótipo final com registro do teste e da melhoria feita.",
  "assessment": [
    "Critério curto de investigação.",
    "Critério curto de construção e teste.",
    "Critério curto de melhoria."
  ],
  "bibliography": [
    "${FALLBACK_REFERENCE}"
  ]
}`
}

function extractJson(text: string): string {
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

async function generateActivity(request: PedagogicalRequest): Promise<object> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY não configurada no Supabase')

  const model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash'
  const prompt = buildPrompt(request)

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
      }),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Gemini API error (${response.status}): ${err}`)
  }

  const data = await response.json()
  const rawText: string = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  if (!rawText) throw new Error('Gemini não retornou conteúdo')

  const jsonStr = extractJson(rawText)
  const parsed = JSON.parse(jsonStr)
  const normalized = normalizeActivity(parsed, request)

  validateLearningExperience(normalized)

  return normalized
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { discipline, grade, theme, steamCompetencies, numberOfClasses, userId }: PedagogicalRequest = await req.json()

    if (!discipline || !grade || !theme || !steamCompetencies || !userId) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros obrigatórios faltando', required: ['discipline', 'grade', 'theme', 'steamCompetencies', 'userId'] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const competenciesWithMaker = [...new Set([...steamCompetencies, 'Maker'])]

    const projectData = await generateActivity({
      discipline, grade, theme,
      steamCompetencies: competenciesWithMaker,
      numberOfClasses,
      userId,
    })

    // Incremento de uso é feito pelo frontend após salvar o projeto com sucesso

    return new Response(
      JSON.stringify({ activity: projectData, generatedAt: new Date().toISOString(), competencies: competenciesWithMaker }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in pedagogical-planner:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
