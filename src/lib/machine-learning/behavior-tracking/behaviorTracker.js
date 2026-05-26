import { isSupabaseConfigured, supabase } from "../../supabaseClient.js";
import { buildProjectEmbedding, projectToSearchText } from "../similarity/projectSimilarity.js";
import { suggestProjectContinuity } from "../project-continuity/continuityEngine.js";
import { canUsePreferences } from "../../cookieConsent.js";

const LOCAL_QUEUE_KEY = "steam-ml-behavior-queue";

function canUseSupabase() {
  return Boolean(supabase && isSupabaseConfigured);
}

function storeLocalEvent(event) {
  try {
    const current = JSON.parse(localStorage.getItem(LOCAL_QUEUE_KEY) || "[]");
    const next = [event, ...current].slice(0, 100);
    localStorage.setItem(LOCAL_QUEUE_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn("Nao foi possivel registrar comportamento localmente:", error);
  }
}

function textHash(value = "") {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(index) | 0;
  }
  return String(Math.abs(hash));
}

function bumpTopList(list = [], value, amount = 1) {
  if (!value) return list;
  const normalized = String(value).trim();
  const next = [...list];
  const current = next.find((item) => item.value === normalized);

  if (current) {
    current.count = Number(current.count || 0) + amount;
  } else {
    next.push({ value: normalized, count: amount });
  }

  return next
    .sort((left, right) => Number(right.count || 0) - Number(left.count || 0))
    .slice(0, 12);
}

export async function trackBehavior(userId, eventType, metadata = {}, context = {}) {
  if (!userId || !eventType) return;
  if (!canUsePreferences()) return;

  const event = {
    user_id: userId,
    event_type: eventType,
    metadata,
    context,
    created_at: new Date().toISOString()
  };

  storeLocalEvent(event);

  if (!canUseSupabase()) return;

  const usageHistory = {
    user_id: userId,
    action_type: eventType,
    entity_type: metadata.entityType || metadata.source || context.source || null,
    entity_id: metadata.projectId || metadata.templateId || metadata.newsId || null,
    metadata,
    created_at: event.created_at
  };

  const interaction = {
    user_id: userId,
    interaction_type: eventType,
    entity_type: usageHistory.entity_type,
    entity_id: usageHistory.entity_id,
    metadata,
    created_at: event.created_at
  };

  const metric = {
    user_id: userId,
    metric_name: eventType,
    metric_value: 1,
    dimensions: {
      source: metadata.source || context.source || "",
      discipline: metadata.discipline || "",
      grade: metadata.grade || ""
    },
    measured_at: event.created_at
  };

  const results = await Promise.allSettled([
    supabase.from("ml_behavior_events").insert(event),
    supabase.from("ml_usage_history").insert(usageHistory),
    supabase.from("ml_interactions").insert(interaction),
    supabase.from("ml_metrics").insert(metric)
  ]);

  results.forEach((result) => {
    if (result.status === "fulfilled" && result.value.error) {
      console.warn("Registro de ML nao persistido:", result.value.error.message);
    }
  });
}

export async function storeProjectEmbedding(userId, project = {}) {
  if (!userId || !project?.id || !canUseSupabase()) return;

  const searchableText = projectToSearchText(project);
  const embedding = buildProjectEmbedding(project);

  const { error } = await supabase.from("ml_embeddings").upsert({
    owner_id: userId,
    entity_type: "project",
    entity_id: project.id,
    embedding_model: embedding.model,
    dimensions: embedding.dimensions,
    embedding: embedding.values,
    text_hash: textHash(searchableText),
    metadata: {
      title: project.title || "",
      theme: project.theme || "",
      grade: project.grade || "",
      discipline: project.discipline || "",
      steam: project.steam || [],
      bncc: project.bncc || []
    },
    updated_at: new Date().toISOString()
  }, {
    onConflict: "owner_id,entity_type,entity_id"
  });

  if (error) {
    console.warn("Embedding de projeto nao persistido:", error.message);
  }
}

