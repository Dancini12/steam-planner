import { AIProviderManager } from './ai/AIProviderManager.js'

function extractJson(text) {
  const start = text.indexOf('[')
  if (start === -1) throw new Error('Nenhum JSON encontrado na resposta')
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < text.length; i++) {
    const c = text[i]
    if (escaped) { escaped = false; continue }
    if (c === '\\') { escaped = true; continue }
    if (c === '"') { inString = !inString; continue }
    if (inString) continue
    if (c === '[' || c === '{') depth++
    if (c === ']' || c === '}') { depth--; if (depth === 0) return text.slice(start, i + 1) }
  }
  throw new Error('JSON incompleto na resposta')
}

function buildPrompt(references) {
  const list = references.map((r, i) => `${i + 1}. ${r}`).join('\n')
  return `Você é especialista em curadoria bibliográfica acadêmica brasileira.

Analise as referências abaixo, geradas por IA, e verifique se cada uma é real, duvidosa ou provavelmente fabricada (alucinação da IA).

Para cada referência avalie:
- O autor existe e publica nessa área do conhecimento?
- O título faz sentido e é conhecido na literatura educacional/científica?
- A editora é real e credível para esse tipo de obra no contexto brasileiro?
- O ano e local de publicação são plausíveis?
- A combinação autor + título + editora é verossímil?

REFERÊNCIAS:
${list}

Responda APENAS com JSON válido (array), sem texto antes ou depois:
[
  {
    "index": 0,
    "status": "real",
    "confidence": 0.9,
    "note": "Breve explicação objetiva em português"
  }
]

Valores possíveis para "status":
- "real"      — referência provavelmente existe e é verificável
- "doubtful"  — incerta; elementos plausíveis mas verificação necessária
- "fabricated"— provavelmente alucinação: autor, título ou editora inexistentes`
}

export async function verifyBibliography(references = []) {
  if (!references.length) return []

  const prompt = buildPrompt(references)
  const response = await AIProviderManager.request({
    requestType: 'bibliography',
    prompt
  })

  const rawText = response.content
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('A IA não retornou conteúdo válido.')
  }

  const parsed = JSON.parse(extractJson(rawText))

  return references.map((ref, i) => {
    const result = parsed.find((r) => r.index === i) || { status: 'doubtful', confidence: 0.5, note: 'Não avaliado.' }
    return {
      ref,
      status: result.status || 'doubtful',
      confidence: typeof result.confidence === 'number' ? result.confidence : 0.5,
      note: result.note || ''
    }
  })
}
