// ============================================================
// DiaryEntry.jsx
// Cartão que mostra um registro do diário de bordo
// ============================================================
//
// O diário de bordo é o instrumento de registro contínuo do
// processo. Cada entrada tem data automática (gerada quando
// criada) e o texto livre escrito pelo professor.
//
// Este componente apresenta uma entrada já existente, com
// botão para excluí-la (caso tenha sido criada por engano).
// ============================================================

import { useState } from "react";

function toDateInputValue(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

// Formata a data para exibição em português
function formatDate(isoString) {
  try {
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(isoString);
    const date = isDateOnly
      ? new Date(`${isoString}T12:00:00`)
      : new Date(isoString);

    const options = {
      day: "2-digit",
      month: "long",
      year: "numeric"
    };

    if (!isDateOnly) {
      options.hour = "2-digit";
      options.minute = "2-digit";
    }

    return date.toLocaleDateString("pt-BR", options);
  } catch {
    return "";
  }
}

export default function DiaryEntry({ entry, onDelete, onEdit }) {
  if (!entry) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [draftDate, setDraftDate] = useState(toDateInputValue(entry.date));
  const [draftText, setDraftText] = useState(entry.text || "");

  const handleStartEdit = () => {
    setDraftDate(toDateInputValue(entry.date));
    setDraftText(entry.text || "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setDraftDate(toDateInputValue(entry.date));
    setDraftText(entry.text || "");
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    const text = draftText.trim();
    if (!text) return;
    onEdit?.(entry.id, {
      date: draftDate,
      text
    });
    setIsEditing(false);
  };

  // ----------------------------------------------------------
  // ESTILOS
  // ----------------------------------------------------------

  const containerStyle = {
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: "8px",
    padding: "1rem 1.25rem",
    position: "relative"
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.75rem"
  };

  const dateStyle = {
    fontSize: "0.75rem",
    color: "rgba(255, 255, 255, 0.4)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontWeight: 600
  };

  const headerActionsStyle = {
    display: "flex",
    gap: "0.35rem",
    alignItems: "center"
  };

  const actionButtonStyle = (color = "rgba(255, 255, 255, 0.3)") => ({
    background: "transparent",
    border: "none",
    color,
    cursor: "pointer",
    fontSize: "0.8rem",
    padding: "0.25rem 0.5rem",
    fontFamily: "inherit",
    transition: "color 0.15s ease"
  });

  const textStyle = {
    fontSize: "0.95rem",
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: 1.6,
    margin: 0,
    whiteSpace: "pre-wrap"
  };

  const editGridStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem"
  };

  const dateInputStyle = {
    width: "160px",
    padding: "0.65rem",
    borderRadius: "6px",
    background: "rgba(0, 0, 0, 0.2)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    color: "#FFFFFF",
    fontSize: "0.92rem",
    fontWeight: 700,
    colorScheme: "dark",
    WebkitTextFillColor: "#FFFFFF",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box"
  };

  const textareaStyle = {
    width: "100%",
    minHeight: "90px",
    padding: "0.75rem",
    borderRadius: "6px",
    background: "rgba(0, 0, 0, 0.2)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    color: "#FFFFFF",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box"
  };

  const editActionsStyle = {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.5rem"
  };

  // ----------------------------------------------------------
  // RENDERIZAÇÃO
  // ----------------------------------------------------------

  const handleDelete = () => {
    if (confirm("Excluir este registro? Esta ação não pode ser desfeita.")) {
      onDelete?.(entry.id);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={dateStyle}>{formatDate(entry.date)}</div>
        <div style={headerActionsStyle}>
          {onEdit && !isEditing && (
            <button style={actionButtonStyle()} onClick={handleStartEdit}>
              Editar
            </button>
          )}
          {onDelete && !isEditing && (
            <button
              style={actionButtonStyle("rgba(255, 255, 255, 0.3)")}
              onClick={handleDelete}
              onMouseEnter={(e) => (e.target.style.color = "#E8358A")}
              onMouseLeave={(e) => (e.target.style.color = "rgba(255, 255, 255, 0.3)")}
            >
              Excluir
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div style={editGridStyle}>
          <input
            type="date"
            style={dateInputStyle}
            value={draftDate}
            onChange={(e) => setDraftDate(e.target.value)}
          />
          <textarea
            style={textareaStyle}
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
          />
          <div style={editActionsStyle}>
            <button style={actionButtonStyle()} onClick={handleCancelEdit}>
              Cancelar
            </button>
            <button
              style={actionButtonStyle("#3FD64C")}
              onClick={handleSaveEdit}
              disabled={draftText.trim().length === 0}
            >
              Salvar
            </button>
          </div>
        </div>
      ) : (
        <p style={textStyle}>{entry.text}</p>
      )}
    </div>
  );
}
