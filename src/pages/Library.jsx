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

const DISCIPLINE_CATEGORIES = [
  {
    id: "all",
    letter: "*",
    name: "Todos",
    description: "Todos os projetos prontos da biblioteca",
    color: "#FFFFFF"
  },
  {
    id: "portugues",
    letter: "LP",
    name: "Língua Portuguesa",
    description: "Leitura, escrita, oralidade, mídia e produção textual maker",
    color: "#E8358A"
  },
  {
    id: "matematica",
    letter: "MT",
    name: "Matemática",
    description: "Dados, geometria, educação financeira, medidas e modelagem",
    color: "#A050F0"
  },
  {
    id: "historia",
    letter: "HI",
    name: "História",
    description: "Memória, patrimônio, cultura material e narrativas históricas",
    color: "#FF8C1A"
  },
  {
    id: "geografia",
    letter: "GE",
    name: "Geografia",
    description: "Território, mapas, clima, mobilidade e sustentabilidade local",
    color: "#3B95F2"
  },
  {
    id: "ciencias",
    letter: "CI",
    name: "Ciências",
    description: "Investigação, ambiente, saúde, energia, sensores e experimentos",
    color: "#3FD64C"
  },
  {
    id: "arte",
    letter: "AR",
    name: "Arte",
    description: "Criação visual, design, som, audiovisual e exposições maker",
    color: "#F5B841"
  },
  {
    id: "educacao-fisica",
    letter: "EF",
    name: "Educação Física",
    description: "Corpo, movimento, saúde, jogos, inclusão e bem-estar",
    color: "#33D6C6"
  },
  {
    id: "ingles",
    letter: "LI",
    name: "Língua Inglesa",
    description: "Comunicação intercultural, apresentações, vídeos e inglês maker",
    color: "#7C83FF"
  }
];

const PROJECT_DISCIPLINE_CATEGORY = {
  "lib-podcast-cientifico": "portugues",
  "lib-jornal-escolar": "portugues",
  "lib-video-divulgacao-cientifica": "portugues",
  "lib-campanha-fake-news": "portugues",
  "lib-fanzine-steam": "portugues",
  "lib-radio-recreio": "portugues",
  "lib-storytelling-dados": "portugues",
  "lib-indice-leitura": "portugues",
  "lib-chatbot-biblioteca": "portugues",
  "lib-app-agenda-estudos": "portugues",
  "lib-estatistica-escolar": "matematica",
  "lib-orcamento-feira": "matematica",
  "lib-pesquisa-alimentacao": "matematica",
  "lib-geometria-quadra": "matematica",
  "lib-probabilidade-jogos": "matematica",
  "lib-matematica-transporte": "matematica",
  "lib-simulador-juros": "matematica",
  "lib-dashboard-biblioteca": "matematica",
  "lib-ponte-palitos": "matematica",
  "lib-robo-seguidor": "matematica",
  "lib-memoria-viva": "historia",
  "lib-dialogos-diversidade": "historia",
  "lib-linha-tempo-bairro": "historia",
  "lib-patrimonio-imaterial": "historia",
  "lib-museu-virtual-escola": "historia",
  "lib-atlas-cultural-digital": "historia",
  "lib-mapa-afetivo-escola": "historia",
  "lib-arqueologia-objetos": "historia",
  "lib-cartas-para-passado": "historia",
  "lib-mulheres-ciencia-historia": "historia",
  "lib-cidade-sustentavel": "geografia",
  "lib-cartografia-bairro": "geografia",
  "lib-ilhas-calor-escola": "geografia",
  "lib-consumo-agua-escola": "geografia",
  "lib-rotas-seguras": "geografia",
  "lib-demografia-bairro": "geografia",
  "lib-guia-turistico-bilingue": "geografia",
  "lib-energia-renovavel": "geografia",
  "lib-bacias-hidrograficas": "geografia",
  "lib-mapa-riscos-ambientais": "geografia",
  "lib-estacao-meteorologica": "ciencias",
  "lib-horta-hidroponica": "ciencias",
  "lib-agua-potavel": "ciencias",
  "lib-censo-biodiversidade": "ciencias",
  "lib-compostagem-escolar": "ciencias",
  "lib-jardim-polinizadores": "ciencias",
  "lib-qualidade-ar-sala": "ciencias",
  "lib-irrigacao-automatizada": "ciencias",
  "lib-alimentacao-cores": "ciencias",
  "lib-mapa-ruido-escola": "ciencias",
  "lib-arte-generativa": "arte",
  "lib-exposicao-fotografica-ciencia": "arte",
  "lib-casa-inteligente-maquete": "arte",
  "lib-jogo-reciclagem": "arte",
  "lib-semaforo-acessivel": "arte",
  "lib-mural-interativo": "arte",
  "lib-stop-motion-cientifico": "arte",
  "lib-instrumentos-reciclados": "arte",
  "lib-cenografia-feira": "arte",
  "lib-design-embalagem-sustentavel": "arte",
  "lib-saude-dados": "educacao-fisica",
  "lib-censo-esportivo": "educacao-fisica",
  "lib-sono-aprendizagem": "educacao-fisica",
  "lib-ergonomia-mochila": "educacao-fisica",
  "lib-hidratacao-esporte": "educacao-fisica",
  "lib-pausa-ativa": "educacao-fisica",
  "lib-frequencia-cardiaca": "educacao-fisica",
  "lib-saude-mental-campanha": "educacao-fisica",
  "lib-acessibilidade-esporte": "educacao-fisica",
  "lib-primeiros-socorros": "educacao-fisica",
  "lib-connecting-cultures": "ingles",
  "lib-english-weather-report": "ingles",
  "lib-english-maker-manual": "ingles",
  "lib-english-eco-campaign": "ingles",
  "lib-english-board-game": "ingles",
  "lib-english-virtual-tour": "ingles",
  "lib-english-podcast": "ingles",
  "lib-english-recipe-video": "ingles",
  "lib-english-postcards": "ingles",
  "lib-english-science-pitch": "ingles"
};

