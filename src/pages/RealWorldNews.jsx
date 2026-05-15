import { useEffect, useMemo, useState } from "react";

const CATEGORIES = [
  "Todos",
  "Ciencia",
  "Tecnologia",
  "Sustentabilidade",
  "Educacao",
  "Economia",
  "Inteligencia Artificial",
  "Meio Ambiente",
  "Sociedade",
  "Cultura Digital",
  "Empreendedorismo"
];

const CATEGORY_LABELS = {
  Ciencia: "Ciência",
  Educacao: "Educação",
  "Inteligencia Artificial": "Inteligência Artificial"
};

const CATEGORY_ICONS = {
  Todos: "◎",
  Ciencia: "⚛",
  Tecnologia: "⌘",
  Sustentabilidade: "♻",
  Educacao: "▣",
  Economia: "$",
  "Inteligencia Artificial": "AI",
  "Meio Ambiente": "◒",
  Sociedade: "◉",
  "Cultura Digital": "#",
  Empreendedorismo: "◆"
};

const TRUSTED_SITES = [
  "site:canaltech.com.br",
  "site:olhardigital.com.br",
  "site:nationalgeographicbrasil.com",
  "site:novaescola.org.br",
  "site:porvir.org",
  "site:infomoney.com.br",
  "site:valor.globo.com",
  "site:brasil.un.org",
  "site:bbc.com/portuguese"
];

const CATEGORY_QUERIES = {
  Ciencia: "ciencia pesquisa descoberta escola",
  Tecnologia: "tecnologia inovacao robotica escola",
  Sustentabilidade: "sustentabilidade reciclagem consumo consciente escola",
  Educacao: "educacao escola aprendizagem professores",
  Economia: "economia educacao financeira consumo",
  "Inteligencia Artificial": "inteligencia artificial educacao escola tecnologia",
  "Meio Ambiente": "meio ambiente clima biodiversidade escola",
  Sociedade: "sociedade dados desigualdade cidadania",
  "Cultura Digital": "cultura digital internet seguranca dados",
  Empreendedorismo: "empreendedorismo inovacao impacto social jovens"
};

const SOURCE_HINTS = [
  "Canaltech",
  "Olhar Digital",
  "National Geographic Brasil",
  "Nova Escola",
  "Porvir",
  "InfoMoney",
  "Valor Economico",
  "Valor Econômico",
  "ONU Brasil",
  "BBC Brasil"
];

function getCategoryLabel(category) {
  return CATEGORY_LABELS[category] || category;
}

function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || "•";
}

function stripHtml(value = "") {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value, max = 180) {
  if (!value || value.length <= max) return value;
  return `${value.slice(0, max).trim()}...`;
}

function parseTitleAndSource(title = "", fallbackSource = "Google Notícias") {
  const separatorIndex = title.lastIndexOf(" - ");
  if (separatorIndex === -1) {
    return { cleanTitle: title, source: fallbackSource };
  }

  return {
    cleanTitle: title.slice(0, separatorIndex).trim(),
    source: title.slice(separatorIndex + 3).trim() || fallbackSource
  };
}

