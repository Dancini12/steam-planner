// ============================================================
// TextField.jsx
// Campo de texto com label, dica e suporte a textarea
// ============================================================
//
// Componente único que substitui input e textarea simples,
// trazendo:
// - Label acima do campo
// - Asterisco para campos obrigatórios
// - Texto de dica (hint) opcional abaixo
// - Suporte a multiline (textarea)
// - Estilo coerente com a identidade dark do app
// ============================================================

export default function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  required = false,
  multiline = false,
  rows = 4,
  type = "text",
  variant = "dark",
  ...rest
}) {
  // ----------------------------------------------------------
  // ESTILOS
  // ----------------------------------------------------------

  const isLight = variant === "light";

  const wrapperStyle = {
    marginBottom: "1.25rem"
  };

  const labelStyle = {
    display: "block",
    fontSize: "0.85rem",
    color: isLight ? "#374151" : "rgba(255, 255, 255, 0.7)",
    fontWeight: 500,
    marginBottom: "0.4rem"
  };

  const requiredAsteriskStyle = {
    color: "#E8358A",
    marginLeft: "0.25rem"
  };

  const fieldStyle = {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    background: isLight ? "#FFFFFF" : "rgba(255, 255, 255, 0.04)",
    border: isLight ? "1px solid #D1D5DB" : "1px solid rgba(255, 255, 255, 0.08)",
    color: isLight ? "#111827" : "#FFFFFF",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    outline: "none",
    transition: "all 0.15s ease",
    resize: multiline ? "vertical" : "none",
    boxSizing: "border-box"
  };

  const hintStyle = {
    fontSize: "0.75rem",
    color: isLight ? "#6B7280" : "rgba(255, 255, 255, 0.4)",
    marginTop: "0.4rem",
    lineHeight: 1.4
  };

  // Hover/foco discretos
  const handleFocus = (e) => {
    e.target.style.borderColor = isLight ? "#3B82F6" : "rgba(107, 47, 224, 0.5)";
    e.target.style.background = isLight ? "#FFFFFF" : "rgba(255, 255, 255, 0.06)";
  };

  const handleBlur = (e) => {
    e.target.style.borderColor = isLight ? "#D1D5DB" : "rgba(255, 255, 255, 0.08)";
    e.target.style.background = isLight ? "#FFFFFF" : "rgba(255, 255, 255, 0.04)";
  };

  // Compatibiliza onChange recebendo função simples (string)
  const handleChange = (e) => {
    if (typeof onChange === "function") {
      onChange(e.target.value);
    }
  };

  // ----------------------------------------------------------
  // RENDERIZAÇÃO
  // ----------------------------------------------------------

  return (
    <div style={wrapperStyle}>
      {label && (
        <label style={labelStyle}>
          {label}
          {required && <span style={requiredAsteriskStyle}>*</span>}
        </label>
      )}

      {multiline ? (
        <textarea
          style={fieldStyle}
          value={value || ""}
          onChange={handleChange}
          placeholder={placeholder}
          rows={rows}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
      ) : (
        <input
          type={type}
          style={fieldStyle}
          value={value || ""}
          onChange={handleChange}
          placeholder={placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
      )}

      {hint && <div style={hintStyle}>{hint}</div>}
    </div>
  );
}
