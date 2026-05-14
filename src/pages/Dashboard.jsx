import { useEffect, useMemo, useState } from "react";
import { useProjects } from "../hooks/useProjects.js";
import { PedagogicalPlannerService } from "../lib/ai/pedagogicalPlannerService.js";

import Button from "../components/ui/Button.jsx";
import Modal from "../components/ui/Modal.jsx";
import AIGeneratorModal from "../components/project/AIGeneratorModal.jsx";
import PedagogicalPlannerModal from "../components/project/PedagogicalPlannerModal.jsx";

function formatSupabaseError(error) {
  return [
    error?.message,
    error?.details,
    error?.hint,
    error?.code ? `Código: ${error.code}` : ""
  ].filter(Boolean).join(" | ");
}

function getProjectDate(project) {
  const rawDate = project.updatedAt || project.createdAt || project.date;
  if (!rawDate) return "Hoje";

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return rawDate;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

function getProjectCategory(project) {
  if (Array.isArray(project.steam) && project.steam.length > 0) {
    return project.steam.join(" + ");
  }

  return project.area || project.category || "STEAM";
}

const sampleProjects = [
  {
    id: "sample-line-car",
    title: "Carrinho seguidor de linha",
    theme: "Robótica e pensamento computacional",
    grade: "8º ano",
    category: "Robótica",
    color: "#2563EB"
  },
  {
    id: "sample-irrigation",
    title: "Sistema de irrigação inteligente",
    theme: "Ciências, sensores e sustentabilidade",
    grade: "7º ano",
    category: "Ciências",
    color: "#16A34A"
  },
  {
    id: "sample-bridge",
    title: "Ponte de palitos",
    theme: "Engenharia, medidas e resistência",
    grade: "6º ano",
    category: "Engenharia",
    color: "#F97316"
  },
  {
    id: "sample-art",
    title: "Arte geométrica sustentável",
    theme: "Arte, matemática e reaproveitamento",
    grade: "9º ano",
    category: "Arte",
    color: "#8B5CF6"
  }
];

const sidebarItems = [
  ["Meus Projetos", "grid"],
  ["Biblioteca de Modelos", "library"],
  ["Gerados com IA", "spark"],
  ["Favoritos", "star"],
  ["Lixeira", "trash"]
];

function Icon({ name, color = "currentColor" }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true
  };

  const paths = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    library: (
      <>
        <path d="M4 19.5V5.8A2.8 2.8 0 0 1 6.8 3H20v16H6.8A2.8 2.8 0 0 0 4 21.8" />
        <path d="M8 7h8" />
        <path d="M8 11h6" />
      </>
    ),
    spark: (
      <>
        <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
        <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />
      </>
    ),
    share: (
      <>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="M8.6 10.5l6.8-4" />
        <path d="M8.6 13.5l6.8 4" />
      </>
    ),
    star: (
      <path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8L12 3.5z" />
    ),
    trash: (
      <>
        <path d="M4 7h16" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
        <path d="M6 7l1 14h10l1-14" />
        <path d="M9 7V4h6v3" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    target: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <path d="M12 3v3" />
        <path d="M12 18v3" />
        <path d="M3 12h3" />
        <path d="M18 12h3" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.8-3.8" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    list: (
      <>
        <path d="M8 6h13" />
        <path d="M8 12h13" />
        <path d="M8 18h13" />
        <path d="M3 6h.01" />
        <path d="M3 12h.01" />
        <path d="M3 18h.01" />
      </>
    ),
    moon: <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5z" />,
    logout: (
      <>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M21 3v18" />
      </>
    )
  };

  return <svg {...common}>{paths[name] || paths.grid}</svg>;
}

