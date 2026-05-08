// ============================================================
// storage.js
// Persistência de dados no localStorage do navegador
// ============================================================
//
// Esta camada isola toda a interação com o localStorage do
// navegador. Centralizar isso em um único arquivo significa
// que se um dia trocarmos o localStorage por um banco real
// (Firebase, Supabase, IndexedDB), só precisaremos editar
// este arquivo. O resto do app continua igual.
//
// Princípio: o resto do app não sabe COMO os dados são
// salvos. Só pede para "salvar" e "carregar" projetos.
// ============================================================

import { isSupabaseConfigured, supabase } from "./supabaseClient.js";
import { createBlankProject } from "./project.js";

const STORAGE_KEY = "steam_planner_projects";

function createProjectId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value || ""
  );
}

function normalizeProjectIdentity(project) {
  if (!project?.id || isUuid(project.id)) {
    return project;
  }

  return {
    ...project,
    id: createProjectId(),
    updatedAt: new Date().toISOString()
  };
}

function canUseRemoteStorage(userId) {
  if (supabase && isSupabaseConfigured && Boolean(userId)) {
    return true;
  }

  console.warn("Supabase indisponível");
  return false;
}

async function getSessionUserId(context) {
  if (!supabase) {
    console.warn(`${context}: Supabase indisponível`);
    return null;
  }

  const {
    data: { session },
    error
  } = await supabase.auth.getSession();

  if (error) {
    console.warn(`${context}: erro ao obter sessão`, error);
    return null;
  }

  if (!session?.user?.id) {
    console.warn(`${context}: sem sessão ativa`);
    return null;
  }

  return session.user.id;
}

function sanitizePublicProject(project) {
  const sanitized = JSON.parse(JSON.stringify(project));
  delete sanitized.students;

  Object.keys(sanitized.phases || {}).forEach((phaseId) => {
    delete sanitized.phases[phaseId].studentEntries;
  });

  return sanitized;
}

function extractPrivateProjectData(project) {
  const phaseStudentEntries = {};

  Object.entries(project.phases || {}).forEach(([phaseId, phase]) => {
    if (phase.studentEntries) {
      phaseStudentEntries[phaseId] = phase.studentEntries;
    }
  });

  return {
    students: project.students || [],
    phaseStudentEntries
  };
}

function mergePrivateProjectData(project, privateData) {
  if (!privateData) return project;

  const merged = {
    ...project,
    students: privateData.students || []
  };

  const phaseStudentEntries = privateData.phaseStudentEntries || {};
  merged.phases = { ...(merged.phases || {}) };

  Object.entries(phaseStudentEntries).forEach(([phaseId, entries]) => {
    merged.phases[phaseId] = {
      ...(merged.phases[phaseId] || {}),
      studentEntries: entries || {}
    };
  });

  return merged;
}

function normalizeSteam(steam) {
  if (Array.isArray(steam)) return steam;
  if (steam && typeof steam === "object") {
    return Object.entries(steam)
      .filter(([, selected]) => Boolean(selected))
      .map(([area]) => area);
  }
  return [];
}

function toProjectRow(project, userId) {
  const ownerId = userId || project.ownerId;
  const normalizedSteam = normalizeSteam(project.steam);
  const projectData = {
    ...sanitizePublicProject(project),
    ownerId,
    steam: normalizedSteam,
    isPublic: project.isPublic !== false
  };

  return {
    id: project.id,
    owner_id: ownerId,
    usuario_id: ownerId,
    title: project.title || "Projeto sem título",
    theme: project.theme || "",
    grade: project.grade || "",
    duration: project.duration || "",
    steam: normalizedSteam,
    created_via: project.createdVia || "blank",
    is_public: project.isPublic !== false,
    project_data: projectData,
    created_at: project.createdAt || new Date().toISOString(),
    updated_at: project.updatedAt || new Date().toISOString()
  };
}

function toPrivateProjectRow(project, userId) {
  return {
    project_id: project.id,
    owner_id: userId || project.ownerId,
    private_data: extractPrivateProjectData(project),
    updated_at: project.updatedAt || new Date().toISOString()
  };
}

function logRlsIfNeeded(error) {
  const message = `${error?.message || ""} ${error?.details || ""}`.toLowerCase();
  if (error?.code === "42501" || message.includes("row-level security")) {
    console.error(
      "Erro de permissao/RLS no Supabase. Verifique se o usuario esta autenticado " +
      "e se a policy permite owner_id = auth.uid().",
      error
    );
  }
}

