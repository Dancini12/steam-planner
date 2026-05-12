// ============================================================
// App.jsx
// Componente raiz do STEAM Planner — orquestra a navegação
// ============================================================
//
// Este é o "maestro" do app. Ele mantém o estado de qual tela
// está sendo exibida e decide qual página renderizar conforme
// a navegação do professor:
//
//   Dashboard  →  Library / ProjectEditor
//   Library    →  Dashboard / ProjectEditor (após escolher template)
//   ProjectEditor  →  Dashboard / PhaseEditor
//   PhaseEditor    →  ProjectEditor / outra fase
//
// Também aplica o tema visual global (fundo escuro, fonte,
// reset de margens) que dá ao app a identidade neon STEAM.
// ============================================================

import { useState, useEffect } from "react";

import Dashboard from "./pages/Dashboard.jsx";
import ActivityViewer from "./pages/ActivityViewer.jsx";
import Library from "./pages/Library.jsx";
import ProjectEditor from "./pages/ProjectEditor.jsx";
import PhaseEditor from "./pages/PhaseEditor.jsx";
import BibliographyEditor from "./pages/BibliographyEditor.jsx";
import Settings from "./pages/Settings.jsx";
import Login from "./pages/Login.jsx";
import { supabase } from "./lib/supabaseClient.js";
import { getUserData, trackEvent } from "./lib/analytics.js";

// ------------------------------------------------------------
// CONSTANTES DE NAVEGAÇÃO
// ------------------------------------------------------------
// Centralizar os nomes das telas evita erros de digitação
// espalhados pelo código.
// ------------------------------------------------------------
const SCREENS = {
  DASHBOARD: "dashboard",
  ACTIVITY_VIEWER: "activity_viewer",
  LIBRARY: "library",
  PROJECT_EDITOR: "project_editor",
  PHASE_EDITOR: "phase_editor",
  BIBLIOGRAPHY_EDITOR: "bibliography_editor",
  SETTINGS: "settings"
};

