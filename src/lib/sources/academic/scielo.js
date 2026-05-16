const BASE = 'https://search.scielo.org/api/v2/search/'
const TIMEOUT = 8000

async function fetchWithTimeout(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`SciELO HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

function parseHit(hit) {
  const s = hit._source || {}
  const rawAuthors = Array.isArray(s.au) ? s.au : (s.au ? [s.au] : [])
  return {
    _source: 'scielo',
    title: Array.isArray(s.ti) ? s.ti[0]?.value || s.ti[0] : (s.ti || ''),
    authors: rawAuthors.map((a) => ({ name: String(a) })),
    year: s.dp ? parseInt(String(s.dp).slice(0, 4), 10) : null,
    journal: Array.isArray(s.ta) ? s.ta[0] : (s.ta || ''),
    doi: s.doi || '',
    url: s.ur ? `https://www.scielo.br/j/${s.ur}` : (s.doi ? `https://doi.org/${s.doi}` : ''),
    publisher: s.pb || 'SciELO',
    type: 'article'
  }
}

export async function searchScielo(keywords, limit = 5) {
  try {
    const q = encodeURIComponent(keywords)
    const data = await fetchWithTimeout(`${BASE}?q=${q}&lang=pt&format=json&count=${limit}`)
    const hits = data?.hits?.hits || []
    return hits.map(parseHit).filter((r) => r.title)
  } catch {
    return []
  }
}
