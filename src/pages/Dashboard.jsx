import { useEffect, useRef, useState } from "react";
import { useProjects } from "../hooks/useProjects.js";
import { PedagogicalPlannerService } from "../lib/ai/pedagogicalPlannerService.js";
import PedagogicalPlannerModal from "../components/project/PedagogicalPlannerModal.jsx";
import ActivityAdaptationModal from "../components/project/ActivityAdaptationModal.jsx";
import CreationTipsModal from "../components/project/CreationTipsModal.jsx";

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

const REAL_WORLD_NEWS = [
  {
    id: "ia-escola",
    category: "Inteligência Artificial",
    source: "Porvir",
    title: "IA na escola: como transformar tecnologia em investigação dos alunos",
    summary: "Debates sobre uso responsável de inteligência artificial inspiram projetos de autoria, ética, dados e resolução de problemas reais.",
    discipline: "Robótica",
    grade: "8º ano - Ensino Fundamental",
    steamCompetencies: ["technology", "engineering", "arts"],
    imageTheme: "ai"
  },
  {
    id: "clima-cidades",
    category: "Meio Ambiente",
    source: "ONU Brasil",
    title: "Cidades buscam soluções para calor extremo e eventos climáticos",
    summary: "Mudanças climáticas aproximam ciência, território e prototipagem de soluções simples para proteger a comunidade escolar.",
    discipline: "Ciências",
    grade: "7º ano - Ensino Fundamental",
    steamCompetencies: ["science", "engineering", "mathematics"],
    imageTheme: "climate"
  },
  {
    id: "lixo-eletronico",
    category: "Sustentabilidade",
    source: "National Geographic Brasil",
    title: "Lixo eletrônico cresce e desafia consumo, descarte e reciclagem",
    summary: "O ciclo de vida dos aparelhos permite investigar materiais, impacto ambiental e criar campanhas ou protótipos de reaproveitamento.",
    discipline: "Ciências",
    grade: "6º ano - Ensino Fundamental",
    steamCompetencies: ["science", "technology", "engineering"],
    imageTheme: "recycle"
  },
  {
    id: "educacao-maker",
    category: "Educação",
    source: "Nova Escola",
    title: "Aprendizagem mão na massa ganha espaço em práticas interdisciplinares",
    summary: "Experiências maker ajudam professores a conectar currículo, colaboração e produção de soluções concretas pelos estudantes.",
    discipline: "Língua Portuguesa",
    grade: "6º ano - Ensino Fundamental",
    steamCompetencies: ["engineering", "arts", "technology"],
    imageTheme: "education"
  },
  {
    id: "economia-domestica",
    category: "Economia",
    source: "InfoMoney",
    title: "Educação financeira aproxima orçamento, escolhas e consumo consciente",
    summary: "Dados do cotidiano podem virar simulações, planilhas, protótipos de economia e debates sobre tomada de decisão.",
    discipline: "Educação Financeira",
    grade: "9º ano - Ensino Fundamental",
    steamCompetencies: ["mathematics", "technology", "engineering"],
    imageTheme: "economy"
  },
  {
    id: "cultura-digital",
    category: "Cultura Digital",
    source: "Olhar Digital",
    title: "Cultura digital muda comunicação, criação e segurança na internet",
    summary: "Temas como privacidade, algoritmos e produção de mídia rendem projetos de análise crítica e criação de campanhas digitais.",
    discipline: "Língua Portuguesa",
    grade: "8º ano - Ensino Fundamental",
    steamCompetencies: ["technology", "arts", "mathematics"],
    imageTheme: "digital"
  },
  {
    id: "ciencia-cotidiano",
    category: "Ciência",
    source: "BBC Brasil",
    title: "Descobertas científicas do cotidiano ajudam a explicar fenômenos reais",
    summary: "Perguntas próximas da vida dos estudantes favorecem investigação, experimentação e comunicação científica acessível.",
    discipline: "Ciências",
    grade: "6º ano - Ensino Fundamental",
    steamCompetencies: ["science", "mathematics", "arts"],
    imageTheme: "science"
  },
  {
    id: "empreendedorismo-social",
    category: "Empreendedorismo",
    source: "Valor Econômico",
    title: "Projetos de impacto social unem inovação, planejamento e comunidade",
    summary: "Problemas locais podem ser transformados em mapas de necessidades, protótipos e propostas de intervenção dos alunos.",
    discipline: "Geografia",
    grade: "9º ano - Ensino Fundamental",
    steamCompetencies: ["engineering", "technology", "mathematics"],
    imageTheme: "society"
  },
  {
    id: "tecnologia-acessivel",
    category: "Tecnologia",
    source: "Canaltech",
    title: "Tecnologias acessíveis ampliam inclusão e autonomia no dia a dia",
    summary: "Soluções simples com sensores, papelaria ou materiais reaproveitados estimulam empatia, design e testes com usuários.",
    discipline: "Robótica",
    grade: "7º ano - Ensino Fundamental",
    steamCompetencies: ["technology", "engineering", "science"],
    imageTheme: "tech"
  },
  {
    id: "sociedade-dados",
    category: "Sociedade",
    source: "BBC Brasil",
    title: "Dados públicos ajudam a compreender desigualdades e propor soluções",
    summary: "Leitura de gráficos e indicadores pode virar investigação territorial, painéis visuais e propostas para a comunidade.",
    discipline: "Geografia",
    grade: "8º ano - Ensino Fundamental",
    steamCompetencies: ["mathematics", "technology", "arts"],
    imageTheme: "data"
  }
];

