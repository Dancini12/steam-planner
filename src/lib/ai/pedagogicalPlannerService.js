import { supabase, isSupabaseConfigured } from '../supabaseClient.js'
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

function buildPrompt({ discipline, grade, theme, steamCompetencies, availableMaterials, numberOfClasses, modality, customInstructions, bnccSuggestions, verifiedSources = [], knowledgeContext = '', qualityPatterns = null }) {
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
- Materiais disponíveis do professor: ${availableMaterials?.trim() || 'Não informado'}
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
- PROIBIDO repetir painel com fichas e canetinhas como solução padrão. Cada atividade deve ter materiais e mecânica de teste completamente diferentes.
- A criatividade é obrigatória: às vezes a atividade ideal usa apenas lápis e papel; outras vezes usa fios, sensores, sementes, água, régua, dados, elástico, palitos, materiais recicláveis variados ou instrumentos simples do cotidiano.
- Escolha o tipo de atividade conforme o tema: experimento, maquete, jogo, mapa, circuito ou sensor simulado, modelo 3D, protótipo estrutural, instalação, planilha física/digital ou investigação de campo.
- Os materiais devem ser escolhidos pela adequação ao problema, não por conveniência ou hábito. Nunca use estrutura física só por ser "segura" — use-a quando for a melhor solução pedagógica.

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

Desenvolvimento e montagem da atividade - títulos obrigatórios:
${stageTitles}

Regras de conteúdo:
- "objective": 1 frase, até 20 palavras.
- "problem": problema real, concreto e contextualizado, até 45 palavras.
- "mission": frase curta começando com "Sua equipe deverá..." ou equivalente individual.
- "materials": máximo 6 itens acessíveis, com quantidade precisa por grupo sempre que possível. PROIBIDO base de papelão, caixas ou cartolina como padrão. Varie completamente os materiais a cada geração: escolha de acordo com o problema, o produto final, a disciplina, a série e o tempo disponível. Exemplos de tipos possíveis (não lista fixa): lápis+papel, dados, elásticos, fios, sementes, água, régua, calculadora, fichas de papel simples, palitos, tampas, barbante, materiais recicláveis, instrumentos de medição simples.
- "materialFunctions": explique a função prática de cada material listado, em 1 frase curta por material.
- "readyMaterials": entregue os cenários, fichas, cartões, tabela de teste, perguntas ou dados citados. Nunca cite material complementar sem gerar o conteúdo pronto. Para atividades com cálculo financeiro, orçamento familiar, renda, despesas, poupança ou investimento, use exatamente: "TABELA DE TESTE - Cenário | Receita Total | Despesas Fixas | Despesas Variáveis | Saldo Inicial | Melhoria Aplicada | Saldo Final Após Melhoria."
- "stages": exatamente 6 etapas de desenvolvimento e montagem, na ordem obrigatória acima. Cada etapa deve explicar como preparar base, dividir materiais, construir, interagir, testar, ajustar ou apresentar.
- "makerChallenge": deve dizer claramente o que construir, como testar e o que melhorar.
- "finalProduct": protótipo ou produto concreto final.
- "assessmentRubric": mini rubrica com "criterion" e "observation", máximo 4 linhas. Não use ponto final no nome do critério.
- "bibliography": use fontes verificadas abaixo quando houver relação direta com o tema. Nunca use Wikipedia. Nunca use referência fora do assunto apenas para preencher espaço. Se não houver fonte específica adequada, inclua apenas a BNCC como referência oficial.
- "bncc": use APENAS códigos da lista offline acima; não invente códigos.
- Não use emojis, slogans, texto promocional ou linguagem de apostila.
- Não escreva frases genéricas como "faça um protótipo", "use os materiais disponíveis", "teste a solução" ou "melhore o projeto" sem explicar exatamente como.
- Crie pelo menos 2 testes concretos dentro da montagem ou do desafio maker. Ex.: Teste 1 com cenário esperado; Teste 2 com imprevisto, restrição ou falha.
- Não use reticências. Nenhuma frase pode terminar cortada com "...".
- Nunca escreva "Pós-its" ou "Post-its". Use sempre "notas adesivas".
- Inclua "steamConnection" com 1 frase curta por área: Ciência, Tecnologia, Engenharia, Arte, Matemática.
- Inclua "teacherGabarito": resultados esperados de TODOS os cenários de "readyMaterials" em formato didático. Se houver Cenário 1, Cenário 2 e Cenário 3, o gabarito deve conter os três. Use um item por cenário, com linhas curtas separadas por ponto e vírgula.
- Em cenários financeiros, nunca escreva apenas "Economia: R$ X". Use "Sobra mensal prevista: R$ X" ou "Saldo disponível para poupança/investimento: R$ X".
- Nunca use tabelas markdown (| col | col | ou --- | --- | ---) em nenhum campo JSON. Em "readyMaterials", use apenas uma linha de texto simples: "TABELA DE TESTE - Col1 | Col2 | Col3." sem barras verticais extras ou linhas separadoras.
- Em cenários: se o saldo final for positivo, não use "déficit". Use "reorganização", "impacto no saldo" ou "preservação da poupança".
- No "teacherGabarito": se o saldo final for positivo, não usar "déficit", "prejuízo" ou "saldo negativo". Usar: "O saldo ainda é positivo, mas foi reduzido. Sugerir reorganização para preservar poupança."
- GABARITO MATEMÁTICO OBRIGATÓRIO: em "teacherGabarito", para cada cenário com valores numéricos, copie EXATAMENTE os valores do readyMaterials correspondente (sem inventar valores), some as despesas mostrando a conta (ex: R$ 1.200 + R$ 250 = R$ 1.450), calcule saldo = receita − total_despesas. Formato: "Cenário 1: Receita total: R$ X; Despesas totais: R$ A + R$ B = R$ Y; Saldo final: R$ X − R$ Y = R$ Z." Se um cenário depende do anterior, mostre as despesas do cenário anterior e o novo total. O resultado deve ser matematicamente correto.
- COERÊNCIA ENTRE CENÁRIO E PERGUNTA: se um gasto reduzir o saldo, mas o saldo continuar positivo, nunca pergunte como agir "sem impactar negativamente o saldo" ou "sem impacto no saldo". Use: "Como esse gasto afeta o saldo e que ajuste poderia ser feito para preservar parte da poupança?".
- Use "déficit", "saldo negativo", "entrar no vermelho", "prejuízo" ou "orçamento negativo" apenas quando o cálculo realmente resultar em saldo final negativo.
- Valores citados como economia, corte, redução, ajuste, melhoria, reorganização ou valor que poderia ser economizado NÃO são despesas reais. Não some esses valores às despesas iniciais; use-os apenas em "Economia sugerida", "Melhoria sugerida" ou "Resultado após melhoria".
- Em cenários financeiros, separe explicitamente "Receitas", "Despesas fixas", "Despesas variáveis", "Imprevistos" e "Melhorias". Salário, renda, receita do pai ou receita da mãe nunca podem aparecer como despesa.
- Inclua "teacherOrientation": 1 frase prática e pedagógica orientando o professor sobre como conduzir a atividade.

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
    "Material estrutural adequado ao desafio - quantidade por grupo",
    "Elementos móveis ou marcadores - quantidade por grupo",
    "Instrumento de medida, registro ou simulação - quantidade por grupo"
  ],
  "materialFunctions": [
    "Material estrutural adequado ao desafio: quantidade por grupo — sustenta a solução.",
    "Elementos móveis ou marcadores: quantidade por grupo — permitem simular decisões e testar cenários.",
    "Instrumento de medida, registro ou simulação: quantidade por grupo — coleta evidências do teste."
  ],
  "readyMaterials": [
    "CENÁRIO 1 - Funcionamento esperado: situação, dados e pergunta para testar.",
    "CENÁRIO 2 - Imprevisto: restrição, falha ou mudança para comparar.",
    "TABELA DE TESTE - Cenário | Receita Total | Despesas Fixas | Despesas Variáveis | Saldo Inicial | Melhoria Aplicada | Saldo Final Após Melhoria."
  ],
  "stages": [
    {
      "number": 1,
      "title": "ETAPA 1 - Preparar a base e dividir materiais",
      "description": "Divida a base em problema, solução, teste e melhoria. Separe peças móveis e registro."
    },
    {
      "number": 2,
      "title": "ETAPA 2 - Construir as partes principais",
      "description": "Monte as peças centrais e explique a função de cada material no protótipo."
    },
    {
      "number": 3,
      "title": "ETAPA 3 - Criar o mecanismo de interação",
      "description": "Crie cartões, fichas, abas, setas, encaixes ou simulação manipulável."
    },
    {
      "number": 4,
      "title": "ETAPA 4 - Testar com situação real",
      "description": "Aplique dois cenários prontos. Meça resultado, compare e registre falhas."
    },
    {
      "number": 5,
      "title": "ETAPA 5 - Ajustar e testar novamente",
      "description": "Mude uma falha concreta, repita o teste e registre o antes e depois."
    },
    {
      "number": 6,
      "title": "ETAPA 6 - Apresentar produto e evidências",
      "description": "Apresente protótipo, cenário testado, melhoria feita e evidência observada."
    }
  ],
  "makerChallenge": "Construir, testar, comparar e melhorar uma solução para o problema.",
  "finalProduct": "Protótipo final com registro do teste e da melhoria feita.",
  "assessmentRubric": [
    { "criterion": "Protótipo", "observation": "Representa o problema e pode ser testado?" },
    { "criterion": "Teste", "observation": "O grupo aplicou o cenário e registrou resultado?" },
    { "criterion": "Melhoria", "observation": "O grupo ajustou o protótipo após identificar falha?" },
    { "criterion": "Comunicação", "observation": "O grupo explicou solução, teste e melhoria?" }
  ],
  "bibliography": ${JSON.stringify(verifiedSources.length ? verifiedSources.slice(0, 2).map((source) => source.abnt) : ['BRASIL. Ministério da Educação. Base Nacional Comum Curricular. Brasília: MEC, 2018.'])},
  "steamConnection": {
    "science": "conceito ou fenômeno investigado na atividade.",
    "technology": "recurso, ferramenta ou sistema utilizado.",
    "engineering": "o que será construído, testado e melhorado.",
    "art": "elemento visual, criativo ou comunicativo do protótipo.",
    "mathematics": "cálculos, medidas ou comparação de dados."
  },
  "teacherGabarito": [
    "Cenário 1: Receita total: R$ X; Despesas totais: R$ A + R$ B = R$ Y; Saldo final: R$ X − R$ Y = R$ Z.",
    "Cenário 2: Resultado do imprevisto com impacto observado; Sugestão de melhoria objetiva."
  ],
  "teacherOrientation": "Durante a atividade, estimule os alunos a justificarem suas escolhas e registrarem as melhorias no protótipo."
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
- PROIBIDO repetir painel com fichas e canetinhas como solução padrão. Cada atividade deve ter materiais e mecânica de teste completamente diferentes.
- A criatividade é obrigatória: às vezes a atividade ideal usa apenas lápis e papel; outras vezes usa fios, sementes, água, dados, elástico, palitos ou materiais simples do cotidiano.
- Escolha experimento, maquete, jogo, mapa, circuito ou sensor simulado, modelo 3D, protótipo estrutural, instalação, planilha física/digital ou investigação de campo conforme o tema.
- Desenvolvimento e montagem deve ter exatamente estes títulos:
${stageTitles}
- Cada etapa: máximo 3 frases curtas.
- Materiais: máximo 6 itens acessíveis.
- "materialFunctions" deve explicar a função de cada material no protótipo e usar quantidades precisas sempre que possível.
- "readyMaterials" deve entregar cenários, fichas, cartões, tabela de teste, perguntas ou dados citados.
- "stages" deve explicar como preparar base, dividir materiais, construir, manipular, testar, ajustar e apresentar. Não use frases genéricas.
- Inclua 2 testes concretos: um cenário esperado e um cenário com imprevisto, restrição ou falha.
- Avaliação: mini rubrica com "criterion" e "observation", máximo 4 linhas. Não use ponto final no nome do critério.
- Referências: preferencialmente 2 itens, mínimo 1. Use as referências do projeto se houver relação direta com o tema; não invente fonte nem DOI. É melhor usar uma referência correta do que duas com uma fora do assunto.
- Inclua "steamConnection" com 1 frase curta por área: Ciência, Tecnologia, Engenharia, Arte, Matemática.
- Inclua "teacherGabarito" em formato didático, com resposta para TODOS os cenários. Para cálculos, copie os valores dos cenários e mostre soma das despesas e saldo final.
- Em cenários financeiros, se um gasto reduzir o saldo, mas o saldo continuar positivo, nunca pergunte como agir "sem impactar negativamente o saldo". Use pergunta sobre impacto no saldo, reorganização de despesas e preservação de parte da poupança.
- Use "déficit", "saldo negativo", "entrar no vermelho", "prejuízo" ou "orçamento negativo" apenas quando o cálculo realmente resultar em saldo final negativo.
- Valores citados como economia, corte, redução, ajuste, melhoria, reorganização ou valor que poderia ser economizado NÃO são despesas reais. Não some esses valores às despesas iniciais; use-os apenas em "Economia sugerida", "Melhoria sugerida" ou "Resultado após melhoria".
- Em cenários financeiros, separe explicitamente "Receitas", "Despesas fixas", "Despesas variáveis", "Imprevistos" e "Melhorias". Salário, renda, receita do pai ou receita da mãe nunca podem aparecer como despesa.
- Não use emojis.
- Não use reticências. Nenhum texto pode terminar cortado com "...".

