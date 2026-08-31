// ============================================================
// mlClient.js — ponte do front com a Edge Function ml-trainer
// ============================================================
//
// A Edge Function `ml-trainer` treina (TF-IDF + regressão
// logística, do zero) e faz inferência do recomendador. Este
// módulo só chama a função; se ela falhar ou ainda não houver
// modelo treinado, quem consome deve cair no recomendador
// heurístico legado (rankRecommendedProjects).
// ============================================================

import { supabase } from "../supabaseClient.js";
import { LIBRARY } from "../../data/library.js";
import { canUsePreferences } from "../cookieConsent.js";

const FUNCTION_URL =
  (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "") + "/functions/v1/ml-trainer";
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

function slimLibrary() {
  // Envia só o necessário para os atributos do modelo (evita
  // trafegar bibliografia, fases completas etc.).
  return LIBRARY.map((item) => ({
    id: item.id,
    title: item.title,
    theme: item.theme,
    grade: item.grade,
    discipline: item.discipline || "",
    problem: item.problem || "",
    guidingQuestion: item.guidingQuestion || "",
    objectives: item.objectives || [],
    steam: item.steam || [],
    bncc: item.bncc || [],
    materials: item.materials || [],
    summary: item.summary || ""
  }));
}

// Chamada direta (fetch) à Edge Function — controle total do
// header Authorization (o token da sessão, não a chave anônima) e
// da mensagem de erro real vinda do corpo da resposta.
async function invoke(body) {
  if (!FUNCTION_URL || !ANON_KEY) throw new Error("Supabase não configurado no cliente");

  let accessToken = "";
  try {
    const { data } = await supabase.auth.getSession();
    accessToken = data?.session?.access_token || "";
  } catch {
    /* sem sessão */
  }

  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      Authorization: `Bearer ${accessToken || ANON_KEY}`
    },
    body: JSON.stringify(body)
  });

  const text = await res.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }

  if (!res.ok) {
    const msg = payload?.error || payload?.reason || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  return payload;
}

// Admin: dispara o treino com os dados de todos os usuários.
export async function trainModels() {
  return invoke({ action: "train", library: slimLibrary() });
}

// Diagnóstico: o que a função enxerga da sessão do chamador.
export async function fetchAuthDebug() {
  try {
    return await invoke({ action: "whoami" });
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

// Diagnóstico: volume de dados e se dá para treinar.
export async function fetchTrainingDiag() {
  try {
    return await invoke({ action: "diag", library: slimLibrary() });
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

// Estado dos modelos ativos + última avaliação (para o painel admin).
export async function fetchModelStatus() {
  try {
    return await invoke({ action: "status" });
  } catch (error) {
    console.warn("fetchModelStatus falhou:", error);
    return { ok: false, hasModel: false };
  }
}

// Recomendações personalizadas. Retorna [] quando não há modelo,
// não há consentimento, ou a função falha — o chamador usa o
// fallback heurístico nesses casos.
export async function fetchRecommendations(userId, context = {}, limit = 6) {
  if (!userId || !canUsePreferences()) return null;
  try {
    const data = await invoke({
      action: "recommend",
      userId,
      context,
      library: slimLibrary(),
      limit
    });
    if (!data?.ok || !Array.isArray(data.recommendations)) return null;
    return data.recommendations;
  } catch (error) {
    console.warn("fetchRecommendations falhou, usando fallback:", error);
    return null;
  }
}
