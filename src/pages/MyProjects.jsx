// ============================================================
// MyProjects.jsx
// Tela "MEUS PROJETOS" — lista os planos de aula do professor
// e permite organizá-los em pastas (um nível).
// ============================================================
//
// - Lista todos os planos salvos (hook useProjects).
// - Pastas criadas pelo professor (hook useFolders) para
//   organizar os planos. A associação plano -> pasta é o
//   campo `folderId` no próprio projeto, persistido junto
//   com o project_data.
// - Na raiz: cards de pasta + planos sem pasta.
// - Dentro de uma pasta: apenas os planos daquela pasta.
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { useProjects } from "../hooks/useProjects.js";
import { useFolders } from "../hooks/useFolders.js";
import ProjectCard from "../components/project/ProjectCard.jsx";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Modal from "../components/ui/Modal.jsx";

export default function MyProjects({ currentUser, onBack, onOpenProject }) {
  const {
    projects,
    editProject,
    removeProject,
    addBlankProject,
    isLoaded: projectsLoaded
  } = useProjects(currentUser?.id);
  const {
    folders,
    isLoaded: foldersLoaded,
    addFolder,
    renameFolder,
    removeFolder
  } = useFolders(currentUser?.id);

  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [creatingPlan, setCreatingPlan] = useState(false);

  // Modais
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteFolderTarget, setDeleteFolderTarget] = useState(null);
  const [deletePlanTarget, setDeletePlanTarget] = useState(null);

  const isLoaded = projectsLoaded && foldersLoaded;

  const selectedFolder = useMemo(
    () => folders.find((folder) => folder.id === selectedFolderId) || null,
    [folders, selectedFolderId]
  );

  // Se a pasta aberta deixou de existir, volta para a raiz
  useEffect(() => {
    if (selectedFolderId && foldersLoaded && !selectedFolder) {
      setSelectedFolderId(null);
    }
  }, [selectedFolderId, foldersLoaded, selectedFolder]);

  const countByFolder = useMemo(() => {
    const counts = {};
    projects.forEach((project) => {
      if (project.folderId) {
        counts[project.folderId] = (counts[project.folderId] || 0) + 1;
      }
    });
    return counts;
  }, [projects]);

  const visibleProjects = useMemo(() => {
    if (selectedFolderId) {
      return projects.filter((project) => project.folderId === selectedFolderId);
    }
    return projects.filter((project) => !project.folderId);
  }, [projects, selectedFolderId]);

  // ----------------------------------------------------------
  // AÇÕES
  // ----------------------------------------------------------

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    addFolder(name);
    setNewFolderName("");
    setNewFolderOpen(false);
  };

  const handleRenameFolder = () => {
    if (!renameTarget) return;
    renameFolder(renameTarget.id, renameValue);
    setRenameTarget(null);
    setRenameValue("");
  };

  const handleDeleteFolder = async () => {
    if (!deleteFolderTarget) return;
    const folderId = deleteFolderTarget.id;
    // Os planos da pasta voltam para a raiz (não são apagados)
    projects
      .filter((project) => project.folderId === folderId)
      .forEach((project) => editProject(project.id, { folderId: null }));
    await removeFolder(folderId);
    if (selectedFolderId === folderId) setSelectedFolderId(null);
    setDeleteFolderTarget(null);
  };

  const handleDeletePlan = async () => {
    if (!deletePlanTarget) return;
    await removeProject(deletePlanTarget.id);
    setDeletePlanTarget(null);
  };

  const handleNewBlankPlan = async () => {
    if (creatingPlan) return;
    setCreatingPlan(true);
    try {
      const project = await addBlankProject({ waitForPersist: true });
      if (!project) return;
      if (selectedFolderId) {
        // Cria dentro da pasta atual: fica na lista para o professor
        // conferir e abrir; assim garantimos que o folderId seja salvo
        // antes de sair da tela.
        editProject(project.id, { folderId: selectedFolderId });
      } else {
        onOpenProject(project.id);
      }
    } catch (error) {
      console.error("Erro ao criar plano em branco:", error);
    } finally {
      setCreatingPlan(false);
    }
  };

  const moveProjectToFolder = (projectId, folderId) => {
    editProject(projectId, { folderId: folderId || null });
  };

  // ----------------------------------------------------------
  // ESTILOS
  // ----------------------------------------------------------

  const containerStyle = {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "2rem 1.5rem"
  };

  const backButtonStyle = {
    background: "transparent",
    border: "none",
    color: "rgba(255, 255, 255, 0.6)",
    cursor: "pointer",
    fontSize: "0.9rem",
    padding: "0.5rem 0",
    marginBottom: "1rem",
    fontFamily: "inherit"
  };

  const titleStyle = {
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "#FFFFFF",
    margin: 0
  };

  const subtitleStyle = {
    fontSize: "0.95rem",
    color: "rgba(255, 255, 255, 0.55)",
    margin: "0.5rem 0 0",
    lineHeight: 1.6
  };

  const toolbarStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
    alignItems: "center",
    margin: "1.5rem 0"
  };

  const breadcrumbStyle = {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    fontSize: "0.9rem",
    color: "rgba(255, 255, 255, 0.55)",
    margin: "0 0 1rem"
  };

  const crumbLinkStyle = {
    background: "transparent",
    border: "none",
    color: "rgba(255, 255, 255, 0.75)",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.9rem",
    padding: 0
  };

  const sectionLabelStyle = {
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "rgba(255, 255, 255, 0.4)",
    fontWeight: 700,
    margin: "1.75rem 0 0.75rem"
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "1.25rem"
  };

  const folderGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "1rem"
  };

  const folderCardHeaderStyle = {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    marginBottom: "0.35rem"
  };

  const folderNameStyle = {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#FFFFFF",
    margin: 0,
    wordBreak: "break-word"
  };

  const folderMetaStyle = {
    fontSize: "0.8rem",
    color: "rgba(255, 255, 255, 0.5)",
    margin: 0
  };

  const folderActionsStyle = {
    display: "flex",
    gap: "0.75rem",
    marginTop: "0.85rem"
  };

  const folderActionButtonStyle = {
    background: "transparent",
    border: "none",
    color: "rgba(255, 255, 255, 0.55)",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.8rem",
    padding: 0
  };

  const moveRowStyle = {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    marginBottom: "0.5rem",
    fontSize: "0.78rem",
    color: "rgba(255, 255, 255, 0.5)"
  };

  const selectStyle = {
    flex: 1,
    minWidth: 0,
    background: "#12122E",
    color: "#FFFFFF",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    borderRadius: "6px",
    padding: "0.35rem 0.5rem",
    fontFamily: "inherit",
    fontSize: "0.8rem"
  };

  const emptyStyle = {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: "0.95rem",
    padding: "2rem 0"
  };

  const inputStyle = {
    width: "100%",
    background: "#12122E",
    color: "#FFFFFF",
    border: "1px solid rgba(255, 255, 255, 0.16)",
    borderRadius: "8px",
    padding: "0.65rem 0.8rem",
    fontFamily: "inherit",
    fontSize: "0.95rem",
    marginBottom: "1.25rem"
  };

  const modalActionsStyle = {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.75rem"
  };

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  if (!isLoaded) {
    return (
      <div style={containerStyle}>
        <button style={backButtonStyle} onClick={onBack}>
          ← Voltar
        </button>
        <p style={emptyStyle}>Carregando...</p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <button style={backButtonStyle} onClick={onBack}>
        ← Voltar
      </button>

      <h1 style={titleStyle}>Meus Projetos</h1>
      <p style={subtitleStyle}>
        Todos os planos de aula que você criou ficam salvos aqui. Crie pastas
        para organizá-los do seu jeito.
      </p>

      <div style={toolbarStyle}>
        <Button variant="secondary" size="small" onClick={() => setNewFolderOpen(true)}>
          + Nova pasta
        </Button>
        <Button
          variant="primary"
          size="small"
          onClick={handleNewBlankPlan}
          disabled={creatingPlan}
        >
          {creatingPlan ? "Criando..." : "+ Novo plano em branco"}
        </Button>
      </div>

      {selectedFolder && (
        <div style={breadcrumbStyle}>
          <button style={crumbLinkStyle} onClick={() => setSelectedFolderId(null)}>
            Meus Projetos
          </button>
          <span>›</span>
          <span style={{ color: "#FFFFFF" }}>{selectedFolder.name}</span>
        </div>
      )}

      {/* Pastas — só na raiz */}
      {!selectedFolder && folders.length > 0 && (
        <>
          <div style={sectionLabelStyle}>Pastas</div>
          <div style={folderGridStyle}>
            {folders.map((folder) => (
              <Card key={folder.id} accentColor="#22D3EE">
                <div
                  onClick={() => setSelectedFolderId(folder.id)}
                  style={{ cursor: "pointer" }}
                >
                  <div style={folderCardHeaderStyle}>
                    <span aria-hidden="true" style={{ fontSize: "1.2rem" }}>
                      📁
                    </span>
                    <h3 style={folderNameStyle}>{folder.name}</h3>
                  </div>
                  <p style={folderMetaStyle}>
                    {countByFolder[folder.id] || 0}{" "}
                    {(countByFolder[folder.id] || 0) === 1 ? "plano" : "planos"}
                  </p>
                </div>
                <div style={folderActionsStyle}>
                  <button
                    style={folderActionButtonStyle}
                    onClick={() => {
                      setRenameTarget(folder);
                      setRenameValue(folder.name);
                    }}
                  >
                    Renomear
                  </button>
                  <button
                    style={{ ...folderActionButtonStyle, color: "#E8358A" }}
                    onClick={() => setDeleteFolderTarget(folder)}
                  >
                    Excluir
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Planos */}
      <div style={sectionLabelStyle}>
        {selectedFolder ? `Planos em "${selectedFolder.name}"` : "Planos sem pasta"}
      </div>

      {visibleProjects.length === 0 ? (
        <p style={emptyStyle}>
          {selectedFolder
            ? "Nenhum plano nesta pasta ainda. Use “Mover para…” em um plano para trazê-lo para cá."
            : "Nenhum plano por aqui. Crie um plano em branco ou gere uma atividade no painel."}
        </p>
      ) : (
        <div style={gridStyle}>
          {visibleProjects.map((project) => (
            <div key={project.id}>
              <div style={moveRowStyle}>
                <span>Mover para:</span>
                <select
                  style={selectStyle}
                  value={project.folderId || ""}
                  onChange={(event) =>
                    moveProjectToFolder(project.id, event.target.value)
                  }
                >
                  <option value="">Sem pasta</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>
              <ProjectCard
                project={project}
                onClick={() => onOpenProject(project.id)}
                onDelete={() => setDeletePlanTarget(project)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Modal: nova pasta */}
      <Modal
        isOpen={newFolderOpen}
        onClose={() => {
          setNewFolderOpen(false);
          setNewFolderName("");
        }}
        title="Nova pasta"
      >
        <input
          style={inputStyle}
          type="text"
          placeholder="Nome da pasta (ex.: Ciências 6º ano)"
          value={newFolderName}
          autoFocus
          onChange={(event) => setNewFolderName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleCreateFolder();
          }}
        />
        <div style={modalActionsStyle}>
          <Button
            variant="ghost"
            size="small"
            onClick={() => {
              setNewFolderOpen(false);
              setNewFolderName("");
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="small"
            onClick={handleCreateFolder}
            disabled={!newFolderName.trim()}
          >
            Criar pasta
          </Button>
        </div>
      </Modal>

      {/* Modal: renomear pasta */}
      <Modal
        isOpen={Boolean(renameTarget)}
        onClose={() => {
          setRenameTarget(null);
          setRenameValue("");
        }}
        title="Renomear pasta"
      >
        <input
          style={inputStyle}
          type="text"
          value={renameValue}
          autoFocus
          onChange={(event) => setRenameValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleRenameFolder();
          }}
        />
        <div style={modalActionsStyle}>
          <Button
            variant="ghost"
            size="small"
            onClick={() => {
              setRenameTarget(null);
              setRenameValue("");
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="small"
            onClick={handleRenameFolder}
            disabled={!renameValue.trim()}
          >
            Salvar
          </Button>
        </div>
      </Modal>

      {/* Modal: excluir pasta */}
      <Modal
        isOpen={Boolean(deleteFolderTarget)}
        onClose={() => setDeleteFolderTarget(null)}
        title="Excluir pasta"
      >
        <p style={{ color: "rgba(255,255,255,0.7)", marginTop: 0, lineHeight: 1.6 }}>
          A pasta <strong>{deleteFolderTarget?.name}</strong> será excluída. Os
          planos que estão nela <strong>não serão apagados</strong> — eles voltam
          para “Planos sem pasta”.
        </p>
        <div style={modalActionsStyle}>
          <Button
            variant="ghost"
            size="small"
            onClick={() => setDeleteFolderTarget(null)}
          >
            Cancelar
          </Button>
          <Button variant="danger" size="small" onClick={handleDeleteFolder}>
            Excluir pasta
          </Button>
        </div>
      </Modal>

      {/* Modal: excluir plano */}
      <Modal
        isOpen={Boolean(deletePlanTarget)}
        onClose={() => setDeletePlanTarget(null)}
        title="Excluir plano de aula"
      >
        <p style={{ color: "rgba(255,255,255,0.7)", marginTop: 0, lineHeight: 1.6 }}>
          O plano <strong>{deletePlanTarget?.title || "sem título"}</strong> será
          excluído permanentemente. Essa ação não pode ser desfeita.
        </p>
        <div style={modalActionsStyle}>
          <Button
            variant="ghost"
            size="small"
            onClick={() => setDeletePlanTarget(null)}
          >
            Cancelar
          </Button>
          <Button variant="danger" size="small" onClick={handleDeletePlan}>
            Excluir plano
          </Button>
        </div>
      </Modal>
    </div>
  );
}
