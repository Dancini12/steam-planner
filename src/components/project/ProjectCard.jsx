// ============================================================
// ProjectCard.jsx
// Cartão de cada projeto na listagem do Dashboard
// ============================================================
//
// Apresenta um projeto de forma compacta mas informativa:
// - Título
// - Selos das áreas STEAM
// - Tema, ano e duração
// - Barra de progresso das 5 fases
// - Botão de excluir (visível só ao passar o mouse)
//
// O cartão inteiro é clicável e leva ao ProjectEditor.
// ============================================================

import Card from "../ui/Card.jsx";
import SteamBadges from "./SteamBadges.jsx";
import ProgressBar from "./ProgressBar.jsx";
import { getProjectTimeline } from "../../lib/timeline.js";

export default function ProjectCard({ project, onClick, onDelete }) {
  const timeline = getProjectTimeline(project);

  // ----------------------------------------------------------
  // ESTILOS
  // ----------------------------------------------------------

  const wrapperStyle = {
    position: "relative"
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "1rem",
    marginBottom: "0.75rem"
  };

  const titleStyle = {
    fontSize: "1.05rem",
    fontWeight: 600,
    color: "#FFFFFF",
    margin: 0,
    lineHeight: 1.3,
    flex: 1,
    minWidth: 0,
    wordBreak: "break-word"
  };

  const themeStyle = {
    fontSize: "0.85rem",
    color: "rgba(255, 255, 255, 0.5)",
    fontStyle: "italic",
    margin: "0.25rem 0 0"
  };

  const metaStyle = {
    display: "flex",
    gap: "0.75rem",
    fontSize: "0.8rem",
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: "1rem",
    flexWrap: "wrap"
  };

  const timelineStyle = {
    fontSize: "0.78rem",
    color:
      timeline.remainingDays === 0 && timeline.totalDays
        ? "#E8358A"
        : "rgba(255, 255, 255, 0.58)",
    margin: "-0.35rem 0 1rem",
    fontWeight: 600
  };

  const progressLabelStyle = {
    fontSize: "0.75rem",
    color: "rgba(255, 255, 255, 0.5)",
    marginBottom: "0.4rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontWeight: 600
  };

  const deleteButtonStyle = {
    position: "absolute",
    top: "0.75rem",
    right: "0.75rem",
    background: "rgba(232, 53, 138, 0.1)",
    border: "1px solid rgba(232, 53, 138, 0.2)",
    color: "#E8358A",
    width: "26px",
    height: "26px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "inherit",
    opacity: 0,
    transition: "opacity 0.2s ease"
  };

  // Mostra/esconde o botão de excluir ao passar o mouse
  const handleMouseEnter = (e) => {
    const btn = e.currentTarget.querySelector(".delete-btn");
    if (btn) btn.style.opacity = "1";
  };
  const handleMouseLeave = (e) => {
    const btn = e.currentTarget.querySelector(".delete-btn");
    if (btn) btn.style.opacity = "0";
  };

  // Impede que clique no excluir abra o projeto
  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete?.();
  };

  // ----------------------------------------------------------
  // RENDERIZAÇÃO
  // ----------------------------------------------------------

  return (
    <div
      style={wrapperStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Card variant="clickable" onClick={onClick}>
        <div style={headerStyle}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={titleStyle}>
              {project.title || "Projeto sem título"}
            </h3>
            {project.theme && <p style={themeStyle}>{project.theme}</p>}
          </div>
          {project.steam && project.steam.length > 0 && (
            <SteamBadges areas={project.steam} size="small" />
          )}
        </div>

        {(project.grade || project.duration) && (
          <div style={metaStyle}>
            {project.grade && <span>{project.grade}</span>}
            {project.grade && project.duration && <span>·</span>}
            {project.duration && <span>{project.duration}</span>}
          </div>
        )}

        {project.duration && (
          <div style={timelineStyle}>{timeline.label}</div>
        )}

        <div>
          <div style={progressLabelStyle}>Progresso</div>
          <ProgressBar project={project} />
        </div>
      </Card>

      <button
        className="delete-btn"
        style={deleteButtonStyle}
        onClick={handleDeleteClick}
        title="Excluir projeto"
      >
        ×
      </button>
    </div>
  );
}
