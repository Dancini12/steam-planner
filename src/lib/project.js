// ============================================================
// project.js
// Criação e estruturação de projetos STEAM
// ============================================================
//
// Define a estrutura de dados de um projeto e fornece funções
// para criar projetos novos (em branco ou a partir de modelo).
//
// A estrutura segue o ciclo Design Thinking adaptado, com
// 5 fases que armazenam:
// - plan: o que o professor planeja para a fase
// - entries: registros do diário de bordo (com data e texto)
// - evaluation: avaliação em fases (5 campos estruturados)
// ============================================================

import { PHASES } from "../data/phases.js";

// Gera um ID único baseado em timestamp + aleatório.
// Usa UUID para ser compatível com colunas uuid no Supabase.
function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

// Cria a estrutura padrão de uma fase vazia.
// Cada fase tem plano, registros do diário e avaliação.
function createEmptyPhase() {
  return {
    plan: "",
    entries: [],
    studentEntries: {},
    evaluation: {
      indicators: "",
      instruments: [],
      evidence: "",
      feedback: "",
      level: ""
    }
  };
}

// Cria um objeto com todas as 5 fases vazias.
// Estrutura: { imersao: {...}, ideacao: {...}, ... }
function createEmptyPhases() {
  const phases = {};
  PHASES.forEach((phase) => {
    phases[phase.id] = createEmptyPhase();
  });
  return phases;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

// ------------------------------------------------------------
// CRIAR PROJETO EM BRANCO
// ------------------------------------------------------------
// Usado quando o professor escolhe "Criar projeto em branco".
// Todos os campos começam vazios para preenchimento manual.
// ------------------------------------------------------------

export function createBlankProject() {
  return {
    id: generateId(),
    title: "",
    theme: "",
    grade: "",
    duration: "",
    problem: "",
    finalProduct: "",
    steam: [],
    steamMakerDescription: "",
    steamMatrix: {},
    guidingQuestion: "",
    objectives: [],
    bncc: [],
    materials: [],
    activityManual: "",
    students: [],
    phases: createEmptyPhases(),
    generatedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// ------------------------------------------------------------
// CRIAR PROJETO A PARTIR DE MODELO
// ------------------------------------------------------------
// Usado quando o professor escolhe um projeto da biblioteca
// ou quando a IA gera um projeto. Os campos vêm preenchidos
// como sugestão, mas o professor pode editar tudo depois.
//
// Os detalhes das fases (phaseDetails do template) são
// transferidos para o campo "plan" de cada fase do projeto.
// ------------------------------------------------------------

export function createProjectFromTemplate(template) {
  const project = createBlankProject();

  // Copia campos básicos do template
  project.title = template.title || "";
  project.theme = template.theme || "";
  project.grade = template.grade || "";
  project.duration = template.duration || "";
  project.problem = template.problem || "";
  project.finalProduct = template.finalProduct || "";
  project.steam = template.steam ? [...template.steam] : [];
  project.steamMakerDescription = template.steamMakerDescription || "";
  project.steamMatrix = template.steamMatrix ? clone(template.steamMatrix) : {};
  project.guidingQuestion = template.guidingQuestion || "";
  project.objectives = template.objectives ? [...template.objectives] : [];
  project.bncc = template.bncc ? [...template.bncc] : [];
  project.materials = template.materials ? [...template.materials] : [];
  project.activityManual = template.activityManual || "";
  project.students = template.students ? clone(template.students) : [];
  project.bibliography = template.bibliography ? [...template.bibliography] : [];
  project.generatedAt = template.generatedAt || null;

  if (template.phases) {
    project.phases = clone(template.phases);
  }

  // Transfere os detalhes de cada fase para o campo "plan"
  if (template.phaseDetails) {
    PHASES.forEach((phase) => {
      const detail = template.phaseDetails[phase.id];
      if (detail) {
        project.phases[phase.id].plan = detail;
      }
    });
  }

  return project;
}

// ------------------------------------------------------------
// CRIAR REGISTRO DE DIÁRIO
// ------------------------------------------------------------
// Cada entrada do diário tem ID único, data automática
// e o texto que o professor escreveu.
// ------------------------------------------------------------

export function createDiaryEntry(text, date) {
  return {
    id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    date: date || new Date().toISOString(),
    text: text.trim()
  };
}
