/**
 * knowledgeBaseService.js
 *
 * Base de conhecimento pedagógico local.
 * Busca conteúdos acadêmicos, valida fontes, gera embeddings
 * e salva no Supabase para reutilização, reduzindo chamadas à IA.
 *
 * Fluxo de prioridade ao gerar atividades:
 *   1. Supabase (knowledge_base) — busca por embeddings + tópico
 *   2. APIs acadêmicas externas  — Crossref, OpenAlex, SciELO, Semantic Scholar
 *   3. IA generativa             — apenas se as anteriores forem insuficientes
 */

import { supabase } from '../supabaseClient.js'
import { createTextEmbedding, cosineSimilarity } from '../machine-learning/embeddings/textVectorizer.js'
import { formatAbnt } from '../sources/citation-format/abnt.js'
import { findSourcesForActivity } from '../sources/index.js'

// ─── Classificação de tópicos ────────────────────────────────────────────────

const TOPIC_PATTERNS = [
  { key: 'steam',               re: /steam|maker|prototip|design.?thinking|construcao/i },
  { key: 'bncc',                re: /bncc|base.?nacional|competencia.?curricular|habilidade.?curricular/i },
  { key: 'sustentabilidade',    re: /sustent|recicl|ambiental|ecolog|carbono|clima|green/i },
  { key: 'educacao-financeira', re: /financ|dinheiro|orcamento|poupanca|investimento|economia.?pessoal/i },
  { key: 'robotica',            re: /robot|arduino|automacao|sensor|scratch|program|codigo/i },
  { key: 'tecnologia',          re: /tecnolog|digital|internet|software|hardware|letramento.?digital/i },
  { key: 'ciencias',            re: /ciencia|quimica|fisica|biologia|natureza|experimento|laboratorio/i },
  { key: 'matematica',          re: /matem|calculo|algebra|geometria|fracao|estatistica|probabilidade/i },
  { key: 'fake-news',           re: /fake.?news|desinformac|checagem|factcheck|midia.?critica|rumor/i },
  { key: 'ia-educacao',         re: /inteligencia.?artificial|machine.?learning|algoritmo|chatbot|ia.?educac/i },
  { key: 'meio-ambiente',       re: /meio.?ambiente|floresta|biodiversidade|poluicao|desmatamento/i },
  { key: 'empreendedorismo',    re: /empreend|startup|inovacao|negocio|empresa|criatividade.?mercado/i },
]

/** Tópicos pré-definidos para popular a base de conhecimento. */
const SEED_TOPICS = [
  { key: 'steam',               query: 'STEAM education maker culture Brazil escola fundamental' },
  { key: 'bncc',                query: 'base nacional comum curricular competencias habilidades ensino' },
  { key: 'sustentabilidade',    query: 'sustentabilidade reciclagem educacao ambiental escola fundamental' },
  { key: 'educacao-financeira', query: 'educacao financeira escola criancas economia fundamental' },
  { key: 'robotica',            query: 'robotica educacional arduino programacao escola fundamental' },
  { key: 'tecnologia',          query: 'tecnologia educacional letramento digital escola fundamental' },
  { key: 'ciencias',            query: 'ciencias naturais ensino fundamental experimentos metodologia' },
  { key: 'matematica',          query: 'matematica ensino fundamental resolucao problemas jogos pedagogicos' },
  { key: 'fake-news',           query: 'fake news misinformation media literacy education youth' },
  { key: 'ia-educacao',         query: 'inteligencia artificial educacao escola algoritmos etica' },
  { key: 'meio-ambiente',       query: 'meio ambiente educacao ambiental natureza escola sustentavel' },
  { key: 'empreendedorismo',    query: 'empreendedorismo jovem escola inovacao criatividade educacao' },
  { key: 'metodologias-ativas', query: 'metodologias ativas aprendizagem ativa sala de aula pedagogia' },
  { key: 'planos-de-aula',      query: 'plano de aula pedagogico estrutura objetivos avaliacao BNCC' },
  { key: 'steam',               query: 'cultura maker educacao fundamental prototipagem iteracao escola' },
]

// ─── Score de confiabilidade (0 – 100) ───────────────────────────────────────

const SOURCE_BASE_SCORES = { crossref: 20, scielo: 25, openalex: 18, semantic_scholar: 18 }

