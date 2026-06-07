import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useProjects } from "../hooks/useProjects.js";
import { PedagogicalPlannerService } from "../lib/ai/pedagogicalPlannerService.js";
import { trackEvent } from "../lib/analytics.js";
import Modal from "../components/ui/Modal.jsx";
import PedagogicalPlannerModal from "../components/project/PedagogicalPlannerModal.jsx";
import FeedbackModal from "../components/project/FeedbackModal.jsx";

const COMPETENCY_TO_LETTER = {
  science: "S",
  technology: "T",
  engineering: "E",
  arts: "A",
  mathematics: "M"
};

function formatSupabaseError(error) {
  return [
    error?.message,
    error?.details,
    error?.hint,
    error?.code ? `Código: ${error.code}` : ""
  ].filter(Boolean).join(" | ");
}

function PixelIcon({ type }) {
  return (
    <div className={`pixel-icon pixel-${type}`} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

function DashboardCard({ title, text, icon, color, size = "large", onClick }) {
  return (
    <article className={`retro-card retro-card-${size}`} style={{ "--card-color": color }}>
      <div className="retro-card-glow" />
      <PixelIcon type={icon} />
      <div className="retro-card-copy">
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      <button type="button" className="retro-button" onClick={onClick}>
        ACESSAR
      </button>
    </article>
  );
}

export default function Dashboard({
  currentUser,
  onLogout,
  onOpenProject,
  onOpenLibrary,
  onOpenBNCC,
  onOpenActivityViewer,
  autoOpenModal,
  onAutoOpenModalHandled,
}) {
  const { projects, addProjectFromTemplate, isLoaded } = useProjects(currentUser?.id);
  const [showPedagogicalModal, setShowPedagogicalModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showFeedbackListModal, setShowFeedbackListModal] = useState(false);
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [creationError, setCreationError] = useState("");
  const computerRef = useRef(null);
  const [themeMode, setThemeMode] = useState(
    () => localStorage.getItem("steam-dashboard-theme") || "dark"
  );

  const professorName = currentUser?.name || currentUser?.email?.split("@")[0] || "Professor";
  const firstName = professorName.split(" ")[0] || "Professor";
  const isLightMode = themeMode === "light";
  const ADMIN_EMAIL_FALLBACK = (import.meta.env.VITE_ADMIN_EMAIL || "").toLowerCase() || null;

  useEffect(() => {
    if (autoOpenModal && isLoaded) {
      setShowPedagogicalModal(true);
      onAutoOpenModalHandled?.();
    }
  }, [autoOpenModal, isLoaded]);

  useEffect(() => {
    if (!currentUser?.email) {
      setIsAdmin(false);
      return undefined;
    }

    let isMounted = true;
    const checkAdmin = async () => {
      // Allow a simple local fallback using VITE_ADMIN_EMAIL for testing
      try {
        if (ADMIN_EMAIL_FALLBACK && currentUser.email?.toLowerCase() === ADMIN_EMAIL_FALLBACK) {
          setIsAdmin(true);
          return;
        }
      } catch (e) {
        // ignore
      }
      try {
        const { data, error } = await supabase
          .from("app_admins")
          .select("email")
          .ilike("email", currentUser.email)
          .limit(1);

        if (!isMounted) return;
        if (error) {
          console.error("Erro ao verificar admin:", error);
          setIsAdmin(false);
          return;
        }

        setIsAdmin(Array.isArray(data) && data.length > 0);
      } catch (error) {
        if (!isMounted) return;
        console.error("Erro ao verificar admin:", error);
        setIsAdmin(false);
      }
    };

    checkAdmin();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.email]);

  useEffect(() => {
    if (!isAdmin) {
      setFeedbackList([]);
      setFeedbackError("");
      setFeedbackLoading(false);
      return undefined;
    }

    let isMounted = true;
    const loadFeedback = async () => {
      setFeedbackLoading(true);
      setFeedbackError("");

      const { data, error } = await supabase
        .from("feedback")
        .select("id, category, message, sender_name, sender_email, user_id, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!isMounted) return;

      if (error) {
        console.error("Erro ao carregar feedbacks:", error);
        setFeedbackError("Não foi possível carregar os feedbacks.");
        setFeedbackList([]);
      } else {
        setFeedbackList(data || []);
      }

      setFeedbackLoading(false);
    };

    loadFeedback();
    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!isLoaded) return undefined;

    const computer = computerRef.current;
    if (!computer) return undefined;

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    const updateComputerLook = (event) => {
      const rect = computer.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const x = clamp((event.clientX - centerX) / 150, -1, 1);
      const y = clamp((event.clientY - centerY) / 120, -1, 1);

      computer.style.setProperty("--eye-x", `${Math.round(x * 7)}px`);
      computer.style.setProperty("--eye-y", `${Math.round(y * 5)}px`);
      computer.style.setProperty("--screen-light-x", `${50 + x * 18}%`);
      computer.style.setProperty("--screen-light-y", `${42 + y * 16}%`);
    };

    const resetComputerLook = () => {
      computer.style.setProperty("--eye-x", "0px");
      computer.style.setProperty("--eye-y", "0px");
      computer.style.setProperty("--screen-light-x", "50%");
      computer.style.setProperty("--screen-light-y", "42%");
    };

    window.addEventListener("pointermove", updateComputerLook);
    window.addEventListener("pointerleave", resetComputerLook);
    resetComputerLook();

    return () => {
      window.removeEventListener("pointermove", updateComputerLook);
      window.removeEventListener("pointerleave", resetComputerLook);
    };
  }, [isLoaded]);

  const toggleThemeMode = () => {
    const nextMode = isLightMode ? "dark" : "light";
    setThemeMode(nextMode);
    localStorage.setItem("steam-dashboard-theme", nextMode);
  };

  const handleOpenProjects = () => {
    if (projects.length > 0) {
      onOpenProject(projects[0].id);
      return;
    }

    onOpenLibrary();
  };

  const handlePedagogicalActivityGenerated = async (result) => {
    setCreationError("");
    try {
      const data = result.activity || {};
      const generatedAt = result.generatedAt || data.generatedAt || new Date().toISOString();
      const steamLetters = Object.keys(data.steamMatrix || {}).filter((key) =>
        ["S", "T", "E", "A", "M"].includes(key)
      );
      const fallbackSteamLetters = (result.competencies || [])
        .map((key) => COMPETENCY_TO_LETTER[String(key).toLowerCase()])
        .filter(Boolean);
      const selectedSteamLetters = steamLetters.length
        ? steamLetters
        : [...new Set(fallbackSteamLetters)];

      const newProject = await addProjectFromTemplate(
        {
          ...data,
          steam: selectedSteamLetters,
          grade: data.grade || result.formData?.grade,
          generatedAt,
          source: "pedagogical-planner"
        },
        { waitForPersist: true }
      );

      PedagogicalPlannerService.incrementUsage(
        currentUser?.id,
        result.formData?.discipline,
        result.competencies || []
      ).catch(console.error);

      trackEvent(currentUser?.id, "activity_generated", {
        projectId: newProject.id,
        title: data.title,
        theme: data.theme,
        grade: data.grade || result.formData?.grade,
        discipline: result.formData?.discipline,
        steam: selectedSteamLetters,
        bncc: data.bncc || [],
        competencies: result.competencies || []
      }).catch(console.error);

      onOpenActivityViewer(
        { ...result, activity: { ...data, generatedAt } },
        newProject.id
      );
    } catch (error) {
      console.error("Erro ao salvar atividade pedagógica:", error);
      setCreationError(
        `Não foi possível salvar a atividade. ${formatSupabaseError(error)}`
      );
    }
  };

  if (!isLoaded) {
    return (
      <div className={`retro-dashboard reduced-glow visual-accessibility theme-${themeMode}`}>
        <style>{retroCss}</style>
        <div className="retro-loading">CARREGANDO...</div>
      </div>
    );
  }

  return (
    <div className={`retro-dashboard reduced-glow visual-accessibility theme-${themeMode}`}>
      <style>{retroCss}</style>

      <div className="pixel-stars" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>

      <main className="retro-shell">
        <div className="top-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleThemeMode}
            aria-pressed={isLightMode}
          >
            {isLightMode ? "Modo escuro" : "Modo claro"}
          </button>
          <button type="button" className="logout-chip" onClick={onLogout}>
            SAIR
          </button>
        </div>

        <header className="retro-hero">
          <section className="retro-title-block">
            <div className="retro-brand">
              <h1>STEAM+</h1>
              <p>CULTURA MAKER</p>
            </div>
          </section>

          <section
            ref={computerRef}
            className="pixel-computer"
            aria-label="Computador antigo feliz dando boas-vindas"
          >
            <div className="speech-box computer-speech" aria-live="polite">
              <strong>OLÁ, {firstName.toUpperCase()}!</strong>
              <span>Pronto para planejar atividades pedagógicas com propósito.</span>
            </div>
            <div className="computer-top">
              <div className="computer-screen">
                <div className="computer-eye left" />
                <div className="computer-eye right" />
                <div className="computer-smile" />
              </div>
            </div>
            <div className="computer-base" />
          </section>

        </header>

        {creationError && <div className="retro-error">{creationError}</div>}

        <section className="primary-grid" aria-label="Acessos principais">
          <DashboardCard
            title="GERAR NOVA ATIVIDADE"
            icon="document"
            text="Crie atividades personalizadas em poucos passos"
            color="#39FF88"
            onClick={() => setShowPedagogicalModal(true)}
          />
          <DashboardCard
            title="MEUS PROJETOS"
            icon="folder"
            text="Acesse e gerencie seus projetos"
            color="#22D3EE"
            onClick={handleOpenProjects}
          />
          <DashboardCard
            title="BIBLIOTECA"
            icon="books"
            text="Explore atividades prontas para usar"
            color="#FF4FD8"
            onClick={onOpenLibrary}
          />
          <DashboardCard
            title="BNCC"
            icon="bncc"
            text="Consulte a BNCC e alinhamentos"
            color="#FDE047"
            onClick={onOpenBNCC}
          />
          {isAdmin && (
            <DashboardCard
              title="FEEDBACKS RECEBIDOS"
              icon="feedback"
              text="Veja os feedbacks enviados pelos usuários"
              color="#F97316"
              onClick={() => setShowFeedbackListModal(true)}
            />
          )}
          <DashboardCard
            title="FEEDBACK"
            icon="feedback"
            text="Compartilhe sua experiência e ajude a melhorar a plataforma"
            color="#A78BFA"
            onClick={() => setShowFeedbackModal(true)}
          />
        </section>

        <footer className="retro-footer">
          <span className="footer-pixel footer-apple" aria-hidden="true" />
          <strong>EDUCAÇÃO COM PROPÓSITO. TECNOLOGIA COM SENTIDO.</strong>
          <span className="footer-pixel footer-star" aria-hidden="true" />
        </footer>
      </main>

      <div className="neon-grid" aria-hidden="true" />

      <PedagogicalPlannerModal
        isOpen={showPedagogicalModal}
        onClose={() => setShowPedagogicalModal(false)}
        onActivityGenerated={handlePedagogicalActivityGenerated}
        currentUser={currentUser}
      />

      <Modal
        isOpen={showFeedbackListModal}
        onClose={() => setShowFeedbackListModal(false)}
        title="Feedbacks recebidos"
        maxWidth="760px"
      >
        {feedbackLoading && <p>Carregando feedbacks...</p>}
        {feedbackError && <div className="retro-error">{feedbackError}</div>}
        {!feedbackLoading && !feedbackError && feedbackList.length === 0 && (
          <p>Nenhum feedback encontrado.</p>
        )}
        {!feedbackLoading && feedbackList.length > 0 && (
          <div className="feedback-list">
            {feedbackList.map((item) => (
              <article key={item.id} className="feedback-card">
                <header className="feedback-card-header">
                  <strong>{item.category || "Geral"}</strong>
                  <span>
                    {item.created_at
                      ? new Date(item.created_at).toLocaleString("pt-BR")
                      : ""}
                  </span>
                </header>
                <p className="feedback-message">{item.message}</p>
                <div className="feedback-meta">
                  <span>{item.sender_name || "Usuário"}</span>
                  {item.sender_email && <span>{item.sender_email}</span>}
                  {item.user_id && <span>{item.user_id}</span>}
                </div>
              </article>
            ))}
          </div>
        )}
      </Modal>

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        currentUser={currentUser}
      />

    </div>
  );
}

const retroCss = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  * {
    box-sizing: border-box;
  }

  .retro-dashboard {
    position: relative;
    min-height: 100vh;
    overflow: hidden;
    color: #F8FAFC;
    background:
      radial-gradient(circle at 18% 12%, rgba(34, 211, 238, 0.22), transparent 24rem),
      radial-gradient(circle at 82% 16%, rgba(255, 79, 216, 0.18), transparent 26rem),
      linear-gradient(180deg, #050816 0%, #071026 48%, #020617 100%);
    font-family: 'Inter', system-ui, sans-serif;
  }

  .retro-dashboard::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 1;
    background:
      repeating-linear-gradient(
        to bottom,
        rgba(255, 255, 255, 0.022) 0,
        rgba(255, 255, 255, 0.022) 1px,
        transparent 1px,
        transparent 4px
      );
    mix-blend-mode: screen;
    opacity: 0.20;
  }

  .retro-dashboard::after {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 1;
    background: radial-gradient(circle at center, transparent 58%, rgba(0, 0, 0, 0.48));
  }

  .feedback-list {
    display: grid;
    gap: 1rem;
    margin-top: 1rem;
  }

  .feedback-card {
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    background: rgba(15, 23, 42, 0.96);
  }

  .feedback-card-header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.75rem;
    font-size: 0.95rem;
    color: #f8fafc;
  }

  .feedback-message {
    white-space: pre-wrap;
    line-height: 1.65;
    color: #e2e8f0;
    margin: 0 0 0.75rem;
  }

  .feedback-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    color: #94a3b8;
    font-size: 0.9rem;
  }

  .retro-shell {
    position: relative;
    z-index: 3;
    width: min(1180px, calc(100% - 32px));
    min-height: 100vh;
    margin: 0 auto;
    padding: 82px 0 108px;
  }

  .retro-hero {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(290px, 330px);
    gap: 28px;
    align-items: center;
    min-height: 236px;
    margin-bottom: 28px;
    padding: 28px;
    border: 4px solid rgba(34, 211, 238, 0.35);
    border-radius: 18px;
    background:
      linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.5)),
      repeating-linear-gradient(90deg, rgba(255,255,255,0.015) 0 2px, transparent 2px 16px);
    box-shadow:
      0 0 0 4px rgba(2, 6, 23, 0.78),
      0 0 18px rgba(34, 211, 238, 0.16),
      inset 0 0 18px rgba(255, 79, 216, 0.04);
  }

  .retro-title-block {
    min-width: 0;
  }

  .retro-brand {
    display: flex;
    align-items: center;
    gap: clamp(10px, 1.8vw, 20px);
    flex-wrap: nowrap;
    white-space: nowrap;
  }

  .retro-brand h1 {
    margin: 0;
    color: #FDE047;
    font-size: clamp(1.9rem, 4.4vw, 3.55rem);
    font-weight: 600;
    line-height: 1.08;
    text-shadow: none;
    letter-spacing: 0;
  }

  .retro-brand p {
    margin: 0;
    color: #FFFFFF;
    font-size: clamp(1.9rem, 4.4vw, 3.55rem);
    font-weight: 600;
    line-height: 1.08;
    text-shadow: none;
  }

  .speech-box {
    position: relative;
    width: min(620px, 100%);
    margin-top: 28px;
    padding: 18px 20px;
    border: 3px solid #FFFFFF;
    border-radius: 12px;
    background: rgba(2, 6, 23, 0.84);
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.07);
  }

  .speech-box::after {
    content: "";
    position: absolute;
    left: 28px;
    bottom: -16px;
    width: 22px;
    height: 22px;
    background: rgba(2, 6, 23, 0.84);
    border-right: 3px solid #FFFFFF;
    border-bottom: 3px solid #FFFFFF;
    transform: rotate(45deg);
  }

  .speech-box strong,
  .speech-box span {
    display: block;
  }

  .speech-box strong {
    color: #39FF88;
    font-size: clamp(0.78rem, 1.9vw, 1rem);
    line-height: 1.6;
  }

  .speech-box span {
    margin-top: 6px;
    color: #FFFFFF;
    font-size: clamp(1rem, 2.2vw, 1.25rem);
    font-weight: 700;
  }

  .top-actions {
    position: absolute;
    top: 24px;
    right: 0;
    display: flex;
    gap: 8px;
    align-items: center;
    z-index: 5;
  }

  .logout-chip,
  .theme-toggle {
    border: 2px solid #FF4FD8;
    border-radius: 10px;
    background: #0B1022;
    color: #FFB7EF;
    padding: 9px 11px;
    font: inherit;
    font-size: 0.58rem;
    cursor: pointer;
    box-shadow: 0 0 8px rgba(255, 79, 216, 0.15);
  }

  .theme-toggle {
    border-color: #38BDF8;
    color: #BAE6FD;
    font-size: 0.58rem;
  }

  .pixel-computer {
    --eye-x: 0px;
    --eye-y: 0px;
    --screen-light-x: 50%;
    --screen-light-y: 42%;
    justify-self: end;
    display: grid;
    justify-items: center;
    gap: 14px;
    width: min(320px, 100%);
    image-rendering: pixelated;
    filter: drop-shadow(0 0 14px rgba(34, 211, 238, 0.18));
  }

  .computer-speech {
    width: 100%;
    margin: 0;
    padding: 14px 16px;
    animation: computerSpeechIn 0.52s ease-out both;
  }

  .computer-speech::after {
    left: calc(50% - 11px);
  }

  .computer-top {
    width: 180px;
    padding: 18px;
    border: 5px solid #22D3EE;
    border-radius: 18px 18px 10px 10px;
    background: #C084FC;
    box-shadow: inset -8px -8px 0 rgba(30, 41, 59, 0.38);
  }

  .computer-screen {
    position: relative;
    height: 104px;
    border: 5px solid #111827;
    border-radius: 10px;
    background:
      radial-gradient(circle at var(--screen-light-x) var(--screen-light-y), rgba(57, 255, 136, 0.36), transparent 34px),
      linear-gradient(180deg, rgba(57, 255, 136, 0.24), rgba(34, 211, 238, 0.2)),
      #031B1C;
    overflow: hidden;
  }

  .computer-screen::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0.06) 0,
      rgba(255, 255, 255, 0.06) 1px,
      transparent 1px,
      transparent 8px
    );
    opacity: 0.24;
  }

  .computer-eye {
    position: absolute;
    top: 32px;
    width: 14px;
    height: 18px;
    background: #39FF88;
    box-shadow: 0 0 8px rgba(57, 255, 136, 0.38);
    transform: translate(var(--eye-x), var(--eye-y));
    transition: transform 90ms linear;
    will-change: transform;
    z-index: 1;
  }

  .computer-eye::after {
    content: "";
    position: absolute;
    right: 3px;
    top: 3px;
    width: 3px;
    height: 4px;
    background: rgba(3, 27, 28, 0.62);
  }

  .computer-eye.left {
    left: 35px;
  }

  .computer-eye.right {
    right: 35px;
  }

  .computer-smile {
    position: absolute;
    left: 50%;
    bottom: 25px;
    width: 48px;
    height: 22px;
    border-bottom: 7px solid #39FF88;
    border-radius: 0 0 28px 28px;
    transform: translateX(-50%);
    z-index: 1;
  }

  .computer-base {
    width: 132px;
    height: 28px;
    margin: 8px auto 0;
    border: 4px solid #22D3EE;
    border-radius: 0 0 16px 16px;
    background: #7C3AED;
    box-shadow: inset -8px -4px 0 rgba(15, 23, 42, 0.36);
  }

  @keyframes computerSpeechIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .primary-grid {
    display: grid;
    gap: 22px;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    margin-bottom: 22px;
  }

  .retro-card {
    position: relative;
    isolation: isolate;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
    border: 3px solid var(--card-color);
    border-radius: 16px;
    background:
      linear-gradient(180deg, rgba(15, 23, 42, 0.95), rgba(2, 6, 23, 0.92)),
      repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 12px);
    box-shadow:
      0 0 0 3px rgba(2, 6, 23, 0.85),
      0 0 14px color-mix(in srgb, var(--card-color) 22%, transparent),
      inset 0 0 12px rgba(255, 255, 255, 0.018);
    overflow: hidden;
  }

  .retro-card-large {
    min-height: 282px;
    padding: 24px;
  }

  .retro-card-small {
    min-height: 244px;
    padding: 20px;
  }

  .retro-card-glow {
    position: absolute;
    inset: auto -30% -35% -30%;
    z-index: -1;
    height: 120px;
    background: radial-gradient(circle, color-mix(in srgb, var(--card-color) 12%, transparent), transparent 68%);
  }

  .retro-card h2 {
    margin: 18px 0 0;
    color: #FFFFFF;
    font-size: clamp(0.74rem, 1.4vw, 1rem);
    line-height: 1.45;
    text-shadow: 0 0 12px color-mix(in srgb, var(--card-color) 60%, transparent);
  }

  .retro-card p {
    margin: 12px 0 18px;
    color: #CBD5E1;
    font-size: 1.05rem;
    font-weight: 600;
    line-height: 1.45;
  }

  .retro-card-copy {
    flex: 1;
  }

  .retro-button {
    width: 100%;
    min-height: 44px;
    border: 2px solid var(--card-color);
    border-radius: 10px;
    background: rgba(2, 6, 23, 0.86);
    color: var(--card-color);
    font: inherit;
    font-size: 0.63rem;
    cursor: pointer;
    box-shadow: 0 0 8px color-mix(in srgb, var(--card-color) 14%, transparent);
    transition: transform 0.16s ease, background 0.16s ease, color 0.16s ease;
  }

  .retro-button:hover {
    transform: translateY(-2px);
    background: var(--card-color);
    color: #020617;
  }

  .pixel-icon {
    position: relative;
    width: 78px;
    height: 72px;
    flex: 0 0 auto;
    image-rendering: pixelated;
  }

  .pixel-icon span {
    position: absolute;
    display: block;
  }

  .pixel-folder {
    background:
      linear-gradient(#22D3EE 0 0) 8px 24px / 60px 38px no-repeat,
      linear-gradient(#0EA5E9 0 0) 8px 16px / 28px 16px no-repeat,
      linear-gradient(#155E75 0 0) 12px 52px / 52px 8px no-repeat;
  }

  .pixel-folder span:nth-child(1) {
    left: 48px;
    top: 24px;
    width: 10px;
    height: 10px;
    background: #FDE047;
    box-shadow:
      10px 0 #FDE047,
      5px -5px #FDE047,
      5px 5px #FDE047;
  }

  .pixel-books {
    background:
      linear-gradient(#FF4FD8 0 0) 10px 16px / 13px 48px no-repeat,
      linear-gradient(#22D3EE 0 0) 28px 10px / 13px 54px no-repeat,
      linear-gradient(#FDE047 0 0) 46px 20px / 13px 44px no-repeat,
      linear-gradient(#FFFFFF 0 0) 8px 64px / 58px 7px no-repeat;
  }

  .pixel-bncc {
    background:
      linear-gradient(#FDE047 0 0) 14px 8px / 48px 58px no-repeat,
      linear-gradient(#111827 0 0) 20px 18px / 36px 8px no-repeat,
      linear-gradient(#111827 0 0) 20px 32px / 28px 6px no-repeat,
      linear-gradient(#39FF88 0 0) 44px 46px / 10px 18px no-repeat,
      linear-gradient(#39FF88 0 0) 32px 54px / 14px 10px no-repeat;
  }

  .pixel-bncc::after {
    content: "BNCC";
    position: absolute;
    left: 20px;
    top: 17px;
    color: #FDE047;
    font-size: 0.45rem;
  }

  .pixel-document {
    background:
      linear-gradient(#FFFFFF 0 0) 18px 8px / 42px 56px no-repeat,
      linear-gradient(#CBD5E1 0 0) 52px 8px / 8px 12px no-repeat,
      linear-gradient(#39FF88 0 0) 29px 32px / 20px 8px no-repeat,
      linear-gradient(#39FF88 0 0) 35px 26px / 8px 20px no-repeat;
  }

  .pixel-feedback {
    background:
      linear-gradient(#A78BFA 0 0) 8px 10px / 58px 44px no-repeat,
      linear-gradient(#A78BFA 0 0) 18px 54px / 16px 10px no-repeat,
      linear-gradient(#A78BFA 0 0) 14px 60px / 10px 6px no-repeat,
      linear-gradient(#1E1B4B 0 0) 18px 22px / 36px 6px no-repeat,
      linear-gradient(#1E1B4B 0 0) 18px 34px / 24px 6px no-repeat;
  }

  .retro-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 18px;
    margin-top: 30px;
    padding: 20px 12px;
    color: #FFFFFF;
    text-align: center;
    font-size: clamp(0.62rem, 1.5vw, 0.86rem);
    line-height: 1.55;
    text-shadow: 0 0 10px rgba(57, 255, 136, 0.18);
  }

  .footer-pixel {
    position: relative;
    width: 28px;
    height: 28px;
    flex: 0 0 auto;
  }

  .footer-apple {
    background:
      linear-gradient(#EF4444 0 0) 6px 9px / 18px 16px no-repeat,
      linear-gradient(#39FF88 0 0) 16px 3px / 8px 6px no-repeat,
      linear-gradient(#7F1D1D 0 0) 13px 1px / 5px 8px no-repeat;
  }

  .footer-star {
    background:
      linear-gradient(#FDE047 0 0) 12px 0 / 6px 28px no-repeat,
      linear-gradient(#FDE047 0 0) 0 12px / 28px 6px no-repeat,
      linear-gradient(#FDE047 0 0) 6px 6px / 16px 16px no-repeat;
    filter: drop-shadow(0 0 7px rgba(253, 224, 71, 0.28));
  }

  .pixel-stars i {
    position: fixed;
    z-index: 2;
    width: 4px;
    height: 4px;
    background: #FFFFFF;
    opacity: 0.6;
    box-shadow: 0 0 5px currentColor;
  }

  .pixel-stars i:nth-child(1) { left: 8%; top: 18%; color: #22D3EE; }
  .pixel-stars i:nth-child(2) { left: 22%; top: 8%; color: #FDE047; }
  .pixel-stars i:nth-child(3) { left: 72%; top: 10%; color: #FF4FD8; }
  .pixel-stars i:nth-child(4) { left: 88%; top: 28%; color: #39FF88; }
  .pixel-stars i:nth-child(5) { left: 12%; top: 68%; color: #A78BFA; }
  .pixel-stars i:nth-child(6) { left: 81%; top: 68%; color: #38BDF8; }
  .pixel-stars i:nth-child(7) { left: 50%; top: 6%; color: #FFFFFF; }
  .pixel-stars i:nth-child(8) { left: 45%; top: 76%; color: #FB923C; }

  .neon-grid {
    position: fixed;
    left: -15%;
    right: -15%;
    bottom: -12px;
    z-index: 2;
    height: 210px;
    pointer-events: none;
    transform: perspective(420px) rotateX(58deg);
    transform-origin: bottom center;
    background-image:
      linear-gradient(rgba(34, 211, 238, 0.28) 2px, transparent 2px),
      linear-gradient(90deg, rgba(255, 79, 216, 0.22) 2px, transparent 2px);
    background-size: 46px 28px;
    box-shadow: 0 -18px 40px rgba(34, 211, 238, 0.08);
    opacity: 0.38;
  }

  .retro-error,
  .retro-loading {
    position: relative;
    z-index: 4;
    width: min(760px, calc(100% - 32px));
    margin: 0 auto 22px;
    padding: 16px;
    border: 3px solid #FB7185;
    border-radius: 12px;
    background: rgba(69, 10, 10, 0.78);
    color: #FFE4E6;
    font-weight: 700;
  }

  .retro-loading {
    min-height: 100vh;
    display: grid;
    place-items: center;
    border: 0;
    background: transparent;
    color: #39FF88;
    font-family: 'Inter', system-ui, sans-serif;
    font-weight: 700;
  }

  .reduced-glow {
    background:
      radial-gradient(circle at 18% 12%, rgba(34, 211, 238, 0.05), transparent 24rem),
      radial-gradient(circle at 82% 16%, rgba(255, 79, 216, 0.04), transparent 26rem),
      linear-gradient(180deg, #050816 0%, #071026 48%, #020617 100%);
  }

  .reduced-glow::before {
    opacity: 0.07;
  }

  .reduced-glow .pixel-stars,
  .reduced-glow .retro-card-glow {
    opacity: 0.20;
  }

  .reduced-glow .retro-hero,
  .reduced-glow .retro-card,
  .reduced-glow .retro-footer {
    box-shadow:
      0 0 0 3px rgba(2, 6, 23, 0.85),
      0 0 6px rgba(34, 211, 238, 0.07),
      inset 0 0 8px rgba(255, 255, 255, 0.012);
  }

  .reduced-glow .retro-brand h1,
  .reduced-glow .retro-card h2,
  .reduced-glow .retro-brand p {
    text-shadow: none;
  }

  .visual-accessibility .retro-card,
  .visual-accessibility .speech-box {
    background: rgba(2, 6, 23, 0.96);
  }

  .retro-card p,
  .speech-box span,
  .visual-accessibility .retro-card p,
  .visual-accessibility .speech-box span {
    color: #FFFFFF;
    font-size: 1.05rem;
  }

  .visual-accessibility .retro-button {
    min-height: 48px;
  }

  .theme-light.reduced-glow {
    color: #1F2937;
    background:
      radial-gradient(circle at 18% 12%, rgba(79, 70, 229, 0.08), transparent 24rem),
      radial-gradient(circle at 82% 16%, rgba(16, 185, 129, 0.08), transparent 26rem),
      linear-gradient(180deg, #F8FAFC 0%, #F5F7FB 52%, #EEF2FF 100%);
  }

  .theme-light::before {
    opacity: 0.035;
    mix-blend-mode: normal;
  }

  .theme-light::after {
    display: none;
  }

  .theme-light .retro-hero {
    border-color: rgba(79, 70, 229, 0.18);
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.9)),
      repeating-linear-gradient(90deg, rgba(79, 70, 229, 0.035) 0 2px, transparent 2px 16px);
  }

  .theme-light .retro-brand h1 {
    color: #4F46E5;
  }

  .theme-light .retro-brand p,
  .theme-light .retro-footer {
    color: #1F2937;
  }

  .theme-light .speech-box {
    border-color: #CBD5E1;
    background: rgba(255, 255, 255, 0.94);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  }

  .theme-light .speech-box::after {
    background: rgba(255, 255, 255, 0.94);
    border-color: #CBD5E1;
  }

  .theme-light .speech-box strong {
    color: #047857;
  }

  .theme-light .speech-box span,
  .theme-light.visual-accessibility .speech-box span {
    color: #374151;
  }

  .theme-light .retro-card,
  .theme-light.visual-accessibility .retro-card {
    background:
      linear-gradient(180deg, #FFFFFF, #F8FAFC),
      repeating-linear-gradient(45deg, rgba(79,70,229,0.03) 0 2px, transparent 2px 12px);
    box-shadow:
      0 0 0 1px rgba(148, 163, 184, 0.24),
      0 18px 30px rgba(15, 23, 42, 0.09);
  }

  .theme-light .retro-card h2 {
    color: #1F2937;
  }

  .theme-light .retro-card p,
  .theme-light.visual-accessibility .retro-card p {
    color: #4B5563;
  }

  .theme-light .retro-button {
    background: #FFFFFF;
    box-shadow: none;
  }

  .theme-light .theme-toggle {
    background: #E0F2FE;
    color: #075985;
  }

  .theme-light .logout-chip {
    background: #FCE7F3;
    color: #9D174D;
  }

  .theme-light .neon-grid {
    opacity: 0.12;
  }

  .theme-light .pixel-stars {
    opacity: 0.18;
  }

  @media (max-width: 1200px) {
    .primary-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 1040px) {
    .primary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .retro-hero {
      grid-template-columns: minmax(0, 1fr) minmax(250px, 280px);
    }

    .pixel-computer {
      width: min(280px, 100%);
    }

    .computer-top {
      width: 160px;
    }

  }

  @media (max-width: 720px) {
    .retro-shell {
      width: min(100% - 22px, 560px);
      padding-top: 76px;
      padding-bottom: 92px;
    }

    .retro-hero {
      grid-template-columns: 1fr;
      padding: 20px;
      text-align: left;
    }

    .pixel-computer {
      width: min(100%, 320px);
      justify-self: start;
    }

    .computer-top {
      width: 138px;
      padding: 14px;
    }

    .computer-screen {
      height: 82px;
    }

    .primary-grid {
      grid-template-columns: 1fr;
    }
    .retro-card-large,
    .retro-card-small {
      min-height: 0;
    }

    .top-actions {
      top: 18px;
      right: 0;
    }

    .speech-box {
      padding: 15px;
    }
  }
`;