export default function Dashboard({
  currentUser,
  onLogout,
  onOpenProject,
  onOpenLibrary,
  onOpenSettings,
  onOpenActivityViewer
}) {
  const { projects, addBlankProject, addProjectFromTemplate, removeProject, isLoaded } =
    useProjects(currentUser?.id);

  const [projectToDelete, setProjectToDelete] = useState(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showPedagogicalModal, setShowPedagogicalModal] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [creationError, setCreationError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [pendingSaveConfirmation, setPendingSaveConfirmation] = useState(false);
  const [saveConfirmationMessage, setSaveConfirmationMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("Todos");
  const [sortMode, setSortMode] = useState("recentes");
  const [viewMode, setViewMode] = useState("grid");
  const [favorites, setFavorites] = useState(() => new Set());
  const [isDark, setIsDark] = useState(() => localStorage.getItem("steam-theme") === "dark");

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem("steam-theme", next ? "dark" : "light");
      return next;
    });
  };

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

  const hasProjects = projects.length > 0;
  const professorName = currentUser?.name || currentUser?.email?.split("@")[0] || "Professor";
  const firstName = professorName.split(" ")[0];

  const filterOptions = useMemo(() => {
    const categories = projects.map(getProjectCategory).filter(Boolean);
    return ["Todos", ...new Set(categories)].slice(0, 7);
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return projects
      .filter((project) => {
        const matchesSearch = !normalizedSearch ||
          [project.title, project.theme, project.grade, getProjectCategory(project)]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalizedSearch));

        const matchesFilter =
          selectedFilter === "Todos" || getProjectCategory(project) === selectedFilter;

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        if (sortMode === "az") {
          return (a.title || "").localeCompare(b.title || "");
        }

        const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bDate - aDate;
      });
  }, [projects, searchTerm, selectedFilter, sortMode]);

  const displayedProjects = hasProjects ? filteredProjects : sampleProjects;
  const progressPercent = hasProjects
    ? Math.min(100, Math.round((projects.length / Math.max(projects.length + 2, 4)) * 100))
    : 28;

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
    if (!hasProjects) {
      handleOpenLibraryClick();
      return;
    }

    confirmPendingSaveBefore(() => onOpenProject(projectId));
  };

  const handleShowAIModal = () => {
    confirmPendingSaveBefore(() => setShowAIModal(true));
  };

  const handleRequestDelete = (projectId) => {
    setProjectToDelete(projectId);
  };

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

  const handleAIProjectGenerated = async (generatedProject) => {
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

  const handlePedagogicalActivityGenerated = async (result) => {
    setIsCreatingProject(true);
    setCreationError("");
    try {
      const data = result.activity || {};
      const steamLetters = Object.keys(data.steamMatrix || {}).filter((k) =>
        ["S", "T", "E", "A", "M"].includes(k)
      );

      const newProject = await addProjectFromTemplate(
        {
          ...data,
          steam: steamLetters,
          grade: data.grade || result.formData?.grade,
          source: "pedagogical-planner"
        },
        { waitForPersist: true }
      );

      PedagogicalPlannerService.incrementUsage(
        currentUser?.id,
        result.formData?.discipline,
        result.competencies || []
      ).catch(console.error);

      setShowPedagogicalModal(false);
      onOpenActivityViewer(result, newProject.id);
    } catch (error) {
      console.error("Erro ao salvar atividade pedagógica:", error);
      setCreationError(
        `Não foi possível salvar a atividade. ${formatSupabaseError(error)}`
      );
    } finally {
      setIsCreatingProject(false);
    }
  };

  const toggleFavorite = (event, projectId) => {
    event.stopPropagation();
    setFavorites((previous) => {
      const next = new Set(previous);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  if (!isLoaded) {
    return (
      <div style={loadingStyle}>
        <div style={loadingCardStyle}>Carregando seus projetos...</div>
      </div>
    );
  }

  return (
    <div className={isDark ? "is-dark" : ""} style={isDark ? pageDarkStyle : pageStyle}>
      <style>{dashboardCss}</style>

      <aside style={isDark ? sidebarDarkStyle : sidebarStyle}>
        <div>
          <div style={brandStyle}>
            <div style={brandMarkStyle}>SP</div>
            <div>
              <div style={brandTitleStyle}>STEAM Planner</div>
              <div style={brandSubtitleStyle}>Educação maker</div>
            </div>
          </div>

          <nav style={navStyle} aria-label="Navegação principal">
            {sidebarItems.map(([label, icon], index) => (
              <button
                key={label}
                className={`dashboard-nav-item ${index === 0 ? "is-active" : ""}`}
                onClick={label === "Biblioteca de Modelos" ? handleOpenLibraryClick : undefined}
                type="button"
              >
                <Icon name={icon} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div style={sidebarFooterStyle}>
          <div style={motivationCardStyle} className="dash-motivation-card">
            <div style={motivationIconStyle} className="dash-motivation-icon">A+</div>
            <strong>Ideia para hoje</strong>
            <p>Transforme uma pergunta da turma em protótipo, teste e reflexão.</p>
          </div>

          <button className="theme-toggle" type="button" onClick={toggleTheme}>
            <Icon name="moon" />
            <span>Modo {isDark ? "escuro" : "claro"}</span>
            <div className={`toggle-switch${isDark ? " is-on" : ""}`}>
              <div className="toggle-knob" />
            </div>
          </button>

          <div style={userCardStyle} className="dash-user-card">
            <div style={avatarStyle}>{firstName.charAt(0).toUpperCase()}</div>
            <div style={{ minWidth: 0 }}>
              <strong style={userNameStyle}>{professorName}</strong>
              <span style={userRoleStyle}>Professor criador</span>
            </div>
            <button
              className="icon-button"
              onClick={handleLogoutClick}
              title="Sair"
              type="button"
            >
              <Icon name="logout" />
            </button>
          </div>
        </div>
      </aside>

      <main style={mainStyle}>
        <header style={topbarStyle}>
          <div>
            <p style={eyebrowStyle}>Olá, {firstName}</p>
            <h1 style={pageTitleStyle}>Organize seus projetos criativos</h1>
          </div>

          <div style={topbarActionsStyle}>
            <label style={searchStyle}>
              <Icon name="search" color="#64748B" />
              <input
                className="search-input"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar projeto, tema ou série"
              />
            </label>
            <button className="notification-button" type="button" title="Notificações">
              <Icon name="bell" />
            </button>
            <div style={topAvatarStyle}>{firstName.charAt(0).toUpperCase()}</div>
          </div>
        </header>

        {creationError && <div style={errorStyle}>{creationError}</div>}

        {(pendingSaveConfirmation || saveConfirmationMessage) && (
          <div style={saveAlertStyle}>
            <span>{saveConfirmationMessage}</span>
            {pendingSaveConfirmation && (
              <button className="save-button" onClick={handleConfirmSave} type="button">
                Salvar alterações
              </button>
            )}
          </div>
        )}


        <section style={quickActionsStyle} aria-label="Ações principais">
          <ActionButton
            icon="target"
            title="Gerar atividade"
            description="Crie uma atividade de acordo com sua solicitação"
            color="#F59E0B"
            onClick={() => setShowPedagogicalModal(true)}
          />
          <ActionButton
            icon="library"
            title="Explorar biblioteca"
            description="Use modelos prontos por disciplina"
            color="#14B8A6"
            onClick={handleOpenLibraryClick}
          />
        </section>

        <section style={aiAssistantsStyle} aria-label="Assistentes Inteligentes">
          <div style={aiHeaderStyle}>
            <h2 style={aiTitleStyle}>Assistentes Inteligentes</h2>
            <p style={aiSubtitleStyle}>Ferramentas especializadas para potencializar seus projetos STEAM</p>
          </div>

          <div style={aiGridStyle}>
            <AIAssistantCard
              icon="🎓"
              title="Planejador Pedagógico"
              description="Gera uma atividade alinhada à sua solicitação, com STEAM, BNCC e Maker"
              color="#8B5CF6"
              onClick={() => setShowPedagogicalModal(true)}
            />
            <AIAssistantCard
              icon="📄"
              title="Análise de Documentos"
              description="Leitura e síntese de PDFs, imagens e textos"
              color="#10B981"
              onClick={onOpenSettings}
            />
          </div>

          <div style={aiFooterStyle}>
            <Button variant="secondary" onClick={onOpenSettings}>
              ⚙️ Configurar IAs
            </Button>
          </div>
        </section>

        <section style={projectsSectionStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Meus Projetos</h2>
              <p style={sectionSubtitleStyle}>
                {hasProjects
                  ? `${filteredProjects.length} ${filteredProjects.length === 1 ? "projeto encontrado" : "projetos encontrados"}`
                  : "Modelos de inspiração para começar sua biblioteca"}
              </p>
            </div>

            <div style={controlsStyle}>
              <select
                className="filter-select"
                value={selectedFilter}
                onChange={(event) => setSelectedFilter(event.target.value)}
                disabled={!hasProjects}
              >
                {filterOptions.map((filter) => (
                  <option key={filter} value={filter}>
                    {filter}
                  </option>
                ))}
              </select>
              <select
                className="filter-select"
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value)}
                disabled={!hasProjects}
              >
                <option value="recentes">Mais recentes</option>
                <option value="az">A-Z</option>
              </select>
              <div style={viewToggleStyle}>
                <button
                  className={`view-button ${viewMode === "grid" ? "is-active" : ""}`}
                  onClick={() => setViewMode("grid")}
                  type="button"
                  title="Visualização em grade"
                >
                  <Icon name="grid" />
                </button>
                <button
                  className={`view-button ${viewMode === "list" ? "is-active" : ""}`}
                  onClick={() => setViewMode("list")}
                  type="button"
                  title="Visualização em lista"
                >
                  <Icon name="list" />
                </button>
              </div>
            </div>
          </div>

          <div
            style={{
              ...projectGridStyle,
              gridTemplateColumns:
                viewMode === "list" ? "1fr" : "repeat(auto-fit, minmax(260px, 1fr))"
            }}
          >
            {displayedProjects.length > 0 ? (
              displayedProjects.map((project, index) => (
                <ModernProjectCard
                  key={project.id}
                  project={project}
                  index={index}
                  isExample={!hasProjects}
                  isList={viewMode === "list"}
                  isFavorite={favorites.has(project.id)}
                  onFavorite={toggleFavorite}
                  onOpen={() => handleOpenProjectClick(project.id)}
                  onDelete={() => handleRequestDelete(project.id)}
                  currentUser={professorName}
                />
              ))
            ) : (
              <div style={emptySearchStyle}>
                Nenhum projeto encontrado com os filtros atuais.
              </div>
            )}
          </div>
        </section>

        <section style={bottomSectionStyle} className="dash-bottom">
          <div style={progressPanelStyle}>
            <span style={panelKickerStyle}>Continue de onde parou</span>
            <h3 style={panelTitleStyle}>
              {hasProjects ? "Revise a próxima etapa do seu projeto" : "Monte seu primeiro plano maker"}
            </h3>
            <div style={progressTrackStyle}>
              <div style={{ ...progressFillStyle, width: `${progressPercent}%` }} />
            </div>
            <p style={panelTextStyle}>{progressPercent}% de organização pedagógica preparada.</p>
          </div>

          <div style={tipPanelStyle}>
            <span style={panelKickerStyle}>Dica STEAM</span>
            <h3 style={panelTitleStyle}>Comece pelo desafio</h3>
            <p style={panelTextStyle}>
              Uma boa proposta maker nasce de um problema real, investigável e próximo da vida dos estudantes.
            </p>
          </div>

          <div style={suggestionPanelStyle}>
            <span style={panelKickerStyle}>Sugestão inteligente</span>
            <h3 style={panelTitleStyle}>Combine disciplinas</h3>
            <p style={panelTextStyle}>
              Experimente unir Matemática, Arte e Ciências em uma atividade de prototipagem rápida.
            </p>
          </div>
        </section>
      </main>

      <Modal
        isOpen={projectToDelete !== null}
        onClose={() => setProjectToDelete(null)}
        title="Excluir projeto"
        maxWidth="450px"
      >
        <div>
          <p style={modalTextStyle}>
            Tem certeza que deseja excluir este projeto? Todos os dados,
            registros do diário e avaliações serão perdidos. Esta ação
            não pode ser desfeita.
          </p>
          {deleteError && <p style={modalErrorStyle}>{deleteError}</p>}
          <div style={modalActionsStyle}>
            <Button variant="secondary" onClick={() => setProjectToDelete(null)}>
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

      <AIGeneratorModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onProjectGenerated={handleAIProjectGenerated}
      />
      <PedagogicalPlannerModal
        isOpen={showPedagogicalModal}
        onClose={() => setShowPedagogicalModal(false)}
        onActivityGenerated={handlePedagogicalActivityGenerated}
      />
    </div>
  );
}

function ActionButton({ icon, title, description, color, onClick, disabled }) {
  return (
    <button
      className="action-card"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{ "--action-color": color }}
      type="button"
    >
      <span className="action-icon">
        <Icon name={icon} color={color} />
      </span>
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
    </button>
  );
}

function AIAssistantCard({ icon, title, description, color, onClick }) {
  return (
    <button
      type="button"
      style={{
        ...aiAssistantCardStyle,
        borderColor: color,
        boxShadow: `0 18px 35px ${color}22`,
        background: "rgba(255, 255, 255, 0.92)"
      }}
      onClick={onClick}
    >
      <span style={{ ...aiAssistantIconStyle, background: color }}>{icon}</span>
      <div>
        <strong style={aiAssistantTitleStyle}>{title}</strong>
        <p style={aiAssistantDescriptionStyle}>{description}</p>
      </div>
    </button>
  );
}

function ModernProjectCard({
  project,
  index,
  isExample,
  isList,
  isFavorite,
  onFavorite,
  onOpen,
  onDelete,
  currentUser
}) {
  const colors = ["#2563EB", "#14B8A6", "#F97316", "#8B5CF6", "#22C55E"];
  const color = project.color || colors[index % colors.length];
  const title = project.title || "Projeto sem título";

  return (
    <article
      className={`project-card-modern ${isList ? "is-list" : ""}`}
      onClick={onOpen}
      style={{ "--project-color": color }}
    >
      <div className="project-image">
        <div className="project-image-grid" />
        <span>{getProjectCategory(project)}</span>
      </div>

      <div className="project-body">
        <div className="project-card-topline">
          <span className="category-pill">{getProjectCategory(project)}</span>
          <button
            className={`favorite-button ${isFavorite ? "is-favorite" : ""}`}
            onClick={(event) => onFavorite(event, project.id)}
            title="Favoritar"
            type="button"
          >
            <Icon name="star" />
          </button>
        </div>

        <h3>{title}</h3>
        <p>{project.theme || "Projeto maker com investigação, prototipagem e compartilhamento."}</p>

        <div className="project-meta">
          <span>{project.grade || "Ensino Fundamental"}</span>
          <span>{getProjectDate(project)}</span>
          <span>{isExample ? "Modelo" : currentUser}</span>
        </div>

        <div className="project-card-actions">
          <button type="button" onClick={onOpen}>
            {isExample ? "Ver biblioteca" : "Abrir projeto"}
          </button>
          {!isExample && (
            <button
              className="delete-project-button"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
            >
              Excluir
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background:
    "linear-gradient(135deg, #F8FBFF 0%, #F4F7FB 42%, #EEF9F5 100%)",
  color: "#102033",
  fontFamily: "'Plus Jakarta Sans', 'Poppins', 'Outfit', 'Sora', sans-serif",
  display: "flex"
};

const pageDarkStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #0D1117 0%, #0F0F2D 60%, #080818 100%)",
  color: "#E2E8F0",
  fontFamily: "'Plus Jakarta Sans', 'Poppins', 'Outfit', 'Sora', sans-serif",
  display: "flex"
};

const loadingStyle = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  background: "#F8FBFF",
  fontFamily: "'Plus Jakarta Sans', sans-serif"
};

const loadingCardStyle = {
  padding: "1rem 1.25rem",
  borderRadius: "18px",
  background: "rgba(255, 255, 255, 0.78)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  boxShadow: "0 20px 60px rgba(15, 23, 42, 0.08)",
  color: "#475569",
  fontWeight: 700
};

const sidebarStyle = {
  width: "286px",
  minHeight: "100vh",
  position: "sticky",
  top: 0,
  padding: "1.35rem",
  background: "rgba(255, 255, 255, 0.78)",
  borderRight: "1px solid rgba(148, 163, 184, 0.18)",
  backdropFilter: "blur(22px)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  gap: "1.5rem",
  boxShadow: "18px 0 50px rgba(15, 23, 42, 0.05)"
};

const sidebarDarkStyle = {
  width: "286px",
  minHeight: "100vh",
  position: "sticky",
  top: 0,
  padding: "1.35rem",
  background: "rgba(10, 10, 30, 0.97)",
  borderRight: "1px solid rgba(255, 255, 255, 0.08)",
  backdropFilter: "blur(22px)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  gap: "1.5rem",
  boxShadow: "18px 0 50px rgba(0, 0, 0, 0.4)"
};

const brandStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  marginBottom: "1.65rem"
};

const brandMarkStyle = {
  width: "46px",
  height: "46px",
  borderRadius: "16px",
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(135deg, #2563EB, #14B8A6)",
  color: "#FFFFFF",
  fontWeight: 900,
  boxShadow: "0 14px 32px rgba(37, 99, 235, 0.28)"
};

const brandTitleStyle = {
  fontWeight: 900,
  fontSize: "1rem",
  letterSpacing: "-0.02em"
};

const brandSubtitleStyle = {
  color: "#64748B",
  fontSize: "0.78rem",
  fontWeight: 700
};

const navStyle = {
  display: "grid",
  gap: "0.35rem"
};

const sidebarFooterStyle = {
  display: "grid",
  gap: "0.8rem"
};

const motivationCardStyle = {
  borderRadius: "22px",
  padding: "1rem",
  background: "linear-gradient(135deg, rgba(224, 242, 254, 0.92), rgba(220, 252, 231, 0.9))",
  border: "1px solid rgba(37, 99, 235, 0.12)",
  color: "#0F172A",
  boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)"
};

const motivationIconStyle = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "grid",
  placeItems: "center",
  background: "#FFFFFF",
  color: "#2563EB",
  fontWeight: 900,
  marginBottom: "0.7rem"
};

const userCardStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.7rem",
  padding: "0.75rem",
  borderRadius: "18px",
  background: "#FFFFFF",
  border: "1px solid rgba(148, 163, 184, 0.16)"
};

const avatarStyle = {
  width: "38px",
  height: "38px",
  borderRadius: "14px",
  display: "grid",
  placeItems: "center",
  background: "#EEF2FF",
  color: "#4F46E5",
  fontWeight: 900,
  flex: "0 0 auto"
};

const userNameStyle = {
  display: "block",
  color: "#0F172A",
  fontSize: "0.86rem",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis"
};

const userRoleStyle = {
  display: "block",
  color: "#64748B",
  fontSize: "0.74rem",
  fontWeight: 700
};

const mainStyle = {
  flex: 1,
  minWidth: 0,
  padding: "1.5rem 2rem 2rem"
};

const topbarStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "1rem",
  marginBottom: "1.4rem"
};

const eyebrowStyle = {
  margin: 0,
  color: "#2563EB",
  fontWeight: 800,
  fontSize: "0.82rem"
};

const pageTitleStyle = {
  margin: "0.2rem 0 0",
  color: "#0F172A",
  fontSize: "clamp(1.55rem, 2.5vw, 2.35rem)",
  lineHeight: 1.08,
  letterSpacing: "0",
  fontWeight: 900
};

const topbarActionsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  flexWrap: "wrap",
  justifyContent: "flex-end"
};