export async function updateUserPreferenceProfile(userId, project = {}) {
  if (!userId || !canUseSupabase()) return;

  const currentResult = await supabase
    .from("ml_user_preferences")
    .select("profile, top_disciplines, top_grades, top_themes, top_steam_areas, top_bncc")
    .eq("user_id", userId)
    .maybeSingle();

  const current = currentResult.data || {};
  const steamAreas = project.steam || [];
  const bnccCodes = project.bncc || [];
  const nextProfile = {
    ...(current.profile || {}),
    lastProjectId: project.id,
    lastProjectTitle: project.title,
    updatedBy: "project_learning"
  };

  const payload = {
    user_id: userId,
    profile: nextProfile,
    top_disciplines: bumpTopList(current.top_disciplines || [], project.discipline),
    top_grades: bumpTopList(current.top_grades || [], project.grade),
    top_themes: bumpTopList(current.top_themes || [], project.theme || project.title),
    top_steam_areas: steamAreas.reduce((list, area) => bumpTopList(list, area), current.top_steam_areas || []),
    top_bncc: bnccCodes.reduce((list, code) => bumpTopList(list, code), current.top_bncc || []),
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from("ml_user_preferences").upsert(payload);
  if (error) {
    console.warn("Perfil inteligente nao persistido:", error.message);
  }
}

export async function storeContinuityRecommendations(userId, project = {}) {
  if (!userId || !project?.id || !canUseSupabase()) return;

  const recommendations = suggestProjectContinuity(project).map((item, index) => ({
    user_id: userId,
    recommendation_type: "project_continuity",
    source_entity_type: "project",
    source_entity_id: project.id,
    target_entity_type: "pedagogical_idea",
    target_entity_id: `${project.id}-continuity-${index + 1}`,
    score: Number((1 - index * 0.12).toFixed(2)),
    reason: item.description,
    metadata: {
      title: item.title,
      sourceProjectTitle: project.title,
      theme: project.theme,
      grade: project.grade,
      steam: project.steam || [],
      bncc: project.bncc || []
    },
    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
  }));

  if (!recommendations.length) return;

  const { error } = await supabase.from("ml_recommendations").insert(recommendations);
  if (error) {
    console.warn("Recomendacoes inteligentes nao persistidas:", error.message);
  }
}

export async function trackActivityRating(userId, projectId, rating, metadata = {}) {
  if (!userId || !projectId) return;
  if (!canUsePreferences()) return;
  await trackBehavior(userId, 'activity_rated', {
    projectId,
    rating,
    discipline: metadata.discipline || '',
    grade: metadata.grade || '',
    steam: metadata.steam || [],
    theme: metadata.theme || '',
  });
}

function buildPatternsFromRatings(ratings = []) {
  const positive = ratings.filter((m) => m.rating === 'positive');
  if (positive.length === 0) return null;

  let disciplines = [];
  let grades = [];
  let steamAreas = [];

  for (const m of positive) {
    disciplines = bumpTopList(disciplines, m.discipline);
    grades = bumpTopList(grades, m.grade);
    for (const area of (m.steam || [])) {
      steamAreas = bumpTopList(steamAreas, area);
    }
  }

  return {
    totalPositive: positive.length,
    totalNegative: ratings.length - positive.length,
    topDisciplines: disciplines.slice(0, 3).map((d) => d.value).filter(Boolean),
    topGrades: grades.slice(0, 2).map((g) => g.value).filter(Boolean),
    topSteamAreas: steamAreas.slice(0, 4).map((s) => s.value).filter(Boolean),
  };
}

export async function getQualityPatterns(userId) {
  if (!userId) return null;

  const localEvents = JSON.parse(localStorage.getItem(LOCAL_QUEUE_KEY) || '[]');
  const localRatings = localEvents
    .filter((e) => e.event_type === 'activity_rated')
    .map((e) => e.metadata);

  if (!canUseSupabase()) return buildPatternsFromRatings(localRatings);

  try {
    const { data } = await supabase
      .from('ml_behavior_events')
      .select('metadata')
      .eq('user_id', userId)
      .eq('event_type', 'activity_rated')
      .order('created_at', { ascending: false })
      .limit(60);

    const allRatings = [...(data || []).map((r) => r.metadata), ...localRatings];
    return buildPatternsFromRatings(allRatings);
  } catch {
    return buildPatternsFromRatings(localRatings);
  }
}

export async function learnFromProject(userId, project = {}, context = {}) {
  if (!userId || !project) return;

  await Promise.allSettled([
    trackBehavior(userId, context.eventType || "project_learned", {
      projectId: project.id,
      title: project.title,
      theme: project.theme,
      grade: project.grade,
      discipline: project.discipline,
      steam: project.steam || [],
      bncc: project.bncc || [],
      source: project.createdVia
    }, context),
    storeProjectEmbedding(userId, project),
    updateUserPreferenceProfile(userId, project),
    storeContinuityRecommendations(userId, project)
  ]);
}
