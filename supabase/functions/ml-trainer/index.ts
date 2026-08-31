// ============================================================
// ml-trainer — Edge Function de treino e inferência do recomendador
// ============================================================
//
// Modelos de ML de verdade (TF-IDF ajustado + Regressão
// Logística treinada por gradiente descendente), implementados
// do zero em ../_shared/ml/*.js. Treina com os dados de TODOS
// os usuários (aprendizado colaborativo) e guarda os pesos
// aprendidos em public.ml_models + métricas em
// public.ml_model_evaluations.
//
// Ações (POST JSON):
//   { action: "train", library }        — admin OU service role (cron)
//   { action: "recommend", userId, context, library }
//   { action: "status" }                — modelos ativos + última avaliação
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { trainRecommender } from "./train.js";
import { recommendForTeacher } from "./recommend.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY") || "";
const ADMIN_EMAILS = (
  Deno.env.get("ADMIN_EMAIL") ||
  Deno.env.get("VITE_ADMIN_EMAIL") ||
  "marceldancini@gmail.com"
)
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

function bearerToken(req: Request) {
  return (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
}

function jwtEmail(token: string) {
  const payload = token.split(".")[1];
  if (!payload) return "";
  try {
    const base64 = payload.replaceAll("-", "+").replaceAll("_", "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const parsed = JSON.parse(atob(padded)) as Record<string, unknown>;
    return typeof parsed.email === "string" ? parsed.email.toLowerCase() : "";
  } catch {
    return "";
  }
}

function jwtSub(token: string) {
  const payload = token.split(".")[1];
  if (!payload) return "";
  try {
    const base64 = payload.replaceAll("-", "+").replaceAll("_", "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const parsed = JSON.parse(atob(padded)) as Record<string, unknown>;
    return typeof parsed.sub === "string" ? parsed.sub : "";
  } catch {
    return "";
  }
}

async function rest(path: string, init: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {})
    }
  });
  if (!res.ok) {
    throw new Error(`REST ${path} → ${res.status} ${await res.text()}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// Descobre o e-mail do usuário a partir do token. Primeiro tenta ler
// o payload do JWT; se não houver e-mail (ou o header vier diferente),
// valida o token no Auth do Supabase e usa o e-mail de lá.
async function resolveEmail(token: string): Promise<string> {
  const fromJwt = jwtEmail(token);
  if (fromJwt) return fromJwt;
  if (!token || token === SERVICE_KEY) return "";
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return "";
    const user = await res.json();
    return typeof user?.email === "string" ? user.email.toLowerCase() : "";
  } catch {
    return "";
  }
}

async function adminCheck(token: string) {
  const email = await resolveEmail(token);
  if (!email) return { email: "", isAdmin: false, via: "no_email" };
  if (ADMIN_EMAILS.includes(email)) return { email, isAdmin: true, via: "env_default" };
  try {
    const rows = await rest(
      `app_admins?select=email&email=ilike.${encodeURIComponent(email)}&limit=1`
    );
    const ok = Array.isArray(rows) && rows.length > 0;
    return { email, isAdmin: ok, via: ok ? "app_admins" : "not_listed" };
  } catch (e) {
    return { email, isAdmin: false, via: `app_admins_error:${(e as Error).message}` };
  }
}

async function loadActiveModel(kind: string) {
  const rows = await rest(
    `ml_models?select=id,params,feature_spec,n_samples,trained_at&kind=eq.${kind}&is_active=eq.true&order=trained_at.desc&limit=1`
  );
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

async function persistModels(result: Record<string, any>) {
  const insertedIds: Record<string, string> = {};
  for (const model of [result.tfidfModel, result.logregModel]) {
    await rest(`ml_models?kind=eq.${model.kind}&is_active=eq.true`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: false })
    });
    const inserted = await rest("ml_models", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify([
        {
          kind: model.kind,
          version: Date.now(),
          params: model.params,
          feature_spec: model.feature_spec,
          n_samples: model.n_samples,
          trained_at: model.trained_at,
          is_active: true
        }
      ])
    });
    insertedIds[model.kind] = inserted?.[0]?.id;
  }

  if (insertedIds.logreg_recommender) {
    await rest("ml_model_evaluations", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify([
        { model_id: insertedIds.logreg_recommender, metrics: result.metrics }
      ])
    });
  }

  return insertedIds;
}

async function handleTrain(body: Record<string, any>, token: string) {
  const check = token === SERVICE_KEY
    ? { email: "service_role", isAdmin: true, via: "service_key" }
    : await adminCheck(token);
  if (!check.isAdmin) {
    return jsonResponse(
      {
        error: check.email
          ? `Acesso restrito: ${check.email} não é administrador (${check.via}).`
          : "Acesso restrito: não foi possível identificar um usuário no pedido. Faça login novamente.",
        detail: check
      },
      403
    );
  }

  const [projects, mlEvents, usageEvents] = await Promise.all([
    rest("projects?select=id,owner_id,project_data&limit=5000"),
    rest(
      "ml_behavior_events?select=user_id,event_type,metadata,created_at&order=created_at.desc&limit=8000"
    ).catch(() => []),
    rest(
      "app_usage_events?select=user_id,event_type,metadata,created_at&order=created_at.desc&limit=8000"
    ).catch(() => [])
  ]);

  const events = [...(mlEvents || []), ...(usageEvents || [])];
  const library = Array.isArray(body.library) ? body.library : [];

  const result = trainRecommender({ library, projects: projects || [], events });

  if (!result.ok) {
    return jsonResponse({
      ok: false,
      reason: result.reason,
      nSamples: result.nSamples,
      nPositives: result.nPositives
    });
  }

  const ids = await persistModels(result);
  return jsonResponse({
    ok: true,
    trainedAt: result.trainedAt,
    nSamples: result.nSamples,
    nPositives: result.nPositives,
    modelIds: ids,
    metrics: result.metrics
  });
}

async function handleRecommend(body: Record<string, any>, token: string) {
  const userId = body.userId || jwtSub(token);
  if (!userId) return jsonResponse({ ok: false, reason: "missing_user" }, 400);

  const [tfidf, logreg] = await Promise.all([
    loadActiveModel("tfidf"),
    loadActiveModel("logreg_recommender")
  ]);
  if (!tfidf || !logreg) return jsonResponse({ ok: false, reason: "no_model" });

  const [events, projects] = await Promise.all([
    rest(
      `ml_behavior_events?select=user_id,event_type,metadata,created_at&user_id=eq.${userId}&order=created_at.desc&limit=500`
    ).catch(() => []),
    rest(
      `projects?select=id,owner_id,project_data&owner_id=eq.${userId}&limit=500`
    ).catch(() => [])
  ]);

  const recommendations = recommendForTeacher({
    userId,
    context: body.context || {},
    library: Array.isArray(body.library) ? body.library : [],
    projects: projects || [],
    events: events || [],
    tfidfParams: tfidf.params,
    logregParams: logreg.params,
    limit: Math.min(Number(body.limit) || 6, 20)
  });

  return jsonResponse({ ok: true, recommendations, modelTrainedAt: logreg.trained_at });
}

async function handleStatus() {
  const [tfidf, logreg] = await Promise.all([
    loadActiveModel("tfidf"),
    loadActiveModel("logreg_recommender")
  ]);

  let evaluation = null;
  if (logreg) {
    const rows = await rest(
      `ml_model_evaluations?select=metrics,created_at&model_id=eq.${logreg.id}&order=created_at.desc&limit=1`
    ).catch(() => []);
    evaluation = Array.isArray(rows) && rows.length ? rows[0] : null;
  }

  return jsonResponse({
    ok: true,
    hasModel: Boolean(tfidf && logreg),
    tfidf: tfidf ? { trainedAt: tfidf.trained_at, vocabSize: tfidf.params?.size } : null,
    logreg: logreg
      ? { trainedAt: logreg.trained_at, nSamples: logreg.n_samples }
      : null,
    evaluation
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Método não permitido." }, 405);

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return jsonResponse({ error: "Função não configurada (env ausente)." }, 500);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const token = bearerToken(req);
    const action = body.action || "status";

    if (action === "whoami") {
      const check =
        token === SERVICE_KEY
          ? { email: "service_role", isAdmin: true, via: "service_key" }
          : await adminCheck(token);
      return jsonResponse({
        ok: true,
        tokenPresent: Boolean(token),
        tokenLooksLikeAnonKey: token === Deno.env.get("SUPABASE_ANON_KEY"),
        ...check
      });
    }
    if (action === "train") return await handleTrain(body, token);
    if (action === "recommend") return await handleRecommend(body, token);
    if (action === "status") return await handleStatus();

    return jsonResponse({ error: `Ação desconhecida: ${action}` }, 400);
  } catch (error) {
    console.error("ml-trainer erro:", error);
    return jsonResponse({ error: (error as Error).message || "Erro interno." }, 500);
  }
});
