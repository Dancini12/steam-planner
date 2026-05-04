function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function parseDurationInDays(duration) {
  if (!duration || typeof duration !== "string") return null;

  const normalized = duration
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const weekMatch = normalized.match(/(\d+)\s*(semana|semanas)/);
  if (weekMatch) return Number(weekMatch[1]) * 7;

  const dayMatch = normalized.match(/(\d+)\s*(dia|dias)/);
  if (dayMatch) return Number(dayMatch[1]);

  const monthMatch = normalized.match(/(\d+)\s*(mes|meses)/);
  if (monthMatch) return Number(monthMatch[1]) * 30;

  return null;
}

export function getProjectTimeline(project) {
  const totalDays = parseDurationInDays(project?.duration);
  if (!project?.createdAt || !totalDays) {
    return {
      totalDays: null,
      elapsedDays: null,
      remainingDays: null,
      endDate: null,
      label: "Duração sem contagem automática"
    };
  }

  const startDate = new Date(project.createdAt);
  const today = new Date();
  const elapsedDays = Math.max(
    0,
    Math.floor((today.setHours(0, 0, 0, 0) - startDate.setHours(0, 0, 0, 0)) / 86400000)
  );
  const remainingDays = Math.max(0, totalDays - elapsedDays);
  const endDate = addDays(project.createdAt, totalDays);

  return {
    totalDays,
    elapsedDays,
    remainingDays,
    endDate,
    label:
      remainingDays === 0
        ? "Prazo estimado encerrado"
        : `${remainingDays} ${remainingDays === 1 ? "dia restante" : "dias restantes"}`
  };
}
