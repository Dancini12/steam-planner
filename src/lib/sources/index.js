import { searchCrossref, lookupByDoi } from './academic/crossref.js'
import { searchOpenAlex, searchOpenAlexPt } from './academic/openalex.js'
import { searchSemanticScholar } from './academic/semanticScholar.js'
import { searchScielo } from './academic/scielo.js'
import { validateMetadata, deduplicateByDoi } from './validation/metadataValidator.js'
import { formatAbnt } from './citation-format/abnt.js'

const STOP_WORDS = new Set([
  'para', 'com', 'uma', 'que', 'por', 'dos', 'das', 'nas', 'nos', 'seu', 'sua',
  'como', 'mais', 'ano', 'ensino', 'aula', 'aluno', 'turma', 'serie', 'ano',
  'fundamental', 'medio', 'medio', 'basico', 'geral', 'escolar'
])

export function extractKeywords(theme = '', discipline = '', grade = '') {
  const raw = `${theme} ${discipline}`.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w))

  const unique = [...new Set(raw)]
  const gradeNum = grade.match(/\d+/)?.[0]
  if (gradeNum) unique.push(`${gradeNum}º ano`)

  return unique.slice(0, 6).join(' ')
}

function score(ref) {
  let s = 0
  if (ref.doi) s += 3
  if (ref.year && ref.year >= 2010) s += 2
  if (ref.authors?.length) s += 1
  if (ref.journal) s += 1
  if (ref.url) s += 1
  if (ref._source === 'crossref') s += 1
  if (ref._source === 'scielo') s += 2
  return s
}

export async function findSourcesForActivity({ theme, discipline, grade, limit = 5 } = {}) {
  const keywords = extractKeywords(theme, discipline, grade)
  if (!keywords.trim()) return []

  const [crossrefPt, openAlexPt, scielo, semanticScholar] = await Promise.allSettled([
    searchCrossref(`${keywords} educação`, Math.ceil(limit / 2) + 2),
    searchOpenAlexPt(keywords, Math.ceil(limit / 2) + 2),
    searchScielo(keywords, Math.ceil(limit / 2) + 2),
    searchSemanticScholar(keywords, Math.ceil(limit / 2))
  ])

  const all = [
    ...(crossrefPt.status === 'fulfilled' ? crossrefPt.value : []),
    ...(openAlexPt.status === 'fulfilled' ? openAlexPt.value : []),
    ...(scielo.status === 'fulfilled' ? scielo.value : []),
    ...(semanticScholar.status === 'fulfilled' ? semanticScholar.value : [])
  ]

  const validated = deduplicateByDoi(
    all.map(validateMetadata).filter((r) => r.validationStatus !== 'unverified' || r.doi)
  )

  const ranked = validated
    .filter((r) => r.title?.trim())
    .sort((a, b) => score(b) - score(a))
    .slice(0, limit)

  return ranked.map((r) => ({ ...r, abnt: formatAbnt(r) }))
}

export async function validateExistingReferences(refs = []) {
  const results = await Promise.all(
    refs.map(async (ref) => {
      const doiMatch = ref.match(/\b(10\.\d{4,9}\/[^\s]+)/i)
      if (!doiMatch) return { ref, status: 'no-doi', validated: null }
      const doi = doiMatch[1].replace(/[.,;]$/, '')
      const validated = await lookupByDoi(doi)
      if (!validated) return { ref, status: 'doi-not-found', validated: null }
      return { ref, status: 'doi-verified', validated: { ...validated, abnt: formatAbnt(validated) } }
    })
  )
  return results
}

export { formatAbnt, lookupByDoi }