function buildFeedUrl(category) {
  const query = `${CATEGORY_QUERIES[category]} (${TRUSTED_SITES.join(" OR ")})`;
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
  return `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
}

async function fetchCategoryNews(category) {
  const response = await fetch(buildFeedUrl(category));
  if (!response.ok) {
    throw new Error("Nao foi possivel carregar o feed de noticias.");
  }

  const data = await response.json();
  if (!Array.isArray(data.items)) return [];

  return data.items.slice(0, 6).map((item) => {
    const { cleanTitle, source } = parseTitleAndSource(item.title, item.author || data.feed?.title);
    const summary = stripHtml(item.description || item.content || "");
    const image = item.thumbnail || item.enclosure?.link || "";

    return {
      id: `${category}-${item.guid || item.link || cleanTitle}`,
      category,
      title: cleanTitle,
      summary: truncate(summary || "Leia a noticia completa para identificar recortes, dados e problemas reais que podem inspirar uma atividade STEAM.", 190),
      source,
      link: item.link,
      image,
      publishedAt: item.pubDate || "",
      visualTheme: category.toLowerCase().replace(/\s+/g, "-")
    };
  });
}

function formatDate(dateValue) {
  if (!dateValue) return "Atualizacao recente";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Atualizacao recente";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function isTrustedSource(source = "") {
  return SOURCE_HINTS.some((hint) =>
    source.toLowerCase().includes(hint.toLowerCase())
  );
}

function normalizeNews(items) {
  const seen = new Set();
  return items
    .filter((item) => item.title && item.link)
    .filter((item) => {
      const key = item.link || item.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
}

function NewsVisual({ item, featured = false }) {
  if (item.image) {
    return (
      <div className={featured ? "news-visual featured" : "news-visual"}>
        <img src={item.image} alt="" loading="lazy" />
        <span>
          <i>{getCategoryIcon(item.category)}</i>
          {getCategoryLabel(item.category)}
        </span>
      </div>
    );
  }

  return (
    <div className={`news-visual news-gradient news-gradient-${item.visualTheme}${featured ? " featured" : ""}`}>
      <span>
        <i>{getCategoryIcon(item.category)}</i>
        {getCategoryLabel(item.category)}
      </span>
    </div>
  );
}

function NewsCard({ item, featured = false }) {
  return (
    <article className={featured ? "news-card featured-card" : "news-card"}>
      <NewsVisual item={item} featured={featured} />
      <div className="news-card-copy">
        <div className="news-meta">
          <span>{item.source}</span>
          <strong>
            <i>{getCategoryIcon(item.category)}</i>
            {getCategoryLabel(item.category)}
          </strong>
        </div>
        <h2>{item.title}</h2>
        <p>{item.summary}</p>
        <div className="news-footer">
          <time>{formatDate(item.publishedAt)}</time>
          <a href={item.link} target="_blank" rel="noreferrer">
            Ler noticia
          </a>
        </div>
      </div>
    </article>
  );
}

export default function RealWorldNews({ onBack }) {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const visibleNews = useMemo(() => {
    if (selectedCategory === "Todos") return news;
    return news.filter((item) => item.category === selectedCategory);
  }, [news, selectedCategory]);

  const featuredNews = visibleNews[0];
  const gridNews = visibleNews.slice(1, 13);

  const loadNews = async () => {
    setIsLoading(true);
    setError("");

    try {
      const categoryResults = await Promise.allSettled(
        CATEGORIES.filter((category) => category !== "Todos").map(fetchCategoryNews)
      );

      const loadedNews = normalizeNews(
        categoryResults.flatMap((result) =>
          result.status === "fulfilled" ? result.value : []
        )
      ).filter((item) => isTrustedSource(item.source) || item.source === "Google Notícias");

      if (loadedNews.length === 0) {
        throw new Error("Nenhuma noticia foi encontrada agora. Tente atualizar em instantes.");
      }

      setNews(loadedNews);
      setLastUpdated(new Date().toISOString());
    } catch (loadError) {
      setError(loadError.message || "Nao foi possivel carregar noticias em tempo real.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  return (
    <main className="news-page">
      <style>{newsCss}</style>

      <header className="news-hero">
        <div className="hero-side hero-side-left">
          <button type="button" className="back-button" onClick={onBack}>
            Voltar
          </button>
        </div>

        <div className="hero-title-block">
          <span className="news-kicker">CONECTE COM O MUNDO REAL</span>
          <div className="hero-title-rule" aria-hidden="true" />
          <h1>Notícias atuais para inspirar atividades STEAM</h1>
          <p>
            Acompanhe temas recentes de fontes confiáveis, leia o contexto e use as ideias
            depois no planejador pedagógico.
          </p>
        </div>

        <div className="hero-side hero-side-right">
          <button type="button" className="refresh-button" onClick={loadNews} disabled={isLoading}>
            {isLoading ? "Atualizando..." : "Atualizar notícias"}
          </button>
        </div>
      </header>

      <section className="source-strip" aria-label="Fontes confiaveis">
        <strong>Fontes:</strong>
        <span>Canaltech</span>
        <span>Olhar Digital</span>
        <span>National Geographic Brasil</span>
        <span>Nova Escola</span>
        <span>Porvir</span>
        <span>InfoMoney</span>
        <span>Valor Economico</span>
        <span>ONU Brasil</span>
        <span>BBC Brasil</span>
      </section>

      <section className="category-strip" aria-label="Categorias">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            className={selectedCategory === category ? "active" : ""}
            onClick={() => setSelectedCategory(category)}
          >
            <i>{getCategoryIcon(category)}</i>
            {getCategoryLabel(category)}
          </button>
        ))}
      </section>

      <section className="news-status" aria-live="polite">
        {lastUpdated && <span>Ultima atualizacao: {formatDate(lastUpdated)}</span>}
        <span>{visibleNews.length} conteudos encontrados</span>
      </section>

      {isLoading && (
        <section className="loading-panel">
          Buscando noticias em tempo real...
        </section>
      )}

      {!isLoading && error && (
        <section className="error-panel">
          {error}
        </section>
      )}

      {!isLoading && !error && featuredNews && (
        <section className="news-layout">
          <NewsCard item={featuredNews} featured />

          <div className="news-grid">
            {gridNews.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

const newsCss = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  * {
    box-sizing: border-box;
  }

  .news-page {
    min-height: 100vh;
    padding: 28px;
    background: #F5F7FB;
    color: #1F2937;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .news-hero {
    display: grid;
    grid-template-columns: 170px minmax(0, 1fr) 170px;
    gap: 20px;
    align-items: stretch;
    max-width: 1240px;
    margin: 0 auto 20px;
    padding: 24px;
    border-radius: 18px;
    background: #FFFFFF;
    box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
  }

  .hero-side {
    display: flex;
    align-items: flex-start;
  }

  .hero-side-left {
    justify-content: flex-start;
  }

  .hero-side-right {
    justify-content: flex-end;
  }

  .hero-title-block {
    display: flex;
    align-items: center;
    flex-direction: column;
    text-align: center;
  }

  .hero-title-rule {
    width: min(420px, 80%);
    height: 1px;
    margin: 13px 0 14px;
    background: linear-gradient(90deg, transparent, #CBD5E1, transparent);
  }

  .news-kicker {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 7px 11px;
    border-radius: 999px;
    background: rgba(79, 70, 229, 0.1);
    color: #4F46E5;
    font-size: 0.76rem;
    font-weight: 700;
    letter-spacing: 0.08em;
  }

  .news-hero h1 {
    max-width: 820px;
    margin: 0 0 10px;
    color: #1F2937;
    font-size: clamp(1.7rem, 4vw, 3rem);
    line-height: 1.08;
    letter-spacing: 0;
  }

  .news-hero p {
    max-width: 760px;
    margin: 0;
    color: #4B5563;
    font-size: 1.02rem;
    line-height: 1.6;
  }

  .back-button,
  .refresh-button,
  .category-strip button,
  .news-footer a {
    min-height: 42px;
    border: 0;
    border-radius: 10px;
    font-family: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  .back-button {
    padding: 0 14px;
    background: #EEF2FF;
    color: #4F46E5;
  }

  .refresh-button {
    padding: 0 16px;
    background: #4F46E5;
    color: #FFFFFF;
    white-space: nowrap;
  }

  .refresh-button:disabled {
    cursor: wait;
    opacity: 0.7;
  }

  .source-strip,
  .category-strip,
  .news-status,
  .news-layout,
  .loading-panel,
  .error-panel {
    max-width: 1240px;
    margin-left: auto;
    margin-right: auto;
  }

  .source-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-bottom: 14px;
    color: #4B5563;
  }

  .source-strip strong,
  .source-strip span {
    padding: 7px 10px;
    border: 1px solid #E5E7EB;
    border-radius: 999px;
    background: #FFFFFF;
    font-size: 0.82rem;
  }

  .source-strip strong {
    border-color: rgba(16, 185, 129, 0.28);
    background: rgba(16, 185, 129, 0.1);
    color: #047857;
  }

  .category-strip {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 12px;
    margin-bottom: 10px;
  }

  .category-strip button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex: 0 0 auto;
    padding: 0 13px;
    border: 1px solid #E5E7EB;
    background: #FFFFFF;
    color: #374151;
  }

  .category-strip button i,
  .news-meta strong i,
  .news-visual span i {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 999px;
    background: rgba(79, 70, 229, 0.1);
    color: #4F46E5;
    font-style: normal;
    font-size: 0.72rem;
    font-weight: 800;
    line-height: 1;
  }

  .category-strip button.active {
    border-color: #4F46E5;
    background: #4F46E5;
    color: #FFFFFF;
  }

  .category-strip button.active i {
    background: rgba(255, 255, 255, 0.18);
    color: #FFFFFF;
  }

  .news-status {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
    color: #6B7280;
    font-size: 0.88rem;
    font-weight: 600;
  }

  .loading-panel,
  .error-panel {
    padding: 24px;
    border-radius: 14px;
    background: #FFFFFF;
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.07);
  }

  .error-panel {
    color: #991B1B;
    background: #FEF2F2;
  }

  .news-layout {
    display: grid;
    grid-template-columns: minmax(320px, 0.9fr) minmax(0, 1.5fr);
    gap: 18px;
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
    overflow: hidden;
    border: 1px solid #E5E7EB;
    border-radius: 14px;
    background: #FFFFFF;
    box-shadow: 0 12px 26px rgba(15, 23, 42, 0.07);
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  }

  .news-card:hover {
    transform: translateY(-3px);
    border-color: rgba(79, 70, 229, 0.26);
    box-shadow: 0 18px 34px rgba(15, 23, 42, 0.1);
  }

  .featured-card {
    min-height: 100%;
  }

  .news-visual {
    position: relative;
    min-height: 136px;
    overflow: hidden;
    background: linear-gradient(135deg, #4F46E5, #8B5CF6 54%, #10B981);
  }

  .news-visual.featured {
    min-height: 280px;
  }

  .news-visual img {
    width: 100%;
    height: 100%;
    min-height: inherit;
    object-fit: cover;
    display: block;
  }

  .news-visual span {
    position: absolute;
    left: 14px;
    bottom: 14px;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 7px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.92);
    color: #1F2937;
    font-size: 0.74rem;
    font-weight: 700;
  }

  .news-visual span i {
    background: rgba(79, 70, 229, 0.12);
  }

  .news-gradient-ciencia { background: linear-gradient(135deg, #0891B2, #4F46E5 54%, #A7F3D0); }
  .news-gradient-tecnologia { background: linear-gradient(135deg, #111827, #4F46E5 56%, #38BDF8); }
  .news-gradient-sustentabilidade { background: linear-gradient(135deg, #064E3B, #10B981 60%, #A7F3D0); }
  .news-gradient-educacao { background: linear-gradient(135deg, #8B5CF6, #EC4899 58%, #FDE68A); }
  .news-gradient-economia { background: linear-gradient(135deg, #1F2937, #4F46E5 58%, #10B981); }
  .news-gradient-inteligencia-artificial { background: linear-gradient(135deg, #4F46E5, #8B5CF6 55%, #10B981); }
  .news-gradient-meio-ambiente { background: linear-gradient(135deg, #0EA5E9, #10B981 58%, #FDE047); }
  .news-gradient-sociedade { background: linear-gradient(135deg, #7C2D12, #F97316 54%, #10B981); }
  .news-gradient-cultura-digital { background: linear-gradient(135deg, #2563EB, #06B6D4 56%, #8B5CF6); }
  .news-gradient-empreendedorismo { background: linear-gradient(135deg, #1E293B, #8B5CF6 56%, #10B981); }

  .news-card-copy {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 16px;
  }

  .featured-card .news-card-copy {
    padding: 20px;
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
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: 999px;
    background: rgba(16, 185, 129, 0.1);
    color: #047857;
    font-size: 0.72rem;
  }

  .news-meta strong i {
    width: 18px;
    height: 18px;
    background: rgba(16, 185, 129, 0.14);
    color: #047857;
    font-size: 0.62rem;
  }

  .news-card h2 {
    margin: 0;
    color: #1F2937;
    font-size: 1rem;
    line-height: 1.25;
    letter-spacing: 0;
  }

  .featured-card h2 {
    font-size: clamp(1.35rem, 2.6vw, 2rem);
  }

  .news-card p {
    flex: 1;
    margin: 10px 0 16px;
    color: #4B5563;
    font-size: 0.92rem;
    line-height: 1.55;
  }

  .featured-card p {
    font-size: 1rem;
  }

  .news-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border-top: 1px solid #E5E7EB;
    padding-top: 12px;
  }

  .news-footer time {
    color: #6B7280;
    font-size: 0.78rem;
    font-weight: 600;
  }

  .news-footer a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 38px;
    padding: 0 13px;
    background: #4F46E5;
    color: #FFFFFF;
    font-size: 0.84rem;
    text-decoration: none;
    white-space: nowrap;
  }

  @media (max-width: 1060px) {
    .news-hero,
    .news-layout {
      grid-template-columns: 1fr;
    }

    .hero-side,
    .hero-side-left,
    .hero-side-right {
      justify-content: center;
    }

    .news-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 720px) {
    .news-page {
      padding: 16px;
    }

    .news-hero {
      padding: 18px;
    }

    .news-grid {
      grid-template-columns: 1fr;
    }

    .news-status,
    .news-footer {
      align-items: flex-start;
      flex-direction: column;
    }
  }
`;
