import { AIProviderManager } from './ai/AIProviderManager.js'
import { validateExistingReferences } from './sources/index.js'

function extractJson(text) {
  const start = text.indexOf('[')
  if (start === -1) throw new Error('Nenhum JSON encontrado na resposta')
  let depth = 0, inString = false, escaped = false
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

Analise as referências abaixo e verifique se cada uma é real, duvidosa ou provavelmente fabricada (alucinação de IA).

Avalie por referência: o autor existe nessa área? O título é conhecido? A editora é credível no Brasil? O ano é plausível?

REFERÊNCIAS:
${list}

Responda APENAS com JSON válido (array), sem texto antes ou depois:
[
  {
    "index": 0,
    "status": "real",
    "confidence": 0.9,
    "note": "Explicação objetiva em português"
  }
]

Status: "real" (provavelmente existe), "doubtful" (verificação necessária), "fabricated" (provavelmente alucinação)`
}

export async function verifyBibliography(references = []) {
  if (!references.length) return []

  // Etapa 1: verificação real por DOI via Crossref
  const doiResults = await validateExistingReferences(references).catch(() =>
    references.map((ref) => ({ ref, status: 'no-doi', validated: null }))
  )

  // Etapa 2: IA para as que não têm DOI verificado
  const needsAI = references.filter((_, i) => doiResults[i]?.status !== 'doi-verified')

  let aiResults = []
  if (needsAI.length > 0) {
    try {
      const response = await AIProviderManager.request({ requestType: 'bibliographyverification', prompt: buildPrompt(needsAI) })
      const rawText = response.content
      if (rawText && typeof rawText === 'string') {
        const jsonStr = extractJson(rawText)
        const parsed = (() => { try { return JSON.parse(jsonStr) } catch { return JSON.parse(jsonStr.replace(/[\n\r\t]/g, ' ')) } })()
        aiResults = needsAI.map((ref, localIdx) => {
          const r = parsed.find((p) => p.index === localIdx) || { status: 'doubtful', confidence: 0.5, note: 'Não avaliado pela IA.' }
          return { ref, status: r.status || 'doubtful', confidence: r.confidence ?? 0.5, note: r.note || '', source: 'ai' }
        })
      }
    } catch {
      aiResults = needsAI.map((ref) => ({ ref, status: 'doubtful', confidence: 0.5, note: 'Verificação indisponível no momento.', source: 'ai' }))
    }
  }

  // Merge: DOI verificado > resultado da IA
  let aiIdx = 0
  return references.map((ref, i) => {
    const doi = doiResults[i]
    if (doi?.status === 'doi-verified' && doi.validated) {
      return {
        ref,
        status: 'real',
        confidence: 0.98,
        note: `DOI verificado via Crossref. Obra: "${doi.validated.title}" (${doi.validated.year}).`,
        source: 'crossref'
      }
    }
    const ai = aiResults[aiIdx++] || { ref, status: 'doubtful', confidence: 0.5, note: '', source: 'ai' }
    return ai
  })
}