function getProjectDisciplineCategory(project) {
  return PROJECT_DISCIPLINE_CATEGORY[project.id] || "all";
}

// ------------------------------------------------------------
// COMPONENTE LIBRARY
// ------------------------------------------------------------
// Propriedades:
// - onBack        : função para voltar ao dashboard
// - onOpenProject : função chamada após criar projeto da biblioteca
// ------------------------------------------------------------
const STEAM_KEYS = ["S", "T", "E", "A", "M"];
const STEAM_COLORS = { S: "#3FD64C", T: "#3B95F2", E: "#FF8C1A", A: "#E8358A", M: "#A050F0" };
const STEAM_NAMES = { S: "Ciência", T: "Tecnologia", E: "Engenharia", A: "Arte", M: "Matemática" };

const GRADE_GROUPS = [
  { id: "6", label: "6º ano", match: ["6º"] },
  { id: "7", label: "7º ano", match: ["7º"] },
  { id: "8", label: "8º ano", match: ["8º"] },
  { id: "9", label: "9º ano", match: ["9º"] }
];

const EF2_MATCH = ["6º", "7º", "8º", "9º"];

const LIBRARY_IDS = new Set(LIBRARY.map((t) => t.id));

export default function Library({ currentUser, onBack, onOpenProject, onOpenActivityViewer }) {
  const [activeSection, setActiveSection] = useState(null); // null | "models" | "activities"
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedDiscipline, setSelectedDiscipline] = useState(null);
  const [selectedSteam, setSelectedSteam] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
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

  // Cria projeto a partir do template e abre no ActivityViewer
  const handleUseTemplate = async (template) => {
    setIsCreatingProject(true);
    setCreationError("");
    try {
      const newProject = await addProjectFromTemplate(template, { waitForPersist: true });
      setSelectedTemplate(null);
      if (onOpenActivityViewer) {
        const phaseDetails = template.phaseDetails ||
          Object.fromEntries(
            Object.entries(template.phases || {}).map(([id, p]) => [id, p.plan || ""])
          );
        onOpenActivityViewer(
          { activity: { ...template, phaseDetails }, formData: {} },
          newProject.id
        );
      } else {
        onOpenProject(newProject.id);
      }
    } catch (error) {
      console.error("Erro ao criar projeto da biblioteca:", error);
      setCreationError(
        `Não foi possível salvar este projeto no Supabase. ${formatSupabaseError(error)}`
      );
    } finally {
      setIsCreatingProject(false);
    }
  };

  const ef2Models = LIBRARY.filter((t) =>
    EF2_MATCH.some((m) => (t.grade || "").includes(m))
  );

  const communityActivities = publicProjects.filter(
    (p) => !LIBRARY_IDS.has(p.id) && EF2_MATCH.some((m) => (p.grade || "").includes(m))
  );

  const templates = activeSection === "models"
    ? ef2Models
    : activeSection === "activities"
    ? communityActivities
    : [];

  const disciplineFilters = DISCIPLINE_CATEGORIES.map((category) => ({
    ...category,
    count:
      category.id === "all"
        ? templates.length
        : templates.filter(
            (template) => getProjectDisciplineCategory(template) === category.id
          ).length
  })).filter((category) => category.id === "all" || category.count > 0);

  const toggleSteam = (letter) => {
    setSelectedSteam((prev) =>
      prev.includes(letter) ? prev.filter((l) => l !== letter) : [...prev, letter]
    );
  };

  const baseFilteredTemplates =
    !selectedDiscipline || selectedDiscipline === "all"
      ? templates
      : templates.filter(
          (template) => getProjectDisciplineCategory(template) === selectedDiscipline
        );

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const filteredTemplates = baseFilteredTemplates.filter((template) => {
    if (normalizedSearchTerm) {
      const searchableText = [
        template.title,
        template.theme,
        template.grade,
        template.guidingQuestion,
        ...(template.objectives || []),
        ...(template.bncc || []),
        ...(template.materials || [])
      ]
        .join(" ")
        .toLowerCase();
      if (!searchableText.includes(normalizedSearchTerm)) return false;
    }

    if (selectedSteam.length > 0) {
      const templateSteam = template.steam || [];
      if (!selectedSteam.every((letter) => templateSteam.includes(letter))) return false;
    }

    if (selectedGrade) {
      const gradeGroup = GRADE_GROUPS.find((g) => g.id === selectedGrade);
      if (gradeGroup) {
        const gradeStr = template.grade || "";
        if (!gradeGroup.match.some((m) => gradeStr.includes(m))) return false;
      }
    }

    return true;
  });

  const selectedDisciplineLabel =
    selectedDiscipline === "all"
      ? "Todos os projetos"
      : DISCIPLINE_CATEGORIES.find((category) => category.id === selectedDiscipline)?.name;

  const hasSelectedDiscipline = Boolean(selectedDiscipline);
  const shouldShowProjects = activeSection !== null && (hasSelectedDiscipline || Boolean(normalizedSearchTerm));

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

  const searchWrapperStyle = {
    position: "relative",
    marginBottom: "1rem"
  };

  const searchIconStyle = {
    position: "absolute",
    left: "1rem",
    top: "50%",
    transform: "translateY(-50%)",
    color: "rgba(255, 255, 255, 0.48)",
    fontSize: "1rem",
    pointerEvents: "none"
  };

  const searchInputStyle = {
    width: "100%",
    padding: "0.85rem 2.75rem",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    borderRadius: "10px",
    background: "rgba(255, 255, 255, 0.045)",
    color: "#FFFFFF",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    outline: "none"
  };

  const clearSearchButtonStyle = {
    position: "absolute",
    right: "0.65rem",
    top: "50%",
    transform: "translateY(-50%)",
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    border: "none",
    background: "rgba(255, 255, 255, 0.08)",
    color: "rgba(255, 255, 255, 0.7)",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "1rem"
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
    minHeight: hasSelectedDiscipline ? "96px" : "128px",
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

  const sectionCardsStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
    marginBottom: "2rem"
  };

  const sectionCardStyle = (isActive, color) => ({
    padding: "1.5rem",
    borderRadius: "12px",
    border: `2px solid ${isActive ? color : "rgba(255,255,255,0.08)"}`,
    background: isActive ? `${color}12` : "rgba(255,255,255,0.03)",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
    transition: "all 0.18s ease",
    position: "relative",
    overflow: "hidden"
  });

  const sectionCardIconStyle = {
    fontSize: "2rem",
    marginBottom: "0.75rem",
    display: "block"
  };

  const sectionCardTitleStyle = (isActive, color) => ({
    fontSize: "1.05rem",
    fontWeight: 700,
    color: isActive ? color : "#FFFFFF",
    margin: "0 0 0.4rem"
  });

  const sectionCardDescStyle = {
    fontSize: "0.85rem",
    color: "rgba(255,255,255,0.55)",
    lineHeight: 1.5,
    margin: 0
  };

  const sectionCardCountStyle = (color) => ({
    position: "absolute",
    top: "1rem",
    right: "1rem",
    fontSize: "0.75rem",
    fontWeight: 700,
    background: `${color}22`,
    color: color,
    padding: "0.2rem 0.6rem",
    borderRadius: "999px"
  });

  const filterRowStyle = {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: "1rem"
  };

  const filterLabelStyle = {
    fontSize: "0.7rem",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "rgba(255,255,255,0.4)",
    fontWeight: 600,
    marginRight: "0.25rem"
  };

  const steamFilterBtnStyle = (letter, isActive) => ({
    padding: "0.3rem 0.65rem",
    borderRadius: "6px",
    border: `1px solid ${isActive ? STEAM_COLORS[letter] : "rgba(255,255,255,0.12)"}`,
    background: isActive ? `${STEAM_COLORS[letter]}22` : "rgba(255,255,255,0.03)",
    color: isActive ? STEAM_COLORS[letter] : "rgba(255,255,255,0.55)",
    fontWeight: 700,
    fontSize: "0.8rem",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.15s"
  });

  const gradeFilterBtnStyle = (id, isActive) => ({
    padding: "0.3rem 0.65rem",
    borderRadius: "6px",
    border: `1px solid ${isActive ? "rgba(107,47,224,0.7)" : "rgba(255,255,255,0.12)"}`,
    background: isActive ? "rgba(107,47,224,0.18)" : "rgba(255,255,255,0.03)",
    color: isActive ? "#C9A0FF" : "rgba(255,255,255,0.55)",
    fontWeight: 600,
    fontSize: "0.8rem",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.15s"
  });

  const communityBadgeStyle = {
    fontSize: "0.65rem",
    background: "rgba(59,149,242,0.18)",
    color: "#7BB8F5",
    border: "1px solid rgba(59,149,242,0.3)",
    padding: "0.1rem 0.45rem",
    borderRadius: "3px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    whiteSpace: "nowrap"
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

  const readOnlyNoticeStyle = {
    padding: "0.85rem 1rem",
    border: "1px solid rgba(63, 214, 76, 0.24)",
    borderRadius: "8px",
    background: "rgba(63, 214, 76, 0.08)",
    color: "rgba(255, 255, 255, 0.82)",
    fontSize: "0.88rem",
    lineHeight: 1.5,
    marginBottom: "1.25rem"
  };

  const phasePreviewStyle = {
    display: "grid",
    gap: "0.8rem"
  };

  const phasePreviewItemStyle = {
    padding: "0.85rem",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "8px",
    background: "rgba(255, 255, 255, 0.025)"
  };

  const phasePreviewTitleStyle = {
    color: "#FFFFFF",
    fontSize: "0.9rem",
    fontWeight: 700,
    margin: "0 0 0.35rem"
  };

  const phasePreviewTextStyle = {
    color: "rgba(255, 255, 255, 0.76)",
    fontSize: "0.88rem",
    lineHeight: 1.55,
    margin: 0
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
      {/* Cabeçalho */}
      <div style={headerStyle}>
        <button style={backButtonStyle} onClick={onBack}>
          ← Voltar
        </button>
        <h1 style={titleStyle}>Biblioteca</h1>
        <p style={subtitleStyle}>
          Modelos prontos para usar ou atividades geradas pela comunidade de professores.
          Escolha uma seção para explorar.
        </p>
      </div>

      {/* Dois painéis em cascata */}
      <div style={sectionCardsStyle}>
        <button
          style={sectionCardStyle(activeSection === "models", "#6B2FE0")}
          onClick={() => {
            setActiveSection(activeSection === "models" ? null : "models");
            setSelectedDiscipline(null);
            setSearchTerm("");
            setSelectedSteam([]);
            setSelectedGrade(null);
          }}
        >
          <span style={sectionCardCountStyle("#6B2FE0")}>{ef2Models.length}</span>
          <span style={sectionCardIconStyle}>📚</span>
          <p style={sectionCardTitleStyle(activeSection === "models", "#C9A0FF")}>
            Modelos prontos e editáveis
          </p>
          <p style={sectionCardDescStyle}>
            Atividades pedagógicas criadas por especialistas, prontas para usar.
            Ao abrir, uma cópia editável é criada no seu perfil.
          </p>
        </button>

        <button
          style={sectionCardStyle(activeSection === "activities", "#3B95F2")}
          onClick={() => {
            setActiveSection(activeSection === "activities" ? null : "activities");
            setSelectedDiscipline(null);
            setSearchTerm("");
            setSelectedSteam([]);
            setSelectedGrade(null);
          }}
        >
          <span style={sectionCardCountStyle("#3B95F2")}>{communityActivities.length}</span>
          <span style={sectionCardIconStyle}>🌐</span>
          <p style={sectionCardTitleStyle(activeSection === "activities", "#7BB8F5")}>
            Atividades da comunidade
          </p>
          <p style={sectionCardDescStyle}>
            Atividades geradas por professores e salvas para compartilhar.
            Salve no seu perfil para editar e gerar PDF.
          </p>
        </button>
      </div>

      {/* Submenu por disciplina */}
      {activeSection && (
      <div style={submenuHeaderStyle}>
        <h2 style={submenuTitleStyle}>
          {hasSelectedDiscipline || normalizedSearchTerm
            ? activeSection === "models" ? "Modelos encontrados" : "Atividades encontradas"
            : activeSection === "models" ? "Escolha uma disciplina" : "Atividades da comunidade"}
        </h2>
        <p style={submenuTextStyle}>
          {hasSelectedDiscipline || normalizedSearchTerm
            ? "Refine a busca ou troque de disciplina a qualquer momento."
            : activeSection === "models"
            ? "Filtre por disciplina, área STEAM ou série para encontrar o modelo ideal."
            : "Atividades criadas por outros professores, prontas para consulta e uso."}
        </p>
      </div>
      )}

      {activeSection && (
        <>
          <div style={searchWrapperStyle}>
            <span style={searchIconStyle}>⌕</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar projeto por nome, disciplina, BNCC ou palavra-chave..."
              style={searchInputStyle}
              aria-label="Buscar projeto na biblioteca"
            />
            {searchTerm && (
              <button
                type="button"
                style={clearSearchButtonStyle}
                onClick={() => setSearchTerm("")}
                aria-label="Limpar busca"
              >
                ×
              </button>
            )}
          </div>

          {/* Filtros de STEAM e Série */}
          <div style={filterRowStyle}>
            <span style={filterLabelStyle}>STEAM</span>
            {STEAM_KEYS.map((letter) => (
              <button
                key={letter}
                type="button"
                style={steamFilterBtnStyle(letter, selectedSteam.includes(letter))}
                onClick={() => toggleSteam(letter)}
                title={STEAM_NAMES[letter]}
              >
                {letter}
              </button>
            ))}
            <span style={{ ...filterLabelStyle, marginLeft: "0.75rem" }}>Série</span>
            {GRADE_GROUPS.map((group) => (
              <button
                key={group.id}
                type="button"
                style={gradeFilterBtnStyle(group.id, selectedGrade === group.id)}
                onClick={() => setSelectedGrade(selectedGrade === group.id ? null : group.id)}
              >
                {group.label}
              </button>
            ))}
            {(selectedSteam.length > 0 || selectedGrade) && (
              <button
                type="button"
                style={{ ...gradeFilterBtnStyle("", false), color: "rgba(255,255,255,0.4)" }}
                onClick={() => { setSelectedSteam([]); setSelectedGrade(null); }}
              >
                Limpar filtros
              </button>
            )}
          </div>

          <div style={submenuStyle} aria-label="Filtrar projetos por disciplina">
            {disciplineFilters.map((filter) => {
              const isActive = selectedDiscipline === filter.id;

              return (
                <button
                  key={filter.id}
                  type="button"
                  style={themeButtonStyle(filter, isActive)}
                  onClick={() => setSelectedDiscipline(filter.id)}
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
        </>
      )}

      {shouldShowProjects && (
        <>
          <div style={libraryStatusStyle}>
            <button
              type="button"
              style={backToAreasButtonStyle}
              onClick={() => {
                setSelectedDiscipline(null);
                setSearchTerm("");
              }}
            >
              ← Voltar ao menu de disciplinas
            </button>
            <span>
              {(selectedDisciplineLabel || "Resultados da busca")} ·{" "}
              {filteredTemplates.length}{" "}
              {filteredTemplates.length === 1
                ? "projeto pronto"
                : "projetos prontos"}
            </span>
          </div>

          {/* Grade com os cards dos projetos da biblioteca */}
          <div style={gridStyle}>
            {filteredTemplates.length === 0 ? (
              <Card>
                <div style={cardContentStyle}>
                  <h3 style={cardTitleStyle}>Nenhum projeto encontrado</h3>
                  <p style={cardThemeStyle}>
                    Tente buscar por outro nome, disciplina, habilidade BNCC ou palavra-chave.
                  </p>
                </div>
              </Card>
            ) : filteredTemplates.map((template) => (
              <Card
                key={template.id}
                variant="clickable"
                onClick={() => setSelectedTemplate(template)}
              >
                <div style={cardContentStyle}>
                  {/* Topo: título, tema e selos STEAM */}
                  <div style={cardHeaderStyle}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                        <h3 style={{ ...cardTitleStyle, margin: 0 }}>{template.title}</h3>
                        {!LIBRARY_IDS.has(template.id) && (
                          <span style={communityBadgeStyle}>Comunidade</span>
                        )}
                      </div>
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
            <div style={readOnlyNoticeStyle}>
              {activeSection === "activities"
                ? "Esta atividade é da comunidade. Salve no seu perfil para editar e gerar PDF."
                : "Este é um modelo pronto. Uma cópia editável será criada no seu perfil ao confirmar."}
            </div>

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

            {/* Planejamento por fases */}
            {(selectedTemplate.phaseDetails || selectedTemplate.phases) && (
              <div style={modalSectionStyle}>
                <div style={modalSectionTitleStyle}>
                  Planejamento por fases
                </div>
                <div style={phasePreviewStyle}>
                  {[
                    ["imersao", "Imersão"],
                    ["ideacao", "Ideação"],
                    ["prototipagem", "Prototipagem"],
                    ["teste", "Teste"],
                    ["compartilhamento", "Compartilhamento"]
                  ].map(([phaseId, phaseName]) => {
                    const text =
                      selectedTemplate.phaseDetails?.[phaseId] ||
                      selectedTemplate.phases?.[phaseId]?.plan;

                    if (!text) return null;

                    return (
                      <div key={phaseId} style={phasePreviewItemStyle}>
                        <h4 style={phasePreviewTitleStyle}>{phaseName}</h4>
                        <p style={phasePreviewTextStyle}>{text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
                {isCreatingProject
                  ? "Salvando..."
                  : activeSection === "activities"
                  ? "Salvar no meu perfil"
                  : "Usar como cópia editável"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
