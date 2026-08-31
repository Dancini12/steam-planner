// ============================================================
// AdminConsole.jsx
// Console administrativo — acesso restrito a administradores
// ============================================================
//
// Acessível pelo link direto  <app>/#admin .
// A proteção real é do banco (RLS + tabela app_admins); esta
// tela só decide o que mostrar via useIsAdmin. Reúne:
//   - Modelos de IA (treinar + métricas)
//   - Gestão de administradores
//   - Feedbacks recebidos
//   - Indicadores de uso
//   - Instruções do retreino automático (cron)
// ============================================================

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useIsAdmin } from "../hooks/useIsAdmin.js";
import { getAdminMetrics, saveAdminMetricSnapshot } from "../lib/analytics.js";
import {
  trainModels,
  fetchModelStatus,
  fetchAuthDebug,
  fetchTrainingDiag
} from "../lib/ml/mlClient.js";
import MlModelPanel from "../components/admin/MlModelPanel.jsx";

const FUNCTION_URL =
  (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "") +
  "/functions/v1/ml-trainer";

const page = {
  minHeight: "100vh",
  background: "radial-gradient(ellipse at top, #14142f 0%, #0b0b20 60%, #08081a 100%)",
  color: "#e8ecf4",
  fontFamily: "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif"
};
const shell = { maxWidth: "960px", margin: "0 auto", padding: "2rem 1.25rem 4rem" };
const backBtn = {
  background: "transparent",
  border: "none",
  color: "rgba(255,255,255,0.6)",
  cursor: "pointer",
  fontSize: "0.9rem",
  padding: "0.5rem 0",
  fontFamily: "inherit"
};
const card = {
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.03)",
  padding: "1.25rem 1.4rem",
  marginBottom: "1.25rem"
};
const h2 = { fontSize: "1.05rem", margin: "0 0 0.9rem", color: "#fff" };
const input = {
  background: "#12122e",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.16)",
  borderRadius: "8px",
  padding: "0.55rem 0.7rem",
  fontFamily: "inherit",
  fontSize: "0.9rem"
};
const btn = {
  background: "#6B2FE0",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  padding: "0.55rem 1rem",
  fontFamily: "inherit",
  fontWeight: 600,
  cursor: "pointer"
};
const ghostBtn = { ...btn, background: "transparent", border: "1px solid rgba(255,255,255,0.2)" };
const codeBox = {
  background: "#0a0a1c",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  padding: "0.85rem",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: "0.8rem",
  color: "#c7d2fe",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word"
};

