// ============================================================
// PhaseHeader.jsx
// Cabeçalho didático apresentado em cada fase
// ============================================================
//
// Quando o professor abre uma fase específica, este cabeçalho
// é a primeira coisa que ele vê. Funciona como lembrete
// pedagógico permanente: o que essa fase significa, quais
// ações esperar dos estudantes e do professor, e qual o
// foco avaliativo desta etapa.
//
// É um recurso de apoio ao professor — o app ensina ao
// usar, transformando cada fase numa pequena formação
// continuada incorporada na ferramenta.
// ============================================================

export default function PhaseHeader({ phase }) {
  if (!phase) return null;

  // ----------------------------------------------------------
  // ESTILOS
  // ----------------------------------------------------------

  const containerStyle = {
    background: "rgba(255, 255, 255, 0.03)",
    borderLeft: `4px solid ${phase.color}`,
    borderRadius: "8px",
    padding: "1.5rem",
    marginBottom: "2.5rem"
  };

  const phaseLabelStyle = {
    fontSize: "0.75rem",
    color: phase.color,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "0.25rem"
  };

  const titleStyle = {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#FFFFFF",
    margin: 0
  };

  const subtitleStyle = {
    fontSize: "1rem",
    color: "rgba(255, 255, 255, 0.6)",
    margin: "0.25rem 0 1rem",
    fontStyle: "italic"
  };

  const descriptionStyle = {
    fontSize: "0.95rem",
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: 1.6,
    marginBottom: "1.5rem"
  };

  const columnsStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1.5rem",
    marginBottom: "1.5rem"
  };

  const columnStyle = {
    background: "rgba(0, 0, 0, 0.15)",
    borderRadius: "8px",
    padding: "1rem"
  };

  const columnTitleStyle = {
    fontSize: "0.75rem",
    color: phase.color,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "0.75rem"
  };

  const listStyle = {
    margin: 0,
    paddingLeft: "1.25rem",
    fontSize: "0.85rem",
    color: "rgba(255, 255, 255, 0.75)",
    lineHeight: 1.6
  };

  const focusBoxStyle = {
    background: `${phase.color}10`,
    border: `1px solid ${phase.color}30`,
    borderRadius: "8px",
    padding: "1rem"
  };

  const focusLabelStyle = {
    fontSize: "0.75rem",
    color: phase.color,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "0.5rem"
  };

  const focusTextStyle = {
    fontSize: "0.9rem",
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 1.5,
    margin: 0
  };

  // ----------------------------------------------------------
  // RENDERIZAÇÃO
  // ----------------------------------------------------------

  return (
    <div style={containerStyle}>
      <div style={phaseLabelStyle}>Fase {phase.number}</div>
      <h1 style={titleStyle}>{phase.name}</h1>
      <p style={subtitleStyle}>{phase.subtitle}</p>

      <p style={descriptionStyle}>{phase.description}</p>

      <div style={columnsStyle}>
        <div style={columnStyle}>
          <div style={columnTitleStyle}>Ações dos Estudantes</div>
          <ul style={listStyle}>
            {phase.studentActions.map((action, index) => (
              <li key={index}>{action}</li>
            ))}
          </ul>
        </div>

        <div style={columnStyle}>
          <div style={columnTitleStyle}>Ações do Professor</div>
          <ul style={listStyle}>
            {phase.teacherActions.map((action, index) => (
              <li key={index}>{action}</li>
            ))}
          </ul>
        </div>
      </div>

      <div style={focusBoxStyle}>
        <div style={focusLabelStyle}>Foco avaliativo desta fase</div>
        <p style={focusTextStyle}>{phase.evaluationFocus}</p>
      </div>
    </div>
  );
}
