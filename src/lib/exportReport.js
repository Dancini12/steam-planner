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
    .replace(/\b(tesouras?)(?!\s+sem\s+ponta)/gi, (m) => /s$/i.test(m) ? "Tesouras sem ponta" : "Tesoura sem ponta")
    .replace(/\*\*\*([^*]+)\*\*\*/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^-{3,}\s*$/gm, "")
    .replace(/^={3,}\s*$/gm, "")
    .replace(/[•●▪]/g, "-")
    .replace(/^\s*\|.*\|\s*$/gm, "")
    .replace(/^\s*[-|: ]+\s*$/gm, "")
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
        <div class="stage-header">${escapeHtml(title)}</div>
        <div class="stage-body"><p>${formatCleanMultiline(description)}</p></div>
      </div>`;
    })
    .join("");
}

function looksLikeQuantity(text) {
  if (!text) return false;
  // Valid quantity: starts with digit OR known qty keyword
  return /^\d/.test(text) || /^(quantidade|variada?|conforme\s+disponibilidade)/i.test(text);
}

function parseMaterialItem(item) {
  const cleaned = stripDecorativeMarkers(item).replace(/\.\s*$/, "").trim();
  if (!cleaned) return null;

  // Find name/rest separator: colon preferred, then " - "
  let name, rest;
  const colonIdx = cleaned.indexOf(":");
  if (colonIdx > 0) {
    name = cleaned.slice(0, colonIdx).trim();
    rest = cleaned.slice(colonIdx + 1).trim();
  } else {
    const dashMatch = cleaned.match(/^(.+?)\s+-\s+(.+)$/);
    if (dashMatch) {
      name = dashMatch[1].trim();
      rest = dashMatch[2].trim();
    } else {
      name = cleaned;
      rest = "";
    }
  }

  // Split rest on em-dash: qty_unit — use — obs (up to 3 parts)
  const parts = rest ? rest.split(/\s+[—–]\s+/) : [];
  let qtyUnit = (parts[0] || "").trim();
  let useText = (parts[1] || "").trim();
  const obsText = (parts[2] || "").trim();

  // If first part is not a quantity (it's a description), shift everything to use
  if (!looksLikeQuantity(qtyUnit)) {
    useText = parts.length >= 2
      ? [qtyUnit, useText].filter(Boolean).join(" — ")
      : qtyUnit;
    qtyUnit = "";
  }

  // Parse qty (numeral) and unit (type + distribution context)
  let qty = "1";
  let unit = "por grupo";
  if (qtyUnit) {
    const distPattern = /\b(por\s+grupo|para\s+a\s+turma|por\s+aluno|por\s+turma|conforme\s+disponibilidade)\b/i;
    const distMatch = qtyUnit.match(distPattern);
    if (distMatch) {
      const distribution = distMatch[1].trim();
      const before = qtyUnit.slice(0, distMatch.index).trim();
      const numMatch = before.match(/^(\d+(?:\s+a\s+\d+)?)/);
      if (numMatch) {
        qty = numMatch[1].trim();
        const typeStr = before.slice(numMatch[0].length).trim();
        unit = typeStr ? `${typeStr} ${distribution}` : distribution;
      } else {
        qty = before || "—";
        unit = distribution;
      }
    } else {
      const numMatch = qtyUnit.match(/^(\d+(?:\s+a\s+\d+)?)/);
      if (numMatch) {
        qty = numMatch[1].trim();
        unit = qtyUnit.slice(numMatch[0].length).trim() || "por grupo";
      } else {
        qty = qtyUnit || "1";
      }
    }
  }

  // Remove "use como / usar para" prefix left over from old format
  const use = (useText || "—")
    .replace(/^use[rs]?\s+como\s+/i, "")
    .replace(/^use[rs]?\s+para\s+/i, "")
    || "—";

  // Observation: use explicit third segment, or derive from material name
  let obs = obsText;
  if (!obs) {
    if (/tesoura\s+sem\s+ponta/i.test(name)) obs = "Segura para o E.F.";
    else if (/\bcola\s+quente\b|\bestilete\b|\bsolda\b|\bferro\s+de\s+soldar\b/i.test(name)) obs = "Supervisão do professor";
    else obs = "—";
  }

  return { name: name || cleaned, qty, unit, use, obs };
}

function renderMaterialsForExperience(experience) {
  const materials = normalizeTextItems(experience.materials || []);
  const materialFunctions = normalizeTextItems(experience.materialFunctions || []);
  const readyMaterials = normalizeTextItems(experience.readyMaterials || []);

  const lines = materialFunctions.length > 0 ? materialFunctions : materials;
  const displayedReadyMaterials = readyMaterials.filter((item) => !/^tabela de teste/i.test(item));

  const rows = lines
    .map(parseMaterialItem)
    .filter(Boolean)
    .map(({ name, qty, unit, use, obs }) =>
      `<tr>
        <td>${escapeHtml(name)}</td>
        <td class="mat-qty">${escapeHtml(qty)}</td>
        <td>${escapeHtml(unit)}</td>
        <td>${escapeHtml(use)}</td>
        <td>${escapeHtml(obs)}</td>
      </tr>`
    )
    .join("");

  const table = rows
    ? `<table class="materials-table">
        <thead><tr>
          <th>Item</th><th>Qtd.</th><th>Unidade</th><th>Uso na atividade</th><th>Observação</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`
    : renderSimpleList(lines);

  return `${table}
    ${displayedReadyMaterials.length ? `<div class="ready-materials"><strong>Materiais prontos:</strong>${renderSimpleList(displayedReadyMaterials)}</div>` : ""}`;
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
  let columns = ["Cenário/Teste", "Resultado Inicial", "Falha Observada", "Melhoria Aplicada", "Resultado Após Melhoria"];
  if (tableItem) {
    const afterDash = tableItem.replace(/tabela de teste\s*[-—:]\s*/i, "").replace(/\.$/, "");
    const parsed = afterDash.split("|").map((c) => c.trim()).filter(Boolean);
    if (parsed.length >= 3) {
      const firstCol = /^[Cc]en[aá]rio/i.test(parsed[0]) ? parsed[0] : "Cenário";
      columns = [firstCol, ...parsed.slice(1)];
    }
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

// ── Export validation ─────────────────────────────────────────────────────────

const DANGLING = /\s+(e|ou|de|da|do|dos|das|com|para|que|se|em|na|no|nas|nos|a|o|ao|por|pelo|pela|pelos|pelas|um|uma|uns|umas|mais|mas|nem|sobre|após|antes|entre|sua|seu|seus|suas|este|esta|estes|estas|esse|essa|todo|toda|qual|quando|onde|como|permitindo|incluindo|utilizando|tendo|gerando)\.?$/i;

function fixDanglingText(text) {
  if (!text) return text;
  let t = text.replace(/\.{3,}|…/g, ".").trim();
  t = t.replace(DANGLING, "").trim();
  if (t && !/[.!?:;)\]"]$/.test(t)) t += ".";
  return t;
}

function fixScenarioQuestions(readyMaterials) {
  return readyMaterials.map((item) => {
    if (!/^CEN[AÁ]RIO/i.test(item)) return item;
    if (!/d[eé]ficit/i.test(item)) return item;

    const amounts = extractBRLAmounts(item);
    if (amounts.length < 3) return item;

    // First amount = receita, rest = despesas; positive saldo means no real deficit
    const receita = amounts[0];
    const totalDespesas = amounts.slice(1).reduce((a, b) => a + b, 0);
    if (receita - totalDespesas > 0) {
      return item.replace(/d[eé]ficit/gi, "reorganização do saldo");
    }
    return item;
  });
}

const RISKY_MATERIAL_RE = /\bcola\s+quente\b|\bestilete\b|\bsolda(?:\s+el[eé]trica?)?\b|\bferro\s+de\s+soldar\b/i;

function fixMaterialSafety(item) {
  if (!item) return item;
  if (RISKY_MATERIAL_RE.test(item) && !/supervis[aã]o/i.test(item)) {
    return item.replace(/\.?\s*$/, " — uso com supervisão do professor.");
  }
  return item;
}

function fixDecisionLanguage(text) {
  if (!text) return text;
  return text
    .replace(/\b(a\s+família|a\s+pessoa|o\s+estudante|o\s+aluno)\s+decide\s+(comprar|adquirir|contratar|investir|gastar)/gi,
      (_, subj, verb) => `${subj.replace(/\s+/g, " ")} avalia ${verb}`)
    .replace(/\bfamília\s+decide\s+(comprar|adquirir|contratar|investir|gastar)/gi,
      (_, verb) => `família avalia ${verb}`);
}

function fixGabaritoLanguage(teacherGabarito) {
  const negTerms = /\b(d[eé]ficit|preju[ií]zo|saldo negativo|crise financeira)\b/gi;
  return teacherGabarito.map((item) => {
    if (!negTerms.test(item)) return item;
    negTerms.lastIndex = 0;
    const amounts = extractBRLAmounts(item);
    const lastAmount = amounts[amounts.length - 1];
    if (lastAmount !== undefined && lastAmount > 0) {
      return item.replace(negTerms, "reorganização do saldo");
    }
    return item;
  });
}

function autoFixExperience(experience) {
  const fix = fixDanglingText;
  const fixedReadyMaterials = fixScenarioQuestions((experience.readyMaterials || []).map(fix)).map(fixDecisionLanguage);
  const fixedGabarito = fixGabaritoLanguage((experience.teacherGabarito || []).map(fix));
  return {
    ...experience,
    objective: fix(experience.objective),
    problem: fix(experience.problem),
    mission: fix(experience.mission),
    makerChallenge: fix(experience.makerChallenge),
    finalProduct: fix(experience.finalProduct),
    teacherOrientation: experience.teacherOrientation ? fix(experience.teacherOrientation) : experience.teacherOrientation,
    stages: (experience.stages || []).map((s) => ({ ...s, description: fixDecisionLanguage(fix(s.description)) })),
    materialFunctions: (experience.materialFunctions || []).map(fix).map(fixMaterialSafety),
    readyMaterials: fixedReadyMaterials,
    teacherGabarito: fixedGabarito,
  };
}

function extractBRLAmounts(text) {
  return [...(text || "").matchAll(/R\$\s*([\d.]+,\d{2})/g)]
    .map((m) => parseFloat(m[1].replace(/\./g, "").replace(",", ".")));
}

function validateExportedExperience(experience) {
  const blocking = [];
  const warnings = [];

  // Required fields
  [
    ["Objetivo geral", experience.objective],
    ["Problema/desafio", experience.problem],
    ["Missão", experience.mission],
    ["Desafio Maker", experience.makerChallenge],
    ["Produto final", experience.finalProduct],
  ].forEach(([label, value]) => {
    if (!value || value.trim().length < 10) {
      blocking.push(`Campo "${label}" ausente ou incompleto.`);
    }
  });

  // Stages
  (experience.stages || []).forEach((s) => {
    if (!s.description || s.description.trim().length < 10) {
      blocking.push(`Etapa ${s.number || "?"}: descrição ausente ou incompleta.`);
    }
  });

  // Gabarito
  if (!experience.teacherGabarito || experience.teacherGabarito.length === 0) {
    blocking.push("Gabarito do professor ausente.");
  } else {
    experience.teacherGabarito.forEach((item, i) => {
      if (!item || item.trim().length < 15) {
        blocking.push(`Gabarito cenário ${i + 1}: conteúdo incompleto.`);
        return;
      }
      const t = item.trim();
      // Incomplete math operation (ends with = - + or just R$)
      if (/[=+\-]\s*$|R\$\s*$/.test(t)) {
        blocking.push(`Gabarito cenário ${i + 1}: operação matemática incompleta.`);
      }
      // Truncated currency: R$ followed by only 1-2 digits without decimal
      if (/R\$\s*\d{1,2}(?!\d|,|\.)(?:\s*\.|$)/.test(t)) {
        blocking.push(`Gabarito cenário ${i + 1}: valor monetário truncado (ex: "R$ 3." sem vírgula).`);
      }
      // Sentence ends without punctuation or ends mid-word
      if (!/[.!?)]$/.test(t)) {
        blocking.push(`Gabarito cenário ${i + 1}: frase sem ponto final — texto possivelmente cortado.`);
      }
      // Ellipses
      if (/\.{3,}|…/.test(t)) {
        blocking.push(`Gabarito cenário ${i + 1}: contém reticências — texto cortado.`);
      }
      // "déficit" but last BRL value is positive
      if (/d[eé]ficit/i.test(t)) {
        const amounts = extractBRLAmounts(t);
        const last = amounts[amounts.length - 1];
        if (last !== undefined && last > 0) {
          blocking.push(`Gabarito cenário ${i + 1}: menciona "déficit" mas saldo é positivo.`);
        }
      }
    });
  }

  // Bibliography
  if (!experience.bibliography || experience.bibliography.length === 0) {
    warnings.push("Referências bibliográficas ausentes.");
  }

  return { blocking, warnings };
}

function buildExportErrorHTML(blocking, warnings) {
  const li = (items, cls) => items.map((i) => `<li class="${cls}">${escapeHtml(i)}</li>`).join("");
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>Validação — Problemas encontrados</title>
<style>
  body{font-family:Arial,sans-serif;padding:2cm;max-width:20cm;margin:0 auto}
  h1{color:#DC2626;border-bottom:2px solid #DC2626;padding-bottom:.5rem}
  ul{padding-left:1.5rem} li{margin-bottom:.4rem}
  .blocking{color:#DC2626} .warning{color:#D97706}
  .info{background:#FEF3C7;border:1px solid #F59E0B;padding:1rem;border-radius:6px;margin-top:1.5rem}
</style></head><body>
<h1>⚠️ Exportação bloqueada</h1>
<p>O documento apresenta problemas que precisam ser corrigidos antes da exportação:</p>
${blocking.length ? `<p><strong>Bloqueantes:</strong></p><ul>${li(blocking, "blocking")}</ul>` : ""}
${warnings.length ? `<p><strong>Avisos:</strong></p><ul>${li(warnings, "warning")}</ul>` : ""}
<div class="info"><strong>O que fazer:</strong> Feche esta janela, gere uma nova atividade e tente exportar novamente.</div>
</body></html>`;
}

