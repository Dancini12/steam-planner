// ============================================================
// Library.jsx
// Biblioteca de projetos STEAM prontos
// ============================================================
//
// Tela onde o professor explora os 6 projetos pré-construídos
// da biblioteca e escolhe um para usar como ponto de partida.
//
// Cada projeto é apresentado em um card detalhado com toda
// a informação relevante para a decisão. Ao clicar em "Usar
// este projeto", uma cópia editável é criada e o professor
// é levado direto para a tela de edição.
// ============================================================

import { useEffect, useState } from "react";
import { LIBRARY } from "../data/library.js";
import { useProjects } from "../hooks/useProjects.js";
import { loadPublicProjects } from "../lib/storage.js";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Modal from "../components/ui/Modal.jsx";
import SteamBadges from "../components/project/SteamBadges.jsx";

// ------------------------------------------------------------
// COMPONENTE LIBRARY
// ------------------------------------------------------------
// Propriedades:
// - onBack        : função para voltar ao dashboard
// - onOpenProject : função chamada após criar projeto da biblioteca
// ------------------------------------------------------------
export default function Library({ currentUser, onBack, onOpenProject }) {
  // Estado: qual projeto da biblioteca está selecionado para visualização
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [publicProjects, setPublicProjects] = useState([]);

  // Hook que cria projetos
  const { addProjectFromTemplate } = useProjects(currentUser?.id);

  useEffect(() => {
    let isCurrent = true;

    async function loadCommunityProjects() {
      const loaded = await loadPublicProjects(currentUser?.id);
      if (!isCurrent) return;
      setPublicProjects(loaded);
    }

    loadCommunityProjects();

    return () => {
      isCurrent = false;
    };
  }, [currentUser?.id]);

  // Cria projeto a partir do template e abre direto na edição
  const handleUseTemplate = (template) => {
    const newProject = addProjectFromTemplate(template);
    setSelectedTemplate(null);
    onOpenProject(newProject.id);
  };

  const templates = [
    ...LIBRARY,
    ...publicProjects.filter(
      (project) => !LIBRARY.some((template) => template.id === project.id)
    )
  ];

  // ----------------------------------------------------------
  // ESTILOS
  // ----------------------------------------------------------
  const containerStyle = {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "2rem 1.5rem"
  };

  const headerStyle = {
    marginBottom: "2.5rem"
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
    lineHeight: 1.6,
    maxWidth: "700px"
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: "1.25rem"
  };

  const cardContentStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "0.85rem"
  };

  const cardHeaderStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "1rem"
  };

  const cardTitleStyle = {
    fontSize: "1.05rem",
    fontWeight: 600,
    color: "#FFFFFF",
    margin: 0,
    lineHeight: 1.3
  };

  const cardThemeStyle = {
    fontSize: "0.85rem",
    color: "rgba(255, 255, 255, 0.5)",
    fontStyle: "italic",
    margin: "0.25rem 0 0"
  };

  const cardMetaStyle = {
    display: "flex",
    gap: "1rem",
    fontSize: "0.8rem",
    color: "rgba(255, 255, 255, 0.6)"
  };

  const cardQuestionStyle = {
    fontSize: "0.9rem",
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: 1.5,
    background: "rgba(107, 47, 224, 0.08)",
    borderLeft: "2px solid #6B2FE0",
    padding: "0.6rem 0.75rem",
    borderRadius: "4px",
    margin: 0
  };

  const cardFooterStyle = {
    display: "flex",
    gap: "1rem",
    fontSize: "0.75rem",
    color: "rgba(255, 255, 255, 0.4)",
    marginTop: "0.25rem"
  };

  // Estilos do modal de detalhes
  const modalSectionStyle = {
    marginBottom: "1.5rem"
  };

  const modalSectionTitleStyle = {
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: 600,
    marginBottom: "0.5rem"
  };

  const modalListStyle = {
    margin: 0,
    paddingLeft: "1.25rem",
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: 1.6,
    fontSize: "0.9rem"
  };

  const modalActionsStyle = {
    display: "flex",
    gap: "0.75rem",
    justifyContent: "flex-end",
    marginTop: "1.5rem",
    paddingTop: "1rem",
    borderTop: "1px solid rgba(255, 255, 255, 0.06)"
  };

  // ----------------------------------------------------------
  // RENDERIZAÇÃO
  // ----------------------------------------------------------
  return (
    <div style={containerStyle}>
      {/* Cabeçalho com botão voltar e título */}
      <div style={headerStyle}>
        <button style={backButtonStyle} onClick={onBack}>
          ← Voltar para projetos
        </button>
        <h1 style={titleStyle}>Biblioteca de Projetos STEAM</h1>
        <p style={subtitleStyle}>
          Seis projetos prontos para começar. Cada projeto pode ser
          usado como está ou adaptado à realidade da sua turma.
          Escolha um e personalize livremente.
        </p>
      </div>

      {/* Grade com os cards dos projetos da biblioteca */}
      <div style={gridStyle}>
        {templates.map((template) => (
          <Card
            key={template.id}
            variant="clickable"
            onClick={() => setSelectedTemplate(template)}
          >
            <div style={cardContentStyle}>
              {/* Topo: título, tema e selos STEAM */}
              <div style={cardHeaderStyle}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={cardTitleStyle}>{template.title}</h3>
                  <p style={cardThemeStyle}>{template.theme}</p>
                </div>
                <SteamBadges areas={template.steam} size="small" />
              </div>

              {/* Ano e duração */}
              <div style={cardMetaStyle}>
                <span>{template.grade}</span>
                <span>·</span>
                <span>{template.duration}</span>
              </div>

              {/* Questão norteadora destacada */}
              <p style={cardQuestionStyle}>{template.guidingQuestion}</p>

              {/* Rodapé com contadores */}
              <div style={cardFooterStyle}>
                <span>{template.objectives.length} objetivos</span>
                <span>·</span>
                <span>{template.bncc.length} habilidades BNCC</span>
                <span>·</span>
                <span>{template.materials.length} materiais</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal com detalhes completos do projeto selecionado */}
      <Modal
        isOpen={selectedTemplate !== null}
        onClose={() => setSelectedTemplate(null)}
        title={selectedTemplate?.title || ""}
        maxWidth="700px"
      >
        {selectedTemplate && (
          <div>
            {/* Informações principais */}
            <div style={modalSectionStyle}>
              <p style={cardThemeStyle}>{selectedTemplate.theme}</p>
              <div style={{ ...cardMetaStyle, marginTop: "0.75rem" }}>
                <span>{selectedTemplate.grade}</span>
                <span>·</span>
                <span>{selectedTemplate.duration}</span>
              </div>
              <div style={{ marginTop: "1rem" }}>
                <SteamBadges
                  areas={selectedTemplate.steam}
                  size="medium"
                  showName
                />
              </div>
            </div>

            {/* Questão norteadora */}
            <div style={modalSectionStyle}>
              <div style={modalSectionTitleStyle}>Questão norteadora</div>
              <p style={cardQuestionStyle}>
                {selectedTemplate.guidingQuestion}
              </p>
            </div>

            {/* Objetivos pedagógicos */}
            <div style={modalSectionStyle}>
              <div style={modalSectionTitleStyle}>Objetivos pedagógicos</div>
              <ul style={modalListStyle}>
                {selectedTemplate.objectives.map((obj, index) => (
                  <li key={index}>{obj}</li>
                ))}
              </ul>
            </div>

            {/* Habilidades BNCC */}
            <div style={modalSectionStyle}>
              <div style={modalSectionTitleStyle}>Habilidades BNCC</div>
              <p
                style={{
                  ...modalListStyle,
                  paddingLeft: 0,
                  fontFamily: "monospace",
                  fontSize: "0.85rem"
                }}
              >
                {selectedTemplate.bncc.join(" · ")}
              </p>
            </div>

            {/* Materiais necessários */}
            <div style={modalSectionStyle}>
              <div style={modalSectionTitleStyle}>Materiais necessários</div>
              <ul style={modalListStyle}>
                {selectedTemplate.materials.map((mat, index) => (
                  <li key={index}>{mat}</li>
                ))}
              </ul>
            </div>

            {/* Ações no rodapé do modal */}
            <div style={modalActionsStyle}>
              <Button
                variant="secondary"
                onClick={() => setSelectedTemplate(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={() => handleUseTemplate(selectedTemplate)}
              >
                Usar este projeto
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
