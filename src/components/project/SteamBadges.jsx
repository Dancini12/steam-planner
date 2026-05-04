// ============================================================
// SteamBadges.jsx
// Selos visuais das áreas STEAM contempladas no projeto
// ============================================================
//
// Mostra letras coloridas (S, T, E, A, M) representando as
// áreas STEAM que o projeto contempla. Cada letra usa a cor
// definida em data/steamAreas.js.
//
// Tamanhos: small (em listagens), medium (em cabeçalhos),
// large (em destaque). Pode mostrar apenas a letra ou a
// letra com nome ao lado.
// ============================================================

import { STEAM_AREAS } from "../../data/steamAreas.js";

export default function SteamBadges({
  areas = [],
  size = "medium",
  showName = false
}) {
  // Tamanhos disponíveis
  const sizes = {
    small: { width: "1.5rem", height: "1.5rem", fontSize: "0.75rem" },
    medium: { width: "2rem", height: "2rem", fontSize: "0.9rem" },
    large: { width: "2.5rem", height: "2.5rem", fontSize: "1rem" }
  };

  const sizeStyle = sizes[size] || sizes.medium;

  const containerStyle = {
    display: "flex",
    gap: "0.4rem",
    flexWrap: "wrap",
    alignItems: "center"
  };

  const badgeStyle = (color) => ({
    ...sizeStyle,
    background: color,
    color: "#0F0F2D",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    flexShrink: 0,
    boxShadow: `0 0 8px ${color}40`
  });

  const wrapperStyle = {
    display: "flex",
    flexDirection: showName ? "column" : "row",
    alignItems: "center",
    gap: showName ? "0.25rem" : 0
  };

  const nameStyle = {
    fontSize: "0.7rem",
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: 500
  };

  return (
    <div style={containerStyle}>
      {areas.map((letter) => {
        const area = STEAM_AREAS[letter];
        if (!area) return null;
        return (
          <div key={letter} style={wrapperStyle}>
            <div style={badgeStyle(area.color)} title={area.name}>
              {letter}
            </div>
            {showName && <span style={nameStyle}>{area.name}</span>}
          </div>
        );
      })}
    </div>
  );
}