// ------------------------------------------------------------
// COMPONENTE APP
// ------------------------------------------------------------
export default function App() {
  // Estado de navegação: qual tela está visível
  const [currentScreen, setCurrentScreen] = useState(SCREENS.DASHBOARD);

  // Quando navega para ProjectEditor ou PhaseEditor, precisamos
  // saber qual projeto e qual fase estão sendo editados
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [activePhaseId, setActivePhaseId] = useState(null);
  const [activeActivityResult, setActiveActivityResult] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // ----------------------------------------------------------
  // APLICAR TEMA VISUAL GLOBAL AO BODY
  // ----------------------------------------------------------
  // Define cores e fontes da página inteira uma única vez,
  // quando o app monta. Garante consistência visual.
  // ----------------------------------------------------------
  useEffect(() => {
    document.body.style.background = "#0F0F2D";
    document.body.style.color = "#FFFFFF";
    document.body.style.fontFamily =
      "'Plus Jakarta Sans', 'Segoe UI', system-ui, -apple-system, sans-serif";
    document.body.style.margin = "0";
    document.body.style.minHeight = "100vh";
    document.body.style.lineHeight = "1.5";

    // Suaviza o scroll
    document.documentElement.style.scrollBehavior = "smooth";
  }, []);

  useEffect(() => {
    let isCurrent = true;
    const sessionTimeout = window.setTimeout(() => {
      if (isCurrent) {
        setIsCheckingSession(false);
      }
    }, 800);

    if (supabase) {
      async function loadUser() {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (isCurrent && session?.user) {
            setCurrentUser(getUserData(session.user));
          }
        } catch (error) {
          console.error("Erro ao restaurar sessão:", error);
        } finally {
          if (isCurrent) {
            window.clearTimeout(sessionTimeout);
            setIsCheckingSession(false);
          }
        }
      }

      loadUser();

      const {
        data: { subscription }
      } = supabase.auth.onAuthStateChange((_event, session) => {
        const user = session?.user || null;
        setCurrentUser(user ? getUserData(user) : null);
      });

      return () => {
        isCurrent = false;
        window.clearTimeout(sessionTimeout);
        subscription.unsubscribe();
      };
    }

    {
      console.warn("Supabase indisponível");
      setIsCheckingSession(false);
      return () => {
        isCurrent = false;
        window.clearTimeout(sessionTimeout);
      };
    }
  }, []);

  // ----------------------------------------------------------
  // NAVEGAÇÃO ENTRE TELAS
  // ----------------------------------------------------------
  // Cada função define como ir de uma tela para outra.
  // Isolar a navegação aqui mantém as páginas focadas no
  // que mostrar, sem se preocupar em saber para onde levar.
  // ----------------------------------------------------------

  // Vai para o dashboard (tela inicial)
  const goToDashboard = () => {
    setCurrentScreen(SCREENS.DASHBOARD);
    setActiveProjectId(null);
    setActivePhaseId(null);
    setActiveActivityResult(null);
  };

  // Abre o visualizador/editor da atividade gerada
  const goToActivityViewer = (result, projectId) => {
    setActiveActivityResult(result);
    setActiveProjectId(projectId || null);
    setCurrentScreen(SCREENS.ACTIVITY_VIEWER);
  };

  // Vai para a biblioteca de modelos
  const goToLibrary = () => {
    setCurrentScreen(SCREENS.LIBRARY);
  };

  // Abre um projeto específico para edição
  const goToProjectEditor = (projectId) => {
    setActiveProjectId(projectId);
    setCurrentScreen(SCREENS.PROJECT_EDITOR);
  };

  // Abre uma fase específica de um projeto
  const goToPhaseEditor = (phaseId) => {
    setActivePhaseId(phaseId);
    setCurrentScreen(SCREENS.PHASE_EDITOR);
  };

  // Volta da fase ao projeto
  const goBackToProject = () => {
    setActivePhaseId(null);
    setCurrentScreen(SCREENS.PROJECT_EDITOR);
  };

  // Abre o editor de referências bibliográficas
  const goToBibliographyEditor = () => {
    setCurrentScreen(SCREENS.BIBLIOGRAPHY_EDITOR);
  };

  // Vai para as configurações
  const goToSettings = () => {
    setCurrentScreen(SCREENS.SETTINGS);
  };

  // Troca a fase atual mantendo o mesmo projeto
  const changePhase = (newPhaseId) => {
    setActivePhaseId(newPhaseId);
    // Rola para o topo ao trocar de fase
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogout = async () => {
    if (currentUser?.id) {
      await trackEvent(currentUser.id, "logout");
    }
    if (supabase) {
      await supabase.auth.signOut();
    } else {
      console.warn("Supabase indisponível");
    }
    setCurrentUser(null);
    goToDashboard();
  };

  // ----------------------------------------------------------
  // ESTILO DO CONTÊINER PRINCIPAL
  // ----------------------------------------------------------
  const appStyle = {
    minHeight: "100vh",
    background:
      "radial-gradient(ellipse at top, #1A1A3E 0%, #0F0F2D 50%, #0A0A1F 100%)"
  };

  // ----------------------------------------------------------
  // RENDERIZAÇÃO CONDICIONAL DA TELA ATUAL
  // ----------------------------------------------------------
  if (isCheckingSession) {
    return (
      <div style={appStyle}>
        <div style={{ padding: "2rem", color: "rgba(255, 255, 255, 0.7)" }}>
          Carregando...
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  return (
    <div style={appStyle}>
      {currentScreen === SCREENS.DASHBOARD && (
        <Dashboard
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenProject={goToProjectEditor}
          onOpenLibrary={goToLibrary}
          onOpenSettings={goToSettings}
          onOpenActivityViewer={goToActivityViewer}
        />
      )}

      {currentScreen === SCREENS.ACTIVITY_VIEWER && activeActivityResult && (
        <ActivityViewer
          activityData={activeActivityResult.activity || {}}
          formData={activeActivityResult.formData || {}}
          projectId={activeProjectId}
          currentUser={currentUser}
          onBack={goToDashboard}
        />
      )}

      {currentScreen === SCREENS.LIBRARY && (
        <Library
          currentUser={currentUser}
          onBack={goToDashboard}
          onOpenProject={goToProjectEditor}
          onOpenActivityViewer={goToActivityViewer}
        />
      )}

      {currentScreen === SCREENS.PROJECT_EDITOR && activeProjectId && (
        <ProjectEditor
          projectId={activeProjectId}
          currentUser={currentUser}
          onBack={goToDashboard}
          onOpenPhase={goToPhaseEditor}
          onOpenBibliography={goToBibliographyEditor}
        />
      )}

      {currentScreen === SCREENS.PHASE_EDITOR &&
        activeProjectId &&
        activePhaseId && (
          <PhaseEditor
            projectId={activeProjectId}
            phaseId={activePhaseId}
            currentUser={currentUser}
            onBack={goBackToProject}
            onChangePhase={changePhase}
          />
        )}

      {currentScreen === SCREENS.BIBLIOGRAPHY_EDITOR && activeProjectId && (
        <BibliographyEditor
          projectId={activeProjectId}
          currentUser={currentUser}
          onBack={goBackToProject}
        />
      )}

      {currentScreen === SCREENS.SETTINGS && (
        <Settings
          currentUser={currentUser}
          onBack={goToDashboard}
        />
      )}
    </div>
  );
}