const searchStyle = {
  width: "min(420px, 42vw)",
  minWidth: "260px",
  display: "flex",
  alignItems: "center",
  gap: "0.65rem",
  padding: "0.78rem 1rem",
  borderRadius: "18px",
  background: "rgba(255, 255, 255, 0.86)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  boxShadow: "0 14px 35px rgba(15, 23, 42, 0.06)"
};

const topAvatarStyle = {
  width: "44px",
  height: "44px",
  borderRadius: "16px",
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(135deg, #2563EB, #8B5CF6)",
  color: "#FFFFFF",
  fontWeight: 900,
  boxShadow: "0 14px 28px rgba(37, 99, 235, 0.24)"
};

const errorStyle = {
  padding: "0.9rem 1rem",
  marginBottom: "1rem",
  borderRadius: "16px",
  background: "#FEF2F2",
  border: "1px solid #FECACA",
  color: "#B91C1C",
  fontWeight: 700
};

const saveAlertStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "1rem",
  padding: "0.9rem 1rem",
  marginBottom: "1rem",
  border: "1px solid rgba(37, 99, 235, 0.16)",
  borderRadius: "18px",
  background: "rgba(219, 234, 254, 0.86)",
  color: "#1E3A8A",
  fontSize: "0.9rem",
  fontWeight: 700,
  flexWrap: "wrap"
};

