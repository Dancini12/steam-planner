import { createTextEmbedding, cosineSimilarity } from "../embeddings/textVectorizer.js";
import { getProfileKeywords } from "../user-profile/profileBuilder.js";
import { projectToSearchText, rankSimilarProjects } from "../similarity/projectSimilarity.js";

function scoreByProfile(project, profile) {
  const keywords = getProfileKeywords(profile);
  if (!keywords.length) return 0;
  const profileEmbedding = createTextEmbedding(keywords.join(" "));
  const projectEmbedding = createTextEmbedding(projectToSearchText(project));
  return cosineSimilarity(profileEmbedding.values, projectEmbedding.values);
}

export function rankRecommendedProjects({ profile = {}, library = [], currentProject = null, limit = 8 } = {}) {
  const similarity = currentProject
    ? new Map(rankSimilarProjects(currentProject, library, library.length).map((item) => [item.project.id, item.score]))
    : new Map();

  return library
    .map((project) => {
      const profileScore = scoreByProfile(project, profile);
      const similarityScore = similarity.get(project.id) || 0;
      const score = Number((profileScore * 0.65 + similarityScore * 0.35).toFixed(4));
      return {
        project,
        score,
        reason: score > 0
          ? "Alinhado ao perfil de uso e a projetos semelhantes."
          : "Disponivel como ponto de partida editavel."
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

export function suggestThemesFromProfile(profile = {}, limit = 6) {
  return (profile.topThemes || [])
    .slice(0, limit)
    .map((item) => ({
      theme: item.value,
      score: item.count,
      reason: "Tema recorrente no planejamento do professor."
    }));
}
