// ============================================================
// useProjects.js
// Hook React para gerenciar todos os projetos do app
// ============================================================
//
// Este hook centraliza toda a manipulação dos projetos:
// criar, editar, excluir, adicionar registros no diário,
// salvar avaliações. Qualquer componente que precise mexer
// nos projetos chama este hook em vez de tocar diretamente
// no localStorage.
//
// Ao montar, carrega os projetos salvos do localStorage.
// A cada mudança, salva automaticamente. Isso garante que
// nenhum dado é perdido entre sessões.
// ============================================================

import { useState, useEffect, useCallback, useRef } from "react";
import {
  createProject,
  deleteProject,
  loadProjects,
  saveProjects
} from "../lib/storage.js";
import { trackEvent } from "../lib/analytics.js";
import { learnFromProject } from "../lib/machine-learning/index.js";
import {
  createBlankProject,
  createProjectFromTemplate,
  createDiaryEntry
} from "../lib/project.js";

function createStudent({ number, name, className, notes }) {
  return {
    id: `student-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    number: (number || "").trim(),
    name: (name || "").trim(),
    className: (className || "").trim(),
    notes: (notes || "").trim(),
    createdAt: new Date().toISOString()
  };
}

export function useProjects(userId) {
  const [projects, setProjects] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const skipNextSaveRef = useRef(false);

  // Ao montar, carrega projetos do Supabase ou do fallback local
  useEffect(() => {
    let isCurrent = true;

    async function load() {
      const loaded = await loadProjects(userId);
      if (!isCurrent) return;
      setProjects(loaded);
      setIsLoaded(true);
    }

    load();

    return () => {
      isCurrent = false;
    };
  }, [userId]);

  // A cada mudança em projects, salva no localStorage
  // (mas só depois que o carregamento inicial terminou,
  //  para não sobrescrever dados existentes com lista vazia)
  useEffect(() => {
    if (isLoaded) {
      if (skipNextSaveRef.current) {
        skipNextSaveRef.current = false;
        return;
      }
      saveProjects(projects, userId);
    }
  }, [projects, isLoaded, userId]);

  const refreshProjects = useCallback(async () => {
    const loaded = await loadProjects(userId);
    setProjects(loaded);
    return loaded;
  }, [userId]);

  const createRemoteProjectAndRefresh = useCallback(async (project, options = {}) => {
    try {
      await createProject(userId, project);
    } catch (error) {
      console.error("Projeto criado localmente, mas nao foi salvo no Supabase:", error);
      if (options.throwOnError) {
        throw error;
      }
    } finally {
      await refreshProjects();
    }
  }, [refreshProjects, userId]);

  // ----------------------------------------------------------
  // OPERAÇÕES DE PROJETO
  // ----------------------------------------------------------

  // Cria um projeto em branco e adiciona à lista
  const addBlankProject = useCallback((options = {}) => {
    const newProject = createBlankProject();
    newProject.ownerId = userId || null;
    newProject.isPublic = true;
    newProject.createdVia = "blank";
    const nextProjects = [...projects, newProject];
    skipNextSaveRef.current = true;
    setProjects(nextProjects);
    const persisted = createRemoteProjectAndRefresh(newProject, {
      throwOnError: options.waitForPersist
    });
    trackEvent(userId, "project_created", { source: "blank" });
    learnFromProject(userId, newProject, { eventType: "project_created", source: "blank" });
    if (options.waitForPersist) {
      return persisted.then(() => newProject);
    }
    return newProject;
  }, [createRemoteProjectAndRefresh, projects, userId]);

  // Cria um projeto a partir de um template (biblioteca ou IA)
  const addProjectFromTemplate = useCallback((template, options = {}) => {
    const newProject = createProjectFromTemplate(template);
    newProject.ownerId = userId || null;
    newProject.isPublic = true;
    newProject.createdVia = template?.source === "ai" ? "ai" : "library";
    const nextProjects = [...projects, newProject];
    skipNextSaveRef.current = true;
    setProjects(nextProjects);
    const persisted = createRemoteProjectAndRefresh(newProject, {
      throwOnError: options.waitForPersist
    });
    trackEvent(userId, "project_created", { source: newProject.createdVia });
    learnFromProject(userId, newProject, {
      eventType: "project_created",
      source: newProject.createdVia
    });
    if (options.waitForPersist) {
      return persisted.then(() => newProject);
    }
    return newProject;
  }, [createRemoteProjectAndRefresh, projects, userId]);

  // Edita campos de um projeto existente
  const editProject = useCallback((projectId, updates) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, ...updates, updatedAt: new Date().toISOString() }
          : p
      )
    );
  }, []);

  // Remove um projeto da lista
  const removeProject = useCallback(async (projectId) => {
    await deleteProject(projectId, userId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  }, [userId]);

  // Busca um projeto pelo ID
  const getProjectById = useCallback(
    (projectId) => projects.find((p) => p.id === projectId),
    [projects]
  );

  // ----------------------------------------------------------
  // OPERAÇÕES DE ALUNOS
  // ----------------------------------------------------------

  const addStudent = useCallback((projectId, studentData) => {
    if (!studentData?.name || studentData.name.trim().length === 0) return;
    const student = createStudent(studentData);
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              students: [...(p.students || []), student],
              updatedAt: new Date().toISOString()
            }
          : p
      )
    );
    trackEvent(userId, "student_registered");
    return student;
  }, [userId]);

  const editStudent = useCallback((projectId, studentId, updates) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              students: (p.students || []).map((student) =>
                student.id === studentId ? { ...student, ...updates } : student
              ),
              updatedAt: new Date().toISOString()
            }
          : p
      )
    );
  }, []);

  const removeStudent = useCallback((projectId, studentId) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;

        const phases = { ...(p.phases || {}) };
        Object.keys(phases).forEach((phaseId) => {
          const studentEntries = { ...(phases[phaseId].studentEntries || {}) };
          delete studentEntries[studentId];
          phases[phaseId] = {
            ...phases[phaseId],
            studentEntries
          };
        });

        return {
          ...p,
          students: (p.students || []).filter((student) => student.id !== studentId),
          phases,
          updatedAt: new Date().toISOString()
        };
      })
    );
  }, []);

  // ----------------------------------------------------------
  // OPERAÇÕES DE FASE
  // ----------------------------------------------------------

  // Atualiza o plano pedagógico de uma fase específica
  const editPhasePlan = useCallback((projectId, phaseId, planText) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          phases: {
            ...p.phases,
            [phaseId]: {
              ...p.phases[phaseId],
              plan: planText
            }
          },
          updatedAt: new Date().toISOString()
        };
      })
    );
  }, []);

  // Adiciona um novo registro no diário de uma fase
  const addEntry = useCallback((projectId, phaseId, text, date) => {
    if (!text || text.trim().length === 0) return;
    const entry = createDiaryEntry(text, date);
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          phases: {
            ...p.phases,
            [phaseId]: {
              ...p.phases[phaseId],
              entries: [...(p.phases[phaseId].entries || []), entry]
            }
          },
          updatedAt: new Date().toISOString()
        };
      })
    );
    trackEvent(userId, "general_diary_entry_created");
  }, [userId]);

  // Remove um registro do diário pelo ID
  const removeEntry = useCallback((projectId, phaseId, entryId) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          phases: {
            ...p.phases,
            [phaseId]: {
              ...p.phases[phaseId],
              entries: (p.phases[phaseId].entries || []).filter(
                (e) => e.id !== entryId
              )
            }
          },
          updatedAt: new Date().toISOString()
        };
      })
    );
  }, []);

  // Edita um registro existente do diário
  const editEntry = useCallback((projectId, phaseId, entryId, updates) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          phases: {
            ...p.phases,
            [phaseId]: {
              ...p.phases[phaseId],
              entries: (p.phases[phaseId].entries || []).map((entry) =>
                entry.id === entryId ? { ...entry, ...updates } : entry
              )
            }
          },
          updatedAt: new Date().toISOString()
        };
      })
    );
  }, []);

  const addStudentEntry = useCallback((projectId, phaseId, studentId, text, date) => {
    if (!studentId || !text || text.trim().length === 0) return;
    const entry = createDiaryEntry(text, date);
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const currentPhase = p.phases[phaseId] || {};
        const studentEntries = currentPhase.studentEntries || {};
        return {
          ...p,
          phases: {
            ...p.phases,
            [phaseId]: {
              ...currentPhase,
              studentEntries: {
                ...studentEntries,
                [studentId]: [...(studentEntries[studentId] || []), entry]
              }
            }
          },
          updatedAt: new Date().toISOString()
        };
      })
    );
    trackEvent(userId, "individual_diary_entry_created");
  }, [userId]);

  const removeStudentEntry = useCallback((projectId, phaseId, studentId, entryId) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const currentPhase = p.phases[phaseId] || {};
        const studentEntries = currentPhase.studentEntries || {};
        return {
          ...p,
          phases: {
            ...p.phases,
            [phaseId]: {
              ...currentPhase,
              studentEntries: {
                ...studentEntries,
                [studentId]: (studentEntries[studentId] || []).filter(
                  (entry) => entry.id !== entryId
                )
              }
            }
          },
          updatedAt: new Date().toISOString()
        };
      })
    );
  }, []);

  // Substitui a lista de referências bibliográficas de um projeto
  const editBibliography = useCallback((projectId, newBibliography) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, bibliography: newBibliography, updatedAt: new Date().toISOString() }
          : p
      )
    );
  }, []);

  // Atualiza a avaliação completa de uma fase
  const editPhaseEvaluation = useCallback(
    (projectId, phaseId, evaluation) => {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p;
          return {
            ...p,
            phases: {
              ...p.phases,
              [phaseId]: {
                ...p.phases[phaseId],
                evaluation
              }
            },
            updatedAt: new Date().toISOString()
          };
        })
      );
    },
    []
  );

  // ----------------------------------------------------------
  // INTERFACE PÚBLICA DO HOOK
  // ----------------------------------------------------------
  return {
    projects,
    isLoaded,
    addBlankProject,
    addProjectFromTemplate,
    editProject,
    removeProject,
    getProjectById,
    addStudent,
    editStudent,
    removeStudent,
    editPhasePlan,
    addEntry,
    removeEntry,
    editEntry,
    addStudentEntry,
    removeStudentEntry,
    editPhaseEvaluation,
    editBibliography
  };
}
