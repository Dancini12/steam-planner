// ============================================================
// ProgressBar.jsx
// Barra visual de progresso das 5 fases do projeto
// ============================================================
//
// Mostra 5 segmentos coloridos, um para cada fase. Cada
// segmento fica:
// - Apagado se a fase não foi iniciada
// - Parcialmente colorido se está em andamento
// - Totalmente colorido se está concluída
//
// Quando showLabels=true, mostra também os nomes das fases
// embaixo de cada segmento.
// ============================================================

import { PHASES } from "../../data/phases.js";
import { getPhaseStatus, PHASE_STATUS } from "../../lib/progress.js";

export default function ProgressBar({ project, showLabels = false }) {
  const containerStyle = {
    width: "100%"
  };

  const barStyle = {
    display: "flex",
    gap: "4px",
    height: "8px",
    borderRadius: "4px",
    overflow: "hidden"
  };

  const segmentStyle = (color, status, completed) => {
    let opacity;
    if (status === PHASE_STATUS.COMPLETED) opacity = 1;
    else if (status === PHASE_STATUS.IN_PROGRESS) opacity = 0.4 + completed * 0.2;
    else opacity = 0.15;

    return {
      flex: 1,
      background: color,
      opacity: opacity,
      transition: "opacity 0.3s ease"
    };
  };

  const labelsStyle = {
    display: "flex",
    gap: "4px",
    marginTop: "0.5rem"
  };

  const labelStyle = (color, isActive) => ({
    flex: 1,
    fontSize: "0.7rem",
    color: isActive ? color : "rgba(255, 255, 255, 0.4)",
    textAlign: "center",
    fontWeight: isActive ? 600 : 400,
    textTransform: "uppercase",
    letterSpacing: "0.03em"
  });

  return (
    <div style={containerStyle}>
      <div style={barStyle}>
        {PHASES.map((phase) => {
          const status = getPhaseStatus(project, phase.id);
          return (
            <div
              key={phase.id}
              style={segmentStyle(phase.color, status.status, status.completed)}
              title={`${phase.name}: ${status.completed}/3`}
            />
          );
        })}
      </div>

      {showLabels && (
        <div style={labelsStyle}>
          {PHASES.map((phase) => {
            const status = getPhaseStatus(project, phase.id);
            const isActive = status.status !== PHASE_STATUS.NOT_STARTED;
            return (
              <div key={phase.id} style={labelStyle(phase.color, isActive)}>
                {phase.name}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
