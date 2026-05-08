// ============================================================
// Dashboard.jsx
// Tela inicial do app - lista projetos do professor
// ============================================================
//
// Esta é a primeira tela que o professor vê ao abrir o app.
// Mostra a lista de todos os projetos criados, com opções
// para abrir, editar, excluir ou criar novo projeto.
//
// Caminhos de criação disponíveis:
// 1. Criar projeto em branco (manual)
// 2. Explorar biblioteca (escolher modelo pronto)
// 3. Gerar com IA (Gemini gera proposta inicial)
//
// Quando vazio, exibe um estado de boas-vindas convidando
// o professor a criar o primeiro projeto.
// ============================================================

import { useEffect, useState } from "react";
import { useProjects } from "../hooks/useProjects.js";

import Button from "../components/ui/Button.jsx";
import Modal from "../components/ui/Modal.jsx";
import ProjectCard from "../components/project/ProjectCard.jsx";
import AIGeneratorModal from "../components/project/AIGeneratorModal.jsx";

function formatSupabaseError(error) {
  return [
    error?.message,
    error?.details,
    error?.hint,
    error?.code ? `Código: ${error.code}` : ""
  ].filter(Boolean).join(" | ");
}

// ------------------------------------------------------------
// COMPONENTE DASHBOARD
// ------------------------------------------------------------
// Propriedades:
// - onOpenProject : função chamada ao clicar em um projeto
// - onOpenLibrary : função chamada ao clicar em "biblioteca"
// ------------------------------------------------------------

