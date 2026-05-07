// ============================================================
// ProjectEditor.jsx
// Tela de edição completa de um projeto STEAM
// ============================================================
//
// Esta é a "central" do projeto. Combina:
// - Edição dos dados gerais (título, tema, áreas, BNCC...)
// - Lista das 5 fases com indicação de progresso
// - Atalhos para abrir cada fase individualmente
// - Exportação do relatório completo
//
// As alterações são salvas automaticamente conforme o
// professor digita, graças ao hook useProjects que persiste
// no navegador a cada mudança.
// ============================================================

import { useState, useEffect } from "react";
import { useProjects } from "../hooks/useProjects.js";
import { PHASES } from "../data/phases.js";
import { STEAM_AREAS, STEAM_KEYS } from "../data/steamAreas.js";
import { RUBRIC_LEVELS, STEAM_RUBRIC_CRITERIA } from "../data/rubric.js";
import { getPhaseStatus, PHASE_STATUS } from "../lib/progress.js";
import { openReportWindow } from "../lib/exportReport.js";
import { getProjectTimeline } from "../lib/timeline.js";
import { trackEvent } from "../lib/analytics.js";

import TextField from "../components/ui/TextField.jsx";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import SteamBadges from "../components/project/SteamBadges.jsx";
import ProgressBar from "../components/project/ProgressBar.jsx";

