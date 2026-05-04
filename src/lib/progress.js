// ============================================================
// progress.js
// Cálculo de progresso de cada fase e do projeto como um todo
// ============================================================
//
// Define como o app calcula se uma fase está "não iniciada",
// "em andamento" ou "concluída". Isso aparece visualmente
// nos cartões dos projetos e na lista de fases.
//
// Critério: cada fase tem 3 componentes (plano, diário,
// avaliação). Quantos estão preenchidos define o status.
// ============================================================

import { PHASES } from "../data/phases.js";

// Status possíveis de uma fase
export const PHASE_STATUS = {
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed"
};

// Verifica se o plano da fase tem conteúdo significativo.
function hasPlan(phase) {
  return phase?.plan && phase.plan.trim().length > 0;
}

// Verifica se há ao menos um registro no diário.
function hasDiary(phase) {
  return phase?.entries && phase.entries.length > 0;
}

// Verifica se a avaliação tem campos preenchidos.
// Considera "preenchida" quando há nível definido + ao menos
// um dos campos textuais (indicadores, evidências, devolutiva).
function hasEvaluation(phase) {
  const e = phase?.evaluation;
  if (!e) return false;
  const hasLevel = e.level && e.level.length > 0;
  const hasText =
    (e.indicators && e.indicators.trim().length > 0) ||
    (e.evidence && e.evidence.trim().length > 0) ||
    (e.feedback && e.feedback.trim().length > 0);
  return hasLevel && hasText;
}

// ------------------------------------------------------------
// STATUS DE UMA FASE ESPECÍFICA
// ------------------------------------------------------------
// Retorna { status, completed, total } onde:
// - status: NOT_STARTED, IN_PROGRESS ou COMPLETED
// - completed: quantos dos 3 componentes estão preenchidos
// - total: sempre 3 (plano, diário, avaliação)
// ------------------------------------------------------------

export function getPhaseStatus(project, phaseId) {
  const phase = project?.phases?.[phaseId];

  if (!phase) {
    return { status: PHASE_STATUS.NOT_STARTED, completed: 0, total: 3 };
  }

  let completed = 0;
  if (hasPlan(phase)) completed++;
  if (hasDiary(phase)) completed++;
  if (hasEvaluation(phase)) completed++;

  let status;
  if (completed === 0) {
    status = PHASE_STATUS.NOT_STARTED;
  } else if (completed === 3) {
    status = PHASE_STATUS.COMPLETED;
  } else {
    status = PHASE_STATUS.IN_PROGRESS;
  }

  return { status, completed, total: 3 };
}

// ------------------------------------------------------------
// PROGRESSO GERAL DO PROJETO
// ------------------------------------------------------------
// Soma o progresso de todas as 5 fases e calcula uma
// porcentagem geral. Útil para a barra de progresso.
// ------------------------------------------------------------

export function getProjectProgress(project) {
  if (!project || !project.phases) {
    return { percentage: 0, completedPhases: 0, totalPhases: PHASES.length };
  }

  let totalSteps = 0;
  let completedSteps = 0;
  let completedPhases = 0;

  PHASES.forEach((phase) => {
    const phaseStatus = getPhaseStatus(project, phase.id);
    totalSteps += phaseStatus.total;
    completedSteps += phaseStatus.completed;
    if (phaseStatus.status === PHASE_STATUS.COMPLETED) {
      completedPhases++;
    }
  });

  const percentage =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return {
    percentage,
    completedPhases,
    totalPhases: PHASES.length
  };
}