// Carrega todos os projetos do localStorage.
// Se não houver nada salvo ainda, retorna lista vazia.
// Se houver erro ao ler, também retorna lista vazia
// para evitar que o app trave.
export function loadLocalProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const normalized = parsed.map(normalizeProjectIdentity);
    if (normalized.some((project, index) => project.id !== parsed[index]?.id)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    }

    return normalized;
  } catch (error) {
    console.warn("Erro ao ler projetos do localStorage:", error);
    return [];
  }
}

export async function loadProjects(userId) {
  console.log("loadProjects: iniciando", { userId });
  const localProjects = loadLocalProjects().filter(
    (project) => !project.ownerId || project.ownerId === userId
  );

  console.log("loadProjects: Supabase configurado", isSupabaseConfigured);

  if (!canUseRemoteStorage(userId)) {
    console.log("loadProjects: usando dados locais", localProjects);
    return localProjects;
  }

  const effectiveUserId = await getSessionUserId("loadProjects");
  if (!effectiveUserId) {
    console.log("loadProjects: sem sessão, usando dados locais", localProjects);
    return localProjects;
  }

  console.log("loadProjects: buscando no Supabase", { effectiveUserId });

  const { data, error } = await supabase
    .from("projects")
    .select("id, owner_id, project_data, updated_at")
    .eq("owner_id", effectiveUserId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.warn("loadProjects: erro Supabase", error);
    return localProjects;
  }

  console.log("loadProjects: dados recebidos do Supabase", data);

  const remoteProjects = (data || [])
    .map((row) => ({
      ...row.project_data,
      id: row.id,
      ownerId: row.owner_id
    }))
    .filter(Boolean);

  console.log("loadProjects: projetos remotos normalizados", remoteProjects.length);

  if (remoteProjects.length > 0) {
    const { data: privateRows, error: privateError } = await supabase
      .from("project_private_data")
      .select("project_id, private_data")
      .in("project_id", remoteProjects.map((project) => project.id));

    if (!privateError) {
      const privateByProjectId = new Map(
        (privateRows || []).map((row) => [row.project_id, row.private_data])
      );

      for (let index = 0; index < remoteProjects.length; index++) {
        const project = remoteProjects[index];
        remoteProjects[index] = mergePrivateProjectData(
          project,
          privateByProjectId.get(project.id)
        );
      }
    }
  }

  const remoteIds = new Set(remoteProjects.map((project) => project.id));
  const unsyncedLocalProjects = localProjects.filter(
    (project) => !remoteIds.has(project.id)
  );

  return [...remoteProjects, ...unsyncedLocalProjects];
}

// Salva a lista completa de projetos no localStorage.
// Substitui qualquer dado anterior.
export function saveLocalProjects(projects) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    return true;
  } catch (error) {
    console.error("Erro ao salvar projetos:", error);
    return false;
  }
}

function deleteLocalProject(projectId) {
  const remainingProjects = loadLocalProjects().filter(
    (project) => project.id !== projectId
  );
  saveLocalProjects(remainingProjects);
}

function createDefaultProject(userId) {
  const project = createBlankProject();
  return {
    ...project,
    ownerId: userId,
    title: "Projeto Teste",
    theme: "Sustentabilidade",
    grade: "6º ano",
    duration: "2 semanas",
    steam: ["S", "T"],
    createdVia: "app",
    isPublic: true,
    updatedAt: new Date().toISOString()
  };
}