const heroStyle = {
  minHeight: "315px",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.05fr) minmax(320px, 0.95fr)",
  gap: "1.5rem",
  alignItems: "center",
  padding: "2.1rem",
  borderRadius: "34px",
  background:
    "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(239, 246, 255, 0.92))",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  boxShadow: "0 26px 70px rgba(15, 23, 42, 0.08)",
  overflow: "hidden",
  position: "relative"
};

const heroContentStyle = {
  position: "relative",
  zIndex: 2
};

const heroBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "0.45rem 0.75rem",
  borderRadius: "999px",
  background: "#ECFDF5",
  color: "#047857",
  fontWeight: 900,
  fontSize: "0.78rem",
  marginBottom: "1rem"
};

const heroTitleStyle = {
  margin: 0,
  color: "#0F172A",
  fontSize: "clamp(2.25rem, 5vw, 4.4rem)",
  lineHeight: 0.96,
  letterSpacing: "0",
  fontWeight: 950,
  maxWidth: "760px"
};

const heroTextStyle = {
  maxWidth: "650px",
  color: "#475569",
  fontSize: "1.05rem",
  lineHeight: 1.7,
  margin: "1.1rem 0 0",
  fontWeight: 650
};

const heroVisualStyle = {
  minHeight: "250px",
  position: "relative"
};

const quickActionsStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "1rem",
  margin: "1.25rem 0"
};

const aiAssistantsStyle = {
  padding: "1.35rem",
  borderRadius: "30px",
  background: "rgba(255, 255, 255, 0.76)",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  boxShadow: "0 20px 55px rgba(15, 23, 42, 0.06)",
  marginBottom: "1.25rem"
};

const aiHeaderStyle = {
  marginBottom: "1rem"
};

const aiTitleStyle = {
  margin: 0,
  color: "#0F172A",
  fontSize: "1.35rem",
  fontWeight: 900
};

const aiSubtitleStyle = {
  margin: "0.35rem 0 0",
  color: "#64748B",
  fontSize: "0.95rem",
  lineHeight: 1.6
};

const aiGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "1rem"
};

const aiFooterStyle = {
  marginTop: "1rem",
  display: "flex",
  justifyContent: "flex-end"
};

const aiAssistantCardStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "1rem",
  padding: "1.25rem",
  borderRadius: "24px",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  background: "#FFFFFF",
  color: "#0F172A",
  cursor: "pointer",
  textAlign: "left",
  transition: "transform 0.18s ease, box-shadow 0.18s ease",
  minHeight: "140px"
};

const aiAssistantIconStyle = {
  width: "54px",
  height: "54px",
  borderRadius: "16px",
  display: "grid",
  placeItems: "center",
  color: "#FFFFFF",
  fontSize: "1.3rem",
  flex: "0 0 auto"
};

const aiAssistantTitleStyle = {
  margin: 0,
  fontSize: "1rem",
  fontWeight: 900
};

const aiAssistantDescriptionStyle = {
  margin: "0.45rem 0 0",
  color: "#475569",
  lineHeight: 1.6,
  fontSize: "0.95rem"
};

const projectsSectionStyle = {
  padding: "1.35rem",
  borderRadius: "30px",
  background: "rgba(255, 255, 255, 0.76)",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  boxShadow: "0 20px 55px rgba(15, 23, 42, 0.06)"
};

const sectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "1rem",
  marginBottom: "1.1rem",
  flexWrap: "wrap"
};

const sectionTitleStyle = {
  margin: 0,
  color: "#0F172A",
  fontSize: "1.45rem",
  letterSpacing: "0",
  fontWeight: 900
};

const sectionSubtitleStyle = {
  margin: "0.25rem 0 0",
  color: "#64748B",
  fontSize: "0.92rem",
  fontWeight: 700
};

const controlsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.65rem",
  flexWrap: "wrap"
};

const viewToggleStyle = {
  display: "inline-flex",
  padding: "0.25rem",
  borderRadius: "15px",
  background: "#F1F5F9",
  border: "1px solid rgba(148, 163, 184, 0.18)"
};

const projectGridStyle = {
  display: "grid",
  gap: "1rem"
};

const emptySearchStyle = {
  padding: "2rem",
  textAlign: "center",
  color: "#64748B",
  fontWeight: 800,
  borderRadius: "22px",
  background: "#F8FAFC",
  border: "1px dashed #CBD5E1"
};

const bottomSectionStyle = {
  display: "grid",
  gridTemplateColumns: "1.2fr 1fr 1fr",
  gap: "1rem",
  marginTop: "1.25rem"
};

const progressPanelStyle = {
  padding: "1.25rem",
  borderRadius: "26px",
  background: "#FFFFFF",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  boxShadow: "0 18px 45px rgba(15, 23, 42, 0.06)"
};

const tipPanelStyle = {
  ...progressPanelStyle,
  background: "linear-gradient(135deg, #FFF7ED, #FFFFFF)"
};

const suggestionPanelStyle = {
  ...progressPanelStyle,
  background: "linear-gradient(135deg, #EEF2FF, #FFFFFF)"
};

const panelKickerStyle = {
  display: "block",
  color: "#2563EB",
  fontSize: "0.78rem",
  fontWeight: 900,
  marginBottom: "0.55rem"
};

const panelTitleStyle = {
  margin: 0,
  color: "#0F172A",
  fontSize: "1.05rem",
  fontWeight: 900
};

const panelTextStyle = {
  margin: "0.55rem 0 0",
  color: "#64748B",
  lineHeight: 1.6,
  fontWeight: 650,
  fontSize: "0.9rem"
};

const progressTrackStyle = {
  height: "12px",
  borderRadius: "999px",
  background: "#E2E8F0",
  overflow: "hidden",
  marginTop: "1rem"
};

const progressFillStyle = {
  height: "100%",
  borderRadius: "999px",
  background: "linear-gradient(90deg, #2563EB, #14B8A6)",
  transition: "width 0.3s ease"
};

const modalTextStyle = {
  color: "rgba(255, 255, 255, 0.7)",
  lineHeight: 1.5,
  marginBottom: "1.5rem"
};

const modalErrorStyle = {
  color: "#FF8A8A",
  marginBottom: "1rem"
};

const modalActionsStyle = {
  display: "flex",
  gap: "0.75rem",
  justifyContent: "flex-end",
  flexWrap: "wrap"
};

