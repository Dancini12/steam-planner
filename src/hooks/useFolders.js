// ============================================================
// useFolders.js
// Hook React para gerenciar as pastas de "MEUS PROJETOS"
// ============================================================
//
// Centraliza criar, renomear e excluir pastas. Espelha a
// ideia do useProjects: ao montar carrega as pastas salvas
// (Supabase ou fallback local) e cada operação persiste
// imediatamente via src/lib/folders.js.
// ============================================================

import { useState, useEffect, useCallback } from "react";
import {
  createFolder,
  loadFolders,
  saveFolder,
  deleteFolderRemote
} from "../lib/folders.js";

export function useFolders(userId) {
  const [folders, setFolders] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    async function load() {
      const loaded = await loadFolders(userId);
      if (!isCurrent) return;
      setFolders(loaded);
      setIsLoaded(true);
    }

    load();

    return () => {
      isCurrent = false;
    };
  }, [userId]);

  const addFolder = useCallback(
    (name) => {
      const folder = createFolder(name, userId || null);
      setFolders((prev) => [...prev, folder]);
      saveFolder(userId, folder).catch((error) =>
        console.error("Erro ao salvar pasta:", error)
      );
      return folder;
    },
    [userId]
  );

  const renameFolder = useCallback(
    (folderId, name) => {
      const trimmed = (name || "").trim();
      if (!trimmed) return;
      setFolders((prev) => {
        const next = prev.map((folder) =>
          folder.id === folderId
            ? { ...folder, name: trimmed, updatedAt: new Date().toISOString() }
            : folder
        );
        const updated = next.find((folder) => folder.id === folderId);
        if (updated) {
          saveFolder(userId, updated).catch((error) =>
            console.error("Erro ao renomear pasta:", error)
          );
        }
        return next;
      });
    },
    [userId]
  );

  const removeFolder = useCallback(
    async (folderId) => {
      await deleteFolderRemote(folderId, userId);
      setFolders((prev) => prev.filter((folder) => folder.id !== folderId));
    },
    [userId]
  );

  return { folders, isLoaded, addFolder, renameFolder, removeFolder };
}
