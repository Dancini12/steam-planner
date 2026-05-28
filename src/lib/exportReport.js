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

function renderBulletText(text) {
  if (!text) return ''
  const lines = stripDecorativeMarkers(text).split(/\n+/).map(l => l.trim()).filter(Boolean)
  const isBulletList = lines.length > 1 && lines.every(l => /^[•\-\d]/.test(l))
  if (isBulletList) {
    const items = lines.map(l => `<li>${escapeHtml(l.replace(/^[•\-]\s*/, '').replace(/^\d+\.\s*/, ''))}</li>`).join('')
    return `<ul class="bullet-list">${items}</ul>`
  }
  return `<p>${formatCleanMultiline(text)}</p>`
}

function parseActivityManual(text) {
  if (!text) return { competencias: '', desenvolvimento: '' }
  const compMatch = text.match(/(?:resumo das competências|resumo):?\s*([\s\S]*?)(?=materiais utilizados:|materiais:|como montar|aplicação:|$)/i)
  const devMatch = text.match(/(?:como montar e conduzir|aplicação):?\s*([\s\S]*?)$/i)
  return {
    competencias: compMatch ? compMatch[1].trim() : '',
    desenvolvimento: devMatch ? devMatch[1].trim() : text.trim()
  }
}

const STEAM_AREA_NAMES = { S: 'Ciências', T: 'Tecnologia', E: 'Engenharia', A: 'Artes', M: 'Matemática' };

function stripDecorativeMarkers(text) {
  if (typeof text !== "string") return "";
  return text
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/[\uFE0F\u200D]/g, "")
    .replace(/[•●▪]/g, "-")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function cleanHtml(text) {
  return escapeHtml(stripDecorativeMarkers(text));
}

function formatCleanMultiline(text) {
  return cleanHtml(text).replace(/\n/g, "<br>");
}

function splitTextItems(text) {
  return stripDecorativeMarkers(text)
    .split(/\n+/)
    .map((line) => line.replace(/^[-\d.)\s]+/, "").trim())
    .filter(Boolean);
}

function renderBlankLines(count = 1) {
  return Array.from({ length: count }, () => '<div class="blank-line"></div>').join("");
}

function renderSimpleList(items, emptyLines = 1) {
  const html = (items || [])
    .map((item) => stripDecorativeMarkers(item))
    .filter(Boolean)
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
  return html ? `<ul>${html}</ul>` : renderBlankLines(emptyLines);
}

function renderParagraph(text) {
  const cleaned = stripDecorativeMarkers(text);
  return cleaned ? `<p>${formatCleanMultiline(cleaned)}</p>` : "";
}

function renderReferenceList(references) {
  const html = (references || [])
    .map((ref) => stripDecorativeMarkers(ref))
    .filter(Boolean)
    .map((ref) => `<p class="ref">${escapeHtml(ref)}</p>`)
    .join("");
  return html || renderBlankLines(2);
}

function renderBnccTable(bncc) {
  const rows = (bncc || [])
    .map((item) => stripDecorativeMarkers(item))
    .filter(Boolean)
    .map((item) => {
      const sep = item.indexOf(" — ");
      const code = sep > -1 ? item.slice(0, sep).trim() : item.trim();
      const desc = sep > -1 ? item.slice(sep + 3).trim() : "";
      return `<tr><td>${escapeHtml(code)}</td><td>${escapeHtml(desc)}</td></tr>`;
    })
    .join("");

  return rows
    ? `<table class="academic-table"><thead><tr><th>Código</th><th>Habilidade mobilizada</th></tr></thead><tbody>${rows}</tbody></table>`
    : "";
}

function buildSteamInterfaceText({ steamLetters, steamMatrix, steamMakerDescription }) {
  if (steamMakerDescription) return stripDecorativeMarkers(steamMakerDescription);
  if (!steamLetters.length) {
    return "A proposta articula investigação, criação, prototipagem, teste e melhoria de soluções, mantendo a aprendizagem ativa e o protagonismo estudantil como princípios metodológicos.";
  }

  const areaNames = steamLetters
    .map((letter) => STEAM_AREAS[letter]?.name || STEAM_AREA_NAMES[letter] || letter)
    .join(", ");

  return `A proposta estabelece interface entre ${areaNames}, articulando investigação, criação, prototipagem, teste e melhoria de soluções. A Cultura Maker aparece no processo de construção e revisão dos produtos, enquanto a abordagem STEAM organiza a resolução de problemas de forma interdisciplinar.`;
}

