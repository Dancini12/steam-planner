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

function canUseRemoteStorage(userId) {
  if (supabase && isSupabaseConfigured && Boolean(userId)) {
    return true;
  }

  console.warn("Supabase indisponível");
  return false;
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
    return Array.isArray(parsed) ? parsed : [];
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

  const { data: { session } } = await supabase.auth.getSession();
  const effectiveUserId = session?.user?.id || userId;

  console.log("loadProjects: buscando no Supabase", { effectiveUserId });

  const { data, error } = await supabase
    .from("projects")
    .select("project_data")
    .eq("owner_id", effectiveUserId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.warn("loadProjects: erro Supabase", error);
    return localProjects;
  }

  console.log("loadProjects: dados recebidos do Supabase", data);

  const remoteProjects = (data || [])
    .map((row) => row.project_data)
    .filter(Boolean);

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

  saveLocalProjects([
    project,
    ...loadLocalProjects().filter((item) => item.id !== project.id)
  ]);

  if (!canUseRemoteStorage(project.ownerId)) {
    console.log("createProject: Supabase indisponível, projeto salvo localmente", [project]);
    return [project];
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.warn("createProject: sem sessão ativa, projeto salvo apenas localmente");
    return [project];
  }

  const row = toProjectRow(project, session.user.id);
  console.log("createProject: inserindo projeto principal", project);
  const { data: result, error } = await supabase
    .from("projects")
    .insert([row]);

  if (error) {
    console.error("createProject: erro ao inserir em projects", error);
    logRlsIfNeeded(error);
    throw error;
  }

  console.log("createProject: projeto principal salvo", result);

  const privateRow = toPrivateProjectRow(project, userId);
  console.log("createProject: inserindo dados privados", privateRow);
  const { error: privateError } = await supabase
    .from("project_private_data")
    .insert([privateRow]);

  if (privateError) {
    console.warn("createProject: erro ao inserir dados privados", privateError);
    logRlsIfNeeded(privateError);
  }

  console.log("createProject: resposta Supabase", result);
  return result;
}

export async function saveProjects(projects, userId) {
  saveLocalProjects(projects);

  if (!canUseRemoteStorage(userId)) {
    return true;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.warn("saveProjects: sem sessão ativa, salvando apenas localmente");
    return false;
  }

  const rows = projects
    .map((project) => toProjectRow(project, session.user.id))
    .filter((row) => Boolean(row.owner_id));

  if (rows.length === 0) return true;

  const { error } = await supabase.from("projects").upsert(rows);
  if (error) {
    console.error("Erro ao salvar projetos no Supabase:", error);
    logRlsIfNeeded(error);
    return false;
  }

  const privateRows = projects.map((project) =>
    toPrivateProjectRow(project, userId)
  );

  const { error: privateError } = await supabase
    .from("project_private_data")
    .upsert(privateRows);

  if (privateError) {
    console.error("Erro ao salvar dados privados no Supabase:", privateError);
    logRlsIfNeeded(privateError);
    return false;
  }

  return true;
}

export async function deleteProject(projectId, userId) {
  if (!canUseRemoteStorage(userId)) {
    return true;
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("owner_id", userId);

  if (error) {
    console.error("Erro ao excluir projeto no Supabase:", error);
    return false;
  }

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
