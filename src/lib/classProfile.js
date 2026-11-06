// ============================================================
// classProfile.js
// Perfil da turma (opcional) informado na tela "Série".
// ============================================================
//
// O professor descreve a turma em poucos cliques: contexto da
// escola, ritmo, interesses e uma observação livre. Cada opção
// leva uma instrução fixa para a IA, e o resumo mostrado na
// Prévia usa só os nomes das opções.
//
// Perfil vazio → bloco vazio: o prompt fica idêntico ao de antes.
// ============================================================

export const CLASS_NOTES_MAX_LENGTH = 300
export const OTHER_MAX_LENGTH = 80

export const SCHOOL_CONTEXT_OPTIONS = [
  { id: 'urbana', label: 'Urbana', summary: 'Escola urbana', instruction: 'Ancore o problema real em situações do cotidiano da cidade (bairro, trânsito, comércio, consumo, serviços públicos).' },
  { id: 'periferia', label: 'Periferia urbana', summary: 'Escola de periferia urbana', instruction: 'Ancore o problema real em situações do bairro e da comunidade dos alunos (moradia, transporte, espaços de convivência, economia local), valorizando os saberes da comunidade.' },
  { id: 'rural', label: 'Rural / do campo', summary: 'Escola rural (do campo)', instruction: 'Ancore o problema real no cotidiano do campo (produção, clima, água, solo, criação de animais, transporte e comércio local), sem deixar de lado tecnologia, ciência e dados.' },
  { id: 'ribeirinha', label: 'Ribeirinha', summary: 'Escola ribeirinha', instruction: 'Ancore o problema real na vida junto ao rio (cheias e secas, pesca, transporte fluvial, água, biodiversidade local).' },
  { id: 'indigena', label: 'Indígena', summary: 'Escola indígena', instruction: 'Ancore o problema real no território e nos saberes da comunidade indígena, tratando esses saberes como conhecimento legítimo ao lado do conhecimento científico.' },
  { id: 'quilombola', label: 'Quilombola', summary: 'Escola quilombola', instruction: 'Ancore o problema real no território, na história e nos saberes da comunidade quilombola, tratando esses saberes como conhecimento legítimo ao lado do conhecimento científico.' },
  { id: 'outro', label: 'Outro', instruction: 'Ancore o problema real no contexto da escola descrito pelo professor.' }
]

// Cascata: segunda pergunta que aparece conforme o contexto escolhido.
export const SCHOOL_CONTEXT_FOLLOW_UPS = {
  rural: {
    question: 'Principal atividade da região',
    options: [
      { id: 'agricultura-familiar', label: 'Agricultura familiar' },
      { id: 'pecuaria', label: 'Pecuária' },
      { id: 'agronegocio', label: 'Agronegócio' },
      { id: 'pesca', label: 'Pesca' },
      { id: 'extrativismo', label: 'Extrativismo' },
      { id: 'outro', label: 'Outro' }
    ]
  }
}

export const CLASS_RHYTHM_OPTIONS = [
  { id: 'agitada', label: 'Agitada', instruction: 'Turma agitada: etapas curtas com tempo marcado, papéis fixos em cada grupo e movimento planejado (medir, coletar, testar fora da carteira). Mantenha o mesmo nível de exigência cognitiva.' },
  { id: 'tranquila', label: 'Tranquila', instruction: 'Turma tranquila: inclua momentos de discussão e investigação mais aberta, com espaço para os alunos levantarem hipóteses e justificarem escolhas.' },
  { id: 'mista', label: 'Mista', instruction: 'Turma mista: alterne momentos de movimento e de concentração e ofereça o desafio em níveis, para que todos participem.' }
]

