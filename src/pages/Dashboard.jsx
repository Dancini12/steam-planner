import { useState } from "react";
import { useProjects } from "../hooks/useProjects.js";
import { PedagogicalPlannerService } from "../lib/ai/pedagogicalPlannerService.js";
import PedagogicalPlannerModal from "../components/project/PedagogicalPlannerModal.jsx";

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
  onOpenActivityViewer
}) {
  const { projects, addProjectFromTemplate, isLoaded } = useProjects(currentUser?.id);
  const [showPedagogicalModal, setShowPedagogicalModal] = useState(false);
  const [creationError, setCreationError] = useState("");

  const professorName = currentUser?.name || currentUser?.email?.split("@")[0] || "Professor";
  const firstName = professorName.split(" ")[0] || "Professor";
  const accessibilityPreset = ["baixa_visao", "grupos_colaborativos"];

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
      const steamLetters = Object.keys(data.steamMatrix || {}).filter((key) =>
        ["S", "T", "E", "A", "M"].includes(key)
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
    }
  };

  if (!isLoaded) {
    return (
      <div className="retro-dashboard reduced-glow visual-accessibility">
        <style>{retroCss}</style>
        <div className="retro-loading">CARREGANDO...</div>
      </div>
    );
  }

  return (
    <div className="retro-dashboard reduced-glow visual-accessibility">
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
        <header className="retro-hero">
          <section className="retro-title-block">
            <div className="retro-brand">
              <h1>STEAM+</h1>
              <p>CULTURA MAKER</p>
            </div>

            <div className="speech-box">
              <strong>OLÁ, {firstName.toUpperCase()}!</strong>
              <span>Pronto para planejar atividades pedagógicas com propósito.</span>
            </div>
          </section>

          <section className="pixel-computer" aria-label="Computador antigo feliz">
            <div className="computer-top">
              <div className="computer-screen">
                <div className="computer-eye left" />
                <div className="computer-eye right" />
                <div className="computer-smile" />
              </div>
            </div>
            <div className="computer-base" />
          </section>

          <button type="button" className="logout-chip" onClick={onLogout}>
            SAIR
          </button>
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
        accessibilityPreset={accessibilityPreset}
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

  .retro-shell {
    position: relative;
    z-index: 3;
    width: min(1180px, calc(100% - 32px));
    min-height: 100vh;
    margin: 0 auto;
    padding: 34px 0 108px;
  }

  .retro-hero {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 230px;
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
    font-size: clamp(2.1rem, 5.2vw, 4.3rem);
    font-weight: 700;
    line-height: 1.05;
    text-shadow:
      2px 0 rgba(34, 211, 238, 0.45),
      -2px 0 rgba(255, 79, 216, 0.32);
    letter-spacing: 0;
  }

  .retro-brand p {
    margin: 0;
    color: #FFFFFF;
    font-size: clamp(2.1rem, 5.2vw, 4.3rem);
    font-weight: 700;
    line-height: 1.05;
    text-shadow: 0 0 6px rgba(255, 255, 255, 0.12);
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

  .logout-chip {
    position: absolute;
    top: 14px;
    right: 14px;
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

  .pixel-computer {
    justify-self: center;
    width: 180px;
    image-rendering: pixelated;
    filter: drop-shadow(0 0 14px rgba(34, 211, 238, 0.18));
  }

  .computer-top {
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
      linear-gradient(180deg, rgba(57, 255, 136, 0.24), rgba(34, 211, 238, 0.2)),
      #031B1C;
  }

  .computer-eye {
    position: absolute;
    top: 32px;
    width: 14px;
    height: 18px;
    background: #39FF88;
    box-shadow: 0 0 8px rgba(57, 255, 136, 0.38);
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

  .primary-grid {
    display: grid;
    gap: 22px;
    grid-template-columns: repeat(4, minmax(0, 1fr));
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

  @media (max-width: 1040px) {
    .primary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .retro-hero {
      grid-template-columns: minmax(0, 1fr) 190px;
    }

    .pixel-computer {
      width: 160px;
    }

  }

  @media (max-width: 720px) {
    .retro-shell {
      width: min(100% - 22px, 560px);
      padding-top: 18px;
      padding-bottom: 92px;
    }

    .retro-hero {
      grid-template-columns: 1fr;
      padding: 20px;
      text-align: left;
    }

    .pixel-computer {
      width: 138px;
      justify-self: start;
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

    .logout-chip {
      top: 10px;
      right: 10px;
    }

    .speech-box {
      padding: 15px;
    }
  }
`;
