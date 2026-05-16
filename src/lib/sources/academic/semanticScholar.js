const BASE = 'https://api.semanticscholar.org/graph/v1/paper/search'
const TIMEOUT = 8000
const FIELDS = 'title,authors,year,externalIds,publicationVenue,openAccessPdf'

async function fetchWithTimeout(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`SemanticScholar HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

function parseWork(item) {
  return {
    _source: 'semantic-scholar',
    title: item.title || '',
    authors: (item.authors || []).map((a) => ({ name: a.name || '' })),
    year: item.year || null,
    journal: item.publicationVenue?.name || '',
    doi: item.externalIds?.DOI || '',
    url: item.externalIds?.DOI
      ? `https://doi.org/${item.externalIds.DOI}`
      : (item.openAccessPdf?.url || ''),
    type: 'article'
  }
}

export async function searchSemanticScholar(keywords, limit = 5) {
  try {
    const q = encodeURIComponent(keywords)
    const data = await fetchWithTimeout(`${BASE}?query=${q}&limit=${limit}&fields=${FIELDS}`)
    return (data.data || []).map(parseWork)
  } catch {
    return []
  }
}