Responda APENAS com JSON válido, sem texto antes ou depois:

{
  "title": "Título curto da experiência",
  "theme": "${project.theme || project.title || ''}",
  "duration": "${project.duration || '1 aula'}",
  "objective": "Objetivo geral curto.",
  "problem": "Problema real que inicia a atividade.",
  "mission": "Sua equipe deverá construir e melhorar uma solução.",
  "materials": [
    "Material estrutural adequado ao desafio - quantidade por grupo",
    "Elementos móveis ou marcadores - quantidade por grupo",
    "Instrumento de medida, registro ou simulação - quantidade por grupo"
  ],
  "materialFunctions": [
    "Material estrutural adequado ao desafio: quantidade por grupo — sustenta a solução.",
    "Elementos móveis ou marcadores: quantidade por grupo — permitem simular decisões e testar cenários.",
    "Instrumento de medida, registro ou simulação: quantidade por grupo — coleta evidências do teste."
  ],
  "readyMaterials": [
    "CENÁRIO 1 - Funcionamento esperado: situação, dados e pergunta para testar.",
    "CENÁRIO 2 - Imprevisto: restrição, falha ou mudança para comparar.",
    "TABELA DE TESTE - Cenário | Receita Total | Despesas Fixas | Despesas Variáveis | Saldo Inicial | Melhoria Aplicada | Saldo Final Após Melhoria."
  ],
  "stages": [
    {
      "number": 1,
      "title": "ETAPA 1 - Preparar a base e dividir materiais",
      "description": "Divida a base em problema, solução, teste e melhoria. Separe peças móveis e registro."
    },
    {
      "number": 2,
      "title": "ETAPA 2 - Construir as partes principais",
      "description": "Monte as peças centrais e explique a função de cada material no protótipo."
    },
    {
      "number": 3,
      "title": "ETAPA 3 - Criar o mecanismo de interação",
      "description": "Crie cartões, fichas, abas, setas, encaixes ou simulação manipulável."
    },
    {
      "number": 4,
      "title": "ETAPA 4 - Testar com situação real",
      "description": "Aplique dois cenários prontos. Meça resultado, compare e registre falhas."
    },
    {
      "number": 5,
      "title": "ETAPA 5 - Ajustar e testar novamente",
      "description": "Mude uma falha concreta, repita o teste e registre o antes e depois."
    },
    {
      "number": 6,
      "title": "ETAPA 6 - Apresentar produto e evidências",
      "description": "Apresente protótipo, cenário testado, melhoria feita e evidência observada."
    }
  ],
  "makerChallenge": "Construir, testar, comparar e melhorar uma solução para o problema.",
  "finalProduct": "Protótipo final com registro do teste e da melhoria feita.",
  "assessmentRubric": [
    { "criterion": "Protótipo", "observation": "Representa o problema e pode ser testado?" },
    { "criterion": "Teste", "observation": "O grupo aplicou o cenário e registrou resultado?" },
    { "criterion": "Melhoria", "observation": "O grupo ajustou o protótipo após identificar falha?" },
    { "criterion": "Comunicação", "observation": "O grupo explicou solução, teste e melhoria?" }
  ],
  "steamConnection": {
    "science": "conceito ou fenômeno investigado na atividade.",
    "technology": "recurso, ferramenta ou sistema utilizado.",
    "engineering": "o que será construído, testado e melhorado.",
    "art": "elemento visual, criativo ou comunicativo do protótipo.",
    "mathematics": "cálculos, medidas ou comparação de dados."
  },
  "teacherGabarito": [
    "Cenário 1: Resultado esperado com conclusão objetiva.",
    "Cenário 2: Resultado do imprevisto com impacto observado; Sugestão de melhoria objetiva."
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
      discipline, grade, theme, steamCompetencies, availableMaterials: params.availableMaterials, numberOfClasses, modality,
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
