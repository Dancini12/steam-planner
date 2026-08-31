import { supabase, isSupabaseConfigured } from '../supabaseClient.js'
import { AIProviderManager } from './AIProviderManager.js'
import {
  formatBnccSuggestions,
  getBnccCodes,
  normalizeBnccCode,
  normalizeBnccCodes,
  selectBnccHabilidades,
  validateBnccAgainstActivity
} from '../bnccSelector.js'
import { findSourcesForActivity } from '../sources/index.js'
import {
  getContextForActivity,
  saveSourcesAsync,
} from '../knowledge/knowledgeBaseService.js'
import { getQualityPatterns } from '../machine-learning/behavior-tracking/behaviorTracker.js'
import {
  normalizeLearningExperience,
  validateLearningExperience
} from '../learningExperience.js'
import {
  MAKER_MODALITY_IDS,
  MAKER_VERBS,
  NEUTRAL_STAGE_TITLES,
  checkConsistency,
  buildRepairPrompt,
  deterministicCleanup
} from './generationContract.js'

// Divide o texto de materiais do professor em itens individuais.
function parseAvailableMaterialsList(text = '') {
  return String(text)
    .split(/[\n;,]+/)
    .map((s) => s.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter((s) => s.length >= 2)
}

const COMPETENCY_TO_LETTER = {
  science: 'S',
  technology: 'T',
  engineering: 'E',
  arts: 'A',
  mathematics: 'M',
}

function buildPrompt({ discipline, grade, theme, steamCompetencies, availableMaterials, strictMaterials = true, numberOfClasses, modality, customInstructions, bnccSuggestions, verifiedSources = [], knowledgeContext = '', qualityPatterns = null }) {
  const materialsList = parseAvailableMaterialsList(availableMaterials)
  const hasStrictMaterials = strictMaterials && materialsList.length > 0
  const priorityBlock = `HIERARQUIA DE PRIORIDADES (ordem de decisão — a criatividade nunca se sobrepõe às restrições):
1. Restrições explícitas do professor (materiais, instruções, formato).
2. Série/ano e perfil dos alunos.
3. Objetivo de aprendizagem.
4. Habilidades BNCC selecionadas.
5. Conteúdo e metodologia.
6. Problema/desafio, desenvolvimento, produto e avaliação.
7. Elementos criativos adicionais.`
  const strictMaterialsBlock = hasStrictMaterials
    ? `\nRESTRIÇÃO RÍGIDA DE MATERIAIS (prioridade máxima):
Materiais disponíveis (ÚNICOS permitidos): ${materialsList.join('; ')}.
Conceba TODA a atividade — objetivo, problema, desenvolvimento, cada etapa, desafio maker, produto final, avaliação, orientação e gabarito — usando EXCLUSIVAMENTE esses materiais.
É PROIBIDO citar, em QUALQUER seção, qualquer outro objeto, ferramenta, instrumento, equipamento ou insumo (ex.: régua, cola, tesoura, computador, celular, cartolina, palito, moeda, fio, barbante, impressora, material reciclável). Se não está na lista, não existe para esta atividade.
Se algo seria útil mas não está disponível, coloque em "optionalMaterials" e garanta que a atividade principal funciona 100% sem ele.
Cultura Maker aqui NÃO significa construir objeto 3D: o "fazer" acontece com os materiais dados (${MAKER_VERBS}). Com apenas papel e lápis, o aluno desenha, calcula, representa, simula cenários, compara e revisa — isso é maker.`
    : `\nMATERIAIS: use recursos acessíveis e de baixo custo. PROIBIDO usar cartolina, caixas ou papelão como material-padrão e PROIBIDO repetir "painel com fichas e canetinhas". Cultura Maker NÃO exige objeto 3D — pode ser ${MAKER_VERBS}.`
  const steamLetters = steamCompetencies
    .map((c) => COMPETENCY_TO_LETTER[String(c).toLowerCase()])
    .filter(Boolean)

  const uniqueLetters = [...new Set(steamLetters)]

  const nClasses = parseInt(numberOfClasses) || 1
  const classesInfo = `- Duração total: ${nClasses} aula${nClasses !== 1 ? 's' : ''}`
  const complexityGuide = nClasses >= 3
    ? `- COMPLEXIDADE PARA ${nClasses} AULAS: projeto mais amplo — pesquisa inicial, planejamento, prototipagem, testes comparativos, redesign e apresentação final.`
    : nClasses >= 2
      ? `- COMPLEXIDADE PARA ${nClasses} AULAS: construção mais elaborada, investigação detalhada, teste e melhoria com mais tempo, apresentação dos grupos.`
      : `- COMPLEXIDADE PARA 1 AULA: atividade compacta — construção simples, teste rápido, melhoria objetiva, apresentação curta; evitar etapas longas e pesquisa extensa.`
  const modalityInfo = modality === 'individual'
    ? '- Modalidade: INDIVIDUAL - o aluno constrói, testa, registra e melhora sua solução'
    : '- Modalidade: EM GRUPO - organize equipes com papéis simples: construtor, testador, registrador e apresentador'

  const stageTitles = NEUTRAL_STAGE_TITLES
    .map((title) => `- ${title}`)
    .join('\n')
  return `Você é especialista em educação STEAM, Cultura Maker e BNCC para o sistema educacional brasileiro.

MUDANÇA CENTRAL:
Não gere plano tradicional, apostila, fundamentação acadêmica ou texto pedagógico longo.
Gere uma EXPERIÊNCIA DE APRENDIZAGEM STEAM + CULTURA MAKER: problema real, investigação, missão, um "fazer" (construir, calcular, representar, prototipar, simular...), teste, falha, melhoria e apresentação.

${priorityBlock}
${strictMaterialsBlock}

Dados da experiência:
- Disciplina principal: ${discipline}
- Série/Ano: ${grade}
- Tema central: ${theme}
- Materiais disponíveis do professor: ${availableMaterials?.trim() || 'Não informado'}${hasStrictMaterials ? ' (RESTRIÇÃO RÍGIDA — ver bloco acima)' : ''}
- Áreas STEAM envolvidas: ${uniqueLetters.join(', ')}
${classesInfo}
${complexityGuide}
${modalityInfo}
- Habilidades BNCC selecionadas do banco offline:
${formatBnccSuggestions(bnccSuggestions)}
${customInstructions?.trim() ? `\nSolicitações específicas do professor:\n${customInstructions.trim()}` : ''}
${qualityPatterns && qualityPatterns.totalPositive > 0 ? `
Aprendizado de atividades anteriores bem avaliadas por este professor (${qualityPatterns.totalPositive} avaliações positivas):
${qualityPatterns.topDisciplines.length ? `- Disciplinas mais eficazes para este professor: ${qualityPatterns.topDisciplines.join(', ')}` : ''}
${qualityPatterns.topGrades.length ? `- Séries em que as atividades funcionaram melhor: ${qualityPatterns.topGrades.join(', ')}` : ''}
${qualityPatterns.topSteamAreas.length ? `- Áreas STEAM que geraram maior engajamento: ${qualityPatterns.topSteamAreas.join(', ')}` : ''}
${qualityPatterns.topMaterials && qualityPatterns.topMaterials.length ? `- Materiais que já apareceram em atividades bem avaliadas (evite repeti-los; busque alternativas criativas diferentes): ${qualityPatterns.topMaterials.join(', ')}` : ''}
Adapte a complexidade, a linguagem e a abordagem prática para se alinhar a esses padrões que funcionaram bem para este professor. Priorize materiais diferentes dos já usados.` : ''}

REGRA CENTRAL:
Toda experiência precisa nascer de:
1. um problema real;
2. um desafio investigativo;
3. uma missão prática curta;
4. uma construção/prototipagem física, visual, digital, mecânica, eletrônica ou estrutural;
5. um teste prático com observação/comparação;
6. uma melhoria/redesign da solução.

VARIAÇÃO E FLEXIBILIDADE:
- PROIBIDO usar base de papelão, caixas de papelão ou cartolina como material-padrão. Use-os apenas quando forem, de fato, a melhor solução para o produto final específico.
- Escolha o tipo de atividade conforme o tema E os materiais disponíveis: experimento, maquete, jogo, mapa, circuito, modelo 3D, protótipo estrutural, gráfico/representação visual, planilha de cálculo, encenação ou investigação de campo. Informe qual em "makerModality" (um de: ${MAKER_MODALITY_IDS.join(', ')}).
- Os materiais devem ser escolhidos pela adequação ao problema${hasStrictMaterials ? ' DENTRO da lista do professor' : ' e ao que a escola tem de baixo custo'}, nunca por hábito. Uma atividade só com papel e lápis é totalmente válida.

LIMITE OBRIGATÓRIO:
- A atividade final deve caber em no máximo 2 páginas A4.
- Escreva conteúdo compacto, leitura rápida e aplicação imediata.
- Reduza explicações narrativas, contextualizações, repetições e frases acadêmicas.
- Cada etapa deve ter no máximo 3 frases curtas, com foco em ação.
- Não inclua seções extras, material do aluno, vocabulário, fundamentação, matriz STEAM, Design Thinking, anexos ou explicação sobre Cultura Maker.

ESTRUTURA VISÍVEL OBRIGATÓRIA - somente estas 10 seções principais, mais o gabarito em página separada:
1. Experiência de Aprendizagem STEAM + Cultura Maker
2. Objetivo geral
3. Problema/desafio
4. Materiais
5. Desenvolvimento e montagem da atividade
6. Desafio Maker
7. Produto final
8. Conexão STEAM + Maker
9. Avaliação
10. Referências
11. Gabarito do professor em página separada

Desenvolvimento e montagem da atividade - 6 etapas nesta lógica (adapte os títulos à "makerModality" escolhida, mantendo o sentido de cada uma):
${stageTitles}

Regras de conteúdo:
- "objective": 1 frase mensurável = verbo de aprendizagem observável + objeto do conhecimento + método/recurso + finalidade. Deve espelhar o problema, as etapas, o produto e a avaliação. Evite genéricos como "compreender" sozinho.
- "problem": problema real, concreto e contextualizado, até 45 palavras.
- "mission": frase curta começando com "Sua equipe deverá..." ou equivalente individual.
- "materials": ${hasStrictMaterials ? `use SOMENTE os materiais informados pelo professor (${materialsList.join('; ')}), com a quantidade. Não acrescente NADA. Materiais úteis mas ausentes vão em "optionalMaterials".` : 'máximo 6 itens acessíveis e de baixo custo, com quantidade por grupo. PROIBIDO cartolina/caixa/papelão como padrão.'}
- "materialFunctions": função prática de cada material listado, 1 frase curta por material.
- "dataPlan": objeto { "collected": [dados que o aluno vai coletar/registrar], "calculated": [dados que ele vai calcular], "compared": [o que ele vai comparar] }. Base para a tabela.
- "testTable": objeto { "columns": [colunas derivadas de "dataPlan" — específicas DESTA atividade], "rows": [linhas de exemplo ou vazias para preencher] }. NUNCA reutilize colunas de outra atividade (ex.: "Receita Total / Despesas Fixas" só se o tema for orçamento). As colunas devem sair dos dados coletados/calculados/comparados.
- "readyMaterials": entregue os cenários citados, com problema concreto, restrição/falha inicial e solução a desenvolver. Nunca cite material complementar sem entregar o conteúdo pronto. Não coloque a tabela aqui — ela vai em "testTable".
- "stages": exatamente 6 etapas, com os títulos obrigatórios acima. Cada etapa explica uma ação concreta coerente com a "makerModality".
- "makerChallenge": o que fazer (construir/calcular/representar/simular), como testar e o que melhorar.
- "finalProduct": produto concreto final, realizável com os materiais disponíveis.
- "assessmentRubric": mini rubrica com "criterion" e "observation", máximo 4 linhas. Sem ponto final no critério.
- "bibliography": fontes verificadas abaixo quando houver relação direta com o tema. Nunca Wikipedia; nunca referência fora do assunto. Sem fonte específica → só a BNCC.
- "bncc": use APENAS códigos da lista offline acima; não invente. Inclua "bnccJustification": objeto { "CÓDIGO": "etapa N / ação concreta que desenvolve esta habilidade" } para CADA código. Descarte a habilidade se não houver etapa que a desenvolva. Prefira 2 a 3 habilidades altamente coerentes a 5 parcialmente relacionadas.
- "glossary": 3 a 5 termos canônicos da atividade. Escolha UM termo por conceito e use-o do início ao fim (não alterne sinônimos, ex.: não misturar "valor do ativo" e "valor do investimento").
- Não use emojis, slogans nem linguagem de apostila.
- Não escreva frases genéricas ("faça um protótipo", "use os materiais disponíveis", "teste a solução", "melhore o projeto", "analisar o cenário", "aplicar o protótipo") sem explicar exatamente como.
- Crie pelo menos 2 testes concretos: Teste 1 com cenário esperado; Teste 2 com imprevisto/restrição/falha.
- Não use reticências. Nada pode terminar cortado com "...". Nunca escreva "Pós-its"/"Post-its" (use "notas adesivas").
- "steamConnection": objeto com as 5 áreas; para cada uma { "text": frase com AÇÃO concreta da atividade, "weight": "predominante" | "complementar" | "nao_se_aplica" }. Só descreva a área se houver ação real que a sustente; se não houver, weight = "nao_se_aplica" e text vazio. NÃO invente uso de recurso só para justificar uma letra.
- "figure": um objeto { "type": "...", "caption": "..." } SOMENTE se uma figura específica ajudar a entender ESTA atividade; caso contrário "figure": null. Prefira nenhuma figura a uma figura genérica.
- DECISÃO SOB INCERTEZA: se um cenário revela um evento futuro (ex.: "no mês seguinte cai 20%"), a melhoria NÃO pode supor que o aluno sabia disso antes. Formule como estratégia sob incerteza (diversificação, reserva, horizonte, gestão de risco, análise de cenários). Ex.: "Considerando que não era possível prever a queda, que estratégia reduziria o risco?".
- ENTRADA vs RESULTADO: distinga sempre aporte/contribuição (valor adicionado) de resultado (ganho/perda do processo), de saldo/total acumulado e de rentabilidade. Um aporte novo não é rentabilidade.
- "teacherGabarito": array de objetos { "title": "Cenário N" ou a questão, "type": "calculo" | "aberta" | "maker" | "reflexiva", "text": resposta }. Para "calculo": mostre a conta passo a passo com os valores do cenário e o RESULTADO NUMÉRICO final, depois 1 frase de interpretação. Para "aberta": respostas possíveis + critérios. Para "maker": critérios de funcionamento + evidências esperadas. Para "reflexiva": elementos essenciais que a resposta deve conter. Um item por cenário/questão. NUNCA "analisar o cenário / aplicar o protótipo / registrar evidências".
- CÁLCULOS: quando a atividade tiver contas com valores, o "teacherGabarito" do tipo "calculo" deve mostrar a conta passo a passo, com os valores exatos do cenário, e o resultado numérico correto. Se um cenário depende do anterior, mostre o encadeamento.
- Se a atividade for de dinheiro/orçamento: separe Receitas, Despesas fixas, Despesas variáveis, Imprevistos e Melhorias; salário/renda nunca é despesa; um valor "economizado/sugerido" não entra na soma das despesas; só use "déficit/prejuízo/saldo negativo" quando o cálculo realmente der negativo; não pergunte como agir "sem impacto no saldo" quando o gasto reduz o saldo.
- Não use tabelas markdown dentro de strings JSON. A tabela vai estruturada em "testTable".
- Inclua "teacherOrientation": 1 frase prática orientando o professor sobre como conduzir a atividade.

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
  "makerModality": "um de: ${MAKER_MODALITY_IDS.join(' | ')}",
  "bncc": ${JSON.stringify(getBnccCodes(bnccSuggestions))},
  "bnccJustification": { "CÓDIGO": "etapa N / ação concreta que desenvolve esta habilidade" },
  "glossary": ["termo canônico 1", "termo canônico 2", "termo canônico 3"],
  "materials": ${hasStrictMaterials
    ? JSON.stringify(materialsList.map((m) => `${m} - quantidade`))
    : `[
    "Material adequado ao desafio - quantidade por grupo",
    "Elemento de registro/medida - quantidade por grupo"
  ]`},
  "optionalMaterials": ["material extra que ajudaria, mas a atividade funciona sem ele"],
  "materialFunctions": [
    "Material 1: quantidade — função concreta nesta atividade.",
    "Material 2: quantidade — função concreta nesta atividade."
  ],
  "dataPlan": {
    "collected": ["dado que o aluno registra"],
    "calculated": ["dado que o aluno calcula"],
    "compared": ["o que o aluno compara"]
  },
  "testTable": {
    "columns": ["coluna derivada de dataPlan", "outra coluna específica desta atividade"],
    "rows": [["exemplo", "exemplo"]]
  },
  "readyMaterials": [
    "CENÁRIO 1 - Situação esperada: dados concretos e o que calcular/decidir.",
    "CENÁRIO 2 - Imprevisto: nova condição/restrição que exige ajuste da estratégia."
  ],
  "stages": [
${NEUTRAL_STAGE_TITLES.map((t, i) => `    { "number": ${i + 1}, "title": "${t}", "description": "Ação concreta da etapa ${i + 1}, coerente com a makerModality e os materiais disponíveis." }`).join(',\n')}
  ],
  "makerChallenge": "O que fazer (construir/calcular/representar/simular), como testar e o que melhorar.",
  "finalProduct": "Produto concreto final, realizável só com os materiais disponíveis.",
  "assessmentRubric": [
    { "criterion": "Solução", "observation": "Responde ao problema e pode ser testada?" },
    { "criterion": "Teste", "observation": "Aplicou os cenários e registrou os resultados?" },
    { "criterion": "Melhoria", "observation": "Ajustou a solução após analisar os resultados?" },
    { "criterion": "Comunicação", "observation": "Explicou processo, resultados e melhoria?" }
  ],
  "bibliography": ${JSON.stringify(verifiedSources.length ? verifiedSources.slice(0, 2).map((source) => source.abnt) : ['BRASIL. Ministério da Educação. Base Nacional Comum Curricular. Brasília: MEC, 2018.'])},
  "steamConnection": {
    "science": { "text": "ação científica concreta desta atividade, ou vazio", "weight": "predominante | complementar | nao_se_aplica" },
    "technology": { "text": "", "weight": "nao_se_aplica" },
    "engineering": { "text": "", "weight": "complementar" },
    "art": { "text": "", "weight": "complementar" },
    "mathematics": { "text": "", "weight": "predominante" }
  },
  "figure": null,
  "teacherGabarito": [
    { "title": "Cenário 1", "type": "calculo", "text": "Conta passo a passo com os valores do cenário e o resultado numérico final. Depois, 1 frase de interpretação." },
    { "title": "Cenário 2", "type": "reflexiva", "text": "Elementos essenciais que a resposta do aluno deve conter, considerando incerteza (não previsão do futuro)." }
  ],
  "teacherOrientation": "Frase prática orientando o professor a conduzir a atividade (foco em justificar decisões com os dados)."
}`
}

function cleanJsonResponse(text) {
  if (typeof text !== 'string') {
    throw new Error('Texto da resposta inesperado. Não foi possível extrair JSON.')
  }

  let cleaned = text.trim()
  cleaned = cleaned.replace(/```(?:json)?/gi, '').trim()

  const start = cleaned.indexOf('{')
  if (start === -1) {
    throw new Error(`Nenhum objeto JSON encontrado na resposta da IA. Texto recebido: ${cleaned.slice(0, 200)}`)
  }

  let braceCount = 0
  let inString = false
  let escaped = false
  let endIndex = -1

  for (let i = start; i < cleaned.length; i++) {
    const char = cleaned[i]

    if (escaped) {
      escaped = false
      continue
    }

    if (char === '\\') {
      escaped = true
      continue
    }

    if (char === '"') {
      inString = !inString
      continue
    }

    if (inString) {
      continue
    }

    if (char === '{') {
      braceCount += 1
    }

    if (char === '}') {
      braceCount -= 1
      if (braceCount === 0) {
        endIndex = i
        break
      }
    }
  }

  if (endIndex !== -1) {
    return cleaned.slice(start, endIndex + 1).trim()
  }

  const partial = cleaned.slice(start)
  const repairBraceCount = braceCount
  if (repairBraceCount > 0) {
    const repaired = `${partial}${'}'.repeat(repairBraceCount)}`
    try {
      JSON.parse(repaired)
      return repaired.trim()
    } catch (repairError) {
      // continue to throw below
    }
  }

  throw new Error(`JSON incompleto na resposta da IA. Texto recebido: ${partial.slice(0, 200)}`)
}

function extractJson(text) {
  return cleanJsonResponse(text)
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
  try { return JSON.parse(repairJson(raw)) } catch { /* try clean response */ }
  try { return JSON.parse(cleanJsonResponse(raw)) } catch (e) {
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

  const intersected = selectedItems.length > 0 ? selectedItems : offlineCodes.slice(0, 3)
  // Descarta habilidades sem relação real com o que o aluno faz
  const validated = validateBnccAgainstActivity(intersected, data)

  return {
    ...data,
    bncc: validated.length ? validated : intersected
  }
}

function buildClassroomPrompt(project) {
  const stageTitles = NEUTRAL_STAGE_TITLES
    .map((title) => `- ${title}`)
    .join('\n')
  const objectives = (project.objectives || []).map((o, i) => `${i + 1}. ${o}`).join('\n')
  const bncc = (project.bncc || []).join(', ')
  const materialsList = (project.materials || []).map((m) => String(m)).filter(Boolean)
  const materials = materialsList.map((m) => `- ${m}`).join('\n')
  const phaseLines = Object.entries(project.phases || {})
    .map(([id, p]) => p.plan ? `  Fase ${id}: ${p.plan}` : null)
    .filter(Boolean)
    .join('\n')

  return `Você é especialista em educação STEAM e Cultura Maker para o sistema educacional brasileiro.

Transforme o projeto abaixo em uma EXPERIÊNCIA DE APRENDIZAGEM STEAM + CULTURA MAKER compacta.
Não gere plano tradicional, apostila, fundamentação longa, matriz STEAM, material do aluno ou anexos.

HIERARQUIA: as informações do projeto (materiais, problema, produto) têm prioridade sobre a criatividade do modelo.

DADOS DO PROJETO:
- Título: ${project.title || ''}
- Tema: ${project.theme || ''}
- Série/Ano: ${project.grade || ''}
- Duração total: ${project.duration || ''}
- Problema central: ${project.problem || ''}
- Pergunta norteadora: ${project.guidingQuestion || ''}
- Produto final esperado: ${project.finalProduct || ''}
- Habilidades BNCC: ${bncc}
- Materiais disponíveis (${materialsList.length ? 'ÚNICOS permitidos — não acrescente nenhum outro objeto, ferramenta ou recurso em nenhuma seção, etapa, desafio, produto, avaliação ou gabarito' : 'não informados — use recursos de baixo custo, sem cartolina/caixa/papelão como padrão'}):
${materials || '  (livre, baixo custo)'}
- Objetivos de aprendizagem:
${objectives}
- Planejamento das fases (preenchido pelo professor):
${phaseLines || '  (sem planos específicos registrados)'}

TAREFA:
Gere somente as 10 seções principais obrigatórias e o gabarito do professor em página separada:
1. Experiência de Aprendizagem STEAM + Cultura Maker
2. Objetivo geral
3. Problema/desafio
4. Materiais
5. Desenvolvimento e montagem da atividade
6. Desafio Maker
7. Produto final
8. Conexão STEAM + Maker
9. Avaliação
10. Referências
11. Gabarito do professor em página separada

Regras:
- Deve caber em no máximo 2 páginas A4.
- Toda etapa deve ter ação prática, não explicação longa.
- A experiência deve incluir problema real, missão, investigação, construção/prototipagem, teste, comparação e melhoria.
- PROIBIDO usar base de papelão, caixas de papelão ou cartolina como material-padrão. Use-os apenas se forem realmente a melhor escolha para o produto final específico.
- Cultura Maker NÃO exige objeto 3D — pode ser ${MAKER_VERBS}. Informe "makerModality" (um de: ${MAKER_MODALITY_IDS.join(', ')}).
- 6 etapas nesta lógica (adapte os títulos à makerModality):
${stageTitles}
- Cada etapa: máximo 3 frases curtas, ação concreta.
- Materiais: ${materialsList.length ? 'use SOMENTE os materiais do projeto listados acima; não acrescente nada. Extras vão em "optionalMaterials".' : 'máximo 6 itens acessíveis de baixo custo.'}
- "materialFunctions": função concreta de cada material nesta atividade.
- "dataPlan": { "collected": [...], "calculated": [...], "compared": [...] }. "testTable": { "columns": [derivadas de dataPlan], "rows": [...] }. Nunca reutilize colunas de outra atividade.
- "readyMaterials": cenários citados (esperado + imprevisto). A tabela vai em "testTable", não aqui.
- "bncc": inclua "bnccJustification": { "CÓDIGO": "etapa/ação que desenvolve" } para cada código; descarte os sem etapa.
- "glossary": 3 a 5 termos canônicos; use um termo por conceito, sem alternar sinônimos.
- Avaliação: mini rubrica "criterion"/"observation", máx. 4 linhas, sem ponto final no critério.
- Referências: 1 a 2, reais, relacionadas ao tema; não invente fonte nem DOI.
- "steamConnection": objeto com as 5 áreas, cada uma { "text": ação concreta ou vazio, "weight": "predominante" | "complementar" | "nao_se_aplica" }. Não invente uso de recurso só para justificar uma letra.
- "figure": { "type", "caption" } só se específica e útil; senão null.
- DECISÃO SOB INCERTEZA: se um cenário revela evento futuro, a melhoria não pode supor que o aluno sabia. Trabalhe risco/reserva/diversificação/horizonte.
- ENTRADA vs RESULTADO: distinga aporte/contribuição de resultado, de saldo acumulado e de rentabilidade.
- "teacherGabarito": array de { "title", "type": "calculo" | "aberta" | "maker" | "reflexiva", "text" }. "calculo" mostra a conta passo a passo e o resultado numérico. Nunca "analisar o cenário / aplicar o protótipo".
- Se a atividade for de dinheiro: separe Receitas/Despesas fixas/variáveis/Imprevistos/Melhorias; salário nunca é despesa; "déficit/prejuízo" só se o cálculo der negativo.
- Sem emojis. Sem reticências. Nada cortado com "...".

Responda APENAS com JSON válido, sem texto antes ou depois:

{
  "title": "Título curto da experiência",
  "theme": "${project.theme || project.title || ''}",
  "duration": "${project.duration || '1 aula'}",
  "objective": "Objetivo geral curto.",
  "problem": "Problema real que inicia a atividade.",
  "mission": "Sua equipe deverá construir e melhorar uma solução.",
  "makerModality": "um de: ${MAKER_MODALITY_IDS.join(' | ')}",
  "materials": ${materialsList.length ? JSON.stringify(materialsList) : `["Material adequado - quantidade por grupo", "Elemento de registro/medida - quantidade por grupo"]`},
  "optionalMaterials": [],
  "materialFunctions": [
    "Material 1: quantidade — função concreta nesta atividade.",
    "Material 2: quantidade — função concreta nesta atividade."
  ],
  "dataPlan": { "collected": ["..."], "calculated": ["..."], "compared": ["..."] },
  "testTable": { "columns": ["coluna de dataPlan", "outra coluna específica"], "rows": [["exemplo", "exemplo"]] },
  "readyMaterials": [
    "CENÁRIO 1 - Situação esperada: dados concretos e o que calcular/decidir.",
    "CENÁRIO 2 - Imprevisto: nova condição/restrição que exige ajuste da estratégia."
  ],
  "stages": [
${NEUTRAL_STAGE_TITLES.map((t, i) => `    { "number": ${i + 1}, "title": "${t}", "description": "Ação concreta da etapa ${i + 1}, coerente com a makerModality e os materiais." }`).join(',\n')}
  ],
  "makerChallenge": "O que fazer, como testar e o que melhorar.",
  "finalProduct": "Produto concreto final, realizável só com os materiais disponíveis.",
  "assessmentRubric": [
    { "criterion": "Solução", "observation": "Responde ao problema e pode ser testada?" },
    { "criterion": "Teste", "observation": "Aplicou os cenários e registrou os resultados?" },
    { "criterion": "Melhoria", "observation": "Ajustou a solução após analisar os resultados?" },
    { "criterion": "Comunicação", "observation": "Explicou processo, resultados e melhoria?" }
  ],
  "steamConnection": {
    "science": { "text": "", "weight": "complementar" },
    "technology": { "text": "", "weight": "nao_se_aplica" },
    "engineering": { "text": "", "weight": "complementar" },
    "art": { "text": "", "weight": "complementar" },
    "mathematics": { "text": "", "weight": "predominante" }
  },
  "figure": null,
  "glossary": ["termo 1", "termo 2", "termo 3"],
  "bnccJustification": { "CÓDIGO": "etapa/ação que desenvolve" },
  "teacherGabarito": [
    { "title": "Cenário 1", "type": "calculo", "text": "Conta passo a passo e resultado numérico + 1 frase de interpretação." },
    { "title": "Cenário 2", "type": "reflexiva", "text": "Elementos essenciais que a resposta deve conter (sob incerteza)." }
  ],
  "bibliography": ${JSON.stringify(project.bibliography?.length ? project.bibliography.slice(0, 2) : ['BRASIL. Ministério da Educação. Base Nacional Comum Curricular. Brasília: MEC, 2018.'])},
  "bncc": ${JSON.stringify(project.bncc || [])}
}`
}

export const DAILY_LIMIT = 5
export const UNLIMITED_EMAIL = 'marceldancini@gmail.com'

function dailyLocalKey(userId) {
  const today = new Date().toISOString().split('T')[0]
  return `steam-daily-gen-${userId}-${today}`
}

export class PedagogicalPlannerService {
  static async getDailyUsageCount(userId) {
    const today = new Date().toISOString().split('T')[0]
    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase
          .from('pedagogical_usage')
          .select('count')
          .eq('user_id', userId)
          .eq('date', today)
        if (data) return data.reduce((sum, row) => sum + (Number(row.count) || 0), 0)
      } catch {
        // fall through to localStorage
      }
    }
    return parseInt(localStorage.getItem(dailyLocalKey(userId)) || '0', 10)
  }

  static async checkDailyLimit(userId, userEmail) {
    if (userEmail === UNLIMITED_EMAIL) return
    if (!userId) return
    const count = await this.getDailyUsageCount(userId)
    if (count >= DAILY_LIMIT) {
      throw new Error(`Limite diário de ${DAILY_LIMIT} atividades atingido. Tente novamente amanhã.`)
    }
  }

  static async generatePedagogicalActivity(params) {
    const { discipline, grade, theme, steamCompetencies, numberOfClasses, modality, customInstructions, personalization, userId, userEmail } = params
    const availableMaterials = params.availableMaterials || ''
    const materialsList = parseAvailableMaterialsList(availableMaterials)
    const strictMaterials = params.strictMaterials !== false && materialsList.length > 0
    const constraints = { availableMaterials, strictMaterials, availableMaterialsList: materialsList }

    await this.checkDailyLimit(userId, userEmail)

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
      discipline, grade, theme, steamCompetencies, availableMaterials, strictMaterials, numberOfClasses, modality,
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

    const normalizeCtx = { theme, grade, discipline, constraints }
    const parseNormalize = (text) => {
      const parsed = applyOfflineBncc(safeParseJson(extractJson(text)), bnccSuggestions)
      return normalizeLearningExperience(parsed, normalizeCtx)
    }

    let normalized = parseNormalize(rawText)

    // ── 3b. Auditoria de coerência + 1 rodada de reparo se necessário ──
    let audit = checkConsistency(normalized, constraints)
    if (!audit.pass || audit.violations.length) {
      try {
        const repairResponse = await AIProviderManager.request({
          requestType: 'pedagogicalactivity',
          prompt: buildRepairPrompt(normalized, audit.violations, constraints)
        })
        if (repairResponse?.content && typeof repairResponse.content === 'string') {
          const repaired = parseNormalize(repairResponse.content)
          const repairedAudit = checkConsistency(repaired, constraints)
          // Só adota o reparo se não piorou o número de violações duras
          const hardBefore = audit.violations.filter((v) => v.severity === 'hard').length
          const hardAfter = repairedAudit.violations.filter((v) => v.severity === 'hard').length
          if (hardAfter <= hardBefore) {
            normalized = repaired
            audit = repairedAudit
          }
        }
      } catch (repairError) {
        console.warn('Reparo do plano falhou, seguindo com limpeza determinística:', repairError)
      }
      if (!audit.pass) {
        normalized = deterministicCleanup(normalized, audit.violations)
      }
    }

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
        duration: `${parseInt(numberOfClasses) || 1} aula${(parseInt(numberOfClasses) || 1) !== 1 ? 's' : ''}`,
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

  static async generateClassroomActivity(project, userEmail) {
    await this.checkDailyLimit(project.ownerId || project.owner_id || project.userId, userEmail)

    const projectMaterials = (project.materials || []).map((m) => String(m)).filter(Boolean)
    const constraints = {
      availableMaterials: projectMaterials.join('; '),
      strictMaterials: projectMaterials.length > 0,
      availableMaterialsList: projectMaterials
    }
    const normalizeCtx = {
      theme: project.theme || project.title,
      grade: project.grade,
      discipline: project.discipline,
      constraints
    }
    const parseNormalize = (text) => {
      const parsed = safeParseJson(extractJson(text))
      return normalizeLearningExperience(
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
        normalizeCtx
      )
    }

    const prompt = buildClassroomPrompt(project)

    const response = await AIProviderManager.request({
      requestType: 'classroomactivity',
      prompt
    })

    const rawText = response.content
    if (!rawText || typeof rawText !== 'string') {
      throw new Error('A IA não retornou conteúdo válido.')
    }

    let normalized = parseNormalize(rawText)

    let audit = checkConsistency(normalized, constraints)
    if (!audit.pass) {
      try {
        const repairResponse = await AIProviderManager.request({
          requestType: 'classroomactivity',
          prompt: buildRepairPrompt(normalized, audit.violations, constraints)
        })
        if (repairResponse?.content && typeof repairResponse.content === 'string') {
          const repaired = parseNormalize(repairResponse.content)
          const repairedAudit = checkConsistency(repaired, constraints)
          if (repairedAudit.violations.filter((v) => v.severity === 'hard').length <=
              audit.violations.filter((v) => v.severity === 'hard').length) {
            normalized = repaired
            audit = repairedAudit
          }
        }
      } catch (repairError) {
        console.warn('Reparo da atividade falhou:', repairError)
      }
      if (!audit.pass) normalized = deterministicCleanup(normalized, audit.violations)
    }

    validateActivity(normalized)

    const userId = project.ownerId || project.owner_id || project.userId
    if (userId) {
      this.incrementUsage(userId, project.discipline, project.steam || []).catch(() => {})
    }

    return normalized
  }

  // Incrementa contador só após o projeto ser salvo com sucesso
  static async incrementUsage(userId, discipline, steamCompetencies) {
    // Sempre incrementa localStorage para funcionar como fallback
    try {
      const key = dailyLocalKey(userId)
      const local = parseInt(localStorage.getItem(key) || '0', 10)
      localStorage.setItem(key, String(local + 1))
    } catch { /* ignora */ }

    if (!isSupabaseConfigured || !supabase) return

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