const NEWS_CATEGORIES = [
  "Ciência",
  "Tecnologia",
  "Sustentabilidade",
  "Educação",
  "Economia",
  "Inteligência Artificial",
  "Meio Ambiente",
  "Sociedade",
  "Cultura Digital",
  "Empreendedorismo"
];

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
  const [showAdaptationModal, setShowAdaptationModal] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [creationError, setCreationError] = useState("");
  const [generatingNewsId, setGeneratingNewsId] = useState("");
  const [visualAccessibility, setVisualAccessibility] = useState(
    () => localStorage.getItem("steam-visual-accessibility") === "true"
  );
  const realWorldRef = useRef(null);

  const professorName = currentUser?.name || currentUser?.email?.split("@")[0] || "Professor";
  const firstName = professorName.split(" ")[0] || "Professor";
  const accessibilityPreset = visualAccessibility ? ["baixa_visao", "grupos_colaborativos"] : [];

  useEffect(() => {
    localStorage.setItem("steam-visual-accessibility", String(visualAccessibility));
  }, [visualAccessibility]);

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

  const handleGenerateFromNews = async (news) => {
    setCreationError("");
    setGeneratingNewsId(news.id);

    try {
      const customInstructions = [
        `Use a notícia/conteúdo atual como contexto central da atividade.`,
        `Título da notícia: ${news.title}`,
        `Resumo da notícia: ${news.summary}`,
        `Fonte confiável: ${news.source}`,
        `Categoria: ${news.category}`,
        "Conecte a atividade a um problema real observado pelos estudantes.",
        "Inclua Cultura Maker com construção de protótipo, campanha, painel, modelo físico ou solução testável.",
        "Oriente o professor a usar a notícia na abertura da aula, como provocação investigativa."
      ].join("\n");

      const formData = {
        discipline: news.discipline,
        grade: news.grade,
        theme: news.title,
        steamCompetencies: news.steamCompetencies,
        numberOfClasses: "3",
        personalization: {
          detailLevel: "roteiro_completo",
          materials: "baixo_custo",
          accessibility: accessibilityPreset,
          assessment: "observacao"
        },
        manualInstructions: customInstructions,
        customInstructions,
        userId: currentUser?.id
      };

      const result = await PedagogicalPlannerService.generatePedagogicalActivity(formData);
      await handlePedagogicalActivityGenerated({ ...result, formData });
    } catch (error) {
      console.error("Erro ao gerar atividade a partir da notícia:", error);
      setCreationError(error.message || "Não foi possível gerar a atividade a partir da notícia.");
    } finally {
      setGeneratingNewsId("");
    }
  };

  if (!isLoaded) {
    return (
      <div className={`retro-dashboard reduced-glow${visualAccessibility ? " visual-accessibility" : ""}`}>
        <style>{retroCss}</style>
        <div className="retro-loading">CARREGANDO...</div>
      </div>
    );
  }

  return (
    <div className={`retro-dashboard reduced-glow${visualAccessibility ? " visual-accessibility" : ""}`}>
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
              <span>Pronto para criar atividades incríveis?</span>
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

        <section className="accessibility-panel" aria-label="Opções de acessibilidade">
          <div>
            <strong>ACESSIBILIDADE</strong>
            <span>Personalize a tela e a geração das atividades.</span>
          </div>
          <div className="accessibility-actions">
            <button
              type="button"
              className={visualAccessibility ? "accessibility-toggle active" : "accessibility-toggle"}
              aria-pressed={visualAccessibility}
              onClick={() => setVisualAccessibility((value) => !value)}
            >
              Apoio visual
            </button>
          </div>
        </section>

        {creationError && <div className="retro-error">{creationError}</div>}

        <section className="primary-grid" aria-label="Acessos principais">
          <DashboardCard
            title="PROJETOS"
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

        <section className="secondary-grid" aria-label="Acessos rápidos">
          <DashboardCard
            title="GERAR NOVA ATIVIDADE"
            icon="document"
            text="Crie atividades personalizadas em poucos passos"
            color="#39FF88"
            size="small"
            onClick={() => setShowPedagogicalModal(true)}
          />
          <DashboardCard
            title="DICAS PARA CRIAÇÃO DE ATIVIDADE"
            icon="bulb"
            text="Dicas e orientações para criar atividades incríveis"
            color="#FB923C"
            size="small"
            onClick={() => setShowTipsModal(true)}
          />
          <DashboardCard
            title="CONECTE COM O MUNDO REAL"
            icon="globe"
            text="Transforme temas atuais em atividades significativas"
            color="#38BDF8"
            size="small"
            onClick={() => realWorldRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          />
          <DashboardCard
            title="ADAPTAÇÃO DE ATIVIDADE"
            icon="adapt"
            text="Envie um PDF e receba sugestões de adaptação para acessibilidade"
            color="#A78BFA"
            size="small"
            onClick={() => setShowAdaptationModal(true)}
          />
        </section>

        <section ref={realWorldRef} className="real-world-feed" aria-label="Conecte com o mundo real">
          <div className="real-world-header">
            <div>
              <span className="real-world-kicker">CONECTE COM O MUNDO REAL</span>
              <h2>Atualidades para inspirar atividades STEAM</h2>
              <p>
                Notícias e conteúdos de fontes confiáveis para transformar ciência, tecnologia,
                sustentabilidade, economia e sociedade em experiências maker.
              </p>
            </div>
            <div className="real-world-sources">
              Canaltech · Olhar Digital · Nova Escola · Porvir · ONU Brasil · BBC Brasil
            </div>
          </div>

          <div className="news-category-row" aria-label="Categorias de notícias">
            {NEWS_CATEGORIES.map((category) => (
              <span key={category}>{category}</span>
            ))}
          </div>

          <div className="news-layout">
            <article className="featured-news-card">
              <div className={`news-image news-image-${REAL_WORLD_NEWS[0].imageTheme}`}>
                <span>{REAL_WORLD_NEWS[0].category}</span>
              </div>
              <div className="featured-news-content">
                <div className="news-meta">
                  <span>{REAL_WORLD_NEWS[0].source}</span>
                  <strong>{REAL_WORLD_NEWS[0].category}</strong>
                </div>
                <h3>{REAL_WORLD_NEWS[0].title}</h3>
                <p>{REAL_WORLD_NEWS[0].summary}</p>
                <button
                  type="button"
                  className="news-action-button"
                  onClick={() => handleGenerateFromNews(REAL_WORLD_NEWS[0])}
                  disabled={!!generatingNewsId}
                >
                  {generatingNewsId === REAL_WORLD_NEWS[0].id ? "Gerando..." : "Transformar em atividade"}
                </button>
              </div>
            </article>

            <div className="news-grid">
              {REAL_WORLD_NEWS.slice(1).map((news) => (
                <article key={news.id} className="news-card">
                  <div className={`news-thumb news-image-${news.imageTheme}`}>
                    <span>{news.category}</span>
                  </div>
                  <div className="news-card-body">
                    <div className="news-meta">
                      <span>{news.source}</span>
                      <strong>{news.category}</strong>
                    </div>
                    <h3>{news.title}</h3>
                    <p>{news.summary}</p>
                    <button
                      type="button"
                      className="news-action-button news-action-button-small"
                      onClick={() => handleGenerateFromNews(news)}
                      disabled={!!generatingNewsId}
                    >
                      {generatingNewsId === news.id ? "Gerando..." : "Gerar atividade"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
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

      <ActivityAdaptationModal
        isOpen={showAdaptationModal}
        onClose={() => setShowAdaptationModal(false)}
      />

      <CreationTipsModal
        isOpen={showTipsModal}
        onClose={() => setShowTipsModal(false)}
      />
    </div>
  );
}

const retroCss = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@400;500;700&display=swap');

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
    font-family: 'Press Start 2P', 'Inter', system-ui, sans-serif;
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

  .retro-brand h1 {
    margin: 0;
    color: #FDE047;
    font-size: clamp(2.3rem, 7vw, 5.1rem);
    line-height: 1;
    text-shadow:
      5px 0 #22D3EE,
      -5px 0 #FF4FD8,
      0 6px #7C3AED,
      0 0 22px rgba(253, 224, 71, 0.72);
    letter-spacing: 0;
  }

  .retro-brand p {
    margin: 12px 0 0;
    color: #FFFFFF;
    font-size: clamp(0.86rem, 2.3vw, 1.4rem);
    line-height: 1.35;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.25);
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
    font-family: 'Inter', system-ui, sans-serif;
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

  .accessibility-panel {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 24px;
    padding: 16px 18px;
    border: 3px solid rgba(57, 255, 136, 0.22);
    border-radius: 16px;
    background: rgba(2, 6, 23, 0.82);
    box-shadow:
      0 0 0 3px rgba(2, 6, 23, 0.75),
      0 0 10px rgba(57, 255, 136, 0.08);
  }

  .accessibility-panel strong,
  .accessibility-panel span {
    display: block;
  }

  .accessibility-panel strong {
    color: #39FF88;
    font-size: 0.72rem;
    line-height: 1.45;
  }

  .accessibility-panel span {
    margin-top: 6px;
    color: #E2E8F0;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 0.95rem;
    font-weight: 700;
    line-height: 1.45;
  }

  .accessibility-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: flex-end;
  }

  .accessibility-toggle {
    min-height: 42px;
    border: 2px solid #94A3B8;
    border-radius: 10px;
    background: #020617;
    color: #E2E8F0;
    padding: 0 14px;
    font: inherit;
    font-size: 0.58rem;
    cursor: pointer;
    box-shadow: 0 0 12px rgba(148, 163, 184, 0.2);
  }

  .accessibility-toggle.active {
    border-color: #39FF88;
    background: #39FF88;
    color: #020617;
    box-shadow: 0 0 10px rgba(57, 255, 136, 0.18);
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

  .primary-grid,
  .secondary-grid {
    display: grid;
    gap: 22px;
  }

  .primary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin-bottom: 22px;
  }

  .secondary-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
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
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 0.95rem;
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

  .pixel-bulb {
    background:
      linear-gradient(#FB923C 0 0) 25px 10px / 28px 30px no-repeat,
      linear-gradient(#FDE047 0 0) 30px 4px / 18px 10px no-repeat,
      linear-gradient(#FFFFFF 0 0) 32px 40px / 14px 17px no-repeat,
      linear-gradient(#FB923C 0 0) 28px 57px / 22px 8px no-repeat;
    filter: drop-shadow(0 0 8px rgba(251, 146, 60, 0.28));
  }

  .pixel-globe {
    background:
      radial-gradient(circle, #38BDF8 0 30px, transparent 31px) 8px 8px / 62px 62px no-repeat,
      linear-gradient(#39FF88 0 0) 24px 20px / 28px 9px no-repeat,
      linear-gradient(#39FF88 0 0) 16px 40px / 24px 9px no-repeat,
      linear-gradient(#FFFFFF 0 0) 50px 10px / 22px 18px no-repeat,
      linear-gradient(#FFFFFF 0 0) 58px 28px / 8px 8px no-repeat;
  }

  .pixel-adapt {
    background:
      linear-gradient(#A78BFA 0 0) 30px 4px / 18px 18px no-repeat,
      linear-gradient(#A78BFA 0 0) 33px 22px / 12px 20px no-repeat,
      linear-gradient(#A78BFA 0 0) 10px 28px / 58px 8px no-repeat,
      linear-gradient(#A78BFA 0 0) 22px 44px / 10px 22px no-repeat,
      linear-gradient(#A78BFA 0 0) 46px 44px / 10px 22px no-repeat;
    filter: drop-shadow(0 0 8px rgba(167, 139, 250, 0.28));
  }

  .real-world-feed {
    margin-top: 28px;
    padding: 24px;
    border-radius: 18px;
    background: #F5F7FB;
    color: #1F2937;
    font-family: 'Inter', system-ui, sans-serif;
    box-shadow:
      0 0 0 3px rgba(2, 6, 23, 0.78),
      0 18px 38px rgba(2, 6, 23, 0.28);
  }

  .real-world-header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(220px, 320px);
    gap: 20px;
    align-items: end;
    margin-bottom: 18px;
  }

  .real-world-kicker {
    display: inline-flex;
    align-items: center;
    min-height: 26px;
    padding: 0 10px;
    border-radius: 999px;
    background: rgba(79, 70, 229, 0.1);
    color: #4F46E5;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  .real-world-header h2 {
    margin: 12px 0 8px;
    color: #1F2937;
    font-size: clamp(1.45rem, 3vw, 2.2rem);
    line-height: 1.1;
    letter-spacing: 0;
  }

  .real-world-header p {
    max-width: 760px;
    margin: 0;
    color: #4B5563;
    font-size: 1rem;
    line-height: 1.55;
  }

  .real-world-sources {
    padding: 14px;
    border: 1px solid #E5E7EB;
    border-radius: 12px;
    background: #FFFFFF;
    color: #6B7280;
    font-size: 0.84rem;
    font-weight: 600;
    line-height: 1.55;
  }

  .news-category-row {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 2px 0 16px;
    margin-bottom: 6px;
  }

  .news-category-row span {
    flex: 0 0 auto;
    padding: 8px 12px;
    border: 1px solid #E5E7EB;
    border-radius: 999px;
    background: #FFFFFF;
    color: #374151;
    font-size: 0.82rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .news-layout {
    display: grid;
    grid-template-columns: minmax(320px, 0.9fr) minmax(0, 1.4fr);
    gap: 18px;
  }

  .featured-news-card,
  .news-card {
    background: #FFFFFF;
    border: 1px solid #E5E7EB;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.07);
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  }

  .featured-news-card:hover,
  .news-card:hover {
    transform: translateY(-3px);
    border-color: rgba(79, 70, 229, 0.26);
    box-shadow: 0 18px 32px rgba(15, 23, 42, 0.1);
  }

  .featured-news-card {
    display: flex;
    flex-direction: column;
    min-height: 100%;
  }

  .news-image,
  .news-thumb {
    position: relative;
    display: flex;
    align-items: flex-end;
    min-height: 238px;
    padding: 16px;
    overflow: hidden;
  }

  .news-thumb {
    min-height: 132px;
  }

  .news-image::before,
  .news-thumb::before {
    content: "";
    position: absolute;
    inset: 18%;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.22);
    filter: blur(22px);
  }

  .news-image span,
  .news-thumb span {
    position: relative;
    z-index: 1;
    padding: 7px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.92);
    color: #1F2937;
    font-size: 0.74rem;
    font-weight: 700;
  }

  .news-image-ai { background: linear-gradient(135deg, #4F46E5, #8B5CF6 55%, #10B981); }
  .news-image-climate { background: linear-gradient(135deg, #0EA5E9, #10B981 58%, #FDE047); }
  .news-image-recycle { background: linear-gradient(135deg, #064E3B, #10B981 60%, #A7F3D0); }
  .news-image-education { background: linear-gradient(135deg, #8B5CF6, #EC4899 58%, #FDE68A); }
  .news-image-economy { background: linear-gradient(135deg, #1F2937, #4F46E5 58%, #10B981); }
  .news-image-digital { background: linear-gradient(135deg, #2563EB, #06B6D4 56%, #8B5CF6); }
  .news-image-science { background: linear-gradient(135deg, #0891B2, #4F46E5 54%, #A7F3D0); }
  .news-image-society { background: linear-gradient(135deg, #7C2D12, #F97316 54%, #10B981); }
  .news-image-tech { background: linear-gradient(135deg, #111827, #4F46E5 56%, #38BDF8); }
  .news-image-data { background: linear-gradient(135deg, #1E293B, #8B5CF6 56%, #10B981); }

  .featured-news-content,
  .news-card-body {
    padding: 18px;
  }

  .featured-news-content {
    display: flex;
    flex: 1;
    flex-direction: column;
  }

  .news-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    color: #6B7280;
    font-size: 0.78rem;
    font-weight: 700;
  }

  .news-meta strong {
    padding: 4px 8px;
    border-radius: 999px;
    background: rgba(16, 185, 129, 0.1);
    color: #047857;
    font-size: 0.72rem;
  }

  .featured-news-content h3,
  .news-card h3 {
    margin: 0;
    color: #1F2937;
    line-height: 1.22;
    letter-spacing: 0;
  }

  .featured-news-content h3 {
    font-size: clamp(1.35rem, 2.5vw, 2rem);
  }

  .news-card h3 {
    font-size: 1rem;
  }

  .featured-news-content p,
  .news-card p {
    color: #4B5563;
    line-height: 1.55;
  }

  .featured-news-content p {
    flex: 1;
    margin: 12px 0 18px;
    font-size: 1rem;
  }

  .news-card p {
    margin: 9px 0 14px;
    font-size: 0.9rem;
  }

  .news-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .news-card {
    display: flex;
    min-width: 0;
    flex-direction: column;
  }

  .news-card-body {
    display: flex;
    flex: 1;
    flex-direction: column;
  }

  .news-card-body p {
    flex: 1;
  }

  .news-action-button {
    width: 100%;
    min-height: 44px;
    border: 0;
    border-radius: 10px;
    background: #4F46E5;
    color: #FFFFFF;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 0.92rem;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.16s ease, background 0.16s ease, opacity 0.16s ease;
  }

  .news-action-button:hover {
    transform: translateY(-1px);
    background: #4338CA;
  }

  .news-action-button:disabled {
    cursor: wait;
    opacity: 0.68;
    transform: none;
  }

  .news-action-button-small {
    min-height: 40px;
    background: #8B5CF6;
    font-size: 0.85rem;
  }

  .news-action-button-small:hover {
    background: #7C3AED;
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
    font-family: 'Inter', system-ui, sans-serif;
    font-weight: 700;
  }

  .retro-loading {
    min-height: 100vh;
    display: grid;
    place-items: center;
    border: 0;
    background: transparent;
    color: #39FF88;
    font-family: 'Press Start 2P', system-ui;
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
  .reduced-glow .accessibility-panel,
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

  .visual-accessibility {
    font-family: 'Inter', system-ui, sans-serif;
  }

  .visual-accessibility .retro-card,
  .visual-accessibility .speech-box,
  .visual-accessibility .accessibility-panel {
    background: rgba(2, 6, 23, 0.96);
  }

  .visual-accessibility .retro-card p,
  .visual-accessibility .speech-box span,
  .visual-accessibility .accessibility-panel span {
    color: #FFFFFF;
    font-size: 1.05rem;
  }

  .visual-accessibility .retro-button,
  .visual-accessibility .accessibility-toggle {
    min-height: 48px;
  }

  @media (max-width: 1040px) {
    .primary-grid,
    .secondary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .real-world-header,
    .news-layout {
      grid-template-columns: 1fr;
    }

    .news-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .retro-hero {
      grid-template-columns: minmax(0, 1fr) 190px;
    }

    .pixel-computer {
      width: 160px;
    }

    .accessibility-panel {
      align-items: flex-start;
      flex-direction: column;
    }

    .accessibility-actions {
      justify-content: flex-start;
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

    .primary-grid,
    .secondary-grid {
      grid-template-columns: 1fr;
    }

    .real-world-feed {
      padding: 18px;
      border-radius: 14px;
    }

    .news-grid {
      grid-template-columns: 1fr;
    }

    .news-image {
      min-height: 190px;
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