const dashboardCss = `
  .dashboard-nav-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.78rem 0.85rem;
    border: 0;
    border-radius: 16px;
    background: transparent;
    color: #475569;
    font: inherit;
    font-size: 0.92rem;
    font-weight: 800;
    cursor: pointer;
    transition: transform 0.18s ease, background 0.18s ease, color 0.18s ease;
    text-align: left;
  }

  .dashboard-nav-item:hover,
  .dashboard-nav-item.is-active {
    background: #EEF6FF;
    color: #2563EB;
    transform: translateX(2px);
  }

  .theme-toggle,
  .notification-button,
  .icon-button,
  .view-button {
    border: 0;
    cursor: pointer;
    font: inherit;
    transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
  }

  .theme-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.55rem;
    width: 100%;
    padding: 0.72rem;
    border-radius: 16px;
    background: #F8FAFC;
    color: #334155;
    border: 1px solid rgba(148, 163, 184, 0.16);
    font-weight: 850;
  }

  .theme-toggle:hover,
  .notification-button:hover,
  .icon-button:hover,
  .view-button:hover {
    transform: translateY(-1px);
  }

  .icon-button {
    margin-left: auto;
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    border-radius: 13px;
    background: #F8FAFC;
    color: #64748B;
  }

  .notification-button {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.86);
    color: #334155;
    border: 1px solid rgba(148, 163, 184, 0.18);
    box-shadow: 0 14px 35px rgba(15, 23, 42, 0.06);
  }

  .search-input {
    width: 100%;
    border: 0;
    outline: 0;
    background: transparent;
    color: #0F172A;
    font: inherit;
    font-weight: 750;
    min-width: 0;
  }

  .search-input::placeholder {
    color: #94A3B8;
  }

  .save-button {
    border: 0;
    border-radius: 999px;
    background: #2563EB;
    color: #FFFFFF;
    padding: 0.62rem 1rem;
    font: inherit;
    font-weight: 900;
    cursor: pointer;
    box-shadow: 0 12px 25px rgba(37, 99, 235, 0.22);
  }

  .floating-card {
    position: absolute;
    z-index: 3;
    min-width: 132px;
    padding: 0.85rem 1rem;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid rgba(148, 163, 184, 0.18);
    box-shadow: 0 22px 50px rgba(15, 23, 42, 0.12);
    backdrop-filter: blur(18px);
  }

  .floating-card span,
  .floating-card strong {
    display: block;
  }

  .floating-card span {
    color: #64748B;
    font-size: 0.74rem;
    font-weight: 850;
  }

  .floating-card strong {
    color: #0F172A;
    margin-top: 0.2rem;
    font-size: 1rem;
  }

  .robotics-card { top: 0.4rem; left: 0.4rem; }
  .code-card { right: 0.25rem; top: 4.4rem; }
  .science-card { left: 3.1rem; bottom: 0.25rem; }

  .hero-orbit {
    position: absolute;
    right: 3.1rem;
    bottom: 1rem;
    width: 190px;
    height: 190px;
    border-radius: 999px;
    background:
      radial-gradient(circle at 50% 50%, rgba(255,255,255,0.96), rgba(255,255,255,0.55)),
      conic-gradient(from 20deg, #2563EB, #14B8A6, #F97316, #8B5CF6, #2563EB);
    display: grid;
    place-items: center;
    box-shadow: 0 28px 65px rgba(37, 99, 235, 0.18);
  }

  .hero-core {
    width: 118px;
    height: 118px;
    border-radius: 38px;
    display: grid;
    place-items: center;
    background: #FFFFFF;
    color: #2563EB;
    font-weight: 950;
    box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.16);
  }

  .action-card {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    min-height: 96px;
    padding: 1rem;
    border: 1px solid rgba(148, 163, 184, 0.16);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.86);
    color: #0F172A;
    text-align: left;
    font: inherit;
    cursor: pointer;
    box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  }

  .action-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 24px 65px rgba(15, 23, 42, 0.1);
    border-color: color-mix(in srgb, var(--action-color) 35%, transparent);
  }

  .action-card:disabled {
    opacity: 0.62;
    cursor: not-allowed;
  }

  .action-icon {
    width: 50px;
    height: 50px;
    border-radius: 18px;
    display: grid;
    place-items: center;
    background: color-mix(in srgb, var(--action-color) 12%, white);
    flex: 0 0 auto;
  }

  .action-card strong,
  .action-card small {
    display: block;
  }

  .action-card strong {
    font-size: 1rem;
    font-weight: 950;
  }

  .action-card small {
    color: #64748B;
    margin-top: 0.2rem;
    font-weight: 700;
  }

  .filter-select {
    height: 42px;
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 14px;
    padding: 0 0.8rem;
    background: #FFFFFF;
    color: #334155;
    font: inherit;
    font-weight: 800;
    outline: 0;
  }

  .filter-select:disabled {
    opacity: 0.55;
  }

  .view-button {
    width: 36px;
    height: 34px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    color: #64748B;
    background: transparent;
  }

  .view-button.is-active {
    background: #FFFFFF;
    color: #2563EB;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
  }

  .project-card-modern {
    overflow: hidden;
    border-radius: 26px;
    background: #FFFFFF;
    border: 1px solid rgba(148, 163, 184, 0.16);
    box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .project-card-modern:hover {
    transform: translateY(-4px);
    box-shadow: 0 28px 70px rgba(15, 23, 42, 0.12);
  }

  .project-card-modern.is-list {
    display: grid;
    grid-template-columns: 230px 1fr;
  }

  .project-image {
    min-height: 150px;
    position: relative;
    background:
      radial-gradient(circle at 25% 25%, rgba(255,255,255,0.5), transparent 28%),
      linear-gradient(135deg, color-mix(in srgb, var(--project-color) 82%, white), color-mix(in srgb, var(--project-color) 28%, white));
    display: flex;
    align-items: flex-end;
    padding: 1rem;
    color: #FFFFFF;
    font-weight: 950;
  }

  .project-image-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px);
    background-size: 24px 24px;
    mask-image: linear-gradient(to bottom, rgba(0,0,0,0.45), transparent);
  }

  .project-image span {
    position: relative;
    z-index: 2;
    padding: 0.42rem 0.65rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.22);
    backdrop-filter: blur(12px);
  }

  .project-body {
    padding: 1rem;
  }

  .project-card-topline {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.7rem;
    margin-bottom: 0.65rem;
  }

  .category-pill {
    display: inline-flex;
    max-width: 72%;
    padding: 0.35rem 0.6rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--project-color) 10%, white);
    color: var(--project-color);
    font-size: 0.75rem;
    font-weight: 950;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .favorite-button {
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 13px;
    background: #F8FAFC;
    color: #94A3B8;
    cursor: pointer;
  }

  .favorite-button.is-favorite {
    color: #F97316;
    background: #FFF7ED;
  }

  .project-body h3 {
    margin: 0;
    color: #0F172A;
    font-size: 1.05rem;
    line-height: 1.25;
    font-weight: 950;
  }

  .project-body p {
    margin: 0.45rem 0 0;
    color: #64748B;
    line-height: 1.5;
    font-size: 0.88rem;
    font-weight: 650;
  }

  .project-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    margin-top: 0.85rem;
  }

  .project-meta span {
    padding: 0.34rem 0.5rem;
    border-radius: 999px;
    background: #F8FAFC;
    color: #475569;
    font-size: 0.74rem;
    font-weight: 850;
  }

  .project-card-actions {
    display: flex;
    gap: 0.55rem;
    margin-top: 1rem;
  }

  .project-card-actions button {
    border: 0;
    border-radius: 13px;
    padding: 0.58rem 0.78rem;
    background: #EFF6FF;
    color: #2563EB;
    font: inherit;
    font-size: 0.82rem;
    font-weight: 950;
    cursor: pointer;
  }

  .project-card-actions .delete-project-button {
    background: #FEF2F2;
    color: #DC2626;
  }

  @media (max-width: 1120px) {
    ${""}
  }

  @media (max-width: 980px) {
    body {
      overflow-x: hidden;
    }

    aside {
      display: none !important;
    }

    main {
      padding: 1rem !important;
    }

    section[style] {
      max-width: 100%;
    }

    .action-card {
      min-height: 88px;
    }
  }

  @media (max-width: 820px) {
    .project-card-modern.is-list {
      grid-template-columns: 1fr;
    }
  }

  /* ===== TOGGLE SWITCH ===== */
  .toggle-switch {
    width: 44px;
    height: 24px;
    border-radius: 999px;
    background: #CBD5E1;
    position: relative;
    transition: background 0.25s ease;
    flex: 0 0 auto;
  }

  .toggle-switch.is-on {
    background: #2563EB;
  }

  .toggle-knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: #FFFFFF;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    transition: transform 0.25s ease;
  }

  .toggle-switch.is-on .toggle-knob {
    transform: translateX(20px);
  }

  /* ===== DARK MODE ===== */
  .is-dark .dashboard-nav-item { color: #8B9BB4 !important; }
  .is-dark .dashboard-nav-item:hover,
  .is-dark .dashboard-nav-item.is-active {
    background: rgba(37, 99, 235, 0.18) !important;
    color: #60A5FA !important;
  }

  .is-dark .theme-toggle {
    background: rgba(255, 255, 255, 0.07) !important;
    color: #8B9BB4 !important;
    border-color: rgba(255, 255, 255, 0.09) !important;
  }

  .is-dark .icon-button {
    background: rgba(255, 255, 255, 0.08) !important;
    color: #8B9BB4 !important;
  }

  .is-dark .notification-button {
    background: rgba(255, 255, 255, 0.08) !important;
    color: #94A3B8 !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
  }

  .is-dark .search-input { color: #E2E8F0 !important; }
  .is-dark .search-input::placeholder { color: #475569 !important; }

  .is-dark header label {
    background: rgba(15, 20, 45, 0.8) !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
  }

  .is-dark .dash-motivation-card {
    background: rgba(20, 28, 65, 0.9) !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
    color: #E2E8F0 !important;
  }

  .is-dark .dash-motivation-card strong { color: #E2E8F0 !important; }
  .is-dark .dash-motivation-card p { color: #94A3B8 !important; }

  .is-dark .dash-motivation-icon {
    background: rgba(255, 255, 255, 0.1) !important;
    color: #60A5FA !important;
  }

  .is-dark .dash-user-card {
    background: rgba(14, 18, 45, 0.95) !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
  }

  .is-dark .dash-user-card strong { color: #E2E8F0 !important; }
  .is-dark .dash-user-card span { color: #64748B !important; }

  .is-dark header h1 { color: #E2E8F0 !important; }

  .is-dark .dash-hero {
    background: linear-gradient(135deg, rgba(20, 25, 60, 0.95), rgba(15, 20, 50, 0.9)) !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
  }

  .is-dark .dash-hero h2 { color: #E2E8F0 !important; }
  .is-dark .dash-hero p { color: rgba(148, 163, 184, 0.9) !important; }

  .is-dark .floating-card {
    background: rgba(15, 20, 50, 0.88) !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
  }

  .is-dark .floating-card span { color: #64748B !important; }
  .is-dark .floating-card strong { color: #E2E8F0 !important; }

  .is-dark .action-card {
    background: rgba(18, 22, 55, 0.95) !important;
    color: #E2E8F0 !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
  }

  .is-dark .action-card strong { color: #E2E8F0 !important; }
  .is-dark .action-card small { color: #8B9BB4 !important; }

  .is-dark .filter-select {
    background: rgba(18, 22, 55, 0.9) !important;
    color: #E2E8F0 !important;
    border-color: rgba(255, 255, 255, 0.12) !important;
  }

  .is-dark .view-button { color: #64748B !important; }

  .is-dark .view-button.is-active {
    background: rgba(37, 99, 235, 0.2) !important;
    color: #60A5FA !important;
    box-shadow: none !important;
  }

  .is-dark [style*="rgba(255, 255, 255, 0.76)"] {
    background: rgba(14, 18, 45, 0.92) !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
  }

  .is-dark [style*="rgba(255, 255, 255, 0.76)"] h2 { color: #E2E8F0 !important; }
  .is-dark [style*="rgba(255, 255, 255, 0.76)"] p { color: #94A3B8 !important; }

  .is-dark .project-card-modern {
    background: rgba(14, 18, 45, 0.95) !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
  }

  .is-dark .project-body h3 { color: #E2E8F0 !important; }
  .is-dark .project-body p { color: #94A3B8 !important; }

  .is-dark .project-meta span {
    background: rgba(255, 255, 255, 0.07) !important;
    color: #94A3B8 !important;
  }

  .is-dark .project-card-actions button {
    background: rgba(37, 99, 235, 0.18) !important;
    color: #60A5FA !important;
  }

  .is-dark .project-card-actions .delete-project-button {
    background: rgba(220, 38, 38, 0.15) !important;
    color: #F87171 !important;
  }

  .is-dark .favorite-button {
    background: rgba(255, 255, 255, 0.07) !important;
    color: #475569 !important;
  }

  .is-dark .favorite-button.is-favorite {
    background: rgba(249, 115, 22, 0.15) !important;
    color: #F97316 !important;
  }

  .is-dark .dash-bottom > div {
    background: rgba(14, 18, 45, 0.9) !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
  }

  .is-dark .dash-bottom h3 { color: #E2E8F0 !important; }
  .is-dark .dash-bottom p { color: #94A3B8 !important; }
  .is-dark .dash-bottom span { color: #60A5FA !important; }

  .is-dark [style*="rgba(219, 234, 254"] {
    background: rgba(30, 35, 80, 0.9) !important;
    border-color: rgba(37, 99, 235, 0.3) !important;
    color: #93C5FD !important;
  }
`;
