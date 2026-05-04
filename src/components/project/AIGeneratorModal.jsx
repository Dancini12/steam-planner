// ============================================================
// AIGeneratorModal.jsx
// Modal para geração de projetos via IA (Gemini)
// ============================================================
//
// Apresenta ao professor um formulário com 3 campos:
// - Tema livre do projeto desejado
// - Ano escolar (lista)
// - Áreas STEAM contempladas (botões selecionáveis)
//
// Ao submeter, mostra indicador de carregamento enquanto
// a IA gera o projeto. Em caso de sucesso, retorna o
// projeto gerado para o componente pai (Dashboard) que
// faz a criação efetiva e a navegação para edição.
//
// Posicionamento pedagógico: a IA é ASSISTENTE, não autora.
// O professor edita livremente o resultado depois.
// ============================================================

import { useState } from "react";
import { STEAM_AREAS, STEAM_KEYS } from "../../data/steamAreas.js";
import { generateProjectWithAI } from "../../lib/aiGenerator.js";

import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import TextField from "../ui/TextField.jsx";

export default function AIGeneratorModal({
  isOpen,
  onClose,
  onProjectGenerated
}) {
  // Estados dos campos do formulário
  const [theme, setTheme] = useState("");
  const [grade, setGrade] = useState("8º ano");
  const [selectedAreas, setSelectedAreas] = useState(["S", "T", "M"]);

  // Estados de controle do fluxo
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Alterna seleção de área STEAM
  const toggleArea = (letter) => {
    if (selectedAreas.includes(letter)) {
      setSelectedAreas(selectedAreas.filter((l) => l !== letter));
    } else {
      setSelectedAreas([...selectedAreas, letter]);
    }
  };

  // Submete a geração
  const handleGenerate = async () => {
    setErrorMessage("");

    if (theme.trim().length < 5) {
      setErrorMessage("Descreva melhor o tema do projeto (mínimo 5 caracteres).");
      return;
    }

    if (selectedAreas.length === 0) {
      setErrorMessage("Selecione ao menos uma área STEAM.");
      return;
    }

    setIsGenerating(true);

    try {
      const generatedProject = await generateProjectWithAI({
        theme: theme.trim(),
        grade,
        steamAreas: selectedAreas
      });

      // Sucesso: limpa o formulário e devolve ao Dashboard
      setTheme("");
      setSelectedAreas(["S", "T", "M"]);
      onProjectGenerated(generatedProject);
    } catch (error) {
      setErrorMessage(error.message || "Erro inesperado. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Fecha o modal e limpa estados
  const handleClose = () => {
    if (isGenerating) return; // não permite fechar enquanto gera
    setTheme("");
    setErrorMessage("");
    onClose();
  };

  // ----------------------------------------------------------
  // ESTILOS
  // ----------------------------------------------------------

  const introStyle = {
    fontSize: "0.9rem",
    color: "rgba(255, 255, 255, 0.6)",
    lineHeight: 1.6,
    marginBottom: "1.5rem",
    padding: "0.85rem 1rem",
    background: "rgba(107, 47, 224, 0.08)",
    borderLeft: "2px solid #6B2FE0",
    borderRadius: "4px"
  };

  const fieldGroupStyle = {
    marginBottom: "1.25rem"
  };

  const labelStyle = {
    fontSize: "0.85rem",
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: 500,
    marginBottom: "0.5rem",
    display: "block"
  };

  const gradeSelectStyle = {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    color: "#FFFFFF",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    cursor: "pointer"
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
      minWidth: "90px",
      padding: "0.75rem 0.5rem",
      borderRadius: "8px",
      cursor: isGenerating ? "not-allowed" : "pointer",
      background: isSelected ? area.color : "rgba(255, 255, 255, 0.04)",
      color: isSelected ? "#0F0F2D" : "rgba(255, 255, 255, 0.4)",
      border: isSelected
        ? `2px solid ${area.color}`
        : "2px solid rgba(255, 255, 255, 0.06)",
      fontWeight: 600,
      fontSize: "0.85rem",
      transition: "all 0.15s ease",
      textAlign: "center",
      fontFamily: "inherit",
      opacity: isGenerating ? 0.5 : 1
    };
  };

  const errorStyle = {
    fontSize: "0.85rem",
    color: "#E8358A",
    background: "rgba(232, 53, 138, 0.08)",
    padding: "0.75rem 1rem",
    borderRadius: "6px",
    marginTop: "0.75rem",
    border: "1px solid rgba(232, 53, 138, 0.2)"
  };

  const loadingBoxStyle = {
    textAlign: "center",
    padding: "2.5rem 1rem",
    color: "rgba(255, 255, 255, 0.7)"
  };

  const loadingTitleStyle = {
    fontSize: "1.05rem",
    fontWeight: 600,
    color: "#FFFFFF",
    marginBottom: "0.75rem"
  };

  const loadingSubtitleStyle = {
    fontSize: "0.9rem",
    color: "rgba(255, 255, 255, 0.5)",
    lineHeight: 1.5
  };

  const spinnerStyle = {
    width: "48px",
    height: "48px",
    margin: "0 auto 1.5rem",
    border: "3px solid rgba(107, 47, 224, 0.2)",
    borderTopColor: "#6B2FE0",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  };

  const actionsStyle = {
    display: "flex",
    gap: "0.75rem",
    justifyContent: "flex-end",
    marginTop: "1.5rem",
    paddingTop: "1rem",
    borderTop: "1px solid rgba(255, 255, 255, 0.06)"
  };

  // ----------------------------------------------------------
  // RENDERIZAÇÃO
  // ----------------------------------------------------------

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Gerar projeto com IA"
      maxWidth="600px"
    >
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {isGenerating ? (
        <div style={loadingBoxStyle}>
          <div style={spinnerStyle} />
          <div style={loadingTitleStyle}>Gerando seu projeto...</div>
          <div style={loadingSubtitleStyle}>
            A IA está pensando em uma estrutura pedagógica
            <br />
            para o tema escolhido. Pode levar até 30 segundos.
          </div>
        </div>
      ) : (
        <div>
          <p style={introStyle}>
            A IA vai gerar uma <strong>sugestão inicial</strong> de projeto
            STEAM com fases, BNCC e materiais. Você poderá editar tudo
            livremente depois — a IA é assistente, não autora final.
          </p>

          <div style={fieldGroupStyle}>
            <TextField
              label="Tema do projeto"
              value={theme}
              onChange={setTheme}
              multiline
              rows={3}
              placeholder="Ex.: Como funciona a fotossíntese e como podemos demonstrar isso em sala?"
              hint="Descreva o tema, problema ou pergunta que será o ponto de partida."
              required
            />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Ano escolar</label>
            <select
              style={gradeSelectStyle}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            >
              <option value="6º ano">6º ano</option>
              <option value="7º ano">7º ano</option>
              <option value="8º ano">8º ano</option>
              <option value="9º ano">9º ano</option>
              <option value="6º e 7º ano">6º e 7º ano</option>
              <option value="7º e 8º ano">7º e 8º ano</option>
              <option value="8º e 9º ano">8º e 9º ano</option>
              <option value="Fundamental II (todos)">Fundamental II (todos)</option>
            </select>
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Áreas STEAM contempladas</label>
            <div style={steamSelectorStyle}>
              {STEAM_KEYS.map((letter) => {
                const area = STEAM_AREAS[letter];
                const isSelected = selectedAreas.includes(letter);
                return (
                  <button
                    key={letter}
                    style={steamButtonStyle(letter, isSelected)}
                    onClick={() => toggleArea(letter)}
                    disabled={isGenerating}
                  >
                    {letter} · {area.name}
                  </button>
                );
              })}
            </div>
          </div>

          {errorMessage && <div style={errorStyle}>{errorMessage}</div>}

          <div style={actionsStyle}>
            <Button variant="secondary" onClick={handleClose}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleGenerate}>
              Gerar projeto
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
