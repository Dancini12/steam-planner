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

  useEffect(() => {
    if (!isLoaded) return;
    console.log("Dados recebidos:", projects);
  }, [isLoaded, projects]);

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
    padding: "2rem 1.5rem 3rem"
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "stretch",
    marginBottom: "1.5rem",
    flexWrap: "wrap",
    gap: "1rem",
    padding: "1.5rem",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "16px",
    background:
      "linear-gradient(135deg, rgba(107, 47, 224, 0.22), rgba(232, 53, 138, 0.08) 48%, rgba(63, 214, 76, 0.08))",
    boxShadow: "0 18px 48px rgba(0, 0, 0, 0.16)"
  };

  const heroCopyStyle = {
    flex: "1 1 430px",
    minWidth: 0
  };

  const eyebrowStyle = {
    color: "#BCA8FF",
    fontSize: "0.78rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "0.65rem"
  };

  const titleStyle = {
    fontSize: "clamp(2rem, 4vw, 3.25rem)",
    fontWeight: 800,
    color: "#FFFFFF",
    margin: 0,
    lineHeight: 1.03,
    letterSpacing: 0
  };

  const subtitleStyle = {
    fontSize: "1rem",
    color: "rgba(255, 255, 255, 0.72)",
    margin: "0.75rem 0 0",
    lineHeight: 1.65,
    maxWidth: "620px"
  };

  const heroPanelStyle = {
    flex: "0 1 330px",
    minWidth: "280px",
    display: "grid",
    gap: "0.75rem",
    alignContent: "center"
  };

  const statsGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "0.6rem"
  };

  const statBoxStyle = {
    padding: "0.75rem",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "10px",
    background: "rgba(10, 10, 31, 0.28)"
  };

  const statValueStyle = {
    color: "#FFFFFF",
    fontSize: "1.2rem",
    fontWeight: 800,
    lineHeight: 1
  };

  const statLabelStyle = {
    color: "rgba(255, 255, 255, 0.56)",
    fontSize: "0.72rem",
    marginTop: "0.35rem",
    lineHeight: 1.25
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
    marginBottom: "1rem",
    flexWrap: "wrap"
  };

  const userTextStyle = {
    color: "rgba(255, 255, 255, 0.68)",
    fontSize: "0.9rem",
    fontWeight: 600
  };

  const sectionHeaderStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
    margin: "1.5rem 0 1rem",
    flexWrap: "wrap"
  };

  const sectionTitleStyle = {
    color: "#FFFFFF",
    fontSize: "1.05rem",
    fontWeight: 700,
    margin: 0
  };

  const sectionTextStyle = {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: "0.85rem",
    margin: "0.25rem 0 0"
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "1.25rem"
  };

  // Estado vazio (sem projetos ainda)
  const emptyStateStyle = {
    textAlign: "center",
    padding: "3rem 2rem",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "16px",
    background:
      "linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.018))"
  };

  const emptyTitleStyle = {
    fontSize: "1.5rem",
    fontWeight: 800,
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
  const totalReferences = projects.reduce(
    (total, project) => total + (project.bibliography?.length || 0),
    0
  );
  const userName = currentUser?.name || currentUser?.email || "professor";

  return (
    <div style={containerStyle}>
      <div style={userBarStyle}>
        <div style={userTextStyle}>
          Olá, {userName}
        </div>
        <div style={actionsStyle}>
          <Button variant="ghost" onClick={onLogout}>
            Sair
          </Button>
        </div>
      </div>

      {/* Cabeçalho */}
      <div style={headerStyle}>
        <div style={heroCopyStyle}>
          <div style={eyebrowStyle}>STEAM Planner</div>
          <h1 style={titleStyle}>Planeje experiências STEAM com clareza.</h1>
          <p style={subtitleStyle}>
            {hasProjects
              ? "Continue seus projetos, explore modelos temáticos ou gere uma nova proposta para adaptar à sua turma."
              : "Comece com um projeto em branco, use um modelo pronto por tema ou peça uma sugestão inicial à IA."}
          </p>
        </div>

        <div style={heroPanelStyle}>
          <div style={statsGridStyle}>
            <div style={statBoxStyle}>
              <div style={statValueStyle}>{projects.length}</div>
              <div style={statLabelStyle}>
                {projects.length === 1 ? "projeto" : "projetos"}
              </div>
            </div>
            <div style={statBoxStyle}>
              <div style={statValueStyle}>16</div>
              <div style={statLabelStyle}>modelos prontos</div>
            </div>
            <div style={statBoxStyle}>
              <div style={statValueStyle}>{totalReferences}</div>
              <div style={statLabelStyle}>referências salvas</div>
            </div>
          </div>
          <div style={actionsStyle}>
            <Button
              variant="primary"
              size="large"
              onClick={handleCreateBlank}
              disabled={isCreatingProject}
            >
              {isCreatingProject ? "Criando..." : "+ Novo projeto"}
            </Button>
            <Button variant="secondary" size="large" onClick={onOpenLibrary}>
              Biblioteca
            </Button>
            <Button
              variant="ghost"
              size="large"
              onClick={() => setShowAIModal(true)}
            >
              Gerar com IA
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de projetos ou estado vazio */}
      {creationError && (
        <p style={{ color: "#FF8A8A", marginBottom: "1rem" }}>
          {creationError}
        </p>
      )}

      {hasProjects ? (
        <>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Projetos em andamento</h2>
              <p style={sectionTextStyle}>
                Abra um projeto para registrar fases, avaliações e referências.
              </p>
            </div>
          </div>
          <div style={gridStyle}>
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => onOpenProject(project.id)}
                onDelete={() => handleRequestDelete(project.id)}
              />
            ))}
          </div>
        </>
      ) : (
        <div style={emptyStateStyle}>
          <div style={emptyTitleStyle}>Escolha seu ponto de partida</div>
          <p style={emptyTextStyle}>
            Você pode começar do zero, adaptar um exemplo da biblioteca temática
            ou gerar uma proposta inicial para refinar com sua turma.
          </p>
          <div style={emptyActionsStyle}>
            <Button
              variant="primary"
              onClick={handleCreateBlank}
              disabled={isCreatingProject}
            >
              {isCreatingProject ? "Criando..." : "+ Criar projeto em branco"}
            </Button>
            <Button variant="secondary" onClick={() => setShowAIModal(true)}>
              ✨ Gerar com IA
            </Button>
            <Button variant="ghost" onClick={onOpenLibrary}>
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
