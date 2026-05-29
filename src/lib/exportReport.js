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
import { normalizeBnccCodes } from "./bnccSelector.js";
import { normalizeLearningExperience } from "./learningExperience.js";

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
    .replace(/\.{3,}|…/g, ".")
    .replace(/[Pp]ós-its?/g, "notas adesivas")
    .replace(/[Pp]ost-[Ii]ts?/g, "notas adesivas")
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

function renderBnccCodes(bncc) {
  const codes = normalizeBnccCodes(bncc || []);
  return codes.length ? `<p><strong>Habilidades BNCC:</strong> ${escapeHtml(codes.join(", "))}</p>` : "";
}

function normalizeTextItems(value) {
  if (Array.isArray(value)) {
    return value.map((item) => stripDecorativeMarkers(item)).filter(Boolean);
  }
  return splitTextItems(value);
}

function normalizeVocabulary(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") {
        const [term, ...definitionParts] = stripDecorativeMarkers(item).split(":");
        return {
          term: (term || "").trim(),
          definition: definitionParts.join(":").trim()
        };
      }

      return {
        term: stripDecorativeMarkers(item?.term || item?.word || ""),
        definition: stripDecorativeMarkers(item?.definition || item?.meaning || "")
      };
    })
    .filter((item) => item.term || item.definition);
}

function getActivitySummary(activity) {
  if (activity.summary) return stripDecorativeMarkers(activity.summary);
  const title = stripDecorativeMarkers(activity.title || "atividade prática");
  const problem = stripDecorativeMarkers(activity.problem || "");
  const guidingQuestion = stripDecorativeMarkers(activity.guidingQuestion || "");

  if (problem || guidingQuestion) {
    return `${problem || guidingQuestion} A proposta organiza uma investigação prática em que os estudantes planejam, constroem, testam e aprimoram uma solução, registrando evidências do processo e socializando as conclusões.`;
  }

  return `Nesta atividade prática, os estudantes investigam o tema ${title.toLowerCase()}, constroem uma solução com materiais acessíveis, testam o resultado e propõem melhorias a partir das evidências observadas.`;
}

