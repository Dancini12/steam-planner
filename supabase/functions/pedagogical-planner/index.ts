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
  'ETAPA 1 - Preparar a base e dividir materiais',
  'ETAPA 2 - Construir as partes principais',
  'ETAPA 3 - Criar o mecanismo de interação',
  'ETAPA 4 - Testar com situação real',
  'ETAPA 5 - Ajustar e testar novamente',
  'ETAPA 6 - Apresentar produto e evidências',
]

const DEFAULT_STAGE_DESCRIPTIONS = [
  'O professor entrega a missão e os materiais. A equipe usa a base mais rígida, divide áreas de problema, solução, teste e melhoria, e separa peças móveis.',
  'Os alunos montam as partes principais do protótipo. Cada peça deve ter função visível: entrada de dados, decisão, fluxo, medida, comparação ou registro.',
  'A equipe cria a interação com cartões, fichas, abas, setas, encaixes, escala, planilha ou simulação simples. O protótipo precisa ser manipulado durante o teste.',
  'Aplique o Cenário 1 e registre o resultado. Depois aplique o Cenário 2 ou 3 para comparar, observar falhas e medir se a solução funciona.',
  'A equipe identifica uma falha, muda material, regra, posição, medida ou comunicação visual e repete o teste. Registre o antes e o depois.',
  'Cada equipe apresenta o protótipo, o cenário testado, a falha encontrada, a melhoria feita e a evidência de que o ajuste funcionou.',
]

const ASSEMBLY_STEP_TITLES = STAGE_TITLES

const DEFAULT_ASSESSMENT = [
  'Protótipo | Representa o problema e pode ser testado?',
  'Teste | O grupo aplicou o cenário e registrou resultado?',
  'Melhoria | O grupo ajustou o protótipo após identificar falha?',
  'Comunicação | O grupo explicou solução, teste e melhoria?',
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
  return String(value)
    .replace(/\.{3,}|…/g, '.')
    .replace(/[Pp]ós-its?/g, 'notas adesivas')
    .replace(/[Pp]ost-[Ii]ts?/g, 'notas adesivas')
    .replace(/^\s*\|.*\|\s*$/gm, '')
    .replace(/^\s*[-|: ]+\s*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function finishSentence(value: unknown): string {
  const text = cleanText(value)
  if (!text) return ''
  if (/[.!?:;)]$/.test(text)) return text
  return `${text}.`
}

function limitText(value: unknown, maxChars: number): string {
  const text = cleanText(value)
  if (text.length <= maxChars) return text
  const slice = text.slice(0, maxChars + 1)
  const sentenceBreak = Math.max(slice.lastIndexOf('.'), slice.lastIndexOf('?'), slice.lastIndexOf('!'), slice.lastIndexOf(';'))
  const wordBreak = slice.lastIndexOf(' ')
  const cutAt = sentenceBreak > maxChars * 0.55 ? sentenceBreak + 1 : wordBreak
  let fragment = slice.slice(0, cutAt > 0 ? cutAt : maxChars).trimEnd()
  // Remove dangling conjunctions/prepositions to avoid "...e." or "...da."
  fragment = fragment.replace(/\s+(e|ou|de|da|do|dos|das|com|para|que|se|em|na|no|nas|nos|a|o|ao|por|pelo|pela|um|uma|mais|mas|nem|sobre|após|entre)$/i, '').trimEnd()
  return finishSentence(fragment)
}

function toTextArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === 'string') return cleanText(item)
      if (item && typeof item === 'object') {
        const objectItem = item as Record<string, unknown>
        return cleanText(objectItem.text || objectItem.description || objectItem.criterion || objectItem.abnt || '')
      }
      return ''
    }).filter(Boolean)
  }

  return cleanText(value)
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter(Boolean)
}

function getMaterialName(material: string): string {
  return cleanText(material).split(/\s[-–—]\s/)[0].trim()
}