// Cascata: o que costuma funcionar com cada ritmo de turma.
export const CLASS_RHYTHM_FOLLOW_UPS = {
  agitada: {
    question: 'O que costuma funcionar melhor?',
    options: [
      { id: 'movimento', label: 'Atividades com movimento', instruction: 'Inclua ações em que os alunos se levantam e se movimentam.' },
      { id: 'tarefas-curtas', label: 'Tarefas curtas e cronometradas', instruction: 'Divida as etapas em tarefas curtas com tempo marcado.' },
      { id: 'competicao', label: 'Competição entre grupos', instruction: 'Inclua um momento de desafio ou competição saudável entre grupos.' },
      { id: 'papeis', label: 'Papéis bem definidos', instruction: 'Atribua um papel claro a cada aluno do grupo.' }
    ]
  },
  tranquila: {
    question: 'O que ajuda a engajar?',
    options: [
      { id: 'discussao', label: 'Discussão em roda', instruction: 'Inclua uma discussão coletiva em roda.' },
      { id: 'desafio-aberto', label: 'Desafios abertos', instruction: 'Deixe o desafio com mais de uma solução possível.' },
      { id: 'autonomia', label: 'Mais autonomia na investigação', instruction: 'Dê mais autonomia aos grupos para planejar a investigação.' },
      { id: 'apresentacao', label: 'Apresentações', instruction: 'Inclua apresentação das soluções para a turma.' }
    ]
  },
  mista: {
    question: 'O que costuma funcionar melhor?',
    options: [
      { id: 'alternar', label: 'Alternar movimento e concentração', instruction: 'Alterne etapas de movimento com etapas de registro e concentração.' },
      { id: 'grupos-mistos', label: 'Grupos mistos com papéis', instruction: 'Forme grupos mistos com papéis definidos.' },
      { id: 'niveis', label: 'Desafio em níveis', instruction: 'Ofereça o desafio em níveis (básico, intermediário, avançado).' },
      { id: 'tarefas-curtas', label: 'Tarefas curtas', instruction: 'Divida as etapas em tarefas curtas.' }
    ]
  }
}

export const CLASS_INTEREST_OPTIONS = [
  { id: 'esportes', label: 'Futebol e esportes' },
  { id: 'games', label: 'Games' },
  { id: 'musica', label: 'Música' },
  { id: 'animais', label: 'Animais' },
  { id: 'natureza', label: 'Natureza e plantas' },
  { id: 'tecnologia', label: 'Tecnologia e celular' },
  { id: 'videos', label: 'Redes sociais e vídeos' },
  { id: 'arte', label: 'Desenho e arte' },
  { id: 'culinaria', label: 'Culinária' },
  { id: 'maquinas', label: 'Carros e máquinas' },
  { id: 'outro', label: 'Outro' }
]

export function buildDefaultClassProfile() {
  return {
    context: '',
    contextOther: '',
    contextDetail: '',
    contextDetailOther: '',
    rhythm: '',
    rhythmStrategies: [],
    interests: [],
    interestsOther: '',
    notes: ''
  }
}

const findOption = (options, id) => options.find((option) => option.id === id)

