// ============================================================
// EvaluationForm.jsx
// Formulário de Avaliação em Fases — núcleo da pesquisa
// ============================================================
//
// Operacionaliza no app a Avaliação em Fases proposta na
// pesquisa de mestrado. Cinco campos estruturam a análise
// avaliativa de cada fase do projeto:
//
// 1. Indicadores observados — o que o professor percebeu
// 2. Instrumentos utilizados — como percebeu (rubrica,
//    observação, autoavaliação, etc.)
// 3. Evidências coletadas — quais registros tangíveis
// 4. Devolutiva pedagógica — o que será comunicado à turma
// 5. Nível de desenvolvimento — síntese qualitativa
//
// Os instrumentos sugeridos para cada fase aparecem em
// destaque, mas o professor pode escolher qualquer combinação.
// ============================================================

import { useState, useEffect } from "react";
import {
  EVALUATION_INSTRUMENTS,
  EVALUATION_LEVELS,
  getSuggestedInstrumentsForPhase
} from "../../data/evaluation.js";

import TextField from "../ui/TextField.jsx";
import Button from "../ui/Button.jsx";

export default function EvaluationForm({ phaseId, evaluation, onSave }) {
  // Estados locais
  const [indicators, setIndicators] = useState("");
  const [instruments, setInstruments] = useState([]);
  const [evidence, setEvidence] = useState("");
  const [feedback, setFeedback] = useState("");
  const [level, setLevel] = useState("");

  // Sincroniza com props quando carregar
  useEffect(() => {
    if (evaluation) {
      setIndicators(evaluation.indicators || "");
      setInstruments(evaluation.instruments || []);
      setEvidence(evaluation.evidence || "");
      setFeedback(evaluation.feedback || "");
      setLevel(evaluation.level || "");
    }
  }, [evaluation, phaseId]);

  // Lista de IDs sugeridos para a fase atual
  const suggestedIds = getSuggestedInstrumentsForPhase(phaseId).map(
    (i) => i.id
  );

  // Alterna seleção de instrumento
  const toggleInstrument = (instrumentId) => {
    if (instruments.includes(instrumentId)) {
      setInstruments(instruments.filter((id) => id !== instrumentId));
    } else {
      setInstruments([...instruments, instrumentId]);
    }
  };

  // Salva todos os campos
  const handleSave = () => {
    onSave?.({
      indicators,
      instruments,
      evidence,
      feedback,
      level
    });
  };

  // ----------------------------------------------------------
  // ESTILOS
  // ----------------------------------------------------------

  const containerStyle = {
    background: "rgba(255, 255, 255, 0.02)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: "8px",
    padding: "1.5rem"
  };

  const sectionStyle = {
    marginBottom: "1.5rem"
  };

  const sectionTitleStyle = {
    fontSize: "0.8rem",
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: 600,
    marginBottom: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em"
  };

  const instrumentsGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "0.5rem"
  };

  const instrumentItemStyle = (isSelected, isSuggested) => ({
    padding: "0.65rem 0.85rem",
    borderRadius: "6px",
    border: isSelected
      ? "1px solid rgba(107, 47, 224, 0.6)"
      : isSuggested
      ? "1px solid rgba(107, 47, 224, 0.25)"
      : "1px solid rgba(255, 255, 255, 0.06)",
    background: isSelected
      ? "rgba(107, 47, 224, 0.15)"
      : "rgba(255, 255, 255, 0.02)",
    cursor: "pointer",
    fontSize: "0.85rem",
    color: isSelected
      ? "#FFFFFF"
      : isSuggested
      ? "rgba(255, 255, 255, 0.85)"
      : "rgba(255, 255, 255, 0.6)",
    transition: "all 0.15s ease",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem"
  });

  const suggestedTagStyle = {
    fontSize: "0.65rem",
    background: "rgba(107, 47, 224, 0.3)",
    color: "#C9A0FF",
    padding: "0.1rem 0.4rem",
    borderRadius: "3px",
    fontWeight: 600,
    textTransform: "uppercase"
  };

  const levelsGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "0.5rem"
  };

  const levelCardStyle = (color, isSelected) => ({
    padding: "0.85rem 1rem",
    borderRadius: "8px",
    border: isSelected ? `2px solid ${color}` : "1px solid rgba(255, 255, 255, 0.08)",
    background: isSelected ? `${color}15` : "rgba(255, 255, 255, 0.02)",
    cursor: "pointer",
    transition: "all 0.15s ease"
  });

  const levelLabelStyle = (color, isSelected) => ({
    fontSize: "0.85rem",
    fontWeight: 600,
    color: isSelected ? color : "rgba(255, 255, 255, 0.85)",
    marginBottom: "0.25rem"
  });

  const levelDescStyle = {
    fontSize: "0.75rem",
    color: "rgba(255, 255, 255, 0.5)",
    lineHeight: 1.4
  };

  const actionsStyle = {
    display: "flex",
    justifyContent: "flex-end",
    paddingTop: "1rem",
    borderTop: "1px solid rgba(255, 255, 255, 0.06)"
  };

  // ----------------------------------------------------------
  // RENDERIZAÇÃO
  // ----------------------------------------------------------

  return (
    <div style={containerStyle}>
      {/* 1. Indicadores observados */}
      <div style={sectionStyle}>
        <TextField
          label="1. Indicadores observados"
          value={indicators}
          onChange={setIndicators}
          multiline
          rows={3}
          placeholder="Quais comportamentos, falas, produções ou momentos chamaram atenção nesta fase?"
          hint="Liste objetivamente o que você notou na turma. Evite julgamentos: descreva."
        />
      </div>

      {/* 2. Instrumentos utilizados */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>
          2. Instrumentos utilizados
          <span style={{ fontWeight: 400, textTransform: "none", marginLeft: "0.5rem", color: "rgba(255,255,255,0.4)" }}>
            (instrumentos com destaque são sugeridos para esta fase)
          </span>
        </div>
        <div style={instrumentsGridStyle}>
          {EVALUATION_INSTRUMENTS.map((instrument) => {
            const isSelected = instruments.includes(instrument.id);
            const isSuggested = suggestedIds.includes(instrument.id);
            return (
              <div
                key={instrument.id}
                style={instrumentItemStyle(isSelected, isSuggested)}
                onClick={() => toggleInstrument(instrument.id)}
                title={instrument.description}
              >
                <span>{isSelected ? "✓" : "○"}</span>
                <span style={{ flex: 1 }}>{instrument.name}</span>
                {isSuggested && !isSelected && (
                  <span style={suggestedTagStyle}>sug.</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Evidências */}
      <div style={sectionStyle}>
        <TextField
          label="3. Evidências coletadas"
          value={evidence}
          onChange={setEvidence}
          multiline
          rows={3}
          placeholder="Quais registros materiais comprovam essas observações? (fotos, produções, áudios, anotações...)"
          hint="Evidências concretas dão lastro à avaliação."
        />
      </div>

      {/* 4. Devolutiva */}
      <div style={sectionStyle}>
        <TextField
          label="4. Devolutiva pedagógica"
          value={feedback}
          onChange={setFeedback}
          multiline
          rows={3}
          placeholder="Como você comunicará suas percepções à turma? Que ajustes propõe?"
          hint="Avaliação que não retorna ao estudante perde o sentido formativo."
        />
      </div>

      {/* 5. Nível de desenvolvimento */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>5. Nível de desenvolvimento da turma</div>
        <div style={levelsGridStyle}>
          {EVALUATION_LEVELS.map((lvl) => {
            const isSelected = level === lvl.id;
            return (
              <div
                key={lvl.id}
                style={levelCardStyle(lvl.color, isSelected)}
                onClick={() => setLevel(lvl.id)}
              >
                <div style={levelLabelStyle(lvl.color, isSelected)}>
                  {lvl.label}
                </div>
                <div style={levelDescStyle}>{lvl.description}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ações */}
      <div style={actionsStyle}>
        <Button variant="primary" onClick={handleSave}>
          Salvar avaliação da fase
        </Button>
      </div>
    </div>
  );
}