function buildDefaultMaterialFunctions(materials: string[]): string[] {
  const roles = [
    'base ou superfície principal do protótipo',
    'fixação das partes e reforço da estrutura',
    'recorte, dobra ou separação das peças móveis',
    'marcação de medidas, valores, setas, legenda e registro do teste',
    'controle do tempo, comparação ou simulação do funcionamento',
    'peça extra para ajustes, acabamento ou melhoria após o teste',
  ]

  return materials.map((material, index) => {
    const materialName = getMaterialName(material) || `Material ${index + 1}`
    return `${materialName}: use como ${roles[index] || 'parte funcional do protótipo'}.`
  })
}

function isBudgetTheme(theme: string): boolean {
  return /or[cç]amento|financeir|renda|despesa|dinheiro|fam[ií]lia/.test(cleanText(theme).toLowerCase())
}

function buildDefaultReadyMaterials(theme: string): string[] {
  const cleanTheme = cleanText(theme || 'problema investigado').toLowerCase()

  if (isBudgetTheme(theme)) {
    return [
      'CENÁRIO 1 - Saldo positivo: renda R$ 3.500; aluguel R$ 900; alimentação R$ 800; transporte R$ 350; energia/água R$ 280; lazer R$ 200. Pergunta: quanto sobra?',
      'CENÁRIO 2 - Imprevisto: renda R$ 3.000; despesas fixas R$ 2.400; gasto médico R$ 600. Pergunta: ficou positivo ou negativo? O que ajustar?',
      'CENÁRIO 3 - Decisão: renda R$ 4.000; despesas R$ 3.200; celular R$ 1.200. Pergunta: comprar agora, parcelar ou adiar? Justifique.',
      'TABELA DE TESTE - Critério | Receita Total | Despesas Totais | Saldo | Melhoria Aplicada | Resultado Após Melhoria.',
    ]
  }

  return [
    `CENÁRIO 1 - Funcionamento esperado: aplique o protótipo em uma situação comum de ${cleanTheme}. Registre resultado, medida ou decisão obtida.`,
    `CENÁRIO 2 - Imprevisto: retire um recurso, aumente a demanda ou crie uma restrição ligada a ${cleanTheme}. Compare com o primeiro teste.`,
    'CENÁRIO 3 - Decisão de melhoria: escolha uma falha observada, aplique uma mudança e teste novamente para verificar se houve avanço.',
    'TABELA DE TESTE - Critério | Resultado antes | Falha observada | Melhoria feita | Resultado depois.',
  ]
}

