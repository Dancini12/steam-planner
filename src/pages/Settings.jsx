import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import { supabase } from "../lib/supabaseClient.js";

export default function Settings({ onBack }) {
  const providerStatus = {
    gemini: import.meta.env.VITE_ENABLE_GEMINI === 'true'
  };

  const pageStyle = {
    minHeight: "100vh",
    padding: "2rem",
    background: "radial-gradient(ellipse at top, #1A1A3E 0%, #0F0F2D 50%, #0A0A1F 100%)",
    color: "#FFFFFF"
  };

  const headerStyle = {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "2rem"
  };

  const titleStyle = {
    fontSize: "2rem",
    fontWeight: "bold",
    margin: 0
  };

  const sectionTitleStyle = {
    fontSize: "1.25rem",
    fontWeight: "600",
    marginBottom: "1rem",
    color: "#8B5CF6"
  };

  const badgeStyle = (active) => ({
    display: "inline-flex",
    padding: "0.5rem 0.75rem",
    borderRadius: "999px",
    background: active ? "#10B981" : "rgba(255, 255, 255, 0.08)",
    color: active ? "#0F172A" : "#E5E7EB",
    fontWeight: 600,
    fontSize: "0.9rem"
  });

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <Button variant="secondary" onClick={onBack}>
          ← Voltar
        </Button>
        <h1 style={titleStyle}>Configurações de IA</h1>
      </div>

      <div style={{ display: 'grid', gap: '2rem', maxWidth: '840px' }}>
        <Card>
          <h2 style={sectionTitleStyle}>⚙️ Status do sistema de IA</h2>
          <p style={{ marginBottom: '1rem', color: 'rgba(255,255,255,0.75)' }}>
            A ativação das IAs é controlada por flags no ambiente de execução. As chaves de API são armazenadas no backend e nunca são expostas ao usuário.
          </p>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <span>Gerador de projetos STEAM</span>
              <span style={badgeStyle(providerStatus.gemini)}>{providerStatus.gemini ? 'Ativo' : 'Inativo'}</span>
            </div>
          </div>
        </Card>

        <Card>
          <h2 style={sectionTitleStyle}>🔐 Segurança e uso</h2>
          <ul style={{ gap: '0.75rem', display: 'grid', color: 'rgba(255,255,255,0.75)', marginBottom: '1.5rem' }}>
            <li>Nenhuma chave de IA é salva no frontend.</li>
            <li>O backend registra histórico de geração para monitoramento.</li>
            <li>Os provedores são alternados automaticamente em caso de falha.</li>
            <li>A lógica de escolha de IA é centralizada internamente.</li>
          </ul>

        </Card>
      </div>
    </div>
  );
}
