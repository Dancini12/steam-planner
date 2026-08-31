// ============================================================
// MlModelPanel.jsx
// Painel de treino e métricas do recomendador de ML
// ============================================================
//
// Usado no modal do Dashboard e no console administrativo.
// Recebe o estado já carregado (status/training/error) e o
// callback de treino — não faz fetch por conta própria.
// ============================================================

function MetricRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "0.4rem 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        fontSize: "0.9rem"
      }}
    >
      <span style={{ color: "#94a3b8" }}>{label}</span>
      <strong style={{ color: "#f8fafc" }}>{value}</strong>
    </div>
  );
}

export default function MlModelPanel({ status, training, error, onTrain }) {
  const evaluation = status?.evaluation?.metrics || null;
  const test = evaluation?.test || null;
  const pct = (v) => (typeof v === "number" ? `${(v * 100).toFixed(1)}%` : "—");

  return (
    <div>
      <p style={{ color: "#cbd5e1", lineHeight: 1.6, marginTop: 0 }}>
        Treina, com os dados de uso de todos os professores, um TF-IDF ajustado ao
        corpus e uma <strong>regressão logística</strong> (gradiente descendente,
        do zero) que aprende o peso de cada sinal da recomendação. O treino separa
        80% para ajuste e 20% para avaliação.
      </p>

      <button
        type="button"
        className="feedback-refresh"
        onClick={onTrain}
        disabled={training}
        style={{ marginBottom: "1rem" }}
      >
        {training ? "Treinando..." : "Treinar agora"}
      </button>

      {error && <div className="retro-error" style={{ margin: "0 0 1rem" }}>{error}</div>}

      {!status && <p style={{ color: "#94a3b8" }}>Carregando estado do modelo...</p>}

      {status && !status.hasModel && !training && (
        <p style={{ color: "#94a3b8" }}>
          Nenhum modelo ativo ainda. Clique em “Treinar agora”. Se houver poucos
          dados de uso, o treino informa que ainda não é possível.
        </p>
      )}

      {status?.hasModel && (
        <div>
          <MetricRow
            label="Treinado em"
            value={
              status.logreg?.trainedAt
                ? new Date(status.logreg.trainedAt).toLocaleString("pt-BR")
                : "—"
            }
          />
          <MetricRow label="Amostras (pares professor × projeto)" value={status.logreg?.nSamples ?? "—"} />
          <MetricRow label="Vocabulário TF-IDF" value={status.tfidf?.vocabSize ?? "—"} />
          {evaluation && (
            <>
              <MetricRow label="Professores no treino" value={evaluation.nTeachers ?? "—"} />
              <MetricRow label="Épocas de gradiente" value={evaluation.epochs ?? "—"} />
              <MetricRow
                label="Perda (início → fim)"
                value={
                  evaluation.lossCurve?.length
                    ? `${evaluation.lossCurve[0].toFixed(3)} → ${evaluation.lossCurve.at(-1).toFixed(3)}`
                    : "—"
                }
              />
            </>
          )}
          {test && (
            <>
              <MetricRow label="Acurácia (teste)" value={pct(test.accuracy)} />
              <MetricRow label="Precisão / Recall (teste)" value={`${pct(test.precision)} / ${pct(test.recall)}`} />
              <MetricRow label="F1 (teste)" value={pct(test.f1)} />
              <MetricRow label="ROC-AUC (teste)" value={test.rocAuc ?? "—"} />
              <MetricRow label="Log loss (teste)" value={test.logLoss ?? "—"} />
              <MetricRow label="precision@5 / recall@5" value={`${test.precisionAtK ?? "—"} / ${test.recallAtK ?? "—"}`} />
              <MetricRow label="MAP@5" value={test.mapAtK ?? "—"} />
            </>
          )}
          {evaluation?.weightsByFeature && (
            <div style={{ marginTop: "1rem" }}>
              <div style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "0.4rem" }}>
                Pesos aprendidos por atributo
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.3rem 1rem" }}>
                {Object.entries(evaluation.weightsByFeature).map(([name, value]) => (
                  <div key={name} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                    <span style={{ color: "#94a3b8" }}>{name}</span>
                    <strong style={{ color: value >= 0 ? "#39FF88" : "#FB7185" }}>
                      {value.toFixed(3)}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
