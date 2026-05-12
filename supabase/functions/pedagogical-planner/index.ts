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

  const steamMatrixTemplate = steamLetters.reduce((acc: Record<string, object>, letter: string) => {
    acc[letter] = { contribution: '...', activity: '...', evidence: '...' }
    return acc
  }, {})

  const classesInfo = request.numberOfClasses ? `- Duração total: ${request.numberOfClasses} aulas` : ''

  return `Você é especialista em educação STEAM, Cultura Maker e BNCC para o sistema educacional brasileiro.

Crie uma atividade pedagógica completa com os seguintes parâmetros:
- Disciplina principal: ${request.discipline}
- Série/Ano: ${request.grade}
- Tema central: ${request.theme}
- Áreas STEAM envolvidas: ${steamLetters.join(', ')}
${classesInfo}
- Cultura Maker: obrigatória em todas as fases

Diretrizes obrigatórias:
1. Projeto realista para escolas públicas (materiais acessíveis e de baixo custo)
2. Questão norteadora aberta e investigativa
3. Objetivos de aprendizagem mensuráveis e alinhados à série
4. Códigos BNCC reais e corretos (ex: EF07CI01, EF08MA03, EF06LP01)
5. Cultura Maker em todas as fases: mão na massa, prototipagem, iteração, trabalho colaborativo
6. Cada fase com descrição detalhada e operacional de atividades concretas
7. Referências bibliográficas reais no formato ABNT${request.numberOfClasses ? `
8. A atividade DEVE ser adequada para ser realizada em EXATAMENTE ${request.numberOfClasses} aula${request.numberOfClasses !== '1' ? 's' : ''}: ajuste a profundidade, número de fases e complexidade das atividades de forma proporcional ao tempo disponível. Seja realista sobre o que é possível fazer em ${request.numberOfClasses} aula${request.numberOfClasses !== '1' ? 's' : '}.` : ''}

Responda APENAS com JSON válido, sem texto antes ou depois:

{
  "title": "Título envolvente da atividade pedagógica",
  "theme": "Subtítulo curto que complementa o título",
  "duration": "X semanas · Y aulas de Z minutos",
  "problem": "Problema ou desafio real e concreto que mobiliza a atividade",
  "guidingQuestion": "Pergunta norteadora aberta que orienta toda a investigação?",
  "steamMatrix": ${JSON.stringify(steamMatrixTemplate, null, 2)},
  "objectives": [
    "Objetivo de aprendizagem 1 (com verbo de ação mensurável)",
    "Objetivo de aprendizagem 2",
    "Objetivo de aprendizagem 3",
    "Objetivo de aprendizagem 4"
  ],
  "bncc": ["EF07CI01", "EF07MA01", "EF07LP02"],
  "materials": [
    "Material 1 (acessível e de baixo custo)",
    "Material 2",
    "Material 3",
    "Material 4",
    "Material 5"
  ],
  "phaseDetails": {
    "imersao": "Descrição detalhada e operacional da fase Imersão: o que professor e alunos farão, como, com quais recursos, e qual o produto esperado. Incluir elementos maker.",
    "ideacao": "Descrição detalhada e operacional da fase Ideação: dinâmicas de brainstorming, geração e seleção de ideias, esboços, decisão coletiva. Incluir elementos maker.",
    "prototipagem": "Descrição detalhada e operacional da fase Prototipagem: o que os alunos vão construir, como, com quais materiais, registro do processo. Elementos maker centrais.",
    "teste": "Descrição detalhada e operacional da fase Teste: como testar o protótipo, quais métricas usar, como coletar dados, como iterar. Cultura maker de falhar e melhorar.",
    "compartilhamento": "Descrição detalhada e operacional da fase Compartilhamento: formato de apresentação, audiência, preparação, como celebrar e documentar o aprendizado."
  },
  "bibliography": [
    "AUTOR, A. B. Título do livro: subtítulo. Cidade: Editora, ano.",
    "AUTOR, C. D. Título do artigo. Nome da Revista, cidade, v. X, n. Y, p. ZZ-ZZ, ano."
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

  // Valida campos obrigatórios
  const required = ['title', 'theme', 'duration', 'problem', 'guidingQuestion', 'steamMatrix', 'objectives', 'bncc', 'materials', 'phaseDetails']
  for (const field of required) {
    if (!parsed[field]) throw new Error(`Campo obrigatório ausente: ${field}`)
  }

  return parsed
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
