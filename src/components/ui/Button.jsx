// ============================================================
// Button.jsx
// Botão padronizado reutilizável em todo o app
// ============================================================
//
// Centralizar o componente Button num único arquivo significa
// que toda mudança de estilo (cor, tamanho, raio de borda)
// acontece apenas aqui. Isso garante consistência visual em
// todas as telas e facilita ajustes futuros.
//
// Variantes disponíveis:
// - primary  : ação principal (roxo neon, destacado)
// - secondary: ação secundária (contorno sutil)
// - ghost    : ação discreta (sem fundo)
// - danger   : ações destrutivas como excluir
// ============================================================

// ------------------------------------------------------------
// MAPA DE ESTILOS POR VARIANTE
// ------------------------------------------------------------
// Cada variante define cores de fundo, texto e hover.
// Centralizar isso aqui evita repetição nos componentes filhos.
// ------------------------------------------------------------

const VARIANT_STYLES = {
  primary: {
    background: "#6B2FE0",
    color: "#FFFFFF",
    hoverBackground: "#7E45F0",
    border: "none"
  },
  secondary: {
    background: "transparent",
    color: "#FFFFFF",
    hoverBackground: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.2)"
  },
  ghost: {
    background: "transparent",
    color: "#B8B8C8",
    hoverBackground: "rgba(255, 255, 255, 0.05)",
    border: "none"
  },
  danger: {
    background: "transparent",
    color: "#E8358A",
    hoverBackground: "rgba(232, 53, 138, 0.1)",
    border: "1px solid rgba(232, 53, 138, 0.3)"
  }
};

// ------------------------------------------------------------
// MAPA DE TAMANHOS
// ------------------------------------------------------------

const SIZE_STYLES = {
  small: { padding: "0.4rem 0.9rem", fontSize: "0.85rem" },
  medium: { padding: "0.6rem 1.2rem", fontSize: "0.95rem" },
  large: { padding: "0.85rem 1.6rem", fontSize: "1.05rem" }
};

// ------------------------------------------------------------
// COMPONENTE BUTTON
// ------------------------------------------------------------
// Propriedades:
// - variant : "primary" | "secondary" | "ghost" | "danger"
// - size    : "small" | "medium" | "large"
// - onClick : função executada ao clicar
// - disabled: desabilita o botão
// - children: conteúdo do botão (texto ou elemento)
// ------------------------------------------------------------

export default function Button({
  variant = "primary",
  size = "medium",
  onClick,
  disabled = false,
  children,
  ...rest
}) {
  const variantStyle = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;
  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.medium;

  const baseStyle = {
    ...variantStyle,
    ...sizeStyle,
    borderRadius: "8px",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 500,
    fontFamily: "inherit",
    transition: "all 0.15s ease",
    opacity: disabled ? 0.5 : 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    whiteSpace: "nowrap"
  };

  // Gerencia hover via estado local em CSS inline
  const handleMouseEnter = (e) => {
    if (!disabled) {
      e.currentTarget.style.background = variantStyle.hoverBackground;
    }
  };

  const handleMouseLeave = (e) => {
    if (!disabled) {
      e.currentTarget.style.background = variantStyle.background;
    }
  };

  return (
    <button
      style={baseStyle}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...rest}
    >
      {children}
    </button>
  );
}
