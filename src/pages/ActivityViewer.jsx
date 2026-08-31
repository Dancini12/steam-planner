import { useState } from "react";
import { openActivityPrintWindow } from "../lib/exportReport.js";
import { trackEvent } from "../lib/analytics.js";
import { useProjects } from "../hooks/useProjects.js";
import { normalizeBnccCodes } from "../lib/bnccSelector.js";
import { normalizeLearningExperience } from "../lib/learningExperience.js";
import Button from "../components/ui/Button.jsx";
import { trackActivityRating } from "../lib/machine-learning/behavior-tracking/behaviorTracker.js";
import BibliographyVerifier from "../components/project/BibliographyVerifier.jsx";

function splitLines(text) {
  return String(text || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function getSteamLetters(activity) {
  return Object.keys(activity.steamMatrix || {}).filter((key) =>
    ["S", "T", "E", "A", "M"].includes(key)
  );
}

export default function ActivityViewer({ activityData, formData, projectId, currentUser, onBack, onNewActivity, onLogout }) {
  const initialActivity = normalizeLearningExperience(activityData || {}, {
    theme: activityData?.theme || formData?.theme,
    grade: activityData?.grade || formData?.grade,
    discipline: activityData?.discipline || formData?.discipline
  });

  const { editProject } = useProjects(currentUser?.id);
  const [title, setTitle] = useState(initialActivity.title || "");
  const [duration, setDuration] = useState(initialActivity.duration || "");
  const [objective, setObjective] = useState(initialActivity.objective || "");
  const [problem, setProblem] = useState(initialActivity.problem || "");
  const [mission, setMission] = useState(initialActivity.mission || "");
  const [materialsText, setMaterialsText] = useState((initialActivity.materials || []).join("\n"));
  const [materialFunctionsText, setMaterialFunctionsText] = useState((initialActivity.materialFunctions || []).join("\n"));
  const [readyMaterialsText, setReadyMaterialsText] = useState((initialActivity.readyMaterials || []).join("\n"));
  const [stages, setStages] = useState(initialActivity.stages || []);
  const [makerChallenge, setMakerChallenge] = useState(initialActivity.makerChallenge || "");
  const [finalProduct, setFinalProduct] = useState(initialActivity.finalProduct || "");
  const [assessmentText, setAssessmentText] = useState((initialActivity.assessment || []).join("\n"));
  const [bibliographyText, setBibliographyText] = useState((initialActivity.bibliography || []).join("\n"));
  const [savedMsg, setSavedMsg] = useState("");
  const [feedbackGiven, setFeedbackGiven] = useState(null);
  const [improvementText, setImprovementText] = useState("");
  const [improvementSent, setImprovementSent] = useState(false);
  const [improvementSending, setImprovementSending] = useState(false);

  const steamLetters = getSteamLetters(initialActivity);

  const buildCurrentActivity = () => normalizeLearningExperience(
    {
      ...initialActivity,
      title,
      duration,
      objective,
      objectives: [objective],
      problem,
      mission,
      materials: splitLines(materialsText),
      materialFunctions: splitLines(materialFunctionsText),
      readyMaterials: splitLines(readyMaterialsText),
      stages,
      developmentStages: stages,
      developmentAssemblySteps: stages,
      assemblySteps: stages,
      makerChallenge,
      guidingQuestion: makerChallenge,
      finalProduct,
      assessment: splitLines(assessmentText),
      bibliography: splitLines(bibliographyText)
    },
    {
      theme: initialActivity.theme || formData?.theme,
      grade: initialActivity.grade || formData?.grade,
      discipline: initialActivity.discipline || formData?.discipline
    }
  );

  const handleStageChange = (index, value) => {
    setStages((prev) =>
      prev.map((stage, stageIndex) =>
        stageIndex === index ? { ...stage, description: value } : stage
      )
    );
  };

  const handleFeedback = (rating) => {
    setFeedbackGiven(rating);
    trackActivityRating(currentUser?.id, projectId, rating, {
      discipline: formData?.discipline || "",
      grade: formData?.grade || "",
      steam: steamLetters,
      theme: initialActivity.theme || "",
      materials: initialActivity.materials || [],
    }).catch(console.error);
  };

  const handleSave = () => {
    if (!projectId) return;
    const currentActivity = buildCurrentActivity();

    editProject(projectId, {
      ...currentActivity,
      bncc: normalizeBnccCodes(currentActivity.bncc || []),
      generatedAt: activityData.generatedAt || currentActivity.generatedAt || null
    });

    setSavedMsg("Alterações salvas.");
    setTimeout(() => setSavedMsg(""), 3000);
  };

  const handlePrint = () => {
    const currentActivity = buildCurrentActivity();

    trackEvent(currentUser?.id, "activity_printed", {
      projectId,
      title: currentActivity.title,
      theme: currentActivity.theme,
      grade: formData?.grade || "",
      discipline: formData?.discipline || "",
      steam: steamLetters,
      bncc: normalizeBnccCodes(currentActivity.bncc || [])
    }).catch(console.error);

    openActivityPrintWindow({
      ...currentActivity,
      generatedAt: activityData.generatedAt || null,
      grade: formData?.grade || initialActivity.grade || "",
      discipline: formData?.discipline || initialActivity.discipline || ""
    });
  };

  const handleSendImprovement = async () => {
    if (!improvementText.trim()) return;
    setImprovementSending(true);
    try {
      await fetch("https://formsubmit.co/ajax/marceldancini@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: "Sugestão de melhoria — STEAM Planner",
          _replyto: currentUser?.email || "anonimo",
          usuario: currentUser?.email || "anônimo",
          atividade: title,
          disciplina: formData?.discipline || "",
          serie: formData?.grade || "",
          sugestao: improvementText.trim(),
        }),
      });
    } catch { /* silencia — usuário não precisa saber */ }
    setImprovementSent(true);
    setImprovementSending(false);
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
  const sectionStyle = { marginBottom: "1.75rem" };
  const sectionTitleStyle = {
    fontSize: "0.7rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "rgba(255, 255, 255, 0.45)",
    fontWeight: 600,
    marginBottom: "0.85rem",
    paddingBottom: "0.45rem",
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
    lineHeight: 1.55
  });
  const twoColStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" };
  const cardStyle = {
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.07)",
    borderRadius: "8px",
    padding: "0.9rem",
    marginBottom: "0.75rem"
  };
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

      {Array.isArray(initialActivity?._warnings) && initialActivity._warnings.length > 0 && (
        <div
          style={{
            border: "1px solid rgba(251, 191, 36, 0.4)",
            background: "rgba(251, 191, 36, 0.08)",
            borderRadius: "10px",
            padding: "0.85rem 1rem",
            marginBottom: "1rem",
            fontSize: "0.88rem",
            color: "#FDE68A"
          }}
        >
          <strong>Revisar antes de aplicar:</strong>
          <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1.2rem" }}>
            {initialActivity._warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>1. Experiência de aprendizagem STEAM + Cultura Maker</div>
        <div style={twoColStyle}>
          <div>
            <label style={labelStyle}>Título</label>
            <input
              style={{ ...inputStyle, fontSize: "1.1rem", fontWeight: 600 }}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Duração</label>
            <input
              style={inputStyle}
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>2. Objetivo geral</div>
        <textarea
          style={textareaStyle("70px")}
          value={objective}
          onChange={(event) => setObjective(event.target.value)}
        />
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>3. Problema/desafio</div>
        <div style={twoColStyle}>
          <div>
            <label style={labelStyle}>Problema real</label>
            <textarea
              style={textareaStyle("110px")}
              value={problem}
              onChange={(event) => setProblem(event.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Missão</label>
            <textarea
              style={textareaStyle("110px")}
              value={mission}
              onChange={(event) => setMission(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>4. Materiais</div>
        <textarea
          style={textareaStyle("120px")}
          value={materialsText}
          onChange={(event) => setMaterialsText(event.target.value)}
        />
        <label style={{ ...labelStyle, marginTop: "0.75rem" }}>Função de cada material</label>
        <textarea
          style={textareaStyle("120px")}
          value={materialFunctionsText}
          onChange={(event) => setMaterialFunctionsText(event.target.value)}
        />
        <label style={{ ...labelStyle, marginTop: "0.75rem" }}>Materiais prontos para teste</label>
        <textarea
          style={textareaStyle("125px")}
          value={readyMaterialsText}
          onChange={(event) => setReadyMaterialsText(event.target.value)}
        />
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>5. Desenvolvimento e montagem da atividade</div>
        {stages.map((stage, index) => (
          <div key={stage.number || index} style={cardStyle}>
            <label style={{ ...labelStyle, color: "#6EE7B7" }}>{stage.title}</label>
            <textarea
              style={textareaStyle("92px")}
              value={stage.description || ""}
              onChange={(event) => handleStageChange(index, event.target.value)}
            />
          </div>
        ))}
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>6. Desafio Maker</div>
        <textarea
          style={textareaStyle("95px")}
          value={makerChallenge}
          onChange={(event) => setMakerChallenge(event.target.value)}
        />
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>7. Produto final</div>
        <textarea
          style={textareaStyle("85px")}
          value={finalProduct}
          onChange={(event) => setFinalProduct(event.target.value)}
        />
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>8. Avaliação</div>
        <textarea
          style={textareaStyle("120px")}
          value={assessmentText}
          onChange={(event) => setAssessmentText(event.target.value)}
        />
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>9. Referências</div>
        <textarea
          style={textareaStyle("115px")}
          value={bibliographyText}
          onChange={(event) => setBibliographyText(event.target.value)}
        />
        <BibliographyVerifier references={splitLines(bibliographyText)} />
      </div>

      <div style={{ marginBottom: "2rem", padding: "1.25rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px" }}>
        {feedbackGiven ? (
          <p style={{ margin: 0, fontSize: "0.88rem", color: "#6EE7B7", textAlign: "center" }}>
            {feedbackGiven === "positive"
              ? "Obrigado! O sistema vai aprender com esta avaliação para melhorar as próximas atividades."
              : "Recebido. Usaremos esse sinal para ajustar as próximas gerações."}
          </p>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "rgba(255,255,255,0.55)" }}>
              Esta atividade foi útil para a sua aula?
            </p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {[
                { value: "positive", label: "Sim, funcionou", icon: "👍" },
                { value: "negative", label: "Precisa melhorar", icon: "👎" },
              ].map(({ value, label, icon }) => (
                <button
                  key={value}
                  onClick={() => handleFeedback(value)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.45rem 1rem",
                    borderRadius: "8px",
                    cursor: "pointer",
                    background: "rgba(255,255,255,0.05)",
                    fontFamily: "inherit",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "0.85rem",
                    transition: "all 0.15s"
                  }}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Seção de sugestão de melhoria */}
      <div style={{ marginBottom: "1.5rem", padding: "1.25rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px" }}>
        {improvementSent ? (
          <p style={{ margin: 0, fontSize: "0.88rem", color: "#6EE7B7", textAlign: "center" }}>
            Obrigado pela sua sugestão! Ela nos ajuda a melhorar o sistema.
          </p>
        ) : (
          <>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>
              Tem alguma sugestão de melhoria para esta atividade ou para o sistema?
            </p>
            <textarea
              style={{ ...textareaStyle("80px"), marginBottom: "0.75rem" }}
              placeholder="Descreva sua sugestão…"
              value={improvementText}
              onChange={(e) => setImprovementText(e.target.value)}
            />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="secondary"
                onClick={handleSendImprovement}
                disabled={improvementSending || !improvementText.trim()}
              >
                {improvementSending ? "Enviando…" : "Enviar sugestão"}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Rodapé de navegação */}
      <div style={{ ...footerStyle, flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            style={{ ...backButtonStyle, border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", padding: "0.5rem 1rem" }}
            onClick={onBack}
          >
            Tela inicial
          </button>
          {onNewActivity && (
            <button
              style={{ ...backButtonStyle, border: "1px solid rgba(57,255,136,0.3)", borderRadius: "8px", padding: "0.5rem 1rem", color: "#6EE7B7" }}
              onClick={onNewActivity}
            >
              Gerar nova atividade
            </button>
          )}
          {onLogout && (
            <button
              style={{ ...backButtonStyle, border: "1px solid rgba(255,79,216,0.3)", borderRadius: "8px", padding: "0.5rem 1rem", color: "#F9A8D4" }}
              onClick={onLogout}
            >
              Sair
            </button>
          )}
        </div>
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
