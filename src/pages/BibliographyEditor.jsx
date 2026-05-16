import { useState } from "react";
import { useProjects } from "../hooks/useProjects.js";
import { generateBibliographyWithAI } from "../lib/aiGenerator.js";
import Button from "../components/ui/Button.jsx";
import TextField from "../components/ui/TextField.jsx";
import BibliographyVerifier from "../components/project/BibliographyVerifier.jsx";

export default function BibliographyEditor({ projectId, currentUser, onBack }) {
  const { getProjectById, editBibliography, isLoaded } = useProjects(currentUser?.id);
  const project = getProjectById(projectId);

  const [newRef, setNewRef] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState("");

  const bibliography = project?.bibliography || [];

  const handleAdd = () => {
    const trimmed = newRef.trim();
    if (!trimmed) return;
    editBibliography(projectId, [...bibliography, trimmed]);
    setNewRef("");
  };

  const handleRemove = (index) => {
    editBibliography(projectId, bibliography.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  const handleStartEdit = (index) => {
    setEditingIndex(index);
    setEditingText(bibliography[index]);
  };

  const handleSaveEdit = () => {
    const trimmed = editingText.trim();
    if (!trimmed) return;
    const updated = bibliography.map((ref, i) => (i === editingIndex ? trimmed : ref));
    editBibliography(projectId, updated);
    setEditingIndex(null);
    setEditingText("");
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleGenerateWithAI = async () => {
    setAiError("");
    setIsGenerating(true);
    try {
      const refs = await generateBibliographyWithAI({
        title: project.title,
        theme: project.theme,
        grade: project.grade,
        steamAreas: project.steam
      });
      // Adiciona às existentes sem duplicar
      const existing = new Set(bibliography);
      const newRefs = refs.filter((r) => !existing.has(r));
      editBibliography(projectId, [...bibliography, ...newRefs]);
    } catch (err) {
      setAiError(err.message || "Erro ao gerar referências. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Estilos ────────────────────────────────────────────────

  const containerStyle = {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "2rem 1.5rem"
  };

  const topBarStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
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

  const titleStyle = {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#FFFFFF",
    margin: "0 0 0.35rem"
  };

  const subtitleStyle = {
    fontSize: "0.85rem",
    color: "rgba(255, 255, 255, 0.45)",
    margin: 0
  };

  const sectionLabelStyle = {
    fontSize: "0.7rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "rgba(255, 255, 255, 0.4)",
    fontWeight: 600,
    marginBottom: "0.75rem"
  };

  const sectionStyle = {
    marginBottom: "2.5rem"
  };

  const addRowStyle = {
    display: "flex",
    gap: "0.75rem",
    alignItems: "flex-start"
  };

  const listHeaderStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.75rem"
  };

  const listStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem"
  };

  const itemStyle = {
    display: "flex",
    gap: "0.75rem",
    alignItems: "flex-start",
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.07)",
    borderRadius: "7px",
    padding: "0.75rem 1rem"
  };

  const numberStyle = {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#7C4DFF",
    minWidth: "1.5rem",
    paddingTop: "0.2rem",
    flexShrink: 0
  };

  const refTextStyle = {
    flex: 1,
    fontSize: "0.9rem",
    color: "rgba(255, 255, 255, 0.82)",
    lineHeight: 1.6,
    margin: 0,
    wordBreak: "break-word"
  };

  const itemActionsStyle = {
    display: "flex",
    gap: "0.4rem",
    flexShrink: 0,
    marginTop: "0.1rem"
  };

  const iconButtonStyle = (color) => ({
    background: "transparent",
    border: "none",
    color,
    cursor: "pointer",
    fontSize: "0.75rem",
    padding: "0.2rem 0.4rem",
    fontFamily: "inherit",
    borderRadius: "4px",
    lineHeight: 1
  });

  const emptyStyle = {
    fontSize: "0.9rem",
    color: "rgba(255, 255, 255, 0.35)",
    textAlign: "center",
    padding: "2rem",
    border: "1px dashed rgba(255, 255, 255, 0.08)",
    borderRadius: "8px"
  };

  const aiBoxStyle = {
    background: "rgba(107, 47, 224, 0.08)",
    border: "1px solid rgba(107, 47, 224, 0.2)",
    borderRadius: "8px",
    padding: "1rem 1.25rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
    flexWrap: "wrap",
    marginBottom: "2.5rem"
  };

  const aiBoxTextStyle = {
    fontSize: "0.88rem",
    color: "rgba(255, 255, 255, 0.6)",
    lineHeight: 1.5,
    flex: 1
  };

  const errorStyle = {
    fontSize: "0.85rem",
    color: "#E8358A",
    background: "rgba(232, 53, 138, 0.08)",
    padding: "0.65rem 1rem",
    borderRadius: "6px",
    marginTop: "0.75rem",
    border: "1px solid rgba(232, 53, 138, 0.2)"
  };

  const infoStyle = {
    background: "rgba(255, 255, 255, 0.03)",
    borderLeft: "3px solid rgba(107, 47, 224, 0.4)",
    padding: "0.75rem 1rem",
    borderRadius: "4px",
    fontSize: "0.82rem",
    color: "rgba(255, 255, 255, 0.4)",
    lineHeight: 1.5
  };

  // ── Validações ─────────────────────────────────────────────

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
        <p style={{ color: "rgba(255, 255, 255, 0.7)" }}>Projeto não encontrado.</p>
        <Button variant="primary" onClick={onBack}>Voltar</Button>
      </div>
    );
  }

  // ── Renderização ───────────────────────────────────────────

  return (
    <div style={containerStyle}>
      {/* Topo */}
      <div style={topBarStyle}>
        <button style={backButtonStyle} onClick={onBack}>
          ← Voltar ao projeto
        </button>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h1 style={titleStyle}>📚 Referências Bibliográficas</h1>
        <p style={subtitleStyle}>{project.title}</p>
      </div>

      {/* Sugestão via IA */}
      <div style={aiBoxStyle}>
        <p style={aiBoxTextStyle}>
          {bibliography.length === 0
            ? "Nenhuma referência ainda. A IA pode sugerir referências em formato ABNT com base no tema e áreas STEAM do projeto."
            : "A IA pode sugerir referências adicionais em formato ABNT para complementar as existentes."}
        </p>
        <Button
          variant="secondary"
          onClick={handleGenerateWithAI}
          disabled={isGenerating}
        >
          {isGenerating ? "Gerando..." : "✨ Sugerir com IA"}
        </Button>
      </div>
      {aiError && <div style={{ ...errorStyle, marginTop: "-2rem", marginBottom: "2rem" }}>{aiError}</div>}

      {/* Adicionar manualmente */}
      <div style={sectionStyle}>
        <div style={sectionLabelStyle}>Adicionar referência manualmente</div>
        <div style={addRowStyle}>
          <div style={{ flex: 1 }}>
            <TextField
              value={newRef}
              onChange={setNewRef}
              multiline
              rows={2}
              placeholder="Ex.: BACICH, L.; HOLANDA, L. (org.). STEAM em sala de aula. Porto Alegre: Penso, 2020."
              hint="Formato ABNT recomendado. Pressione Enter para adicionar."
              onKeyDown={handleKeyDown}
            />
          </div>
          <div style={{ paddingTop: "0.1rem" }}>
            <Button variant="primary" onClick={handleAdd} disabled={!newRef.trim()}>
              Adicionar
            </Button>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div style={sectionStyle}>
        <div style={listHeaderStyle}>
          <div style={sectionLabelStyle}>
            Referências do projeto ({bibliography.length})
          </div>
        </div>

        {bibliography.length === 0 ? (
          <div style={emptyStyle}>
            Nenhuma referência cadastrada. Use o botão "Sugerir com IA" acima ou
            adicione manualmente.
          </div>
        ) : (
          <div style={listStyle}>
            {bibliography.map((ref, index) => (
              <div key={index} style={itemStyle}>
                <span style={numberStyle}>{index + 1}.</span>

                {editingIndex === index ? (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <TextField
                      value={editingText}
                      onChange={setEditingText}
                      multiline
                      rows={2}
                      autoFocus
                    />
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                      <Button variant="ghost" size="small" onClick={handleCancelEdit}>
                        Cancelar
                      </Button>
                      <Button variant="primary" size="small" onClick={handleSaveEdit}>
                        Salvar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p style={refTextStyle}>{ref}</p>
                    <div style={itemActionsStyle}>
                      <button
                        style={iconButtonStyle("rgba(255,255,255,0.4)")}
                        onClick={() => handleStartEdit(index)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        style={iconButtonStyle("rgba(239,68,68,0.7)")}
                        onClick={() => handleRemove(index)}
                        title="Remover"
                      >
                        ✕
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verificação de fontes */}
      {bibliography.length > 0 && (
        <BibliographyVerifier references={bibliography} />
      )}

      {/* Aviso */}
      <div style={{ ...infoStyle, marginTop: '1.5rem' }}>
        ℹ️ Verifique a disponibilidade das referências na sua biblioteca escolar ou em
        plataformas de pesquisa acadêmica antes de usá-las.
      </div>
    </div>
  );
}