function AdminManager({ currentEmail }) {
  const [admins, setAdmins] = useState([]);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("app_admins")
      .select("email, created_at")
      .order("email");
    if (!error) setAdmins(data || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    const value = email.trim().toLowerCase();
    if (!value || !value.includes("@")) {
      setMsg("Informe um e-mail válido.");
      return;
    }
    setBusy(true);
    setMsg("");
    const { error } = await supabase
      .from("app_admins")
      .upsert({ email: value }, { onConflict: "email" });
    setBusy(false);
    if (error) {
      setMsg(`Falha ao adicionar: ${error.message}`);
      return;
    }
    setEmail("");
    load();
  };

  const remove = async (value) => {
    if (value.toLowerCase() === currentEmail?.toLowerCase()) {
      if (!window.confirm("Remover VOCÊ mesmo da lista de administradores?")) return;
    }
    const { error } = await supabase.from("app_admins").delete().eq("email", value);
    if (error) {
      setMsg(`Falha ao remover: ${error.message}`);
      return;
    }
    load();
  };

  return (
    <div style={card}>
      <h2 style={h2}>Administradores</h2>
      <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: 0 }}>
        Quem estiver nesta lista vê este console e o card “MODELOS DE IA”. A
        primeira linha foi cadastrada por migração.
      </p>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.9rem", flexWrap: "wrap" }}>
        <input
          style={{ ...input, flex: 1, minWidth: "220px" }}
          type="email"
          placeholder="email@dominio.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button style={btn} onClick={add} disabled={busy}>
          {busy ? "..." : "Adicionar"}
        </button>
      </div>
      {msg && <div style={{ color: "#fca5a5", fontSize: "0.85rem", marginBottom: "0.6rem" }}>{msg}</div>}
      <div>
        {admins.length === 0 && (
          <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Nenhum administrador cadastrado.</p>
        )}
        {admins.map((a) => (
          <div
            key={a.email}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.5rem 0",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              fontSize: "0.9rem"
            }}
          >
            <span>
              {a.email}
              {a.email.toLowerCase() === currentEmail?.toLowerCase() && (
                <span style={{ color: "#39FF88", fontSize: "0.75rem" }}> (você)</span>
              )}
            </span>
            <button
              style={{ ...ghostBtn, padding: "0.3rem 0.7rem", color: "#FB7185", borderColor: "rgba(251,113,133,0.3)" }}
              onClick={() => remove(a.email)}
            >
              remover
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeedbackList() {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const { data, error } = await supabase.functions.invoke("feedback", {
        body: { action: "list", limit: 50 }
      });
      if (error) throw error;
      setItems(Array.isArray(data?.feedback) ? data.feedback : []);
    } catch (e) {
      setErr("Não foi possível carregar os feedbacks.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={card}>
      <h2 style={h2}>Feedbacks recebidos</h2>
      <button style={ghostBtn} onClick={load} disabled={loading}>
        {loading ? "Carregando..." : items ? "Atualizar" : "Carregar feedbacks"}
      </button>
      {err && <div style={{ color: "#fca5a5", fontSize: "0.85rem", marginTop: "0.6rem" }}>{err}</div>}
      {items && items.length === 0 && (
        <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Nenhum feedback.</p>
      )}
      <div style={{ display: "grid", gap: "0.75rem", marginTop: "0.9rem" }}>
        {(items || []).map((f) => (
          <article
            key={f.id}
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px",
              padding: "0.85rem",
              background: "rgba(15,23,42,0.6)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.4rem" }}>
              <strong>{f.category || "Geral"}</strong>
              <span style={{ color: "#94a3b8" }}>
                {f.created_at ? new Date(f.created_at).toLocaleString("pt-BR") : ""}
              </span>
            </div>
            <p style={{ whiteSpace: "pre-wrap", margin: "0 0 0.4rem", fontSize: "0.9rem", color: "#e2e8f0" }}>
              {f.message}
            </p>
            <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
              {f.sender_name || "Usuário"} {f.sender_email ? `· ${f.sender_email}` : ""}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function IndicatorsPanel() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setMetrics(await getAdminMetrics());
    } catch {
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  const rows = metrics
    ? [
        ["Professores", metrics.usersCount],
        ["Projetos", metrics.projectsCount],
        ["Logins", metrics.loginsCount],
        ["Cadastros", metrics.signupsCount],
        ["Ativos (7 dias)", metrics.activeUsers7d],
        ["Professores com projeto", metrics.usersWithProjects],
        ["Média de projetos/professor", metrics.averageProjectsPerUser],
        ["Projetos com produto final", metrics.projectsWithFinalProduct],
        ["Registros no diário (geral)", metrics.generalDiaryEntries],
        ["Registros no diário (individual)", metrics.individualDiaryEntries],
        ["Alunos cadastrados", metrics.registeredStudents]
      ]
    : [];

  return (
    <div style={card}>
      <h2 style={h2}>Indicadores de uso</h2>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.9rem" }}>
        <button style={ghostBtn} onClick={load} disabled={loading}>
          {loading ? "Carregando..." : metrics ? "Atualizar" : "Carregar indicadores"}
        </button>
        {metrics && (
          <button
            style={btn}
            onClick={async () => {
              await saveAdminMetricSnapshot(metrics);
              setSaved("Leitura salva.");
              setTimeout(() => setSaved(""), 2500);
            }}
          >
            Salvar leitura
          </button>
        )}
        {saved && <span style={{ color: "#39FF88", fontSize: "0.85rem", alignSelf: "center" }}>{saved}</span>}
      </div>
      {metrics && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.5rem" }}>
          {rows.map(([label, value]) => (
            <div
              key={label}
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "10px",
                padding: "0.7rem 0.85rem"
              }}
            >
              <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#fff" }}>{value ?? "—"}</div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CronPanel() {
  return (
    <div style={card}>
      <h2 style={h2}>Retreino automático (opcional)</h2>
      <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: 0 }}>
        Para retreinar o modelo toda madrugada, habilite <code>pg_cron</code> e{" "}
        <code>pg_net</code> em Database → Extensions e rode uma vez no SQL Editor:
      </p>
      <div style={codeBox}>
        {`alter database postgres
  set app.settings.ml_function_url = '${FUNCTION_URL}';
alter database postgres
  set app.settings.ml_service_key = 'SUA_SERVICE_ROLE_KEY';

-- depois reaplique supabase/migrations/010_ml_retrain_cron.sql`}
      </div>
      <p style={{ color: "#64748b", fontSize: "0.78rem", marginBottom: 0 }}>
        Sem isso, o retreino é só pelo botão “Treinar agora” acima.
      </p>
    </div>
  );
}

export default function AdminConsole({ currentUser, onBack }) {
  const { isAdmin, loading } = useIsAdmin(currentUser);
  const [mlStatus, setMlStatus] = useState(null);
  const [mlTraining, setMlTraining] = useState(false);
  const [mlError, setMlError] = useState("");
  const [authDebug, setAuthDebug] = useState(null);
  const [diag, setDiag] = useState(null);

  const loadMl = useCallback(async () => {
    const [status, debug] = await Promise.all([fetchModelStatus(), fetchAuthDebug()]);
    setMlStatus(status);
    setAuthDebug(debug);
    const d = await fetchTrainingDiag();
    setDiag(d?.diag || d);
  }, []);

  useEffect(() => {
    if (isAdmin) loadMl();
  }, [isAdmin, loadMl]);

  const handleTrain = useCallback(async () => {
    setMlTraining(true);
    setMlError("");
    try {
      const result = await trainModels();
      if (result?.ok === false) {
        setMlError(
          result.reason
            ? `Treino não concluído: ${result.reason} (amostras: ${result.nSamples ?? 0}).`
            : "Treino não concluído."
        );
      }
      await loadMl();
    } catch (e) {
      setMlError(e?.message || "Falha ao chamar a função de treino.");
    } finally {
      setMlTraining(false);
    }
  }, [loadMl]);

  if (loading) {
    return (
      <div style={page}>
        <div style={shell}>
          <p style={{ color: "#94a3b8" }}>Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={page}>
        <div style={shell}>
          <button style={backBtn} onClick={onBack}>← Voltar</button>
          <h1 style={{ color: "#fff" }}>Acesso restrito</h1>
          <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>
            Este console é exclusivo para administradores. A conta{" "}
            <strong>{currentUser?.email || "atual"}</strong> não está autorizada.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={page}>
      <div style={shell}>
        <button style={backBtn} onClick={onBack}>← Voltar ao painel</button>
        <h1 style={{ color: "#fff", margin: "0.25rem 0 0.35rem" }}>Console administrativo</h1>
        <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: "0 0 1.75rem" }}>
          Link direto: <code>{typeof window !== "undefined" ? window.location.origin : ""}/#admin</code>
        </p>

        <div style={card}>
          <h2 style={h2}>Modelos de IA — recomendador</h2>
          {authDebug && (
            <p style={{ fontSize: "0.78rem", color: authDebug.isAdmin ? "#39FF88" : "#fca5a5", marginTop: 0 }}>
              Sessão vista pela função:{" "}
              {authDebug.email ? `${authDebug.email} · ${authDebug.via}` : "não identificada"}
              {authDebug.tokenLooksLikeAnonKey ? " · (token anônimo — refaça o login)" : ""}
            </p>
          )}
          <MlModelPanel
            status={mlStatus}
            training={mlTraining}
            error={mlError}
            onTrain={handleTrain}
          />

          {diag && diag.nSamples != null && (
            <div style={{ marginTop: "1rem", fontSize: "0.82rem", color: "#94a3b8" }}>
              <div style={{ color: diag.canTrain ? "#39FF88" : "#fbbf24", fontWeight: 600, marginBottom: "0.35rem" }}>
                {diag.canTrain
                  ? "Dados suficientes para treinar."
                  : "Ainda sem dados suficientes (precisa de ≥ 8 pares e ≥ 2 positivos)."}
              </div>
              <div>
                projetos: {diag.projects} · eventos: {diag.events} · professores com adoção:{" "}
                {diag.teachersWithPositives}/{diag.teachers} · pares: {diag.nSamples} · positivos:{" "}
                {diag.nPositives} · vocabulário: {diag.vocabSize}
              </div>
              {diag.eventBreakdown && Object.keys(diag.eventBreakdown).length > 0 && (
                <div style={{ marginTop: "0.3rem" }}>
                  eventos por tipo:{" "}
                  {Object.entries(diag.eventBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([k, v]) => `${k}=${v}`)
                    .join(" · ")}
                </div>
              )}
            </div>
          )}
          {diag && diag.error && (
            <div style={{ marginTop: "0.6rem", fontSize: "0.82rem", color: "#fca5a5" }}>
              diagnóstico indisponível: {diag.error}
            </div>
          )}
        </div>

        <AdminManager currentEmail={currentUser?.email} />
        <IndicatorsPanel />
        <FeedbackList />
        <CronPanel />
      </div>
    </div>
  );
}
