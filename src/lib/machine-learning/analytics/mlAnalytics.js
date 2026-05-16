import { buildUserLearningProfile } from "../user-profile/profileBuilder.js";

export function summarizeBehavior(events = [], projects = []) {
  const profile = buildUserLearningProfile({ events, projects });
  return {
    profile,
    metrics: {
      totalEvents: events.length,
      totalProjects: projects.length,
      generatedActivities: events.filter((event) => event.event_type === "activity_generated").length,
      exportedProjects: events.filter((event) => event.event_type === "report_exported" || event.event_type === "activity_printed").length,
      searches: events.filter((event) => String(event.event_type || "").includes("search")).length
    }
  };
}
