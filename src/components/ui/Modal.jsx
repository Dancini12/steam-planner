// ============================================================
// Modal.jsx
// Janela flutuante para confirmações e diálogos
// ============================================================
//
// Modal genérico com overlay escuro de fundo, fechamento por
// ESC ou clique fora, e título customizável. Usado para:
// - Confirmações de exclusão
// - Detalhes de projetos da biblioteca
// - Geração de projetos via IA
// ============================================================

import { useEffect } from "react";

export default function Modal({
  isOpen,
  onClose,
  title,
  maxWidth = "500px",
  children
}) {
  // Fecha ao apertar ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Bloqueia scroll do body quando aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ----------------------------------------------------------
  // ESTILOS
  // ----------------------------------------------------------

  const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.7)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "1rem"
  };

  const modalStyle = {
    background: "#1A1A3E",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "12px",
    width: "100%",
    maxWidth: maxWidth,
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
    animation: "modalIn 0.2s ease-out"
  };

  const headerStyle = {
    padding: "1.25rem 1.5rem",
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  };

  const titleStyle = {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "#FFFFFF",
    margin: 0
  };

  const closeButtonStyle = {
    background: "transparent",
    border: "none",
    color: "rgba(255, 255, 255, 0.5)",
    cursor: "pointer",
    fontSize: "1.5rem",
    padding: 0,
    lineHeight: 1,
    fontFamily: "inherit"
  };

  const bodyStyle = {
    padding: "1.5rem"
  };

  // ----------------------------------------------------------
  // RENDERIZAÇÃO
  // ----------------------------------------------------------

  // Fecha ao clicar no overlay (mas não no modal em si)
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div style={overlayStyle} onClick={handleOverlayClick}>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div style={modalStyle}>
        {title && (
          <div style={headerStyle}>
            <h2 style={titleStyle}>{title}</h2>
            <button
              style={closeButtonStyle}
              onClick={onClose}
              aria-label="Fechar"
            >
              ×
            </button>
          </div>
        )}
        <div style={bodyStyle}>{children}</div>
      </div>
    </div>
  );
}
