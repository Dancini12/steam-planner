const CURRENT_YEAR = new Date().getFullYear()
const DOI_RE = /^10\.\d{4,9}\/[-._;()/:a-z0-9]+$/i

export function validateMetadata(ref = {}) {
  const issues = []

  if (!ref.title?.trim()) issues.push('título ausente')
  if (!ref.authors?.length) issues.push('autores ausentes')
  if (!ref.year) {
    issues.push('ano ausente')
  } else if (ref.year < 1900 || ref.year > CURRENT_YEAR) {
    issues.push(`ano inválido: ${ref.year}`)
  }
  if (ref.doi && !DOI_RE.test(ref.doi)) issues.push('DOI com formato inválido')

  const status = issues.length === 0 ? 'verified'
    : issues.length <= 1 ? 'incomplete'
    : 'unverified'

  return { ...ref, validationStatus: status, validationIssues: issues }
}

export function deduplicateByDoi(refs = []) {
  const seen = new Set()
  return refs.filter((r) => {
    if (!r.doi) return true
    if (seen.has(r.doi)) return false
    seen.add(r.doi)
    return true
  })
}