function renderSteamMatrixList(steamLetters, steamMatrix) {
  const items = steamLetters
    .map((letter) => {
      const matrix = (steamMatrix || {})[letter] || {};
      const areaName = STEAM_AREAS[letter]?.name || STEAM_AREA_NAMES[letter] || letter;
      const contribution = stripDecorativeMarkers(matrix.contribution || matrix.activity || "");
      return contribution ? `<li><strong>${escapeHtml(areaName)}:</strong> ${escapeHtml(contribution)}</li>` : "";
    })
    .filter(Boolean)
    .join("");

  return items ? `<ul>${items}</ul>` : "";
}

function normalizeStageTitle(stage, index) {
  const number = stage?.number || index + 1;
  const rawTitle = stripDecorativeMarkers(stage?.title || "");
  const title = rawTitle.replace(/^Etapa\s+\d+\s*[—-]\s*/i, "").trim();
  return `Etapa ${number}: ${title || "Desenvolvimento"}`;
}

function renderActivityStages(stages) {
  return (stages || [])
    .map((stage, index) => {
      const objective = stripDecorativeMarkers(stage.objective || "");
      const description = stripDecorativeMarkers(stage.description || "");
      const teacherScript = stripDecorativeMarkers(stage.teacherScript || "");
      const questions = Array.isArray(stage.questions)
        ? stage.questions.map(stripDecorativeMarkers).filter(Boolean)
        : [];

      return `<div class="step">
        <p><strong>${escapeHtml(normalizeStageTitle(stage, index))}</strong>${stage.duration ? ` <span class="muted">(${cleanHtml(stage.duration)})</span>` : ""}</p>
        ${objective ? `<p><strong>Objetivo:</strong> ${escapeHtml(objective)}</p>` : ""}
        ${description ? `<p>${formatCleanMultiline(description)}</p>` : ""}
        ${teacherScript ? `<p><strong>Condução do professor:</strong> ${escapeHtml(teacherScript)}</p>` : ""}
        ${questions.length ? `<p><strong>Perguntas orientadoras:</strong> ${escapeHtml(questions.join(" | "))}</p>` : ""}
      </div>`;
    })
    .join("");
}

function renderStudentMaterial(studentActivity, title) {
  const sa = studentActivity || {};
  const hasMaterial = sa.textBase || sa.situationProblem || sa.investigativeChallenge || sa.practicalActivity || (sa.questions || []).length;
  if (!hasMaterial) return "";

  const questionsHTML = (sa.questions || [])
    .map((question) => stripDecorativeMarkers(question))
    .filter(Boolean)
    .map((question) => `<li>${escapeHtml(question)}</li>`)
    .join("");

  return `<div class="subsection student-material">
    <h3>Material do aluno</h3>
    <div class="student-id">
      <span>Nome: <span class="line"></span></span>
      <span>Data: <span class="short-line"></span></span>
      <span>Turma: <span class="short-line"></span></span>
    </div>
    <p><strong>Atividade:</strong> ${cleanHtml(title || "Atividade pedagógica")}</p>
    ${sa.textBase ? `<p><strong>Texto-base:</strong><br>${formatCleanMultiline(sa.textBase)}</p>` : ""}
    ${sa.sourceInfo ? `<p class="source">${cleanHtml(sa.sourceInfo)}</p>` : ""}
    ${sa.situationProblem ? `<p><strong>Situação-problema:</strong> ${formatCleanMultiline(sa.situationProblem)}</p>` : ""}
    ${sa.investigativeChallenge ? `<p><strong>Desafio maker:</strong> ${formatCleanMultiline(sa.investigativeChallenge)}</p>` : ""}
    ${questionsHTML ? `<p><strong>Questões para análise:</strong></p><ol>${questionsHTML}</ol>` : ""}
    ${sa.practicalActivity ? `<p><strong>Atividade prática:</strong><br>${formatCleanMultiline(sa.practicalActivity)}</p>` : ""}
  </div>`;
}

