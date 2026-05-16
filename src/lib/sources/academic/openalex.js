const BASE = 'https://api.openalex.org/works'
const TIMEOUT = 8000

async function fetchWithTimeout(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT)
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'STEAM-Planner/1.0' },
      signal: controller.signal
    })
    if (!res.ok) throw new Error(`OpenAlex HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

function parseWork(item) {
  const venue = item.primary_location?.source
  return {
    _source: 'openalex',
    title: item.title || '',
    authors: (item.authorships || []).map((a) => ({ name: a.author?.display_name || '' })),
    year: item.publication_year || null,
    journal: venue?.display_name || '',
    doi: item.doi?.replace('https://doi.org/', '') || '',
    url: item.doi || item.open_access?.oa_url || '',
    publisher: venue?.publisher || '',
    type: 'article'
  }
}

export async function searchOpenAlex(keywords, limit = 5) {
  try {
    const q = encodeURIComponent(keywords)
    const data = await fetchWithTimeout(
      `${BASE}?search=${q}&per-page=${limit}&select=id,title,authorships,publication_year,doi,primary_location,open_access`
    )
    return (data.results || []).map(parseWork)
  } catch {
    return []
  }
}

export async function searchOpenAlexPt(keywords, limit = 5) {
  try {
    const q = encodeURIComponent(keywords)
    const data = await fetchWithTimeout(
      `${BASE}?search=${q}&filter=language:pt&per-page=${limit}&select=id,title,authorships,publication_year,doi,primary_location,open_access`
    )
    return (data.results || []).map(parseWork)
  } catch {
    return []
  }
}
