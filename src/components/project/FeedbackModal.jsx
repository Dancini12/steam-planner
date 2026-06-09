import { useState } from "react";
import { supabase } from "../../lib/supabaseClient.js";

const CATEGORIES = [
  "Sugestão de melhoria",
  "Problema técnico",
  "Elogio",
  "Outro",
];

export default function FeedbackModal({ isOpen, onClose, currentUser, onSubmitted }) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 10) {
      setErrorMsg("Por favor, escreva uma mensagem com pelo menos 10 caracteres.");
      return;
    }
    setStatus("sending");
    setErrorMsg("");

    try {
      const { error } = await supabase.functions.invoke("feedback", {
        body: {
          category,
          message: message.trim(),
          senderName:
            currentUser?.name ||
            currentUser?.email?.split("@")[0] ||
            "Usuário",
          senderEmail: currentUser?.email || "",
          userId: currentUser?.id || null,
        },
      });
      if (error) throw error;
      setStatus("success");
      onSubmitted?.();
    } catch {
      setStatus("error");
      setErrorMsg("Não foi possível enviar o feedback. Tente novamente.");
    }
  };

  const handleClose = () => {
    setCategory(CATEGORIES[0]);
    setMessage("");
    setStatus("idle");
    setErrorMsg("");
    onClose();
  };

  return (
    <div style={s.overlay} onClick={handleClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        {status === "success" ? (
          <div style={s.successBox}>
            <div style={s.successIcon}>✓</div>
            <h2 style={s.successTitle}>Feedback enviado com sucesso!</h2>
            <p style={s.successText}>
              Obrigado pela sua contribuição! Sua mensagem foi recebida e vai
              nos ajudar a tornar o STEAM+ Cultura Maker ainda melhor.
            </p>
            <button style={s.closeBtn} onClick={handleClose}>
              FECHAR
            </button>
          </div>
        ) : (
          <>
            <div style={s.header}>
              <h2 style={s.title}>ENVIAR FEEDBACK</h2>
              <button
                style={s.closeX}
                onClick={handleClose}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} style={s.form}>
              <label style={s.label}>
                Categoria
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={s.select}
                  disabled={status === "sending"}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label style={s.label}>
                Mensagem
                <textarea
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
                  placeholder="Descreva sua sugestão, problema encontrado ou elogio..."
                  style={s.textarea}
                  rows={5}
                  disabled={status === "sending"}
                />
              </label>
              {errorMsg && <p style={s.errorMsg}>{errorMsg}</p>}
              <button
                type="submit"
                style={{
                  ...s.submitBtn,
                  opacity: status === "sending" ? 0.6 : 1,
                  cursor: status === "sending" ? "not-allowed" : "pointer",
                }}
                disabled={status === "sending"}
              >
                {status === "sending" ? "ENVIANDO..." : "ENVIAR FEEDBACK"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    background: "rgba(2, 6, 23, 0.88)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
  },
  modal: {
    width: "min(520px, 100%)",
    border: "3px solid #A78BFA",
    borderRadius: "16px",
    background: "linear-gradient(180deg, #0F172A 0%, #020617 100%)",
    boxShadow:
      "0 0 0 3px rgba(2, 6, 23, 0.9), 0 0 32px rgba(167, 139, 250, 0.18)",
    padding: "28px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  title: {
    margin: 0,
    color: "#A78BFA",
    fontSize: "1rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
  },
  closeX: {
    background: "transparent",
    border: "none",
    color: "#64748B",
    fontSize: "1.7rem",
    lineHeight: 1,
    cursor: "pointer",
    padding: "0 4px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    color: "#CBD5E1",
    fontSize: "0.8rem",
    fontWeight: 600,
    letterSpacing: "0.04em",
  },
  select: {
    background: "rgba(15, 23, 42, 0.95)",
    border: "2px solid #334155",
    borderRadius: "8px",
    color: "#F8FAFC",
    padding: "10px 12px",
    fontSize: "0.9rem",
    fontFamily: "inherit",
    cursor: "pointer",
    outline: "none",
  },
  textarea: {
    background: "rgba(15, 23, 42, 0.95)",
    border: "2px solid #334155",
    borderRadius: "8px",
    color: "#F8FAFC",
    padding: "12px",
    fontSize: "0.9rem",
    fontFamily: "inherit",
    resize: "vertical",
    outline: "none",
    lineHeight: 1.6,
  },
  errorMsg: {
    margin: 0,
    color: "#FB7185",
    fontSize: "0.8rem",
  },
  submitBtn: {
    width: "100%",
    minHeight: "46px",
    border: "2px solid #A78BFA",
    borderRadius: "10px",
    background: "rgba(2, 6, 23, 0.86)",
    color: "#A78BFA",
    fontFamily: "inherit",
    fontSize: "0.63rem",
    fontWeight: 700,
    letterSpacing: "0.06em",
    transition: "background 0.16s ease, color 0.16s ease",
  },
  successBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "16px",
    padding: "12px 0",
  },
  successIcon: {
    width: "60px",
    height: "60px",
    border: "3px solid #39FF88",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#39FF88",
    fontSize: "1.9rem",
    fontWeight: 700,
  },
  successTitle: {
    margin: 0,
    color: "#39FF88",
    fontSize: "1.05rem",
    fontWeight: 700,
  },
  successText: {
    margin: 0,
    color: "#CBD5E1",
    fontSize: "0.95rem",
    lineHeight: 1.65,
    maxWidth: "380px",
  },
  closeBtn: {
    marginTop: "8px",
    padding: "10px 36px",
    border: "2px solid #39FF88",
    borderRadius: "10px",
    background: "transparent",
    color: "#39FF88",
    fontFamily: "inherit",
    fontSize: "0.63rem",
    fontWeight: 700,
    letterSpacing: "0.06em",
    cursor: "pointer",
  },
};