function buildActivityPrintHTML(activity) {
  const { title, theme, duration, problem, guidingQuestion, objectives, bncc, materials, activityManual, steamMatrix, steamMakerDescription, bibliography, grade, discipline, stages, beforeClass, afterClass, teacherTips, modality, studentActivity } = activity;

  const steamLetters = Object.keys(steamMatrix || {}).filter((k) => ["S", "T", "E", "A", "M"].includes(k));
  const { competencias, desenvolvimento } = parseActivityManual(activityManual);
  const areaText = [discipline, grade].filter(Boolean).join(" - ");
  const themeText = [title, theme].filter(Boolean).join(" - ");
  const objectiveItems = (objectives || []).map(stripDecorativeMarkers).filter(Boolean);
  const generalObjective = objectiveItems[0] || "Promover uma experiência de aprendizagem ativa, investigativa e interdisciplinar, articulando STEAM, Cultura Maker e resolução de problemas.";
  const specificObjectives = objectiveItems.slice(1);
  const steamInterfaceText = buildSteamInterfaceText({ steamLetters, steamMatrix, steamMakerDescription });
  const steamMatrixHTML = renderSteamMatrixList(steamLetters, steamMatrix);
  const bnccHTML = renderBnccTable(bncc);
  const stagesHTML = renderActivityStages(stages);
  const studentMaterialHTML = renderStudentMaterial(studentActivity, title);
  const beforeClassItems = splitTextItems(beforeClass);
  const afterClassItems = splitTextItems(afterClass);
  const teacherTipsItems = splitTextItems(teacherTips);
  const activityManualHTML = stagesHTML ? "" : renderParagraph(desenvolvimento || competencias || activityManual);

  const modalityText = modality === 'individual'
    ? 'A atividade será desenvolvida individualmente, com registro pessoal das hipóteses, decisões, testes e conclusões.'
    : 'A atividade será desenvolvida em grupos, com divisão de papéis, colaboração e socialização das soluções construídas.';

  const metodologiaText = steamLetters.length > 0
    ? `A metodologia combina aprendizagem ativa, Cultura Maker e integração STEAM nas áreas de ${steamLetters.map(l => STEAM_AREAS[l]?.name || STEAM_AREA_NAMES[l] || l).join(', ')}. Os estudantes investigam o problema, constroem uma solução, testam possibilidades, registram evidências e revisam o produto a partir dos resultados obtidos.`
    : 'A metodologia combina aprendizagem ativa, Cultura Maker e resolução de problemas. Os estudantes investigam, constroem, testam, registram evidências e revisam suas soluções.';

  const assessmentItems = [
    "Participação e colaboração durante a investigação e a construção.",
    "Clareza dos registros, hipóteses, testes e justificativas apresentados.",
    "Capacidade de revisar o protótipo ou produto a partir das evidências coletadas.",
    "Socialização das descobertas e argumentação sobre as escolhas realizadas."
  ];

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Plano de Aula - ${cleanHtml(title || 'Atividade Pedagógica')}</title>
  <style>
    @page { size: A4; margin: 2.5cm 2cm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11pt;
      line-height: 1.58;
      color: #000;
      background: #fff;
      padding: 2.5cm 2cm;
      max-width: 21cm;
      margin: 0 auto;
    }
    .header { text-align: center; margin-bottom: 0.75cm; }
    .header h1 { font-size: 16pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0; }
    .ident { width: 100%; border-collapse: collapse; margin-bottom: 0.75cm; font-size: 10.5pt; }
    .ident td { border: 1px solid #cfcfcf; padding: 0.18cm 0.28cm; vertical-align: top; }
    .ident .label { width: 22%; font-weight: 700; background: #f6f6f6; }
    .blank-field { display: block; min-height: 0.45cm; border-bottom: 1px solid #999; }
    .section { margin-top: 0.55cm; page-break-inside: avoid; }
    .section-title {
      font-size: 11pt;
      font-weight: 700;
      text-transform: uppercase;
      border-bottom: 1px solid #000;
      padding-bottom: 0.12cm;
      margin-bottom: 0.3cm;
    }
    h3 { font-size: 10.5pt; font-weight: 700; margin: 0.28cm 0 0.16cm; }
    p { text-align: justify; margin-bottom: 0.22cm; }
    ul, ol { padding-left: 1cm; margin-bottom: 0.24cm; }
    li { margin-bottom: 0.1cm; text-align: justify; }
    .subsection { margin-top: 0.3cm; }
    .muted, .source { color: #555; font-size: 9.5pt; font-style: italic; }
    .step { border-left: 2px solid #555; padding-left: 0.35cm; margin-bottom: 0.3cm; page-break-inside: avoid; }
    .academic-table { width: 100%; border-collapse: collapse; margin-top: 0.2cm; font-size: 9.5pt; }
    .academic-table th, .academic-table td { border: 1px solid #d3d3d3; padding: 0.14cm 0.22cm; vertical-align: top; text-align: left; }
    .academic-table th { background: #f6f6f6; font-weight: 700; }
    .blank-line { border-bottom: 1px solid #bbb; height: 0.58cm; margin-bottom: 0.16cm; }
    .ref { padding-left: 1.25cm; text-indent: -1.25cm; font-size: 10pt; line-height: 1.45; }
    .student-material { border-top: 1px solid #d3d3d3; padding-top: 0.25cm; }
    .student-id { display: flex; flex-wrap: wrap; gap: 0.5cm; margin-bottom: 0.25cm; font-size: 10pt; }
    .line, .short-line { display: inline-block; border-bottom: 1px solid #000; vertical-align: bottom; }
    .line { width: 7cm; }
    .short-line { width: 2.6cm; }
    @media print { body { padding: 0; } .section { page-break-inside: avoid; } .section-title { page-break-after: avoid; } }
  </style>
</head>
<body>

  <div class="header">
    <h1>PLANO DE AULA</h1>
  </div>

  <table class="ident">
    <tr><td class="label">Instituição</td><td><span class="blank-field">&nbsp;</span></td></tr>
    <tr><td class="label">Área</td><td>${areaText ? cleanHtml(areaText) : '<span class="blank-field">&nbsp;</span>'}</td></tr>
    <tr><td class="label">Professor</td><td><span class="blank-field">&nbsp;</span></td></tr>
    <tr><td class="label">Tema</td><td>${themeText ? cleanHtml(themeText) : '<span class="blank-field">&nbsp;</span>'}</td></tr>
    <tr><td class="label">Horário</td><td><span class="blank-field">&nbsp;</span></td></tr>
    <tr><td class="label">Data</td><td><span class="blank-field">&nbsp;</span></td></tr>
    <tr><td class="label">Local</td><td><span class="blank-field">&nbsp;</span></td></tr>
  </table>

  <div class="section">
    <div class="section-title">1. OBJETIVOS</div>
    <p><strong>Objetivo geral:</strong> ${escapeHtml(generalObjective)}</p>
    <p><strong>Objetivos específicos:</strong></p>
    ${renderSimpleList(specificObjectives, 2)}
  </div>

  <div class="section">
    <div class="section-title">2. METODOLOGIA</div>
    <p>${metodologiaText}</p>
    <p>${modalityText}${duration ? ` Tempo previsto: ${cleanHtml(duration)}.` : ""}</p>
    ${beforeClassItems.length ? `<p><strong>Preparação prévia:</strong></p>${renderSimpleList(beforeClassItems)}` : ""}
  </div>

  <div class="section">
    <div class="section-title">3. INTERFACE</div>
    ${problem ? `<p><strong>Problema:</strong> ${formatCleanMultiline(problem)}</p>` : ""}
    ${guidingQuestion ? `<p><strong>Questão norteadora:</strong> ${formatCleanMultiline(guidingQuestion)}</p>` : ""}
    <p>${escapeHtml(steamInterfaceText)}</p>
    ${steamMatrixHTML}
    ${bnccHTML ? `<div class="subsection"><h3>Habilidades relacionadas</h3>${bnccHTML}</div>` : ""}
  </div>

  <div class="section">
    <div class="section-title">4. ATIVIDADES PROPOSTAS</div>
    <div class="subsection">
      <h3>Desenvolvimento da aula</h3>
      ${stagesHTML || activityManualHTML || renderBlankLines(2)}
    </div>
    ${teacherTipsItems.length ? `<div class="subsection"><h3>Condução do professor</h3>${renderSimpleList(teacherTipsItems)}</div>` : ""}
    ${!studentMaterialHTML && studentActivity?.practicalActivity ? `<div class="subsection"><h3>Atividade prática</h3>${renderParagraph(studentActivity.practicalActivity)}</div>` : ""}
    ${!studentMaterialHTML && studentActivity?.investigativeChallenge ? `<div class="subsection"><h3>Desafio maker</h3>${renderParagraph(studentActivity.investigativeChallenge)}</div>` : ""}
    ${studentMaterialHTML}
  </div>

  <div class="section">
    <div class="section-title">5. AVALIAÇÃO</div>
    <p>A avaliação será processual e formativa, considerando o percurso de investigação, a participação dos estudantes e a qualidade das decisões tomadas durante a construção e a revisão da solução.</p>
    ${renderSimpleList(assessmentItems)}
    ${afterClassItems.length ? `<p><strong>Encaminhamentos após a aula:</strong></p>${renderSimpleList(afterClassItems)}` : ""}
  </div>

  <div class="section">
    <div class="section-title">6. RECURSOS DIDÁTICOS</div>
    ${renderSimpleList(materials, 2)}
  </div>

  <div class="section">
    <div class="section-title">7. REFERÊNCIAS</div>
    ${renderReferenceList(bibliography)}
  </div>

  <script>window.addEventListener('load', function() { setTimeout(function() { window.print(); }, 400); });</script>
</body>
</html>`;
}

export function openActivityPrintWindow(activity) {
  const html = buildActivityPrintHTML(activity);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const newWindow = window.open(url, '_blank');
  if (!newWindow) {
    alert("Não foi possível abrir o PDF. Verifique se o navegador está bloqueando pop-ups e tente novamente.");
    URL.revokeObjectURL(url);
    return;
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
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

function buildDefaultSteamMakerDescription(project) {
  const productText = project?.finalProduct
    ? `, chegando à produção de ${project.finalProduct.toLowerCase()}`
    : "";

  return `Nesta proposta, a abordagem STEAM aparece de forma integrada na investigação do problema, na organização das informações, na criação de representações e na construção coletiva de uma solução${productText}. A cultura maker orienta o trabalho prático: os estudantes planejam, produzem, testam, ajustam e apresentam suas ideias usando materiais acessíveis, colaboração e reflexão sobre o processo.`;
}

// Constrói o HTML completo do relatório.
function buildReportHTML(project) {
  const generatedDate = project.generatedAt ? formatDate(project.generatedAt) : "";
  const steamMakerDescription =
    project.steamMakerDescription || buildDefaultSteamMakerDescription(project);

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
    ${escapeHtml(project.theme || "")} · ${escapeHtml(project.grade || "")} · ${escapeHtml(project.duration || "")}${generatedDate ? ` · Gerado em ${escapeHtml(generatedDate)}` : ""}
  </div>

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

  <h2>STEAM e Cultura Maker</h2>
  <p>${formatMultiline(steamMakerDescription)}</p>

  <h2>Objetivos pedagógicos</h2>
  <ul>${objectivesList || "<li>(não preenchido)</li>"}</ul>

  <h2>Habilidades BNCC</h2>
  <p style="font-family:monospace;">${bnccList || "(não preenchido)"}</p>

  <h2>Materiais</h2>
  <ul>${materialsList || "<li>(não preenchido)</li>"}</ul>

  ${activityManualHTML ? `<h2>Instruções de aplicação</h2>${activityManualHTML}` : ""}

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
  const steamLabels = {
    S: 'S (Ciências)',
    T: 'T (Tecnologia)',
    E: 'E (Engenharia)',
    A: 'A (Artes)',
    M: 'M (Matemática)'
  }
  const steamNamesPattern = /^(S\s*)?(\(?(Ciências|Ciência|Tecnologia|Engenharia|Artes|Arte|Matemática)\)?):?\s*/i

  const activityTitle = activity.activityTitle || projectTitle || 'Atividade Pedagógica'
  const targetAudience = stripDecorativeMarkers(activity.targetAudience || '')
  const objective = stripDecorativeMarkers(activity.objective || 'Promover uma atividade prática com investigação, construção, teste e socialização de soluções.')
  const areaText = targetAudience || ''
  const themeText = projectTitle && projectTitle !== activityTitle
    ? `${activityTitle} - ${projectTitle}`
    : activityTitle
  const specificObjectives = [
    "Investigar o problema proposto a partir de evidências e conhecimentos prévios.",
    "Planejar e construir uma solução prática com materiais acessíveis.",
    "Testar, revisar e justificar as escolhas realizadas durante a atividade.",
    "Socializar resultados de forma clara e colaborativa."
  ]

  const stepsHTML = (activity.steps || []).map((step, i) => {
    const time = stripDecorativeMarkers(step.time || '')
    const actor = stripDecorativeMarkers(step.actor || '')
    const title = stripDecorativeMarkers(step.title || `Etapa ${i + 1}`)
    const description = stripDecorativeMarkers(step.description || '')
    return `<div class="step">
      <p><strong>Etapa ${i + 1}: ${escapeHtml(title)}</strong>${time ? ` <span class="muted">(${escapeHtml(time)})</span>` : ''}</p>
      ${actor ? `<p><strong>Condução:</strong> ${escapeHtml(actor)}</p>` : ''}
      ${description ? `<p>${formatCleanMultiline(description)}</p>` : ''}
    </div>`
  }).join('')

  const steamIntegration = activity.steamIntegration || {}
  const steamIntegrationHTML = Array.isArray(steamIntegration)
    ? steamIntegration.map(stripDecorativeMarkers).filter(Boolean).map((item) => `<li>${escapeHtml(item)}</li>`).join('')
    : Object.entries(steamLabels)
        .map(([key, label]) => {
          const value = steamIntegration[key]
          const cleaned = String(value || '')
            .replace(new RegExp(`^${key}\\s*\\([^)]*\\):?\\s*`, 'i'), '')
            .replace(steamNamesPattern, '')
          return value ? `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(stripDecorativeMarkers(cleaned))}</li>` : ''
        })
        .join('')

  const questionsHTML = (activity.discussionQuestions || [])
    .map(stripDecorativeMarkers)
    .filter(Boolean)
    .map((q) => `<li>${escapeHtml(q)}</li>`)
    .join('')

  const tipsItems = splitTextItems(activity.tips)
  const bnccHTML = renderBnccTable(activity.bncc || [])
  const assessment = stripDecorativeMarkers(activity.assessment || 'Observe participação, colaboração, qualidade dos registros, capacidade de testar e melhorar a solução, além da clareza na socialização final.')

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Plano de Aula - ${cleanHtml(activityTitle)}</title>
  <style>
    @page { size: A4; margin: 2.5cm 2cm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.58; color: #000; background: #fff; padding: 2.5cm 2cm; max-width: 21cm; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 0.75cm; }
    .header h1 { font-size: 16pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0; }
    .ident { width: 100%; border-collapse: collapse; margin-bottom: 0.75cm; font-size: 10.5pt; }
    .ident td { border: 1px solid #cfcfcf; padding: 0.18cm 0.28cm; vertical-align: top; }
    .ident .label { width: 22%; font-weight: 700; background: #f6f6f6; }
    .blank-field { display: block; min-height: 0.45cm; border-bottom: 1px solid #999; }
    .section { margin-top: 0.55cm; page-break-inside: avoid; }
    .section-title { font-size: 11pt; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 0.12cm; margin-bottom: 0.3cm; }
    h3 { font-size: 10.5pt; font-weight: 700; margin: 0.28cm 0 0.16cm; }
    p { text-align: justify; margin-bottom: 0.22cm; }
    ul, ol { padding-left: 1cm; margin-bottom: 0.24cm; }
    li { margin-bottom: 0.1cm; text-align: justify; }
    .subsection { margin-top: 0.3cm; }
    .muted { color: #555; font-size: 9.5pt; font-style: italic; }
    .step { border-left: 2px solid #555; padding-left: 0.35cm; margin-bottom: 0.3cm; page-break-inside: avoid; }
    .academic-table { width: 100%; border-collapse: collapse; margin-top: 0.2cm; font-size: 9.5pt; }
    .academic-table th, .academic-table td { border: 1px solid #d3d3d3; padding: 0.14cm 0.22cm; vertical-align: top; text-align: left; }
    .academic-table th { background: #f6f6f6; font-weight: 700; }
    .blank-line { border-bottom: 1px solid #bbb; height: 0.58cm; margin-bottom: 0.16cm; }
    .ref { padding-left: 1.25cm; text-indent: -1.25cm; font-size: 10pt; line-height: 1.45; }
    @media print { body { padding: 0; } .section { page-break-inside: avoid; } .section-title { page-break-after: avoid; } }
  </style>
</head>
<body>
  <div class="header"><h1>PLANO DE AULA</h1></div>

  <table class="ident">
    <tr><td class="label">Instituição</td><td><span class="blank-field">&nbsp;</span></td></tr>
    <tr><td class="label">Área</td><td>${areaText ? cleanHtml(areaText) : '<span class="blank-field">&nbsp;</span>'}</td></tr>
    <tr><td class="label">Professor</td><td><span class="blank-field">&nbsp;</span></td></tr>
    <tr><td class="label">Tema</td><td>${cleanHtml(themeText)}</td></tr>
    <tr><td class="label">Horário</td><td><span class="blank-field">&nbsp;</span></td></tr>
    <tr><td class="label">Data</td><td><span class="blank-field">&nbsp;</span></td></tr>
    <tr><td class="label">Local</td><td><span class="blank-field">&nbsp;</span></td></tr>
  </table>

  <div class="section">
    <div class="section-title">1. OBJETIVOS</div>
    <p><strong>Objetivo geral:</strong> ${escapeHtml(objective)}</p>
    <p><strong>Objetivos específicos:</strong></p>
    ${renderSimpleList(specificObjectives)}
  </div>

  <div class="section">
    <div class="section-title">2. METODOLOGIA</div>
    <p>A atividade será conduzida por aprendizagem ativa, investigação orientada e Cultura Maker. Os estudantes analisam o problema, constroem ou simulam uma solução, testam o resultado, registram evidências e socializam as conclusões.</p>
    ${activity.duration ? `<p><strong>Tempo previsto:</strong> ${cleanHtml(activity.duration)}</p>` : ""}
  </div>

  <div class="section">
    <div class="section-title">3. INTERFACE</div>
    <p>A proposta articula conceitos da área de estudo com práticas STEAM, resolução de problemas, criatividade e protagonismo estudantil.</p>
    ${steamIntegrationHTML ? `<ul>${steamIntegrationHTML}</ul>` : ""}
    ${bnccHTML ? `<div class="subsection"><h3>Habilidades relacionadas</h3>${bnccHTML}</div>` : ""}
  </div>

  <div class="section">
    <div class="section-title">4. ATIVIDADES PROPOSTAS</div>
    <div class="subsection">
      <h3>Desenvolvimento da aula</h3>
      ${stepsHTML || renderBlankLines(2)}
    </div>
    <div class="subsection">
      <h3>Atividade prática e desafio maker</h3>
      <p>Os estudantes deverão produzir uma resposta prática ao problema proposto, testando alternativas, justificando escolhas e apresentando melhorias possíveis.</p>
    </div>
    ${questionsHTML ? `<div class="subsection"><h3>Questões para discussão</h3><ol>${questionsHTML}</ol></div>` : ""}
    ${tipsItems.length ? `<div class="subsection"><h3>Condução do professor</h3>${renderSimpleList(tipsItems)}</div>` : ""}
  </div>

  <div class="section">
    <div class="section-title">5. AVALIAÇÃO</div>
    <p>${escapeHtml(assessment)}</p>
  </div>

  <div class="section">
    <div class="section-title">6. RECURSOS DIDÁTICOS</div>
    ${renderSimpleList(activity.materials, 2)}
  </div>

  <div class="section">
    <div class="section-title">7. REFERÊNCIAS</div>
    ${renderReferenceList(activity.bibliography)}
  </div>
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