// ------------------------------------------------------------
// COMPONENTE PROJECT EDITOR
// ------------------------------------------------------------
// Propriedades:
// - projectId  : id do projeto a editar
// - onBack     : função para voltar ao dashboard
// - onOpenPhase: função chamada ao clicar em uma fase
// ------------------------------------------------------------
export default function ProjectEditor({
  projectId,
  currentUser,
  onBack,
  onOpenPhase,
  onOpenBibliography
}) {
  const {
    getProjectById,
    editProject,
    addStudent,
    removeStudent,
    isLoaded
  } = useProjects(currentUser?.id);
  const project = getProjectById(projectId);

  // Estado local para os campos editáveis
  const [savedMsg, setSavedMsg] = useState(false);
  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState("");
  const [grade, setGrade] = useState("");
  const [duration, setDuration] = useState("");
  const [problem, setProblem] = useState("");
  const [finalProduct, setFinalProduct] = useState("");
  const [guidingQuestion, setGuidingQuestion] = useState("");
  const [steam, setSteam] = useState([]);
  const [steamMatrix, setSteamMatrix] = useState({});
  const [steamRubric, setSteamRubric] = useState({});
  const [objectivesText, setObjectivesText] = useState("");
  const [bnccText, setBnccText] = useState("");
  const [materialsText, setMaterialsText] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentClassName, setStudentClassName] = useState("");
  const [studentNotes, setStudentNotes] = useState("");

  // Sincroniza estado local quando o projeto é carregado
  useEffect(() => {
    if (project) {
      setTitle(project.title || "");
      setTheme(project.theme || "");
      setGrade(project.grade || "");
      setDuration(project.duration || "");
      setProblem(project.problem || "");
      setFinalProduct(project.finalProduct || "");
      setGuidingQuestion(project.guidingQuestion || "");
      setSteam(project.steam || []);
      setSteamMatrix(project.steamMatrix || {});
      setSteamRubric(project.steamRubric || {});
      setObjectivesText((project.objectives || []).join("\n"));
      setBnccText((project.bncc || []).join(", "));
      setMaterialsText((project.materials || []).join("\n"));
    }
  }, [projectId, isLoaded]);

  const buildProjectUpdates = () => {
    const objectives = objectivesText
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const bncc = bnccText
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const materials = materialsText
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    return {
      title,
      theme,
      grade,
      duration,
      problem,
      finalProduct,
      guidingQuestion,
      steam,
      steamMatrix,
      steamRubric,
      objectives,
      bncc,
      materials
    };
  };

  // Salva mudanças no projeto convertendo textos em arrays
  const handleSave = () => {
    const updates = buildProjectUpdates();
    editProject(projectId, updates);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
    return updates;
  };

  // Alterna seleção de uma área STEAM
  const toggleSteamArea = (letter) => {
    if (steam.includes(letter)) {
      setSteam(steam.filter((l) => l !== letter));
    } else {
      setSteam([...steam, letter]);
    }
  };

  const updateSteamMatrix = (letter, field, value) => {
    setSteamMatrix((current) => ({
      ...current,
      [letter]: {
        contribution: "",
        activity: "",
        evidence: "",
        ...(current[letter] || {}),
        [field]: value
      }
    }));
  };

  const updateRubric = (criterionId, field, value) => {
    setSteamRubric((current) => ({
      ...current,
      [criterionId]: {
        level: "",
        notes: "",
        ...(current[criterionId] || {}),
        [field]: value
      }
    }));
  };

  const handleAddStudent = () => {
    if (!studentName.trim()) return;
    addStudent(projectId, {
      number: studentNumber,
      name: studentName,
      className: studentClassName,
      notes: studentNotes
    });
    setStudentNumber("");
    setStudentName("");
    setStudentNotes("");
  };

  const handleRemoveStudent = (studentId) => {
    if (confirm("Remover este aluno e seus registros individuais deste projeto?")) {
      removeStudent(projectId, studentId);
    }
  };

  // Exporta relatório em nova janela
  const handleExportReport = () => {
    const updates = handleSave();
    openReportWindow({
      ...project,
      ...updates,
      updatedAt: new Date().toISOString()
    });
    trackEvent(currentUser?.id, "report_exported", { projectId });
  };

  // ----------------------------------------------------------
  // ESTILOS
  // ----------------------------------------------------------
  const containerStyle = {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "2rem 1.5rem"
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
    flexWrap: "wrap",
    gap: "1rem"
  };

  const backButtonStyle = {
    background: "transparent",
    border: "none",
    color: "rgba(255, 255, 255, 0.6)",
    cursor: "pointer",
    fontSize: "0.9rem",
    padding: "0.5rem 0",
    fontFamily: "inherit"
  };

  const sectionStyle = {
    marginBottom: "2.5rem"
  };

  const sectionTitleStyle = {
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: 600,
    marginBottom: "1rem"
  };

  const twoColumnsStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem"
  };

  const matrixGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "1rem"
  };

  const matrixCardStyle = (color) => ({
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderLeft: `3px solid ${color}`,
    borderRadius: "8px",
    padding: "1rem"
  });

  const matrixTitleStyle = (color) => ({
    margin: "0 0 0.9rem",
    color,
    fontSize: "0.95rem",
    fontWeight: 700
  });

  const emptyMatrixStyle = {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: "0.9rem",
    border: "1px dashed rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    padding: "1rem",
    textAlign: "center"
  };

  const studentFormStyle = {
    display: "grid",
    gridTemplateColumns: "120px 1fr 160px",
    gap: "0.75rem",
    alignItems: "start"
  };

  const studentListStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    marginTop: "1rem"
  };

  const studentRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    gap: "1rem",
    alignItems: "center",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    background: "rgba(255, 255, 255, 0.035)",
    border: "1px solid rgba(255, 255, 255, 0.07)"
  };

  const studentNameStyle = {
    color: "#FFFFFF",
    fontWeight: 600,
    margin: 0
  };

  const studentMetaStyle = {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: "0.8rem",
    margin: "0.2rem 0 0"
  };

  const rubricRowStyle = {
    display: "grid",
    gridTemplateColumns: "1.2fr 190px 1.6fr",
    gap: "0.75rem",
    alignItems: "start",
    padding: "0.9rem 0",
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)"
  };

  const selectStyle = {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    color: "#FFFFFF",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    outline: "none"
  };

  const steamSelectorStyle = {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap"
  };

  const steamButtonStyle = (letter, isSelected) => {
    const area = STEAM_AREAS[letter];
    return {
      flex: "1 1 calc(20% - 0.5rem)",
      minWidth: "100px",
      padding: "0.85rem 0.5rem",
      borderRadius: "8px",
      cursor: "pointer",
      background: isSelected ? area.color : "rgba(255, 255, 255, 0.04)",
      color: isSelected ? "#0F0F2D" : "rgba(255, 255, 255, 0.4)",
      border: isSelected
        ? `2px solid ${area.color}`
        : "2px solid rgba(255, 255, 255, 0.06)",
      fontWeight: 600,
      fontSize: "0.85rem",
      transition: "all 0.15s ease",
      textAlign: "center",
      fontFamily: "inherit"
    };
  };

  const phaseListStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem"
  };

  const phaseRowStyle = (color) => ({
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "1rem 1.25rem",
    cursor: "pointer",
    borderLeft: `3px solid ${color}`
  });

  const phaseNumberStyle = (color) => ({
    fontSize: "0.75rem",
    color: color,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    minWidth: "60px"
  });

  const phaseInfoStyle = {
    flex: 1,
    minWidth: 0
  };

  const phaseNameStyle = {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#FFFFFF",
    margin: 0
  };

  const phaseSubtitleStyle = {
    fontSize: "0.85rem",
    color: "rgba(255, 255, 255, 0.5)",
    margin: "0.25rem 0 0",
    fontStyle: "italic"
  };

  const phaseStatusStyle = (status) => {
    const colors = {
      [PHASE_STATUS.NOT_STARTED]: "rgba(255, 255, 255, 0.3)",
      [PHASE_STATUS.IN_PROGRESS]: "#C9A14A",
      [PHASE_STATUS.COMPLETED]: "#5B8266"
    };
    return {
      fontSize: "0.75rem",
      color: colors[status],
      fontWeight: 600,
      whiteSpace: "nowrap"
    };
  };

  const actionsStyle = {
    display: "flex",
    gap: "0.75rem",
    justifyContent: "flex-end",
    marginTop: "2rem",
    paddingTop: "1.5rem",
    borderTop: "1px solid rgba(255, 255, 255, 0.06)"
  };

  const timelineBoxStyle = {
    marginTop: "1rem",
    paddingTop: "1rem",
    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
    display: "flex",
    justifyContent: "space-between",
    gap: "1rem",
    flexWrap: "wrap",
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: "0.9rem"
  };

  const timelineHighlightStyle = {
    color: "#FFFFFF",
    fontWeight: 700
  };

  // ----------------------------------------------------------
  // VALIDAÇÕES INICIAIS
  // ----------------------------------------------------------

  if (!isLoaded) {
    return (
      <div style={containerStyle}>
        <p style={{ color: "rgba(255, 255, 255, 0.5)" }}>Carregando...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={containerStyle}>
        <p style={{ color: "rgba(255, 255, 255, 0.7)" }}>
          Projeto não encontrado.
        </p>
        <Button variant="primary" onClick={onBack}>
          Voltar
        </Button>
      </div>
    );
  }

  // ----------------------------------------------------------
  // RENDERIZAÇÃO
  // ----------------------------------------------------------

  const labelStatus = {
    [PHASE_STATUS.NOT_STARTED]: "Não iniciada",
    [PHASE_STATUS.IN_PROGRESS]: "Em andamento",
    [PHASE_STATUS.COMPLETED]: "Concluída"
  };
  const timeline = getProjectTimeline(project);
  const endDateLabel = timeline.endDate
    ? timeline.endDate.toLocaleDateString("pt-BR")
    : null;

  return (
    <div style={containerStyle}>
      {/* Cabeçalho */}
      <div style={headerStyle}>
        <button style={backButtonStyle} onClick={onBack}>
          ← Voltar para projetos
        </button>
        <Button variant="secondary" onClick={handleExportReport}>
          Exportar relatório
        </Button>
      </div>

      {/* SEÇÃO 1 — IDENTIFICAÇÃO */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Identificação</div>
        <TextField
          label="Título do projeto"
          value={title}
          onChange={setTitle}
          placeholder="Ex.: Estação Meteorológica Inteligente"
          required
        />
        <TextField
          label="Tema"
          value={theme}
          onChange={setTheme}
          placeholder="Ex.: Clima, sensores e ciência de dados"
        />
        <div style={twoColumnsStyle}>
          <TextField
            label="Ano escolar"
            value={grade}
            onChange={setGrade}
            placeholder="Ex.: 7º e 8º ano"
          />
          <TextField
            label="Duração"
            value={duration}
            onChange={setDuration}
            placeholder="Ex.: 6 semanas · 12 aulas"
          />
        </div>
        <TextField
          label="Problema ou desafio real"
          value={problem}
          onChange={setProblem}
          multiline
          rows={3}
          placeholder="Descreva a situação concreta que mobiliza o projeto. Ex.: desperdício de água na escola, descarte de resíduos, acessibilidade, clima local..."
          hint="Essa camada ajuda a conectar o projeto STEAM a um contexto real."
        />
        <TextField
          label="Produto final ou solução esperada"
          value={finalProduct}
          onChange={setFinalProduct}
          multiline
          rows={3}
          placeholder="Ex.: protótipo, maquete, campanha, experimento, solução digital, apresentação ou intervenção na escola."
          hint="Esse campo ajuda a explicitar o resultado concreto esperado no projeto STEAM."
        />
      </div>

      {/* SEÇÃO 2 — ÁREAS STEAM */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Áreas STEAM contempladas</div>
        <div style={steamSelectorStyle}>
          {STEAM_KEYS.map((letter) => {
            const area = STEAM_AREAS[letter];
            const isSelected = steam.includes(letter);
            return (
              <button
                key={letter}
                style={steamButtonStyle(letter, isSelected)}
                onClick={() => toggleSteamArea(letter)}
              >
                {letter} · {area.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* SEÇÃO 3 — MATRIZ STEAM */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Matriz STEAM do projeto</div>
        {steam.length === 0 ? (
          <div style={emptyMatrixStyle}>
            Selecione ao menos uma área STEAM para preencher a matriz.
          </div>
        ) : (
          <div style={matrixGridStyle}>
            {steam.map((letter) => {
              const area = STEAM_AREAS[letter];
              const matrix = steamMatrix[letter] || {};
              return (
                <div key={letter} style={matrixCardStyle(area.color)}>
                  <h3 style={matrixTitleStyle(area.color)}>
                    {letter} · {area.name}
                  </h3>
                  <TextField
                    label="Contribuição da área"
                    value={matrix.contribution || ""}
                    onChange={(value) =>
                      updateSteamMatrix(letter, "contribution", value)
                    }
                    multiline
                    rows={2}
                    placeholder="Como esta área contribui para compreender ou resolver o desafio?"
                  />
                  <TextField
                    label="Atividade relacionada"
                    value={matrix.activity || ""}
                    onChange={(value) =>
                      updateSteamMatrix(letter, "activity", value)
                    }
                    multiline
                    rows={2}
                    placeholder="Que ação concreta os estudantes realizarão nessa área?"
                  />
                  <TextField
                    label="Evidência esperada"
                    value={matrix.evidence || ""}
                    onChange={(value) =>
                      updateSteamMatrix(letter, "evidence", value)
                    }
                    multiline
                    rows={2}
                    placeholder="Que registro, produto ou demonstração comprova essa aprendizagem?"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SEÇÃO 4 — QUESTÃO E OBJETIVOS */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Pergunta e objetivos</div>
        <TextField
          label="Questão norteadora"
          value={guidingQuestion}
          onChange={setGuidingQuestion}
          multiline
          rows={2}
          placeholder="A pergunta que guia toda a investigação dos estudantes."
          hint="Esta pergunta aparece em destaque no relatório final."
        />
        <TextField
          label="Objetivos pedagógicos"
          value={objectivesText}
          onChange={setObjectivesText}
          multiline
          rows={4}
          placeholder="Um objetivo por linha"
          hint="Liste cada objetivo em uma linha separada."
        />
      </div>

      {/* SEÇÃO 5 — RUBRICA STEAM */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Rubrica STEAM</div>
        <Card>
          {STEAM_RUBRIC_CRITERIA.map((criterion) => {
            const rubric = steamRubric[criterion.id] || {};
            return (
              <div key={criterion.id} style={rubricRowStyle}>
                <div>
                  <p style={studentNameStyle}>{criterion.label}</p>
                  <p style={studentMetaStyle}>{criterion.description}</p>
                </div>
                <select
                  style={selectStyle}
                  value={rubric.level || ""}
                  onChange={(e) =>
                    updateRubric(criterion.id, "level", e.target.value)
                  }
                >
                  <option value="">Nível...</option>
                  {RUBRIC_LEVELS.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.label}
                    </option>
                  ))}
                </select>
                <TextField
                  value={rubric.notes || ""}
                  onChange={(value) =>
                    updateRubric(criterion.id, "notes", value)
                  }
                  multiline
                  rows={2}
                  placeholder="Observações/evidências para este critério."
                />
              </div>
            );
          })}
        </Card>
      </div>

      {/* SEÇÃO 6 — BNCC E MATERIAIS */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>BNCC e materiais</div>
        <TextField
          label="Habilidades BNCC"
          value={bnccText}
          onChange={setBnccText}
          placeholder="Ex.: EF07CI12, EF08MA23"
          hint="Separe os códigos por vírgula."
        />
        <TextField
          label="Materiais necessários"
          value={materialsText}
          onChange={setMaterialsText}
          multiline
          rows={4}
          placeholder="Um material por linha"
          hint="Liste cada material em uma linha separada."
        />
      </div>

      {/* SEÇÃO 7 — TURMA E ALUNOS */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Turma e alunos</div>
        <Card>
          <div style={studentFormStyle}>
            <TextField
              label="Nº/chamada"
              value={studentNumber}
              onChange={setStudentNumber}
              placeholder="Ex.: 12"
            />
            <TextField
              label="Nome do aluno"
              value={studentName}
              onChange={setStudentName}
              placeholder="Nome completo"
            />
            <TextField
              label="Turma"
              value={studentClassName}
              onChange={setStudentClassName}
              placeholder="Ex.: 8º A"
            />
          </div>
          <TextField
            label="Observações do cadastro"
            value={studentNotes}
            onChange={setStudentNotes}
            multiline
            rows={2}
            placeholder="Campo opcional para informações pedagógicas relevantes."
          />
          <Button
            variant="primary"
            size="small"
            onClick={handleAddStudent}
            disabled={!studentName.trim()}
          >
            + Cadastrar aluno
          </Button>

          <div style={studentListStyle}>
            {(project.students || []).length === 0 ? (
              <div style={emptyMatrixStyle}>
                Nenhum aluno cadastrado neste projeto ainda.
              </div>
            ) : (
              (project.students || []).map((student) => (
                <div key={student.id} style={studentRowStyle}>
                  <div>
                    <p style={studentNameStyle}>
                      {student.number ? `${student.number} · ` : ""}
                      {student.name}
                    </p>
                    <p style={studentMetaStyle}>
                      {student.className || "Turma não informada"}
                      {student.notes ? ` · ${student.notes}` : ""}
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => handleRemoveStudent(student.id)}
                  >
                    Remover
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* SEÇÃO 8 — PROGRESSO GERAL */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Progresso geral do projeto</div>
        <Card>
          <ProgressBar project={project} showLabels />
          <div style={timelineBoxStyle}>
            <span>
              Prazo:{" "}
              <strong style={timelineHighlightStyle}>{timeline.label}</strong>
            </span>
            {endDateLabel && (
              <span>
                Previsão de término:{" "}
                <strong style={timelineHighlightStyle}>{endDateLabel}</strong>
              </span>
            )}
          </div>
        </Card>
      </div>

      {/* SEÇÃO 9 — LISTA DAS 5 FASES */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>As cinco fases STEAM</div>
        <div style={phaseListStyle}>
          {PHASES.map((phase) => {
            const status = getPhaseStatus(project, phase.id);
            return (
              <Card
                key={phase.id}
                variant="clickable"
                accentColor={phase.color}
                onClick={() => onOpenPhase(phase.id)}
                padding="0"
              >
                <div style={phaseRowStyle(phase.color)}>
                  <div style={phaseNumberStyle(phase.color)}>
                    Fase {phase.number}
                  </div>
                  <div style={phaseInfoStyle}>
                    <h3 style={phaseNameStyle}>{phase.name}</h3>
                    <p style={phaseSubtitleStyle}>{phase.subtitle}</p>
                  </div>
                  <div style={phaseStatusStyle(status.status)}>
                    {labelStatus[status.status]}
                    {status.status !== PHASE_STATUS.NOT_STARTED &&
                      ` · ${status.completed}/3`}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* REFERÊNCIAS BIBLIOGRÁFICAS */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Referências Bibliográficas</div>
        <Card
          variant="clickable"
          accentColor="#7C4DFF"
          onClick={onOpenBibliography}
          padding="0"
        >
          <div style={{ ...phaseRowStyle("#7C4DFF"), alignItems: "center" }}>
            <div style={{ fontSize: "1.25rem", lineHeight: 1 }}>📚</div>
            <div style={phaseInfoStyle}>
              <h3 style={phaseNameStyle}>Referências Bibliográficas</h3>
              <p style={phaseSubtitleStyle}>
                {(project?.bibliography?.length || 0) === 0
                  ? "Nenhuma referência cadastrada"
                  : `${project.bibliography.length} ${
                      project.bibliography.length === 1
                        ? "referência cadastrada"
                        : "referências cadastradas"
                    }`}
              </p>
            </div>
            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.35)" }}>
              Gerenciar →
            </div>
          </div>
        </Card>
      </div>

      {/* AÇÕES NO RODAPÉ */}
      <div style={actionsStyle}>
        <Button variant="secondary" onClick={onBack}>
          Voltar
        </Button>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {savedMsg && (
            <span style={{ color: "#4ade80", fontSize: "14px", fontWeight: 500 }}>
              Alterações salvas com sucesso!
            </span>
          )}
          <Button variant="primary" onClick={handleSave}>
            Salvar alterações
          </Button>
        </div>
      </div>
    </div>
  );
}
