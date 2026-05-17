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

function parseActivityManual(text) {
  if (!text) return { competencias: '', desenvolvimento: '' }
  const compMatch = text.match(/resumo das competências:?\s*([\s\S]*?)(?=materiais utilizados:|como montar|$)/i)
  const devMatch = text.match(/como montar e conduzir:?\s*([\s\S]*?)$/i)
  return {
    competencias: compMatch ? compMatch[1].trim() : '',
    desenvolvimento: devMatch ? devMatch[1].trim() : text.trim()
  }
}

function buildActivityPrintHTML(activity) {
  const { title, theme, duration, problem, guidingQuestion, objectives, bncc, materials, activityManual, steamMatrix, accessibility, bibliography, grade, discipline, generatedAt, stages, beforeClass, afterClass, teacherTips, modality, studentActivity } = activity;

  const steamLetters = Object.keys(steamMatrix || {}).filter((k) => ["S", "T", "E", "A", "M"].includes(k));
  const generatedDate = generatedAt ? formatDate(generatedAt) : new Date().toLocaleDateString("pt-BR");
  const { competencias, desenvolvimento } = parseActivityManual(activityManual);

  const steamAreaNames = { S: 'Ciências', T: 'Tecnologia', E: 'Engenharia', A: 'Artes', M: 'Matemática' };

  const matrixRows = steamLetters.map((letter) => {
    const area = STEAM_AREAS[letter];
    const m = (steamMatrix || {})[letter] || {};
    return `<tr>
      <td><strong>${letter} — ${escapeHtml(area?.name || steamAreaNames[letter] || letter)}</strong></td>
      <td>${escapeHtml(m.contribution || '—')}</td>
      <td>${escapeHtml(m.activity || '—')}</td>
      <td>${escapeHtml(m.evidence || '—')}</td>
    </tr>`;
  }).join('');

  const objectivesHTML = (objectives || []).map((o, i) => `<li>${String.fromCharCode(97 + i)}) ${escapeHtml(o)}</li>`).join('');
  const materialsHTML = (materials || []).map((m) => `<li>${escapeHtml(m)}</li>`).join('');
  const bnccHTML = (bncc || []).map((c) => {
    const parts = c.split(' — ')
    const code = parts[0].trim()
    const desc = parts[1] ? parts[1].trim() : ''
    return `<span class="bncc-chip"><code>${escapeHtml(code)}</code>${desc ? ` <span class="bncc-desc">— ${escapeHtml(desc)}</span>` : ''}</span>`
  }).join('');
  const bibliographyHTML = (bibliography || []).map((b) => `<p class="ref">${escapeHtml(b)}</p>`).join('');
  const accessibilityHTML = Array.isArray(accessibility) && accessibility.length
    ? `<ul>${accessibility.map((a) => `<li>${escapeHtml(a)}</li>`).join('')}</ul>`
    : '';

  const steamUsedList = steamLetters.map((l) => {
    const area = STEAM_AREAS[l];
    const m = (steamMatrix || {})[l] || {};
    return `<li><strong>${l} — ${escapeHtml(area?.name || l)}:</strong> ${escapeHtml(m.contribution || area?.description || '')}</li>`;
  }).join('');

  const blankLines = (n) => Array(n).fill('<div class="blank-line"></div>').join('');

  const sa = studentActivity || {}
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

      ${sa.situationProblem ? `
      <div class="sa-section">
        <div class="sa-section-title">Situação-problema</div>
        <div class="sa-highlight">${escapeHtml(sa.situationProblem)}</div>
      </div>` : ''}

      ${sa.investigativeChallenge ? `
      <div class="sa-section">
        <div class="sa-section-title">Seu desafio</div>
        <div class="sa-challenge">${escapeHtml(sa.investigativeChallenge)}</div>
      </div>` : ''}

      ${(sa.questions || []).length > 0 ? `
      <div class="sa-section">
        <div class="sa-section-title">Responda</div>
        <ol class="sa-questions">
          ${(sa.questions || []).map(q => `<li>
            <div class="sa-q-text">${escapeHtml(q)}</div>
            <div class="sa-answer-lines">
              <div class="blank-line"></div>
              <div class="blank-line"></div>
              <div class="blank-line"></div>
            </div>
          </li>`).join('')}
        </ol>
      </div>` : ''}

      ${sa.practicalActivity ? `
      <div class="sa-section">
        <div class="sa-section-title">Atividade prática — Desafio Maker</div>
        <div class="sa-practical">${formatMultiline(sa.practicalActivity)}</div>
        <div style="margin-top:0.5cm;">
          <div class="sa-section-title" style="font-size:9pt;">Minha solução / O que criei</div>
          <div class="blank-line"></div>
          <div class="blank-line"></div>
          <div class="blank-line"></div>
          <div class="blank-line"></div>
          <div class="blank-line"></div>
        </div>
      </div>` : ''}
    </div>` : ''

  const stagesHTML = (stages || []).map((stage, i) => {
    const num = stage.number || (i + 1);
    const qs = (stage.questions || []).map(q => `<li>${escapeHtml(q)}</li>`).join('');
    return `<div class="stage-card">
      <div class="stage-header">
        <span class="stage-num">Etapa ${num}</span>
        <span class="stage-title">${escapeHtml(stage.title || '')}</span>
        ${stage.duration ? `<span class="stage-dur">⏱ ${escapeHtml(stage.duration)}</span>` : ''}
      </div>
      ${stage.objective ? `<div class="stage-objective">${escapeHtml(stage.objective)}</div>` : ''}
      ${stage.description ? `<p>${escapeHtml(stage.description)}</p>` : ''}
      ${stage.teacherScript ? `<div class="stage-script">${escapeHtml(stage.teacherScript)}</div>` : ''}
      ${qs ? `<div class="stage-q"><strong>Perguntas:</strong><ul>${qs}</ul></div>` : ''}
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title || 'Atividade Pedagógica')}</title>
  <style>
    @page {
      size: A4;
      margin: 3cm 2cm 2cm 3cm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
      background: #fff;
      padding: 3cm 2cm 2cm 3cm;
      max-width: 21cm;
      margin: 0 auto;
    }

    /* ── CAPA ── */
    .cover {
      text-align: center;
      margin-bottom: 2cm;
      padding-bottom: 1.5cm;
      border-bottom: 2px solid #000;
    }
    .cover-label {
      font-size: 10pt;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #555;
      margin-bottom: 0.8cm;
    }
    .cover h1 {
      font-size: 16pt;
      font-weight: bold;
      text-transform: uppercase;
      line-height: 1.4;
      margin-bottom: 0.5cm;
    }
    .cover .subtitle {
      font-size: 12pt;
      font-style: italic;
      color: #333;
      margin-bottom: 0.8cm;
    }
    .cover .meta-grid {
      display: inline-grid;
      grid-template-columns: auto auto;
      gap: 0.2cm 0.6cm;
      text-align: left;
      font-size: 11pt;
      margin-top: 0.5cm;
    }
    .cover .meta-label { font-weight: bold; }
    .cover .meta-value { color: #333; }
    .cover .generated {
      margin-top: 0.8cm;
      font-size: 10pt;
      color: #666;
    }

    /* ── SEÇÕES ── */
    .section { margin-top: 1.2cm; page-break-inside: avoid; }
    .section-title {
      font-size: 12pt;
      font-weight: bold;
      text-transform: uppercase;
      border-bottom: 1px solid #000;
      padding-bottom: 0.15cm;
      margin-bottom: 0.5cm;
    }
    .subsection-title {
      font-size: 12pt;
      font-weight: bold;
      margin: 0.5cm 0 0.25cm;
    }

    /* ── TEXTO ── */
    p { text-align: justify; margin-bottom: 0.4cm; }
    ul, ol { padding-left: 1.2cm; margin-bottom: 0.4cm; }
    li { margin-bottom: 0.2cm; text-align: justify; }
    code {
      font-family: 'Courier New', monospace;
      font-size: 10pt;
      background: #f0f0f0;
      padding: 0.05cm 0.2cm;
      border-radius: 2px;
    }

    /* ── DESTAQUE ── */
    .highlight {
      background: #f8f8f8;
      border-left: 3px solid #000;
      padding: 0.4cm 0.6cm;
      margin: 0.4cm 0;
      font-style: italic;
    }
    .maker-box {
      background: #f8f8f8;
      border: 1px solid #ccc;
      border-left: 4px solid #555;
      padding: 0.4cm 0.6cm;
      margin: 0.4cm 0;
    }

    /* ── TABELA STEAM ── */
    table { width: 100%; border-collapse: collapse; margin: 0.4cm 0; font-size: 11pt; }
    th, td { border: 1px solid #ccc; padding: 0.3cm 0.4cm; vertical-align: top; text-align: left; }
    th { background: #f0f0f0; font-weight: bold; font-size: 10pt; text-transform: uppercase; letter-spacing: 0.04em; }

    /* ── BNCC ── */
    .bncc-list { display: flex; flex-wrap: wrap; gap: 0.2cm 0; margin: 0.3cm 0; }
    .bncc-chip { display: block; margin-bottom: 0.2cm; font-size: 10pt; }
    .bncc-chip code { font-family: 'Courier New', monospace; font-size: 10pt; background: #f0f0f0; padding: 0.05cm 0.25cm; border-radius: 2px; font-weight: bold; }
    .bncc-desc { color: #333; font-style: italic; }

    /* ── AVALIAÇÃO / ESPAÇO ── */
    .blank-line {
      border-bottom: 1px solid #bbb;
      height: 0.9cm;
      margin-bottom: 0.15cm;
    }
    .avaliacao-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.4cm;
      margin: 0.3cm 0;
    }
    .avaliacao-item label {
      font-size: 10pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      display: block;
      margin-bottom: 0.15cm;
    }

    /* ── ATIVIDADE DO ALUNO ── */
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
    .sa-answer-lines { margin-left: 0; }
    .sa-practical { font-size: 11pt; line-height: 1.6; text-align: justify; border: 1px solid #ccc; padding: 0.35cm 0.5cm; }

    /* ── ETAPAS ── */
    .stage-card { border: 1px solid #ccc; border-left: 4px solid #333; border-radius: 3px; padding: 0.35cm 0.55cm; margin-bottom: 0.4cm; page-break-inside: avoid; }
    .stage-header { display: flex; align-items: baseline; gap: 0.5cm; margin-bottom: 0.2cm; flex-wrap: wrap; }
    .stage-num { font-size: 9pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.06em; color: #555; white-space: nowrap; }
    .stage-title { font-weight: bold; font-size: 11pt; }
    .stage-objective { font-size: 10pt; font-style: italic; color: #333; margin-bottom: 0.15cm; }
    .stage-dur { font-size: 9pt; color: #666; font-style: italic; margin-left: auto; }
    .stage-script { background: #f5f5f5; border-left: 2px solid #999; padding: 0.2cm 0.4cm; margin: 0.2cm 0; font-size: 11pt; }
    .stage-q { margin-top: 0.2cm; font-size: 11pt; }
    .stage-q ul { margin: 0.1cm 0 0; }

    /* ── REFERÊNCIAS ── */
    .ref {
      text-align: justify;
      padding-left: 1.27cm;
      text-indent: -1.27cm;
      margin-bottom: 0.3cm;
      line-height: 1.5;
    }

    /* ── RODAPÉ ── */
    .doc-footer {
      margin-top: 1.5cm;
      padding-top: 0.5cm;
      border-top: 1px solid #ccc;
      font-size: 9pt;
      color: #555;
      text-align: center;
    }

    @media print {
      body { padding: 0; }
      .section { page-break-inside: avoid; }
      .section-title { page-break-after: avoid; }
    }
  </style>
</head>
<body>

  <!-- CAPA -->
  <div class="cover">
    <div class="cover-label">Plano de Atividade Pedagógica · STEAM + Cultura Maker</div>
    <h1>${escapeHtml(title || 'Atividade Pedagógica')}</h1>
    ${theme ? `<div class="subtitle">${escapeHtml(theme)}</div>` : ''}
    <div class="meta-grid">
      ${discipline ? `<span class="meta-label">Disciplina:</span><span class="meta-value">${escapeHtml(discipline)}</span>` : ''}
      ${grade ? `<span class="meta-label">Série/Turma:</span><span class="meta-value">${escapeHtml(grade)}</span>` : ''}
      ${duration ? `<span class="meta-label">Duração:</span><span class="meta-value">${escapeHtml(duration)}</span>` : ''}
      ${modality ? `<span class="meta-label">Modalidade:</span><span class="meta-value">${modality === 'individual' ? 'Individual' : 'Em grupo'}</span>` : ''}
    </div>
    <div class="generated">Gerado em ${generatedDate} · STEAM Planner</div>
  </div>

  <!-- 1. IDENTIFICAÇÃO -->
  <div class="section">
    <div class="section-title">1&nbsp;&nbsp;Identificação</div>
    <table>
      <tbody>
        <tr><td style="width:30%;font-weight:bold;">Título</td><td>${escapeHtml(title || '—')}</td></tr>
        ${discipline ? `<tr><td style="font-weight:bold;">Disciplina</td><td>${escapeHtml(discipline)}</td></tr>` : ''}
        ${grade ? `<tr><td style="font-weight:bold;">Série/Turma</td><td>${escapeHtml(grade)}</td></tr>` : ''}
        ${theme ? `<tr><td style="font-weight:bold;">Tema</td><td>${escapeHtml(theme)}</td></tr>` : ''}
        ${duration ? `<tr><td style="font-weight:bold;">Duração total</td><td>${escapeHtml(duration)}</td></tr>` : ''}
        ${modality ? `<tr><td style="font-weight:bold;">Modalidade</td><td>${modality === 'individual' ? 'Individual' : 'Em grupo'}</td></tr>` : ''}
      </tbody>
    </table>
  </div>

  <!-- 2. CONTEXTUALIZAÇÃO -->
  ${problem || guidingQuestion ? `
  <div class="section">
    <div class="section-title">2&nbsp;&nbsp;Contextualização</div>
    ${problem ? `<p>${escapeHtml(problem)}</p>` : ''}
    ${guidingQuestion ? `
    <div class="subsection-title">Questão norteadora</div>
    <div class="highlight">${escapeHtml(guidingQuestion)}</div>` : ''}
  </div>` : ''}

  <!-- 3. OBJETIVOS DE APRENDIZAGEM -->
  ${objectivesHTML ? `
  <div class="section">
    <div class="section-title">3&nbsp;&nbsp;Objetivos de Aprendizagem</div>
    <ul>${objectivesHTML}</ul>
  </div>` : ''}

  <!-- 4. COMPETÊNCIAS DA BNCC -->
  ${bnccHTML ? `
  <div class="section">
    <div class="section-title">4&nbsp;&nbsp;Competências da BNCC</div>
    <p>As seguintes habilidades da Base Nacional Comum Curricular são trabalhadas nesta atividade:</p>
    <div class="bncc-list">${bnccHTML}</div>
    <p style="font-size:10pt;color:#555;font-style:italic;">
      Conforme ABNT NBR 6024, as habilidades estão organizadas de acordo com a área do conhecimento e a série indicada.
    </p>
  </div>` : ''}

  <!-- 5. ÁREAS STEAM UTILIZADAS -->
  ${steamLetters.length > 0 ? `
  <div class="section">
    <div class="section-title">5&nbsp;&nbsp;Áreas STEAM Utilizadas</div>
    ${competencias ? `<p>${formatMultiline(competencias)}</p>` : ''}
    <ul>${steamUsedList}</ul>
    <table style="margin-top:0.4cm;">
      <thead>
        <tr>
          <th>Área</th>
          <th>Contribuição pedagógica</th>
          <th>Atividade proposta</th>
          <th>Evidência esperada</th>
        </tr>
      </thead>
      <tbody>${matrixRows}</tbody>
    </table>
  </div>` : ''}

  <!-- 6. CULTURA MAKER -->
  <div class="section">
    <div class="section-title">6&nbsp;&nbsp;Cultura Maker</div>
    <div class="maker-box">
      <p>Esta atividade integra princípios da <strong>Cultura Maker</strong> como metodologia central: os estudantes aprendem fazendo, testando, errando e melhorando. O processo de construção, prototipagem e iteração é tão valorizado quanto o produto final.</p>
      <p>Elementos Maker presentes:</p>
      <ul>
        <li>Prototipagem prática com materiais acessíveis;</li>
        <li>Ciclos de iteração: construir → testar → melhorar;</li>
        <li>Trabalho colaborativo em grupos com papéis definidos;</li>
        <li>Protagonismo estudantil na resolução do problema;</li>
        <li>Aprendizagem mão na massa (<em>hands-on learning</em>).</li>
      </ul>
    </div>
  </div>

  <!-- 7. MATERIAIS NECESSÁRIOS -->
  ${materialsHTML ? `
  <div class="section">
    <div class="section-title">7&nbsp;&nbsp;Materiais Necessários</div>
    <ul>${materialsHTML}</ul>
  </div>` : ''}

  <!-- 8. ANTES DA AULA -->
  ${beforeClass ? `
  <div class="section">
    <div class="section-title">8&nbsp;&nbsp;Preparação — Antes da Aula</div>
    <p>${formatMultiline(beforeClass)}</p>
  </div>` : ''}

  <!-- 9. ROTEIRO PEDAGÓGICO -->
  <div class="section">
    <div class="section-title">9&nbsp;&nbsp;Roteiro Pedagógico</div>
    ${stagesHTML || (desenvolvimento ? `<div>${formatMultiline(desenvolvimento)}</div>` :
      activityManual ? `<div>${formatMultiline(activityManual)}</div>` :
      '<p>(Desenvolvimento a ser preenchido pelo professor.)</p>')}
  </div>

  <!-- ATIVIDADE DO ALUNO (folha separada) -->
  ${studentActivityHTML}

  <!-- 10. DESAFIO MAKER -->
  <div class="section">
    <div class="section-title">10&nbsp;&nbsp;Desafio Maker</div>
    ${problem ? `<div class="highlight"><strong>Desafio central:</strong> ${escapeHtml(problem)}</div>` : ''}
    <p>Os estudantes devem, ao final da atividade, ter produzido um artefato, modelo ou solução concreta para o problema proposto, demonstrando domínio das competências STEAM selecionadas.</p>
    <div class="subsection-title">Critérios do desafio</div>
    <ul>
      <li>Utilizar os materiais disponíveis de forma criativa e sustentável;</li>
      <li>Apresentar ao menos um ciclo completo de prototipagem e melhoria;</li>
      <li>Documentar o processo com registros do grupo (fotos, croquis ou anotações);</li>
      <li>Apresentar e explicar a solução para a turma ao final.</li>
    </ul>
  </div>

  <!-- 11. APÓS A AULA -->
  ${afterClass ? `
  <div class="section">
    <div class="section-title">11&nbsp;&nbsp;Encerramento — Após a Aula</div>
    <p>${formatMultiline(afterClass)}</p>
  </div>` : ''}

  <!-- 12. DICAS PARA O PROFESSOR -->
  ${teacherTips ? `
  <div class="section">
    <div class="section-title">12&nbsp;&nbsp;Dicas para o Professor</div>
    <p>${formatMultiline(teacherTips)}</p>
  </div>` : ''}

  <!-- 13. ACESSIBILIDADE E INCLUSÃO -->
  ${accessibilityHTML ? `
  <div class="section">
    <div class="section-title">13&nbsp;&nbsp;Acessibilidade e Inclusão</div>
    ${accessibilityHTML}
  </div>` : ''}

  <!-- 14. AVALIAÇÃO -->
  <div class="section">
    <div class="section-title">14&nbsp;&nbsp;Avaliação</div>
    <p>A avaliação desta atividade é processual e formativa, com foco nas competências desenvolvidas ao longo do processo, não apenas no produto final.</p>
    <div class="avaliacao-grid">
      <div class="avaliacao-item">
        <label>Instrumento principal</label>
        <div class="blank-line"></div>
        <div class="blank-line"></div>
      </div>
      <div class="avaliacao-item">
        <label>Indicadores observados</label>
        <div class="blank-line"></div>
        <div class="blank-line"></div>
      </div>
      <div class="avaliacao-item">
        <label>Evidências coletadas</label>
        <div class="blank-line"></div>
        <div class="blank-line"></div>
      </div>
      <div class="avaliacao-item">
        <label>Devolutiva ao estudante</label>
        <div class="blank-line"></div>
        <div class="blank-line"></div>
      </div>
    </div>
  </div>

  <!-- 15. ESPAÇO PARA RESPOSTAS -->
  <div class="section" style="page-break-before:always;">
    <div class="section-title">15&nbsp;&nbsp;Espaço para Respostas dos Estudantes</div>
    <p style="font-size:10pt;color:#555;font-style:italic;">Este espaço destina-se ao registro das respostas, reflexões e conclusões dos estudantes durante e após a atividade.</p>
    <div style="margin-top:0.4cm;">
      <div class="subsection-title" style="font-size:10pt;">Nome: <span style="display:inline-block;width:8cm;border-bottom:1px solid #bbb;">&nbsp;</span>&nbsp;&nbsp;&nbsp;Data: <span style="display:inline-block;width:3cm;border-bottom:1px solid #bbb;">&nbsp;</span></div>
    </div>
    <div style="margin-top:0.5cm;">${blankLines(18)}</div>
  </div>

  <!-- REFERÊNCIAS -->
  ${bibliographyHTML ? `
  <div class="section" style="page-break-before:auto;">
    <div class="section-title">Referências</div>
    <p style="font-size:10pt;color:#555;font-style:italic;margin-bottom:0.5cm;">
      Conforme ABNT NBR 6023:2018. Fontes verificadas em bases acadêmicas (SciELO, OpenAlex, Crossref).
    </p>
    ${bibliographyHTML}
  </div>` : ''}

  <div class="doc-footer">
    Documento gerado pelo STEAM Planner em ${generatedDate} · Normas ABNT NBR 14724, NBR 6023 e NBR 6024
  </div>

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
  const generatedDate = project.generatedAt ? formatDate(project.generatedAt) : "";
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
    ${escapeHtml(project.theme || "")} · ${escapeHtml(project.grade || "")} · ${escapeHtml(project.duration || "")}${generatedDate ? ` · Gerado em ${escapeHtml(generatedDate)}` : ""}
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
