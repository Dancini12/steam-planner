function normalizeAuthors(raw = [], apiSource = 'unknown') {
  let names = []

  if (apiSource === 'crossref') {
    names = raw.map((a) => ({ family: a.family || '', given: a.given || '' }))
  } else if (apiSource === 'openalex') {
    names = raw.map((a) => {
      const display = a.author?.display_name || a.display_name || ''
      const parts = display.trim().split(/\s+/)
      return { family: parts.at(-1) || display, given: parts.slice(0, -1).join(' ') }
    })
  } else {
    names = raw.map((a) => {
      const display = a.name || a.display_name || String(a)
      const parts = display.trim().split(/\s+/)
      return { family: parts.at(-1) || display, given: parts.slice(0, -1).join(' ') }
    })
  }

  const formatted = names.slice(0, 3).map(({ family, given }) => {
    const last = (family || '').toUpperCase()
    const initials = (given || '').split(/\s+/).filter(Boolean).map((p) => `${p[0].toUpperCase()}.`).join(' ')
    return initials ? `${last}, ${initials}` : last
  })

  return formatted.join('; ') + (names.length > 3 ? ' et al.' : '')
}

export function formatAbntArticle(ref) {
  const authors = normalizeAuthors(ref.authors || [], ref._source)
  const title = ref.title || 'Título não disponível'
  const journal = ref.journal || ref.container || ''
  const year = ref.year || ''
  const volume = ref.volume ? `, v. ${ref.volume}` : ''
  const issue = ref.issue ? `, n. ${ref.issue}` : ''
  const pages = ref.pages ? `, p. ${ref.pages}` : ''
  const doiPart = ref.doi ? ` DOI: ${ref.doi}.` : ''
  const urlPart = !ref.doi && ref.url ? ` Disponível em: ${ref.url}. Acesso em: ${new Date().toLocaleDateString('pt-BR')}.` : ''

  const journalPart = journal ? `. **${journal}**` : ''
  return `${authors}. ${title}${journalPart}, ${year}${volume}${issue}${pages}.${doiPart}${urlPart}`.replace(/\s{2,}/g, ' ').trim()
}

export function formatAbntOnline(ref) {
  const authors = ref.authors?.length ? normalizeAuthors(ref.authors, ref._source) + '. ' : ''
  const title = ref.title || 'Título não disponível'
  const site = ref.site || ref.publisher || ''
  const year = ref.year || new Date().getFullYear()
  const url = ref.url || ''
  const sitePart = site ? ` **${site}**, ${year}.` : ` ${year}.`
  const urlPart = url ? ` Disponível em: ${url}. Acesso em: ${new Date().toLocaleDateString('pt-BR')}.` : ''
  return `${authors}${title}.${sitePart}${urlPart}`.replace(/\s{2,}/g, ' ').trim()
}

export function formatAbnt(ref) {
  if (ref.type === 'online' || ref.type === 'news') return formatAbntOnline(ref)
  return formatAbntArticle(ref)
}
