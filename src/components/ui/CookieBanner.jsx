import { useState } from "react";
import { setConsent } from "../../lib/cookieConsent.js";

const CATEGORIES = [
  {
    id: "essential",
    label: "Essenciais",
    required: true,
    description:
      "Necessários para o funcionamento do app: autenticação, sessão de login e armazenamento local dos seus projetos. Não podem ser desativados.",
    examples: "Login, sessão do Supabase, dados dos projetos salvos no dispositivo.",
  },
  {
    id: "preferences",
    label: "Preferências e aprendizado",
    required: false,
    description:
      "Permitem que o sistema aprenda com o seu uso e personalize as atividades geradas. Incluem o histórico de uso, avaliações de atividades e sugestões pedagógicas adaptadas ao seu perfil.",
    examples:
      "Histórico de atividades criadas, avaliações (👍/👎), sugestões de continuidade personalizadas, áreas STEAM preferidas.",
  },
  {
    id: "analytics",
    label: "Análises e métricas",
    required: false,
    description:
      "Dados anônimos de uso que nos ajudam a entender como o STEAM Planner é utilizado e melhorar a plataforma para todos os professores.",
    examples: "Número de atividades geradas, disciplinas mais acessadas, frequência de uso.",
  },
];

export default function CookieBanner({ onConsent }) {
  const [expanded, setExpanded] = useState(false);
  const [preferences, setPreferences] = useState(true);
  const [analytics, setAnalytics] = useState(true);

  const handleAcceptAll = () => {
    const consent = setConsent({ preferences: true, analytics: true });
    onConsent(consent);
  };

  const handleEssentialOnly = () => {
    const consent = setConsent({ preferences: false, analytics: false });
    onConsent(consent);
  };

  const handleSaveCustom = () => {
    const consent = setConsent({ preferences, analytics });
    onConsent(consent);
  };

  return (
    <div
      role="dialog"
      aria-label="Configurações de privacidade e cookies"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "linear-gradient(180deg, rgba(15,15,45,0.97) 0%, rgba(10,10,31,0.99) 100%)",
        borderTop: "1px solid rgba(110,231,183,0.2)",
        backdropFilter: "blur(16px)",
        boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
        padding: expanded ? "1.5rem 1.75rem" : "1.25rem 1.75rem",
        fontFamily: "inherit",
        transition: "padding 0.2s",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        {/* Cabeçalho */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: expanded ? "1.25rem" : "1rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <p style={{ margin: "0 0 0.3rem", fontSize: "0.95rem", fontWeight: 700, color: "#FFFFFF" }}>
              Sua privacidade importa
            </p>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
              Usamos cookies e armazenamento local para manter sua sessão, salvar seus projetos e,
              com sua permissão, personalizar as atividades geradas com base no seu perfil pedagógico.
              Conforme a <strong style={{ color: "rgba(255,255,255,0.75)" }}>LGPD (Lei nº 13.709/2018)</strong>,
              você pode aceitar, recusar ou personalizar a qualquer momento.
            </p>
          </div>

          {!expanded && (
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
              <button onClick={() => setExpanded(true)} style={btnStyle("ghost")}>
                Personalizar
              </button>
              <button onClick={handleEssentialOnly} style={btnStyle("secondary")}>
                Apenas essenciais
              </button>
              <button onClick={handleAcceptAll} style={btnStyle("primary")}>
                Aceitar tudo
              </button>
            </div>
          )}
        </div>

        {/* Painel expandido */}
        {expanded && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}>
              {CATEGORIES.map((cat) => (
                <div
                  key={cat.id}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "10px",
                    padding: "1rem 1.1rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#FFFFFF" }}>
                      {cat.label}
                      {cat.required && (
                        <span style={{ marginLeft: "0.5rem", fontSize: "0.72rem", background: "rgba(110,231,183,0.15)", color: "#6EE7B7", padding: "0.15rem 0.5rem", borderRadius: "4px", fontWeight: 600 }}>
                          Obrigatório
                        </span>
                      )}
                    </span>
                    <Toggle
                      checked={cat.required || (cat.id === "preferences" ? preferences : analytics)}
                      disabled={cat.required}
                      onChange={(val) => {
                        if (cat.id === "preferences") setPreferences(val);
                        else if (cat.id === "analytics") setAnalytics(val);
                      }}
                    />
                  </div>
                  <p style={{ margin: "0 0 0.3rem", fontSize: "0.81rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
                    {cat.description}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.76rem", color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>
                    Exemplos: {cat.examples}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button onClick={() => setExpanded(false)} style={btnStyle("ghost")}>
                Cancelar
              </button>
              <button onClick={handleEssentialOnly} style={btnStyle("secondary")}>
                Apenas essenciais
              </button>
              <button onClick={handleSaveCustom} style={btnStyle("primary")}>
                Salvar preferências
              </button>
              <button onClick={handleAcceptAll} style={{ ...btnStyle("primary"), background: "linear-gradient(135deg, #059669, #10B981)" }}>
                Aceitar tudo
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Toggle({ checked, disabled, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: "42px",
        height: "24px",
        borderRadius: "12px",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: checked ? "#10B981" : "rgba(255,255,255,0.15)",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "3px",
          left: checked ? "21px" : "3px",
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          background: "#FFFFFF",
          transition: "left 0.2s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }}
      />
    </button>
  );
}

function btnStyle(variant) {
  const base = {
    padding: "0.5rem 1.1rem",
    borderRadius: "8px",
    fontSize: "0.85rem",
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer",
    border: "none",
    transition: "opacity 0.15s",
    whiteSpace: "nowrap",
  };
  if (variant === "primary") return { ...base, background: "linear-gradient(135deg, #4F46E5, #6366F1)", color: "#FFFFFF" };
  if (variant === "secondary") return { ...base, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.12)" };
  return { ...base, background: "transparent", color: "rgba(255,255,255,0.5)", padding: "0.5rem 0.75rem" };
}