function renderOverviewTable({ grade, duration, modality, discipline, steamLetters, bncc }) {
  const steamNames = steamLetters
    .map((letter) => STEAM_AREAS[letter]?.name || STEAM_AREA_NAMES[letter] || letter)
    .join(", ");
  const rows = [
    ["Nível de escolaridade", grade || "A definir"],
    ["Tempo necessário", duration || "A definir"],
    ["Tamanho do grupo", modality === "individual" ? "Individual" : "2 a 4 estudantes"],
    ["Área / disciplina", [discipline, steamNames].filter(Boolean).join(" + ") || "STEAM e Cultura Maker"],
    ["Códigos BNCC", normalizeBnccCodes(bncc || []).join(", ") || "A definir"]
  ];

  return `<table class="overview-table"><tbody>${rows
    .map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`)
    .join("")}</tbody></table>`;
}

function renderVocabulary(value) {
  const vocabulary = normalizeVocabulary(value);
  if (!vocabulary.length) return "";

  return `<dl class="vocabulary-list">${vocabulary
    .map((item) => `<div><dt>${cleanHtml(item.term)}</dt><dd>${cleanHtml(item.definition)}</dd></div>`)
    .join("")}</dl>`;
}

function renderScaling(value) {
  if (!value) return "";
  if (typeof value === "string" || Array.isArray(value)) {
    return renderSimpleList(normalizeTextItems(value));
  }

  const items = [
    value.support ? `<li><strong>Para apoiar:</strong> ${cleanHtml(value.support)}</li>` : "",
    value.challenge ? `<li><strong>Para ampliar:</strong> ${cleanHtml(value.challenge)}</li>` : "",
    value.lowerGrades ? `<li><strong>Adaptação inicial:</strong> ${cleanHtml(value.lowerGrades)}</li>` : "",
    value.higherGrades ? `<li><strong>Adaptação avançada:</strong> ${cleanHtml(value.higherGrades)}</li>` : ""
  ].filter(Boolean);

  return items.length ? `<ul>${items.join("")}</ul>` : "";
}

function getDiagramClass(step) {
  const type = stripDecorativeMarkers(step?.diagramType || "").toLowerCase();
  const title = stripDecorativeMarkers(step?.title || "").toLowerCase();
  const text = `${type} ${title}`;
  if (/circuit|energia|eletric|sensor|led/.test(text)) return "circuit";
  if (/medid|dados|régua|regua|escala|calibr/.test(text)) return "measure";
  if (/teste|lançamento|lancamento|voo|simula|experimento/.test(text)) return "test";
  return "prototype";
}

function renderAssemblyGuide(assemblyGuide) {
  const steps = Array.isArray(assemblyGuide)
    ? assemblyGuide
    : normalizeTextItems(assemblyGuide).map((instruction, index) => ({
        title: `Etapa ${index + 1}`,
        instruction
      }));

  const normalized = steps
    .map((step, index) => {
      if (typeof step === "string") {
        return { title: `Etapa ${index + 1}`, instruction: step };
      }
      return step || {};
    })
    .filter((step) => step.title || step.instruction || step.caption);

  if (!normalized.length) return "";

  return `<div class="assembly-grid">${normalized.slice(0, 4).map((step, index) => {
    const labels = normalizeTextItems(step.labels || []).slice(0, 3);
    const title = stripDecorativeMarkers(step.title || `Etapa ${index + 1}`);
    const instruction = stripDecorativeMarkers(step.instruction || step.description || "");
    const caption = stripDecorativeMarkers(step.caption || `Figura ${index + 1}. ${title}.`);
    const diagramClass = getDiagramClass(step);

    return `<figure class="assembly-figure">
      <div class="diagram ${diagramClass}">
        <span class="diagram-number">${index + 1}</span>
        <span class="shape main"></span>
        <span class="shape side-a"></span>
        <span class="shape side-b"></span>
        <span class="shape base"></span>
        <span class="connector connector-a"></span>
        <span class="connector connector-b"></span>
      </div>
      <figcaption><strong>${cleanHtml(caption)}</strong></figcaption>
      ${instruction ? `<p>${formatCleanMultiline(instruction)}</p>` : ""}
      ${labels.length ? `<p class="figure-labels">${labels.map(cleanHtml).join(" | ")}</p>` : ""}
    </figure>`;
  }).join("")}</div>`;
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

function renderExperienceStages(stages) {
  return (stages || [])
    .map((stage, index) => {
      const title = stripDecorativeMarkers(stage?.title || `ETAPA ${index + 1}`);
      const description = stripDecorativeMarkers(stage?.description || "");
      return `<div class="stage">
        <h3>${escapeHtml(title)}</h3>
        <p>${formatCleanMultiline(description)}</p>
      </div>`;
    })
    .join("");
}

function renderMaterialsForExperience(experience) {
  const materials = normalizeTextItems(experience.materials || []);
  const materialFunctions = normalizeTextItems(experience.materialFunctions || []);
  const readyMaterials = normalizeTextItems(experience.readyMaterials || []);

  // materialFunctions already contain the material name ("Cartolina: função prática.")
  // Render them directly; fall back to plain materials list if unavailable
  const lines = materialFunctions.length > 0 ? materialFunctions : materials;

  // Exclude the "TABELA DE TESTE" line — it is rendered as an HTML table in section 5
  const displayedReadyMaterials = readyMaterials.filter((item) => !/^tabela de teste/i.test(item));

  return `
    ${renderSimpleList(lines)}
    ${displayedReadyMaterials.length ? `<div class="ready-materials"><strong>Materiais prontos:</strong>${renderSimpleList(displayedReadyMaterials)}</div>` : ""}
  `;
}

function renderSteamConnection(steamConnection) {
  if (!steamConnection) return "";
  const entries = [
    ["Ciência", steamConnection.science],
    ["Tecnologia", steamConnection.technology],
    ["Engenharia", steamConnection.engineering],
    ["Arte", steamConnection.art],
    ["Matemática", steamConnection.mathematics]
  ];
  const items = entries
    .filter(([, v]) => v)
    .map(([label, value]) => `<li><strong>${label}:</strong> ${cleanHtml(value)}</li>`)
    .join("");
  return items ? `<ul class="steam-connection">${items}</ul>` : "";
}

function renderTeacherOrientation(text) {
  if (!text) return "";
  return `<p class="teacher-note"><strong>Orientação ao professor:</strong> ${formatCleanMultiline(text)}</p>`;
}

function renderTestTable(readyMaterials) {
  const items = normalizeTextItems(readyMaterials || []);
  const scenarioCount = items.filter((item) => /^CEN[AÁ]RIO/i.test(item)).length;
  if (!scenarioCount) return "";

  // Extract column headers from the TABELA DE TESTE item, if present
  const tableItem = items.find((item) => /tabela de teste/i.test(item));
  let columns = ["Cenário", "Resultado observado", "Falha identificada", "Melhoria aplicada", "Resultado após melhoria"];
  if (tableItem) {
    const afterDash = tableItem.replace(/tabela de teste\s*[-—:]\s*/i, "").replace(/\.$/, "");
    const parsed = afterDash.split("|").map((c) => c.trim()).filter(Boolean);
    if (parsed.length >= 3) columns = ["Cenário", ...parsed.slice(1)];
  }

  const headers = columns.map((col) => `<th>${escapeHtml(col)}</th>`).join("");
  const rows = Array.from({ length: scenarioCount }, (_, i) => {
    const cells = columns.slice(1).map(() => `<td class="blank-cell"></td>`).join("");
    return `<tr><td>Cenário ${i + 1}</td>${cells}</tr>`;
  }).join("");

  return `<div class="test-table-wrapper">
    <p class="test-table-title"><strong>Tabela de Teste</strong></p>
    <table class="test-table">
      <thead><tr>${headers}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function renderTeacherGabarito(gabarito) {
  if (!Array.isArray(gabarito) || !gabarito.length) return "";
  const items = gabarito
    .map((item) => `<p class="gabarito-item">${cleanHtml(stripDecorativeMarkers(item))}</p>`)
    .join("");
  return `<div class="gabarito-section">
    <p class="gabarito-title"><strong>Gabarito do Professor</strong></p>
    ${items}
  </div>`;
}

