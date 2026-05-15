import { isSupabaseConfigured, supabase } from "./supabaseClient.js";

function canUseSupabase() {
  if (supabase && isSupabaseConfigured) {
    return true;
  }

  console.warn("Supabase indisponível");
  return false;
}

export function getUserData(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name || user.email?.split("@")[0] || "",
    school: user.user_metadata?.school || "",
    area: user.user_metadata?.area || ""
  };
}

export async function registerUserProfile(user) {
  if (!canUseSupabase() || !user?.id) return;

  const userData = getUserData(user);
  await supabase.from("app_profiles").upsert({
    id: userData.id,
    email: userData.email,
    name: userData.name,
    school: userData.school,
    area: userData.area,
    last_seen_at: new Date().toISOString()
  });
}

export async function trackEvent(userId, eventType, metadata = {}) {
  if (!canUseSupabase() || !userId) return;

  await supabase.from("app_usage_events").insert({
    user_id: userId,
    event_type: eventType,
    metadata
  });
}

export async function getAdminMetrics() {
  if (!canUseSupabase()) {
    return {
      usersCount: 0,
      projectsCount: 0,
      loginsCount: 0,
      signupsCount: 0,
      activeUsers7d: 0,
      usersWithProjects: 0,
      averageProjectsPerUser: 0,
      projectsWithFinalProduct: 0,
      generalDiaryEntries: 0,
      individualDiaryEntries: 0,
      registeredStudents: 0,
      creationSources: {},
      snapshots: [],
      events: []
    };
  }

  const [profilesResult, projectsResult, privateResult, eventsResult, snapshotsResult] = await Promise.all([
    supabase.from("app_profiles").select("id, email, name, school, area, created_at, last_seen_at"),
    supabase.from("projects").select("id, owner_id, project_data, created_at, updated_at"),
    supabase.from("project_private_data").select("project_id, private_data"),
    supabase
      .from("app_usage_events")
      .select("event_type, created_at, metadata, user_id")
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase
      .from("app_metric_snapshots")
      .select("id, title, metrics, created_at")
      .order("created_at", { ascending: false })
      .limit(12)
  ]);

  if (
    profilesResult.error ||
    projectsResult.error ||
    privateResult.error ||
    eventsResult.error ||
    snapshotsResult.error
  ) {
    throw new Error("Não foi possível carregar os indicadores administrativos.");
  }

  const profiles = profilesResult.data || [];
  const projects = projectsResult.data || [];
  const privateRows = privateResult.data || [];
  const events = eventsResult.data || [];
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const activeUsers = new Set(
    events
      .filter((event) => new Date(event.created_at).getTime() >= sevenDaysAgo)
      .map((event) => event.user_id)
  );
  const projectOwners = new Set(projects.map((project) => project.owner_id));
  const creationSources = events
    .filter((event) => event.event_type === "project_created")
    .reduce((acc, event) => {
      const source = event.metadata?.source || "unknown";
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

  let projectsWithFinalProduct = 0;
  let generalDiaryEntries = 0;

  projects.forEach((project) => {
    const data = project.project_data || {};
    if ((data.finalProduct || "").trim().length > 0) {
      projectsWithFinalProduct += 1;
    }

    Object.values(data.phases || {}).forEach((phase) => {
      generalDiaryEntries += (phase.entries || []).length;
    });
  });

  let registeredStudents = 0;
  let individualDiaryEntries = 0;

  privateRows.forEach((row) => {
    const privateData = row.private_data || {};
    registeredStudents += (privateData.students || []).length;
    Object.values(privateData.phaseStudentEntries || {}).forEach((phaseEntries) => {
      Object.values(phaseEntries || {}).forEach((entries) => {
        individualDiaryEntries += (entries || []).length;
      });
    });
  });

  return {
    usersCount: profiles.length,
    projectsCount: projects.length,
    loginsCount: events.filter((event) => event.event_type === "login").length,
    signupsCount: events.filter((event) => event.event_type === "signup").length,
    activeUsers7d: activeUsers.size,
    usersWithProjects: projectOwners.size,
    averageProjectsPerUser:
      profiles.length > 0 ? Number((projects.length / profiles.length).toFixed(2)) : 0,
    projectsWithFinalProduct,
    generalDiaryEntries,
    individualDiaryEntries,
    registeredStudents,
    creationSources,
    snapshots: snapshotsResult.data || [],
    events
  };
}

export async function saveAdminMetricSnapshot(metrics, title = "Leitura dos indicadores") {
  if (!canUseSupabase() || !metrics) return;

  const { error } = await supabase.from("app_metric_snapshots").insert({
    title,
    metrics: {
      usersCount: metrics.usersCount,
      projectsCount: metrics.projectsCount,
      activeUsers7d: metrics.activeUsers7d,
      usersWithProjects: metrics.usersWithProjects,
      averageProjectsPerUser: metrics.averageProjectsPerUser,
      registeredStudents: metrics.registeredStudents,
      generalDiaryEntries: metrics.generalDiaryEntries,
      individualDiaryEntries: metrics.individualDiaryEntries,
      projectsWithFinalProduct: metrics.projectsWithFinalProduct,
      creationSources: metrics.creationSources
    }
  });

  if (error) {
    throw new Error("Não foi possível salvar a leitura dos indicadores.");
  }
}
