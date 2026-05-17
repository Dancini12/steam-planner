import { useState, useMemo } from "react";
import { STEAM_AREAS } from "../data/steamAreas.js";
import { openActivityPrintWindow } from "../lib/exportReport.js";
import { trackEvent } from "../lib/analytics.js";
import { useProjects } from "../hooks/useProjects.js";
import Button from "../components/ui/Button.jsx";
import { suggestProjectContinuity } from "../lib/machine-learning/project-continuity/continuityEngine.js";
import BibliographyVerifier from "../components/project/BibliographyVerifier.jsx";

export default function ActivityViewer({ activityData, formData, projectId, currentUser, onBack }) {
  const { editProject } = useProjects(currentUser?.id);
  const [title, setTitle] = useState(activityData.title || "");
  const [theme, setTheme] = useState(activityData.theme || "");
  const [duration, setDuration] = useState(activityData.duration || "");
  const [problem, setProblem] = useState(activityData.problem || "");
  const [guidingQuestion, setGuidingQuestion] = useState(activityData.guidingQuestion || "");
  const [objectivesText, setObjectivesText] = useState((activityData.objectives || []).join("\n"));
  const [bnccText, setBnccText] = useState((activityData.bncc || []).join(", "));
  const [materialsText, setMaterialsText] = useState((activityData.materials || []).join("\n"));
  const [activityManual, setActivityManual] = useState(activityData.activityManual || "");
  const [steamMatrix, setSteamMatrix] = useState({ ...(activityData.steamMatrix || {}) });
  const [accessibilityText, setAccessibilityText] = useState(
    Array.isArray(activityData.accessibility)
      ? activityData.accessibility.join("\n")
      : activityData.accessibility || ""
  );
  const [bibliographyText, setBibliographyText] = useState((activityData.bibliography || []).join("\n"));
  const [modality, setModality] = useState(activityData.modality || 'grupo');
  const [stages] = useState(activityData.stages || []);
  const [beforeClass, setBeforeClass] = useState(activityData.beforeClass || '');
  const [afterClass, setAfterClass] = useState(activityData.afterClass || '');
  const [teacherTips, setTeacherTips] = useState(activityData.teacherTips || '');

  const [savedMsg, setSavedMsg] = useState("");

  const steamLetters = Object.keys(steamMatrix).filter((k) => ["S", "T", "E", "A", "M"].includes(k));

  const continuitySuggestions = useMemo(() =>
    suggestProjectContinuity({ title, theme, grade: formData?.grade, steam: steamLetters }),
    [title, theme, formData?.grade, steamLetters] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const updateMatrix = (letter, field, value) => {
    setSteamMatrix((m) => ({ ...m, [letter]: { ...(m[letter] || {}), [field]: value } }));
  };

  const handleSave = () => {
    if (!projectId) return;
    editProject(projectId, {
      title,
      theme,
      duration,
      problem,
      guidingQuestion,
      objectives: objectivesText.split("\n").map((s) => s.trim()).filter(Boolean),
      bncc: bnccText.split(/[,;]/).map((s) => s.trim()).filter(Boolean),
      materials: materialsText.split("\n").map((s) => s.trim()).filter(Boolean),
      activityManual,
      accessibility: accessibilityText.split("\n").map((s) => s.trim()).filter(Boolean),
      steamMatrix,
      modality,
      stages,
      beforeClass,
      afterClass,
      teacherTips,
      bibliography: bibliographyText.split("\n").map((s) => s.trim()).filter(Boolean)
    });
    setSavedMsg("Alterações salvas.");
    setTimeout(() => setSavedMsg(""), 3000);
  };

  const handlePrint = () => {
    trackEvent(currentUser?.id, "activity_printed", {
      projectId,
      title,
      theme,
      grade: formData?.grade || "",
      discipline: formData?.discipline || "",
      steam: steamLetters,
      bncc: bnccText.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
    }).catch(console.error);

    openActivityPrintWindow({
      title,
      theme,
      duration,
      problem,
      guidingQuestion,
      objectives: objectivesText.split("\n").map((s) => s.trim()).filter(Boolean),
      bncc: bnccText.split(/[,;]/).map((s) => s.trim()).filter(Boolean),
      materials: materialsText.split("\n").map((s) => s.trim()).filter(Boolean),
      activityManual,
      accessibility: accessibilityText.split("\n").map((s) => s.trim()).filter(Boolean),
      steamMatrix,
      modality,
      stages,
      beforeClass,
      afterClass,
      teacherTips,
      bibliography: bibliographyText.split("\n").map((s) => s.trim()).filter(Boolean),
      generatedAt: activityData.generatedAt || null,
      grade: formData?.grade || "",
      discipline: formData?.discipline || ""
    });
  };

  const containerStyle = { maxWidth: "860px", margin: "0 auto", padding: "2rem 1.5rem" };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
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

  const sectionStyle = { marginBottom: "2rem" };

  const sectionTitleStyle = {
    fontSize: "0.7rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "rgba(255, 255, 255, 0.45)",
    fontWeight: 600,
    marginBottom: "1rem",
    paddingBottom: "0.5rem",
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)"
  };

  const labelStyle = {
    fontSize: "0.7rem",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "rgba(255, 255, 255, 0.4)",
    fontWeight: 600,
    marginBottom: "0.4rem",
    display: "block"
  };

  const inputStyle = {
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

  const textareaStyle = (height = "90px") => ({
    ...inputStyle,
    height,
    resize: "vertical",
    lineHeight: 1.6
  });

  const twoColStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" };

  const matrixCardStyle = (color) => ({
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderLeft: `3px solid ${color}`,
    borderRadius: "8px",
    padding: "1rem",
    marginBottom: "0.75rem"
  });

  const footerStyle = {
    display: "flex",
    justifyContent: "space-between",
    paddingTop: "1.5rem",
    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
    marginTop: "1rem"
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <button style={backButtonStyle} onClick={onBack}>← Voltar</button>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {savedMsg && (
            <span style={{ fontSize: "0.85rem", color: "#6EE7B7" }}>{savedMsg}</span>
          )}
          {projectId && (
            <Button variant="secondary" onClick={handleSave}>Salvar alterações</Button>
          )}
          <Button variant="primary" onClick={handlePrint}>Gerar PDF</Button>
        </div>
      </div>

      {/* Identificação */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Identificação</div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={labelStyle}>Título</label>
          <input
            style={{ ...inputStyle, fontSize: "1.1rem", fontWeight: 600 }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div style={twoColStyle}>
          <div>
            <label style={labelStyle}>Subtítulo / Tema</label>
            <input style={inputStyle} value={theme} onChange={(e) => setTheme(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Duração</label>
            <input style={inputStyle} value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: "0.75rem" }}>
          <label style={labelStyle}>Modalidade</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {[
              { value: 'grupo', label: 'Em grupo', icon: '👥' },
              { value: 'individual', label: 'Individual', icon: '👤' },
            ].map(({ value, label, icon }) => {
              const active = modality === value;
              return (
                <button
                  key={value}
                  onClick={() => setModality(value)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.55rem 1.1rem",
                    borderRadius: "8px",
                    border: active ? "1px solid rgba(110,231,183,0.6)" : "1px solid rgba(255,255,255,0.08)",
                    background: active ? "rgba(110,231,183,0.1)" : "rgba(255,255,255,0.04)",
                    color: active ? "#6EE7B7" : "rgba(255,255,255,0.5)",
                    fontSize: "0.88rem",
                    fontWeight: active ? 600 : 400,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Problema e Questão Norteadora */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Problema e Questão Norteadora</div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={labelStyle}>Problema ou desafio central</label>
          <textarea style={textareaStyle("80px")} value={problem} onChange={(e) => setProblem(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Questão norteadora</label>
          <textarea style={textareaStyle("60px")} value={guidingQuestion} onChange={(e) => setGuidingQuestion(e.target.value)} />
        </div>
      </div>

      {/* Matriz STEAM */}
      {steamLetters.length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Matriz STEAM</div>
          {steamLetters.map((letter) => {
            const area = STEAM_AREAS[letter];
            const m = steamMatrix[letter] || {};
            return (
              <div key={letter} style={matrixCardStyle(area?.color || "#888")}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: area?.color, marginBottom: "0.75rem" }}>
                  {letter} · {area?.name || letter}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                  {[["contribution", "Contribuição"], ["activity", "Atividade"], ["evidence", "Evidência"]].map(([field, lbl]) => (
                    <div key={field}>
                      <label style={labelStyle}>{lbl}</label>
                      <textarea
                        style={textareaStyle("70px")}
                        value={m[field] || ""}
                        onChange={(e) => updateMatrix(letter, field, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Objetivos, BNCC, Materiais */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Objetivos e Conteúdo</div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={labelStyle}>Objetivos de aprendizagem (um por linha)</label>
          <textarea style={textareaStyle("120px")} value={objectivesText} onChange={(e) => setObjectivesText(e.target.value)} />
        </div>
        <div style={twoColStyle}>
          <div>
            <label style={labelStyle}>Habilidades BNCC (separadas por vírgula)</label>
            <input style={inputStyle} value={bnccText} onChange={(e) => setBnccText(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Materiais (um por linha)</label>
            <textarea style={textareaStyle("80px")} value={materialsText} onChange={(e) => setMaterialsText(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Manual */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Resumo, Materiais e Montagem</div>
        <label style={labelStyle}>Competências solicitadas, materiais utilizados e como montar o projeto</label>
        <textarea
          style={textareaStyle("180px")}
          value={activityManual}
          onChange={(e) => setActivityManual(e.target.value)}
          placeholder="Resumo das competências: ...&#10;&#10;Materiais utilizados: ...&#10;&#10;Como montar e conduzir: ..."
        />
      </div>

      {/* Acessibilidade */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Acessibilidade e Inclusão</div>
        <label style={labelStyle}>Adaptações, padrões visuais/táteis e alternativas ao uso exclusivo de cores</label>
        <textarea
          style={textareaStyle("110px")}
          value={accessibilityText}
          onChange={(e) => setAccessibilityText(e.target.value)}
        />
      </div>

      {/* Antes da Aula */}
      {(beforeClass || activityData.beforeClass) && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Preparação — Antes da Aula</div>
          <label style={labelStyle}>O que preparar antes da aula</label>
          <textarea style={textareaStyle("120px")} value={beforeClass} onChange={(e) => setBeforeClass(e.target.value)} />
        </div>
      )}

      {/* Roteiro Pedagógico — Etapas */}
      {stages.length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Roteiro Pedagógico — {stages.length} Etapas</div>
          {stages.map((stage, i) => (
            <div key={i} style={{ ...matrixCardStyle("#4F46E5"), marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#4F46E5" }}>
                  Etapa {stage.number || i + 1} — {stage.title || ""}
                </div>
                {stage.duration && (
                  <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", fontStyle: "italic" }}>{stage.duration}</div>
                )}
              </div>
              {stage.description && (
                <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.55, marginBottom: "0.5rem" }}>{stage.description}</p>
              )}
              {stage.teacherScript && (
                <div style={{ background: "rgba(79,70,229,0.08)", border: "1px solid rgba(79,70,229,0.2)", borderRadius: "6px", padding: "0.5rem 0.75rem", marginBottom: "0.4rem" }}>
                  <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#4F46E5", fontWeight: 600, marginBottom: "0.25rem" }}>Roteiro do professor</div>
                  <p style={{ fontSize: "0.84rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>{stage.teacherScript}</p>
                </div>
              )}
              {stage.questions?.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(255,255,255,0.4)", fontWeight: 600, marginBottom: "0.25rem" }}>Perguntas norteadoras</div>
                  <ul style={{ paddingLeft: "1.2rem", margin: 0 }}>
                    {stage.questions.map((q, qi) => (
                      <li key={qi} style={{ fontSize: "0.84rem", color: "rgba(255,255,255,0.7)", marginBottom: "0.2rem" }}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Após a Aula */}
      {(afterClass || activityData.afterClass) && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Encerramento — Após a Aula</div>
          <label style={labelStyle}>Reflexão, avaliação formativa e próximos passos</label>
          <textarea style={textareaStyle("120px")} value={afterClass} onChange={(e) => setAfterClass(e.target.value)} />
        </div>
      )}

      {/* Dicas para o Professor */}
      {(teacherTips || activityData.teacherTips) && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Dicas para o Professor</div>
          <label style={labelStyle}>Orientações práticas e sugestões pedagógicas</label>
          <textarea style={textareaStyle("140px")} value={teacherTips} onChange={(e) => setTeacherTips(e.target.value)} />
        </div>
      )}

      {/* Referências */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Referências Bibliográficas</div>
        <label style={labelStyle}>Referências ABNT (uma por linha)</label>
        <textarea style={textareaStyle("120px")} value={bibliographyText} onChange={(e) => setBibliographyText(e.target.value)} />
        <BibliographyVerifier
          references={bibliographyText.split('\n').map((s) => s.trim()).filter(Boolean)}
        />
      </div>

      {/* Continuidade Pedagógica */}
      <div style={{ ...sectionStyle, marginTop: "2.5rem" }}>
        <div style={sectionTitleStyle}>Próximos Passos Pedagógicos</div>
        <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", margin: "0.4rem 0 1rem", lineHeight: 1.5 }}>
          Sugestões de continuidade geradas com base nesta atividade.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
          {continuitySuggestions.map((item, i) => {
            const colors = ["#4F46E5", "#10B981", "#8B5CF6", "#F59E0B"];
            const color = colors[i % colors.length];
            return (
              <div key={i} style={{ padding: "1rem", background: "rgba(255,255,255,0.04)", border: `1px solid rgba(255,255,255,0.08)`, borderLeft: `3px solid ${color}`, borderRadius: "8px" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color, marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.title}</div>
                <div style={{ fontSize: "0.81rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.55 }}>{item.description}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={footerStyle}>
        <button style={backButtonStyle} onClick={onBack}>← Voltar</button>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {projectId && (
            <Button variant="secondary" onClick={handleSave}>Salvar alterações</Button>
          )}
          <Button variant="primary" onClick={handlePrint}>Gerar PDF</Button>
        </div>
      </div>
    </div>
  );
}
