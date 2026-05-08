// ============================================================
// Library.jsx
// Biblioteca de projetos STEAM prontos
// ============================================================
//
// Tela onde o professor explora projetos pré-construídos
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

function formatSupabaseError(error) {
  return [
    error?.message,
    error?.details,
    error?.hint,
    error?.code ? `Código: ${error.code}` : ""
  ].filter(Boolean).join(" | ");
}

const THEME_CATEGORIES = [
  {
    id: "all",
    letter: "*",
    name: "Todos",
    description: "Todos os projetos prontos da biblioteca",
    color: "#FFFFFF"
  },
  {
    id: "ambiente",
    letter: "AM",
    name: "Meio ambiente",
    description: "Clima, água, biodiversidade, cidade e sustentabilidade",
    color: "#3FD64C"
  },
  {
    id: "tecnologia",
    letter: "TR",
    name: "Tecnologia e robótica",
    description: "Sensores, automação, energia, programação e protótipos",
    color: "#3B95F2"
  },
  {
    id: "comunicacao",
    letter: "CO",
    name: "Comunicação e mídias",
    description: "Podcast, jornal, inglês, divulgação científica e cultura digital",
    color: "#E8358A"
  },
  {
    id: "territorio",
    letter: "TS",
    name: "Território e sociedade",
    description: "História, cartografia, memória, cultura e diversidade",
    color: "#FF8C1A"
  },
  {
    id: "dados",
    letter: "DM",
    name: "Dados e matemática",
    description: "Estatística, medições, visualização e análise de dados",
    color: "#A050F0"
  },
  {
    id: "saude",
    letter: "SC",
    name: "Saúde e corpo",
    description: "Atividade física, fisiologia, hábitos e qualidade de vida",
    color: "#33D6C6"
  },
  {
    id: "outros",
    letter: "OT",
    name: "Outros temas",
    description: "Projetos da comunidade ou sem tema principal definido",
    color: "#B8C0CC"
  }
];

const PROJECT_THEME_CATEGORY = {
  "lib-estacao-meteorologica": "ambiente",
  "lib-horta-hidroponica": "ambiente",
  "lib-cidade-sustentavel": "ambiente",
  "lib-robo-seguidor": "tecnologia",
  "lib-podcast-cientifico": "comunicacao",
  "lib-agua-potavel": "ambiente",
  "lib-censo-biodiversidade": "ambiente",
  "lib-energia-renovavel": "tecnologia",
  "lib-estatistica-escolar": "dados",
  "lib-memoria-viva": "territorio",
  "lib-cartografia-bairro": "territorio",
  "lib-jornal-escolar": "comunicacao",
  "lib-connecting-cultures": "comunicacao",
  "lib-arte-generativa": "tecnologia",
  "lib-saude-dados": "saude",
  "lib-dialogos-diversidade": "territorio"
};

