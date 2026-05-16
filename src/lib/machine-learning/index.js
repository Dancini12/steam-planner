export { trackBehavior, learnFromProject, storeProjectEmbedding } from "./behavior-tracking/behaviorTracker.js";
export { createTextEmbedding, cosineSimilarity, tokenizeText } from "./embeddings/textVectorizer.js";
export { buildUserLearningProfile } from "./user-profile/profileBuilder.js";
export { rankSimilarProjects, scoreProjectSimilarity } from "./similarity/projectSimilarity.js";
export { rankRecommendedProjects, suggestThemesFromProfile } from "./recommendation/recommendationEngine.js";
export { recommendBnccForContext } from "./bncc-suggestions/bnccRecommendation.js";
export { suggestProjectContinuity } from "./project-continuity/continuityEngine.js";
export { summarizeBehavior } from "./analytics/mlAnalytics.js";
