import { selectBnccHabilidades } from "../../bnccSelector.js";

export function recommendBnccForContext({ profile = {}, grade = "", discipline = "", theme = "", steamAreas = [], limit = 5 } = {}) {
  const profileSteam = (profile.topSteamAreas || []).map((item) => item.value);
  const profileThemes = (profile.topThemes || []).slice(0, 4).map((item) => item.value).join(" ");

  return selectBnccHabilidades({
    grade,
    discipline,
    theme: [theme, profileThemes].filter(Boolean).join(" "),
    steamAreas: [...steamAreas, ...profileSteam],
    limit
  });
}
