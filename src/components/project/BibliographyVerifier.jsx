import { useState } from 'react'
import { verifyBibliography } from '../../lib/bibliographyVerifier.js'

const STATUS_META = {
  real:      { label: 'Verificada',    color: '#10B981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)',  icon: '✓' },
  doubtful:  { label: 'Verificar',     color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  icon: '?' },
  fabricated:{ label: 'Possivelmente fabricada', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', icon: '✕' }
}

export default function BibliographyVerifier({ references = [] }) {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const refs = references.filter(Boolean)

  if (!refs.length) return null

  const handleVerify = async () => {
    setLoading(true)
    setError('')
    setResults(null)
    try {
      const data = await verifyBibliography(refs)
      setResults(data)
    } catch (err) {
      setError(err.message || 'Erro ao verificar referências.')
    } finally {
      setLoading(false)
    }
  }

  const counts = results
    ? {
        real: results.filter((r) => r.status === 'real').length,
        doubtful: results.filter((r) => r.status === 'doubtful').length,
        fabricated: results.filter((r) => r.status === 'fabricated').length
      }
    : null

  return (
    <div style={s.wrapper}>
      <div style={s.header}>
        <div>
          <div style={s.label}>Verificação de fontes</div>
          <div style={s.sublabel}>
            A IA analisa se as referências são reais ou possíveis alucinações.
          </div>
        </div>
        <button
          style={{ ...s.btn, opacity: loading ? 0.6 : 1 }}
          onClick={handleVerify}
          disabled={loading}
        >
          {loading ? 'Verificando…' : results ? 'Reverificar' : 'Verificar fontes'}
        </button>
      </div>

      {error && <div style={s.errorBox}>{error}</div>}

      {results && (
        <>
          <div style={s.summary}>
            {counts.real > 0 && (
              <span style={{ ...s.chip, color: STATUS_META.real.color, background: STATUS_META.real.bg, border: `1px solid ${STATUS_META.real.border}` }}>
                ✓ {counts.real} verificada{counts.real > 1 ? 's' : ''}
              </span>
            )}
            {counts.doubtful > 0 && (
              <span style={{ ...s.chip, color: STATUS_META.doubtful.color, background: STATUS_META.doubtful.bg, border: `1px solid ${STATUS_META.doubtful.border}` }}>
                ? {counts.doubtful} a verificar
              </span>
            )}
            {counts.fabricated > 0 && (
              <span style={{ ...s.chip, color: STATUS_META.fabricated.color, background: STATUS_META.fabricated.bg, border: `1px solid ${STATUS_META.fabricated.border}` }}>
                ✕ {counts.fabricated} possivelmente fabricada{counts.fabricated > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div style={s.list}>
            {results.map((item, i) => {
              const meta = STATUS_META[item.status] || STATUS_META.doubtful
              return (
                <div key={i} style={{ ...s.item, borderLeft: `3px solid ${meta.color}`, background: meta.bg, border: `1px solid ${meta.border}`, borderLeft: `3px solid ${meta.color}` }}>
                  <div style={s.itemTop}>
                    <span style={{ ...s.statusBadge, color: meta.color }}>{meta.icon} {meta.label}</span>
                    <span style={s.confidence}>{Math.round(item.confidence * 100)}% confiança</span>
                  </div>
                  <div style={s.refText}>{item.ref}</div>
                  {item.note && <div style={s.note}>{item.note}</div>}
                </div>
              )
            })}
          </div>

          {counts.fabricated > 0 && (
            <div style={s.warningBox}>
              Substitua as referências marcadas como fabricadas por fontes verificadas antes de usar com alunos ou entregar documentos.
            </div>
          )}
        </>
      )}
    </div>
  )
}

const s = {
  wrapper: { marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', padding: '0.9rem 1rem', background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: '8px' },
  label: { fontSize: '0.78rem', fontWeight: 700, color: '#818CF8', marginBottom: '0.2rem' },
  sublabel: { fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 },
  btn: { flexShrink: 0, padding: '0.45rem 1rem', background: 'rgba(79,70,229,0.2)', border: '1px solid rgba(79,70,229,0.4)', borderRadius: '6px', color: '#818CF8', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s' },
  errorBox: { padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', color: '#FCA5A5', fontSize: '0.85rem' },
  summary: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem' },
  chip: { display: 'inline-block', padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 },
  list: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  item: { padding: '0.75rem 1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  itemTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' },
  statusBadge: { fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' },
  confidence: { fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' },
  refText: { fontSize: '0.83rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.55 },
  note: { fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, fontStyle: 'italic' },
  warningBox: { padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#FCA5A5', fontSize: '0.81rem', lineHeight: 1.5 }
}