function renderAssessmentRubric(experience) {
  const rubric = Array.isArray(experience.assessmentRubric) && experience.assessmentRubric.length
    ? experience.assessmentRubric
    : normalizeTextItems(experience.assessment || []).map((item) => {
        const [criterion, ...rest] = item.split("|");
        return {
          criterion: (criterion || "Critério").trim(),
          observation: (rest.join("|") || item).trim()
        };
      });

  if (!rubric.length) return renderBlankLines(2);

  return `<table class="rubric-table">
    <thead><tr><th>Critério</th><th>O que observar</th></tr></thead>
    <tbody>${rubric.map((item) => `<tr><td>${cleanHtml(item.criterion || "Critério")}</td><td>${cleanHtml(item.observation || item.description || "")}</td></tr>`).join("")}</tbody>
  </table>`;
}

function buildActivityPrintHTML(activity) {
  const experience = normalizeLearningExperience(activity);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${cleanHtml(experience.title || 'Experiência STEAM Maker')}</title>
  <style>
    @page { size: A4; margin: 0.85cm 0.95cm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 8.8pt;
      line-height: 1.23;
      color: #000;
      background: #fff;
      padding: 0.85cm 0.95cm;
      max-width: 21cm;
      margin: 0 auto;
    }
    .header {
      display: grid;
      grid-template-columns: 0.55cm 1fr;
      gap: 0.32cm;
      align-items: start;
      margin-bottom: 0.22cm;
      border-bottom: 2px solid #111;
      padding-bottom: 0.22cm;
    }
    .section-number {
      width: 0.48cm;
      height: 0.48cm;
      border: 1.5px solid #111;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 8pt;
      margin-right: 0.16cm;
      flex: 0 0 auto;
    }
    .doc-type { font-size: 7.8pt; font-weight: 700; text-transform: uppercase; color: #555; margin-bottom: 0.06cm; letter-spacing: 0.01cm; }
    .header h1 { font-size: 14pt; font-weight: 700; line-height: 1.08; }
    .section { margin-top: 0.18cm; page-break-inside: avoid; }
    .section-heading { display: flex; align-items: center; border-bottom: 1px solid #777; padding-bottom: 0.06cm; margin-bottom: 0.09cm; }
    .section-title {
      font-size: 9pt;
      font-weight: 700;
    }
    h3 { font-size: 8.4pt; font-weight: 700; margin-bottom: 0.04cm; }
    p { text-align: left; margin-bottom: 0.08cm; }
    ul, ol { padding-left: 0.42cm; margin-bottom: 0.05cm; }
    li { margin-bottom: 0.03cm; text-align: left; }
    .mission { border-left: 2px solid #111; padding-left: 0.22cm; margin-top: 0.1cm; }
    .stages { display: grid; grid-template-columns: 1fr 1fr; gap: 0.1cm 0.24cm; }
    .stage { page-break-inside: avoid; }
    .ready-materials { margin-top: 0.08cm; border-left: 2px solid #777; padding-left: 0.18cm; }
    .ready-materials strong { display: block; margin-bottom: 0.04cm; }
    .rubric-table { width: 100%; border-collapse: collapse; font-size: 8.3pt; }
    .rubric-table th, .rubric-table td { border: 1px solid #999; padding: 0.06cm 0.1cm; text-align: left; vertical-align: top; }
    .rubric-table th { background: #eee; font-weight: 700; }
    .ref { padding-left: 0.8cm; text-indent: -0.8cm; font-size: 8.8pt; line-height: 1.25; }
    .teacher-note { margin-top: 0.1cm; padding: 0.07cm 0.18cm; border-left: 2px solid #555; background: #F9FAFB; font-style: italic; }
    .steam-connection { padding-left: 0.42cm; margin: 0; }
    .steam-connection li { margin-bottom: 0.04cm; }
    .duration-line { font-size: 8.4pt; color: #444; margin-top: 0.05cm; }
    .test-table-wrapper { margin-top: 0.1cm; }
    .test-table-title { margin-bottom: 0.05cm; }
    .test-table { width: 100%; border-collapse: collapse; font-size: 7.8pt; }
    .test-table th { background: #eee; border: 1px solid #999; padding: 0.05cm 0.08cm; text-align: left; font-weight: 700; }
    .test-table td { border: 1px solid #bbb; padding: 0; height: 0.52cm; vertical-align: middle; }
    .test-table td:first-child { padding: 0.04cm 0.08cm; font-weight: 600; white-space: nowrap; }
    .test-table .blank-cell { background: #fafafa; }
    .gabarito-section { margin-top: 0.1cm; border-top: 1px dashed #bbb; padding-top: 0.08cm; }
    .gabarito-title { margin-bottom: 0.04cm; }
    .gabarito-item { margin-bottom: 0.04cm; }
    body.tight { font-size: 8.1pt; line-height: 1.16; padding: 0.65cm 0.78cm; }
    body.tight .header h1 { font-size: 12.5pt; }
    body.tight .section { margin-top: 0.12cm; }
    body.tight .stages { gap: 0.06cm 0.18cm; }
    body.ultra-tight { font-size: 7.5pt; line-height: 1.1; padding: 0.5cm 0.65cm; }
    body.ultra-tight .section { margin-top: 0.08cm; }
    body.ultra-tight .header { margin-bottom: 0.12cm; padding-bottom: 0.12cm; }
    @media print { body { padding: 0; } .section, .stage { page-break-inside: avoid; } .section-title { page-break-after: avoid; } }
  </style>
</head>
<body>

  <div class="header">
    <span class="section-number">1</span>
    <div>
      <div class="doc-type">Experiência de Aprendizagem STEAM + Cultura Maker</div>
      <h1>${cleanHtml(experience.title || 'Atividade Pedagógica')}</h1>
      ${experience.duration ? `<div class="duration-line">Duração estimada: ${cleanHtml(experience.duration)}</div>` : ""}
    </div>
  </div>

  <div class="section">
    <div class="section-heading"><span class="section-number">2</span><div class="section-title">Objetivo geral</div></div>
    <p>${formatCleanMultiline(experience.objective)}</p>
  </div>

  <div class="section">
    <div class="section-heading"><span class="section-number">3</span><div class="section-title">Problema/desafio</div></div>
    <p>${formatCleanMultiline(experience.problem)}</p>
    ${experience.mission ? `<p class="mission"><strong>Missão:</strong> ${formatCleanMultiline(experience.mission)}</p>` : ""}
    ${renderTeacherOrientation(experience.teacherOrientation)}
  </div>

  <div class="section">
    <div class="section-heading"><span class="section-number">4</span><div class="section-title">Materiais</div></div>
    ${renderMaterialsForExperience(experience)}
  </div>

  <div class="section">
    <div class="section-heading"><span class="section-number">5</span><div class="section-title">Desenvolvimento e montagem da atividade</div></div>
    <div class="stages">${renderExperienceStages(experience.stages)}</div>
    ${renderTestTable(experience.readyMaterials)}
  </div>

  <div class="section">
    <div class="section-heading"><span class="section-number">6</span><div class="section-title">Desafio Maker</div></div>
    <p>${formatCleanMultiline(experience.makerChallenge)}</p>
  </div>

  <div class="section">
    <div class="section-heading"><span class="section-number">7</span><div class="section-title">Produto final</div></div>
    <p>${formatCleanMultiline(experience.finalProduct)}</p>
  </div>

  ${renderSteamConnection(experience.steamConnection) ? `<div class="section">
    <div class="section-heading"><span class="section-number">8</span><div class="section-title">Conexão STEAM + Maker</div></div>
    ${renderSteamConnection(experience.steamConnection)}
  </div>` : ""}

  <div class="section">
    <div class="section-heading"><span class="section-number">${experience.steamConnection && Object.values(experience.steamConnection).some(Boolean) ? 9 : 8}</span><div class="section-title">Avaliação</div></div>
    ${renderAssessmentRubric(experience)}
  </div>

  <div class="section">
    <div class="section-heading"><span class="section-number">${experience.steamConnection && Object.values(experience.steamConnection).some(Boolean) ? 10 : 9}</span><div class="section-title">Referências</div></div>
    ${renderReferenceList(experience.bibliography)}
    ${renderTeacherGabarito(experience.teacherGabarito)}
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        var body = document.body;
        var twoPages = 1122 * 2;
        if (body.scrollHeight > twoPages) {
          body.classList.add('tight');
          setTimeout(function() {
            if (body.scrollHeight > twoPages) body.classList.add('ultra-tight');
            window.print();
          }, 80);
        } else {
          window.print();
        }
      }, 400);
    });
  </script>
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

  const bnccList = normalizeBnccCodes(project.bncc || []).map(escapeHtml).join(" · ");

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
  if (activity?.stages || activity?.makerChallenge || activity?.mission) {
    return buildActivityPrintHTML({
      ...activity,
      title: activity.title || activity.activityTitle || projectTitle || "Experiência STEAM Maker",
      theme: activity.theme || projectTitle || "",
      bibliography: activity.bibliography || []
    });
  }

  const steamIntegration = activity.steamIntegration || {};
  const steamText = Array.isArray(steamIntegration)
    ? steamIntegration.join(" ")
    : Object.values(steamIntegration).filter(Boolean).join(" ");

  const stages = (activity.steps || []).map((step, index) => ({
    number: index + 1,
    title: step.title || `Etapa ${index + 1}`,
    duration: step.time || "",
    objective: step.actor ? `Condução: ${step.actor}` : "",
    description: step.description || ""
  }));

  return buildActivityPrintHTML({
    title: activity.activityTitle || projectTitle || "Atividade Pedagógica",
    theme: projectTitle && projectTitle !== activity.activityTitle ? projectTitle : "",
    duration: activity.duration || "",
    grade: activity.targetAudience || "",
    objectives: [
      activity.objective || "Desenvolver uma solução prática por meio de investigação, construção, teste e socialização.",
      "Investigar o problema proposto a partir de evidências.",
      "Construir e testar uma solução com materiais acessíveis.",
      "Registrar resultados e propor melhorias."
    ],
    bncc: activity.bncc || [],
    materials: activity.materials || [],
    stages,
    steamMakerDescription: steamText || "",
    bibliography: activity.bibliography || [],
    summary: activity.summary || activity.objective || "",
    priorKnowledge: activity.priorKnowledge || [],
    vocabulary: activity.vocabulary || [],
    safetyNotes: activity.safetyNotes || [],
    activityScaling: activity.activityScaling || {},
    assemblyGuide: activity.assemblyGuide || [],
    assessment: activity.assessment || "",
    teacherTips: activity.tips || ""
  });
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
