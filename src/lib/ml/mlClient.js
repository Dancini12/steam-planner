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

async function invoke(body) {
  if (!supabase) throw new Error("Supabase indisponível");
  const { data, error } = await supabase.functions.invoke("ml-trainer", { body });
  if (error) throw error;
  return data;
}

// Admin: dispara o treino com os dados de todos os usuários.
export async function trainModels() {
  return invoke({ action: "train", library: slimLibrary() });
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