export default function Dashboard({
  currentUser,
  onLogout,
  onOpenProject,
  onOpenLibrary
}) {
  const { projects, addBlankProject, addProjectFromTemplate, removeProject, isLoaded } =
    useProjects(currentUser?.id);

  // Estado: modal de confirmação de exclusão
  const [projectToDelete, setProjectToDelete] = useState(null);

  // Estado: modal de geração via IA
  const [showAIModal, setShowAIModal] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [creationError, setCreationError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [pendingSaveConfirmation, setPendingSaveConfirmation] = useState(false);
  const [saveConfirmationMessage, setSaveConfirmationMessage] = useState("");

  useEffect(() => {
    if (!isLoaded) return;
    console.log("Dados recebidos:", projects);
  }, [isLoaded, projects]);

  useEffect(() => {
    if (!pendingSaveConfirmation) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [pendingSaveConfirmation]);

  const markPendingSaveConfirmation = (message) => {
    setPendingSaveConfirmation(true);
    setSaveConfirmationMessage(message);
  };

  const handleConfirmSave = () => {
    setPendingSaveConfirmation(false);
    setSaveConfirmationMessage("Alterações confirmadas com segurança.");
  };

  const confirmPendingSaveBefore = (nextAction) => {
    if (!pendingSaveConfirmation) {
      nextAction();
      return;
    }

    const shouldSave = window.confirm(
      "Você ainda não confirmou o salvamento das últimas alterações. Deseja salvar/confirmar agora?"
    );

    if (shouldSave) {
      handleConfirmSave();
      nextAction();
    }
  };

  const handleLogoutClick = () => {
    confirmPendingSaveBefore(onLogout);
  };

  const handleOpenLibraryClick = () => {
    confirmPendingSaveBefore(onOpenLibrary);
  };

  const handleOpenProjectClick = (projectId) => {
    confirmPendingSaveBefore(() => onOpenProject(projectId));
  };

  const handleShowAIModal = () => {
    confirmPendingSaveBefore(() => setShowAIModal(true));
  };

  // Cria projeto em branco e abre direto na edição
  const handleCreateBlank = async () => {
    setIsCreatingProject(true);
    setCreationError("");
    try {
      const newProject = await addBlankProject({ waitForPersist: true });
      onOpenProject(newProject.id);
    } catch (error) {
      console.error("Erro ao criar projeto em branco:", error);
      setCreationError(
        `Não foi possível salvar o projeto no Supabase. ${formatSupabaseError(error)}`
      );
    } finally {
      setIsCreatingProject(false);
    }
  };

  // Abre confirmação de exclusão
  const handleRequestDelete = (projectId) => {
    setProjectToDelete(projectId);
  };

  // Confirma e executa exclusão
  const handleConfirmDelete = async () => {
    if (projectToDelete) {
      setDeleteError("");
      setIsDeletingProject(true);
      try {
        await removeProject(projectToDelete);
        markPendingSaveConfirmation(
          "Projeto excluído no Supabase. Clique em Salvar alterações para confirmar."
        );
        setProjectToDelete(null);
      } catch (error) {
        console.error("Erro ao excluir projeto:", error);
        setDeleteError(
          `Não foi possível excluir o projeto no Supabase. ${formatSupabaseError(error)}`
        );
      } finally {
        setIsDeletingProject(false);
      }
    }
  };

  // Recebe projeto gerado pela IA e cria no app
  const handleAIProjectGenerated = async (generatedProject) => {
    // Usa addProjectFromTemplate porque o projeto da IA tem
    // a mesma estrutura de um template da biblioteca
    setIsCreatingProject(true);
    setCreationError("");
    try {
      const newProject = await addProjectFromTemplate(
        {
          ...generatedProject,
          source: "ai"
        },
        { waitForPersist: true }
      );
      setShowAIModal(false);
      markPendingSaveConfirmation(
        "Projeto criado no Supabase. Clique em Salvar alterações para confirmar."
      );
      onOpenProject(newProject.id);
    } catch (error) {
      console.error("Erro ao criar projeto gerado por IA:", error);
      setCreationError(
        `Não foi possível salvar o projeto no Supabase. ${formatSupabaseError(error)}`
      );
    } finally {
      setIsCreatingProject(false);
    }
  };

  // ----------------------------------------------------------
  // ESTILOS
  // ----------------------------------------------------------

  const containerStyle = {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "2.5rem 1.5rem"
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "2.5rem",
    flexWrap: "wrap",
    gap: "1rem"
  };

  const titleStyle = {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#FFFFFF",
    margin: 0,
    letterSpacing: "-0.02em"
  };

  const subtitleStyle = {
    fontSize: "0.95rem",
    color: "rgba(255, 255, 255, 0.55)",
    margin: "0.5rem 0 0"
  };

  const actionsStyle = {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap"
  };

  const userBarStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "1.5rem",
    flexWrap: "wrap"
  };

  const userTextStyle = {
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: "0.9rem"
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "1.25rem"
  };

  // Estado vazio (sem projetos ainda)
  const emptyStateStyle = {
    textAlign: "center",
    padding: "4rem 2rem",
    border: "1px dashed rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    background: "rgba(255, 255, 255, 0.02)"
  };

  const emptyTitleStyle = {
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "#FFFFFF",
    marginBottom: "0.5rem"
  };

  const emptyTextStyle = {
    fontSize: "0.95rem",
    color: "rgba(255, 255, 255, 0.5)",
    marginBottom: "2rem",
    lineHeight: 1.6,
    maxWidth: "500px",
    margin: "0 auto 2rem"
  };

  const emptyActionsStyle = {
    display: "flex",
    gap: "0.75rem",
    justifyContent: "center",
    flexWrap: "wrap"
  };

  const saveAlertStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
    padding: "0.9rem 1rem",
    marginBottom: "1rem",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "10px",
    background: "rgba(107, 47, 224, 0.12)",
    color: "rgba(255, 255, 255, 0.82)",
    fontSize: "0.9rem",
    flexWrap: "wrap"
  };

  // ----------------------------------------------------------
  // RENDERIZAÇÃO
  // ----------------------------------------------------------

  if (!isLoaded) {
    return (
      <div style={containerStyle}>
        <p style={{ color: "rgba(255, 255, 255, 0.5)" }}>Carregando...</p>
      </div>
    );
  }

  const hasProjects = projects.length > 0;

  return (
    <div style={containerStyle}>
      <div style={userBarStyle}>
        <div style={userTextStyle}>
          {currentUser?.name || currentUser?.email}
        </div>
        <div style={actionsStyle}>
          <Button variant="ghost" onClick={handleLogoutClick}>
            Sair
          </Button>
        </div>
      </div>

      {/* Cabeçalho */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Meus Projetos STEAM</h1>
          <p style={subtitleStyle}>
            {hasProjects
              ? `${projects.length} ${
                  projects.length === 1 ? "projeto" : "projetos"
                } no total`
              : "Comece criando seu primeiro projeto"}
          </p>
        </div>

        {hasProjects && (
          <div style={actionsStyle}>
            <Button variant="ghost" onClick={handleOpenLibraryClick}>
              Biblioteca
            </Button>
            <Button variant="secondary" onClick={handleShowAIModal}>
              ✨ Gerar com IA
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateBlank}
              disabled={isCreatingProject}
            >
              {isCreatingProject ? "Criando..." : "+ Novo projeto"}
            </Button>
          </div>
        )}
      </div>

      {/* Lista de projetos ou estado vazio */}
      {creationError && (
        <p style={{ color: "#FF8A8A", marginBottom: "1rem" }}>
          {creationError}
        </p>
      )}

      {(pendingSaveConfirmation || saveConfirmationMessage) && (
        <div style={saveAlertStyle}>
          <span>{saveConfirmationMessage}</span>
          {pendingSaveConfirmation && (
            <Button variant="primary" size="small" onClick={handleConfirmSave}>
              Salvar alterações
            </Button>
          )}
        </div>
      )}

      {hasProjects ? (
        <div style={gridStyle}>
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => handleOpenProjectClick(project.id)}
              onDelete={() => handleRequestDelete(project.id)}
            />
          ))}
        </div>
      ) : (
        <div style={emptyStateStyle}>
          <div style={emptyTitleStyle}>Nenhum projeto encontrado</div>
          <p style={emptyTextStyle}>
            Crie um projeto do zero, escolha um modelo pronto na biblioteca
            ou peça à IA uma sugestão inicial baseada num tema.
          </p>
          <div style={emptyActionsStyle}>
            <Button
              variant="primary"
              onClick={handleCreateBlank}
              disabled={isCreatingProject}
            >
              {isCreatingProject ? "Criando..." : "+ Criar projeto em branco"}
            </Button>
            <Button variant="secondary" onClick={handleShowAIModal}>
              ✨ Gerar com IA
            </Button>
            <Button variant="ghost" onClick={handleOpenLibraryClick}>
              Explorar biblioteca
            </Button>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      <Modal
        isOpen={projectToDelete !== null}
        onClose={() => setProjectToDelete(null)}
        title="Excluir projeto"
        maxWidth="450px"
      >
        <div>
          <p
            style={{
              color: "rgba(255, 255, 255, 0.7)",
              lineHeight: 1.5,
              marginBottom: "1.5rem"
            }}
          >
            Tem certeza que deseja excluir este projeto? Todos os dados,
            registros do diário e avaliações serão perdidos. Esta ação
            não pode ser desfeita.
          </p>
          {deleteError && (
            <p style={{ color: "#FF8A8A", marginBottom: "1rem" }}>
              {deleteError}
            </p>
          )}
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "flex-end"
            }}
          >
            <Button
              variant="secondary"
              onClick={() => setProjectToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={isDeletingProject}
            >
              {isDeletingProject ? "Excluindo..." : "Excluir definitivamente"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de geração via IA */}
      <AIGeneratorModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onProjectGenerated={handleAIProjectGenerated}
      />
    </div>
  );
}
