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
      <td style="font-weight:700;color:${area?.color || '#333'}">${letter} · ${escapeHtml(area?.name || letter)}</td>
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
    body { font-family: Georgia, serif; max-width: 800px; margin: 2rem auto; padding: 1rem 1.5rem; color: #222; line-height: 1.6; }
    h1 { color: #6B2FE0; border-bottom: 3px solid #6B2FE0; padding-bottom: 0.5rem; margin-bottom: 0.25rem; font-size: 1.6rem; }
    h2 { font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.07em; color: #555; margin: 2rem 0 0.75rem; border-bottom: 1px solid #ddd; padding-bottom: 0.3rem; }
    h3 { margin: 0 0 0.4rem; font-size: 1rem; }
    .meta { color: #777; font-size: 0.9rem; margin-bottom: 1.5rem; }
    .question { background: #f4f0ff; border-left: 4px solid #6B2FE0; padding: 0.75rem 1rem; margin: 0.75rem 0; font-style: italic; }
    .problem { background: #fff8f0; border-left: 4px solid #d97706; padding: 0.75rem 1rem; margin: 0.75rem 0; }
    table { width: 100%; border-collapse: collapse; margin: 0.75rem 0; font-size: 0.9rem; }
    th, td { border: 1px solid #ddd; padding: 0.5rem 0.75rem; vertical-align: top; }
    th { background: #f4f0ff; text-align: left; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; }
    ul { padding-left: 1.5rem; margin: 0.5rem 0; }
    li { margin-bottom: 0.3rem; }
    footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #ddd; color: #888; font-size: 0.8rem; text-align: center; }
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
import { RUBRIC_LEVELS, STEAM_RUBRIC_CRITERIA } from "../data/rubric.js";
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
        ? `<span style="background:${area.color};color:#0F0F2D;padding:0.2rem 0.5rem;border-radius:4px;font-size:0.85rem;font-weight:600;margin-right:0.4rem;">${letter} · ${area.name}</span>`
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

  const rubricHTML = STEAM_RUBRIC_CRITERIA.map((criterion) => {
    const rubric = project.steamRubric?.[criterion.id] || {};
    const level = RUBRIC_LEVELS.find((item) => item.id === rubric.level);
    return `
      <tr>
        <td><strong>${escapeHtml(criterion.label)}</strong><br><span style="color:#666;">${escapeHtml(criterion.description)}</span></td>
        <td>${escapeHtml(level?.label || "—")}</td>
        <td>${escapeHtml(rubric.notes || "—")}</td>
      </tr>
    `;
  }).join("");

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
          `<div style="border-left:2px solid #ddd;padding:0.5rem 1rem;margin:0.5rem 0;">
            <div style="font-size:0.8rem;color:#888;">${formatDate(e.date)}</div>
            <div>${escapeHtml(e.text)}</div>
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
              `<div style="border-left:2px solid #bbb;padding:0.4rem 0.8rem;margin:0.4rem 0;">
                <div style="font-size:0.8rem;color:#888;">${formatDate(entry.date)}</div>
                <div>${escapeHtml(entry.text)}</div>
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
        <h2 style="color:${phase.color};border-bottom:2px solid ${phase.color};padding-bottom:0.4rem;">
          Fase ${phase.number}: ${phase.name}
        </h2>
        <p style="font-style:italic;color:#666;">${phase.subtitle}</p>

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
          ${
            level
              ? `<span style="background:${level.color};color:white;padding:0.15rem 0.5rem;border-radius:3px;">${level.label}</span>`
              : "—"
          }
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
    body { font-family: Georgia, serif; max-width: 800px; margin: 2rem auto; padding: 1rem; color: #222; line-height: 1.6; }
    h1 { color: #6B2FE0; border-bottom: 3px solid #6B2FE0; padding-bottom: 0.5rem; }
    h2 { margin-top: 2rem; }
    h3 { margin-top: 1.2rem; color: #444; }
    .question { background: #f4f0ff; border-left: 4px solid #6B2FE0; padding: 1rem; font-size: 1.1rem; margin: 1rem 0; font-style: italic; }
    .meta { color: #666; font-size: 0.9rem; margin-bottom: 1rem; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.92rem; }
    th, td { border: 1px solid #ddd; padding: 0.55rem; vertical-align: top; }
    th { background: #f4f0ff; text-align: left; }
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

  <h2>Rubrica STEAM</h2>
  <table>
    <thead>
      <tr>
        <th>Critério</th>
        <th>Nível</th>
        <th>Observações/evidências</th>
      </tr>
    </thead>
    <tbody>${rubricHTML}</tbody>
  </table>

  <h2>Habilidades BNCC</h2>
  <p style="font-family:monospace;">${bnccList || "(não preenchido)"}</p>

  <h2>Materiais</h2>
  <ul>${materialsList || "<li>(não preenchido)</li>"}</ul>

  ${activityManualHTML ? `<h2>Resumo, Materiais e Montagem</h2>${activityManualHTML}` : ""}

  <h2>Turma e alunos</h2>
  <ul>${studentsList || "<li>(nenhum aluno cadastrado)</li>"}</ul>

  <hr style="margin:2rem 0;">

  ${phasesHTML}

  <footer style="margin-top:3rem;padding-top:1rem;border-top:1px solid #ddd;color:#888;font-size:0.85rem;text-align:center;">
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
    const actorColor = step.actor === 'Professor' ? '#6B2FE0' : '#0891b2'
    return `
      <div style="display:flex;gap:1rem;margin-bottom:1.25rem;align-items:flex-start;">
        <div style="min-width:90px;text-align:right;">
          <div style="font-size:0.75rem;font-weight:700;color:#888;text-transform:uppercase;">${escapeHtml(step.time || '')}</div>
          <div style="font-size:0.7rem;background:${actorColor};color:#fff;padding:0.15rem 0.4rem;border-radius:3px;margin-top:0.2rem;display:inline-block;">${escapeHtml(step.actor || '')}</div>
        </div>
        <div style="flex:1;border-left:3px solid ${actorColor};padding-left:1rem;">
          <div style="font-weight:700;color:#222;margin-bottom:0.3rem;">${i + 1}. ${escapeHtml(step.title || '')}</div>
          <div style="color:#444;line-height:1.6;">${escapeHtml(step.description || '')}</div>
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
    body { font-family: Georgia, serif; max-width: 800px; margin: 2rem auto; padding: 1rem 1.5rem; color: #222; line-height: 1.6; }
    h1 { color: #6B2FE0; border-bottom: 3px solid #6B2FE0; padding-bottom: 0.5rem; margin-bottom: 0.25rem; }
    h2 { font-size: 1rem; text-transform: uppercase; letter-spacing: 0.06em; color: #555; margin: 2rem 0 0.75rem; border-bottom: 1px solid #ddd; padding-bottom: 0.3rem; }
    .meta { color: #666; font-size: 0.9rem; margin-bottom: 1.5rem; }
    .objective-box { background: #f4f0ff; border-left: 4px solid #6B2FE0; padding: 1rem 1.25rem; margin: 1rem 0 1.5rem; font-size: 1rem; }
    .tips-box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 1rem 1.25rem; margin: 1rem 0; font-size: 0.95rem; }
    .assessment-box { background: #fff7ed; border-left: 4px solid #d97706; padding: 1rem 1.25rem; margin: 1rem 0; font-size: 0.95rem; }
    ul { padding-left: 1.5rem; }
    li { margin-bottom: 0.3rem; }
    .project-ref { font-size: 0.82rem; color: #888; font-style: italic; margin-bottom: 0.5rem; }
    footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #ddd; color: #888; font-size: 0.82rem; text-align: center; }
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
