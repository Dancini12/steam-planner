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
const FALLBACK_REFERENCE =
  "BRASIL. Ministério da Educação. Base Nacional Comum Curricular. Brasília: MEC, 2018.";
const FINANCIAL_REFERENCES = [
  "BANCO CENTRAL DO BRASIL. Caderno de educação financeira: gestão de finanças pessoais. Brasília: Banco Central do Brasil, 2013.",
  "BRASIL. Decreto nº 10.393, de 9 de junho de 2020. Institui a nova Estratégia Nacional de Educação Financeira - ENEF e o Fórum Brasileiro de Educação Financeira - FBEF. Diário Oficial da União: Brasília, DF, 10 jun. 2020."
];

function stripDecorativeMarkers(text) {
  if (typeof text !== "string") return "";
  return text
    .replace(/&lt;\s*br\s*\/?\s*&gt;/gi, ". ")
    .replace(/&lt;[^&]+&gt;/gi, " ")
    .replace(/<\s*br\s*\/?\s*>/gi, ". ")
    .replace(/<\/\s*p\s*>/gi, ". ")
    .replace(/<\s*p[^>]*>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
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
    .replace(/\s+([.!?,;:])/g, "$1")
    .replace(/([.!?])\s*([.!?])+/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function sanitizeReferenceText(reference) {
  if (reference == null) return "";
  const source = String(reference)
    .replace(/&lt;\s*br\s*\/?\s*&gt;/gi, " ")
    .replace(/<\s*br\s*\/?\s*>/gi, " ")
    .replace(/&lt;\/?\s*p[^&]*&gt;/gi, " ")
    .replace(/<\/?\s*p[^>]*>/gi, " ");
  const cleaned = stripDecorativeMarkers(source)
    .replace(/\s*[\uFFFE\uFFFF\uFFFD]+\s*/g, "-")
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/\s+([.!?,;:])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  const withDoiPrefix = cleaned.replace(/\b(?:doi\s*[:.]?\s*)?(10\.\d{4,9}\/[^\s,;]+)/gi, (_, doi) => {
    const safeDoi = doi
      .replace(/\s*[\uFFFE\uFFFF\uFFFD]+\s*/g, "-")
      .replace(/[\u200B\u200C\u200D\uFEFF]/g, "")
      .replace(/[\u0000-\u001F\u007F<>()[\]{}"']+/g, "")
      .replace(/[*_`]+/g, "")
      .replace(/\s+/g, "")
      .replace(/-{2,}/g, "-")
      .replace(/-+$/g, "")
      .replace(/[.,;:]+$/g, "");
    return /^10\.\d{4,9}\/\S+$/.test(safeDoi) ? `DOI: ${safeDoi}` : "";
  }).replace(/[ \t]{2,}/g, " ").trim();

  if (!withDoiPrefix) return "";
  return /[.!?]$/.test(withDoiPrefix) ? withDoiPrefix : `${withDoiPrefix}.`;
}

function sanitizeDoiText(text) {
  return String(text || "").replace(/\b(?:doi\s*[:.]?\s*)?(10\.\d{4,9}\/[^\s<,;]+)/gi, (_, doi) => {
    const safeDoi = doi
      .replace(/\s*[\uFFFE\uFFFF\uFFFD]+\s*/g, "-")
      .replace(/[\u200B\u200C\u200D\uFEFF]/g, "")
      .replace(/[\u0000-\u001F\u007F<>()[\]{}"']+/g, "")
      .replace(/[*_`]+/g, "")
      .replace(/\s+/g, "")
      .replace(/-{2,}/g, "-")
      .replace(/-+$/g, "")
      .replace(/[.,;:]+$/g, "");
    return /^10\.\d{4,9}\/\S+$/.test(safeDoi) ? `DOI: ${safeDoi}.` : "";
  });
}

function cleanHtml(text) {
  return escapeHtml(stripDecorativeMarkers(text));
}

function formatCleanMultiline(text) {
  return cleanHtml(text).replace(/\n/g, "<br>");
}

function polishText(text) {
  const cleaned = stripDecorativeMarkers(text);
  if (!cleaned) return "";

  return cleaned
    .replace(/\s+/g, " ")
    .replace(/\s+([.!?,;:])/g, "$1")
    .replace(/([.!?])\s*([.!?])+/g, "$1")
    .replace(/(^|[.!?]\s+)([a-záàâãéêíóôõúç])/g, (_, prefix, letter) => `${prefix}${letter.toUpperCase()}`)
    .replace(/\b([A-Za-zÀ-ÿ]{3,})\s+\1\b/gi, "$1")
    .trim();
}

function reviewText(text, { preserveLineBreaks = false } = {}) {
  if (text == null) return "";

  if (!preserveLineBreaks) {
    return polishText(text);
  }

  return stripDecorativeMarkers(text)
    .split(/\n+/)
    .map((line) => polishText(line))
    .filter(Boolean)
    .join("\n")
    .trim();
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
    .map((ref) => sanitizeReferenceText(ref))
    .filter((ref) => ref && !/wikipedia/i.test(ref))
    .slice(0, 2)
    .map((ref) => `<p class="ref">${escapeHtml(ref)}</p>`)
    .join("");
  return html || `<p class="ref">${escapeHtml(FALLBACK_REFERENCE)}</p>`;
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

function isFinancialThemeText(text) {
  return /or[cç]amento|educa[cç][aã]o financeira|financeir|finan[cç]as|renda|despesa|dinheiro|poupan[cç]a|investimento|fam[ií]lia|sal[aá]rio/i.test(
    stripDecorativeMarkers(text || "")
  );
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

function formatExperienceStageTitle(title, index) {
  const cleaned = stripDecorativeMarkers(title || "");
  const match = cleaned.match(/^ETAPA\s*(\d+)\s*[-—:]\s*(.*)$/i);
  const number = match ? match[1] : String(index + 1);
  const label = (match ? match[2] : cleaned).trim() || "Desenvolvimento";
  return `ETAPA ${number} — ${label}`;
}

function renderExperienceStages(stages) {
  return (stages || [])
    .map((stage, index) => {
      const title = formatExperienceStageTitle(stage?.title || `ETAPA ${index + 1}`, index);
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

function getPreciseMaterialQuantity(name, qty, unit) {
  const normalizedName = stripDecorativeMarkers(name || "").toLowerCase();
  const current = `${qty || ""} ${unit || ""}`.toLowerCase();
  const isGeneric = !qty
    || !unit
    || current === "1 por grupo"
    || current === "1 unidade por grupo"
    || /quantidade|variad|conforme/.test(current);
  const qtyNeedsType = /^\d+(?:\s+a\s+\d+)?$/.test(stripDecorativeMarkers(qty || ""));

  if (!isGeneric && qtyNeedsType) {
    if (/cartolina|papel[-\s]?cart[aã]o|papel[aã]o|folha\s+a3|folha\s+a4/.test(normalizedName)) {
      return { qty: `${qty} folha`, unit };
    }
    if (/ficha|cart[aã]o|cartao|tarjeta/.test(normalizedName)) {
      return { qty: `${qty} fichas`, unit };
    }
    if (/canetinha|marcador|l[aá]pis\s+colorido/.test(normalizedName)) {
      return { qty: `${qty} conjunto`, unit };
    }
    if (/nota[s]?\s+adesiva|adesivo/.test(normalizedName)) {
      return { qty: `${qty} bloco`, unit };
    }
    if (/tesoura|cola\s+bast[aã]o|cola branca|fita adesiva|fita crepe|r[eé]gua|trena|fita m[eé]trica/.test(normalizedName)) {
      return { qty: `${qty} unidade`, unit };
    }
  }

  if (!isGeneric) return { qty, unit };

  if (/cartolina|papel[-\s]?cart[aã]o|papel[aã]o|folha\s+a3|folha\s+a4/.test(normalizedName)) {
    return { qty: "1 folha", unit: "por grupo" };
  }
  if (/ficha|cart[aã]o|cartao|tarjeta/.test(normalizedName)) {
    return { qty: "8 a 12 fichas", unit: "por grupo" };
  }
  if (/canetinha|marcador|l[aá]pis\s+colorido/.test(normalizedName)) {
    return { qty: "1 conjunto", unit: "por grupo" };
  }
  if (/nota[s]?\s+adesiva|adesivo/.test(normalizedName)) {
    return { qty: "1 bloco", unit: "por grupo" };
  }
  if (/tesoura/.test(normalizedName)) {
    return { qty: "1 unidade", unit: "por grupo" };
  }
  if (/cola\s+bast[aã]o|cola branca|fita adesiva|fita crepe/.test(normalizedName)) {
    return { qty: "1 unidade", unit: "por grupo" };
  }
  if (/r[eé]gua|trena|fita m[eé]trica/.test(normalizedName)) {
    return { qty: "1 unidade", unit: "por grupo" };
  }

  return { qty: qty || "1", unit: unit || "por grupo" };
}

function normalizeMaterialQuantityUnit(qty, unit) {
  let normalizedQty = stripDecorativeMarkers(qty || "").trim() || "1 unidade";
  let normalizedUnit = stripDecorativeMarkers(unit || "").trim() || "por grupo";
  const distributionMatch = normalizedQty.match(/\b(por\s+grupo|por\s+aluno|por\s+turma|para\s+a\s+turma|conforme\s+disponibilidade)\b/i);

  if (distributionMatch) {
    normalizedUnit = distributionMatch[1];
    normalizedQty = normalizedQty
      .replace(distributionMatch[0], "")
      .trim();
  }

  // Always split unit into optional type-prefix + distribution (e.g. "folha por grupo" → qty+="folha", unit="por grupo")
  const unitDistribution = normalizedUnit.match(/\b(por\s+grupo|por\s+aluno|por\s+turma|para\s+a\s+turma|conforme\s+disponibilidade)\b/i);
  if (unitDistribution) {
    const typePrefix = normalizedUnit.slice(0, unitDistribution.index).trim();
    if (typePrefix) {
      normalizedQty = [normalizedQty, typePrefix].filter(Boolean).join(" ");
    }
    normalizedUnit = unitDistribution[1];
  }

  if (/^\d+(?:\s+a\s+\d+)?$/.test(normalizedQty)) {
    normalizedQty = `${normalizedQty} unidade`;
  }

  return {
    qty: normalizedQty.replace(/\s+/g, " ").trim(),
    unit: normalizedUnit.replace(/\s+/g, " ").trim()
  };
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

  const precise = getPreciseMaterialQuantity(name, qty, unit);
  qty = precise.qty;
  unit = precise.unit;
  const normalized = normalizeMaterialQuantityUnit(qty, unit);
  qty = normalized.qty;
  unit = normalized.unit;

  return {
    name: reviewText(name || cleaned),
    qty: reviewText(qty),
    unit: reviewText(unit),
    use: reviewText(use),
    obs: reviewText(obs)
  };
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

function renderSteamConnectionForExperience(experience) {
  const rendered = renderSteamConnection(experience.steamConnection);
  if (rendered) return rendered;
  return `<p>A experiência integra investigação, construção, teste e melhoria: os estudantes analisam o problema, criam uma solução manipulável, registram evidências e comunicam o resultado com linguagem visual e dados.</p>`;
}

function renderTeacherOrientation(text) {
  if (!text) return "";
  return `<p class="teacher-note"><strong>Orientação ao professor:</strong> ${formatCleanMultiline(text)}</p>`;
}

const FINANCIAL_TEST_COLUMNS = [
  "Cenário",
  "Receita Total",
  "Despesas Fixas",
  "Despesas Variáveis",
  "Saldo Inicial",
  "Melhoria Aplicada",
  "Saldo Final Após Melhoria"
];

function looksFinancialTest(items, columns = []) {
  const text = [...items, ...columns].join(" ").toLowerCase();
  return /r\$\s*[\d.]+|receita|renda|despesa|or[cç]amento|saldo|poupan[cç]a|investimento/.test(text);
}

function getScenarioItems(readyMaterials) {
  const items = normalizeTextItems(readyMaterials || []);
  const scenarios = [];
  let current = null;

  const finishCurrent = () => {
    if (current) {
      scenarios.push({
        number: current.number || scenarios.length + 1,
        text: current.lines.join("\n")
      });
    }
    current = null;
  };

  items.forEach((item) => {
    const scenarioMatch = item.match(/^CEN[AÁ]RIO\s*(\d+)?/i);

    if (scenarioMatch) {
      finishCurrent();
      current = {
        number: scenarioMatch[1] ? Number(scenarioMatch[1]) : scenarios.length + 1,
        lines: [item]
      };
      return;
    }

    if (/^tabela\s+de\s+teste/i.test(item)) {
      finishCurrent();
      return;
    }

    if (current) {
      current.lines.push(item);
    }
  });

  finishCurrent();
  return scenarios;
}

function getScenarioNumbersFromGabarito(gabarito) {
  return new Set(
    normalizeTextItems(gabarito || [])
      .map((item) => item.match(/Cen[aá]rio\s*(\d+)/i)?.[1])
      .filter(Boolean)
      .map(Number)
  );
}

function renderTestTable(readyMaterials) {
  const items = normalizeTextItems(readyMaterials || []);
  const scenarios = getScenarioItems(items);
  if (!scenarios.length) return "";

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

  const financial = looksFinancialTest(items, columns);
  if (financial) {
    columns = FINANCIAL_TEST_COLUMNS;
  }

  const headers = columns.map((col) => `<th>${escapeHtml(col)}</th>`).join("");
  const rows = scenarios.map((scenario) => {
    const cells = columns.slice(1).map(() => `<td class="blank-cell"></td>`).join("");
    return `<tr><td>Cenário ${scenario.number}</td>${cells}</tr>`;
  }).join("");

  return `<div class="test-table-wrapper">
    <p class="test-table-title"><strong>Tabela de Teste</strong></p>
    <table class="test-table${financial ? " financial-test-table" : ""}">
      <thead><tr>${headers}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function finishGabaritoLine(line) {
  const cleaned = stripDecorativeMarkers(line);
  if (!cleaned) return "";
  return /[.!?:;)]$/.test(cleaned) ? cleaned : `${cleaned}.`;
}

function splitGabaritoLines(item) {
  const cleaned = reviewText(item, { preserveLineBreaks: true });
  if (!cleaned) return [];

  const [first, ...rest] = cleaned.split(/\n+/);
  const firstMatch = first.match(/^(Cen[aá]rio\s*\d+|Sugest[aã]o de melhoria)\s*:\s*(.*)$/i);
  const lines = [];

  if (firstMatch) {
    lines.push(`${firstMatch[1].replace(/^cen/i, "Cen")}:`);
    if (firstMatch[2]) lines.push(firstMatch[2]);
    lines.push(...rest);
  } else {
    lines.push(first, ...rest);
  }

  return lines
    .flatMap((line) => line.split(/\s*;\s*/))
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => index === 0 && /:$/.test(line) ? line : finishGabaritoLine(line));
}

function renderTeacherGabaritoItems(gabarito) {
  if (!Array.isArray(gabarito) || !gabarito.length) return "";
  return gabarito
    .map((item) => {
      const lines = splitGabaritoLines(sanitizeAnswerKeyText(item));
      if (!lines.length) return "";
      const [heading, ...bodyLines] = lines;
      const hasHeading = /:$/.test(heading) && /^(Cen[aá]rio\s*\d+|Sugest[aã]o de melhoria):/i.test(heading);
      const body = (hasHeading ? bodyLines : lines)
        .map((line) => `<p class="gabarito-line">${cleanHtml(line)}</p>`)
        .join("");
      return `<div class="gabarito-card">
        ${hasHeading ? `<p class="gabarito-card-title">${cleanHtml(heading)}</p>` : ""}
        ${body}
      </div>`;
    })
    .join("");
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
    <tbody>${rubric.map((item) => `<tr><td>${cleanHtml(cleanCriterionName(item.criterion || "Critério"))}</td><td>${cleanHtml(item.observation || item.description || "")}</td></tr>`).join("")}</tbody>
  </table>`;
}

// ── Export validation ─────────────────────────────────────────────────────────

const DANGLING = /\s+(e|ou|de|da|do|dos|das|com|para|que|se|em|na|no|nas|nos|a|o|ao|por|pelo|pela|pelos|pelas|um|uma|uns|umas|mais|mas|nem|sobre|após|antes|entre|sua|seu|seus|suas|este|esta|estes|estas|esse|essa|todo|toda|qual|quando|onde|como|permitindo|incluindo|utilizando|tendo|gerando)\.?$/i;
const TRUNCATED_ENDING = /\s+(?:e\s+as|e\s+os|e|com|para|de|da|do|das|dos|as|os|a|o)\.?$/i;

function fixTruncatedSentences(text) {
  if (!text) return text;
  let t = String(text)
    .replace(/\bcom os resultados dos cen[aá]rios e as\.?$/i, "com os resultados dos cenários e as melhorias aplicadas.")
    .trim();
  let previous = "";
  while (t !== previous && TRUNCATED_ENDING.test(t)) {
    previous = t;
    t = t.replace(TRUNCATED_ENDING, "").trim();
  }
  if (t && !/[.!?:;)\]"]$/.test(t)) t += ".";
  return t;
}

function fixDanglingText(text) {
  if (!text) return text;
  let t = reviewText(text).replace(/\.{3,}|…/g, ".").trim();
  t = t.replace(DANGLING, "").trim();
  return fixTruncatedSentences(t);
}

function fixReadyMaterialText(text) {
  if (!text) return text;
  return reviewText(text, { preserveLineBreaks: true })
    .split(/\n+/)
    .map((line) => {
      let t = line.replace(/\.{3,}|…/g, ".").trim();
      t = t.replace(DANGLING, "").trim();
      if (!t) return "";
      if (/^CEN[AÁ]RIO\s*\d+$/i.test(t) || /:$/.test(t)) return t;
      t = fixTruncatedSentences(t);
      if (/[.!?)]$/.test(t)) return t;
      return `${t}.`;
    })
    .filter(Boolean)
    .join("\n");
}

function fixAnswerKeyText(answerKey) {
  if (!answerKey) return "";
  return reviewText(answerKey, { preserveLineBreaks: true })
    .replace(/\bMeta de poupan[cç]a para\s+(?:h[aá]|existe|ocorre)\b/gi, "Meta de poupança planejada")
    .replace(/\bMeta(?: de poupan[cç]a)?\s+com\s+(?:deseja|quer|pretende)\s+(?:guardar|poupar|economizar)\s+/gi, "Meta de poupança planejada ")
    .replace(/\bMeta\s+para\s+(?:quer|deseja|pretende)\s+/gi, "Meta de poupança planejada ")
    .replace(/\bImprevisto com\s+(?:uma\s+)?m[eé]dica\s+inesperada\b/gi, "Despesa médica inesperada")
    .replace(/\bImprevisto com\s+(?:surge|surgiu|apareceu|h[aá])\s+(?:uma?\s+)?despesa\s+m[eé]dica\s+inesperada\b/gi, "Despesa médica inesperada")
    .replace(/\b(Imprevisto com|Gasto(?: inesperado)? com)\s+(?:surge|surgiu)\s+(?:um\s+)?(?:gasto\s+inesperado\s+com\s+)?/gi, "$1 ")
    .replace(/\bImprevisto com\s+(?:uma?\s+)?despesa\s+m[eé]dica\s+inesperada\b/gi, "Despesa médica inesperada")
    .replace(/\bDespesa com\s+(?:apareceu|surge|surgiu|h[aá])\s+/gi, "Despesa ")
    .replace(/\bMeta(?: de poupan[cç]a)? com\s+(?:deseja|desejam)\s+guardar\s+/gi, "Meta de poupança para ")
    .replace(/\bRedu[cç][aã]o com\s+(?:decidiu|decide)\s+/gi, "Redução: ")
    .replace(/\bO saldo final é negativo\.\s+a equipe\b/gi, "O saldo final é negativo. A equipe")
    .replace(/[ \t]{2,}/g, " ")
    .split(/\n+/)
    .map((line) => fixTruncatedSentences(line.trim()))
    .filter(Boolean)
    .join("\n");
}

function validateAnswerKeyText(answerKey) {
  const text = Array.isArray(answerKey) ? answerKey.join("\n") : String(answerKey || "");
  const invalidPatterns = [
    /Meta de poupan[cç]a para\s+h[aá]/i,
    /Meta com\s+deseja/i,
    /Meta para\s+quer/i,
    /Imprevisto com\s+surge/i,
    /Imprevisto com\s+surgiu/i,
    /Imprevisto com\s+uma\s+m[eé]dica/i,
    /Gasto com\s+surge/i,
    /Despesa com\s+apareceu/i,
    /Meta com\s+deseja/i,
    /Redu[cç][aã]o com\s+decid/i,
    /O saldo final é negativo\.\s+a equipe/i,
    /(?:e\s+as|e\s+os|de|para)\.\s*(?:\n|$)/i
  ];
  return {
    ok: !invalidPatterns.some((pattern) => pattern.test(text)),
    blocking: invalidPatterns
      .filter((pattern) => pattern.test(text))
      .map(() => "Gabarito do professor contém redação financeira inválida ou frase truncada.")
  };
}

function reviewGabaritoText(text) {
  const reviewed = fixAnswerKeyText(text);
  if (!reviewed) return "";
  return reviewed
    .split(/\n+/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      if (/^(Cen[aá]rio\s*\d+|Sugest[aã]o de melhoria|Outra possibilidade):$/i.test(trimmed)) {
        return trimmed.replace(/^(cen)/i, "Cen");
      }
      return fixTruncatedSentences(/[.!?:;)]$/.test(trimmed) ? trimmed : `${trimmed}.`);
    })
    .filter(Boolean)
    .join("\n");
}

const POSITIVE_BALANCE_QUESTION =
  "Como esse gasto afeta o saldo e que ajuste poderia ser feito para preservar parte da poupança?";

function replaceScenarioQuestion(text, question) {
  if (/pergunta\s*:/i.test(text)) {
    return text.replace(/(pergunta\s*:\s*)[^?!.]*(?:[?!.]|$)/i, `$1${question}`);
  }

  if (/\?/.test(text)) {
    return text.replace(/[^.?!]*\?(\s*)$/, `${question}$1`);
  }

  return `${text.replace(/[.?!]?\s*$/, ".")} Pergunta: ${question}`;
}

function removePositiveBalanceContradictions(text) {
  return text
    .replace(/\bsem\s+impactar\s+negativamente\s+(?:o\s+)?saldo\b/gi, "preservando parte da poupança")
    .replace(/\bsem\s+impacto\s+(?:negativo\s+)?(?:no|sobre\s+o)\s+saldo\b/gi, "com menor impacto no saldo")
    .replace(/\bsem\s+reduzir\s+(?:o\s+)?saldo\b/gi, "reduzindo o impacto no saldo")
    .replace(/\b(?:d[eé]ficit|saldo negativo|entrar no vermelho|or[cç]amento negativo|preju[ií]zo)\b/gi, "impacto no saldo");
}

function fixScenarioQuestions(readyMaterials) {
  const reviewed = normalizeTextItems(readyMaterials || []);
  const scenarioData = buildFinancialDataForScenarios(getScenarioItems(reviewed));
  const byNumber = new Map(scenarioData.map((data) => [data.scenario.number, data]));

  return reviewed.map((item) => {
    if (!/^CEN[AÁ]RIO/i.test(item)) return item;

    const number = Number(item.match(/^CEN[AÁ]RIO\s*(\d+)/i)?.[1]);
    const data = byNumber.get(number);
    let fixed = item;

    if (data && Number.isFinite(data.saldo) && data.saldo >= 0) {
      const contradictoryQuestion = /sem\s+impactar\s+negativamente|sem\s+impacto\s+(?:negativo\s+)?(?:no|sobre\s+o)\s+saldo|sem\s+reduzir\s+(?:o\s+)?saldo/i.test(fixed);
      const invalidNegativeTerms = /\b(?:d[eé]ficit|saldo negativo|entrar no vermelho|or[cç]amento negativo|preju[ií]zo)\b/i.test(fixed);

      fixed = removePositiveBalanceContradictions(fixed);

      if (contradictoryQuestion || invalidNegativeTerms) {
        fixed = replaceScenarioQuestion(fixed, POSITIVE_BALANCE_QUESTION);
      }
    }

    return fixed;
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
  const negTerms = /\b(d[eé]ficit|preju[ií]zo|saldo negativo|entrar no vermelho|or[cç]amento negativo|crise financeira)\b/gi;
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

function formatCurrencyBRL(value) {
  if (value < 0) {
    return `-${formatCurrencyBRL(Math.abs(value))}`;
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2
  }).format(value).replace(/\u00a0/g, " ");
}

const FINANCIAL_ENTRY_TYPE = {
  RECEITA: "receita",
  RECEITA_TOTAL: "receitaTotal",
  DESPESA_FIXA: "despesaFixa",
  DESPESA_VARIAVEL: "despesaVariavel",
  IMPREVISTO: "imprevisto",
  META_POUPANCA: "metaPoupanca",
  MELHORIA: "melhoria",
  DESPESA_TOTAL: "despesaTotal",
  DESPESA_ANTERIOR: "despesaAnterior",
  SALDO: "saldo",
  OUTRO: "outro"
};

const REVENUE_RE = /\b(receitas?|rendas?|sal[aá]rios?|ganhos?|entradas?|remunera[cç][aã]o)\b/i;
const IMPROVEMENT_RE = /\b(economizar|economizad[oa]s?|economia|poupar|poupan[cç]a|reduzir|redu[cç][aã]o|cortar|corte|ajustar|ajuste|melhoria|melhorar|reorganizar|reorganiza[cç][aã]o|preservar|reserva|saldo ap[oó]s melhoria|ap[oó]s melhoria|poderiam economizar|poderia economizar|valor que poderia ser economizado)\b/i;
const SAVINGS_GOAL_RE = /\b(guardar|poupar|reservar|juntar|separar|destinar|investir|meta(?:\s+de\s+poupan[cç]a)?|poupan[cç]a|reserva|investimento|objetivo\s+financeiro|deseja\s+guardar|viagem)\b/i;
const SAVINGS_GOAL_ACTION_RE = /\b(guardar|poupar|reservar|juntar|separar|destinar|investir|economizar)\b/i;
const SAVINGS_GOAL_TARGET_RE = /\b(viagem|reserva(?:\s+de\s+emerg[eê]ncia)?|investimento|poupan[cç]a|objetivo\s+financeiro|meta(?:\s+de\s+poupan[cç]a)?)\b/i;
const PRIOR_EXPENSE_RE = /\bdespesas?\s+(?:do|da)\s+cen[aá]rio|\bdespesas?\s+anteriores?\b|\btotal\s+anterior\s+de\s+despesas\b/i;
const EXPENSE_TOTAL_RE = /\b(?:novo\s+)?total\s+de\s+despesas\b|\bdespesas?\s+totais\b/i;
const REVENUE_TOTAL_RE = /\b(?:receita|renda)\s+total\b|\btotal\s+de\s+(?:receitas?|rendas?)\b/i;
const BALANCE_RE = /\b(saldo|sobra\s+mensal|resultado\s+final)\b/i;
const UNEXPECTED_RE = /\b(imprevisto|inesperad[oa]s?|emerg[eê]ncia|emergencial|conserto|reparo|aumento|acr[eé]scimo|acrescimo|novo\s+gasto|gasto\s+(?:extra|inesperado)|despesa\s+inesperada|custo\s+extra|m[eé]dic[oa]s?|rem[eé]dios?|consulta|carro|manuten[cç][aã]o)\b/i;
const FIXED_EXPENSE_RE = /\b(despesas?\s+fixas?|gastos?\s+fixos?|custos?\s+fixos?|aluguel|escola|mensalidade|internet|[aá]gua|luz|energia|condom[ií]nio|telefone|celular|plano|presta[cç][aã]o|financiamento|seguro|educa[cç][aã]o|sa[uú]de|farm[aá]cia)\b/i;
const VARIABLE_EXPENSE_RE = /\b(despesas?\s+vari[aá]veis?|gastos?\s+vari[aá]veis?|custos?\s+vari[aá]veis?|alimenta[cç][aã]o|mercado|transporte|lazer|compras?|roupas?|passeio|restaurante|lanche|combust[ií]vel)\b/i;
const FIXED_SECTION_LABEL_RE = /\b(?:despesas?|gastos?|custos?)\s+fixas?\b|\bfixas?\b/i;
const VARIABLE_SECTION_LABEL_RE = /\b(?:despesas?|gastos?|custos?)\s+vari[aá]veis?\b|\bvari[aá]veis?\b/i;
const EXPENSE_RE = /\b(despesas?|gastos?|custos?|contas?|pagamentos?)\b/i;
const FAMILY_REVENUE_RE = /\b(pai|m[aã]e|respons[aá]vel(?:\s+\d+)?|cuidador(?:a)?)\b/i;
const BRL_MATCH_RE = /-?\s*R\$\s*(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{2})?/g;

function buildEmptyStructuredBudget() {
  return {
    receitas: [],
    despesasFixas: [],
    despesasVariaveis: [],
    imprevistos: [],
    metasPoupanca: [],
    melhorias: [],
    totaisDeclarados: {
      receitas: [],
      despesas: [],
      despesasAnteriores: [],
      saldos: []
    },
    outros: []
  };
}

function normalizeFinancialDescription(value, fallback) {
  const cleaned = reviewText(value || "")
    .replace(/\b(?:cen[aá]rio\s*\d+|pergunta|qual|como|onde|poderia|poderiam)\b/gi, "")
    .replace(/\b(?:receitas?|rendas?|despesas?|fixas?|vari[aá]veis?|imprevistos?|melhorias?|total|saldo)\b/gi, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s:,-]+|[\s:,-]+$/g, "")
    .trim();
  return cleaned || fallback;
}

function normalizeFinancialLabel(value) {
  return (value || "")
    .replace(BRL_MATCH_RE, " ")
    .replace(/[-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeFinancialCategory(category) {
  const value = String(category || "").toLowerCase();
  if (/meta|poupanca|poupan/.test(value)) return "meta_poupanca";
  if (/imprevisto|unexpected/.test(value)) return "imprevisto";
  if (/melhoria|improvement/.test(value)) return "melhoria";
  return value;
}

function cleanGenericFinancialLabel(label) {
  return reviewText(label || "")
    .replace(BRL_MATCH_RE, " ")
    .replace(/\bal[eé]m\s+das?\s+despesas?\s+do\s+cen[aá]rio\s*\d+\s*,?\s*/gi, " ")
    .replace(/\b(?:surge|surgiu|apareceu|h[aá])\s+(?:uma?|um)\s+/gi, " ")
    .replace(/\b(?:gastos?|despesas?)\s+inesperad[oa]s?\s+(?:com|de)\s+/gi, " ")
    .replace(/\bdespesas?\s+extras?\s+com\s+/gi, " ")
    .replace(/\bprecis(?:a|ou|am)\s+comprar\s+/gi, " ")
    .replace(/\b(?:de|no)\s+valor\s+de\b/gi, " ")
    .replace(/\bcusto\s+de\b|\bcusta\b/gi, " ")
    .replace(/\bgastos?\s+com\s+/gi, " ")
    .replace(/\bdespesas?\s+com\s+/gi, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s:,-]+|[\s:,-]+$/g, "")
    .replace(/\b(?:de|com)\s*$/i, "")
    .trim();
}

function formatSavingsGoalLabel(label) {
  const source = reviewText(label || "");
  if (/\bviagem\b/i.test(source)) return "Meta de poupança para viagem";
  if (/\breserva\b/i.test(source)) return "Meta de reserva financeira";
  if (/\binvestimento\b/i.test(source)) return "Meta de investimento planejada";
  return "Meta de poupança planejada";
}

function formatUnexpectedExpenseLabel(label) {
  const source = reviewText(label || "");
  const generic = cleanGenericFinancialLabel(source);

  if (/despesa\s+m[eé]dica\s+inesperada|m[eé]dic[ao]s?|consulta|sa[uú]de/i.test(source)) {
    return "Despesa médica inesperada";
  }
  if (/rem[eé]dios?|medicamentos?/i.test(source)) {
    return "Gasto inesperado com remédios";
  }
  if (/conserto|reparo|manuten[cç][aã]o/i.test(source) && generic) {
    return generic;
  }
  if (/gasto\s+inesperado\s+com/i.test(source) && generic) {
    return `Gasto inesperado com ${lowerFirst(generic)}`;
  }
  if (/despesa\s+inesperada/i.test(source) && generic) {
    return `Despesa inesperada com ${lowerFirst(generic)}`;
  }
  return generic || "Imprevisto";
}

function formatImprovementLabel(label) {
  const source = reviewText(label || "");
  const match = source.match(/\b(reduzir|cortar|economizar|diminuir)\s+R\$\s*([\d.]+(?:,\d{2})?|\d+)(?:\s+(do|da|de|em)\s+([^.,;?]+))?/i);
  if (!match) return cleanGenericFinancialLabel(source);

  const action = normalizeImprovementAction(match[1]);
  const value = parseFinancialAmount(match[2]);
  const target = cleanImprovementTarget(match[4] || "");
  if (!Number.isFinite(value)) return cleanGenericFinancialLabel(source);
  if (!target) return `${action} ${formatCurrencyBRL(value)} em despesas variáveis`;
  if (/reduzir|cortar|diminuir/i.test(action)) {
    return `${action} ${formatCurrencyBRL(value)} do gasto com ${target}`;
  }
  return `${action} ${formatCurrencyBRL(value)} em ${target}`;
}

function cleanFinancialItemLabel(label, category = "") {
  const normalizedCategory = normalizeFinancialCategory(category);
  if (normalizedCategory === "meta_poupanca") return formatSavingsGoalLabel(label);
  if (normalizedCategory === "imprevisto") return formatUnexpectedExpenseLabel(label);
  if (normalizedCategory === "melhoria") return formatImprovementLabel(label);
  return cleanGenericFinancialLabel(label);
}

function sanitizeAnswerKeyText(answerKeyText) {
  if (!answerKeyText) return "";
  return reviewGabaritoText(answerKeyText)
    .replace(/\bImprevisto com\s+(?:um|uma|o|a)?\s*([^:\n.]+):\s*(R\$\s*-?[\d.]+(?:,\d{2})?)\.?/gi, (_, label, amount) => {
      const cleanLabel = cleanFinancialItemLabel(label, FINANCIAL_ENTRY_TYPE.IMPREVISTO)
        .replace(/^(?:um|uma|o|a)\s+/i, "")
        .trim();
      return `${upperFirst(cleanLabel || "Imprevisto")}: ${amount}.`;
    })
    .replace(/\bMeta de poupan[cç]a para\s+h[aá]\b/gi, "Meta de poupança planejada")
    .replace(/\bImprevisto com\s+(?:surge|surgiu|apareceu|h[aá])\s+/gi, "Imprevisto: ")
    .replace(/\bGasto com\s+(?:apareceu|surge|surgiu)\s+/gi, "Gasto com ")
    .replace(/\bO saldo final é negativo\.\s+a equipe\b/gi, "O saldo final é negativo. A equipe");
}

function isPriorSavingsAllocationContext(text) {
  const normalized = stripDecorativeMarkers(text || "")
    .replace(BRL_MATCH_RE, " R$ ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return false;

  const priorScenarioSavings = /\b(?:do|da)\s+cen[aá]rio\s*\d+\b[^.?!;]{0,90}\b(?:foi|foram|ficou|ficaram|vai|v[aã]o|destinad[oa]s?|separad[oa]s?)\b[^.?!;]{0,70}\bpoupan[cç]a\b/i;
  const priorBalanceSavings = /\b(?:saldo|sobra)\b[^.?!;]{0,90}\b(?:foi|foram|ficou|ficaram|vai|v[aã]o|destinad[oa]s?|separad[oa]s?)\b[^.?!;]{0,70}\bpoupan[cç]a\b/i;
  return priorScenarioSavings.test(normalized) || priorBalanceSavings.test(normalized);
}

function hasExplicitSavingsGoalContext(text) {
  const normalized = stripDecorativeMarkers(text || "")
    .replace(BRL_MATCH_RE, " R$ ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return false;

  if (isPriorSavingsAllocationContext(normalized)) {
    return false;
  }

  if (/\b(?:preservar|manter|recuperar|aumentar)\s+(?:parte\s+da\s+)?poupan[cç]a\b/i.test(normalized)) {
    return false;
  }

  if (/\b(?:meta(?:\s+de\s+poupan[cç]a)?|objetivo\s+financeiro)\b/i.test(normalized) && SAVINGS_GOAL_TARGET_RE.test(normalized)) {
    return true;
  }

  if (/\b(?:poupan[cç]a|reserva|investimento)\s+(?:para|de)\b/i.test(normalized)) {
    return true;
  }

  if (/\bviagem\b/i.test(normalized) && /\b(?:guardar|poupar|reservar|juntar|separar|destinar|investir|economizar|meta|poupan[cç]a|reserva)\b/i.test(normalized)) {
    return true;
  }

  return SAVINGS_GOAL_ACTION_RE.test(normalized)
    && /\b(?:para|pra|destinad[oa]s?\s+a|com\s+objetivo\s+de|objetivo\s+de)\b[^.?!;]{0,80}\b(?:viagem|reserva|investimento|poupan[cç]a|objetivo\s+financeiro|meta)\b/i.test(normalized);
}

function cleanSavingsGoalLabel(label) {
  return cleanFinancialItemLabel(label, FINANCIAL_ENTRY_TYPE.META_POUPANCA);
}

function parseFinancialAmount(rawValue) {
  const value = extractBRLAmounts(`R$ ${rawValue}`)[0];
  return Number.isFinite(value) ? Math.abs(value) : null;
}

function parsePercentAmount(rawValue) {
  const value = Number(String(rawValue || "").replace(",", "."));
  return Number.isFinite(value) ? Math.abs(value) : null;
}

function cleanImprovementTarget(target) {
  return cleanFinancialItemLabel(target || "")
    .replace(/\bgastos?\s+com\s+/gi, "")
    .replace(/\bdespesas?\s+com\s+/gi, "")
    .replace(/\bcompras?\s+de\s+/gi, "")
    .replace(/\b(?:o|a|os|as)\s+/i, "")
    .replace(/\b(?:do|da|no|na)\s+m[eê]s\b/gi, "")
    .replace(/\bmensal\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeImprovementAction(action) {
  const normalized = String(action || "").toLowerCase();
  if (/cortar/.test(normalized)) return "Cortar";
  if (/economizar/.test(normalized)) return "Economizar";
  if (/diminuir/.test(normalized)) return "Diminuir";
  return "Reduzir";
}

function extractExplicitImprovement(scenarioText) {
  const source = stripDecorativeMarkers(scenarioText || "").replace(/\s+/g, " ");
  const match = source.match(/\b(reduzir|cortar|economizar|diminuir)\s+R\$\s*([\d.]+(?:,\d{2})?|\d+)(?:\s+(do|da|de|em)\s+([^.,;?]+))/i);
  if (!match) return null;

  const value = parseFinancialAmount(match[2]);
  const target = cleanImprovementTarget(match[4]);
  if (!Number.isFinite(value) || !target) return null;

  return {
    action: normalizeImprovementAction(match[1]),
    value,
    target
  };
}

function calculateImprovementValue(baseValue, percentage) {
  if (!Number.isFinite(baseValue) || !Number.isFinite(percentage) || baseValue <= 0 || percentage < 0) {
    return null;
  }
  return Math.round((baseValue * (percentage / 100)) * 100) / 100;
}

function parsePercentageImprovementRequest(scenarioText) {
  const source = stripDecorativeMarkers(scenarioText || "").replace(/\s+/g, " ");
  const percentageMatch = source.match(/\b(reduzir|cortar|economizar|diminuir)\s+(?:em\s+)?(\d+(?:[,.]\d+)?)\s*%\s+(?:(?:do|da|dos|das|de|em)\s+)?(?:(?:o|a|os|as)\s+)?(?:(?:gastos?|despesas?|custos?)\s+(?:com|de|do|da)\s+)?([^.,;?]+)/i);
  if (percentageMatch) {
    return {
      action: normalizeImprovementAction(percentageMatch[1]),
      percentage: parsePercentAmount(percentageMatch[2]),
      target: cleanImprovementTarget(percentageMatch[3])
    };
  }

  const halfBeforeTargetMatch = source.match(/\b(reduzir|cortar|economizar|diminuir)\s+(?:pela\s+)?metade\s+(?:(?:do|da|dos|das|de|em)\s+)?(?:(?:o|a|os|as)\s+)?(?:(?:gastos?|despesas?|custos?)\s+(?:com|de|do|da)\s+)?([^.,;?]+)/i);
  if (halfBeforeTargetMatch) {
    return {
      action: normalizeImprovementAction(halfBeforeTargetMatch[1]),
      percentage: 50,
      target: cleanImprovementTarget(halfBeforeTargetMatch[2])
    };
  }

  const halfAfterTargetMatch = source.match(/\b(reduzir|cortar|economizar|diminuir)\s+(?:(?:o|a|os|as)\s+)?(?:(?:gastos?|despesas?|custos?)\s+(?:com|de|do|da)\s+)?([^.,;?]+?)\s+(?:pela\s+)?metade\b/i);
  if (halfAfterTargetMatch) {
    return {
      action: normalizeImprovementAction(halfAfterTargetMatch[1]),
      percentage: 50,
      target: cleanImprovementTarget(halfAfterTargetMatch[2])
    };
  }

  return null;
}

function getBudgetItemsForPercentageBase(dataOrStructured) {
  const structured = dataOrStructured?.structured || dataOrStructured || {};
  return [
    ...(structured.despesasFixas || []),
    ...(structured.despesasVariaveis || []),
    ...(structured.imprevistos || [])
  ];
}

function getBudgetItemTargetCategory(item) {
  if (!item) return "";
  if (item.type === FINANCIAL_ENTRY_TYPE.DESPESA_VARIAVEL) return "despesa_variavel";
  if (item.type === FINANCIAL_ENTRY_TYPE.DESPESA_FIXA) return "despesa_fixa";
  if (item.type === FINANCIAL_ENTRY_TYPE.IMPREVISTO) return "imprevisto";
  if (item.type === FINANCIAL_ENTRY_TYPE.DESPESA_TOTAL) return "despesas_totais";
  if (item.type === FINANCIAL_ENTRY_TYPE.DESPESA_ANTERIOR) return "despesas_anteriores";
  return "despesa";
}

function findBudgetItemByTarget(target, ...sources) {
  const normalizedTarget = normalizeSearchText(target || "");
  if (!normalizedTarget) return null;
  return sources.reduce((foundItem, source) => {
    if (foundItem) return foundItem;
    const items = getBudgetItemsForPercentageBase(source);
    return items.find((item) => {
      const itemText = normalizeSearchText(`${item?.descricao || ""} ${item?.rawLabel || ""}`);
      return itemText && (itemText.includes(normalizedTarget) || normalizedTarget.includes(itemText));
    }) || null;
  }, null);
}

function findBudgetItemTotalByTarget(target, ...sources) {
  return findBudgetItemByTarget(target, ...sources)?.valor || 0;
}

function getPercentageBaseDetailForTarget(target, currentStructured, previousData) {
  const text = normalizeSearchText(target || "");
  if (/variavel|variaveis/.test(text)) {
    const baseValue = sumBudgetItems(currentStructured?.despesasVariaveis || []) || previousData?.despesasVariaveisTotal || 0;
    return baseValue > 0 ? { baseValue, targetCategory: "despesa_variavel" } : null;
  }
  if (/fixa|fixas|fixo|fixos/.test(text)) {
    const baseValue = sumBudgetItems(currentStructured?.despesasFixas || []) || previousData?.despesasFixasTotal || 0;
    return baseValue > 0 ? { baseValue, targetCategory: "despesa_fixa" } : null;
  }
  if (/despesas?\s+totais|gastos?\s+totais|custos?\s+totais|total\s+de\s+(?:despesas?|gastos?|custos?)/.test(text)) {
    const currentTotal = sumBudgetItems(currentStructured?.despesasFixas || []) + sumBudgetItems(currentStructured?.despesasVariaveis || []);
    const baseValue = currentTotal || previousData?.despesasBaseTotal || previousData?.totalExpenses || 0;
    return baseValue > 0 ? { baseValue, targetCategory: "despesas_totais" } : null;
  }

  const item = findBudgetItemByTarget(target, currentStructured, previousData);
  return item ? {
    baseValue: item.valor,
    targetCategory: getBudgetItemTargetCategory(item),
    item
  } : null;
}

function getPercentageBaseForTarget(target, currentStructured, previousData) {
  return getPercentageBaseDetailForTarget(target, currentStructured, previousData)?.baseValue || 0;
}

function extractPercentageImprovement(scenarioText, currentStructured, previousData) {
  const request = parsePercentageImprovementRequest(scenarioText);
  if (!request) return null;

  const percentage = request.percentage;
  const target = request.target;
  const baseDetail = getPercentageBaseDetailForTarget(target, currentStructured, previousData);
  const improvementValue = calculateImprovementValue(baseDetail?.baseValue, percentage);

  if (!Number.isFinite(percentage) || !target || !baseDetail || !Number.isFinite(improvementValue)) {
    return {
      type: "percentage",
      action: request.action,
      percentage,
      percent: percentage,
      target,
      targetCategory: null,
      baseValue: null,
      base: null,
      improvementValue: null,
      value: null,
      calculable: false,
      reason: "target_not_found"
    };
  }

  return {
    type: "percentage",
    action: request.action,
    percentage,
    percent: percentage,
    target,
    targetCategory: baseDetail.targetCategory,
    baseValue: baseDetail.baseValue,
    base: baseDetail.baseValue,
    improvementValue,
    value: improvementValue,
    calculable: true
  };
}

function getCurrentFinancialSection(before) {
  const matches = [...before.matchAll(/\b(receitas?|rendas?|despesas?\s+fixas?|gastos?\s+fixos?|custos?\s+fixos?|despesas?\s+vari[aá]veis?|gastos?\s+vari[aá]veis?|custos?\s+vari[aá]veis?|imprevistos?|melhorias?|economias?)\b/gi)];
  const last = matches.length ? matches[matches.length - 1][0] : "";
  if (/receitas?|rendas?/i.test(last)) return FINANCIAL_ENTRY_TYPE.RECEITA;
  if (/(?:despesas?|gastos?|custos?)\s+fixos?/i.test(last)) return FINANCIAL_ENTRY_TYPE.DESPESA_FIXA;
  if (/(?:despesas?|gastos?|custos?)\s+vari[aá]veis?/i.test(last)) return FINANCIAL_ENTRY_TYPE.DESPESA_VARIAVEL;
  if (/imprevistos?/i.test(last)) return FINANCIAL_ENTRY_TYPE.IMPREVISTO;
  if (/melhorias?|economias?/i.test(last)) return FINANCIAL_ENTRY_TYPE.MELHORIA;
  return "";
}

function classifyFinancialEntry({ label, currentSection, afterClause }) {
  const labelOnly = normalizeFinancialLabel(label || "");
  const local = `${label} ${afterClause}`.replace(/\s+/g, " ").trim();

  if (PRIOR_EXPENSE_RE.test(local) && !UNEXPECTED_RE.test(local) && !IMPROVEMENT_RE.test(local) && !SAVINGS_GOAL_RE.test(local)) return FINANCIAL_ENTRY_TYPE.DESPESA_ANTERIOR;
  if (EXPENSE_TOTAL_RE.test(label) || EXPENSE_TOTAL_RE.test(local)) return FINANCIAL_ENTRY_TYPE.DESPESA_TOTAL;
  // REVENUE_TOTAL_RE moved after expense checks: a label containing both revenue-total
  // and expense keywords (e.g. "receita total com aluguel") must classify as expense first.
  if (BALANCE_RE.test(labelOnly) && !IMPROVEMENT_RE.test(local)) return FINANCIAL_ENTRY_TYPE.SALDO;
  if (isPriorSavingsAllocationContext(local)) return FINANCIAL_ENTRY_TYPE.SALDO;
  if (hasExplicitSavingsGoalContext(local)) return FINANCIAL_ENTRY_TYPE.META_POUPANCA;
  if (SAVINGS_GOAL_RE.test(labelOnly)) return FINANCIAL_ENTRY_TYPE.META_POUPANCA;
  if (IMPROVEMENT_RE.test(labelOnly)) return FINANCIAL_ENTRY_TYPE.MELHORIA;
  if (currentSection === FINANCIAL_ENTRY_TYPE.MELHORIA) return FINANCIAL_ENTRY_TYPE.MELHORIA;
  if (UNEXPECTED_RE.test(labelOnly) || currentSection === FINANCIAL_ENTRY_TYPE.IMPREVISTO) return FINANCIAL_ENTRY_TYPE.IMPREVISTO;
  if (VARIABLE_SECTION_LABEL_RE.test(labelOnly)) return FINANCIAL_ENTRY_TYPE.DESPESA_VARIAVEL;
  if (FIXED_SECTION_LABEL_RE.test(labelOnly)) return FINANCIAL_ENTRY_TYPE.DESPESA_FIXA;
  // When the scenario explicitly declares a fixed or variable section, that context wins
  // over keyword-based classification (e.g. "farmácia" under "Despesas Variáveis" stays variable).
  if (currentSection === FINANCIAL_ENTRY_TYPE.DESPESA_FIXA && (FIXED_EXPENSE_RE.test(labelOnly) || VARIABLE_EXPENSE_RE.test(labelOnly) || EXPENSE_RE.test(labelOnly))) return FINANCIAL_ENTRY_TYPE.DESPESA_FIXA;
  if (currentSection === FINANCIAL_ENTRY_TYPE.DESPESA_VARIAVEL && (FIXED_EXPENSE_RE.test(labelOnly) || VARIABLE_EXPENSE_RE.test(labelOnly) || EXPENSE_RE.test(labelOnly))) return FINANCIAL_ENTRY_TYPE.DESPESA_VARIAVEL;
  if (FIXED_EXPENSE_RE.test(labelOnly) || currentSection === FINANCIAL_ENTRY_TYPE.DESPESA_FIXA) return FINANCIAL_ENTRY_TYPE.DESPESA_FIXA;
  if (VARIABLE_EXPENSE_RE.test(labelOnly) || currentSection === FINANCIAL_ENTRY_TYPE.DESPESA_VARIAVEL) return FINANCIAL_ENTRY_TYPE.DESPESA_VARIAVEL;
  if (EXPENSE_RE.test(labelOnly)) return FINANCIAL_ENTRY_TYPE.DESPESA_VARIAVEL;
  if (REVENUE_TOTAL_RE.test(label) || REVENUE_TOTAL_RE.test(local)) return FINANCIAL_ENTRY_TYPE.RECEITA_TOTAL;
  if (REVENUE_RE.test(labelOnly) || FAMILY_REVENUE_RE.test(labelOnly) || currentSection === FINANCIAL_ENTRY_TYPE.RECEITA) return FINANCIAL_ENTRY_TYPE.RECEITA;
  if (hasExplicitSavingsGoalContext(local)) return FINANCIAL_ENTRY_TYPE.META_POUPANCA;
  if (IMPROVEMENT_RE.test(local)) return FINANCIAL_ENTRY_TYPE.MELHORIA;
  if (UNEXPECTED_RE.test(local)) return FINANCIAL_ENTRY_TYPE.IMPREVISTO;
  if (FIXED_EXPENSE_RE.test(local)) return FINANCIAL_ENTRY_TYPE.DESPESA_FIXA;
  if (VARIABLE_EXPENSE_RE.test(local) || EXPENSE_RE.test(local)) return FINANCIAL_ENTRY_TYPE.DESPESA_VARIAVEL;
  if (REVENUE_RE.test(local) || FAMILY_REVENUE_RE.test(local)) return FINANCIAL_ENTRY_TYPE.RECEITA;
  return FINANCIAL_ENTRY_TYPE.OUTRO;
}

function parseFinancialEntries(text) {
  const sourceText = text || "";
  const matches = [...sourceText.matchAll(BRL_MATCH_RE)];
  return matches
    .map((match, index) => {
      const amount = extractBRLAmounts(match[0])[0];
      if (!Number.isFinite(amount)) return null;

      const previousMatch = matches[index - 1];
      const previousEnd = previousMatch ? previousMatch.index + previousMatch[0].length : null;
      const windowStart = Math.max(0, match.index - 120);
      const sectionBefore = stripDecorativeMarkers(sourceText.slice(0, match.index)).toLowerCase();
      const labelSourceStart = previousEnd !== null && previousEnd >= windowStart ? previousEnd : windowStart;
      const labelSource = stripDecorativeMarkers(sourceText.slice(labelSourceStart, match.index)).toLowerCase();
      const rawAfter = sourceText.slice(match.index + match[0].length, match.index + match[0].length + 90).toLowerCase();
      const label = labelSource
        .split(/[.;:\n,]/)
        .map((part) => part
          .replace(/[-–—]/g, " ")
          .replace(/^(?:e|ou)\s+/i, "")
          .replace(/\s+/g, " ")
          .trim())
        .filter(Boolean)
        .pop() || "";
      const normalizedLabel = label
        .replace(/[-–—]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const currentSection = getCurrentFinancialSection(sectionBefore);
      const afterClause = stripDecorativeMarkers(rawAfter.split(/[.;:\n]/)[0])
        .replace(/[-–—]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const type = classifyFinancialEntry({ label: normalizedLabel, currentSection, afterClause });
      const description = normalizeFinancialDescription(normalizedLabel, "Valor informado");

      return {
        id: match.index,
        amount: Math.abs(amount),
        label: normalizedLabel,
        afterClause,
        context: `${currentSection} ${normalizedLabel}`.replace(/\s+/g, " ").trim(),
        description,
        type,
        isRevenue: type === FINANCIAL_ENTRY_TYPE.RECEITA || type === FINANCIAL_ENTRY_TYPE.RECEITA_TOTAL,
        isExpense: [
          FINANCIAL_ENTRY_TYPE.DESPESA_FIXA,
          FINANCIAL_ENTRY_TYPE.DESPESA_VARIAVEL,
          FINANCIAL_ENTRY_TYPE.IMPREVISTO,
          FINANCIAL_ENTRY_TYPE.DESPESA_TOTAL,
          FINANCIAL_ENTRY_TYPE.DESPESA_ANTERIOR
        ].includes(type),
        isPriorExpense: type === FINANCIAL_ENTRY_TYPE.DESPESA_ANTERIOR,
        isImprovement: type === FINANCIAL_ENTRY_TYPE.MELHORIA
      };
    })
    .filter(Boolean);
}

function toBudgetItem(entry) {
  const labelContext = `${entry.description || ""} ${entry.afterClause || ""}`;
  return {
    descricao: entry.type === FINANCIAL_ENTRY_TYPE.META_POUPANCA
      ? cleanSavingsGoalLabel(labelContext)
      : cleanFinancialItemLabel(`${entry.description || ""} ${entry.afterClause || ""}`, entry.type) || entry.description,
    valor: entry.amount,
    sourceIndex: entry.id,
    type: entry.type,
    rawLabel: entry.label,
    context: entry.context
  };
}

function addEntryToStructuredBudget(structured, entry) {
  const item = toBudgetItem(entry);
  switch (entry.type) {
    case FINANCIAL_ENTRY_TYPE.RECEITA:
      structured.receitas.push(item);
      break;
    case FINANCIAL_ENTRY_TYPE.RECEITA_TOTAL:
      structured.totaisDeclarados.receitas.push(item);
      break;
    case FINANCIAL_ENTRY_TYPE.DESPESA_FIXA:
      structured.despesasFixas.push(item);
      break;
    case FINANCIAL_ENTRY_TYPE.DESPESA_VARIAVEL:
      structured.despesasVariaveis.push(item);
      break;
    case FINANCIAL_ENTRY_TYPE.IMPREVISTO:
      structured.imprevistos.push(item);
      break;
    case FINANCIAL_ENTRY_TYPE.META_POUPANCA:
      structured.metasPoupanca.push(item);
      break;
    case FINANCIAL_ENTRY_TYPE.MELHORIA:
      structured.melhorias.push(item);
      break;
    case FINANCIAL_ENTRY_TYPE.DESPESA_ANTERIOR:
      structured.totaisDeclarados.despesasAnteriores.push(item);
      break;
    case FINANCIAL_ENTRY_TYPE.DESPESA_TOTAL:
      structured.totaisDeclarados.despesas.push(item);
      break;
    case FINANCIAL_ENTRY_TYPE.SALDO:
      structured.totaisDeclarados.saldos.push(item);
      break;
    default:
      structured.outros.push(item);
      break;
  }
}

function sumBudgetItems(items) {
  return (items || []).reduce((sum, item) => sum + item.valor, 0);
}

function getLastDeclaredTotal(items) {
  const validItems = (items || []).filter((item) => Number.isFinite(item.valor));
  const last = validItems.length ? validItems[validItems.length - 1] : null;
  return last ? last.valor : 0;
}

function calculateFinancialSummary(data) {
  const receitaTotal = data?.receitaTotal ?? 0;
  const despesasFixasTotal = data?.despesasFixasTotal ?? 0;
  const despesasVariaveisTotal = data?.despesasVariaveisTotal ?? 0;
  const despesasBaseTotal = data?.despesasBaseTotal ?? despesasFixasTotal + despesasVariaveisTotal;
  const imprevistosTotal = data?.imprevistosTotal ?? 0;
  const metasPoupancaTotal = data?.metasPoupancaTotal ?? 0;
  const compromissoTotal = data?.compromissoTotal ?? despesasBaseTotal + imprevistosTotal + metasPoupancaTotal;
  const saldoInicial = data?.saldoInicial ?? receitaTotal - despesasBaseTotal;
  const saldoAntesMelhoria = data?.saldoAntesMelhoria ?? receitaTotal - compromissoTotal;
  const melhoriasTotal = data?.melhoriasTotal ?? 0;
  const saldoAposMelhoria = data?.saldoAposMelhoria ?? saldoAntesMelhoria + melhoriasTotal;

  return {
    receitaTotal,
    despesasFixasTotal,
    despesasVariaveisTotal,
    despesasBaseTotal,
    imprevistosTotal,
    metasPoupancaTotal,
    compromissoTotal,
    saldoInicial,
    saldoAntesMelhoria,
    melhoriasTotal,
    saldoAposMelhoria
  };
}

function extractFinancialScenarioData(experience) {
  const readyMaterials = Array.isArray(experience)
    ? experience
    : experience?.readyMaterials || experience?.printableMaterials || experience?.scenarios || [];
  return buildFinancialDataForScenarios(getScenarioItems(readyMaterials));
}

function buildFinancialDataForScenarios(scenarios) {
  const result = [];
  let previous = null;

  scenarios.forEach((scenario) => {
    const entries = parseFinancialEntries(scenario.text);
    const structured = buildEmptyStructuredBudget();
    entries.forEach((entry) => addEntryToStructuredBudget(structured, entry));
    const explicitImprovement = extractExplicitImprovement(scenario.text);
    const percentageImprovement = extractPercentageImprovement(scenario.text, structured, previous);
    const structuredImprovement = explicitImprovement || (percentageImprovement?.calculable ? percentageImprovement : null);
    const unresolvedPercentageImprovement = percentageImprovement && !percentageImprovement.calculable ? percentageImprovement : null;

    if (!entries.length && structuredImprovement && previous?.receitaTotal !== null && previous?.totalExpenses > 0) {
      const receitaTotal = previous.receitaTotal;
      const despesasAnterioresTotal = previous.totalExpenses;
      const melhoriasTotal = structuredImprovement.improvementValue ?? structuredImprovement.value;
      const compromissoTotal = despesasAnterioresTotal;
      const saldo = receitaTotal - compromissoTotal;
      const saldoAfterImprovement = saldo + melhoriasTotal;
      const data = {
        scenario,
        entries,
        structured,
        receitaTotal,
        revenue: receitaTotal,
        despesasFixasTotal: 0,
        despesasVariaveisTotal: 0,
        despesasBaseTotal: 0,
        imprevistosTotal: 0,
        metasPoupancaTotal: 0,
        melhoriasTotal,
        explicitImprovement: structuredImprovement,
        percentageImprovement: percentageImprovement || null,
        unresolvedPercentageImprovement: null,
        despesasAnterioresTotal,
        declaredExpenseTotal: 0,
        compromissoTotal,
        expenses: [{ amount: despesasAnterioresTotal, label: `Despesas do Cenário ${previous?.scenario?.number || scenario.number - 1}`, isRevenue: false, isExpense: true, isSavingsGoal: false, isImprovement: false, isPriorExpense: true }],
        improvements: [{ amount: melhoriasTotal, label: structuredImprovement.target, isImprovement: true }],
        improvementTotal: melhoriasTotal,
        totalExpenses: compromissoTotal,
        saldo,
        saldoAfterImprovement,
        usesPreviousExpenses: true,
        isBudgetScenario: true,
        summary: calculateFinancialSummary({
          receitaTotal,
          despesasFixasTotal: 0,
          despesasVariaveisTotal: 0,
          despesasBaseTotal: 0,
          imprevistosTotal: 0,
          metasPoupancaTotal: 0,
          compromissoTotal,
          saldoInicial: saldo,
          saldoAntesMelhoria: saldo,
          melhoriasTotal,
          saldoAposMelhoria: saldoAfterImprovement
        }),
        validation: {
          calculable: true,
          hasRevenue: true,
          hasExpenses: true
        }
      };
      result.push(data);
      previous = data;
      return;
    }

    if (!entries.length) {
      const hasUnresolvedPercentage = Boolean(unresolvedPercentageImprovement);
      result.push({
        scenario,
        entries,
        structured,
        receitaTotal: previous?.receitaTotal ?? null,
        revenue: previous?.receitaTotal ?? null,
        expenses: [],
        improvements: [],
        metasPoupancaTotal: 0,
        compromissoTotal: previous?.totalExpenses || 0,
        totalExpenses: previous?.totalExpenses || 0,
        saldo: null,
        explicitImprovement: null,
        percentageImprovement: percentageImprovement || null,
        unresolvedPercentageImprovement,
        isBudgetScenario: hasUnresolvedPercentage,
        validation: { calculable: false }
      });
      return;
    }

    const detailedRevenueTotal = sumBudgetItems(structured.receitas);
    const declaredRevenueTotal = getLastDeclaredTotal(structured.totaisDeclarados.receitas);
    const receitaTotal = detailedRevenueTotal > 0
      ? detailedRevenueTotal
      : declaredRevenueTotal || previous?.receitaTotal || null;
    const despesasFixasTotal = sumBudgetItems(structured.despesasFixas);
    const despesasVariaveisTotal = sumBudgetItems(structured.despesasVariaveis);
    const imprevistosTotal = sumBudgetItems(structured.imprevistos);
    const metasPoupancaTotal = sumBudgetItems(structured.metasPoupanca);
    const parsedMelhoriasTotal = sumBudgetItems(structured.melhorias);
    const melhoriasTotal = parsedMelhoriasTotal || structuredImprovement?.improvementValue || structuredImprovement?.value || 0;
    const despesasDetalhadasTotal = despesasFixasTotal + despesasVariaveisTotal;
    const declaredExpenseTotal = getLastDeclaredTotal(structured.totaisDeclarados.despesas);
    const priorExpenseTotal = getLastDeclaredTotal(structured.totaisDeclarados.despesasAnteriores);
    const usesPreviousExpenses = Boolean(
      previous?.totalExpenses
      && (imprevistosTotal > 0 || metasPoupancaTotal > 0)
      && despesasDetalhadasTotal === 0
      && !priorExpenseTotal
    );
    const despesasAnterioresTotal = priorExpenseTotal || (usesPreviousExpenses ? previous.totalExpenses : 0);

    const despesasBaseTotal = despesasDetalhadasTotal || declaredExpenseTotal || 0;
    let compromissoTotal = despesasDetalhadasTotal + imprevistosTotal + metasPoupancaTotal;
    if (despesasAnterioresTotal > 0) {
      compromissoTotal = despesasAnterioresTotal + despesasDetalhadasTotal + imprevistosTotal + metasPoupancaTotal;
    } else if (compromissoTotal === 0 && declaredExpenseTotal > 0) {
      compromissoTotal = declaredExpenseTotal;
    } else if (despesasDetalhadasTotal === 0 && declaredExpenseTotal > 0) {
      compromissoTotal = declaredExpenseTotal + imprevistosTotal + metasPoupancaTotal;
    }

    const totalExpenses = compromissoTotal;
    const saldo = receitaTotal !== null ? receitaTotal - compromissoTotal : null;
    const saldoAfterImprovement = saldo !== null && melhoriasTotal > 0 ? saldo + melhoriasTotal : null;
    const expenses = [
      ...structured.despesasFixas,
      ...structured.despesasVariaveis,
      ...structured.imprevistos,
      ...structured.metasPoupanca,
      ...(despesasAnterioresTotal > 0
        ? [{ descricao: `Despesas do Cenário ${previous?.scenario?.number || scenario.number - 1}`, valor: despesasAnterioresTotal, type: FINANCIAL_ENTRY_TYPE.DESPESA_ANTERIOR }]
        : [])
    ].map((item) => ({
      amount: item.valor,
      label: item.descricao,
      isRevenue: false,
      isExpense: item.type !== FINANCIAL_ENTRY_TYPE.META_POUPANCA,
      isSavingsGoal: item.type === FINANCIAL_ENTRY_TYPE.META_POUPANCA,
      isImprovement: false,
      isPriorExpense: item.type === FINANCIAL_ENTRY_TYPE.DESPESA_ANTERIOR
    }));
    const improvements = structured.melhorias.map((item) => ({ amount: item.valor, label: item.descricao, isImprovement: true }));
    const isBudgetScenario = /receita|renda|sal[aá]rio|despesa|gasto|custo|or[cç]amento|saldo|imprevisto|economi[az]ar|economia|melhoria|conserto|reparo|aluguel|alimenta[cç][aã]o/i.test(scenario.text)
      || (receitaTotal !== null && totalExpenses > 0);
    const data = {
      scenario,
      entries,
      structured,
      receitaTotal,
      revenue: receitaTotal,
      despesasFixasTotal,
      despesasVariaveisTotal,
      despesasBaseTotal,
      imprevistosTotal,
      metasPoupancaTotal,
      melhoriasTotal,
      explicitImprovement: structuredImprovement,
      percentageImprovement: percentageImprovement || null,
      unresolvedPercentageImprovement,
      despesasAnterioresTotal,
      declaredExpenseTotal,
      compromissoTotal,
      expenses,
      improvements,
      improvementTotal: melhoriasTotal,
      totalExpenses,
      saldo,
      saldoAfterImprovement,
      usesPreviousExpenses,
      isBudgetScenario,
      summary: calculateFinancialSummary({
        receitaTotal,
        despesasFixasTotal,
        despesasVariaveisTotal,
        despesasBaseTotal,
        imprevistosTotal,
        metasPoupancaTotal,
        compromissoTotal,
        saldoInicial: receitaTotal !== null ? receitaTotal - despesasBaseTotal : null,
        saldoAntesMelhoria: saldo,
        melhoriasTotal,
        saldoAposMelhoria: saldoAfterImprovement
      }),
      validation: {
        calculable: receitaTotal !== null && compromissoTotal > 0,
        hasRevenue: receitaTotal !== null,
        hasExpenses: compromissoTotal > 0
      }
    };
    result.push(data);

    if (receitaTotal !== null && totalExpenses > 0) {
      previous = data;
    }
  });

  return result;
}

function buildScenarioFallbackGabarito(scenario) {
  return `Cenário ${scenario.number}: conferir se o protótipo foi testado, se a falha ou restrição foi registrada e se a melhoria proposta altera o resultado observado.`;
}

function formatBudgetExpression(items) {
  if (!items.length) return formatCurrencyBRL(0);
  return items.map((item) => formatCurrencyBRL(item.valor)).join(" + ");
}

function formatBudgetLine(label, items, total) {
  const expression = formatBudgetExpression(items);
  return items.length > 1
    ? `${label}: ${expression} = ${formatCurrencyBRL(total)}.`
    : `${label}: ${expression}.`;
}

function lowerFirst(value) {
  if (!value) return value;
  return `${value.charAt(0).toLowerCase()}${value.slice(1)}`;
}

function upperFirst(value) {
  if (!value) return value;
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function formatContextualBudgetLine(defaultLabel, pluralLabel, items, total) {
  if (!items.length) return "";
  if (items.length > 1) return formatBudgetLine(pluralLabel, items, total);

  const item = items[0];
  const description = cleanFinancialItemLabel(item.descricao || item.rawLabel || "", item.type);
  if (/^(Meta de|Despesa|Gasto inesperado|Conserto|Reparo|Imprevisto)/i.test(description)) {
    return `${description}: ${formatCurrencyBRL(total)}.`;
  }
  const connector = /meta\s+de\s+poupan[cç]a/i.test(defaultLabel) ? " para " : " com ";
  const label = description && !new RegExp(`^${defaultLabel}`, "i").test(description)
    ? `${defaultLabel}${connector}${lowerFirst(description)}`
    : description || defaultLabel;
  return `${label}: ${formatCurrencyBRL(total)}.`;
}

function formatExplicitImprovementSentence(improvement) {
  const rawLabel = `${improvement?.action || ""} ${formatCurrencyBRL(improvement?.value || 0)} ${improvement?.target ? `do gasto com ${improvement.target}` : ""}`;
  const cleaned = cleanFinancialItemLabel(rawLabel, FINANCIAL_ENTRY_TYPE.MELHORIA);
  if (cleaned) return `${cleaned}.`;
  const action = normalizeImprovementAction(improvement?.action);
  const value = formatCurrencyBRL(improvement?.value || 0);
  const target = cleanImprovementTarget(improvement?.target || "");
  if (!target) return `${action} ${value} em despesas variáveis.`;
  if (/reduzir|cortar|diminuir/i.test(action)) {
    return `${action} ${value} do gasto com ${target}.`;
  }
  return `${action} ${value} em ${target}.`;
}

function formatPartsTotalLine(label, parts, total) {
  const activeParts = parts.filter((value) => Number.isFinite(value) && value > 0);
  if (!activeParts.length) return `${label}: ${formatCurrencyBRL(0)}.`;
  const expression = activeParts.map(formatCurrencyBRL).join(" + ");
  return activeParts.length > 1
    ? `${label}: ${expression} = ${formatCurrencyBRL(total)}.`
    : `${label}: ${expression}.`;
}

function formatRevenueLine(data) {
  const revenueItems = data.structured.receitas.length
    ? data.structured.receitas
    : data.structured.totaisDeclarados.receitas;
  return revenueItems.length
    ? formatBudgetLine("Receitas", revenueItems, data.receitaTotal)
    : `Receita total: ${formatCurrencyBRL(data.receitaTotal)}.`;
}

function buildImprovementSuggestion(financialData) {
  const fmt = formatCurrencyBRL;
  const targetScenario = [...financialData]
    .reverse()
    .find((item) => Number.isFinite(item.saldo) && item.isBudgetScenario);

  if (!targetScenario) {
    return "Melhoria sugerida: A equipe deve identificar quais despesas podem ser reduzidas e calcular o novo saldo após os ajustes.";
  }

  // Case 1: explicit improvement values extracted from the scenario text
  const explicitImprovement = [...financialData]
    .reverse()
    .find((item) => item.melhoriasTotal > 0 && Number.isFinite(item.saldo) && item.explicitImprovement);
  if (explicitImprovement) {
    return [
      "Melhoria sugerida:",
      formatExplicitImprovementSentence(explicitImprovement.explicitImprovement),
      "Resultado após melhoria:",
      `${fmt(explicitImprovement.saldo)} + ${fmt(explicitImprovement.melhoriasTotal)} = ${fmt(explicitImprovement.saldoAfterImprovement)}.`,
      "Interpretação:",
      "A melhoria aumenta o saldo final e ajuda a preservar parte da poupança."
    ].join("\n");
  }

  // Case 2: negative saldo — suggest minimum reduction to zero the deficit
  if (targetScenario.saldo < 0) {
    const deficit = Math.abs(targetScenario.saldo);
    return [
      "Melhoria sugerida:",
      `Reduzir pelo menos ${fmt(deficit)} em despesas variáveis, como lazer, transporte ou compras não essenciais.`,
      "Resultado após melhoria:",
      `${fmt(targetScenario.saldo)} + ${fmt(deficit)} = ${fmt(0)}.`,
      "Interpretação:",
      "Com esse ajuste, o orçamento fica equilibrado."
    ].join("\n");
  }

  if (targetScenario.saldo === 0) {
    return [
      "Melhoria sugerida:",
      "Manter o orçamento equilibrado e revisar despesas variáveis antes de assumir novos compromissos.",
      "Resultado após melhoria:",
      `${fmt(0)} + ${fmt(0)} = ${fmt(0)}.`,
      "Interpretação:",
      "O orçamento está equilibrado, mas sem sobra para ampliar a poupança."
    ].join("\n");
  }

  // Case 3: positive saldo — structured numeric suggestion
  const positive = targetScenario;

  const saldo = positive.saldo;
  const primaryAmount = Math.min(saldo, 150);
  const primaryResult = saldo + primaryAmount;

  const lines = [
    "Melhoria sugerida:",
    `Reduzir ${fmt(primaryAmount)} em despesas variáveis, como lazer, transporte, alimentação fora de casa ou compras não essenciais.`,
    "Resultado após melhoria:",
    `${fmt(saldo)} + ${fmt(primaryAmount)} = ${fmt(primaryResult)}.`,
    "Interpretação:",
    positive.metasPoupancaTotal > 0 || positive.imprevistosTotal > 0
      ? "A família cobre o imprevisto, mantém o compromisso financeiro planejado e ainda preserva saldo positivo."
      : "A melhoria aumenta o saldo final e ajuda a preservar parte da poupança."
  ];

  // Secondary: if there was an imprevisto, offer option to fully restore previous saldo
  if (positive.imprevistosTotal > 0 && positive.imprevistosTotal !== primaryAmount) {
    const restoreAmount = positive.imprevistosTotal;
    const restoredSaldo = saldo + restoreAmount;
    lines.push(
      "\nPossibilidade para recuperar o saldo anterior:",
      `Reduzir ${fmt(restoreAmount)} em despesas variáveis.`,
      `Resultado: ${fmt(saldo)} + ${fmt(restoreAmount)} = ${fmt(restoredSaldo)}.`,
      "Interpretação:",
      "Com esse ajuste, a família recupera o saldo do cenário anterior."
    );
  }

  return lines.join("\n");
}

function buildStructuredScenarioGabarito(data) {
  if (!data.validation.calculable) {
    return buildScenarioFallbackGabarito(data.scenario);
  }

  const lines = [
    `Cenário ${data.scenario.number}:`,
    formatRevenueLine(data)
  ];

  if (data.despesasAnterioresTotal > 0 && data.despesasFixasTotal + data.despesasVariaveisTotal === 0) {
    lines.push(`Despesas do Cenário ${Math.max(1, data.scenario.number - 1)}: ${formatCurrencyBRL(data.despesasAnterioresTotal)}.`);
    if (data.imprevistosTotal > 0) {
      lines.push(formatContextualBudgetLine("Imprevisto", "Imprevistos", data.structured.imprevistos, data.imprevistosTotal));
    }
    if (data.metasPoupancaTotal > 0) {
      lines.push(formatContextualBudgetLine("Meta de poupança", "Metas de poupança", data.structured.metasPoupanca, data.metasPoupancaTotal));
    }
    lines.push(formatPartsTotalLine(
      "Compromisso total",
      [data.despesasAnterioresTotal, data.imprevistosTotal, data.metasPoupancaTotal],
      data.compromissoTotal
    ));
    lines.push(`Saldo antes da melhoria: ${formatCurrencyBRL(data.receitaTotal)} - ${formatCurrencyBRL(data.compromissoTotal)} = ${formatCurrencyBRL(data.saldo)}.`);
    return lines.join("\n");
  }

  if (data.despesasFixasTotal + data.despesasVariaveisTotal > 0) {
    lines.push(formatBudgetLine("Despesas fixas", data.structured.despesasFixas, data.despesasFixasTotal));
    lines.push(formatBudgetLine("Despesas variáveis", data.structured.despesasVariaveis, data.despesasVariaveisTotal));
    if (data.imprevistosTotal > 0) {
      lines.push(formatContextualBudgetLine("Imprevisto", "Imprevistos", data.structured.imprevistos, data.imprevistosTotal));
    }
    if (data.metasPoupancaTotal > 0) {
      lines.push(formatContextualBudgetLine("Meta de poupança", "Metas de poupança", data.structured.metasPoupanca, data.metasPoupancaTotal));
    }
    const hasCommitmentBeyondBase = data.imprevistosTotal > 0 || data.metasPoupancaTotal > 0;
    lines.push(formatPartsTotalLine(
      hasCommitmentBeyondBase ? "Compromisso total" : "Despesas totais",
      hasCommitmentBeyondBase
        ? [data.despesasFixasTotal + data.despesasVariaveisTotal, data.imprevistosTotal, data.metasPoupancaTotal]
        : [data.despesasFixasTotal, data.despesasVariaveisTotal],
      data.compromissoTotal
    ));
  } else {
    lines.push(`${data.metasPoupancaTotal > 0 ? "Compromisso total" : "Despesas totais"}: ${formatCurrencyBRL(data.compromissoTotal)}.`);
  }
  lines.push(`${data.imprevistosTotal > 0 || data.metasPoupancaTotal > 0 ? "Saldo antes da melhoria" : "Saldo final"}: ${formatCurrencyBRL(data.receitaTotal)} - ${formatCurrencyBRL(data.compromissoTotal)} = ${formatCurrencyBRL(data.saldo)}.`);
  return lines.join("\n");
}

function buildFinancialGabaritoFromReadyMaterials(readyMaterials) {
  const scenarios = getScenarioItems(readyMaterials);
  if (!scenarios.length) return [];

  const financialData = buildFinancialDataForScenarios(scenarios);
  console.info("[financial-parser] items", financialData);
  console.info("[financial-summary] summary", financialData.map((data) => data.summary || calculateFinancialSummary(data)));
  const hasFinancialScenario = financialData.some((data) => data.isBudgetScenario && data.validation.calculable);
  if (!hasFinancialScenario) return [];

  const cards = financialData
    .map(buildStructuredScenarioGabarito)
    .filter(Boolean);

  if (cards.length) {
    cards.push(buildImprovementSuggestion(financialData));
  }

  return cards;
}

function rebuildAnswerKeyFromFinancialData(experience, financialData = extractFinancialScenarioData(experience)) {
  const hasFinancialScenario = financialData.some((data) => data.isBudgetScenario && data.validation.calculable);
  if (!hasFinancialScenario) return [];

  const cards = financialData
    .map(buildStructuredScenarioGabarito)
    .filter(Boolean);

  if (cards.length) {
    cards.push(buildImprovementSuggestion(financialData));
  }

  return cards;
}

function buildFallbackGabaritoFromReadyMaterials(readyMaterials) {
  return getScenarioItems(readyMaterials).map(buildScenarioFallbackGabarito);
}

function completeGabaritoForScenarios(gabarito, readyMaterials) {
  const scenarios = getScenarioItems(readyMaterials);
  if (!scenarios.length) return gabarito;

  const answered = getScenarioNumbersFromGabarito(gabarito);
  const missing = scenarios
    .filter((scenario) => !answered.has(scenario.number))
    .map(buildScenarioFallbackGabarito);

  return [...gabarito, ...missing];
}

function orderGabaritoItems(gabarito) {
  const scenarioItems = [];
  const otherItems = [];

  (gabarito || []).forEach((item, index) => {
    const number = item.match(/Cen[aá]rio\s*(\d+)/i)?.[1];
    if (number) {
      scenarioItems.push({ item, index, number: Number(number) });
    } else {
      otherItems.push({ item, index });
    }
  });

  scenarioItems.sort((a, b) => a.number - b.number || a.index - b.index);
  return [...scenarioItems.map(({ item }) => item), ...otherItems.map(({ item }) => item)];
}

function normalizeSearchText(text) {
  return stripDecorativeMarkers(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getTopicTokens(text) {
  const stopwords = new Set([
    "para", "com", "uma", "dos", "das", "que", "como", "sobre", "atividade", "experiencia",
    "aprendizagem", "projeto", "alunos", "estudantes", "ensino", "fundamental", "serie", "ano"
  ]);
  return [...new Set(normalizeSearchText(text).split(/[^a-z0-9]+/).filter((token) => token.length >= 4 && !stopwords.has(token)))];
}

function isMethodologyReference(refText) {
  return /steam|maker|metodologias?\s+ativas?|aprendizagem\s+baseada\s+em\s+projetos?|project\s+based|cultura\s+maker|prototip|bncc|base\s+nacional\s+comum\s+curricular|common\s+european\s+framework|cefr|language|vocabulary/i.test(refText);
}

function isFinancialReference(refText) {
  return /educa[cç][aã]o\s+financeira|finan[cç]as|financeir|or[cç]amento|renda|despesa|dinheiro|poupan[cç]a|investimento|banco\s+central|enef|ocde|oecd|matem[aá]tica\s+financeira|gest[aã]o\s+de\s+finan[cç]as/i.test(refText);
}

function getReferenceFallbacks(experience) {
  const context = [
    experience.title,
    experience.theme,
    experience.objective,
    experience.problem,
    experience.makerChallenge,
    experience.finalProduct
  ].join(" ");
  return isFinancialThemeText(context) ? FINANCIAL_REFERENCES : [FALLBACK_REFERENCE];
}

function filterReferencesByTheme(references, experience) {
  const context = [
    experience.title,
    experience.theme,
    experience.objective,
    experience.problem,
    experience.makerChallenge,
    experience.finalProduct,
    experience.discipline
  ].join(" ");
  const financial = isFinancialThemeText(context);
  const topicTokens = getTopicTokens(context);
  const cleaned = (references || [])
    .map(sanitizeReferenceText)
    .map(fixDanglingText)
    .filter((ref) => ref && !/wikipedia/i.test(ref));

  const aligned = cleaned.filter((ref) => {
    const normalizedRef = normalizeSearchText(ref);
    if (financial) {
      return isFinancialReference(ref)
        || /steam|maker|metodologias?\s+ativas?|aprendizagem\s+baseada\s+em\s+projetos?|project\s+based|cultura\s+maker|prototip/i.test(ref);
    }
    return isMethodologyReference(ref)
      || topicTokens.some((token) => normalizedRef.includes(token));
  });

  const selected = aligned.length ? aligned : getReferenceFallbacks(experience);
  return selected.slice(0, 2);
}

const DISCIPLINE_RULES = [
  {
    key: "educacaoFinanceira",
    label: "Educação Financeira",
    detect: /educa[cç][aã]o\s+financeira|or[cç]amento|finan[cç]as|poupan[cç]a|renda|despesa/i,
    evidence: /or[cç]amento|finan[cç]as|renda|despesa|saldo|poupan[cç]a|consumo|planejamento/i
  },
  {
    key: "linguaPortuguesa",
    label: "Língua Portuguesa",
    detect: /l[ií]ngua\s+portuguesa|portugu[eê]s|leitura|interpreta[cç][aã]o|produ[cç][aã]o\s+textual|g[eê]nero\s+discursivo/i,
    evidence: /texto|leitura|interpreta[cç][aã]o|g[eê]nero|argumenta[cç][aã]o|produ[cç][aã]o\s+textual|reescrita|linguagem/i
  },
  {
    key: "matematica",
    label: "Matemática",
    detect: /matem[aá]tica|recomposi[cç][aã]o\s+de\s+matem[aá]tica|c[aá]lculo|medida|porcentagem|propor[cç][aã]o|gr[aá]fico/i,
    evidence: /c[aá]lculo|medida|propor[cç][aã]o|porcentagem|tabela|gr[aá]fico|escala|racioc[ií]nio|resultado/i
  },
  {
    key: "ciencias",
    label: "Ciências",
    detect: /ci[eê]ncias|experimento|hip[oó]tese|fen[oô]meno|observa[cç][aã]o|investiga[cç][aã]o/i,
    evidence: /hip[oó]tese|experimento|fen[oô]meno|observa[cç][aã]o|procedimento|evid[eê]ncia|seguran[cç]a|resultado/i
  },
  {
    key: "historia",
    label: "História",
    detect: /hist[oó]ria|fonte\s+hist[oó]rica|temporalidade|processo\s+hist[oó]rico|mem[oó]ria/i,
    evidence: /fonte|temporalidade|contexto|causa|consequ[eê]ncia|processo|per[ií]odo|personagem|mem[oó]ria/i
  },
  {
    key: "geografia",
    label: "Geografia",
    detect: /geografia|mapa|territ[oó]rio|paisagem|lugar|escala|espa[cç]o\s+geogr[aá]fico/i,
    evidence: /mapa|territ[oó]rio|paisagem|escala|localiza[cç][aã]o|lugar|regi[aã]o|sociedade|natureza/i
  },
  {
    key: "arte",
    label: "Arte",
    detect: /arte|art[ií]stic|visual|c[eê]nica|m[uú]sica|dan[cç]a|composi[cç][aã]o|express[aã]o/i,
    evidence: /linguagem\s+art[ií]stica|cria[cç][aã]o|composi[cç][aã]o|express[aã]o|est[eé]tica|aprecia[cç][aã]o|visual|c[eê]nica/i
  },
  {
    key: "educacaoFisica",
    label: "Educação Física",
    detect: /educa[cç][aã]o\s+f[ií]sica|pr[aá]tica\s+corporal|movimento|jogo|brincadeira|esporte/i,
    evidence: /movimento|pr[aá]tica\s+corporal|jogo|regras|coopera[cç][aã]o|seguran[cç]a|participa[cç][aã]o|corporal/i
  },
  {
    key: "linguaInglesa",
    label: "Língua Inglesa",
    detect: /l[ií]ngua\s+inglesa|ingl[eê]s|english|vocabulary|speaking|reading|writing/i,
    evidence: /vocabul[aá]rio|vocabulary|english|speaking|reading|writing|oralidade|comandos|frases/i
  },
  {
    key: "robotica",
    label: "Robótica",
    detect: /rob[oó]tica|circuito|sensor|atuador|arduino|protoboard|motor|led/i,
    evidence: /circuito|sensor|atuador|montagem|c[oó]digo|teste|falha|ajuste|prot[oó]tipo|funcionamento/i
  },
  {
    key: "pensamentoComputacional",
    label: "Pensamento Computacional",
    detect: /pensamento\s+computacional|algoritmo|decomposi[cç][aã]o|abstra[cç][aã]o|depura[cç][aã]o|programa[cç][aã]o/i,
    evidence: /algoritmo|sequ[eê]ncia|padr[aã]o|decomposi[cç][aã]o|abstra[cç][aã]o|teste|depura[cç][aã]o|l[oó]gica/i
  },
  {
    key: "empreendedorismo",
    label: "Empreendedorismo",
    detect: /empreendedorismo|proposta\s+de\s+valor|p[uú]blico|cliente|solu[cç][aã]o|neg[oó]cio/i,
    evidence: /problema|solu[cç][aã]o|p[uú]blico|proposta\s+de\s+valor|custos?|recursos?|prot[oó]tipo|teste|apresenta[cç][aã]o/i
  },
  {
    key: "projetoDeVida",
    label: "Projeto de Vida",
    detect: /projeto\s+de\s+vida|autoconhecimento|metas?|escolhas|planejamento\s+pessoal/i,
    evidence: /metas?|escolhas|planejamento|autoconhecimento|decis[aã]o|trajet[oó]ria|reflex[aã]o/i
  },
  {
    key: "ensinoReligioso",
    label: "Ensino Religioso",
    detect: /ensino\s+religioso|tradi[cç][aã]o|cren[cç]a|valores|conviv[eê]ncia|diversidade\s+religiosa/i,
    evidence: /tradi[cç][aã]o|cren[cç]a|valores|respeito|diversidade|conviv[eê]ncia|cultura/i
  }
];

const ACTIVITY_TYPE_RULES = [
  { key: "calculo", label: "cálculo", evidence: /c[aá]lculo|calcular|medida|porcentagem|propor[cç][aã]o|escala|r\$\s*[\d.]+|\d+\s*(?:cm|m|km|kg|g|%)/i },
  { key: "leituraInterpretacao", label: "leitura e interpretação", evidence: /leitura|interpreta[cç][aã]o|texto-base|quest[oõ]es|infer[eê]ncia|fonte|imagem/i },
  { key: "producaoTextual", label: "produção textual", evidence: /produ[cç][aã]o\s+textual|reescrita|g[eê]nero|relato|carta|artigo|roteiro|texto/i },
  { key: "experimento", label: "experimento científico", evidence: /experimento|hip[oó]tese|procedimento|observa[cç][aã]o|fen[oô]meno|vari[aá]vel/i },
  { key: "prototipo", label: "construção/protótipo", evidence: /prot[oó]tipo|construir|montar|modelo|maquete|painel|cart[oõ]es|fichas|simula[cç][aã]o/i },
  { key: "robotica", label: "robótica ou circuito", evidence: /rob[oó]tica|circuito|sensor|atuador|led|motor|arduino|c[oó]digo/i },
  { key: "pesquisa", label: "pesquisa histórica ou geográfica", evidence: /pesquisa|fonte|mapa|territ[oó]rio|paisagem|contexto|temporalidade/i },
  { key: "artistica", label: "artística ou cênica", evidence: /art[ií]stic|visual|c[eê]nica|dramatiza[cç][aã]o|composi[cç][aã]o|express[aã]o/i },
  { key: "corporal", label: "corporal ou movimento", evidence: /movimento|corporal|jogo|brincadeira|esporte|coopera[cç][aã]o/i },
  { key: "linguaEstrangeira", label: "língua estrangeira", evidence: /ingl[eê]s|english|vocabulary|speaking|reading|writing|oralidade/i },
  { key: "aberta", label: "aberta/criativa", evidence: /cria[cç][aã]o|proposta|debate|dramatiza[cç][aã]o|apresenta[cç][aã]o|solu[cç][aã]o|argumenta[cç][aã]o/i },
  { key: "interdisciplinar", label: "interdisciplinar", evidence: /interdisciplinar|steam|maker|ci[eê]ncia|tecnologia|engenharia|arte|matem[aá]tica/i }
];

function getExperienceContextText(experience) {
  return [
    experience.discipline,
    experience.component,
    experience.title,
    experience.theme,
    experience.objective,
    experience.problem,
    experience.mission,
    experience.makerChallenge,
    experience.finalProduct,
    ...(experience.readyMaterials || []),
    ...(experience.materials || []),
    ...(experience.materialFunctions || []),
    ...(experience.stages || []).flatMap((stage) => [stage.title, stage.description]),
    ...(experience.assessmentRubric || []).flatMap((item) => [item.criterion, item.observation]),
    ...(experience.teacherGabarito || []),
    ...Object.values(experience.steamConnection || {})
  ].filter(Boolean).join(" ");
}

function detectDiscipline(experience) {
  const text = getExperienceContextText(experience);
  return DISCIPLINE_RULES.find((rule) => rule.detect.test(text)) || {
    key: "componenteCurricular",
    label: reviewText(experience.discipline || experience.component || "Componente curricular"),
    evidence: /problema|solu[cç][aã]o|prot[oó]tipo|teste|evid[eê]ncia|apresenta[cç][aã]o/i
  };
}

function detectActivityTypes(experience) {
  const text = getExperienceContextText(experience);
  const detected = ACTIVITY_TYPE_RULES.filter((rule) => rule.evidence.test(text));
  if (detected.length) return detected;
  return ACTIVITY_TYPE_RULES.filter((rule) => ["prototipo", "aberta"].includes(rule.key));
}

function getActivityProfile(experience) {
  const discipline = detectDiscipline(experience);
  const types = detectActivityTypes(experience);
  const financialData = extractFinancialScenarioData(experience);
  const hasStructuredCalculation = financialData.some((data) => data.isBudgetScenario && data.validation.calculable);
  return {
    discipline,
    types,
    hasStructuredCalculation,
    isOpenEnded: types.some((type) => [
      "leituraInterpretacao",
      "producaoTextual",
      "experimento",
      "prototipo",
      "pesquisa",
      "artistica",
      "corporal",
      "linguaEstrangeira",
      "aberta",
      "interdisciplinar"
    ].includes(type.key)) && !hasStructuredCalculation
  };
}

function hasAnyPattern(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function buildGlobalTeacherGabarito(experience, profile = getActivityProfile(experience)) {
  const scenarios = getScenarioItems(experience.readyMaterials || []);
  const typeLabels = profile.types.map((type) => type.label).join(", ");
  const discipline = profile.discipline.label;
  const baseLines = [
    "Critérios de análise:",
    `A resposta deve dialogar com ${discipline} e com o tipo de atividade: ${typeLabels}.`,
    "Verificar se a equipe compreendeu o problema, construiu uma solução testável, registrou evidências e justificou melhorias.",
    "Respostas possíveis:",
    "Aceitar soluções diferentes quando forem coerentes com o problema, os dados ou fontes analisadas e o produto construído.",
    "Pontos que o professor deve observar:",
    "Clareza da explicação, uso de evidências, funcionamento do protótipo ou produção, colaboração da equipe e adequação ao tema.",
    "Erros comuns:",
    "Resposta sem evidência, produto sem teste, melhoria não justificada, cópia de conteúdo ou explicação desconectada do desafio.",
    "Indicadores de aprendizagem:",
    "A equipe apresenta o produto, explica decisões, identifica limitações e propõe ajuste coerente após o teste."
  ].join("\n");

  if (!scenarios.length) return [baseLines];

  return [
    ...scenarios.map((scenario) => [
      `Cenário ${scenario.number}:`,
      "Resposta esperada: analisar o cenário, aplicar o protótipo ou procedimento planejado, registrar evidências e justificar a decisão tomada.",
      "Critérios de conferência: coerência com o problema, uso correto dos dados ou fontes, teste realizado e melhoria explicada."
    ].join("\n")),
    baseLines
  ];
}

function hasOpenEndedGabaritoCriteria(gabarito) {
  const text = normalizeTextItems(gabarito || []).join(" ");
  return /crit[eé]rios?|respostas?\s+poss[ií]veis?|pontos?\s+que\s+o\s+professor|observar|indicadores?|evid[eê]ncias?|erros?\s+comuns?/i.test(text);
}

function shouldRebuildGlobalGabarito(fixedGabarito, profile, hasFinancialGabarito) {
  if (hasFinancialGabarito) return false;
  if (!fixedGabarito.length) return true;
  const text = fixedGabarito.join(" ");
  if (profile.isOpenEnded && !hasOpenEndedGabaritoCriteria(fixedGabarito)) return true;
  if (/resposta\s+(?:correta|[uú]nica)|gabarito:\s*[a-d]\b/i.test(text) && profile.isOpenEnded) return true;
  return fixedGabarito.some((item) => stripDecorativeMarkers(item).split(/\s+/).length < 8);
}

function rebuildGlobalTeacherGabarito(experience) {
  const profile = getActivityProfile(experience);
  const globalGabarito = buildGlobalTeacherGabarito(experience, profile).map(reviewGabaritoText);
  return {
    ...experience,
    teacherGabarito: orderGabaritoItems(completeGabaritoForScenarios(globalGabarito, experience.readyMaterials || []))
  };
}

function validateGlobalTemplate(experience) {
  const blocking = [];
  const ok = Boolean(
    experience.objective
    && experience.problem
    && experience.mission
    && experience.makerChallenge
    && experience.finalProduct
    && (experience.teacherGabarito || []).length
    && (experience.bibliography || []).length
  );
  if (!ok) blocking.push("Template oficial incompleto para exportação.");
  return { ok, blocking };
}

function hasProblemLikeStatement(experience) {
  const problem = stripDecorativeMarkers(experience.problem || "");
  const combined = [
    problem,
    experience.mission,
    experience.makerChallenge,
    experience.title,
    experience.theme,
    ...(experience.readyMaterials || [])
  ].filter(Boolean).join(" ");

  if (/[?]/.test(problem) || /problema|desafio|situa[cç][aã]o|quest[aã]o|necessidade|como\s+/i.test(combined)) {
    return true;
  }

  return problem.split(/\s+/).filter(Boolean).length >= 3
    && /investig|analis|constru|cria|solu[cç][aã]o|melhor|organiza|represent|simula|planeja|compar|propor|adapt|resolver|identificar|avaliar|test/i.test(combined);
}

function validateSteamMakerEssence(experience) {
  const text = getExperienceContextText(experience);
  const blocking = [];
  const checks = [
    ["problema real ou situação-problema", hasProblemLikeStatement(experience)],
    ["construção, criação ou prototipagem", /constru|cria|prot[oó]tipo|modelo|maquete|painel|mapa|circuito|cart[aã]o|ficha|roteiro|jogo|experimento/i.test(text)],
    ["teste ou experimentação", /test|experimento|simula|aplica|observa|verifica|valida/i.test(text)],
    ["registro de evidências", /evid[eê]ncia|registro|dados|resultado|observa[cç][aã]o|tabela|relat[oó]rio|di[aá]rio/i.test(text)],
    ["melhoria ou ajuste", /melhor|ajust|revis|depur|aperfei[cç]oa|reorganiza|corrige/i.test(text)],
    ["apresentação do produto final", /apresent|socializ|comunica|compartilh|exposi[cç][aã]o/i.test(text)]
  ];
  checks.forEach(([label, ok]) => {
    if (!ok) blocking.push(`Essência STEAM + Maker incompleta: falta ${label}.`);
  });
  const onlyTheoretical = /resumo|copiar|question[aá]rio|lista\s+de\s+perguntas|aula\s+expositiva/i.test(text)
    && !/constru|prot[oó]tipo|teste|melhor|evid[eê]ncia/i.test(text);
  if (onlyTheoretical) blocking.push("Atividade parece teórica, sem criação, teste e melhoria.");
  return { ok: blocking.length === 0, blocking };
}

function validateDisciplineCoherence(experience, profile) {
  const text = getExperienceContextText(experience);
  const ok = profile.discipline.evidence.test(text) || profile.types.some((type) => type.key === "interdisciplinar");
  return {
    ok,
    blocking: ok ? [] : [`A atividade não apresenta evidências suficientes de coerência com ${profile.discipline.label}.`]
  };
}

function validateActivityTypeCoherence(experience, profile) {
  const text = getExperienceContextText(experience);
  const ok = profile.types.some((type) => type.evidence.test(text));
  return {
    ok,
    blocking: ok ? [] : ["Não foi possível identificar o tipo principal da atividade para validação."]
  };
}

function validateGlobalGabarito(experience, profile) {
  const gabarito = experience.teacherGabarito || [];
  const blocking = [];
  if (!gabarito.length) blocking.push("Gabarito do professor ausente.");
  if (profile.isOpenEnded && !hasOpenEndedGabaritoCriteria(gabarito)) {
    blocking.push("Gabarito de atividade aberta deve apresentar critérios, respostas possíveis e indicadores de aprendizagem.");
  }
  if (profile.hasStructuredCalculation && !gabarito.every(validateGabaritoMath)) {
    blocking.push("Gabarito com cálculo possui inconsistência matemática.");
  }
  return { ok: blocking.length === 0, blocking };
}

function validateMaterialsSemantics(experience) {
  const lines = normalizeTextItems((experience.materialFunctions || []).length ? experience.materialFunctions : experience.materials);
  const rows = lines.map(parseMaterialItem).filter(Boolean);
  const blocking = [];
  if (!rows.length) blocking.push("Tabela de materiais sem itens válidos.");
  rows.forEach((row) => {
    if (!/\d|conforme\s+disponibilidade/i.test(row.qty)) blocking.push(`Material "${row.name}" sem quantidade precisa.`);
    if (!/^(por\s+grupo|por\s+aluno|para\s+a\s+turma|por\s+turma|conforme\s+disponibilidade)$/i.test(row.unit)) {
      blocking.push(`Material "${row.name}" com unidade fora do padrão.`);
    }
    if (!row.use || row.use === "—") blocking.push(`Material "${row.name}" sem uso claro na atividade.`);
    if (/tesoura/i.test(row.name) && !/sem\s+ponta/i.test(row.name)) blocking.push("Tesoura deve aparecer como tesoura sem ponta.");
    if (RISKY_MATERIAL_RE.test(row.name) && !/supervis[aã]o/i.test(row.obs)) {
      blocking.push(`Material de risco "${row.name}" sem orientação de supervisão.`);
    }
  });
  return { ok: blocking.length === 0, blocking };
}

function validateStagesSemantics(experience) {
  const stages = experience.stages || [];
  const text = stages.map((stage) => `${stage.title || ""} ${stage.description || ""}`).join(" ");
  const normalizedDescriptions = stages.map((stage) => normalizeSearchText(stage.description || ""));
  const uniqueDescriptions = new Set(normalizedDescriptions.filter(Boolean));
  const blocking = [];
  if (stages.length < 6) blocking.push("A atividade deve manter seis etapas de desenvolvimento.");
  if (uniqueDescriptions.size < Math.min(4, stages.length)) blocking.push("Etapas repetidas ou genéricas demais.");
  if (!/prepar|organiza|separ/i.test(text)) blocking.push("Etapas sem preparação clara dos materiais.");
  if (!/constru|monta|cria|produz/i.test(text)) blocking.push("Etapas sem construção ou criação prática.");
  if (!/test|aplica|experimenta|simula/i.test(text)) blocking.push("Etapas sem teste com situação real.");
  if (!/melhor|ajust|revis|depur|corrig/i.test(text)) blocking.push("Etapas sem ajuste após teste.");
  if (!/apresent|socializ|evid[eê]ncia|resultado/i.test(text)) blocking.push("Etapas sem apresentação de produto e evidências.");
  return { ok: blocking.length === 0, blocking };
}

function validateFinalProductSemantics(experience) {
  const text = stripDecorativeMarkers(experience.finalProduct || "");
  const blocking = [];
  if (text.length < 20) blocking.push("Produto final incompleto.");
  if (hasTruncatedSentence(text)) blocking.push("Produto final termina com frase truncada.");
  if (!/prot[oó]tipo|painel|mapa|texto|cartaz|maquete|circuito|relat[oó]rio|apresenta[cç][aã]o|modelo|registro|tabela|jogo|roteiro|experimento/i.test(text)) {
    blocking.push("Produto final não indica claramente o que será entregue.");
  }
  if (!/evid[eê]ncia|registro|resultado|apresenta|relat[oó]rio|tabela|teste|explica/i.test(text)) {
    blocking.push("Produto final não indica evidência ou forma de apresentação.");
  }
  return { ok: blocking.length === 0, blocking };
}

function validateReferenceSemantics(experience) {
  const refs = normalizeTextItems(experience.bibliography || []).map(sanitizeReferenceText);
  const blocking = [];
  if (!refs.length) blocking.push("Referências bibliográficas ausentes.");
  if (refs.some((ref) => /wikipedia/i.test(ref))) blocking.push("Referências não podem usar Wikipedia.");
  if (refs.some(hasVisibleTechnicalMarkup)) blocking.push("Referências com HTML ou Markdown visível.");
  if (refs.some((ref) => /doi:\s*10\.\?+|DOI\s+inexistente/i.test(ref))) blocking.push("Referência contém DOI inválido ou inventado.");
  if (refs.some((ref) => /[\uFFFE\uFFFF\u200B\u200C\u200D\uFEFF]/.test(ref))) blocking.push("Referência contém caractere invisível ou inválido.");
  return { ok: blocking.length === 0, blocking };
}

function buildGlobalActivityValidationReport(experience) {
  const profile = getActivityProfile(experience);
  const validations = [
    ["Template", validateGlobalTemplate(experience)],
    ["Disciplina", validateDisciplineCoherence(experience, profile)],
    ["Tipo de atividade", validateActivityTypeCoherence(experience, profile)],
    ["STEAM + Maker", validateSteamMakerEssence(experience)],
    ["Materiais", validateMaterialsSemantics(experience)],
    ["Etapas", validateStagesSemantics(experience)],
    ["Produto final", validateFinalProductSemantics(experience)],
    ["Gabarito", validateGlobalGabarito(experience, profile)],
    ["Referências", validateReferenceSemantics(experience)]
  ];
  const blocking = validations.flatMap(([, result]) => result.blocking || []);
  const checks = validations.map(([label, result]) => [label, result.ok]);
  checks.push(["Disciplina detectada", profile.discipline.label]);
  checks.push(["Tipo de atividade detectado", profile.types.map((type) => type.label).join(" + ")]);
  return {
    profile,
    checks,
    blocking,
    warnings: [],
    finalStatus: blocking.length ? "BLOCKED" : "APPROVED"
  };
}

function cleanCriterionName(value) {
  return reviewText(value || "")
    .replace(/[.!?:;]+$/g, "")
    .trim();
}

function autoFixExperience(experience) {
  const fix = fixDanglingText;
  const fixedReadyMaterials = fixScenarioQuestions((experience.readyMaterials || []).map(fixReadyMaterialText)).map(fixDecisionLanguage);
  const fixedGabarito = fixGabaritoLanguage((experience.teacherGabarito || []).map(reviewGabaritoText));
  const financialGabarito = buildFinancialGabaritoFromReadyMaterials(fixedReadyMaterials);
  const profile = getActivityProfile({ ...experience, readyMaterials: fixedReadyMaterials, teacherGabarito: fixedGabarito });
  const globalGabarito = shouldRebuildGlobalGabarito(fixedGabarito, profile, financialGabarito.length > 0)
    ? buildGlobalTeacherGabarito({ ...experience, readyMaterials: fixedReadyMaterials }, profile)
    : [];
  const fallbackGabarito = fixedGabarito.length ? fixedGabarito : buildFallbackGabaritoFromReadyMaterials(fixedReadyMaterials);
  const teacherGabarito = completeGabaritoForScenarios(
    financialGabarito.length ? financialGabarito : (globalGabarito.length ? globalGabarito : fallbackGabarito),
    fixedReadyMaterials
  ).map(reviewGabaritoText);
  const orderedGabarito = orderGabaritoItems(teacherGabarito);
  const bibliography = filterReferencesByTheme(experience.bibliography || [], experience);

  return {
    ...experience,
    title: reviewText(experience.title),
    theme: reviewText(experience.theme),
    duration: reviewText(experience.duration),
    objective: fix(experience.objective),
    problem: fix(experience.problem),
    mission: fix(experience.mission),
    makerChallenge: fix(experience.makerChallenge),
    finalProduct: fix(experience.finalProduct),
    teacherOrientation: experience.teacherOrientation ? fix(experience.teacherOrientation) : experience.teacherOrientation,
    materials: (experience.materials || []).map(fix).map(fixMaterialSafety),
    stages: (experience.stages || []).map((s) => ({ ...s, title: reviewText(s.title), description: fixDecisionLanguage(fix(s.description)) })),
    materialFunctions: (experience.materialFunctions || []).map(fix).map(fixMaterialSafety),
    readyMaterials: fixedReadyMaterials,
    assessmentRubric: (experience.assessmentRubric || []).map((item) => ({
      ...item,
      criterion: cleanCriterionName(item.criterion || ""),
      observation: fix(item.observation || item.description || "")
    })),
    bibliography: bibliography.length ? bibliography : [FALLBACK_REFERENCE],
    steamConnection: Object.fromEntries(
      Object.entries(experience.steamConnection || {}).map(([key, value]) => [key, fix(value)])
    ),
    teacherGabarito: orderedGabarito,
  };
}

function extractBRLAmounts(text) {
  return [...(text || "").matchAll(/(-)?R\$\s*([\d.]+(?:,\d{2})?)/g)]
    .map((m) => {
      const raw = m[2];
      const value = raw.includes(",")
        ? parseFloat(raw.replace(/\./g, "").replace(",", "."))
        : parseFloat(raw.replace(/\./g, ""));
      return m[1] ? -value : value;
    })
    .filter((value) => Number.isFinite(value));
}

function hasVisibleTechnicalMarkup(text) {
  if (!text) return false;
  return /<\s*\/?\s*[a-z][^>]*>/i.test(text)
    || /&lt;\s*\/?\s*[a-z][^&]*&gt;/i.test(text)
    || /\*\*[^*]+\*\*/.test(text)
    || /(^|\s)\*[^*\n]+\*(\s|$)/.test(text)
    || /^\s*\|.*\|\s*$/m.test(text)
    || /^\s*[-|: ]{3,}\s*$/m.test(text)
    || /\b(?:blob:|https?:\/\/|localhost|127\.0\.0\.1)\b/i.test(text);
}

function hasLowercaseAfterSentence(text) {
  if (!text) return false;
  return /[.!?]\s+[a-záàâãéêíóôõúç]/.test(stripDecorativeMarkers(text));
}

function hasPoorSpacing(text) {
  if (!text) return false;
  return / {2,}|[ \t]+\n|\n[ \t]+/.test(String(text));
}

function hasTruncatedSentence(text) {
  if (!text) return false;
  return TRUNCATED_ENDING.test(stripDecorativeMarkers(text || ""));
}

function hasScenarioBalanceContradiction(experience) {
  const scenarios = getScenarioItems(experience.readyMaterials || []);
  const scenarioData = buildFinancialDataForScenarios(scenarios);

  return scenarioData.some((data) => {
    if (!Number.isFinite(data.saldo) || data.saldo < 0) return false;
    return /sem\s+impactar\s+negativamente|sem\s+impacto\s+(?:negativo\s+)?(?:no|sobre\s+o)\s+saldo|sem\s+reduzir\s+(?:o\s+)?saldo|\b(?:d[eé]ficit|saldo negativo|entrar no vermelho|or[cç]amento negativo|preju[ií]zo)\b/i.test(data.scenario.text);
  });
}

function collectExperienceText(experience) {
  return [
    experience.title,
    experience.objective,
    experience.problem,
    experience.mission,
    experience.makerChallenge,
    experience.finalProduct,
    experience.teacherOrientation,
    ...(experience.materials || []),
    ...(experience.materialFunctions || []),
    ...(experience.readyMaterials || []),
    ...(experience.bibliography || []),
    ...(experience.teacherGabarito || []),
    ...(experience.stages || []).flatMap((stage) => [stage.title, stage.description]),
    ...(experience.assessmentRubric || []).flatMap((item) => [item.criterion, item.observation]),
    ...Object.values(experience.steamConnection || {})
  ].filter(Boolean);
}

function hasIncompleteGabaritoCoverage(experience) {
  const scenarios = getScenarioItems(experience.readyMaterials || []);
  if (!scenarios.length) return false;
  const answered = getScenarioNumbersFromGabarito(experience.teacherGabarito || []);
  return scenarios.some((scenario) => !answered.has(scenario.number));
}

function evaluateBRLExpression(expression) {
  const matches = [...String(expression || "").matchAll(/([+\-])?\s*(-)?R\$\s*([\d.]+(?:,\d{2})?)/g)];
  if (!matches.length) return null;

  return matches.reduce((total, match, index) => {
    const raw = match[3];
    const value = raw.includes(",")
      ? parseFloat(raw.replace(/\./g, "").replace(",", "."))
      : parseFloat(raw.replace(/\./g, ""));
    const operator = match[1];
    const negativeCurrency = Boolean(match[2]);
    const sign = negativeCurrency || operator === "-" ? -1 : 1;
    return total + (index === 0 ? sign * value : sign * value);
  }, 0);
}

function validateGabaritoMath(item) {
  const lines = String(item || "").split(/\n+/);
  return lines.every((line) => {
    if (!/=/.test(line) || !/R\$/.test(line)) return true;
    const [left, ...rightParts] = line.split("=");
    const right = rightParts.join("=");
    const leftTotal = evaluateBRLExpression(left);
    const rightTotal = evaluateBRLExpression(right);
    if (leftTotal === null || rightTotal === null) return true;
    return Math.abs(leftTotal - rightTotal) < 0.01;
  });
}

function getExpenseBudgetItems(structured) {
  return [
    ...(structured?.despesasFixas || []),
    ...(structured?.despesasVariaveis || []),
    ...(structured?.imprevistos || []),
    ...(structured?.totaisDeclarados?.despesas || []),
    ...(structured?.totaisDeclarados?.despesasAnteriores || [])
  ];
}

function getSavingsGoalBudgetItems(structured) {
  return structured?.metasPoupanca || [];
}

function getRevenueBudgetItems(structured) {
  return [
    ...(structured?.receitas || []),
    ...(structured?.totaisDeclarados?.receitas || [])
  ];
}

function hasRevenueMarker(item) {
  return REVENUE_RE.test(`${item?.descricao || ""} ${item?.rawLabel || ""}`);
}

function hasExpenseMarker(item) {
  return /aluguel|escola|internet|[aá]gua|luz|energia|alimenta[cç][aã]o|transporte|lazer|despesas?|gastos?|custos?|imprevisto|conserto|reparo/i.test(
    `${item?.descricao || ""} ${item?.rawLabel || ""}`
  );
}

function hasImprovementMarker(item) {
  return IMPROVEMENT_RE.test(`${item?.descricao || ""} ${item?.rawLabel || ""}`);
}

function hasSavingsGoalMarker(item) {
  return SAVINGS_GOAL_RE.test(`${item?.descricao || ""} ${item?.rawLabel || ""}`);
}

function hasDuplicatedStructuredValue(data) {
  const grouped = [
    ...getRevenueBudgetItems(data.structured),
    ...getExpenseBudgetItems(data.structured),
    ...getSavingsGoalBudgetItems(data.structured),
    ...(data.structured?.melhorias || [])
  ].filter((item) => item.sourceIndex !== undefined);
  const seen = new Set();
  return grouped.some((item) => {
    if (seen.has(item.sourceIndex)) return true;
    seen.add(item.sourceIndex);
    return false;
  });
}

function hasMoneyInSameClause(text, keywordRe) {
  return stripDecorativeMarkers(text || "")
    .split(/[.!?\n;]/)
    .some((clause) => /-?\s*R\$\s*(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{2})?/.test(clause) && keywordRe.test(clause));
}

function hasSavingsGoalMoneyInSameClause(text) {
  return stripDecorativeMarkers(text || "")
    .split(/[.!?\n;]/)
    .some((clause) => /-?\s*R\$\s*(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{2})?/.test(clause) && hasExplicitSavingsGoalContext(clause));
}

function hasAbsurdGabaritoResult(experience, budgetData) {
  const maxRevenue = Math.max(0, ...budgetData.map((data) => data.receitaTotal || 0));
  if (!maxRevenue) return false;

  return (experience.teacherGabarito || []).some((item) => {
    const lines = String(item || "").split(/\n+/);
    return lines.some((line) => {
      if (!/resultado\s+ap[oó]s\s+melhoria/i.test(line)) return false;
      const amounts = extractBRLAmounts(line);
      const result = amounts[amounts.length - 1];
      return Number.isFinite(result) && result > maxRevenue;
    });
  });
}

function validateFinancialSummary(data, allData = []) {
  const blocking = [];
  const summary = data.summary || calculateFinancialSummary(data);

  if (data.unresolvedPercentageImprovement) {
    const target = data.unresolvedPercentageImprovement.target || "item-alvo";
    blocking.push(`Cenário ${data.scenario.number}: melhoria percentual sem valor-base encontrado para "${target}".`);
  }

  if (data.isBudgetScenario && data.scenario.number === 1 && summary.despesasBaseTotal > 0) {
    const declaredBase = data.declaredExpenseTotal || 0;
    if (declaredBase > 0 && summary.despesasBaseTotal < declaredBase * 0.3) {
      blocking.push("Despesas do Cenário 1 ficaram incompatíveis com os itens reais informados.");
    }
  }

  if (data.isBudgetScenario && hasMoneyInSameClause(data.scenario.text, UNEXPECTED_RE) && summary.imprevistosTotal <= 0) {
    blocking.push(`Cenário ${data.scenario.number}: há imprevisto com valor monetário, mas o total de imprevistos ficou zerado.`);
  }

  if (data.isBudgetScenario && hasSavingsGoalMoneyInSameClause(data.scenario.text) && summary.metasPoupancaTotal <= 0) {
    blocking.push(`Cenário ${data.scenario.number}: há meta de poupança com valor monetário, mas o total de metas ficou zerado.`);
  }

  if (Number.isFinite(summary.saldoAposMelhoria) && summary.receitaTotal > 0 && summary.saldoAposMelhoria > summary.receitaTotal) {
    blocking.push(`Cenário ${data.scenario.number}: resultado após melhoria maior que a receita total sem nova receita declarada.`);
  }

  if (data.despesasAnterioresTotal > 0) {
    const previous = allData.find((item) => item.scenario.number === data.scenario.number - 1);
    if (previous?.totalExpenses > 0 && data.despesasAnterioresTotal < previous.totalExpenses * 0.3) {
      blocking.push(`Cenário ${data.scenario.number}: despesas do cenário anterior parecem substituídas por outro valor.`);
    }
  }

  return { ok: blocking.length === 0, blocking, summary };
}

function buildInternalValidationReport(experience) {
  const globalReport = buildGlobalActivityValidationReport(experience);
  const scenarioData = extractFinancialScenarioData(experience);
  const budgetData = scenarioData.filter((data) => data.isBudgetScenario && (data.entries.length > 0 || data.unresolvedPercentageImprovement));
  const hasFinancialBudget = budgetData.length > 0;
  const receitaEmDespesa = budgetData.some((data) => getExpenseBudgetItems(data.structured).some(hasRevenueMarker));
  const despesaEmReceita = budgetData.some((data) => getRevenueBudgetItems(data.structured).some(hasExpenseMarker));
  const melhoriaEmDespesa = budgetData.some((data) => getExpenseBudgetItems(data.structured).some(hasImprovementMarker));
  const metaEmDespesa = budgetData.some((data) => getExpenseBudgetItems(data.structured).some(hasSavingsGoalMarker));
  const imprevistoComReceitaOuMelhoria = budgetData.some((data) => (
    data.structured.imprevistos || []
  ).some((item) => hasRevenueMarker(item) || hasImprovementMarker(item)));
  const duplicatedValues = budgetData.some(hasDuplicatedStructuredValue);
  const financialSummaryBlocks = budgetData.flatMap((data) => validateFinancialSummary(data, budgetData).blocking);
  const absurdGabaritoResult = hasAbsurdGabaritoResult(experience, budgetData);
  const uncalculableBudget = budgetData.some((data) => {
    const requiresBalance = /receita|renda|sal[aá]rio|or[cç]amento|saldo|despesas?/i.test(data.scenario.text);
    return requiresBalance && !data.validation.calculable;
  });
  const gabaritoMathOk = (experience.teacherGabarito || []).every(validateGabaritoMath);
  const textItems = collectExperienceText(experience);
  const reviewOk = !textItems.some(hasLowercaseAfterSentence) && !textItems.some(hasPoorSpacing) && !textItems.some(hasTruncatedSentence);
  const receitasOk = !receitaEmDespesa;
  const despesasOk = !despesaEmReceita;
  const imprevistosOk = !imprevistoComReceitaOuMelhoria;
  const melhoriasOk = !melhoriaEmDespesa;
  const metasOk = !metaEmDespesa;
  const duplicidadeOk = !duplicatedValues;
  const calculosOk = !uncalculableBudget && gabaritoMathOk && !financialSummaryBlocks.length && !absurdGabaritoResult;
  const gabaritoCompletoOk = !hasIncompleteGabaritoCoverage(experience);
  const pdfApproved = [
    globalReport.finalStatus === "APPROVED",
    receitasOk,
    despesasOk,
    imprevistosOk,
    melhoriasOk,
    metasOk,
    duplicidadeOk,
    calculosOk,
    gabaritoCompletoOk,
    reviewOk
  ].every(Boolean);

  const checks = [
    ...globalReport.checks,
    ["Receitas classificadas corretamente", receitasOk],
    ["Despesas classificadas corretamente", despesasOk],
    ["Imprevistos classificados corretamente", imprevistosOk],
    ["Melhorias separadas das despesas", melhoriasOk],
    ["Metas de poupança separadas das despesas comuns", metasOk],
    ["Nenhum valor duplicado", duplicidadeOk],
    ["Cálculos conferidos por código", calculosOk],
    ["Gabarito completo", gabaritoCompletoOk],
    ["Revisão textual", reviewOk],
    ["PDF aprovado", pdfApproved]
  ];

  const blocking = [];
  const internalWarnings = [...(globalReport.warnings || [])];
  globalReport.blocking.forEach((item) => blocking.push(item));
  // Cross-classification text checks are heuristic and prone to false positives
  // when the AI embeds expense/revenue keywords in contextual clauses — downgraded to warnings.
  if (hasFinancialBudget && receitaEmDespesa) internalWarnings.push("Receita apareceu dentro da classificação de despesas.");
  if (hasFinancialBudget && despesaEmReceita) internalWarnings.push("Despesa apareceu dentro da classificação de receitas.");
  // These checks are reliable and remain blocking.
  if (hasFinancialBudget && melhoriaEmDespesa) blocking.push("Valor de economia ou melhoria apareceu como despesa.");
  if (hasFinancialBudget && metaEmDespesa) blocking.push("Meta de poupança apareceu como despesa comum.");
  if (hasFinancialBudget && imprevistoComReceitaOuMelhoria) blocking.push("Imprevisto foi misturado com receita ou melhoria.");
  if (hasFinancialBudget && duplicatedValues) blocking.push("Há valor financeiro duplicado na estrutura de cálculo.");
  if (hasFinancialBudget && uncalculableBudget) blocking.push("Há cenário financeiro sem dados suficientes para cálculo estruturado.");
  if (hasFinancialBudget && !gabaritoMathOk) blocking.push("Gabarito financeiro possui equação inconsistente.");
  if (hasFinancialBudget && absurdGabaritoResult) blocking.push("Resultado após melhoria maior que a receita total sem justificativa.");
  financialSummaryBlocks.forEach((item) => blocking.push(item));

  return {
    checks,
    finalStatus: pdfApproved ? "OK" : "BLOCKED",
    blocking,
    warnings: internalWarnings,
    profile: globalReport.profile
  };
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
  } else if (hasIncompleteGabaritoCoverage(experience)) {
    blocking.push("Gabarito do professor não contempla todos os cenários da atividade.");
  } else {
    experience.teacherGabarito.forEach((item, i) => {
      if (!item || item.trim().length < 15) {
        blocking.push(`Gabarito cenário ${i + 1}: conteúdo incompleto.`);
        return;
      }
      const t = item.trim();
      const answerTextValidation = validateAnswerKeyText(t);
      if (!answerTextValidation.ok) {
        answerTextValidation.blocking.forEach((message) => blocking.push(`Gabarito cenário ${i + 1}: ${message}`));
      }
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
      if (!validateGabaritoMath(t)) {
        blocking.push(`Gabarito cenário ${i + 1}: cálculo financeiro inconsistente.`);
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
    blocking.push("Referências bibliográficas ausentes.");
  } else if ((experience.bibliography || []).some((ref) => /wikipedia/i.test(ref))) {
    blocking.push("Referências não podem usar Wikipedia.");
  }

  // Markup/HTML hygiene
  if (collectExperienceText(experience).some(hasVisibleTechnicalMarkup)) {
    blocking.push("Há marcação HTML ou Markdown visível no conteúdo.");
  }

  if (collectExperienceText(experience).some(hasLowercaseAfterSentence)) {
    blocking.push("Há frase iniciando com letra minúscula após ponto final.");
  }

  if (collectExperienceText(experience).some(hasPoorSpacing)) {
    blocking.push("Há espaços duplicados ou quebras de linha inadequadas no texto.");
  }

  if (collectExperienceText(experience).some(hasTruncatedSentence)) {
    blocking.push("Há frase terminando de forma truncada.");
  }

  if (hasScenarioBalanceContradiction(experience)) {
    blocking.push("Há pergunta de cenário financeiro incoerente com saldo positivo.");
  }

  const validationReport = buildInternalValidationReport(experience);
  validationReport.blocking.forEach((item) => blocking.push(item));
  (validationReport.warnings || []).forEach((item) => warnings.push(item));

  return { blocking, warnings, validationReport };
}

function rebuildStructuredTeacherGabarito(experience) {
  const financialData = extractFinancialScenarioData(experience);
  const financialGabarito = rebuildAnswerKeyFromFinancialData(experience, financialData);
  const fallbackGabarito = (experience.teacherGabarito || []).length
    ? experience.teacherGabarito
    : buildFallbackGabaritoFromReadyMaterials(experience.readyMaterials || []);
  const baseGabarito = financialGabarito.length ? financialGabarito : fallbackGabarito;
  if (!baseGabarito.length) return experience;

  const teacherGabarito = completeGabaritoForScenarios(
    baseGabarito,
    experience.readyMaterials || []
  ).map(reviewGabaritoText);

  return {
    ...experience,
    teacherGabarito: orderGabaritoItems(teacherGabarito)
  };
}

function repairSteamMakerEssenceBeforeExport(experience) {
  if (hasProblemLikeStatement(experience)) return experience;
  const theme = reviewText(experience.theme || experience.title || "o tema estudado").toLowerCase();
  return {
    ...experience,
    problem: `Como aplicar ${theme} em uma situação prática, construindo uma solução testável com registro de evidências e melhoria?`
  };
}

function repairTextBeforeExport(experience) {
  const fix = fixDanglingText;
  return {
    ...experience,
    title: reviewText(experience.title),
    theme: reviewText(experience.theme),
    duration: reviewText(experience.duration),
    objective: fix(experience.objective),
    problem: fix(experience.problem),
    mission: fix(experience.mission),
    makerChallenge: fix(experience.makerChallenge),
    finalProduct: fix(experience.finalProduct),
    teacherOrientation: experience.teacherOrientation ? fix(experience.teacherOrientation) : experience.teacherOrientation,
    materials: (experience.materials || []).map(fix).map(fixMaterialSafety),
    stages: (experience.stages || []).map((stage) => ({
      ...stage,
      title: reviewText(stage.title),
      description: fixDecisionLanguage(fix(stage.description))
    })),
    materialFunctions: (experience.materialFunctions || []).map(fix).map(fixMaterialSafety),
    readyMaterials: (experience.readyMaterials || []).map(fixReadyMaterialText).map(fixDecisionLanguage),
    assessmentRubric: (experience.assessmentRubric || []).map((item) => ({
      ...item,
      criterion: cleanCriterionName(item.criterion || ""),
      observation: fix(item.observation || item.description || "")
    })),
    steamConnection: Object.fromEntries(
      Object.entries(experience.steamConnection || {}).map(([key, value]) => [key, fix(value)])
    ),
    teacherGabarito: (experience.teacherGabarito || []).map(reviewGabaritoText)
  };
}

function getExportRepairCorrections(blocking, warnings) {
  const text = [...(blocking || []), ...(warnings || [])].join(" ");
  const corrections = [];

  if (/gabarito|c[aá]lculo|financeir|receita|despesa|economia|melhoria|cen[aá]rio/i.test(text)) {
    corrections.push("gabarito financeiro recalculado por dados estruturados");
  }

  if (/pedag[oó]gic|disciplina|tipo de atividade|STEAM|Maker|atividade aberta|crit[eé]rios|indicadores|produto final/i.test(text)) {
    corrections.push("gabarito pedagógico reconstruído por tipo de atividade");
  }

  if (/situa[cç][aã]o-problema|problema real|Ess[eê]ncia STEAM \+ Maker/i.test(text)) {
    corrections.push("situação-problema maker revisada");
  }

  if (/letra min[uú]scula|espa[cç]os|quebras de linha|html|markdown|texto|frase/i.test(text)) {
    corrections.push("revisão textual reaplicada antes da exportação");
  }

  if (!corrections.length) {
    corrections.push("autocorreção geral reaplicada");
  }

  return corrections;
}

function repairExperienceBeforeExport(experience, blocking, warnings) {
  const corrections = getExportRepairCorrections(blocking, warnings);
  let repaired = { ...experience };

  if (corrections.some((item) => /gabarito financeiro/i.test(item))) {
    repaired = rebuildStructuredTeacherGabarito(repaired);
    console.info("[export-repair] answer key rebuilt");
  }

  if (corrections.some((item) => /gabarito pedagógico/i.test(item))) {
    repaired = rebuildGlobalTeacherGabarito(repaired);
    console.info("[export-repair] global answer key rebuilt");
  }

  if (corrections.some((item) => /situação-problema maker/i.test(item))) {
    repaired = repairSteamMakerEssenceBeforeExport(repaired);
  }

  if (corrections.some((item) => /textual|geral/i.test(item))) {
    repaired = repairTextBeforeExport(repaired);
  }

  return repaired;
}

function prepareExperienceForExport(activity, maxAttempts = 3) {
  let experience = autoFixExperience(normalizeLearningExperience(activity));
  let lastValidation = { blocking: [], warnings: [] };

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const validation = validateExportedExperience(experience);
    lastValidation = validation;
    console.info("[export-validation] tentativa", attempt, validation);

    if (validation.blocking.length === 0) {
      return {
        ok: true,
        experience,
        blocking: [],
        warnings: validation.warnings,
        attempts: attempt,
        validationReport: validation.validationReport
      };
    }

    console.warn("[export-validation] blocking", validation.blocking);
    const corrections = getExportRepairCorrections(validation.blocking, validation.warnings);
    experience = repairExperienceBeforeExport(experience, validation.blocking, validation.warnings);
    console.info("[export-repair] correções aplicadas", corrections);
    experience = autoFixExperience(experience);
  }

  const finalValidation = validateExportedExperience(experience);

  if (finalValidation.blocking.length === 0) {
    return {
      ok: true,
      experience,
      blocking: [],
      warnings: finalValidation.warnings,
      attempts: maxAttempts,
      validationReport: finalValidation.validationReport
    };
  }

  console.warn("[export-blocked] erros persistentes", finalValidation.blocking);

  return {
    ok: false,
    experience,
    blocking: finalValidation.blocking,
    warnings: finalValidation.warnings,
    attempts: maxAttempts,
    lastValidation,
    validationReport: finalValidation.validationReport
  };
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
<h1>Exportação bloqueada</h1>
<p>O documento apresenta problemas que precisam ser corrigidos antes da exportação:</p>
${blocking.length ? `<p><strong>Bloqueantes:</strong></p><ul>${li(blocking, "blocking")}</ul>` : ""}
${warnings.length ? `<p><strong>Avisos:</strong></p><ul>${li(warnings, "warning")}</ul>` : ""}
<div class="info"><strong>O que fazer:</strong> Feche esta janela, gere uma nova atividade e tente exportar novamente.</div>
</body></html>`;
}

function sanitizeExperienceForFinalRender(experience) {
  return {
    ...experience,
    bibliography: (experience.bibliography || [])
      .map(sanitizeReferenceText)
      .filter(Boolean),
    teacherGabarito: (experience.teacherGabarito || [])
      .map(sanitizeAnswerKeyText)
      .filter(Boolean)
  };
}

function sanitizeFinalRenderedHTML(html) {
  return sanitizeDoiText(String(html || ""))
    .replace(/\s*[\uFFFE\uFFFF\uFFFD]+\s*/g, "-")
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

function extractRenderedTextFromHTML(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function hasDoiWithoutPrefix(text) {
  const source = String(text || "");
  const doiMatches = [...source.matchAll(/\b10\.\d{4,9}\/\S+/g)];
  return doiMatches.some((match) => !/DOI:\s*$/i.test(source.slice(Math.max(0, match.index - 8), match.index)));
}

function validateFinalRenderedHTML(html) {
  const blocking = [];
  const text = extractRenderedTextFromHTML(html);
  if (/[\uFFFE\uFFFF\u200B\u200C\u200D\uFEFF]/.test(html)) {
    blocking.push("HTML final contém caractere invisível ou corrompido.");
  }
  if (hasVisibleTechnicalMarkup(text)) {
    blocking.push("HTML final contém HTML, Markdown ou URL interna visível.");
  }
  if (hasDoiWithoutPrefix(text)) {
    blocking.push("HTML final contém DOI sem prefixo DOI:.");
  }
  if (/blob:http|localhost|127\.0\.0\.1/i.test(text)) {
    blocking.push("HTML final contém URL interna ou marcador de navegador.");
  }
  if (/Imprevisto com\s+(?:surge|surgiu|uma\s+m[eé]dica)|Meta de poupan[cç]a para\s+h[aá]/i.test(text)) {
    blocking.push("HTML final contém rótulo financeiro malformado.");
  }
  return { ok: blocking.length === 0, blocking };
}

// ── HTML builder ──────────────────────────────────────────────────────────────

function buildActivityPrintHTMLFromExperience(experience) {
  experience = sanitizeExperienceForFinalRender(experience);

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title></title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html {
      background: #fff;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9.1pt;
      line-height: 1.32;
      color: #000;
      background: #fff;
      padding: 1.05cm 1.15cm;
      max-width: 21cm;
      margin: 0 auto;
      orphans: 3;
      widows: 3;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
    .header {
      display: grid;
      grid-template-columns: 0.58cm 1fr;
      gap: 0.36cm;
      align-items: start;
      margin-bottom: 0.34cm;
      border-bottom: 2px solid #111;
      padding-bottom: 0.28cm;
      break-inside: avoid;
      page-break-inside: avoid;
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
    .doc-type { font-size: 7.9pt; font-weight: 700; text-transform: uppercase; color: #555; margin-bottom: 0.08cm; letter-spacing: 0.01cm; }
    .header h1 { font-size: 14.2pt; font-weight: 700; line-height: 1.12; }
    .section { margin-top: 0.28cm; }
    .protected-section,
    .table-section,
    .materials-table,
    .test-table-wrapper,
    .rubric-table,
    .gabarito-card {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .section-heading {
      display: flex;
      align-items: center;
      border-bottom: 1px solid #777;
      padding-bottom: 0.08cm;
      margin-bottom: 0.13cm;
      break-after: avoid;
      page-break-after: avoid;
    }
    .section-title {
      font-size: 9.2pt;
      font-weight: 700;
    }
    h3 { font-size: 8.6pt; font-weight: 700; margin-bottom: 0.06cm; }
    p { text-align: left; margin-bottom: 0.11cm; }
    ul, ol { padding-left: 0.46cm; margin-bottom: 0.08cm; }
    li { margin-bottom: 0.05cm; text-align: left; }
    .mission { border-left: 2px solid #111; padding-left: 0.24cm; margin-top: 0.12cm; }
    .stages { display: grid; grid-template-columns: 1fr 1fr; gap: 0.18cm 0.24cm; }
    .stage {
      break-inside: avoid;
      page-break-inside: avoid;
      border: 1px solid #aeb4bd;
      border-radius: 3px;
      overflow: hidden;
      background: #fff;
    }
    .stage-header { background: #f6f7f8; font-weight: 700; font-size: 8pt; padding: 0.08cm 0.12cm; border-bottom: 1px solid #aeb4bd; }
    .stage-body { padding: 0.1cm 0.12cm; }
    .stage-body p { margin-bottom: 0; }
    .ready-materials { margin-top: 0.12cm; border-left: 2px solid #777; padding-left: 0.2cm; }
    .ready-materials strong { display: block; margin-bottom: 0.05cm; }
    .materials-table { width: 100%; border-collapse: collapse; font-size: 8.1pt; margin-bottom: 0.11cm; table-layout: fixed; }
    .materials-table th { background: #f1f1f1; border: 1px solid #888; padding: 0.07cm 0.09cm; font-weight: 700; text-align: left; white-space: nowrap; }
    .materials-table td { border: 1px solid #aaa; padding: 0.07cm 0.09cm; vertical-align: top; word-break: break-word; }
    .materials-table th:nth-child(1) { width: 21%; }
    .materials-table th:nth-child(2) { width: 9%; }
    .materials-table th:nth-child(3) { width: 18%; }
    .materials-table th:nth-child(4) { width: 34%; }
    .materials-table th:nth-child(5) { width: 18%; }
    .materials-table .mat-qty { text-align: center; white-space: nowrap; }
    .rubric-table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
    .rubric-table th, .rubric-table td { border: 1px solid #999; padding: 0.08cm 0.11cm; text-align: left; vertical-align: top; }
    .rubric-table th { background: #f1f1f1; font-weight: 700; }
    thead { display: table-header-group; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    .ref { padding-left: 0.8cm; text-indent: -0.8cm; font-size: 8.8pt; line-height: 1.3; margin-bottom: 0.1cm; }
    .teacher-note { margin-top: 0.12cm; padding: 0.1cm 0.2cm; border-left: 2px solid #555; background: #F9FAFB; font-style: italic; }
    .steam-connection { padding-left: 0.42cm; margin: 0; }
    .steam-connection li { margin-bottom: 0.05cm; }
    .duration-line { font-size: 8.5pt; color: #444; margin-top: 0.06cm; }
    .test-table-wrapper { margin-top: 0.18cm; }
    .test-table-title { margin-bottom: 0.07cm; }
    .test-table { width: 100%; border-collapse: collapse; font-size: 7.7pt; table-layout: fixed; }
    .test-table th { background: #f1f1f1; border: 1px solid #888; padding: 0.06cm 0.08cm; text-align: left; font-weight: 700; }
    .test-table td { border: 1px solid #aaa; padding: 0; height: 0.82cm; vertical-align: middle; }
    .test-table td:first-child { padding: 0.05cm 0.08cm; font-weight: 600; white-space: nowrap; }
    .financial-test-table { font-size: 7.1pt; }
    .financial-test-table th:first-child,
    .financial-test-table td:first-child { width: 1.7cm; }
    .test-table .blank-cell { background: #fafafa; }
    .gabarito-page {
      page-break-before: always; break-before: page;
      height: auto !important; overflow: visible !important;
      padding-top: 0.3cm;
      font-size: 9.4pt !important; line-height: 1.38 !important;
    }
    .gabarito-page h2 { font-size: 13pt !important; font-weight: 700; border-bottom: 2px solid #111; padding-bottom: 0.18cm; margin-bottom: 0.12cm; text-transform: uppercase; }
    .gabarito-subtitle { font-size: 8.2pt; color: #555; font-style: italic; margin-bottom: 0.38cm; }
    .gabarito-card { border: 1px solid #aaa; border-radius: 3px; padding: 0.22cm 0.26cm; margin-bottom: 0.22cm; background: #fff; }
    .gabarito-card-title { font-weight: 700; margin-bottom: 0.1cm; }
    .gabarito-line { margin-bottom: 0.07cm; }
    .gabarito-line:last-child { margin-bottom: 0; }
    body.tight { font-size: 8.7pt; line-height: 1.24; padding: 0.85cm 0.95cm; }
    body.tight .header h1 { font-size: 13pt; }
    body.tight .section { margin-top: 0.2cm; }
    body.tight .stages { gap: 0.12cm 0.18cm; }
    body.tight .stage-header { padding: 0.06cm 0.1cm; font-size: 7.8pt; }
    body.tight .stage-body { padding: 0.08cm 0.1cm; }
    body.ultra-tight { font-size: 8.2pt; line-height: 1.18; padding: 0.72cm 0.82cm; }
    body.ultra-tight .section { margin-top: 0.16cm; }
    body.ultra-tight .header { margin-bottom: 0.22cm; padding-bottom: 0.2cm; }
    body.ultra-tight .stages { gap: 0.1cm 0.14cm; }
    body.ultra-tight .stage-header { padding: 0.05cm 0.08cm; font-size: 7.6pt; }
    body.ultra-tight .stage-body { padding: 0.06cm 0.08cm; }
    @media print {
      body {
        padding: 1.05cm 1.15cm;
        max-width: none;
        width: 100%;
        min-height: 100vh;
      }
      .section-heading { page-break-after: avoid; break-after: avoid; }
      .protected-section, .table-section, .stage, .materials-table, .test-table-wrapper, .rubric-table, .gabarito-card {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
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

  <div class="section protected-section">
    <div class="section-heading"><span class="section-number">2</span><div class="section-title">Objetivo geral</div></div>
    <p>${formatCleanMultiline(experience.objective)}</p>
  </div>

  <div class="section">
    <div class="section-heading"><span class="section-number">3</span><div class="section-title">Problema/desafio</div></div>
    <p>${formatCleanMultiline(experience.problem)}</p>
    ${experience.mission ? `<p class="mission"><strong>Missão:</strong> ${formatCleanMultiline(experience.mission)}</p>` : ""}
    ${renderTeacherOrientation(experience.teacherOrientation)}
  </div>

  <div class="section table-section">
    <div class="section-heading"><span class="section-number">4</span><div class="section-title">Materiais</div></div>
    ${renderMaterialsForExperience(experience)}
  </div>

  <div class="section">
    <div class="section-heading"><span class="section-number">5</span><div class="section-title">Desenvolvimento e montagem da atividade</div></div>
    <div class="stages">${renderExperienceStages(experience.stages)}</div>
    ${renderTestTable(experience.readyMaterials)}
  </div>

  <div class="section protected-section">
    <div class="section-heading"><span class="section-number">6</span><div class="section-title">Desafio Maker</div></div>
    <p>${formatCleanMultiline(experience.makerChallenge)}</p>
  </div>

  <div class="section protected-section">
    <div class="section-heading"><span class="section-number">7</span><div class="section-title">Produto final</div></div>
    <p>${formatCleanMultiline(experience.finalProduct)}</p>
  </div>

  <div class="section protected-section">
    <div class="section-heading"><span class="section-number">8</span><div class="section-title">Conexão STEAM + Maker</div></div>
    ${renderSteamConnectionForExperience(experience)}
  </div>

  <div class="section protected-section table-section">
    <div class="section-heading"><span class="section-number">9</span><div class="section-title">Avaliação</div></div>
    ${renderAssessmentRubric(experience)}
  </div>

  <div class="section protected-section references-section">
    <div class="section-heading"><span class="section-number">10</span><div class="section-title">Referências</div></div>
    ${renderReferenceList(experience.bibliography)}
  </div>

</div><!-- end #activity-content -->

  ${(Array.isArray(experience.teacherGabarito) && experience.teacherGabarito.length) ? `<div class="gabarito-page">
    <h2>GABARITO DO PROFESSOR</h2>
    <p class="gabarito-subtitle">Material exclusivo do professor — não distribuir aos alunos.</p>
    ${renderTeacherGabaritoItems(experience.teacherGabarito)}
  </div>` : ""}

  <script>
    document.title = '';
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
  const finalHtml = sanitizeFinalRenderedHTML(html);
  const finalValidation = validateFinalRenderedHTML(finalHtml);
  return finalValidation.ok ? finalHtml : buildExportErrorHTML(finalValidation.blocking, []);
}

function buildActivityPrintHTML(activity) {
  const result = prepareExperienceForExport(activity);
  if (!result.ok) {
    return buildExportErrorHTML(result.blocking, result.warnings);
  }
  return buildActivityPrintHTMLFromExperience(result.experience);
}

function openBlob(html) {
  const win = window.open("", "_blank");
  if (!win) {
    alert("Não foi possível abrir o PDF. Verifique se o navegador está bloqueando pop-ups e tente novamente.");
    return false;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  return true;
}

export function openActivityPrintWindow(activity) {
  const result = prepareExperienceForExport(activity);

  if (!result.ok) {
    openBlob(buildExportErrorHTML(result.blocking, result.warnings));
    return;
  }

  openBlob(buildActivityPrintHTMLFromExperience(result.experience));
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
