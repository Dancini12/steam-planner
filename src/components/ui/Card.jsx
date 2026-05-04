// ============================================================
// Card.jsx
// Cartão com fundo escuro e borda sutil
// ============================================================
//
// Componente visual base para agrupar conteúdo. Usado em
// listagem de projetos, biblioteca, fases, etc.
//
// Variantes:
// - default  : cartão estático
// - clickable: cartão com hover e cursor pointer (clicável)
// ============================================================

export default function Card({
  variant = "default",
  onClick,
  accentColor,
  padding = "1.25rem",
  children,
  ...rest
}) {
  const isClickable = variant === "clickable";

  const baseStyle = {
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: "10px",
    padding: padding,
    cursor: isClickable ? "pointer" : "default",
    transition: "all 0.15s ease",
    position: "relative",
    overflow: "hidden"
  };

  // Borda lateral colorida (opcional)
  if (accentColor) {
    baseStyle.borderLeft = `3px solid ${accentColor}`;
  }

  // Hover só em cards clicáveis
  const handleMouseEnter = (e) => {
    if (isClickable) {
      e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
    }
  };

  const handleMouseLeave = (e) => {
    if (isClickable) {
      e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)";
    }
  };

  return (
    <div
      style={baseStyle}
      onClick={isClickable ? onClick : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...rest}
    >
      {children}
    </div>
  );
}