// ── HTML builder ──────────────────────────────────────────────────────────────

function buildActivityPrintHTMLFromExperience(experience) {

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
    .stages { display: grid; grid-template-columns: 1fr 1fr; gap: 0.14cm 0.22cm; }
    .stage { page-break-inside: avoid; border: 1px solid #bbb; border-radius: 2px; overflow: hidden; }
    .stage-header { background: #f0f0f0; font-weight: 700; font-size: 8pt; padding: 0.05cm 0.1cm; border-bottom: 1px solid #bbb; }
    .stage-body { padding: 0.06cm 0.1cm; }
    .stage-body p { margin-bottom: 0; }
    .ready-materials { margin-top: 0.08cm; border-left: 2px solid #777; padding-left: 0.18cm; }
    .ready-materials strong { display: block; margin-bottom: 0.04cm; }
    .materials-table { width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 0.06cm; }
    .materials-table th { background: #eee; border: 1px solid #999; padding: 0.05cm 0.08cm; font-weight: 700; text-align: left; white-space: nowrap; }
    .materials-table td { border: 1px solid #bbb; padding: 0.04cm 0.08cm; vertical-align: top; word-break: break-word; }
    .materials-table .mat-qty { text-align: center; white-space: nowrap; }
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
    .test-table td { border: 1px solid #bbb; padding: 0; height: 0.65cm; vertical-align: middle; }
    .test-table td:first-child { padding: 0.04cm 0.08cm; font-weight: 600; white-space: nowrap; }
    .test-table .blank-cell { background: #fafafa; }
    .gabarito-page {
      page-break-before: always; break-before: page;
      height: auto !important; overflow: visible !important;
      padding-top: 0.6cm;
      font-size: 9pt !important; line-height: 1.3 !important;
    }
    .gabarito-page h2 { font-size: 12pt !important; font-weight: 700; border-bottom: 2px solid #111; padding-bottom: 0.18cm; margin-bottom: 0.12cm; }
    .gabarito-subtitle { font-size: 7.8pt; color: #666; font-style: italic; margin-bottom: 0.4cm; }
    .gabarito-item {
      page-break-inside: auto; break-inside: auto;
      height: auto !important; overflow: visible !important;
      margin-bottom: 0.25cm; line-height: 1.35;
    }
    body.tight { font-size: 8.1pt; line-height: 1.16; padding: 0.65cm 0.78cm; }
    body.tight .header h1 { font-size: 12.5pt; }
    body.tight .section { margin-top: 0.12cm; }
    body.tight .stages { gap: 0.08cm 0.14cm; }
    body.tight .stage-header { padding: 0.03cm 0.08cm; font-size: 7.8pt; }
    body.tight .stage-body { padding: 0.04cm 0.08cm; }
    body.ultra-tight { font-size: 7.5pt; line-height: 1.1; padding: 0.5cm 0.65cm; }
    body.ultra-tight .section { margin-top: 0.08cm; }
    body.ultra-tight .header { margin-bottom: 0.12cm; padding-bottom: 0.12cm; }
    body.ultra-tight .stages { gap: 0.05cm 0.1cm; }
    body.ultra-tight .stage-header { padding: 0.02cm 0.06cm; font-size: 7.5pt; }
    body.ultra-tight .stage-body { padding: 0.03cm 0.06cm; }
    @media print { body { padding: 0; } .section, .stage { page-break-inside: avoid; } .section-title { page-break-after: avoid; } }
  </style>
</head>
<body>

<div id="activity-content">

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
  </div>

</div><!-- end #activity-content -->

  ${(Array.isArray(experience.teacherGabarito) && experience.teacherGabarito.length) ? `<div class="gabarito-page">
    <h2>Gabarito do Professor</h2>
    <p class="gabarito-subtitle">Material exclusivo do professor — não distribuir aos alunos</p>
    ${experience.teacherGabarito.map((item) => `<p class="gabarito-item">${formatCleanMultiline(stripDecorativeMarkers(item))}</p>`).join("")}
  </div>` : ""}

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        var body = document.body;
        var actContent = document.getElementById('activity-content');
        var twoPages = 1122 * 2;
        var h = actContent ? actContent.getBoundingClientRect().height : body.scrollHeight;
        if (h > twoPages) {
          body.classList.add('tight');
          setTimeout(function() {
            var h2 = actContent ? actContent.getBoundingClientRect().height : body.scrollHeight;
            if (h2 > twoPages) body.classList.add('ultra-tight');
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

function buildActivityPrintHTML(activity) {
  const experience = autoFixExperience(normalizeLearningExperience(activity));
  return buildActivityPrintHTMLFromExperience(experience);
}

function openBlob(html) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    alert("Não foi possível abrir o PDF. Verifique se o navegador está bloqueando pop-ups e tente novamente.");
    URL.revokeObjectURL(url);
    return false;
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return true;
}

export function openActivityPrintWindow(activity) {
  const experience = autoFixExperience(normalizeLearningExperience(activity));
  const { blocking, warnings } = validateExportedExperience(experience);

  if (blocking.length > 0) {
    openBlob(buildExportErrorHTML(blocking, warnings));
    return;
  }

  openBlob(buildActivityPrintHTMLFromExperience(experience));
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
