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

  useEffect(() => {
    if (!isLoaded) return;
    console.log("Dados recebidos:", projects);
  }, [isLoaded, projects]);

  // Cria projeto em branco e abre direto na edição
  const handleCreateBlank = () => {
    const newProject = addBlankProject();
    onOpenProject(newProject.id);
  };

  // Abre confirmação de exclusão
  const handleRequestDelete = (projectId) => {
    setProjectToDelete(projectId);
  };

  // Confirma e executa exclusão
  const handleConfirmDelete = () => {
    if (projectToDelete) {
      removeProject(projectToDelete);
      setProjectToDelete(null);
    }
  };

  // Recebe projeto gerado pela IA e cria no app
  const handleAIProjectGenerated = (generatedProject) => {
    // Usa addProjectFromTemplate porque o projeto da IA tem
    // a mesma estrutura de um template da biblioteca
    const newProject = addProjectFromTemplate({
      ...generatedProject,
      source: "ai"
    });
    setShowAIModal(false);
    // Aguarda o React processar o estado antes de navegar
    // (caso contrário, ProjectEditor não acha o projeto na lista)
    setTimeout(() => {
      onOpenProject(newProject.id);
    }, 50);
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
          <Button variant="ghost" onClick={onLogout}>
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
            <Button variant="ghost" onClick={onOpenLibrary}>
              Biblioteca
            </Button>
            <Button variant="secondary" onClick={() => setShowAIModal(true)}>
              ✨ Gerar com IA
            </Button>
            <Button variant="primary" onClick={handleCreateBlank}>
              + Novo projeto
            </Button>
          </div>
        )}
      </div>

      {/* Lista de projetos ou estado vazio */}
      {hasProjects ? (
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
      ) : (
        <div style={emptyStateStyle}>
          <div style={emptyTitleStyle}>Nenhum projeto encontrado</div>
          <p style={emptyTextStyle}>
            Crie um projeto do zero, escolha um modelo pronto na biblioteca
            ou peça à IA uma sugestão inicial baseada num tema.
          </p>
          <div style={emptyActionsStyle}>
            <Button variant="primary" onClick={handleCreateBlank}>
              + Criar projeto em branco
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
            <Button variant="danger" onClick={handleConfirmDelete}>
              Excluir definitivamente
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
