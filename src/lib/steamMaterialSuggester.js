// ============================================================
// steamMaterialSuggester.js
// Sugere, a partir dos materiais que o professor já possui,
// quais áreas STEAM (S-T-E-A-M) fazem sentido usar na atividade
// e explica o motivo com base nos próprios materiais informados.
//
// É uma heurística por palavras-chave (sem chamada de IA): roda
// no cliente, é instantânea e serve como ponto de partida — o
// professor confirma/ajusta as áreas manualmente na etapa seguinte.
// ============================================================

// Divide o texto de materiais do professor em itens individuais.
// (mesma lógica de src/lib/ai/pedagogicalPlannerService.js — duplicada aqui,
// em vez de importada, para manter esta heurística leve e independente da
// cadeia de dependências do serviço de IA, já que ela roda a cada tecla digitada.)
function parseAvailableMaterialsList(text = '') {
  return String(text)
    .split(/[\n;,]+/)
    .map((s) => s.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter((s) => s.length >= 2)
}

// Identidade visual usada também no seletor de competências STEAM do
// formulário (ícone, nome e cor por área).
const AREA_META = {
  science: { letter: 'S', name: 'Ciência', icon: '🔬', color: '#10B981' },
  technology: { letter: 'T', name: 'Tecnologia', icon: '💻', color: '#3B82F6' },
  engineering: { letter: 'E', name: 'Engenharia', icon: '⚙️', color: '#F59E0B' },
  arts: { letter: 'A', name: 'Arte', icon: '🎨', color: '#EF4444' },
  mathematics: { letter: 'M', name: 'Matemática', icon: '🔢', color: '#8B5CF6' }
}

// Por que um material daquele tipo indica a área — usado para montar a explicação.
const AREA_WHY = {
  science: 'permitem observar, medir ou experimentar um fenômeno — a base do método científico',
  technology: 'envolvem componentes eletrônicos, digitais ou dispositivos — uso e criação de ferramentas tecnológicas',
  engineering: 'servem para montar, sustentar ou testar uma estrutura física — projetar e construir soluções',
  arts: 'permitem expressão visual, estética ou criativa do resultado final',
  mathematics: 'permitem medir, contar, calcular ou organizar dados numericamente'
}

// Palavras-chave (normalizadas, sem acento) associadas a cada área.
const AREA_KEYWORDS = {
  science: [
    'lupa', 'microscopio', 'proveta', 'becker', 'tubo de ensaio', 'erlenmeyer', 'pipeta',
    'reagente', 'solucao', 'vinagre', 'bicarbonato', 'planta', 'semente', 'solo', 'terra',
    'inseto', 'termometro', 'ima', 'bussola', ' ph', 'corante', 'luva', 'oculos de protecao',
    'fertilizante', 'agua sanitaria', 'algodao'
  ],
  technology: [
    'computador', 'notebook', 'celular', 'tablet', 'smartphone', 'software', 'aplicativo',
    'app', 'internet', 'sensor', 'arduino', 'microcontrolador', 'circuito', 'led',
    'resistor', 'protoboard', 'fio eletrico', 'motor eletrico', 'pilha', 'bateria',
    'projetor', 'caixa de som', 'microfone', 'camera', 'codigo', 'programacao', 'robo',
    'impressora 3d', 'placa eletronica', 'wifi', 'bluetooth', 'kit de circuito'
  ],
  engineering: [
    'estrutura', 'ponte', 'rampa', 'roldana', 'alavanca', 'engrenagem', 'palito de picole',
    'palito de sorvete', 'palito de dente', 'canudo', 'papelao', 'cola quente', 'fita adesiva',
    'arame', 'parafuso', 'porca', 'martelo', 'esquadro', 'roda', 'eixo', 'suporte', 'torre',
    'trelica', 'madeira', 'isopor', 'pregos', 'chave de fenda', 'alicate', 'barbante', 'corda'
  ],
  arts: [
    'tinta', 'pincel', 'lapis de cor', 'giz de cera', 'cartolina colorida', 'papel colorido',
    'argila', 'massinha', 'tecido', 'la ', 'cola colorida', 'revista', 'glitter', 'musica',
    'instrumento musical', 'figurino', 'aquarela', 'marcador colorido', 'papel crepom', 'tesoura'
  ],
  mathematics: [
    'regua', 'fita metrica', 'trena', 'balanca', 'cronometro', 'calculadora', 'transferidor',
    'compasso', 'planilha', 'papel milimetrado', 'moeda', 'dinheiro de brinquedo', 'dado',
    'tabela', 'grafico'
  ]
}

// Materiais genéricos (papel, lápis...) que sozinhos não indicam uma área específica,
// mas sustentam registro/representação — usados só quando nada mais casa.
const GENERIC_FALLBACK_KEYWORDS = ['papel', 'folha', 'lapis', 'caneta', 'caderno', 'cartolina']

function normalize(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

// Ordem oficial do acrônimo, para desempate estável.
const AREA_ORDER = ['science', 'technology', 'engineering', 'arts', 'mathematics']

function matchAreas(materialsList, keywordMap) {
  const hits = {}
  materialsList.forEach((rawItem) => {
    const item = normalize(rawItem)
    AREA_ORDER.forEach((areaId) => {
      const keywords = keywordMap[areaId] || []
      if (keywords.some((kw) => item.includes(kw))) {
        if (!hits[areaId]) hits[areaId] = []
        hits[areaId].push(rawItem.trim())
      }
    })
  })
  return hits
}

// Sugere as áreas STEAM aplicáveis aos materiais informados pelo professor.
// Retorna { matches, fallbackMessage } — `matches` já vem ordenado por
// relevância (mais materiais relacionados primeiro).
export function suggestSteamAreasForMaterials(availableMaterials = '') {
  const materialsList = parseAvailableMaterialsList(availableMaterials)

  if (materialsList.length === 0) {
    return { matches: [], fallbackMessage: '' }
  }

  let hits = matchAreas(materialsList, AREA_KEYWORDS)

  // Nada casou com palavras-chave específicas: tenta o fallback genérico
  // (materiais de registro sustentam Arte e Matemática).
  if (Object.keys(hits).length === 0) {
    hits = matchAreas(materialsList, {
      arts: GENERIC_FALLBACK_KEYWORDS,
      mathematics: GENERIC_FALLBACK_KEYWORDS
    })
  }

  const matches = AREA_ORDER
    .filter((areaId) => hits[areaId]?.length)
    .map((areaId) => {
      const meta = AREA_META[areaId]
      const items = [...new Set(hits[areaId])].slice(0, 3)
      return {
        id: areaId,
        letter: meta.letter,
        name: meta.name,
        icon: meta.icon,
        color: meta.color,
        matchedMaterials: items,
        reason: `Materiais como "${items.join(', ')}" ${AREA_WHY[areaId]}.`
      }
    })
    .sort((a, b) => b.matchedMaterials.length - a.matchedMaterials.length)

  if (matches.length === 0) {
    return {
      matches: [],
      fallbackMessage: 'Não identificamos palavras-chave específicas nestes materiais. Detalhe um pouco mais (ex.: "kit de circuito", "argila", "balança") para receber sugestões de área STEAM mais precisas.'
    }
  }

  return { matches, fallbackMessage: '' }
}
