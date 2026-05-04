// ============================================================
// DiaryEntryForm.jsx
// Formulário para adicionar novo registro no diário de bordo
// ============================================================
//
// Posicionado logo acima da lista de registros existentes.
// O professor escreve o que aconteceu na aula, clica em
// "Gravar registro" e o registro aparece imediatamente na
// lista, com data e horário automáticos.
//
// Esse fluxo simples e rápido é proposital: queremos que o
// registro seja diário e leve, não burocrático.
// ============================================================

import { useState } from "react";
import Button from "../ui/Button.jsx";

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function createEmptyDraft() {
  return {
    id: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    date: getTodayInputValue(),
    text: ""
  };
}

export default function DiaryEntryForm({ onSubmit }) {
  const [drafts, setDrafts] = useState([createEmptyDraft()]);

  const handleSubmit = () => {
    const validEntries = drafts
      .map((draft) => ({
        date: draft.date,
        text: draft.text.trim()
      }))
      .filter((draft) => draft.text.length > 0);

    if (validEntries.length === 0) return;

    validEntries.forEach((entry) => {
      onSubmit?.(entry.text, entry.date);
    });

    setDrafts([createEmptyDraft()]);
  };

  const updateDraft = (id, updates) => {
    setDrafts((current) =>
      current.map((draft) =>
        draft.id === id ? { ...draft, ...updates } : draft
      )
    );
  };

  const addDraft = () => {
    setDrafts((current) => [...current, createEmptyDraft()]);
  };

  const removeDraft = (id) => {
    setDrafts((current) =>
      current.length === 1 ? current : current.filter((draft) => draft.id !== id)
    );
  };

  // ----------------------------------------------------------
  // ESTILOS
  // ----------------------------------------------------------

  const containerStyle = {
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "8px",
    padding: "1rem",
    marginBottom: "1.25rem"
  };

  const textareaStyle = {
    flex: "1 1 260px",
    minWidth: 0,
    padding: "0.75rem",
    borderRadius: "6px",
    background: "rgba(0, 0, 0, 0.2)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    color: "#FFFFFF",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    outline: "none",
    resize: "vertical",
    minHeight: "80px",
    boxSizing: "border-box",
    marginBottom: "0.75rem"
  };

  const rowStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
    alignItems: "flex-start",
    marginBottom: "0.75rem"
  };

  const dateInputStyle = {
    flex: "0 0 150px",
    padding: "0.72rem",
    borderRadius: "6px",
    background: "rgba(0, 0, 0, 0.2)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    color: "#FFFFFF",
    fontSize: "0.92rem",
    fontWeight: 700,
    colorScheme: "dark",
    WebkitTextFillColor: "#FFFFFF",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box"
  };

  const removeButtonStyle = {
    background: "transparent",
    border: "1px solid rgba(232, 53, 138, 0.25)",
    color: "#E8358A",
    width: "34px",
    height: "34px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    lineHeight: 1,
    marginTop: "0.15rem"
  };

  const actionsStyle = {
    display: "flex",
    justifyContent: "space-between",
    gap: "0.5rem"
  };

  const hasText = drafts.some((draft) => draft.text.trim().length > 0);

  // ----------------------------------------------------------
  // RENDERIZAÇÃO
  // ----------------------------------------------------------

  return (
    <div style={containerStyle}>
      {drafts.map((draft) => (
        <div key={draft.id} style={rowStyle}>
          <input
            type="date"
            style={dateInputStyle}
            value={draft.date}
            onChange={(e) => updateDraft(draft.id, { date: e.target.value })}
          />
          <textarea
            style={textareaStyle}
            value={draft.text}
            onChange={(e) => updateDraft(draft.id, { text: e.target.value })}
            placeholder="O que aconteceu neste dia? Avanços, dificuldades, observações..."
            rows={3}
          />
          <button
            type="button"
            style={removeButtonStyle}
            onClick={() => removeDraft(draft.id)}
            disabled={drafts.length === 1}
            title="Remover dia"
          >
            ×
          </button>
        </div>
      ))}
      <div style={actionsStyle}>
        <Button variant="secondary" size="small" onClick={addDraft}>
          + Outro dia
        </Button>
        <Button
          variant="primary"
          size="small"
          onClick={handleSubmit}
          disabled={!hasText}
        >
          Gravar registro
        </Button>
      </div>
    </div>
  );
}