function getProjectThemeCategory(project) {
  return PROJECT_THEME_CATEGORY[project.id] || "outros";
}

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
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [publicProjects, setPublicProjects] = useState([]);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [creationError, setCreationError] = useState("");

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
  const handleUseTemplate = async (template) => {
    setIsCreatingProject(true);
    setCreationError("");
    try {
      const newProject = await addProjectFromTemplate(template, {
        waitForPersist: true
      });
      setSelectedTemplate(null);
      onOpenProject(newProject.id);
    } catch (error) {
      console.error("Erro ao criar projeto da biblioteca:", error);
      setCreationError(
        `Não foi possível salvar este projeto no Supabase. ${formatSupabaseError(error)}`
      );
    } finally {
      setIsCreatingProject(false);
    }
  };

  const templates = [
    ...LIBRARY,
    ...publicProjects.filter(
      (project) => !LIBRARY.some((template) => template.id === project.id)
    )
  ];

  const themeFilters = THEME_CATEGORIES.map((category) => ({
    ...category,
    count:
      category.id === "all"
        ? templates.length
        : templates.filter(
            (template) => getProjectThemeCategory(template) === category.id
          ).length
  })).filter((category) => category.id === "all" || category.count > 0);

  const filteredTemplates =
    !selectedTheme || selectedTheme === "all"
      ? templates
      : templates.filter(
          (template) => getProjectThemeCategory(template) === selectedTheme
        );

  const selectedThemeLabel =
    selectedTheme === "all"
      ? "Todos os projetos"
      : THEME_CATEGORIES.find((category) => category.id === selectedTheme)?.name;

  const hasSelectedTheme = Boolean(selectedTheme);

  // ----------------------------------------------------------
  // ESTILOS
  // ----------------------------------------------------------
  const containerStyle = {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "2rem 1.5rem"
  };

  const headerStyle = {
    marginBottom: "1.5rem"
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

  const submenuStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "0.75rem",
    marginBottom: "1.5rem"
  };

  const themeButtonStyle = (filter, isActive) => ({
    border: `1px solid ${
      isActive ? filter.color : "rgba(255, 255, 255, 0.1)"
    }`,
    background: isActive
      ? `${filter.color}18`
      : "rgba(255, 255, 255, 0.035)",
    color: "#FFFFFF",
    borderRadius: "8px",
    padding: "1rem",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
    minHeight: hasSelectedTheme ? "96px" : "128px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "0.65rem",
    boxShadow: isActive ? `0 0 0 1px ${filter.color}22` : "none"
  });

  const themeButtonTopStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem"
  };

  const themeLetterStyle = (filter) => ({
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: filter.id === "all" ? "rgba(255,255,255,0.12)" : filter.color,
    color: filter.id === "all" ? "#FFFFFF" : "#071014",
    fontWeight: 800,
    fontSize: "0.85rem",
    flexShrink: 0
  });

  const themeNameStyle = {
    fontSize: "0.9rem",
    fontWeight: 700,
    lineHeight: 1.2,
    margin: 0
  };

  const themeCountStyle = {
    fontSize: "0.75rem",
    color: "rgba(255, 255, 255, 0.55)",
    whiteSpace: "nowrap"
  };

  const themeDescriptionStyle = {
    fontSize: "0.75rem",
    color: "rgba(255, 255, 255, 0.55)",
    lineHeight: 1.35,
    margin: 0
  };

  const libraryStatusStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "1rem",
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: "0.85rem"
  };

  const submenuHeaderStyle = {
    marginBottom: "1rem"
  };

  const submenuTitleStyle = {
    color: "#FFFFFF",
    fontSize: "1.15rem",
    fontWeight: 700,
    margin: 0
  };

  const submenuTextStyle = {
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: "0.9rem",
    lineHeight: 1.55,
    margin: "0.25rem 0 0",
    maxWidth: "760px"
  };

  const backToAreasButtonStyle = {
    background: "transparent",
    border: "none",
    color: "rgba(255, 255, 255, 0.6)",
    cursor: "pointer",
    fontSize: "0.85rem",
    padding: 0,
    fontFamily: "inherit"
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
    flexWrap: "wrap",
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
          Projetos prontos para começar. Cada projeto pode ser
          usado como está ou adaptado à realidade da sua turma.
          Escolha um e personalize livremente.
        </p>
      </div>

      {/* Submenu por tema */}
      <div style={submenuHeaderStyle}>
        <h2 style={submenuTitleStyle}>
          {hasSelectedTheme ? "Projetos prontos por tema" : "Escolha um tema"}
        </h2>
        <p style={submenuTextStyle}>
          {hasSelectedTheme
            ? "Troque de tema a qualquer momento ou abra um projeto para ver objetivos, BNCC, materiais e referências."
            : "Selecione um tema para encontrar exemplos prontos organizados pelo assunto principal do projeto."}
        </p>
      </div>

      <div style={submenuStyle} aria-label="Filtrar projetos por tema">
        {themeFilters.map((filter) => {
          const isActive = selectedTheme === filter.id;

          return (
            <button
              key={filter.id}
              type="button"
              style={themeButtonStyle(filter, isActive)}
              onClick={() => setSelectedTheme(filter.id)}
              aria-pressed={isActive}
            >
              <span style={themeButtonTopStyle}>
                <span style={themeLetterStyle(filter)}>{filter.letter}</span>
                <span style={themeCountStyle}>
                  {filter.count} {filter.count === 1 ? "projeto" : "projetos"}
                </span>
              </span>
              <span>
                <p style={themeNameStyle}>{filter.name}</p>
                <p style={themeDescriptionStyle}>{filter.description}</p>
              </span>
            </button>
          );
        })}
      </div>

      {hasSelectedTheme && (
        <>
          <div style={libraryStatusStyle}>
            <button
              type="button"
              style={backToAreasButtonStyle}
              onClick={() => setSelectedTheme(null)}
            >
              ← Voltar ao menu de temas
            </button>
            <span>
              {selectedThemeLabel} · {filteredTemplates.length}{" "}
              {filteredTemplates.length === 1
                ? "projeto pronto"
                : "projetos prontos"}
            </span>
          </div>

          {/* Grade com os cards dos projetos da biblioteca */}
          <div style={gridStyle}>
            {filteredTemplates.map((template) => (
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
                    {(template.bibliography?.length || 0) > 0 && (
                      <>
                        <span>·</span>
                        <span>{template.bibliography.length} referências</span>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

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

            {(selectedTemplate.bibliography?.length || 0) > 0 && (
              <div style={modalSectionStyle}>
                <div style={modalSectionTitleStyle}>
                  Referências para o professor
                </div>
                <ul style={modalListStyle}>
                  {selectedTemplate.bibliography.map((reference, index) => (
                    <li key={index}>{reference}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Ações no rodapé do modal */}
            {creationError && (
              <p style={{ color: "#FF8A8A", fontSize: "0.9rem" }}>
                {creationError}
              </p>
            )}
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
                disabled={isCreatingProject}
              >
                {isCreatingProject ? "Criando..." : "Usar este projeto"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
