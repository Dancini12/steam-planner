import { useMemo, useState } from "react";
import {
  bnccAreas,
  bnccComponentes,
  searchBnccHabilidades
} from "../data/bncc.js";

const anos = ["6º ano", "7º ano", "8º ano", "9º ano"];

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export default function BNCC({ onBack }) {
  const [ano, setAno] = useState("");
  const [componente, setComponente] = useState("");
  const [area, setArea] = useState("");
  const [termo, setTermo] = useState("");
  const [culturaMaker, setCulturaMaker] = useState(false);

  const componentes = useMemo(() => {
    return bnccComponentes.filter((item) => {
      const matchesArea = !area || item.area === area;
      const matchesAno = !ano || item.anos.includes(ano);
      return matchesArea && matchesAno;
    });
  }, [ano, area]);

  const resultados = useMemo(() => {
    return searchBnccHabilidades({ ano, componente, area, termo, culturaMaker });
  }, [ano, componente, area, termo, culturaMaker]);

  const unidades = unique(resultados.map((item) => item.unidade_tematica));

  return (
    <div style={pageStyle}>
      <style>{bnccCss}</style>
      <div style={scanlineStyle} />
      <main style={shellStyle}>
        <header style={headerStyle}>
          <button type="button" style={backButtonStyle} onClick={onBack}>
            VOLTAR
          </button>
          <div>
            <p style={kickerStyle}>Consulta offline</p>
            <h1 style={titleStyle}>BNCC</h1>
            <p style={subtitleStyle}>
              Habilidades dos Anos Finais disponíveis no aplicativo para apoiar a geração de atividades.
            </p>
          </div>
          <div style={badgeStyle}>{resultados.length} resultado(s)</div>
        </header>

        <section style={noticeStyle}>
          A base completa deve ser importada depois a partir da planilha revisada com base no documento
          oficial da BNCC/MEC. Esta consulta offline já usa a mesma estrutura preparada no Supabase.
        </section>

        <section style={filtersStyle} aria-label="Filtros da BNCC">
          <label style={fieldStyle}>
            <span>Série</span>
            <select value={ano} onChange={(event) => setAno(event.target.value)}>
              <option value="">Todas</option>
              {anos.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label style={fieldStyle}>
            <span>Área</span>
            <select
              value={area}
              onChange={(event) => {
                setArea(event.target.value);
                setComponente("");
              }}
            >
              <option value="">Todas</option>
              {bnccAreas.map((item) => (
                <option key={item.nome} value={item.nome}>{item.nome}</option>
              ))}
            </select>
          </label>

          <label style={fieldStyle}>
            <span>Disciplina</span>
            <select value={componente} onChange={(event) => setComponente(event.target.value)}>
              <option value="">Todas</option>
              {componentes.map((item) => (
                <option key={item.nome} value={item.nome}>{item.nome}</option>
              ))}
            </select>
          </label>

          <label style={fieldStyle}>
            <span>Tema da atividade</span>
            <input
              value={termo}
              onChange={(event) => setTermo(event.target.value)}
              placeholder="Ex.: energia, circuitos, sustentabilidade"
            />
          </label>

          <label style={toggleStyle}>
            <input
              type="checkbox"
              checked={culturaMaker}
              onChange={(event) => setCulturaMaker(event.target.checked)}
            />
            <span>Somente Cultura Maker</span>
          </label>
        </section>

        {unidades.length > 0 && (
          <section className="bncc-chip-row" style={chipsStyle} aria-label="Unidades temáticas encontradas">
            {unidades.map((unidade) => (
              <span key={unidade}>{unidade}</span>
            ))}
          </section>
        )}

        <section style={resultsStyle} aria-label="Habilidades BNCC">
          {resultados.length === 0 ? (
            <div style={emptyStyle}>
              Nenhuma habilidade encontrada nos dados offline atuais. Ajuste os filtros ou importe a
              planilha completa no Supabase.
            </div>
          ) : (
            resultados.map((habilidade) => (
              <article key={habilidade.codigo} style={cardStyle}>
                <div style={cardTopStyle}>
                  <strong style={codeStyle}>{habilidade.codigo}</strong>
                  <span style={yearStyle}>{habilidade.ano}</span>
                </div>
                <h2 style={cardTitleStyle}>{habilidade.componente}</h2>
                <p style={descriptionStyle}>{habilidade.descricao}</p>

                <div style={metaGridStyle}>
                  <div>
                    <span style={metaLabelStyle}>Área</span>
                    <strong>{habilidade.area}</strong>
                  </div>
                  <div>
                    <span style={metaLabelStyle}>Unidade temática</span>
                    <strong>{habilidade.unidade_tematica}</strong>
                  </div>
                  <div>
                    <span style={metaLabelStyle}>Objeto de conhecimento</span>
                    <strong>{habilidade.objeto_conhecimento}</strong>
                  </div>
                </div>

                <div className="bncc-tag-row" style={tagRowStyle}>
                  {habilidade.steam_relacionado.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                  {habilidade.cultura_maker && <span>Cultura Maker</span>}
                </div>

                {(habilidade.fonte_url || habilidade.observacoes) && (
                  <div style={sourceStyle}>
                    {habilidade.fonte_url && (
                      <a href={habilidade.fonte_url} target="_blank" rel="noreferrer">
                        Fonte BNCC/MEC
                      </a>
                    )}
                    {habilidade.observacoes && <span>{habilidade.observacoes}</span>}
                  </div>
                )}
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 15% 8%, rgba(34, 211, 238, 0.2), transparent 22rem), linear-gradient(180deg, #050816, #020617)",
  color: "#F8FAFC",
  fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
  position: "relative",
  overflow: "hidden"
};

const scanlineStyle = {
  position: "fixed",
  inset: 0,
  pointerEvents: "none",
  background:
    "repeating-linear-gradient(to bottom, rgba(255,255,255,0.05) 0, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 4px)",
  opacity: 0.32
};

const shellStyle = {
  position: "relative",
  zIndex: 1,
  width: "min(1120px, calc(100% - 28px))",
  margin: "0 auto",
  padding: "32px 0 48px"
};

const headerStyle = {
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr) auto",
  gap: "18px",
  alignItems: "center",
  marginBottom: "22px"
};

const backButtonStyle = {
  border: "2px solid #22D3EE",
  borderRadius: "10px",
  background: "#020617",
  color: "#67E8F9",
  padding: "0.75rem 1rem",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 0 18px rgba(34, 211, 238, 0.35)"
};

const kickerStyle = {
  margin: 0,
  color: "#39FF88",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontSize: "0.78rem"
};

const titleStyle = {
  margin: "0.2rem 0",
  color: "#FDE047",
  fontSize: "clamp(2.2rem, 7vw, 4.2rem)",
  lineHeight: 1,
  textShadow: "4px 0 #22D3EE, -4px 0 #FF4FD8, 0 0 22px rgba(253,224,71,0.6)"
};

const subtitleStyle = {
  margin: 0,
  color: "#CBD5E1",
  maxWidth: "720px",
  lineHeight: 1.6,
  fontWeight: 700
};

const badgeStyle = {
  border: "2px solid #FDE047",
  borderRadius: "12px",
  padding: "0.75rem 1rem",
  color: "#FDE047",
  background: "rgba(2, 6, 23, 0.82)",
  fontWeight: 900,
  whiteSpace: "nowrap"
};

const noticeStyle = {
  padding: "1rem",
  border: "1px solid rgba(253, 224, 71, 0.32)",
  borderRadius: "14px",
  background: "rgba(253, 224, 71, 0.08)",
  color: "#FEF3C7",
  lineHeight: 1.6,
  fontWeight: 700,
  marginBottom: "18px"
};

const filtersStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "12px",
  padding: "16px",
  border: "2px solid rgba(34, 211, 238, 0.55)",
  borderRadius: "18px",
  background: "rgba(15, 23, 42, 0.86)",
  boxShadow: "0 0 28px rgba(34, 211, 238, 0.16)",
  marginBottom: "16px"
};

const fieldStyle = {
  display: "grid",
  gap: "0.45rem",
  color: "#E2E8F0",
  fontWeight: 900,
  fontSize: "0.82rem"
};

const toggleStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.55rem",
  color: "#E2E8F0",
  fontWeight: 900,
  fontSize: "0.86rem"
};

const chipsStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginBottom: "16px"
};

const resultsStyle = {
  display: "grid",
  gap: "14px"
};

const cardStyle = {
  padding: "18px",
  border: "2px solid rgba(255, 79, 216, 0.48)",
  borderRadius: "18px",
  background: "rgba(2, 6, 23, 0.84)",
  boxShadow: "0 0 24px rgba(255, 79, 216, 0.14)"
};

const cardTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "1rem",
  alignItems: "center",
  flexWrap: "wrap"
};

const codeStyle = {
  color: "#39FF88",
  fontSize: "1.1rem"
};

const yearStyle = {
  color: "#020617",
  background: "#FDE047",
  borderRadius: "999px",
  padding: "0.3rem 0.65rem",
  fontWeight: 900
};

const cardTitleStyle = {
  margin: "0.65rem 0 0",
  color: "#FFFFFF",
  fontSize: "1.15rem"
};

const descriptionStyle = {
  color: "#CBD5E1",
  lineHeight: 1.7,
  fontWeight: 700
};

const metaGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "10px",
  marginTop: "14px"
};

const metaLabelStyle = {
  display: "block",
  color: "#94A3B8",
  fontSize: "0.74rem",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: "0.25rem"
};

const tagRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginTop: "14px"
};

const sourceStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.75rem",
  marginTop: "14px",
  paddingTop: "12px",
  borderTop: "1px solid rgba(148, 163, 184, 0.18)",
  color: "#94A3B8",
  fontSize: "0.82rem",
  fontWeight: 800
};

const emptyStyle = {
  padding: "2rem",
  border: "2px dashed rgba(148, 163, 184, 0.35)",
  borderRadius: "18px",
  color: "#CBD5E1",
  textAlign: "center",
  fontWeight: 800
};

const bnccCss = `
  select, input {
    width: 100%;
    min-height: 42px;
    border: 1px solid rgba(148, 163, 184, 0.28);
    border-radius: 10px;
    background: #020617;
    color: #F8FAFC;
    padding: 0 0.75rem;
    font: inherit;
    outline: none;
  }

  input[type="checkbox"] {
    width: 18px;
    min-height: 18px;
    accent-color: #39FF88;
  }

  a {
    color: #67E8F9;
    font-weight: 900;
    text-decoration: none;
  }

  .bncc-chip-row span,
  .bncc-tag-row span {
    border: 1px solid rgba(34, 211, 238, 0.35);
    border-radius: 999px;
    padding: 0.32rem 0.58rem;
    color: #A5F3FC;
    background: rgba(34, 211, 238, 0.08);
    font-size: 0.78rem;
    font-weight: 900;
  }

  @media (max-width: 900px) {
    main > header,
    section[aria-label="Filtros da BNCC"] {
      grid-template-columns: 1fr !important;
    }

    article > div:nth-of-type(2) {
      grid-template-columns: 1fr !important;
    }
  }
`;
