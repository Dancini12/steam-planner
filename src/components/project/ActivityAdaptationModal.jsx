import { useState, useRef } from "react";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import { ACCESSIBILITY_ADAPTATIONS } from "../../data/accessibilityAdaptations.js";
import { PedagogicalPlannerService } from "../../lib/ai/pedagogicalPlannerService.js";

const PATTERN_EXAMPLES = [
  { label: "Listras", color: "#E8358A" },
  { label: "Bolinhas", color: "#3B82F6" },
  { label: "Zigue-zague", color: "#10B981" },
  { label: "Furos", color: "#F59E0B" },
  { label: "Relevo", color: "#8B5CF6" }
];

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ActivityAdaptationModal({ isOpen, onClose }) {
  const [file, setFile] = useState(null);
  const [selectedAdaptations, setSelectedAdaptations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (selected) => {
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
      setError("");
      setResult(null);
    } else {
      setError("Selecione um arquivo PDF válido.");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const toggleAdaptation = (id) => {
    setSelectedAdaptations((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleAdapt = async () => {
    if (!file) { setError("Envie um PDF antes de continuar."); return; }
    if (selectedAdaptations.length === 0) { setError("Selecione ao menos uma adaptação."); return; }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const base64 = await fileToBase64(file);
      const content = await PedagogicalPlannerService.adaptActivityFromPDF(
        base64,
        selectedAdaptations
      );
      setResult(content);
    } catch (err) {
      setError(`Erro ao processar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setSelectedAdaptations([]);
    setResult(null);
    setError("");
    onClose();
  };

  const hasColorblind = selectedAdaptations.includes("daltonismo");

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Adaptação de Atividade" maxWidth="660px">
      <div style={styles.container}>

        {/* UPLOAD */}
        <section>
          <div style={styles.sectionLabel}>Atividade em PDF</div>
          <div
            style={{ ...styles.dropzone, ...(isDragging ? styles.dropzoneActive : {}), ...(file ? styles.dropzoneFilled : {}) }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              style={{ display: "none" }}
              onChange={(e) => handleFileSelect(e.target.files[0])}
            />
            {file ? (
              <div style={styles.fileInfo}>
                <span style={styles.fileIcon}>📄</span>
                <div>
                  <div style={styles.fileName}>{file.name}</div>
                  <div style={styles.fileMeta}>{(file.size / 1024).toFixed(0)} KB</div>
                </div>
                <button
                  style={styles.removeFile}
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  aria-label="Remover arquivo"
                >×</button>
              </div>
            ) : (
              <div style={styles.dropzonePlaceholder}>
                <span style={styles.uploadIcon}>⬆</span>
                <span>Clique ou arraste o PDF aqui</span>
              </div>
            )}
          </div>
        </section>

        {/* ADAPTAÇÕES */}
        <section style={{ marginTop: "1.5rem" }}>
          <div style={styles.sectionLabel}>Perfis de acessibilidade</div>
          <div style={styles.adaptationList}>
            {ACCESSIBILITY_ADAPTATIONS.map((adaptation) => {
              const selected = selectedAdaptations.includes(adaptation.id);
              return (
                <button
                  key={adaptation.id}
                  type="button"
                  style={{ ...styles.adaptationToggle, ...(selected ? styles.adaptationToggleActive : {}) }}
                  onClick={() => toggleAdaptation(adaptation.id)}
                  aria-pressed={selected}
                >
                  <span style={styles.adaptationCheck}>{selected ? "✓" : ""}</span>
                  {adaptation.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* DICA DALTONISMO */}
        {hasColorblind && (
          <div style={styles.colorblindTip}>
            <div style={styles.colorblindTipTitle}>Alternativa para daltonismo</div>
            <p style={styles.colorblindTipText}>
              Quando a atividade usar cores para classificar, filtrar ou identificar elementos, utilize também padrões visuais e/ou táteis para que a diferenciação funcione para todos os alunos.
            </p>
            <div style={styles.patternRow}>
              {PATTERN_EXAMPLES.map((p) => (
                <div key={p.label} style={{ ...styles.patternBadge, borderColor: p.color, color: p.color }}>
                  {p.label}
                </div>
              ))}
            </div>
            <p style={styles.colorblindTipSubtext}>
              Exemplos: vermelho + listras · azul + bolinhas · verde + zigue-zague · amarelo + furos
            </p>
          </div>
        )}

        {/* ERRO */}
        {error && <div style={styles.errorBox}>{error}</div>}

        {/* BOTÃO */}
        {!result && (
          <div style={{ marginTop: "1.5rem" }}>
            <Button
              variant="primary"
              onClick={handleAdapt}
              disabled={loading || !file || selectedAdaptations.length === 0}
            >
              {loading ? "Analisando atividade..." : "Gerar adaptações"}
            </Button>
          </div>
        )}

        {/* RESULTADO */}
        {result && (
          <div style={styles.resultBox}>
            <div style={styles.resultHeader}>
              <span style={styles.resultTitle}>Sugestões de adaptação</span>
              <button style={styles.newAdaptBtn} onClick={() => setResult(null)}>
                Nova análise
              </button>
            </div>
            <div style={styles.resultContent}>
              {result.split("\n").map((line, i) => (
                line.trim() ? (
                  <p key={i} style={line.startsWith("#") || /^[A-Z]/.test(line) && line.length < 80 ? styles.resultHeading : styles.resultPara}>
                    {line.replace(/^#+\s*/, "")}
                  </p>
                ) : <br key={i} />
              ))}
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column"
  },
  sectionLabel: {
    fontSize: "0.72rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "rgba(255, 255, 255, 0.45)",
    fontWeight: 600,
    marginBottom: "0.75rem"
  },
  dropzone: {
    border: "2px dashed rgba(255,255,255,0.15)",
    borderRadius: "10px",
    padding: "1.5rem",
    cursor: "pointer",
    transition: "border-color 0.15s ease, background 0.15s ease",
    background: "rgba(255,255,255,0.02)",
    textAlign: "center",
    color: "rgba(255,255,255,0.45)",
    fontSize: "0.9rem"
  },
  dropzoneActive: {
    borderColor: "rgba(167, 139, 250, 0.7)",
    background: "rgba(167, 139, 250, 0.06)"
  },
  dropzoneFilled: {
    borderColor: "rgba(57, 255, 136, 0.5)",
    background: "rgba(57, 255, 136, 0.04)",
    textAlign: "left"
  },
  dropzonePlaceholder: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5rem"
  },
  uploadIcon: {
    fontSize: "1.8rem",
    opacity: 0.5
  },
  fileInfo: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem"
  },
  fileIcon: {
    fontSize: "1.5rem",
    flexShrink: 0
  },
  fileName: {
    color: "#FFFFFF",
    fontWeight: 600,
    fontSize: "0.92rem"
  },
  fileMeta: {
    color: "rgba(255,255,255,0.4)",
    fontSize: "0.78rem",
    marginTop: "2px"
  },
  removeFile: {
    marginLeft: "auto",
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,0.4)",
    cursor: "pointer",
    fontSize: "1.25rem",
    lineHeight: 1,
    fontFamily: "inherit"
  },
  adaptationList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem"
  },
  adaptationToggle: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.85rem 1rem",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px",
    background: "rgba(255,255,255,0.02)",
    color: "rgba(255,255,255,0.55)",
    fontSize: "0.9rem",
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
    transition: "all 0.15s ease"
  },
  adaptationToggleActive: {
    border: "1px solid rgba(167, 139, 250, 0.5)",
    background: "rgba(167, 139, 250, 0.08)",
    color: "#FFFFFF"
  },
  adaptationCheck: {
    width: "18px",
    height: "18px",
    borderRadius: "4px",
    background: "rgba(167, 139, 250, 0.2)",
    border: "1px solid rgba(167, 139, 250, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.7rem",
    color: "#A78BFA",
    flexShrink: 0,
    fontWeight: 700
  },
  colorblindTip: {
    marginTop: "1.25rem",
    padding: "1rem 1.125rem",
    border: "1px solid rgba(167, 139, 250, 0.3)",
    borderRadius: "10px",
    background: "rgba(167, 139, 250, 0.06)"
  },
  colorblindTipTitle: {
    color: "#A78BFA",
    fontWeight: 700,
    fontSize: "0.85rem",
    marginBottom: "0.5rem"
  },
  colorblindTipText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: "0.88rem",
    lineHeight: 1.6,
    margin: "0 0 0.75rem"
  },
  patternRow: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
    marginBottom: "0.75rem"
  },
  patternBadge: {
    padding: "0.3rem 0.75rem",
    borderRadius: "20px",
    border: "1px solid",
    fontSize: "0.78rem",
    fontWeight: 600,
    background: "rgba(0,0,0,0.2)"
  },
  colorblindTipSubtext: {
    color: "rgba(255,255,255,0.45)",
    fontSize: "0.78rem",
    margin: 0,
    fontStyle: "italic"
  },
  errorBox: {
    marginTop: "1rem",
    padding: "0.85rem 1rem",
    borderRadius: "8px",
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.25)",
    color: "#FCA5A5",
    fontSize: "0.88rem"
  },
  resultBox: {
    marginTop: "1.5rem",
    border: "1px solid rgba(57, 255, 136, 0.25)",
    borderRadius: "10px",
    overflow: "hidden"
  },
  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem 1rem",
    borderBottom: "1px solid rgba(57, 255, 136, 0.15)",
    background: "rgba(57, 255, 136, 0.05)"
  },
  resultTitle: {
    color: "#39FF88",
    fontWeight: 700,
    fontSize: "0.85rem"
  },
  newAdaptBtn: {
    background: "transparent",
    border: "1px solid rgba(57, 255, 136, 0.3)",
    borderRadius: "6px",
    color: "#39FF88",
    fontSize: "0.75rem",
    padding: "0.3rem 0.75rem",
    cursor: "pointer",
    fontFamily: "inherit"
  },
  resultContent: {
    padding: "1rem 1.125rem",
    maxHeight: "340px",
    overflowY: "auto"
  },
  resultHeading: {
    color: "#FFFFFF",
    fontWeight: 700,
    fontSize: "0.9rem",
    margin: "0.75rem 0 0.35rem"
  },
  resultPara: {
    color: "rgba(255,255,255,0.8)",
    fontSize: "0.875rem",
    lineHeight: 1.65,
    margin: "0.2rem 0"
  }
};
