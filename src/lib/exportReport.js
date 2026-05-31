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
    .map((ref) => stripDecorativeMarkers(ref))
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

  if (!/\b(por\s+grupo|por\s+aluno|por\s+turma|para\s+a\s+turma|conforme\s+disponibilidade)\b/i.test(normalizedUnit)) {
    const unitDistribution = normalizedUnit.match(/\b(por\s+grupo|por\s+aluno|por\s+turma|para\s+a\s+turma|conforme\s+disponibilidade)\b/i);
    if (unitDistribution) {
      normalizedQty = [normalizedQty, normalizedUnit.slice(0, unitDistribution.index).trim()].filter(Boolean).join(" ");
      normalizedUnit = unitDistribution[1];
    }
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
      const lines = splitGabaritoLines(item);
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

function fixDanglingText(text) {
  if (!text) return text;
  let t = reviewText(text).replace(/\.{3,}|…/g, ".").trim();
  t = t.replace(DANGLING, "").trim();
  if (t && !/[.!?:;)\]"]$/.test(t)) t += ".";
  return t;
}

function reviewGabaritoText(text) {
  const reviewed = reviewText(text, { preserveLineBreaks: true });
  if (!reviewed) return "";
  return reviewed
    .split(/\n+/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      if (/^(Cen[aá]rio\s*\d+|Sugest[aã]o de melhoria|Outra possibilidade):$/i.test(trimmed)) {
        return trimmed.replace(/^(cen)/i, "Cen");
      }
      return /[.!?:;)]$/.test(trimmed) ? trimmed : `${trimmed}.`;
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
  MELHORIA: "melhoria",
  DESPESA_TOTAL: "despesaTotal",
  DESPESA_ANTERIOR: "despesaAnterior",
  SALDO: "saldo",
  OUTRO: "outro"
};

const REVENUE_RE = /\b(receitas?|rendas?|sal[aá]rios?|ganhos?|entradas?|remunera[cç][aã]o)\b/i;
const IMPROVEMENT_RE = /\b(economizar|economizad[oa]s?|economia|poupar|poupan[cç]a|reduzir|redu[cç][aã]o|cortar|corte|ajustar|ajuste|melhoria|melhorar|reorganizar|reorganiza[cç][aã]o|preservar|reserva|saldo ap[oó]s melhoria|ap[oó]s melhoria|poderiam economizar|poderia economizar|valor que poderia ser economizado)\b/i;
const PRIOR_EXPENSE_RE = /\bdespesas?\s+(?:do|da)\s+cen[aá]rio|\bdespesas?\s+anteriores?\b|\btotal\s+anterior\s+de\s+despesas\b/i;
const EXPENSE_TOTAL_RE = /\b(?:novo\s+)?total\s+de\s+despesas\b|\bdespesas?\s+totais\b/i;
const REVENUE_TOTAL_RE = /\b(?:receita|renda)\s+total\b|\btotal\s+de\s+(?:receitas?|rendas?)\b/i;
const BALANCE_RE = /\b(saldo|sobra\s+mensal|resultado\s+final)\b/i;
const UNEXPECTED_RE = /\b(imprevisto|emerg[eê]ncia|emergencial|conserto|reparo|aumento|acr[eé]scimo|acrescimo|novo\s+gasto|gasto\s+extra|custo\s+extra|m[eé]dic[oa]|rem[eé]dio|consulta|carro|manuten[cç][aã]o)\b/i;
const FIXED_EXPENSE_RE = /\b(despesas?\s+fixas?|aluguel|escola|mensalidade|internet|[aá]gua|luz|energia|condom[ií]nio|telefone|celular|plano|presta[cç][aã]o|financiamento|seguro|educa[cç][aã]o|sa[uú]de|farm[aá]cia)\b/i;
const VARIABLE_EXPENSE_RE = /\b(despesas?\s+vari[aá]veis?|alimenta[cç][aã]o|mercado|transporte|lazer|compras?|roupas?|passeio|restaurante|lanche|combust[ií]vel|gastos?\s+vari[aá]veis?)\b/i;
const EXPENSE_RE = /\b(despesas?|gastos?|custos?|contas?|pagamentos?)\b/i;
const FAMILY_REVENUE_RE = /\b(pai|m[aã]e|respons[aá]vel(?:\s+\d+)?|cuidador(?:a)?)\b/i;

function buildEmptyStructuredBudget() {
  return {
    receitas: [],
    despesasFixas: [],
    despesasVariaveis: [],
    imprevistos: [],
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
  const local = `${label} ${afterClause}`.replace(/\s+/g, " ").trim();

  if (PRIOR_EXPENSE_RE.test(local)) return FINANCIAL_ENTRY_TYPE.DESPESA_ANTERIOR;
  if (EXPENSE_TOTAL_RE.test(label) || EXPENSE_TOTAL_RE.test(local)) return FINANCIAL_ENTRY_TYPE.DESPESA_TOTAL;
  if (REVENUE_TOTAL_RE.test(label) || REVENUE_TOTAL_RE.test(local)) return FINANCIAL_ENTRY_TYPE.RECEITA_TOTAL;
  if (BALANCE_RE.test(label) && !IMPROVEMENT_RE.test(local)) return FINANCIAL_ENTRY_TYPE.SALDO;
  if (IMPROVEMENT_RE.test(local)) return FINANCIAL_ENTRY_TYPE.MELHORIA;
  if (currentSection === FINANCIAL_ENTRY_TYPE.MELHORIA) return FINANCIAL_ENTRY_TYPE.MELHORIA;
  if (UNEXPECTED_RE.test(local) || currentSection === FINANCIAL_ENTRY_TYPE.IMPREVISTO) return FINANCIAL_ENTRY_TYPE.IMPREVISTO;
  if (FIXED_EXPENSE_RE.test(local) || currentSection === FINANCIAL_ENTRY_TYPE.DESPESA_FIXA) return FINANCIAL_ENTRY_TYPE.DESPESA_FIXA;
  if (VARIABLE_EXPENSE_RE.test(local) || currentSection === FINANCIAL_ENTRY_TYPE.DESPESA_VARIAVEL) return FINANCIAL_ENTRY_TYPE.DESPESA_VARIAVEL;
  if (EXPENSE_RE.test(local)) return FINANCIAL_ENTRY_TYPE.DESPESA_VARIAVEL;
  if (REVENUE_RE.test(local) || FAMILY_REVENUE_RE.test(local) || currentSection === FINANCIAL_ENTRY_TYPE.RECEITA) return FINANCIAL_ENTRY_TYPE.RECEITA;
  return FINANCIAL_ENTRY_TYPE.OUTRO;
}

function parseFinancialEntries(text) {
  const sourceText = text || "";
  const matches = [...sourceText.matchAll(/-?\s*R\$\s*[\d.]+(?:,\d{2})?/g)];
  return matches
    .map((match) => {
      const amount = extractBRLAmounts(match[0])[0];
      if (!Number.isFinite(amount)) return null;

      const before = stripDecorativeMarkers(sourceText.slice(Math.max(0, match.index - 120), match.index)).toLowerCase();
      const rawAfter = sourceText.slice(match.index + match[0].length, match.index + match[0].length + 90).toLowerCase();
      const label = before
        .split(/[.;:\n]/)
        .map((part) => part
          .replace(/[-–—]/g, " ")
          .replace(/\s+/g, " ")
          .trim())
        .filter(Boolean)
        .pop() || "";
      const normalizedLabel = label
        .replace(/[-–—]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const currentSection = getCurrentFinancialSection(before);
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
  return {
    descricao: entry.description,
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

function buildFinancialDataForScenarios(scenarios) {
  const result = [];
  let previous = null;

  scenarios.forEach((scenario) => {
    const entries = parseFinancialEntries(scenario.text);
    const structured = buildEmptyStructuredBudget();
    entries.forEach((entry) => addEntryToStructuredBudget(structured, entry));

    if (!entries.length) {
      result.push({
        scenario,
        entries,
        structured,
        receitaTotal: previous?.receitaTotal ?? null,
        revenue: previous?.receitaTotal ?? null,
        expenses: [],
        totalExpenses: previous?.totalExpenses || 0,
        saldo: null,
        isBudgetScenario: false,
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
    const melhoriasTotal = sumBudgetItems(structured.melhorias);
    const despesasDetalhadasTotal = despesasFixasTotal + despesasVariaveisTotal;
    const declaredExpenseTotal = getLastDeclaredTotal(structured.totaisDeclarados.despesas);
    const priorExpenseTotal = getLastDeclaredTotal(structured.totaisDeclarados.despesasAnteriores);
    const usesPreviousExpenses = Boolean(
      previous?.totalExpenses
      && imprevistosTotal > 0
      && despesasDetalhadasTotal === 0
      && !priorExpenseTotal
    );
    const despesasAnterioresTotal = priorExpenseTotal || (usesPreviousExpenses ? previous.totalExpenses : 0);

    let totalExpenses = despesasDetalhadasTotal + imprevistosTotal;
    if (despesasAnterioresTotal > 0) {
      totalExpenses = despesasAnterioresTotal + despesasDetalhadasTotal + imprevistosTotal;
    } else if (totalExpenses === 0 && declaredExpenseTotal > 0) {
      totalExpenses = declaredExpenseTotal;
    }

    const saldo = receitaTotal !== null ? receitaTotal - totalExpenses : null;
    const saldoAfterImprovement = saldo !== null && melhoriasTotal > 0 ? saldo + melhoriasTotal : null;
    const expenses = [
      ...structured.despesasFixas,
      ...structured.despesasVariaveis,
      ...structured.imprevistos,
      ...(despesasAnterioresTotal > 0
        ? [{ descricao: `Despesas do Cenário ${previous?.scenario?.number || scenario.number - 1}`, valor: despesasAnterioresTotal, type: FINANCIAL_ENTRY_TYPE.DESPESA_ANTERIOR }]
        : [])
    ].map((item) => ({ amount: item.valor, label: item.descricao, isRevenue: false, isExpense: true, isImprovement: false, isPriorExpense: item.type === FINANCIAL_ENTRY_TYPE.DESPESA_ANTERIOR }));
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
      imprevistosTotal,
      melhoriasTotal,
      despesasAnterioresTotal,
      declaredExpenseTotal,
      expenses,
      improvements,
      improvementTotal: melhoriasTotal,
      totalExpenses,
      saldo,
      saldoAfterImprovement,
      usesPreviousExpenses,
      isBudgetScenario,
      validation: {
        calculable: receitaTotal !== null && totalExpenses > 0,
        hasRevenue: receitaTotal !== null,
        hasExpenses: totalExpenses > 0
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
  const explicitImprovement = financialData.find((item) => item.melhoriasTotal > 0 && Number.isFinite(item.saldo));
  if (explicitImprovement) {
    return [
      "Melhoria sugerida:",
      `Economizar ${formatCurrencyBRL(explicitImprovement.melhoriasTotal)} em uma despesa variável, como lazer ou compras não essenciais.`,
      "Resultado após melhoria:",
      `${formatCurrencyBRL(explicitImprovement.saldo)} + ${formatCurrencyBRL(explicitImprovement.melhoriasTotal)} = ${formatCurrencyBRL(explicitImprovement.saldoAfterImprovement)}.`
    ].join("\n");
  }

  const negative = financialData.find((item) => Number.isFinite(item.saldo) && item.saldo < 0);
  if (!negative) {
    return "Sugestão de melhoria: A equipe pode reservar parte do saldo positivo para uma emergência, comparar prioridades e justificar como preservaria a poupança.";
  }

  const deficit = Math.abs(negative.saldo);
  return [
    "Sugestão de melhoria:",
    `Reduzir pelo menos ${formatCurrencyBRL(deficit)} em despesas variáveis para zerar o déficit.`,
    "Resultado após melhoria:",
    `${formatCurrencyBRL(negative.saldo)} + ${formatCurrencyBRL(deficit)} = ${formatCurrencyBRL(0)}.`
  ].join("\n");
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
    lines.push(formatBudgetLine("Imprevistos", data.structured.imprevistos, data.imprevistosTotal));
    lines.push(`Novo total de despesas: ${formatCurrencyBRL(data.despesasAnterioresTotal)} + ${formatCurrencyBRL(data.imprevistosTotal)} = ${formatCurrencyBRL(data.totalExpenses)}.`);
    lines.push(`Saldo antes da melhoria: ${formatCurrencyBRL(data.receitaTotal)} - ${formatCurrencyBRL(data.totalExpenses)} = ${formatCurrencyBRL(data.saldo)}.`);
    return lines.join("\n");
  }

  if (data.despesasFixasTotal + data.despesasVariaveisTotal > 0) {
    lines.push(formatBudgetLine("Despesas fixas", data.structured.despesasFixas, data.despesasFixasTotal));
    lines.push(formatBudgetLine("Despesas variáveis", data.structured.despesasVariaveis, data.despesasVariaveisTotal));
    if (data.imprevistosTotal > 0) {
      lines.push(formatBudgetLine("Imprevistos", data.structured.imprevistos, data.imprevistosTotal));
    }
    lines.push(formatPartsTotalLine(
      "Despesas totais",
      [data.despesasFixasTotal, data.despesasVariaveisTotal, data.imprevistosTotal],
      data.totalExpenses
    ));
  } else {
    lines.push(`Despesas totais: ${formatCurrencyBRL(data.totalExpenses)}.`);
  }
  lines.push(`${data.imprevistosTotal > 0 ? "Saldo antes da melhoria" : "Saldo final"}: ${formatCurrencyBRL(data.receitaTotal)} - ${formatCurrencyBRL(data.totalExpenses)} = ${formatCurrencyBRL(data.saldo)}.`);
  return lines.join("\n");
}

function buildFinancialGabaritoFromReadyMaterials(readyMaterials) {
  const scenarios = getScenarioItems(readyMaterials);
  if (!scenarios.length) return [];

  const financialData = buildFinancialDataForScenarios(scenarios);
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
  return /steam|maker|metodologias?\s+ativas?|aprendizagem\s+baseada\s+em\s+projetos?|project\s+based|cultura\s+maker|prototip|bncc|base\s+nacional\s+comum\s+curricular/i.test(refText);
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

function cleanCriterionName(value) {
  return reviewText(value || "")
    .replace(/[.!?:;]+$/g, "")
    .trim();
}

function autoFixExperience(experience) {
  const fix = fixDanglingText;
  const fixedReadyMaterials = fixScenarioQuestions((experience.readyMaterials || []).map(fix)).map(fixDecisionLanguage);
  const fixedGabarito = fixGabaritoLanguage((experience.teacherGabarito || []).map(reviewGabaritoText));
  const financialGabarito = buildFinancialGabaritoFromReadyMaterials(fixedReadyMaterials);
  const fallbackGabarito = fixedGabarito.length ? fixedGabarito : buildFallbackGabaritoFromReadyMaterials(fixedReadyMaterials);
  const teacherGabarito = completeGabaritoForScenarios(
    financialGabarito.length ? financialGabarito : fallbackGabarito,
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

function hasDuplicatedStructuredValue(data) {
  const grouped = [
    ...getRevenueBudgetItems(data.structured),
    ...getExpenseBudgetItems(data.structured),
    ...(data.structured?.melhorias || [])
  ].filter((item) => item.sourceIndex !== undefined);
  const seen = new Set();
  return grouped.some((item) => {
    if (seen.has(item.sourceIndex)) return true;
    seen.add(item.sourceIndex);
    return false;
  });
}

function buildInternalValidationReport(experience) {
  const scenarioData = buildFinancialDataForScenarios(getScenarioItems(experience.readyMaterials || []));
  const budgetData = scenarioData.filter((data) => data.isBudgetScenario && data.entries.length > 0);
  const hasFinancialBudget = budgetData.length > 0;
  const receitaEmDespesa = budgetData.some((data) => getExpenseBudgetItems(data.structured).some(hasRevenueMarker));
  const despesaEmReceita = budgetData.some((data) => getRevenueBudgetItems(data.structured).some(hasExpenseMarker));
  const melhoriaEmDespesa = budgetData.some((data) => getExpenseBudgetItems(data.structured).some(hasImprovementMarker));
  const imprevistoComReceitaOuMelhoria = budgetData.some((data) => (
    data.structured.imprevistos || []
  ).some((item) => hasRevenueMarker(item) || hasImprovementMarker(item)));
  const duplicatedValues = budgetData.some(hasDuplicatedStructuredValue);
  const uncalculableBudget = budgetData.some((data) => {
    const requiresBalance = /receita|renda|sal[aá]rio|or[cç]amento|saldo|despesas?/i.test(data.scenario.text);
    return requiresBalance && !data.validation.calculable;
  });
  const gabaritoMathOk = (experience.teacherGabarito || []).every(validateGabaritoMath);
  const textItems = collectExperienceText(experience);
  const reviewOk = !textItems.some(hasLowercaseAfterSentence) && !textItems.some(hasPoorSpacing);
  const receitasOk = !receitaEmDespesa;
  const despesasOk = !despesaEmReceita;
  const imprevistosOk = !imprevistoComReceitaOuMelhoria;
  const melhoriasOk = !melhoriaEmDespesa;
  const duplicidadeOk = !duplicatedValues;
  const calculosOk = !uncalculableBudget && gabaritoMathOk;
  const gabaritoCompletoOk = !hasIncompleteGabaritoCoverage(experience);
  const pdfApproved = [
    receitasOk,
    despesasOk,
    imprevistosOk,
    melhoriasOk,
    duplicidadeOk,
    calculosOk,
    gabaritoCompletoOk,
    reviewOk
  ].every(Boolean);

  const checks = [
    ["Receitas classificadas corretamente", receitasOk],
    ["Despesas classificadas corretamente", despesasOk],
    ["Imprevistos classificados corretamente", imprevistosOk],
    ["Melhorias separadas das despesas", melhoriasOk],
    ["Nenhum valor duplicado", duplicidadeOk],
    ["Cálculos conferidos por código", calculosOk],
    ["Gabarito completo", gabaritoCompletoOk],
    ["Revisão textual", reviewOk],
    ["PDF aprovado", pdfApproved]
  ];

  const blocking = [];
  if (hasFinancialBudget && receitaEmDespesa) blocking.push("Receita apareceu dentro da classificação de despesas.");
  if (hasFinancialBudget && despesaEmReceita) blocking.push("Despesa apareceu dentro da classificação de receitas.");
  if (hasFinancialBudget && melhoriaEmDespesa) blocking.push("Valor de economia ou melhoria apareceu como despesa.");
  if (hasFinancialBudget && imprevistoComReceitaOuMelhoria) blocking.push("Imprevisto foi misturado com receita ou melhoria.");
  if (hasFinancialBudget && duplicatedValues) blocking.push("Há valor financeiro duplicado na estrutura de cálculo.");
  if (hasFinancialBudget && uncalculableBudget) blocking.push("Há cenário financeiro sem dados suficientes para cálculo estruturado.");
  if (hasFinancialBudget && !gabaritoMathOk) blocking.push("Gabarito financeiro possui equação inconsistente.");

  return {
    checks,
    finalStatus: pdfApproved ? "OK" : "BLOCKED",
    blocking
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

  if (hasScenarioBalanceContradiction(experience)) {
    blocking.push("Há pergunta de cenário financeiro incoerente com saldo positivo.");
  }

  const validationReport = buildInternalValidationReport(experience);
  validationReport.blocking.forEach((item) => blocking.push(item));

  return { blocking, warnings };
}

function rebuildStructuredTeacherGabarito(experience) {
  const financialGabarito = buildFinancialGabaritoFromReadyMaterials(experience.readyMaterials || []);
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
    readyMaterials: (experience.readyMaterials || []).map(fix).map(fixDecisionLanguage),
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
        attempts: attempt
      };
    }

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
      attempts: maxAttempts
    };
  }

  console.warn("[export-blocked] erros persistentes", finalValidation.blocking);

  return {
    ok: false,
    experience,
    blocking: finalValidation.blocking,
    warnings: finalValidation.warnings,
    attempts: maxAttempts,
    lastValidation
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

// ── HTML builder ──────────────────────────────────────────────────────────────

function buildActivityPrintHTMLFromExperience(experience) {

  return `<!DOCTYPE html>
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
