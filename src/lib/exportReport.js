// ============================================================
// exportReport.js
// Geração de relatório imprimível do projeto
// ============================================================
//
// Abre uma nova janela do navegador com o projeto formatado
// para impressão (ou para salvar em PDF). O relatório reúne
// todos os dados do projeto e o histórico das 5 fases num
// documento único, pronto para arquivamento ou compartilhamento.
//
// Estética: tipografia clara, cores discretas, organização
// hierárquica que facilita a leitura impressa.
// ============================================================

import { PHASES } from "../data/phases.js";
import { STEAM_AREAS } from "../data/steamAreas.js";

function buildActivityPrintHTML(activity) {
  const { title, theme, duration, problem, guidingQuestion, objectives, bncc, materials, activityManual, steamMatrix, accessibility, bibliography, grade, discipline } = activity;

  const steamLetters = Object.keys(steamMatrix || {}).filter((k) => ["S", "T", "E", "A", "M"].includes(k));

  const matrixHTML = steamLetters.map((letter) => {
    const area = STEAM_AREAS[letter];
    const m = (steamMatrix || {})[letter] || {};
    return `<tr>
      <td style="font-weight:700;color:#000">${letter} · ${escapeHtml(area?.name || letter)}</td>
      <td>${escapeHtml(m.contribution || '—')}</td>
      <td>${escapeHtml(m.activity || '—')}</td>
      <td>${escapeHtml(m.evidence || '—')}</td>
    </tr>`;
  }).join("");

  const objectivesHTML = (objectives || []).map((o) => `<li>${escapeHtml(o)}</li>`).join("");
  const materialsHTML = (materials || []).map((m) => `<li>${escapeHtml(m)}</li>`).join("");
  const accessibilityHTML = (accessibility || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const bnccHTML = (bncc || []).map(escapeHtml).join(" · ");
  const bibliographyHTML = (bibliography || []).map((b) => `<li style="margin-bottom:0.4rem;">${escapeHtml(b)}</li>`).join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title || "Atividade Pedagógica")}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Georgia, serif; max-width: 800px; margin: 2rem auto; padding: 1rem 1.5rem; color: #000; line-height: 1.6; }
    h1 { color: #000; font-weight: bold; border-bottom: 3px solid #000; padding-bottom: 0.5rem; margin-bottom: 0.25rem; font-size: 1.6rem; }
    h2 { font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.07em; color: #000; font-weight: bold; margin: 2rem 0 0.75rem; border-bottom: 1px solid #ccc; padding-bottom: 0.3rem; }
    h3 { margin: 0 0 0.4rem; font-size: 1rem; color: #000; font-weight: bold; }
    .meta { color: #333; font-size: 0.9rem; margin-bottom: 1.5rem; }
    .question { background: #f5f5f5; border-left: 4px solid #000; padding: 0.75rem 1rem; margin: 0.75rem 0; font-style: italic; }
    .problem { background: #f5f5f5; border-left: 4px solid #555; padding: 0.75rem 1rem; margin: 0.75rem 0; }
    table { width: 100%; border-collapse: collapse; margin: 0.75rem 0; font-size: 0.9rem; }
    th, td { border: 1px solid #ccc; padding: 0.5rem 0.75rem; vertical-align: top; }
    th { background: #f0f0f0; text-align: left; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; font-weight: bold; color: #000; }
    ul { padding-left: 1.5rem; margin: 0.5rem 0; }
    li { margin-bottom: 0.3rem; }
    footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #ccc; color: #333; font-size: 0.8rem; text-align: center; }
    @media print { body { margin: 0; padding: 0.5cm 1cm; } h2 { page-break-after: avoid; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(title || "Atividade Pedagógica")}</h1>
  <div class="meta">
    ${escapeHtml(theme || "")}${grade ? ` · ${escapeHtml(grade)}` : ""}${discipline ? ` · ${escapeHtml(discipline)}` : ""}${duration ? ` · ${escapeHtml(duration)}` : ""}
  </div>

  ${problem ? `<h2>Problema ou Desafio</h2><div class="problem">${escapeHtml(problem)}</div>` : ""}
  ${guidingQuestion ? `<h2>Questão Norteadora</h2><div class="question">${escapeHtml(guidingQuestion)}</div>` : ""}

  ${steamLetters.length > 0 ? `
  <h2>Matriz STEAM</h2>
  <table>
    <thead><tr><th>Área</th><th>Contribuição</th><th>Atividade</th><th>Evidência</th></tr></thead>
    <tbody>${matrixHTML}</tbody>
  </table>` : ""}

  ${objectivesHTML ? `<h2>Objetivos de Aprendizagem</h2><ul>${objectivesHTML}</ul>` : ""}
  ${bnccHTML ? `<h2>Habilidades BNCC</h2><p style="font-family:monospace;font-size:0.9rem;">${bnccHTML}</p>` : ""}
  ${materialsHTML ? `<h2>Materiais</h2><ul>${materialsHTML}</ul>` : ""}
  ${activityManual ? `<h2>Resumo, Materiais e Montagem</h2><div class="problem">${formatMultiline(activityManual)}</div>` : ""}
  ${accessibilityHTML ? `<h2>Acessibilidade e Inclusão</h2><ul>${accessibilityHTML}</ul>` : ""}
  ${bibliographyHTML ? `<h2>Referências Bibliográficas</h2><ul>${bibliographyHTML}</ul>` : ""}

  <footer>Atividade gerada pelo STEAM Planner em ${new Date().toLocaleDateString("pt-BR")}</footer>
</body>
</html>`;
}

export function openActivityPrintWindow(activity) {
  const html = buildActivityPrintHTML(activity);
  const newWindow = window.open("", "_blank");
  if (!newWindow) {
    alert("Não foi possível abrir o PDF. Verifique se o navegador está bloqueando pop-ups.");
    return;
  }
  newWindow.document.write(html);
  newWindow.document.close();
}
import {
  EVALUATION_INSTRUMENTS,
  EVALUATION_LEVELS
} from "../data/evaluation.js";

// Formata uma data ISO para exibição em português brasileiro.
function formatDate(isoString) {
  if (!isoString) return "";
  try {
    const date = /^\d{4}-\d{2}-\d{2}$/.test(isoString)
      ? new Date(`${isoString}T12:00:00`)
      : new Date(isoString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  } catch {
    return "";
  }
}

// Constrói o HTML completo do relatório.
function buildReportHTML(project) {
  const steamBadges = (project.steam || [])
    .map((letter) => {
      const area = STEAM_AREAS[letter];
      return area
        ? `<span style="background:#f0f0f0;color:#000;padding:0.2rem 0.5rem;border-radius:4px;font-size:0.85rem;font-weight:700;margin-right:0.4rem;border:1px solid #ccc;">${letter} · ${area.name}</span>`
        : "";
    })
    .join("");

  const objectivesList = (project.objectives || [])
    .map((o) => `<li>${escapeHtml(o)}</li>`)
    .join("");

  const materialsList = (project.materials || [])
    .map((m) => `<li>${escapeHtml(m)}</li>`)
    .join("");
  const activityManualHTML = project.activityManual
    ? `<div class="problem">${formatMultiline(project.activityManual)}</div>`
    : "";

  const studentsList = (project.students || [])
    .map(
      (student) =>
        `<li>${escapeHtml(
          `${student.number ? `${student.number} · ` : ""}${student.name}${
            student.className ? ` · ${student.className}` : ""
          }${student.notes ? ` · ${student.notes}` : ""}`
        )}</li>`
    )
    .join("");

  const bnccList = (project.bncc || []).map(escapeHtml).join(" · ");

  const steamMatrixHTML = (project.steam || [])
    .map((letter) => {
      const area = STEAM_AREAS[letter];
      const matrix = project.steamMatrix?.[letter] || {};
      if (!area) return "";

      return `
        <tr>
          <td><strong>${letter} · ${escapeHtml(area.name)}</strong></td>
          <td>${escapeHtml(matrix.contribution || "—")}</td>
          <td>${escapeHtml(matrix.activity || "—")}</td>
          <td>${escapeHtml(matrix.evidence || "—")}</td>
        </tr>
      `;
    })
    .join("");

  const phasesHTML = PHASES.map((phase) => {
    const data = project.phases?.[phase.id] || {};
    const evaluation = data.evaluation || {};
    const level = EVALUATION_LEVELS.find((l) => l.id === evaluation.level);
    const instruments = (evaluation.instruments || [])
      .map((id) => {
        const instr = EVALUATION_INSTRUMENTS.find((i) => i.id === id);
        return instr ? instr.name : "";
      })
      .filter(Boolean)
      .join(", ");

    const entriesHTML = (data.entries || [])
      .map(
        (e) =>
          `<div style="border-left:2px solid #ccc;padding:0.5rem 1rem;margin:0.5rem 0;">
            <div style="font-size:0.8rem;color:#333;">${formatDate(e.date)}</div>
            <div style="color:#000;">${escapeHtml(e.text)}</div>
          </div>`
      )
      .join("");

    const studentEntriesHTML = (project.students || [])
      .map((student) => {
        const entries = data.studentEntries?.[student.id] || [];
        if (entries.length === 0) return "";

        const entriesList = entries
          .map(
            (entry) =>
              `<div style="border-left:2px solid #ccc;padding:0.4rem 0.8rem;margin:0.4rem 0;">
                <div style="font-size:0.8rem;color:#333;">${formatDate(entry.date)}</div>
                <div style="color:#000;">${escapeHtml(entry.text)}</div>
              </div>`
          )
          .join("");

        return `
          <div style="margin:0.75rem 0;">
            <strong>${escapeHtml(student.name)}</strong>
            ${entriesList}
          </div>
        `;
      })
      .join("");

    return `
      <section style="margin-bottom:2rem;page-break-inside:avoid;">
        <h2 style="color:#000;font-weight:bold;border-bottom:2px solid #000;padding-bottom:0.4rem;">
          Fase ${phase.number}: ${phase.name}
        </h2>
        <p style="font-style:italic;color:#333;">${phase.subtitle}</p>

        <h3>Plano pedagógico</h3>
        <p>${escapeHtml(data.plan || "(não preenchido)")}</p>

        <h3>Diário de bordo</h3>
        ${entriesHTML || "<p>(sem registros)</p>"}

        <h3>Diário individual dos alunos</h3>
        ${studentEntriesHTML || "<p>(sem registros individuais)</p>"}

        <h3>Avaliação em fases</h3>
        <p><strong>Indicadores observados:</strong> ${escapeHtml(evaluation.indicators || "—")}</p>
        <p><strong>Instrumentos utilizados:</strong> ${instruments || "—"}</p>
        <p><strong>Evidências coletadas:</strong> ${escapeHtml(evaluation.evidence || "—")}</p>
        <p><strong>Devolutiva:</strong> ${escapeHtml(evaluation.feedback || "—")}</p>
        <p><strong>Nível de desenvolvimento:</strong>
          ${level ? `<span style="background:#f0f0f0;color:#000;padding:0.15rem 0.5rem;border-radius:3px;border:1px solid #ccc;font-weight:bold;">${level.label}</span>` : "—"}
        </p>
      </section>
    `;
  }).join("");

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(project.title || "Projeto STEAM")}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 2rem auto; padding: 1rem; color: #000; line-height: 1.6; }
    h1 { color: #000; font-weight: bold; border-bottom: 3px solid #000; padding-bottom: 0.5rem; }
    h2 { margin-top: 2rem; color: #000; font-weight: bold; }
    h3 { margin-top: 1.2rem; color: #000; font-weight: bold; }
    .question { background: #f5f5f5; border-left: 4px solid #000; padding: 1rem; font-size: 1.1rem; margin: 1rem 0; font-style: italic; }
    .meta { color: #333; font-size: 0.9rem; margin-bottom: 1rem; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.92rem; }
    th, td { border: 1px solid #ccc; padding: 0.55rem; vertical-align: top; }
    th { background: #f0f0f0; text-align: left; font-weight: bold; color: #000; }
    @media print { body { margin: 0; padding: 0.5cm; } h2 { page-break-after: avoid; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(project.title || "Projeto STEAM sem título")}</h1>
  <div class="meta">
    ${escapeHtml(project.theme || "")} · ${escapeHtml(project.grade || "")} · ${escapeHtml(project.duration || "")}
  </div>
  <div>${steamBadges}</div>

  ${
    project.problem
      ? `<h2>Problema ou desafio real</h2><p>${escapeHtml(project.problem)}</p>`
      : ""
  }

  ${
    project.finalProduct
      ? `<h2>Produto final ou solução esperada</h2><p>${escapeHtml(project.finalProduct)}</p>`
      : ""
  }

  ${
    project.guidingQuestion
      ? `<div class="question">${escapeHtml(project.guidingQuestion)}</div>`
      : ""
  }

  <h2>Matriz STEAM do projeto</h2>
  ${
    steamMatrixHTML
      ? `<table>
          <thead>
            <tr>
              <th>Área</th>
              <th>Contribuição</th>
              <th>Atividade relacionada</th>
              <th>Evidência esperada</th>
            </tr>
          </thead>
          <tbody>${steamMatrixHTML}</tbody>
        </table>`
      : "<p>(não preenchida)</p>"
  }

  <h2>Objetivos pedagógicos</h2>
  <ul>${objectivesList || "<li>(não preenchido)</li>"}</ul>

  <h2>Habilidades BNCC</h2>
  <p style="font-family:monospace;">${bnccList || "(não preenchido)"}</p>

  <h2>Materiais</h2>
  <ul>${materialsList || "<li>(não preenchido)</li>"}</ul>

  ${activityManualHTML ? `<h2>Resumo, Materiais e Montagem</h2>${activityManualHTML}` : ""}

  <h2>Turma e alunos</h2>
  <ul>${studentsList || "<li>(nenhum aluno cadastrado)</li>"}</ul>

  <hr style="margin:2rem 0;">

  ${phasesHTML}

  <footer style="margin-top:3rem;padding-top:1rem;border-top:1px solid #ccc;color:#333;font-size:0.85rem;text-align:center;">
    Relatório gerado pelo STEAM Planner em ${new Date().toLocaleDateString("pt-BR")}
  </footer>
</body>
</html>
  `;
}

// Escapa caracteres HTML para evitar quebra de layout.
function escapeHtml(text) {
  if (typeof text !== "string") return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMultiline(text) {
  return escapeHtml(text).replace(/\n/g, "<br>");
}

// ------------------------------------------------------------
// FUNÇÃO PRINCIPAL — ABRIR JANELA COM RELATÓRIO
// ------------------------------------------------------------

function buildClassroomActivityHTML(activity, projectTitle) {
  const stepsHTML = (activity.steps || []).map((step, i) => {
    return `
      <div style="display:flex;gap:1rem;margin-bottom:1.25rem;align-items:flex-start;">
        <div style="min-width:90px;text-align:right;">
          <div style="font-size:0.75rem;font-weight:700;color:#333;text-transform:uppercase;">${escapeHtml(step.time || '')}</div>
          <div style="font-size:0.7rem;background:#f0f0f0;color:#000;border:1px solid #ccc;padding:0.15rem 0.4rem;border-radius:3px;margin-top:0.2rem;display:inline-block;font-weight:bold;">${escapeHtml(step.actor || '')}</div>
        </div>
        <div style="flex:1;border-left:3px solid #000;padding-left:1rem;">
          <div style="font-weight:700;color:#000;margin-bottom:0.3rem;">${i + 1}. ${escapeHtml(step.title || '')}</div>
          <div style="color:#000;line-height:1.6;">${escapeHtml(step.description || '')}</div>
        </div>
      </div>
    `
  }).join('')

  const questionsHTML = (activity.discussionQuestions || [])
    .map((q) => `<li style="margin-bottom:0.5rem;">${escapeHtml(q)}</li>`)
    .join('')

  const materialsHTML = (activity.materials || [])
    .map((m) => `<li>${escapeHtml(m)}</li>`)
    .join('')

  const accessibilityHTML = activity.accessibility
    ? `<div class="tips-box">${escapeHtml(activity.accessibility)}</div>`
    : ''

  const bnccHTML = (activity.bncc || []).map(escapeHtml).join(' · ')

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(activity.activityTitle || 'Roteiro de Aula')}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Georgia, serif; max-width: 800px; margin: 2rem auto; padding: 1rem 1.5rem; color: #000; line-height: 1.6; }
    h1 { color: #000; font-weight: bold; border-bottom: 3px solid #000; padding-bottom: 0.5rem; margin-bottom: 0.25rem; }
    h2 { font-size: 1rem; text-transform: uppercase; letter-spacing: 0.06em; color: #000; font-weight: bold; margin: 2rem 0 0.75rem; border-bottom: 1px solid #ccc; padding-bottom: 0.3rem; }
    .meta { color: #333; font-size: 0.9rem; margin-bottom: 1.5rem; }
    .objective-box { background: #f5f5f5; border-left: 4px solid #000; padding: 1rem 1.25rem; margin: 1rem 0 1.5rem; font-size: 1rem; }
    .tips-box { background: #f5f5f5; border-left: 4px solid #555; padding: 1rem 1.25rem; margin: 1rem 0; font-size: 0.95rem; }
    .assessment-box { background: #f5f5f5; border-left: 4px solid #555; padding: 1rem 1.25rem; margin: 1rem 0; font-size: 0.95rem; }
    ul { padding-left: 1.5rem; }
    li { margin-bottom: 0.3rem; }
    .project-ref { font-size: 0.82rem; color: #333; font-style: italic; margin-bottom: 0.5rem; }
    footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #ccc; color: #333; font-size: 0.82rem; text-align: center; }
    @media print { body { margin: 0; padding: 0.5cm 1cm; } }
  </style>
</head>
<body>
  <div class="project-ref">Projeto: ${escapeHtml(projectTitle || '')}</div>
  <h1>${escapeHtml(activity.activityTitle || 'Roteiro de Aula')}</h1>
  <div class="meta">
    ${escapeHtml(activity.targetAudience || '')}
    ${activity.duration ? ` · ${escapeHtml(activity.duration)}` : ''}
    ${bnccHTML ? ` · <span style="font-family:monospace;">${bnccHTML}</span>` : ''}
  </div>

  <h2>Objetivo da aula</h2>
  <div class="objective-box">${escapeHtml(activity.objective || '')}</div>

  ${materialsHTML ? `<h2>Materiais necessários</h2><ul>${materialsHTML}</ul>` : ''}

  <h2>Roteiro passo a passo</h2>
  ${stepsHTML}

  ${questionsHTML ? `<h2>Perguntas para discussão</h2><ul>${questionsHTML}</ul>` : ''}

  <h2>Como avaliar</h2>
  <div class="assessment-box">${escapeHtml(activity.assessment || '')}</div>

  ${accessibilityHTML ? `<h2>Acessibilidade e inclusão</h2>${accessibilityHTML}` : ''}

  ${activity.tips ? `<h2>Dicas para o professor</h2><div class="tips-box">${escapeHtml(activity.tips)}</div>` : ''}

  <footer>Roteiro gerado pelo STEAM Planner em ${new Date().toLocaleDateString('pt-BR')}</footer>
</body>
</html>
  `
}

export function openClassroomActivityWindow(activity, projectTitle) {
  const html = buildClassroomActivityHTML(activity, projectTitle)
  const newWindow = window.open('', '_blank')
  if (!newWindow) {
    alert('Não foi possível abrir o roteiro. Verifique se o navegador está bloqueando pop-ups.')
    return
  }
  newWindow.document.write(html)
  newWindow.document.close()
}

export function openReportWindow(project) {
  const html = buildReportHTML(project);
  const newWindow = window.open("", "_blank");
  if (!newWindow) {
    alert(
      "Não foi possível abrir o relatório. Verifique se o navegador está bloqueando pop-ups."
    );
    return;
  }
  newWindow.document.write(html);
  newWindow.document.close();
}

function buildAdaptationReportHTML(result, filename, selectedAdaptations) {
  const adaptationLabels = selectedAdaptations
    .map((a) => `<span class="badge">${escapeHtml(a.label)}</span>`)
    .join("");

  const lines = result.split("\n");
  let activityTitle = "";
  const bodyLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { bodyLines.push("<br>"); continue; }

    if (/^###\s/.test(trimmed)) {
      bodyLines.push(`<h3>${escapeHtml(trimmed.replace(/^###\s*/, ""))}</h3>`);
      continue;
    }
    if (/^##\s/.test(trimmed)) {
      const text = trimmed.replace(/^##\s*/, "");
      const isNotes = /notas\s+para\s+o\s+professor/i.test(text);
      bodyLines.push(isNotes
        ? `<h2 class="notes-heading">${escapeHtml(text)}</h2>`
        : `<h2>${escapeHtml(text)}</h2>`
      );
      continue;
    }
    if (/^#\s/.test(trimmed)) {
      const text = trimmed.replace(/^#\s*/, "");
      if (!activityTitle) activityTitle = text;
      bodyLines.push(`<h1 class="activity-title">${escapeHtml(text)}</h1>`);
      continue;
    }
    if (/^\*\*(.+)\*\*/.test(trimmed)) {
      bodyLines.push(`<p>${escapeHtml(trimmed).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}</p>`);
      continue;
    }
    if (/^[-•*]\s/.test(trimmed)) {
      bodyLines.push(`<li>${escapeHtml(trimmed.replace(/^[-•*]\s/, ""))}</li>`);
      continue;
    }
    if (/^\d+\.\s/.test(trimmed)) {
      bodyLines.push(`<li>${escapeHtml(trimmed.replace(/^\d+\.\s/, ""))}</li>`);
      continue;
    }
    bodyLines.push(`<p>${escapeHtml(trimmed)}</p>`);
  }

  const bodyHTML = bodyLines
    .join("\n")
    .replace(/(<li>[\s\S]*?<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

  const titleForHeader = activityTitle || (filename ? filename.replace(/\.pdf$/i, "") : "Atividade Adaptada");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(titleForHeader)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: #F5F7FB;
      color: #1F2937;
      line-height: 1.75;
      margin: 0;
      padding: 2rem 1rem;
    }
    .page {
      background: #FFFFFF;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem 2.5rem;
      border-radius: 8px;
      border: 1px solid #E5E7EB;
    }
    .doc-header {
      padding-bottom: 1.25rem;
      margin-bottom: 1.75rem;
      border-bottom: 2px solid #E5E7EB;
    }
    .doc-header-label {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #8B5CF6;
      margin-bottom: 0.4rem;
    }
    .doc-header h1 {
      font-size: 1.45rem;
      font-weight: 700;
      color: #1F2937;
      margin: 0 0 0.5rem;
    }
    .doc-meta { font-size: 0.83rem; color: #6B7280; margin: 0.2rem 0; }
    .doc-profiles { margin-top: 0.75rem; }
    .badge {
      display: inline-block;
      background: #EDE9FE;
      color: #5B21B6;
      border: 1px solid #C4B5FD;
      border-radius: 20px;
      padding: 0.2rem 0.7rem;
      font-size: 0.78rem;
      font-weight: 600;
      margin-right: 0.4rem;
      margin-bottom: 0.35rem;
    }
    .activity-title {
      font-size: 1.3rem;
      font-weight: 700;
      color: #1F2937;
      margin: 1.5rem 0 0.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #4F46E5;
    }
    h2 {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.09em;
      color: #4F46E5;
      margin: 2rem 0 0.6rem;
      padding-bottom: 0.35rem;
      border-bottom: 1px solid #E5E7EB;
    }
    h2.notes-heading {
      color: #10B981;
      border-bottom-color: #D1FAE5;
    }
    h3 {
      font-size: 0.95rem;
      font-weight: 700;
      color: #1F2937;
      margin: 1.25rem 0 0.4rem;
    }
    p { margin: 0.5rem 0; color: #1F2937; }
    ul { padding-left: 1.5rem; margin: 0.5rem 0; }
    li { margin-bottom: 0.4rem; color: #1F2937; }
    strong { color: #1F2937; }
    .notes-section {
      margin-top: 2rem;
      padding: 1rem 1.25rem;
      background: #F0FDF4;
      border-left: 4px solid #10B981;
      border-radius: 0 6px 6px 0;
    }
    footer {
      margin-top: 2.5rem;
      padding-top: 1rem;
      border-top: 1px solid #E5E7EB;
      color: #6B7280;
      font-size: 0.78rem;
      text-align: center;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .page { border: none; border-radius: 0; padding: 0.5cm 1cm; }
      h2 { page-break-after: avoid; }
      .doc-header { page-break-after: avoid; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="doc-header">
      <div class="doc-header-label">STEAM Planner · Acessibilidade</div>
      <h1>Atividade Adaptada</h1>
      ${filename ? `<div class="doc-meta">Origem: ${escapeHtml(filename)}</div>` : ""}
      <div class="doc-meta">Gerado em ${new Date().toLocaleDateString("pt-BR")}</div>
      <div class="doc-profiles">${adaptationLabels}</div>
    </div>

    ${bodyHTML}

    <footer>Gerado pelo STEAM Planner em ${new Date().toLocaleDateString("pt-BR")}</footer>
  </div>
</body>
</html>`;
}

export function openAdaptationReportWindow(result, filename, selectedAdaptations) {
  const html = buildAdaptationReportHTML(result, filename, selectedAdaptations);
  const newWindow = window.open("", "_blank");
  if (!newWindow) {
    alert("Não foi possível abrir o relatório. Verifique se o navegador está bloqueando pop-ups.");
    return;
  }
  newWindow.document.write(html);
  newWindow.document.close();
}
