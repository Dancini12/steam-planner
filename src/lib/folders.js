// ============================================================
// folders.js
// Persistência das pastas de "MEUS PROJETOS"
// ============================================================
//
// Segue o mesmo princípio de storage.js: isola toda a
// interação com o armazenamento (localStorage + Supabase) das
// pastas que o professor cria para organizar seus planos de
// aula. O resto do app só pede "carregar", "salvar" e
// "excluir" pasta.
//
// A associação plano -> pasta NÃO fica aqui: ela é o campo
// `folderId` dentro do próprio objeto do projeto, persistido
// junto com o project_data em storage.js.
// ============================================================

import { isSupabaseConfigured, supabase } from "./supabaseClient.js";

const STORAGE_KEY = "steam_planner_folders";

function createFolderId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

function canUseRemoteStorage(userId) {
  if (supabase && isSupabaseConfigured && Boolean(userId)) {
    return true;
  }

  console.warn("Supabase indisponível (folders)");
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

// ------------------------------------------------------------
// LOCAL
// ------------------------------------------------------------

export function loadLocalFolders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Erro ao ler pastas do localStorage:", error);
    return [];
  }
}

export function saveLocalFolders(folders) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
    return true;
  } catch (error) {
    console.error("Erro ao salvar pastas:", error);
    return false;
  }
}

function upsertLocalFolder(folder) {
  const rest = loadLocalFolders().filter((item) => item.id !== folder.id);
  saveLocalFolders([...rest, folder]);
}

function deleteLocalFolder(folderId) {
  saveLocalFolders(loadLocalFolders().filter((item) => item.id !== folderId));
}

// ------------------------------------------------------------
// ROW <-> OBJETO
// ------------------------------------------------------------

function toFolderRow(folder, ownerId) {
  return {
    id: folder.id,
    owner_id: ownerId || folder.ownerId,
    name: folder.name || "Nova pasta",
    created_at: folder.createdAt || new Date().toISOString(),
    updated_at: folder.updatedAt || new Date().toISOString()
  };
}

function fromFolderRow(row) {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name || "Nova pasta",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// ------------------------------------------------------------
// API PÚBLICA
// ------------------------------------------------------------

export function createFolder(name, userId) {
  const now = new Date().toISOString();
  return {
    id: createFolderId(),
    ownerId: userId || null,
    name: (name || "").trim() || "Nova pasta",
    createdAt: now,
    updatedAt: now
  };
}

export async function loadFolders(userId) {
  const localFolders = loadLocalFolders().filter(
    (folder) => !folder.ownerId || folder.ownerId === userId
  );

  if (!canUseRemoteStorage(userId)) {
    return localFolders;
  }

  const effectiveUserId = await getSessionUserId("loadFolders");
  if (!effectiveUserId) {
    return localFolders;
  }

  const { data, error } = await supabase
    .from("project_folders")
    .select("id, owner_id, name, created_at, updated_at")
    .eq("owner_id", effectiveUserId)
    .order("name", { ascending: true });

  if (error) {
    console.warn("loadFolders: erro Supabase", error);
    return localFolders;
  }

  const remoteFolders = (data || []).map(fromFolderRow);
  const remoteIds = new Set(remoteFolders.map((folder) => folder.id));
  const unsyncedLocal = localFolders.filter((folder) => !remoteIds.has(folder.id));

  return [...remoteFolders, ...unsyncedLocal];
}

export async function saveFolder(userId, folder) {
  const stored = { ...folder, updatedAt: new Date().toISOString() };
  upsertLocalFolder(stored);

  if (!canUseRemoteStorage(userId)) {
    return stored;
  }

  const sessionUserId = await getSessionUserId("saveFolder");
  if (!sessionUserId) {
    return stored;
  }

  const { error } = await supabase
    .from("project_folders")
    .upsert([toFolderRow({ ...stored, ownerId: sessionUserId }, sessionUserId)]);

  if (error) {
    console.error("saveFolder: erro ao salvar no Supabase", error);
  }

  return stored;
}

export async function deleteFolderRemote(folderId, userId) {
  deleteLocalFolder(folderId);

  if (!canUseRemoteStorage(userId)) {
    return true;
  }

  const sessionUserId = await getSessionUserId("deleteFolder");
  if (!sessionUserId) {
    return false;
  }

  const { error } = await supabase
    .from("project_folders")
    .delete()
    .eq("id", folderId)
    .eq("owner_id", sessionUserId);

  if (error) {
    console.error("deleteFolderRemote: erro ao excluir no Supabase", error);
    return false;
  }

  return true;
}
