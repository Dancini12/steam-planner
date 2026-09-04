// ============================================================
// api/cron-train-model.js
// Retreino automático do recomendador de ML, agendado pelo
// Vercel Cron (ver vercel.json). Faz a MESMA chamada que o botão
// "Treinar agora" do console admin faz manualmente — só que numa
// agenda fixa, sem depender de pg_cron/pg_net no Supabase.
// ============================================================
//
// Configuração necessária (Vercel → Project Settings →
// Environment Variables):
//   SUPABASE_SERVICE_ROLE_KEY  — obrigatória. A Edge Function
//     ml-trainer aceita a service role key como equivalente a
//     "admin" (mesmo mecanismo já usado pelo cron do Postgres em
//     supabase/migrations/010_ml_retrain_cron.sql). NUNCA prefixe
//     com VITE_ — variáveis VITE_ vão para o bundle do navegador.
//   CRON_SECRET — recomendada. A Vercel envia automaticamente
//     "Authorization: Bearer <CRON_SECRET>" nas chamadas do Cron;
//     este endpoint confere esse valor para recusar chamadas de
//     fora. Gere um valor aleatório (ex.: `openssl rand -hex 32`).
//   VITE_SUPABASE_URL — já deve existir (usada pelo app). Reaproveitada
//     aqui; alternativamente defina SUPABASE_URL sem o prefixo.
//
// Sem SUPABASE_SERVICE_ROLE_KEY configurada, este endpoint responde
// 500 e não treina nada — o botão manual continua funcionando
// normalmente enquanto isso não for configurado.
// ============================================================

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.authorization || "";
    if (auth !== `Bearer ${cronSecret}`) {
      res.status(401).json({ ok: false, error: "unauthorized" });
      return;
    }
  }

  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    res.status(500).json({
      ok: false,
      error: "Configure SUPABASE_SERVICE_ROLE_KEY (e opcionalmente SUPABASE_URL) nas variáveis de ambiente da Vercel para ativar o retreino automático."
    });
    return;
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/ml-trainer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`
      },
      body: JSON.stringify({ action: "train" })
    });

    const text = await response.text();
    let payload = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = { raw: text };
    }

    if (!response.ok) {
      res.status(response.status).json({
        ok: false,
        error: payload?.error || payload?.reason || `HTTP ${response.status}`,
        detail: payload
      });
      return;
    }

    res.status(200).json({ ok: true, triggeredAt: new Date().toISOString(), result: payload });
  } catch (error) {
    res.status(502).json({ ok: false, error: error?.message || "Falha ao chamar a Edge Function ml-trainer." });
  }
}