function materialNamesForText(materials: string[]): string {
  const names = materials.map(getMaterialName).filter(Boolean).slice(0, 4)
  if (!names.length) return 'os materiais listados'
  if (names.length === 1) return names[0]
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`
}

function buildDefaultAssemblyDescriptions(theme: string, materials: string[]): string[] {
  const cleanTheme = cleanText(theme || 'problema investigado').toLowerCase()
  const materialText = materialNamesForText(materials)

  return [
    `Use cartolina, papelão ou folha como base. Divida em áreas: problema, solução, teste e melhoria; separe ${materialText} antes da montagem.`,
    `Monte as partes principais com ${materialText}. Defina a função de cada peça: entrada de dados, fluxo, decisão, medida, comparação ou registro.`,
    'Crie a interação com cartões, fichas, abas, setas, encaixes, escala, planilha ou simulação simples. O protótipo deve mudar quando o aluno aplica um cenário.',
    `Aplique os cenários prontos sobre ${cleanTheme}. Registre resultado, falha e comparação entre o teste esperado e o teste com imprevisto.`,
    'Ajuste uma falha concreta no material, regra, posição, medida ou comunicação visual. Repita o teste e registre o que melhorou.',
    'Apresente o protótipo final, o cenário usado, a falha encontrada, a melhoria feita e a evidência observada no novo teste.',
  ]
}

function parseRubricItem(item: unknown): Record<string, string> | null {
  if (item && typeof item === 'object') {
    const objectItem = item as Record<string, unknown>
    const criterion = cleanText(objectItem.criterion || objectItem.criteria || objectItem.title || objectItem.name || '')
    const observation = cleanText(objectItem.observation || objectItem.observe || objectItem.description || objectItem.text || '')
    if (criterion || observation) {
      return {
        criterion: criterion || 'Critério',
        observation: finishSentence(observation || 'Observar evidências do processo.'),
      }
    }
  }

  const text = cleanText(item)
  if (!text) return null
  const pipeParts = text.split('|')
  if (pipeParts.length > 1) {
    return { criterion: cleanText(pipeParts[0]), observation: finishSentence(pipeParts.slice(1).join('|')) }
  }
  const colonParts = text.split(':')
  if (colonParts.length > 1) {
    return { criterion: cleanText(colonParts[0]), observation: finishSentence(colonParts.slice(1).join(':')) }
  }
  return {
    criterion: text.split(/\s+/).slice(0, 3).join(' '),
    observation: finishSentence(text),
  }
}

function isGenericAssemblyText(text: unknown): boolean {
  const cleaned = cleanText(text).toLowerCase()
  if (!cleaned) return true
  if (cleaned.split(/\s+/).length < 14) return true

  return [
    'construa um modelo interativo',
    'faça um protótipo',
    'use os materiais disponíveis',
    'teste a solução',
    'melhore o projeto',
    'monte o protótipo',
    'desenvolva a solução',
  ].some((phrase) => cleaned === phrase || cleaned.includes(`${phrase}.`))
}

function normalizeStages(raw: Record<string, unknown>, materials: string[], theme: string): Record<string, unknown>[] {
  const source = Array.isArray(raw.developmentAssemblySteps)
    ? raw.developmentAssemblySteps
    : Array.isArray(raw.assemblySteps)
      ? raw.assemblySteps
      : Array.isArray(raw.developmentStages)
        ? raw.developmentStages
        : Array.isArray(raw.stages)
          ? raw.stages
          : Array.isArray(raw.steps)
            ? raw.steps
            : []
  const defaultDescriptions = buildDefaultAssemblyDescriptions(theme, materials)

  return STAGE_TITLES.map((title, index) => {
    const raw = source[index]
    const stage = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}
    const rawDescription = typeof raw === 'string'
      ? raw
      : cleanText(stage.description || stage.action || stage.text || stage.procedure || '')
    const description = isGenericAssemblyText(rawDescription)
      ? defaultDescriptions[index]
      : rawDescription

    return {
      number: index + 1,
      title,
      description: limitText(description || DEFAULT_STAGE_DESCRIPTIONS[index], 220),
    }
  })
}

function normalizeAssemblySteps(raw: Record<string, unknown>, materials: string[], theme: string): Record<string, unknown>[] {
  const source = Array.isArray(raw.assemblySteps)
    ? raw.assemblySteps
    : Array.isArray((raw.practicalAssembly as Record<string, unknown> | undefined)?.steps)
      ? ((raw.practicalAssembly as Record<string, unknown>).steps as unknown[])
      : Array.isArray(raw.assemblyGuide)
        ? raw.assemblyGuide
        : []
  const defaultDescriptions = buildDefaultAssemblyDescriptions(theme, materials)

  return ASSEMBLY_STEP_TITLES.map((title, index) => {
    const rawStep = source[index]
    const step = rawStep && typeof rawStep === 'object' ? rawStep as Record<string, unknown> : {}
    const rawDescription = typeof rawStep === 'string'
      ? rawStep
      : cleanText(step.description || step.instruction || step.action || step.text || '')
    const description = isGenericAssemblyText(rawDescription)
      ? defaultDescriptions[index]
      : rawDescription

    return {
      number: index + 1,
      title,
      description: limitText(description, 440),
    }
  })
}

function normalizeReadyMaterials(raw: Record<string, unknown>, theme: string): string[] {
  const source = raw.readyMaterials || raw.printableMaterials || raw.scenarios || raw.testScenarios
  const items = toTextArray(source)
  const selected = (items.length ? items : buildDefaultReadyMaterials(theme)).slice(0, 4)
  return selected.map((item) => limitText(item, 520))
}

function normalizeAssessmentRubric(raw: Record<string, unknown>): Record<string, string>[] {
  const source = Array.isArray(raw.assessmentRubric) && raw.assessmentRubric.length
    ? raw.assessmentRubric
    : raw.assessment
  const items = Array.isArray(source)
    ? source.map(parseRubricItem).filter(Boolean) as Record<string, string>[]
    : toTextArray(source).map(parseRubricItem).filter(Boolean) as Record<string, string>[]
  const fallback = DEFAULT_ASSESSMENT.map(parseRubricItem).filter(Boolean) as Record<string, string>[]

  return (items.length ? items : fallback).slice(0, 4).map((item) => ({
    criterion: limitText(item.criterion, 40),
    observation: limitText(item.observation, 180),
  }))
}

function normalizeReferences(value: unknown): string[] {
  const references = toTextArray(value)
    .map(cleanText)
    .filter((item) => item && !/wikipedia/i.test(item))
  return (references.length ? references : [FALLBACK_REFERENCE]).slice(0, 3).map(finishSentence)
}

function extractBRL(text: string): number[] {
  return [...text.matchAll(/R\$\s*([\d.]+,\d{2})/g)]
    .map((m) => parseFloat((m[1] as string).replace(/\./g, '').replace(',', '.')))
}

function formatBRL(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function correctGabaritoArithmetic(gabarito: string[], readyMaterials: string[]): string[] {
  const scenarios = readyMaterials.filter((item) => /^CEN[AÁ]RIO/i.test(String(item)))
  if (!scenarios.length) return gabarito

  const isFinancial = scenarios.some((s) => /receita|renda|sal[aá]rio|despesa|aluguel|saldo/i.test(s))
  if (!isFinancial) return gabarito

  return gabarito.map((gabItem, index) => {
    const scenario = scenarios[index]
    if (!scenario) return gabItem

    const amounts = extractBRL(String(scenario))
    if (amounts.length < 3) return gabItem

    // Use amounts as-is: first value = receita, rest = despesas
    const receitaVal = amounts[0]
    const despesaVals = amounts.slice(1)
    const totalDespesas = despesaVals.reduce((a, b) => a + b, 0)
    const saldoCalculado = receitaVal - totalDespesas

    // Extract the saldo the AI wrote in the gabarito
    const gabAmounts = extractBRL(gabItem)
    const gabSaldo = gabAmounts.length ? gabAmounts[gabAmounts.length - 1] : null

    if (gabSaldo !== null && Math.abs(gabSaldo - saldoCalculado) > 1) {
      // Replace the wrong saldo with the correct one
      return gabItem.replace(
        /R\$\s*[\d.]+,\d{2}(?=\s*\.?\s*$)/,
        formatBRL(saldoCalculado)
      )
    }

    return gabItem
  })
}

function normalizeTeacherOrientation(raw: Record<string, unknown>): string {
  const source = raw.teacherOrientation || raw.teacherNote || raw.professorNote
  if (!source) return ''
  return limitText(source, 280)
}

function normalizeTeacherGabarito(raw: Record<string, unknown>): string[] {
  const source = raw.teacherGabarito || raw.gabarito || raw.answerKey
  if (!source) return []
  // No limitText or slice — gabarito must never be truncated
  return toTextArray(source)
    .map((item) => cleanText(item))
    .filter(Boolean)
}

function normalizeSteamConnection(raw: Record<string, unknown>): Record<string, string> {
  const sc = (raw.steamConnection && typeof raw.steamConnection === 'object' ? raw.steamConnection : {}) as Record<string, unknown>
  const keys = ['science', 'technology', 'engineering', 'art', 'mathematics']
  const result: Record<string, string> = {}
  for (const key of keys) {
    result[key] = limitText(sc[key] || '', 140)
  }
  return result
}

function normalizeActivity(raw: Record<string, unknown>, request: PedagogicalRequest): Record<string, unknown> {
  const theme = cleanText(raw.theme || request.theme)
  const objective = limitText(raw.objective || toTextArray(raw.objectives)[0] || 'Investigar um problema real, construir uma solução, testar resultados e propor melhoria.', 280)
  const problem = limitText(raw.problem || `Como criar uma solução prática para um problema real relacionado a ${theme.toLowerCase()}?`, 520)
  const mission = limitText(raw.mission || `Sua equipe deverá investigar ${theme}, construir uma solução simples, testar e melhorar o resultado.`, 320)
  const makerChallenge = limitText(raw.makerChallenge || raw.guidingQuestion || `Construir uma primeira solução para ${theme.toLowerCase()}, testar, registrar falhas e melhorar pelo menos um elemento.`, 380)
  const finalProduct = limitText(raw.finalProduct || `Protótipo físico, visual ou digital sobre ${theme.toLowerCase()}, com registro do teste e da melhoria feita.`, 300)
  const materials = toTextArray(raw.materials).length ? toTextArray(raw.materials) : DEFAULT_MATERIALS
  const normalizedMaterials = materials.slice(0, 6).map((item) => limitText(item, 120))
  const stages = normalizeStages(raw, normalizedMaterials, theme)
  const assemblySteps = stages
  const sourceMaterialFunctions = toTextArray(raw.materialFunctions)
  const materialFunctions = (sourceMaterialFunctions.length >= normalizedMaterials.length ? sourceMaterialFunctions : buildDefaultMaterialFunctions(normalizedMaterials))
    .slice(0, normalizedMaterials.length || 6)
    .map((item) => limitText(item, 200))
  const readyMaterials = normalizeReadyMaterials(raw, theme)
  const assessmentRubric = normalizeAssessmentRubric(raw)
  const assessment = assessmentRubric.map((item) => `${item.criterion} | ${item.observation}`)
  const activityManual = `DESENVOLVIMENTO E MONTAGEM DA ATIVIDADE\n${stages.map((stage) => `${stage.title}\n${stage.description}`).join('\n\n')}`

  return {
    ...raw,
    title: limitText(raw.title || `Desafio Maker: ${theme}`, 80),
    theme,
    duration: `${Number(request.numberOfClasses) || 1} aula${(Number(request.numberOfClasses) || 1) !== 1 ? 's' : ''}`,
    objective,
    objectives: [objective],
    problem,
    mission,
    guidingQuestion: makerChallenge,
    materials: normalizedMaterials,
    materialFunctions,
    readyMaterials,
    stages,
    developmentStages: stages,
    developmentAssemblySteps: stages,
    assemblySteps,
    practicalAssembly: {
      title: 'DESENVOLVIMENTO E MONTAGEM DA ATIVIDADE',
      steps: assemblySteps,
    },
    activityManual,
    makerChallenge,
    finalProduct,
    assessmentRubric,
    assessment,
    bibliography: normalizeReferences(raw.bibliography || raw.references),
    steamConnection: normalizeSteamConnection(raw),
    teacherGabarito: correctGabaritoArithmetic(normalizeTeacherGabarito(raw), Array.isArray(raw.readyMaterials) ? raw.readyMaterials as string[] : []),
    teacherOrientation: normalizeTeacherOrientation(raw),
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
    ...(Array.isArray(activity.materialFunctions) ? activity.materialFunctions : []),
    ...(Array.isArray(activity.readyMaterials) ? activity.readyMaterials : []),
    ...(Array.isArray(activity.assessmentRubric) ? activity.assessmentRubric.map((item) => `${cleanText((item as Record<string, unknown>).criterion || '')} ${cleanText((item as Record<string, unknown>).observation || '')}`) : []),
    ...(Array.isArray(activity.assemblySteps) ? activity.assemblySteps.map((step) => cleanText((step as Record<string, unknown>).description || '')) : []),
  ].join(' ').toLowerCase()

  const missing: string[] = []
  if (!activity.title) missing.push('title')
  if (!activity.objective) missing.push('objective')
  if (!activity.problem) missing.push('problem')
  if (!activity.mission) missing.push('mission')
  if (!Array.isArray(activity.materials) || activity.materials.length === 0) missing.push('materials')
  if (!Array.isArray(activity.materialFunctions) || activity.materialFunctions.length === 0) missing.push('materialFunctions')
  if (!Array.isArray(activity.readyMaterials) || activity.readyMaterials.length === 0) missing.push('readyMaterials')
  if (!Array.isArray(activity.stages) || activity.stages.length !== 6) missing.push('stages')
  if (!Array.isArray(activity.assemblySteps) || activity.assemblySteps.length !== 6) missing.push('assemblySteps')
  if (!/constru|mont|cria|prototip/.test(text)) missing.push('prototype')
  if (!/test/.test(text)) missing.push('test')
  if (!/melhor|ajust|redesign|modific/.test(text)) missing.push('improvement')
  if (!/base/.test(text)) missing.push('base')
  if (!/simula|cen[aá]rio|situa[cç][aã]o real/.test(text)) missing.push('simulation')
  if (/\.{3,}|…/.test(text)) missing.push('ellipsis')
  if (!activity.makerChallenge) missing.push('makerChallenge')
  if (!activity.finalProduct) missing.push('finalProduct')
  if ((!Array.isArray(activity.assessmentRubric) || activity.assessmentRubric.length === 0) && (!Array.isArray(activity.assessment) || activity.assessment.length === 0)) missing.push('assessment')
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
${
  Number(request.numberOfClasses) >= 3
    ? `- COMPLEXIDADE PARA ${request.numberOfClasses} AULAS: projeto mais amplo — inclua pesquisa inicial, planejamento, prototipagem, testes comparativos, redesign e apresentação final.`
    : Number(request.numberOfClasses) >= 2
      ? `- COMPLEXIDADE PARA ${request.numberOfClasses} AULAS: construção mais elaborada, investigação detalhada, teste e melhoria com mais tempo, apresentação dos grupos.`
      : `- COMPLEXIDADE PARA 1 AULA: atividade compacta — construção simples, teste rápido, melhoria objetiva, apresentação curta; evitar etapas longas e pesquisa extensa.`
}

REGRA CENTRAL:
Toda atividade deve nascer de um problema real, desafio investigativo, missão prática, construção/prototipagem, teste e melhoria da solução.

LIMITE:
- Máximo de 2 páginas A4.
- Texto compacto, leitura rápida e aplicação imediata.
- Reduza explicações narrativas, contextualização excessiva, repetição e frases acadêmicas.
- Priorize ação, construção, investigação, teste e melhoria.

ESTRUTURA VISÍVEL OBRIGATÓRIA - somente estas 9 seções:
1. Experiência de Aprendizagem STEAM + Cultura Maker
2. Objetivo geral
3. Problema/desafio
4. Materiais
5. Desenvolvimento e montagem da atividade
6. Desafio Maker
7. Produto final
8. Avaliação
9. Referências

Desenvolvimento e montagem obrigatório:
${stageTitles}

Regras:
- "objective": 1 frase, até 20 palavras.
- "problem": problema real e concreto, até 45 palavras.
- "mission": frase curta começando com "Sua equipe deverá..." quando for grupo.
- "materials": máximo 6 itens acessíveis, com quantidade por grupo.
- "materialFunctions": função prática de cada material listado.
- "readyMaterials": gere os cenários, fichas, cartões, tabela de teste ou perguntas citadas. Nunca cite material complementar sem entregar o conteúdo pronto.
- "stages": exatamente 6 etapas de desenvolvimento e montagem, na ordem acima. Explique como preparar base, dividir materiais, construir, interagir, testar, ajustar e apresentar.
- "makerChallenge": deve indicar o que construir, como testar e o que melhorar.
- "finalProduct": produto ou protótipo concreto.
- "assessmentRubric": mini rubrica com "criterion" e "observation", máximo 4 linhas.
- "bibliography": use referência real. Se não tiver fonte específica, use a BNCC.
- Não use emojis, matriz STEAM, Design Thinking, fundamentação, material do aluno, vocabulário ou anexos.
- Evite frases genéricas como "faça um protótipo", "use os materiais disponíveis", "teste a solução" ou "melhore o projeto" sem explicar exatamente como.
- Crie pelo menos 2 testes concretos dentro da montagem ou do desafio maker.
- Não use reticências. Nenhum campo pode terminar com texto cortado.
- Nunca escreva "Pós-its" ou "Post-its". Use sempre "notas adesivas".
- Inclua "steamConnection" com 1 frase curta por área: Ciência, Tecnologia, Engenharia, Arte, Matemática.
- Inclua "teacherGabarito": resultados esperados de cada cenário, 1 frase curta por item com valores, saldo ou conclusão objetiva.
- Em cenários financeiros, nunca escreva apenas "Economia: R$ X". Use "Sobra mensal prevista: R$ X" ou "Saldo disponível para poupança/investimento: R$ X".
- Nunca use tabelas markdown (| col | col | ou --- | --- | ---) em nenhum campo JSON. Em "readyMaterials", use apenas uma linha de texto simples: "TABELA DE TESTE - Col1 | Col2 | Col3." sem barras verticais extras ou linhas separadoras.
- Em cenários: se o saldo final for positivo, não use "déficit". Use "reorganização", "impacto no saldo" ou "preservação da poupança".
- No "teacherGabarito": se o saldo final for positivo, não usar "déficit", "prejuízo" ou "saldo negativo". Usar: "O saldo ainda é positivo, mas foi reduzido. Sugerir reorganização para preservar poupança."
- GABARITO MATEMÁTICO OBRIGATÓRIO: em "teacherGabarito", para cada cenário com valores numéricos, copie EXATAMENTE os valores do readyMaterials correspondente (sem inventar valores), some as despesas mostrando a conta (ex: R$ 1.200 + R$ 250 = R$ 1.450), calcule saldo = receita − total_despesas. Formato: "Cenário 1: Receita R$ X; despesas R$ A + R$ B = R$ Y; Saldo final = R$ X − R$ Y = R$ Z." O resultado deve ser matematicamente correto.
- Inclua "teacherOrientation": 1 frase prática e pedagógica orientando o professor sobre como conduzir a atividade.

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
  "materialFunctions": [
    "Material 1: função prática no protótipo.",
    "Material 2: função prática no mecanismo, teste ou registro."
  ],
  "readyMaterials": [
    "CENÁRIO 1 - Funcionamento esperado: situação, dados e pergunta para testar.",
    "CENÁRIO 2 - Imprevisto: restrição, falha ou mudança para comparar.",
    "TABELA DE TESTE - Critério | Receita Total | Despesas Totais | Saldo | Melhoria Aplicada | Resultado Após Melhoria."
  ],
  "stages": [
    { "number": 1, "title": "ETAPA 1 - Preparar a base e dividir materiais", "description": "Divida a base em problema, solução, teste e melhoria. Separe peças móveis e registro." },
    { "number": 2, "title": "ETAPA 2 - Construir as partes principais", "description": "Monte as peças centrais e explique a função de cada material no protótipo." },
    { "number": 3, "title": "ETAPA 3 - Criar o mecanismo de interação", "description": "Crie cartões, fichas, abas, setas, encaixes ou simulação manipulável." },
    { "number": 4, "title": "ETAPA 4 - Testar com situação real", "description": "Aplique dois cenários prontos. Meça resultado, compare e registre falhas." },
    { "number": 5, "title": "ETAPA 5 - Ajustar e testar novamente", "description": "Mude uma falha concreta, repita o teste e registre o antes e depois." },
    { "number": 6, "title": "ETAPA 6 - Apresentar produto e evidências", "description": "Apresente protótipo, cenário testado, melhoria feita e evidência observada." }
  ],
  "makerChallenge": "Construir, testar, comparar e melhorar uma solução para o problema.",
  "finalProduct": "Protótipo final com registro do teste e da melhoria feita.",
  "assessmentRubric": [
    { "criterion": "Protótipo", "observation": "Representa o problema e pode ser testado?" },
    { "criterion": "Teste", "observation": "O grupo aplicou o cenário e registrou resultado?" },
    { "criterion": "Melhoria", "observation": "O grupo ajustou o protótipo após identificar falha?" },
    { "criterion": "Comunicação", "observation": "O grupo explicou solução, teste e melhoria?" }
  ],
  "bibliography": [
    "${FALLBACK_REFERENCE}"
  ],
  "steamConnection": {
    "science": "conceito ou fenômeno investigado na atividade.",
    "technology": "recurso, ferramenta ou sistema utilizado.",
    "engineering": "o que será construído, testado e melhorado.",
    "art": "elemento visual, criativo ou comunicativo do protótipo.",
    "mathematics": "cálculos, medidas ou comparação de dados."
  },
  "teacherGabarito": [
    "Cenário 1: resultado esperado com valores ou conclusão objetiva.",
    "Cenário 2: resultado do imprevisto com impacto observado."
  ],
  "teacherOrientation": "Durante a atividade, estimule os alunos a justificarem suas escolhas e registrarem as melhorias no protótipo."
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