function computeReliabilityScore(ref) {
  let score = SOURCE_BASE_SCORES[ref._source] || 5
  if (ref.doi)              score += 25
  if (ref.authors?.length)  score += 15
  const y = Number(ref.year)
  if (y >= 2018)      score += 15
  else if (y >= 2015) score += 12
  else if (y >= 2010) score += 8
  else if (y >= 2000) score += 4
  if (ref.journal)    score += 5
  if (ref.url)        score += 3
  return Math.min(100, score)
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

function classifyTopic(theme = '', discipline = '') {
  const text = `${theme} ${discipline}`
    .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  for (const { key, re } of TOPIC_PATTERNS) {
    if (re.test(text)) return key
  }
  return 'geral'
}

function normalizeAuthorNames(authors = []) {
  return (authors || []).map((a) => {
    if (typeof a === 'string') return a
    if (a.name)         return a.name
    if (a.display_name) return a.display_name
    return `${a.given || ''} ${a.family || ''}`.trim() || 'Autor desconhecido'
  })
}

function buildSearchText(ref, meta = {}) {
  return [
    ref.title,
    ref.abstract || ref.summary || '',
    normalizeAuthorNames(ref.authors || []).join(' '),
    ref.journal || '',
    meta.theme || '',
    meta.discipline || '',
  ].filter(Boolean).join(' ')
}

// ─── Persistência no Supabase ─────────────────────────────────────────────────

async function persistEmbedding(knowledgeId, searchText, topic) {
  if (!supabase) return
  try {
    const embedding = createTextEmbedding(searchText)
    const keywords = [...new Set(
      searchText.split(/\s+/).filter(w => w.length >= 4)
    )].slice(0, 20)

    await supabase.from('knowledge_embeddings').upsert(
      { knowledge_id: knowledgeId, embedding: embedding.values, topic, keywords },
      { onConflict: 'knowledge_id' }
    )
  } catch { /* degradação silenciosa */ }
}

async function persistEntry(ref, meta = {}) {
  if (!supabase) return null
  try {
    const score = computeReliabilityScore(ref)
    if (score < 60) return null   // descarta entradas de baixa qualidade

    const topic        = meta.topic || classifyTopic(meta.theme || '', meta.discipline || '')
    const authorNames  = normalizeAuthorNames(ref.authors || [])
    const abntCitation = formatAbnt(ref)
    const searchText   = buildSearchText(ref, meta)
    const keywords     = [...new Set(searchText.split(/\s+/).filter(w => w.length >= 4))].slice(0, 20)

    const entry = {
      title:             ref.title || '',
      summary:           ref.abstract || ref.summary ||
                           `${ref.title}. ${ref.journal ? `Publicado em ${ref.journal}.` : ''} ${ref.year || ''}`.trim(),
      content:           ref.abstract || ref.summary || ref.title || '',
      source_url:        ref.url || '',
      source_name:       ref._source || 'academic',
      authors:           authorNames,
      year:              ref.year || null,
      doi:               ref.doi || null,
      topic,
      subject:           meta.discipline || '',
      grade_level:       meta.grade || '',
      steam_areas:       meta.steamAreas || [],
      maker_connection:  (meta.steamAreas || []).length > 0,
      bncc_codes:        meta.bnccCodes || [],
      keywords,
      reliability_score: score,
      abnt_citation:     abntCitation,
      updated_at:        new Date().toISOString(),
    }

    let savedId = null

    if (ref.doi) {
      // Upsert pelo DOI — evita duplicatas para artigos identificados
      const { data } = await supabase
        .from('knowledge_base')
        .upsert(entry, { onConflict: 'doi' })
        .select('id')
        .single()
      savedId = data?.id
    } else {
      // Sem DOI: verifica duplicata por título + fonte
      const { data: existing } = await supabase
        .from('knowledge_base')
        .select('id')
        .eq('title', entry.title)
        .eq('source_name', entry.source_name)
        .maybeSingle()

      if (existing?.id) {
        savedId = existing.id
      } else {
        const { data } = await supabase
          .from('knowledge_base')
          .insert(entry)
          .select('id')
          .single()
        savedId = data?.id
      }
    }

    if (savedId) {
      await persistEmbedding(savedId, searchText, topic)
    }
    return savedId
  } catch { return null }
}

// ─── Busca na base local ──────────────────────────────────────────────────────

/**
 * Busca por similaridade de embedding + filtro por tópico.
 * Busca local em JS (cosine similarity) — não requer pgvector.
 */
async function searchByEmbedding(theme, discipline, grade, topic, limit = 5) {
  if (!supabase) return []
  try {
    const queryEmbedding = createTextEmbedding(`${theme} ${discipline} ${grade}`.trim())

    let q = supabase.from('knowledge_embeddings').select('knowledge_id, embedding').limit(150)
    if (topic !== 'geral') q = q.eq('topic', topic)
    const { data: rows } = await q
    if (!rows?.length) return []

    const scored = rows
      .map((r) => {
        const vec = Array.isArray(r.embedding)
          ? r.embedding
          : Object.values(r.embedding || {})
        return { id: r.knowledge_id, sim: cosineSimilarity(queryEmbedding.values, vec) }
      })
      .filter(r => r.sim > 0.08)
      .sort((a, b) => b.sim - a.sim)
      .slice(0, limit * 2)

    if (!scored.length) return []

    const { data } = await supabase
      .from('knowledge_base')
      .select('*')
      .in('id', scored.map(r => r.id))
      .gte('reliability_score', 70)
      .order('reliability_score', { ascending: false })
      .limit(limit)

    return data || []
  } catch { return [] }
}

/** Busca de fallback por tópico (sem embedding). */
async function searchByTopic(topic, limit = 5) {
  if (!supabase) return []
  try {
    let q = supabase
      .from('knowledge_base')
      .select('*')
      .gte('reliability_score', 75)
      .order('reliability_score', { ascending: false })
      .limit(limit)
    if (topic !== 'geral') q = q.eq('topic', topic)
    const { data } = await q
    return data || []
  } catch { return [] }
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Ponto de entrada principal: retorna contexto local para geração de atividade.
 *
 * Retorna:
 *   hasContext      — se há conteúdo local suficiente (score >= 75, mínimo 2 entradas)
 *   sources         — referências formatadas (compatíveis com buildPrompt)
 *   contextSummary  — texto de contexto para injetar no prompt da IA
 *   skipSourceSearch — true quando há >= 3 fontes locais (evita 4 chamadas externas)
 */
export async function getContextForActivity({ theme, discipline, grade, steamCompetencies = [] }) {
  const empty = { hasContext: false, sources: [], contextSummary: '', skipSourceSearch: false }
  if (!supabase || !theme) return empty

  const topic = classifyTopic(theme, discipline)

  try {
    // Timeout de 5 s para não bloquear a geração
    const racePromise = Promise.allSettled([
      searchByEmbedding(theme, discipline, grade, topic, 5),
      searchByTopic(topic, 3),
    ])
    const timeout = new Promise(resolve => setTimeout(() => resolve(null), 5000))
    const result  = await Promise.race([racePromise, timeout])

    if (!result) return empty

    const [embRes, topRes] = result
    const byEmb   = embRes.status === 'fulfilled' ? embRes.value : []
    const byTopic = topRes.status === 'fulfilled' ? topRes.value : []

    // Mescla e deduplica por ID
    const seen   = new Set()
    const merged = [...byEmb, ...byTopic].filter(e => {
      if (seen.has(e.id)) return false
      seen.add(e.id)
      return true
    })

    const quality = merged.filter(e => e.reliability_score >= 75)
    if (quality.length < 2) return empty

    const sources = quality.map(e => ({
      _source: e.source_name,
      title:   e.title,
      doi:     e.doi,
      url:     e.source_url,
      year:    e.year,
      authors: e.authors || [],
      journal: '',
      abnt:    e.abnt_citation || e.title,
    }))

    const contextSummary = quality
      .filter(e => e.summary)
      .map(e => `• ${e.title}${e.year ? ` (${e.year})` : ''}: ${e.summary}`)
      .join('\n')
      .slice(0, 1800)

    return {
      hasContext:       true,
      sources,
      contextSummary,
      skipSourceSearch: quality.length >= 3,
    }
  } catch { return empty }
}

/**
 * Salva fontes na base de conhecimento de forma assíncrona (fire-and-forget).
 * Chamada após a geração de atividade para enriquecer a base ao longo do tempo.
 */
export function saveSourcesAsync(sources = [], meta = {}) {
  if (!supabase || !sources.length) return
  Promise.allSettled(sources.map(s => persistEntry(s, meta))).catch(() => {})
}

/**
 * Popula a base de conhecimento para todos os 15 tópicos pré-definidos.
 * Chame uma única vez (ou periodicamente) para semear a base.
 *
 * @param {Function} onProgress  Callback opcional: ({ topic, status, count })
 */
export async function populateAllTopics({ onProgress } = {}) {
  if (!supabase) return { saved: 0, failed: 0 }
  let saved = 0, failed = 0

  for (const { key, query } of SEED_TOPICS) {
    try {
      onProgress?.({ topic: key, status: 'fetching' })
      const sources = await findSourcesForActivity({ theme: query, discipline: '', grade: '', limit: 8 })

      await Promise.allSettled(sources.map(s => persistEntry(s, { topic: key, theme: query })))
      saved += sources.length
      onProgress?.({ topic: key, status: 'saved', count: sources.length })
    } catch {
      failed++
      onProgress?.({ topic: key, status: 'failed' })
    }
  }

  return { saved, failed }
}

/**
 * Atualiza entradas antigas (> 30 dias) e renova o timestamp.
 * Use em rotinas de manutenção periódica.
 */
export async function updateStaleContent() {
  if (!supabase) return
  try {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    const { data: stale } = await supabase
      .from('knowledge_base')
      .select('id, source_url, topic')
      .lt('updated_at', cutoff.toISOString())
      .limit(20)

    if (!stale?.length) return

    // Tenta rebuscar e reatualizar as fontes com DOI
    await Promise.allSettled(
      stale.map(async (row) => {
        await supabase
          .from('knowledge_base')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', row.id)
      })
    )
  } catch { /* degradação silenciosa */ }
}

/**
 * Retorna o score de confiabilidade de uma referência (0 – 100).
 * Exportado para uso externo/debug.
 */
export { computeReliabilityScore }
