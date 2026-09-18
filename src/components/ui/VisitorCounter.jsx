import { useEffect, useState } from "react";

const GOAL = 1000;

// ============================================================
// VisitorCounter
// Selo fixo no canto inferior direito com "Você é nosso
// visitante número X". Cada IP é contado uma única vez pelo
// backend (api/visitor-count.js); aqui só exibimos o total.
// ============================================================
export default function VisitorCounter() {
  const [count, setCount] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/visitor-count", { method: "POST" })
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.ok && typeof data.count === "number") {
          setCount(data.count);
        } else {
          setFailed(true);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (failed || count === null) return null;

  const progress = Math.min(100, Math.round((count / GOAL) * 100));

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1rem",
        right: "1rem",
        zIndex: 9998,
        background: "linear-gradient(135deg, rgba(15,15,45,0.95), rgba(10,10,31,0.95))",
        border: "1px solid rgba(110,231,183,0.25)",
        borderRadius: "12px",
        padding: "0.65rem 0.9rem",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        backdropFilter: "blur(10px)",
        fontFamily: "inherit",
        maxWidth: "220px"
      }}
    >
      <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>
        Você é o(a) visitante número{" "}
        <strong style={{ color: "#6EE7B7" }}>{count.toLocaleString("pt-BR")}</strong>
      </p>
      <p style={{ margin: "0.25rem 0 0.35rem", fontSize: "0.7rem", color: "rgba(255,255,255,0.5)" }}>
        Nossa meta: {GOAL.toLocaleString("pt-BR")} acessos 🎯
      </p>
      <div
        style={{
          height: "5px",
          borderRadius: "3px",
          background: "rgba(255,255,255,0.1)",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "linear-gradient(90deg, #4F46E5, #10B981)",
            transition: "width 0.4s ease"
          }}
        />
      </div>
    </div>
  );
}
