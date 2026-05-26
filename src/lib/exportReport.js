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
  const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean)
  const isBulletList = lines.length > 1 && lines.every(l => /^[•\-\d]/.test(l))
  if (isBulletList) {
    const items = lines.map(l => `<li>${escapeHtml(l.replace(/^[•\-]\s*/, '').replace(/^\d+\.\s*/, ''))}</li>`).join('')
    return `<ul class="bullet-list">${items}</ul>`
  }
  return `<p>${formatMultiline(text)}</p>`
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

function buildActivityPrintHTML(activity) {
  const { title, theme, duration, problem, guidingQuestion, objectives, bncc, materials, activityManual, steamMatrix, steamMakerDescription, bibliography, grade, discipline, generatedAt, stages, beforeClass, afterClass, teacherTips, modality, studentActivity } = activity;

  const steamLetters = Object.keys(steamMatrix || {}).filter((k) => ["S", "T", "E", "A", "M"].includes(k));
  const generatedDate = generatedAt ? formatDate(generatedAt) : new Date().toLocaleDateString("pt-BR");
  const { competencias } = parseActivityManual(activityManual);
  const steamAreaNames = { S: 'Ciências', T: 'Tecnologia', E: 'Engenharia', A: 'Artes', M: 'Matemática' };

  // Listas HTML
  const objectivesHTML = (objectives || [])
    .map((o, i) => `<li>${String.fromCharCode(97 + i)}) ${escapeHtml(o)}</li>`)
    .join('');
  const materialsHTML = (materials || [])
    .map((m) => `<li>${escapeHtml(m)}</li>`)
    .join('');
  const bnccRows = (bncc || []).map((c) => {
    const sep = c.indexOf(' — ');
    const code = sep > -1 ? c.slice(0, sep).trim() : c.trim();
    const desc = sep > -1 ? c.slice(sep + 3).trim() : '';
    return `<tr><td class="bncc-code-cell"><code>${escapeHtml(code)}</code></td><td class="bncc-desc-cell">${escapeHtml(desc)}</td></tr>`;
  }).join('');
  const bnccHTML = bnccRows
    ? `<table class="bncc-table"><thead><tr><th>Código</th><th>Habilidade BNCC</th></tr></thead><tbody>${bnccRows}</tbody></table>`
    : '';
  const bibliographyHTML = (bibliography || [])
    .map((b) => `<p class="ref">${escapeHtml(b)}</p>`)
    .join('');

  // Conteúdo programático — texto dissertativo STEAM + Maker
  const steamListHTML = (() => {
    if (steamMakerDescription) return `<p>${escapeHtml(steamMakerDescription)}</p>`;
    if (steamLetters.length === 0) return '';
    const parts = steamLetters.map((l) => {
      const area = STEAM_AREAS[l];
      const m = (steamMatrix || {})[l] || {};
      const areaName = escapeHtml(area?.name || steamAreaNames[l] || l);
      const contrib = escapeHtml(m.contribution || area?.description || '');
      const contrib_lower = contrib.charAt(0).toLowerCase() + contrib.slice(1);
      return `<strong>${areaName}</strong>, ${contrib_lower}`;
    });
    const intro = `Esta atividade mobiliza a cultura STEAM e a cultura Maker como eixos estruturantes da proposta pedagógica. `;
    const body = parts.length > 1
      ? parts.slice(0, -1).map((p) => `Em ${p}`).join('; ') + `; e em ${parts[parts.length - 1]}.`
      : `Em ${parts[0]}.`;
    const maker = ` A cultura Maker atravessa toda a sequência ao propor que os estudantes aprendam fazendo — investigando, construindo, testando e aperfeiçoando suas ideias com materiais acessíveis, em um processo colaborativo que valoriza o erro como parte da aprendizagem e o protagonismo como princípio formativo.`;
    return `<p>${intro}${body}${maker}</p>`;
  })();

  // Desenvolvimento — etapas numeradas
  const STAGE_COLORS = ['#2563EB','#7C3AED','#475569','#059669','#9333EA','#D97706','#0D9488','#DB2777'];
  const stagesDevHTML = (stages || []).map((stage, i) => {
    const color = STAGE_COLORS[i % STAGE_COLORS.length];
    return `<div class="stage-item" style="border-left-color:${color};">
      <p><strong style="color:${color};">Etapa ${stage.number || i + 1} — ${escapeHtml(stage.title || '')}</strong>${stage.duration ? ` <span class="stage-dur">(${escapeHtml(stage.duration)})</span>` : ''}</p>
      ${stage.objective ? `<p class="stage-obj">${escapeHtml(stage.objective)}</p>` : ''}
      ${stage.description ? `<p>${escapeHtml(stage.description)}</p>` : ''}
      ${stage.teacherScript ? `<p class="stage-teacher">💡 ${escapeHtml(stage.teacherScript)}</p>` : ''}
    </div>`;
  }).join('');

  // Socialização: etapa 7 (Reflexão coletiva)
  const stage7 = (stages || []).find(s =>
    s.number === 7 ||
    (s.title || '').toLowerCase().includes('reflexão') ||
    (s.title || '').toLowerCase().includes('socializ'));
  const socializacaoContent = stage7
    ? `${stage7.description ? `<p>${escapeHtml(stage7.description)}</p>` : ''}${stage7.teacherScript ? `<p class="stage-teacher">💡 ${escapeHtml(stage7.teacherScript)}</p>` : ''}`
    : renderBulletText(afterClass || '');

  // Fechamento: etapa 8
  const stage8 = (stages || []).find(s =>
    s.number === 8 ||
    (s.title || '').toLowerCase().includes('fechamento'));
  const fechamentoContent = stage8
    ? `${stage8.description ? `<p>${escapeHtml(stage8.description)}</p>` : ''}${stage8.teacherScript ? `<p class="stage-teacher">💡 ${escapeHtml(stage8.teacherScript)}</p>` : ''}`
    : renderBulletText(afterClass || '');

  // Produto final
  const sa = studentActivity || {};
  const produtoFinalHTML = sa.practicalActivity
    ? `<p>${escapeHtml(sa.practicalActivity)}</p>`
    : `<div class="blank-line"></div>`;

  // Textos dinâmicos
  const modalityText = modality === 'individual'
    ? 'Atividade individual. Cada aluno trabalhará de forma autônoma, desenvolvendo raciocínio independente e reflexão pessoal sobre o problema proposto.'
    : 'Atividade em grupo. A turma será organizada em grupos de 3 a 5 alunos com papéis definidos: <strong>Facilitador</strong> (coordena o grupo), <strong>Registrador</strong> (documenta as ideias), <strong>Apresentador</strong> (expõe as conclusões) e <strong>Pesquisador</strong> (organiza informações adicionais). Considere diversidade de perfis na composição dos grupos.';

  const metodologiaText = steamLetters.length > 0
    ? `Esta atividade adota a abordagem <strong>STEAM + Cultura Maker</strong> como metodologia central, integrando as áreas de ${steamLetters.map(l => STEAM_AREAS[l]?.name || steamAreaNames[l] || l).join(', ')}. Os estudantes aprendem fazendo — investigando, construindo, testando e melhorando suas soluções. O professor assume o papel de facilitador, garantindo protagonismo estudantil e aprendizagem ativa baseada em resolução de problemas reais.`
    : 'Esta atividade adota a abordagem <strong>STEAM + Cultura Maker</strong> como metodologia central. Os estudantes aprendem fazendo — investigando, construindo, testando e melhorando suas soluções.';

  // Folha do aluno (página separada)
  const studentActivityHTML = sa.textBase ? `
    <div class="sa-sheet">
      <div class="sa-header">
        <div class="sa-label">Atividade do Aluno · STEAM + Cultura Maker</div>
        <div class="sa-title">${escapeHtml(title || '')}</div>
        ${grade ? `<div class="sa-meta">${escapeHtml(grade)}${discipline ? ` · ${escapeHtml(discipline)}` : ''}</div>` : ''}
        <div class="sa-name-row">
          <span>Nome: <span class="sa-line" style="width:9cm;"></span></span>
          <span style="margin-left:1cm;">Data: <span class="sa-line" style="width:3.5cm;"></span></span>
          <span style="margin-left:1cm;">Turma: <span class="sa-line" style="width:2.5cm;"></span></span>
        </div>
      </div>
      <div class="sa-section">
        <div class="sa-section-title">Leia com atenção</div>
        <div class="sa-text-base">${formatMultiline(sa.textBase || '')}</div>
        ${sa.sourceInfo ? `<div class="sa-source">${escapeHtml(sa.sourceInfo)}</div>` : ''}
      </div>
      ${sa.situationProblem ? `<div class="sa-section"><div class="sa-section-title">Situação-problema</div><div class="sa-highlight">${escapeHtml(sa.situationProblem)}</div></div>` : ''}
      ${sa.investigativeChallenge ? `<div class="sa-section"><div class="sa-section-title">Seu desafio</div><div class="sa-challenge">${escapeHtml(sa.investigativeChallenge)}</div></div>` : ''}
      ${(sa.questions || []).length > 0 ? `
      <div class="sa-section">
        <div class="sa-section-title">Responda</div>
        <ol class="sa-questions">
          ${(sa.questions || []).map(q => `<li>
            <div class="sa-q-text">${escapeHtml(q)}</div>
            <div class="blank-line"></div><div class="blank-line"></div><div class="blank-line"></div>
          </li>`).join('')}
        </ol>
      </div>` : ''}
      ${sa.practicalActivity ? `
      <div class="sa-section">
        <div class="sa-section-title">Atividade prática — Desafio Maker</div>
        <div class="sa-practical">${formatMultiline(sa.practicalActivity)}</div>
        <div style="margin-top:0.5cm;">
          <div class="sa-section-title" style="font-size:9pt;">Minha solução / O que criei</div>
          <div class="blank-line"></div><div class="blank-line"></div><div class="blank-line"></div><div class="blank-line"></div>
        </div>
      </div>` : ''}
    </div>` : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Plano de Aula — ${escapeHtml(title || 'Atividade Pedagógica')}</title>
  <style>
    @page { size: A4; margin: 2.5cm 2cm 2cm 3cm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.55;
      color: #000;
      background: #fff;
      padding: 2.5cm 2cm 2cm 3cm;
      max-width: 21cm;
      margin: 0 auto;
    }
    .header { text-align: center; margin-bottom: 0.7cm; padding-bottom: 0.4cm; border-bottom: 2px solid #000; }
    .header-label { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.12em; color: #666; margin-bottom: 0.2cm; }
    .header h1 { font-size: 15pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.1cm; }
    .header .subtitle { font-size: 12pt; font-style: italic; color: #333; }
    .section { margin-top: 0.55cm; page-break-inside: avoid; }
    .section-title {
      font-size: 10pt; font-weight: bold; text-transform: uppercase;
      letter-spacing: 0.06em; border-bottom: 1.5px solid #000;
      padding-bottom: 0.1cm; margin-bottom: 0.3cm;
    }
    table.ident { width: 100%; border-collapse: collapse; font-size: 10.5pt; }
    table.ident td { padding: 0.18cm 0.35cm; border: 1px solid #ccc; vertical-align: top; }
    table.ident td.lbl { font-weight: bold; background: #f5f5f5; white-space: nowrap; width: 20%; }
    .blank-field { display: block; border-bottom: 1px solid #999; width: 100%; min-height: 0.5cm; }
    p { text-align: justify; margin-bottom: 0.25cm; }
    ul, ol { padding-left: 1.2cm; margin-bottom: 0.25cm; }
    li { margin-bottom: 0.12cm; text-align: justify; }
    code { font-family: 'Courier New', monospace; font-size: 9.5pt; background: #f0f0f0; padding: 0.04cm 0.18cm; border-radius: 2px; font-weight: bold; }
    .af { margin-bottom: 0.4cm; }
    .af-label { font-weight: bold; font-size: 10.5pt; }
    .af-body { margin-top: 0.1cm; }
    .blank-line { border-bottom: 1px solid #bbb; height: 0.65cm; margin-bottom: 0.18cm; }
    .stage-item { margin-bottom: 0.35cm; padding: 0.2cm 0.4cm; border-left: 3px solid #333; background: #fafafa; }
    .stage-dur { font-size: 9.5pt; font-weight: normal; font-style: italic; color: #555; }
    .stage-obj { font-size: 10pt; font-style: italic; color: #333; margin-bottom: 0.1cm; }
    .stage-teacher { font-size: 9.5pt; font-style: italic; color: #444; background: #fffbea; border-left: 2px solid #d97706; padding: 0.1cm 0.3cm; margin-top: 0.15cm; }
    .bncc-table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin: 0.2cm 0; }
    .bncc-table th { background: #f0f0f0; font-weight: bold; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.04em; padding: 0.12cm 0.25cm; border: 1px solid #ccc; text-align: left; }
    .bncc-code-cell { padding: 0.12cm 0.2cm; width: 2.5cm; border-bottom: 1px solid #e5e5e5; vertical-align: top; }
    .bncc-desc-cell { padding: 0.12cm 0.2cm; border-bottom: 1px solid #e5e5e5; color: #333; }
    .ref { text-align: justify; padding-left: 1.27cm; text-indent: -1.27cm; margin-bottom: 0.25cm; font-size: 10pt; line-height: 1.5; }
    .doc-footer { margin-top: 0.9cm; padding-top: 0.3cm; border-top: 1px solid #ccc; font-size: 8.5pt; color: #666; text-align: center; }
    .sa-sheet { page-break-before: always; border: 2px solid #000; padding: 0.6cm 0.8cm; margin-top: 1cm; }
    .sa-header { border-bottom: 2px solid #000; padding-bottom: 0.4cm; margin-bottom: 0.5cm; }
    .sa-label { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.12em; color: #555; margin-bottom: 0.2cm; }
    .sa-title { font-size: 14pt; font-weight: bold; text-transform: uppercase; margin-bottom: 0.15cm; }
    .sa-meta { font-size: 10pt; color: #444; margin-bottom: 0.3cm; }
    .sa-name-row { font-size: 10pt; display: flex; flex-wrap: wrap; gap: 0.2cm; margin-top: 0.3cm; }
    .sa-line { display: inline-block; border-bottom: 1px solid #000; vertical-align: bottom; }
    .sa-section { margin-top: 0.5cm; }
    .sa-section-title { font-size: 10pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.07em; border-bottom: 1px solid #ccc; padding-bottom: 0.1cm; margin-bottom: 0.25cm; }
    .sa-text-base { font-size: 11pt; line-height: 1.6; text-align: justify; background: #f9f9f9; border-left: 3px solid #555; padding: 0.35cm 0.5cm; }
    .sa-source { font-size: 9pt; color: #666; font-style: italic; margin-top: 0.15cm; text-align: right; }
    .sa-highlight { font-size: 11pt; font-weight: bold; background: #f0f0f0; border-left: 4px solid #000; padding: 0.3cm 0.5cm; text-align: justify; }
    .sa-challenge { font-size: 12pt; font-weight: bold; font-style: italic; text-align: center; border: 2px dashed #555; padding: 0.4cm 0.6cm; margin: 0.2cm 0; }
    .sa-questions { padding-left: 1.2cm; }
    .sa-questions li { margin-bottom: 0.5cm; }
    .sa-q-text { font-size: 11pt; font-weight: 500; margin-bottom: 0.2cm; text-align: justify; }
    .sa-practical { font-size: 11pt; line-height: 1.6; text-align: justify; border: 1px solid #ccc; padding: 0.35cm 0.5cm; }
    @media print { body { padding: 0; } .section { page-break-inside: avoid; } .section-title { page-break-after: avoid; } }
  </style>
</head>
<body>

  <div class="header">
    <div class="header-label">Planejamento Pedagógico · STEAM + Cultura Maker</div>
    <h1>Plano de Aula</h1>
    <div class="subtitle">${escapeHtml(title || 'Atividade Pedagógica')}</div>
  </div>

  <!-- 1. IDENTIFICAÇÃO -->
  <div class="section">
    <div class="section-title">1. Identificação</div>
    <table class="ident">
      <tr>
        <td class="lbl">Instituição</td>
        <td colspan="3"><span class="blank-field">&nbsp;</span></td>
      </tr>
      <tr>
        <td class="lbl">Área / Disciplina</td>
        <td>${discipline ? escapeHtml(discipline) : '<span class="blank-field">&nbsp;</span>'}</td>
        <td class="lbl">Série / Turma</td>
        <td>${grade ? escapeHtml(grade) : '<span class="blank-field">&nbsp;</span>'}</td>
      </tr>
      <tr>
        <td class="lbl">Professor(a)</td>
        <td><span class="blank-field">&nbsp;</span></td>
        <td class="lbl">Modalidade</td>
        <td>${modality === 'individual' ? 'Individual' : 'Em grupo'}</td>
      </tr>
      <tr>
        <td class="lbl">Tema</td>
        <td colspan="3">${escapeHtml(title || '')}${theme ? ` — ${escapeHtml(theme)}` : ''}</td>
      </tr>
      <tr>
        <td class="lbl">Duração</td>
        <td>${duration ? escapeHtml(duration) : '<span class="blank-field">&nbsp;</span>'}</td>
        <td class="lbl">Data</td>
        <td><span class="blank-field">&nbsp;</span></td>
      </tr>
      <tr>
        <td class="lbl">Horário</td>
        <td><span class="blank-field">&nbsp;</span></td>
        <td class="lbl">Local</td>
        <td><span class="blank-field">&nbsp;</span></td>
      </tr>
    </table>
  </div>

  <!-- 2. OBJETIVOS DA AULA -->
  <div class="section">
    <div class="section-title">2. Objetivos da Aula</div>
    ${objectivesHTML
      ? `<ul>${objectivesHTML}</ul>`
      : `<div class="blank-line"></div><div class="blank-line"></div><div class="blank-line"></div>`}
  </div>

  <!-- 3. CONTEÚDO PROGRAMÁTICO -->
  <div class="section">
    <div class="section-title">3. Conteúdo Programático</div>
    ${steamListHTML}
    ${bnccHTML}
    ${!steamListHTML && !bnccHTML
      ? `<div class="blank-line"></div><div class="blank-line"></div>`
      : ''}
  </div>

  <!-- 4. METODOLOGIA -->
  <div class="section">
    <div class="section-title">4. Metodologia</div>
    <p>${metodologiaText}</p>
    ${beforeClass ? `<p style="margin-top:0.2cm;"><strong>Preparação prévia:</strong> ${formatMultiline(beforeClass)}</p>` : ''}
  </div>

  <!-- 5. INTERFACE ENTRE TEORIA E PRÁTICA -->
  <div class="section">
    <div class="section-title">5. Interface entre Teoria e Prática</div>
    ${problem ? `<p>${escapeHtml(problem)}</p>` : ''}
    ${guidingQuestion
      ? `<p><strong>Questão norteadora:</strong> <em>${escapeHtml(guidingQuestion)}</em></p>`
      : ''}
    ${!problem && !guidingQuestion
      ? `<div class="blank-line"></div><div class="blank-line"></div>`
      : ''}
  </div>

  <!-- 6. ATIVIDADE PROPOSTA -->
  <div class="section">
    <div class="section-title">6. Atividade Proposta</div>

    <div class="af">
      <span class="af-label">Título da atividade:</span>
      ${escapeHtml(title || '')}
    </div>

    <div class="af">
      <span class="af-label">Objetivo da atividade:</span>
      <div class="af-body">
        ${objectives && objectives.length > 0
          ? `<p>${escapeHtml(objectives[0])}</p>`
          : `<div class="blank-line"></div>`}
      </div>
    </div>

    <div class="af">
      <span class="af-label">Organização da turma:</span>
      <div class="af-body"><p>${modalityText}</p></div>
    </div>

    <div class="af">
      <span class="af-label">Contextualização:</span>
      <div class="af-body">
        ${problem ? `<p>${escapeHtml(problem)}</p>` : ''}
        ${guidingQuestion ? `<p><em>${escapeHtml(guidingQuestion)}</em></p>` : ''}
        ${!problem && !guidingQuestion ? `<div class="blank-line"></div>` : ''}
      </div>
    </div>

    <div class="af">
      <span class="af-label">Desenvolvimento da atividade:</span>
      <div class="af-body">
        ${stagesDevHTML
          || (competencias ? `<p>${formatMultiline(competencias)}</p>` : '')
          || (activityManual ? `<p>${formatMultiline(activityManual)}</p>` : '')
          || `<div class="blank-line"></div>`}
      </div>
    </div>

    <div class="af">
      <span class="af-label">Produto final esperado:</span>
      <div class="af-body">${produtoFinalHTML}</div>
    </div>

    <div class="af">
      <span class="af-label">Tempo estimado:</span>
      ${duration ? escapeHtml(duration) : '<span style="border-bottom:1px solid #999;display:inline-block;width:4cm;">&nbsp;</span>'}
    </div>

    <div class="af">
      <span class="af-label">Socialização:</span>
      <div class="af-body">
        ${socializacaoContent || `<div class="blank-line"></div>`}
      </div>
    </div>

    <div class="af">
      <span class="af-label">Fechamento:</span>
      <div class="af-body">
        ${fechamentoContent || `<div class="blank-line"></div>`}
      </div>
    </div>
  </div>

  <!-- 7. AVALIAÇÃO -->
  <div class="section">
    <div class="section-title">7. Avaliação</div>
    <div class="blank-line"></div><div class="blank-line"></div><div class="blank-line"></div>
  </div>

  <!-- 8. RECURSOS DIDÁTICOS -->
  <div class="section">
    <div class="section-title">8. Recursos Didáticos</div>
    ${materialsHTML
      ? `<ul>${materialsHTML}</ul>`
      : `<div class="blank-line"></div><div class="blank-line"></div>`}
  </div>

  <!-- 9. REFERÊNCIAS -->
  <div class="section">
    <div class="section-title">9. Referências</div>
    ${bibliographyHTML
      ? `<p style="font-size:9.5pt;color:#555;font-style:italic;margin-bottom:0.3cm;">Conforme ABNT NBR 6023:2018.</p>${bibliographyHTML}`
      : `<div class="blank-line"></div><div class="blank-line"></div>`}
  </div>

  <div class="doc-footer">
    Gerado pelo STEAM Planner em ${generatedDate} · Plano de Aula · ${escapeHtml(title || 'Atividade Pedagógica')}
  </div>

  ${studentActivityHTML}

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

  const steamLabels = {
    S: 'S (Ciências)',
    T: 'T (Tecnologia)',
    E: 'E (Engenharia)',
    A: 'A (Artes)',
    M: 'M (Matemática)'
  }
  const steamNamesPattern = /^(S\s*)?(\(?(Ciências|Ciência|Tecnologia|Engenharia|Artes|Arte|Matemática)\)?):?\s*/i

  const steamIntegration = activity.steamIntegration || {}
  const steamIntegrationHTML = Array.isArray(steamIntegration)
    ? steamIntegration.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
    : Object.entries(steamLabels)
        .map(([key, label]) => {
          const value = steamIntegration[key]
          const cleaned = String(value || '')
            .replace(new RegExp(`^${key}\\s*\\([^)]*\\):?\\s*`, 'i'), '')
            .replace(steamNamesPattern, '')
          return value ? `<li><strong>${label}:</strong> ${escapeHtml(cleaned)}</li>` : ''
        })
        .join('')

  const questionsHTML = (activity.discussionQuestions || [])
    .map((q) => `<li style="margin-bottom:0.5rem;">${escapeHtml(q)}</li>`)
    .join('')

  const materialsHTML = (activity.materials || [])
    .map((m) => `<li>${escapeHtml(m)}</li>`)
    .join('')

  const bibliographyHTML = (activity.bibliography || [])
    .map((ref) => `<p class="ref">${escapeHtml(ref)}</p>`)
    .join('')

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
    .ref { font-size: 0.9rem; padding-left: 1.2rem; text-indent: -1.2rem; margin: 0.4rem 0; }
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

  <h2>Passo a passo da atividade</h2>
  ${stepsHTML}

  ${steamIntegrationHTML ? `<h2>Integração das disciplinas</h2><ul>${steamIntegrationHTML}</ul>` : ''}

  ${questionsHTML ? `<h2>Perguntas para discussão</h2><ul>${questionsHTML}</ul>` : ''}

  <h2>Como avaliar</h2>
  <div class="assessment-box">${escapeHtml(activity.assessment || '')}</div>

  ${bibliographyHTML ? `<h2>Referências</h2>${bibliographyHTML}` : ''}

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
