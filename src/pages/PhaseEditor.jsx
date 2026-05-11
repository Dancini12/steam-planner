// ============================================================
// PhaseEditor.jsx
// Tela de edição de uma fase específica do projeto STEAM
// ============================================================
//
// Esta tela operacionaliza, dentro do app, todo o ciclo de
// trabalho do professor numa fase do projeto:
//
// 1. Lembrete didático da fase (descrição, ações, foco)
// 2. Plano pedagógico (como conduzir essa fase nesta turma)
// 3. Diário de bordo (registros datados do que aconteceu)
// 4. Avaliação em fases (núcleo da pesquisa de mestrado)
//
// É a tela mais rica do app, pois reúne planejamento,
// execução e avaliação em um único fluxo coerente.
// ============================================================

import { useState, useEffect } from "react";
import { useProjects } from "../hooks/useProjects.js";
import { PHASES, getPhaseById } from "../data/phases.js";

import PhaseHeader from "../components/phase/PhaseHeader.jsx";
import TextField from "../components/ui/TextField.jsx";
import Button from "../components/ui/Button.jsx";

// ------------------------------------------------------------
// COMPONENTE PHASE EDITOR
// ------------------------------------------------------------
// Propriedades:
// - projectId : id do projeto pai
// - phaseId   : id da fase atual sendo editada
// - onBack    : função chamada para voltar ao projeto
// - onChangePhase : função para navegar entre fases
// ------------------------------------------------------------
export default function PhaseEditor({
  projectId,
  phaseId,
  currentUser,
  onBack,
  onChangePhase
}) {
  const {
    getProjectById,
    editPhasePlan,
    isLoaded
  } = useProjects(currentUser?.id);

  const project = getProjectById(projectId);
  const phase = getPhaseById(phaseId);

  // Estado local do plano pedagógico
  const [plan, setPlan] = useState("");

  // Sincroniza plano local com o projeto carregado
  useEffect(() => {
    if (project && project.phases[phaseId]) {
      setPlan(project.phases[phaseId].plan || "");
    }
  }, [project, phaseId]);

  // Salva o plano pedagógico
  const handleSavePlan = () => {
    editPhasePlan(projectId, phaseId, plan);
  };

  // Navegação entre fases (anterior e próxima)
  const currentPhaseIndex = PHASES.findIndex((p) => p.id === phaseId);
  const previousPhase =
    currentPhaseIndex > 0 ? PHASES[currentPhaseIndex - 1] : null;
  const nextPhase =
    currentPhaseIndex < PHASES.length - 1
      ? PHASES[currentPhaseIndex + 1]
      : null;

  // ----------------------------------------------------------
  // ESTILOS
  // ----------------------------------------------------------
  const containerStyle = {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "2rem 1.5rem"
  };

  const topBarStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
    flexWrap: "wrap",
    gap: "0.75rem"
  };

  const backButtonStyle = {
    background: "transparent",
    border: "none",
    color: "rgba(255, 255, 255, 0.6)",
    cursor: "pointer",
    fontSize: "0.9rem",
    padding: "0.5rem 0",
    fontFamily: "inherit"
  };

  const navigationStyle = {
    display: "flex",
    gap: "0.5rem"
  };

  const sectionStyle = {
    marginBottom: "3rem"
  };

  const sectionTitleStyle = (color) => ({
    fontSize: "1.1rem",
    fontWeight: 600,
    color: color,
    marginBottom: "1rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem"
  });

  const sectionLabelStyle = {
    fontSize: "0.7rem",
    color: "rgba(255, 255, 255, 0.4)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 600
  };

  const planActionsStyle = {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "0.5rem"
  };

  const bottomNavStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "3rem",
    paddingTop: "2rem",
    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
    flexWrap: "wrap",
    gap: "1rem"
  };

  // ----------------------------------------------------------
  // VALIDAÇÕES
  // ----------------------------------------------------------

  if (!isLoaded) {
    return (
      <div style={containerStyle}>
        <p style={{ color: "rgba(255, 255, 255, 0.5)" }}>Carregando...</p>
      </div>
    );
  }

  if (!project || !phase) {
    return (
      <div style={containerStyle}>
        <p style={{ color: "rgba(255, 255, 255, 0.7)" }}>
          Fase não encontrada.
        </p>
        <Button variant="primary" onClick={onBack}>
          Voltar ao projeto
        </Button>
      </div>
    );
  }

  const phaseData = project.phases[phaseId] || {
    plan: "",
  };

  // ----------------------------------------------------------
  // RENDERIZAÇÃO
  // ----------------------------------------------------------
  return (
    <div style={containerStyle}>
      {/* Barra superior com voltar e navegação entre fases */}
      <div style={topBarStyle}>
        <button style={backButtonStyle} onClick={onBack}>
          ← Voltar ao projeto
        </button>

        <div style={navigationStyle}>
          {previousPhase && (
            <Button
              variant="ghost"
              size="small"
              onClick={() => onChangePhase(previousPhase.id)}
            >
              ← {previousPhase.name}
            </Button>
          )}
          {nextPhase && (
            <Button
              variant="ghost"
              size="small"
              onClick={() => onChangePhase(nextPhase.id)}
            >
              {nextPhase.name} →
            </Button>
          )}
        </div>
      </div>

      {/* SEÇÃO 1 — CABEÇALHO DIDÁTICO DA FASE */}
      <PhaseHeader phase={phase} />

      {/* SEÇÃO 2 — PLANO PEDAGÓGICO */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle(phase.color)}>
          <span style={sectionLabelStyle}>Componente 1</span>
          Plano pedagógico desta fase
        </div>

        <TextField
          value={plan}
          onChange={setPlan}
          multiline
          rows={6}
          placeholder="Descreva como você vai conduzir esta fase com a sua turma. Atividades, sequência, recursos específicos, cronograma local."
          hint="Esta é a sua adaptação da fase ao contexto real da turma."
        />
        <div style={planActionsStyle}>
          <Button variant="primary" size="small" onClick={handleSavePlan}>
            Salvar plano
          </Button>
        </div>
      </div>

      {/* NAVEGAÇÃO INFERIOR */}
      <div style={bottomNavStyle}>
        {previousPhase ? (
          <Button
            variant="secondary"
            onClick={() => onChangePhase(previousPhase.id)}
          >
            ← {previousPhase.name}
          </Button>
        ) : (
          <span />
        )}

        <Button variant="ghost" onClick={onBack}>
          Voltar ao projeto
        </Button>

        {nextPhase ? (
          <Button
            variant="primary"
            onClick={() => onChangePhase(nextPhase.id)}
          >
            {nextPhase.name} →
          </Button>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
