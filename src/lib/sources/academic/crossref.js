const BASE = 'https://api.crossref.org/works'
const HEADERS = { 'User-Agent': 'STEAM-Planner/1.0 (educacao@steamplanner.app)' }
const TIMEOUT = 8000

async function fetchWithTimeout(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT)
  try {
    const res = await fetch(url, { headers: HEADERS, signal: controller.signal })
    if (!res.ok) throw new Error(`Crossref HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

function parseWork(item) {
  return {
    _source: 'crossref',
    title: Array.isArray(item.title) ? item.title[0] : item.title || '',
    authors: item.author || [],
    year: item.published?.['date-parts']?.[0]?.[0] || item['published-print']?.['date-parts']?.[0]?.[0] || null,
    journal: Array.isArray(item['container-title']) ? item['container-title'][0] : item['container-title'] || '',
    volume: item.volume || '',
    issue: item.issue || '',
    pages: item.page || '',
    doi: item.DOI || '',
    url: item.DOI ? `https://doi.org/${item.DOI}` : (item.URL || ''),
    publisher: item.publisher || '',
    type: 'article'
  }
}

export async function searchCrossref(keywords, limit = 5) {
  try {
    const q = encodeURIComponent(keywords)
    const data = await fetchWithTimeout(
      `${BASE}?query=${q}&rows=${limit}&sort=relevance&select=DOI,title,author,published,container-title,volume,issue,page,publisher`
    )
    return (data.message?.items || []).map(parseWork)
  } catch {
    return []
  }
}

export async function lookupByDoi(doi) {
  try {
    const data = await fetchWithTimeout(`${BASE}/${encodeURIComponent(doi)}`)
    return parseWork(data.message)
  } catch {
    return null
  }
}
