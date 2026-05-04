// ============================================================
// PhaseEditor.jsx
// Tela de edição de uma fase específica do projeto STEAM
// ============================================================
//
// Esta tela operacionaliza, dentro do app, todo o ciclo de
// trabalho do professor numa fase do projeto:
//
// 1. Lembrete didático da fase (descrição, ações, foco)
// 2. Plano pedagógico (como conduzir essa fase nesta turma)
// 3. Diário de bordo (registros datados do que aconteceu)
// 4. Avaliação em fases (núcleo da pesquisa de mestrado)
//
// É a tela mais rica do app, pois reúne planejamento,
// execução e avaliação em um único fluxo coerente.
// ============================================================

import { useState, useEffect } from "react";
import { useProjects } from "../hooks/useProjects.js";
import { PHASES, getPhaseById } from "../data/phases.js";

import PhaseHeader from "../components/phase/PhaseHeader.jsx";
import DiaryEntry from "../components/phase/DiaryEntry.jsx";
import DiaryEntryForm from "../components/phase/DiaryEntryForm.jsx";
import EvaluationForm from "../components/phase/EvaluationForm.jsx";
import TextField from "../components/ui/TextField.jsx";
import Button from "../components/ui/Button.jsx";

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "";
  try {
    const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T12:00:00`)
      : new Date(value);
    return date.toLocaleDateString("pt-BR");
  } catch {
    return "";
  }
}

// ------------------------------------------------------------
// COMPONENTE PHASE EDITOR
// ------------------------------------------------------------
// Propriedades:
// - projectId : id do projeto pai
// - phaseId   : id da fase atual sendo editada
// - onBack    : função chamada para voltar ao projeto
// - onChangePhase : função para navegar entre fases
// ------------------------------------------------------------
export default function PhaseEditor({
  projectId,
  phaseId,
  currentUser,
  onBack,
  onChangePhase
}) {
  const {
    getProjectById,
    editPhasePlan,
    addEntry,
    removeEntry,
    editEntry,
    addStudentEntry,
    removeStudentEntry,
    editPhaseEvaluation,
    isLoaded
  } = useProjects(currentUser?.id);

  const project = getProjectById(projectId);
  const phase = getPhaseById(phaseId);

  // Estado local do plano pedagógico
  const [plan, setPlan] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentEntryDate, setStudentEntryDate] = useState(getTodayInputValue());
  const [studentEntryText, setStudentEntryText] = useState("");

  // Sincroniza plano local com o projeto carregado
  useEffect(() => {
    if (project && project.phases[phaseId]) {
      setPlan(project.phases[phaseId].plan || "");
    }
  }, [project, phaseId]);

  // Salva o plano pedagógico
  const handleSavePlan = () => {
    editPhasePlan(projectId, phaseId, plan);
  };

  // Adiciona registro no diário
  const handleAddDiaryEntry = (text, date) => {
    addEntry(projectId, phaseId, text, date);
  };

  // Remove registro do diário
  const handleDeleteDiaryEntry = (entryId) => {
    removeEntry(projectId, phaseId, entryId);
  };

  // Edita data/texto de um registro do diário
  const handleEditDiaryEntry = (entryId, updates) => {
    editEntry(projectId, phaseId, entryId, updates);
  };

  const handleAddStudentDiaryEntry = () => {
    if (!selectedStudentId || !studentEntryText.trim()) return;
    addStudentEntry(
      projectId,
      phaseId,
      selectedStudentId,
      studentEntryText,
      studentEntryDate
    );
    setStudentEntryText("");
  };

  const handleDeleteStudentDiaryEntry = (studentId, entryId) => {
    if (confirm("Excluir este registro individual?")) {
      removeStudentEntry(projectId, phaseId, studentId, entryId);
    }
  };

  // Salva avaliação da fase
  const handleSaveEvaluation = (evaluation) => {
    editPhaseEvaluation(projectId, phaseId, evaluation);
    alert("Avaliação salva!");
  };

  // Navegação entre fases (anterior e próxima)
  const currentPhaseIndex = PHASES.findIndex((p) => p.id === phaseId);
  const previousPhase =
    currentPhaseIndex > 0 ? PHASES[currentPhaseIndex - 1] : null;
  const nextPhase =
    currentPhaseIndex < PHASES.length - 1
      ? PHASES[currentPhaseIndex + 1]
      : null;

  // ----------------------------------------------------------
  // ESTILOS
  // ----------------------------------------------------------
  const containerStyle = {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "2rem 1.5rem"
  };

  const topBarStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
    flexWrap: "wrap",
    gap: "0.75rem"
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

  const navigationStyle = {
    display: "flex",
    gap: "0.5rem"
  };

  const sectionStyle = {
    marginBottom: "3rem"
  };

  const sectionTitleStyle = (color) => ({
    fontSize: "1.1rem",
    fontWeight: 600,
    color: color,
    marginBottom: "1rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem"
  });

  const sectionLabelStyle = {
    fontSize: "0.7rem",
    color: "rgba(255, 255, 255, 0.4)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 600
  };

  const planActionsStyle = {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "0.5rem"
  };

  const diaryEntriesStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem"
  };

  const emptyDiaryStyle = {
    fontSize: "0.9rem",
    color: "rgba(255, 255, 255, 0.4)",
    fontStyle: "italic",
    textAlign: "center",
    padding: "1.5rem",
    border: "1px dashed rgba(255, 255, 255, 0.08)",
    borderRadius: "8px"
  };

  const individualBoxStyle = {
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "8px",
    padding: "1rem",
    marginBottom: "1rem"
  };

  const individualFormStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 150px",
    gap: "0.75rem",
    alignItems: "start"
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
    outline: "none",
    boxSizing: "border-box"
  };

  const dateInputStyle = {
    ...selectStyle,
    fontWeight: 700,
    colorScheme: "dark",
    WebkitTextFillColor: "#FFFFFF"
  };

  const studentEntryStyle = {
    background: "rgba(255, 255, 255, 0.035)",
    border: "1px solid rgba(255, 255, 255, 0.07)",
    borderRadius: "8px",
    padding: "0.8rem 1rem"
  };

  const studentEntryHeaderStyle = {
    display: "flex",
    justifyContent: "space-between",
    gap: "1rem",
    marginBottom: "0.4rem",
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: "0.78rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em"
  };

  const bottomNavStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "3rem",
    paddingTop: "2rem",
    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
    flexWrap: "wrap",
    gap: "1rem"
  };

  // ----------------------------------------------------------
  // VALIDAÇÕES
  // ----------------------------------------------------------

  if (!isLoaded) {
    return (
      <div style={containerStyle}>
        <p style={{ color: "rgba(255, 255, 255, 0.5)" }}>Carregando...</p>
      </div>
    );
  }

  if (!project || !phase) {
    return (
      <div style={containerStyle}>
        <p style={{ color: "rgba(255, 255, 255, 0.7)" }}>
          Fase não encontrada.
        </p>
        <Button variant="primary" onClick={onBack}>
          Voltar ao projeto
        </Button>
      </div>
    );
  }

  const phaseData = project.phases[phaseId] || {
    plan: "",
    entries: [],
    studentEntries: {},
    evaluation: {}
  };
  const students = project.students || [];
  const selectedStudent = students.find((student) => student.id === selectedStudentId);
  const selectedStudentEntries = selectedStudent
    ? phaseData.studentEntries?.[selectedStudent.id] || []
    : [];

  // ----------------------------------------------------------
  // RENDERIZAÇÃO
  // ----------------------------------------------------------
  return (
    <div style={containerStyle}>
      {/* Barra superior com voltar e navegação entre fases */}
      <div style={topBarStyle}>
        <button style={backButtonStyle} onClick={onBack}>
          ← Voltar ao projeto
        </button>

        <div style={navigationStyle}>
          {previousPhase && (
            <Button
              variant="ghost"
              size="small"
              onClick={() => onChangePhase(previousPhase.id)}
            >
              ← {previousPhase.name}
            </Button>
          )}
          {nextPhase && (
            <Button
              variant="ghost"
              size="small"
              onClick={() => onChangePhase(nextPhase.id)}
            >
              {nextPhase.name} →
            </Button>
          )}
        </div>
      </div>

      {/* SEÇÃO 1 — CABEÇALHO DIDÁTICO DA FASE */}
      <PhaseHeader phase={phase} />

      {/* SEÇÃO 2 — PLANO PEDAGÓGICO */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle(phase.color)}>
          <span style={sectionLabelStyle}>Componente 1</span>
          Plano pedagógico desta fase
        </div>

        <TextField
          value={plan}
          onChange={setPlan}
          multiline
          rows={6}
          placeholder="Descreva como você vai conduzir esta fase com a sua turma. Atividades, sequência, recursos específicos, cronograma local."
          hint="Esta é a sua adaptação da fase ao contexto real da turma."
        />
        <div style={planActionsStyle}>
          <Button variant="primary" size="small" onClick={handleSavePlan}>
            Salvar plano
          </Button>
        </div>
      </div>

      {/* SEÇÃO 3 — DIÁRIO DE BORDO */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle(phase.color)}>
          <span style={sectionLabelStyle}>Componente 2</span>
          Diário de bordo da fase
        </div>

        {/* Formulário para novo registro */}
        <DiaryEntryForm onSubmit={handleAddDiaryEntry} />

        {/* Lista de registros já feitos */}
        {phaseData.entries.length === 0 ? (
          <div style={emptyDiaryStyle}>
            Nenhum registro ainda. Use o formulário acima para
            documentar o que aconteceu nas aulas desta fase.
          </div>
        ) : (
          <div style={diaryEntriesStyle}>
            {phaseData.entries
              .slice()
              .reverse()
              .map((entry) => (
                <DiaryEntry
                  key={entry.id}
                  entry={entry}
                  onDelete={handleDeleteDiaryEntry}
                  onEdit={handleEditDiaryEntry}
                />
              ))}
          </div>
        )}
      </div>

      {/* SEÇÃO 4 — AVALIAÇÃO EM FASES */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle(phase.color)}>
          <span style={sectionLabelStyle}>Componente 3</span>
          Diário individual dos alunos
        </div>

        {students.length === 0 ? (
          <div style={emptyDiaryStyle}>
            Nenhum aluno cadastrado neste projeto. Volte ao projeto e cadastre
            a turma para registrar observações individuais.
          </div>
        ) : (
          <>
            <div style={individualBoxStyle}>
              <div style={individualFormStyle}>
                <div>
                  <label style={sectionLabelStyle}>Aluno</label>
                  <select
                    style={selectStyle}
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                  >
                    <option value="">Selecione um aluno...</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.number ? `${student.number} · ` : ""}
                        {student.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={sectionLabelStyle}>Data</label>
                  <input
                    type="date"
                    style={dateInputStyle}
                    value={studentEntryDate}
                    onChange={(e) => setStudentEntryDate(e.target.value)}
                  />
                </div>
              </div>
              <TextField
                value={studentEntryText}
                onChange={setStudentEntryText}
                multiline
                rows={4}
                placeholder="Registre participação, avanços, dificuldades, evidências de aprendizagem ou encaminhamentos específicos."
              />
              <Button
                variant="primary"
                size="small"
                onClick={handleAddStudentDiaryEntry}
                disabled={!selectedStudentId || !studentEntryText.trim()}
              >
                Gravar registro individual
              </Button>
            </div>

            {selectedStudent ? (
              selectedStudentEntries.length === 0 ? (
                <div style={emptyDiaryStyle}>
                  Nenhum registro individual para {selectedStudent.name} nesta fase.
                </div>
              ) : (
                <div style={diaryEntriesStyle}>
                  {selectedStudentEntries
                    .slice()
                    .reverse()
                    .map((entry) => (
                      <div key={entry.id} style={studentEntryStyle}>
                        <div style={studentEntryHeaderStyle}>
                          <span>{formatDate(entry.date)}</span>
                          <button
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#E8358A",
                              cursor: "pointer",
                              fontFamily: "inherit"
                            }}
                            onClick={() =>
                              handleDeleteStudentDiaryEntry(
                                selectedStudent.id,
                                entry.id
                              )
                            }
                          >
                            Excluir
                          </button>
                        </div>
                        <p style={{ margin: 0, color: "rgba(255,255,255,0.84)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                          {entry.text}
                        </p>
                      </div>
                    ))}
                </div>
              )
            ) : (
              <div style={emptyDiaryStyle}>
                Selecione um aluno para visualizar o diário individual nesta fase.
              </div>
            )}
          </>
        )}
      </div>

      {/* SEÇÃO 5 — AVALIAÇÃO EM FASES */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle(phase.color)}>
          <span style={sectionLabelStyle}>Componente 4</span>
          Avaliação em fases
        </div>

        <EvaluationForm
          phaseId={phaseId}
          evaluation={phaseData.evaluation}
          onSave={handleSaveEvaluation}
        />
      </div>

      {/* NAVEGAÇÃO INFERIOR */}
      <div style={bottomNavStyle}>
        {previousPhase ? (
          <Button
            variant="secondary"
            onClick={() => onChangePhase(previousPhase.id)}
          >
            ← {previousPhase.name}
          </Button>
        ) : (
          <span />
        )}

        <Button variant="ghost" onClick={onBack}>
          Voltar ao projeto
        </Button>

        {nextPhase ? (
          <Button
            variant="primary"
            onClick={() => onChangePhase(nextPhase.id)}
          >
            {nextPhase.name} →
          </Button>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
