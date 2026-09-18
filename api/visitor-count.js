// ============================================================
// api/visitor-count.js
// Contador de visitantes únicos do site ("Você é o visitante
// número X"). Cada IP conta uma única vez: identificamos o
// visitante pelo hash do IP (nunca gravamos o IP em si) e
// devolvemos o total de visitantes únicos registrados.
//
// Configuração necessária (Vercel → Project Settings →
// Environment Variables), reaproveitando o que já existe para
// api/cron-train-model.js:
//   SUPABASE_SERVICE_ROLE_KEY — obrigatória, dá acesso de escrita
//     à tabela public.site_visitors (protegida por RLS).
//   VITE_SUPABASE_URL (ou SUPABASE_URL) — já deve existir.
//   VISITOR_IP_SALT — recomendada. Sal usado para gerar o hash do
//     IP. Sem ela, cai num valor fixo do próprio código (ainda
//     assim o IP nunca é armazenado em texto puro).
// ============================================================

import crypto from "node:crypto";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }

  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    res.status(500).json({
      ok: false,
      error: "Configure SUPABASE_SERVICE_ROLE_KEY (e opcionalmente SUPABASE_URL) nas variáveis de ambiente da Vercel para ativar o contador de visitantes."
    });
    return;
  }

  try {
    const ipHash = hashIp(getClientIp(req));

    const upsertResponse = await fetch(
      `${supabaseUrl}/rest/v1/site_visitors?on_conflict=ip_hash`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          Prefer: "resolution=merge-duplicates,return=minimal"
        },
        body: JSON.stringify({ ip_hash: ipHash, last_seen_at: new Date().toISOString() })
      }
    );

    if (!upsertResponse.ok) {
      const text = await upsertResponse.text();
      throw new Error(`Falha ao registrar visita (HTTP ${upsertResponse.status}): ${text}`);
    }

    const countResponse = await fetch(`${supabaseUrl}/rest/v1/site_visitors?select=ip_hash`, {
      method: "HEAD",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Prefer: "count=exact"
      }
    });

    if (!countResponse.ok) {
      throw new Error(`Falha ao contar visitantes (HTTP ${countResponse.status})`);
    }

    const contentRange = countResponse.headers.get("content-range") || "";
    const total = Number(contentRange.split("/")[1]) || 0;

    res.status(200).json({ ok: true, count: total });
  } catch (error) {
    res.status(502).json({ ok: false, error: error?.message || "Erro ao calcular contagem de visitantes." });
  }
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

function hashIp(ip) {
  const salt = process.env.VISITOR_IP_SALT || "steam-planner-visitor-salt";
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}