export async function createProject(userId, data = null) {
  console.log("createProject: iniciando", { userId, data });
  const project = {
    ...(data || createDefaultProject(userId)),
    ownerId: userId || data?.ownerId || null
  };

  console.log("createProject: projeto preparado", project);

  // Salva localmente antes de qualquer await para que a navegação imediata
  // para o editor encontre o projeto mesmo enquanto o Supabase persiste.
  saveLocalProjects([
    project,
    ...loadLocalProjects().filter((item) => item.id !== project.id)
  ]);

  const sessionUserId = await getSessionUserId("createProject");
  if (sessionUserId) {
    project.ownerId = sessionUserId;
    saveLocalProjects([
      project,
      ...loadLocalProjects().filter((item) => item.id !== project.id)
    ]);
  }

  if (!canUseRemoteStorage(project.ownerId) || !sessionUserId) {
    console.log("createProject: Supabase indisponível, projeto salvo localmente", [project]);
    return [project];
  }

  const row = toProjectRow(project, sessionUserId);
  console.log("createProject: inserindo projeto principal", project);
  const { data: savedProject, error } = await supabase
    .from("projects")
    .upsert([row])
    .select("id, owner_id, project_data")
    .single();

  if (error) {
    console.error("createProject: erro ao inserir em projects", error);
    logRlsIfNeeded(error);
    throw error;
  }

  console.log("createProject: projeto principal salvo", savedProject);

  const privateRow = toPrivateProjectRow(project, sessionUserId);
  console.log("createProject: inserindo dados privados", privateRow);
  const { error: privateError } = await supabase
    .from("project_private_data")
    .insert([privateRow]);

  if (privateError) {
    console.warn("createProject: erro ao inserir dados privados", privateError);
    logRlsIfNeeded(privateError);
  }

  return [
    {
      ...project,
      id: savedProject.id,
      ownerId: savedProject.owner_id
    }
  ];
}

export async function saveProjects(projects, userId) {
  saveLocalProjects(projects);

  if (!canUseRemoteStorage(userId)) {
    return true;
  }

  const sessionUserId = await getSessionUserId("saveProjects");
  if (!sessionUserId) {
    console.warn("saveProjects: sem sessão ativa, salvando apenas localmente");
    return false;
  }

  const rows = projects
    .map((project) => toProjectRow(project, sessionUserId))
    .filter((row) => Boolean(row.owner_id));

  if (rows.length === 0) return true;

  const { error } = await supabase.from("projects").upsert(rows);
  if (error) {
    console.error("Erro ao salvar projetos no Supabase:", error);
    logRlsIfNeeded(error);
    return false;
  }

  console.log("saveProjects: projetos salvos no Supabase", rows.length);

  const privateRows = projects.map((project) =>
    toPrivateProjectRow(project, sessionUserId)
  );

  const { error: privateError } = await supabase
    .from("project_private_data")
    .upsert(privateRows);

  if (privateError) {
    console.warn("saveProjects: erro ao salvar dados privados no Supabase:", privateError);
    logRlsIfNeeded(privateError);
  }

  return true;
}

export async function deleteProject(projectId, userId) {
  if (!canUseRemoteStorage(userId)) {
    deleteLocalProject(projectId);
    return true;
  }

  const sessionUserId = await getSessionUserId("deleteProject");
  if (!sessionUserId) {
    console.warn("deleteProject: sem sessão ativa, excluindo apenas localmente");
    deleteLocalProject(projectId);
    return false;
  }

  const { error: privateError } = await supabase
    .from("project_private_data")
    .delete()
    .eq("project_id", projectId)
    .eq("owner_id", sessionUserId);

  if (privateError) {
    console.warn("deleteProject: erro ao excluir dados privados:", privateError);
    logRlsIfNeeded(privateError);
  }

  const { count, error } = await supabase
    .from("projects")
    .delete({ count: "exact" })
    .eq("id", projectId)
    .or(`owner_id.eq.${sessionUserId},usuario_id.eq.${sessionUserId}`);

  if (error) {
    console.error("Erro ao excluir projeto no Supabase:", error);
    logRlsIfNeeded(error);
    throw error;
  }

  if (count === 0) {
    const error = new Error(
      "Nenhuma linha foi excluída em public.projects. Verifique RLS/policies ou se owner_id/usuario_id pertencem ao usuário logado."
    );
    error.code = "DELETE_COUNT_0";
    console.error("deleteProject: nenhuma linha excluída no Supabase", {
      projectId,
      sessionUserId
    });
    throw error;
  }

  console.log("deleteProject: projeto excluído no Supabase", { projectId, count });
  deleteLocalProject(projectId);
  return true;
}

export async function loadPublicProjects(userId) {
  if (!canUseRemoteStorage(userId)) return [];

  const { data, error } = await supabase
    .from("projects")
    .select("project_data")
    .eq("is_public", true)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    console.warn("Erro ao carregar projetos públicos do Supabase:", error);
    return [];
  }

  return (data || [])
    .map((row) => row.project_data)
    .map(sanitizePublicProject)
    .filter(Boolean);
}

// Limpa todos os projetos salvos. Usado em casos extremos.
export function clearAllProjects() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error("Erro ao limpar projetos:", error);
    return false;
  }
}