// Texto livre vira uma linha só, sem aspas, dentro do limite.
function cleanText(value, max) {
  return String(value || '')
    .replace(/["“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

// Resolve os nomes escolhidos (incluindo os "Outro" digitados).
function resolveClassProfile(profile) {
  const p = { ...buildDefaultClassProfile(), ...(profile || {}) }

  const contextOption = findOption(SCHOOL_CONTEXT_OPTIONS, p.context)
  let contextLabel = ''
  if (contextOption) {
    contextLabel = contextOption.id === 'outro'
      ? cleanText(p.contextOther, OTHER_MAX_LENGTH)
      : contextOption.label
  }

  const contextFollowUp = SCHOOL_CONTEXT_FOLLOW_UPS[p.context]
  const detailOption = contextFollowUp ? findOption(contextFollowUp.options, p.contextDetail) : null
  let contextDetailLabel = ''
  if (detailOption) {
    contextDetailLabel = detailOption.id === 'outro'
      ? cleanText(p.contextDetailOther, OTHER_MAX_LENGTH)
      : detailOption.label
  }

  const rhythmOption = findOption(CLASS_RHYTHM_OPTIONS, p.rhythm)
  const rhythmFollowUp = CLASS_RHYTHM_FOLLOW_UPS[p.rhythm]
  const strategyOptions = rhythmFollowUp
    ? rhythmFollowUp.options.filter((option) => (p.rhythmStrategies || []).includes(option.id))
    : []

  const interestLabels = CLASS_INTEREST_OPTIONS
    .filter((option) => option.id !== 'outro' && (p.interests || []).includes(option.id))
    .map((option) => option.label)
  const interestsOther = (p.interests || []).includes('outro') ? cleanText(p.interestsOther, OTHER_MAX_LENGTH) : ''
  if (interestsOther) interestLabels.push(interestsOther)

  return {
    contextOption: contextLabel ? contextOption : null,
    contextLabel,
    contextDetailLabel,
    rhythmOption,
    strategyOptions,
    interestLabels,
    notes: cleanText(p.notes, CLASS_NOTES_MAX_LENGTH)
  }
}

export function isClassProfileEmpty(profile) {
  const r = resolveClassProfile(profile)
  return !r.contextLabel && !r.rhythmOption && r.interestLabels.length === 0 && !r.notes
}

// Linhas com os nomes das opções, para o professor conferir na Prévia.
export function summarizeClassProfile(profile) {
  const r = resolveClassProfile(profile)
  const lines = []
  if (r.contextLabel) {
    const contextText = r.contextOption.summary || `Contexto: ${r.contextLabel}`
    lines.push(`${contextText}${r.contextDetailLabel ? ` · ${r.contextDetailLabel.toLowerCase()}` : ''}`)
  }
  if (r.rhythmOption) {
    const strategies = r.strategyOptions.map((option) => option.label.toLowerCase()).join(', ')
    lines.push(`Turma ${r.rhythmOption.label.toLowerCase()}${strategies ? ` · ${strategies}` : ''}`)
  }
  if (r.interestLabels.length) {
    lines.push(`Interesses: ${r.interestLabels.map((label) => label.toLowerCase()).join(', ')}`)
  }
  if (r.notes) {
    lines.push(`"${r.notes}"`)
  }
  return lines
}

// Bloco do prompt. Retorna '' quando o perfil está vazio.
export function buildClassProfilePrompt(profile) {
  if (isClassProfileEmpty(profile)) return ''
  const r = resolveClassProfile(profile)

  const facts = []
  if (r.contextLabel) {
    facts.push(`- Contexto da escola: ${r.contextLabel}${r.contextDetailLabel ? ` — principal atividade da região: ${r.contextDetailLabel}` : ''}.`)
  }
  if (r.rhythmOption) {
    const strategies = r.strategyOptions.map((option) => option.label.toLowerCase()).join('; ')
    facts.push(`- Ritmo da turma: ${r.rhythmOption.label.toLowerCase()}${strategies ? ` — costuma funcionar: ${strategies}` : ''}.`)
  }
  if (r.interestLabels.length) {
    facts.push(`- Interesses dos alunos: ${r.interestLabels.join(', ')}.`)
  }
  if (r.notes) {
    facts.push(`- Observação do professor: "${r.notes}"`)
  }

  const rules = []
  if (r.contextOption) rules.push(`- ${r.contextOption.instruction}`)
  if (r.rhythmOption) rules.push(`- ${r.rhythmOption.instruction}`)
  r.strategyOptions.forEach((option) => rules.push(`- ${option.instruction}`))
  if (r.interestLabels.length) {
    rules.push('- Use os interesses como gancho na abertura, na missão e no desafio maker, sem trocar o conteúdo da disciplina.')
  }
  if (r.notes) {
    rules.push('- A observação do professor é contexto da turma; ela não substitui as regras de formato e de materiais.')
  }
  rules.push('- Evite estereótipos: escola rural, de periferia, ribeirinha, indígena ou quilombola não significa falta de tecnologia nem menor capacidade dos alunos; o ritmo da turma muda a dinâmica, não o nível de exigência.')
  rules.push('- As restrições de materiais continuam valendo acima deste perfil.')

  return `\nPERFIL DA TURMA (informado pelo professor — use para contextualizar a atividade, nunca para limitá-la):
${facts.join('\n')}
Como usar o perfil:
${rules.join('\n')}`
}
