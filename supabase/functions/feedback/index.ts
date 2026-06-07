import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "marceldancini@gmail.com"
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "STEAM Planner <onboarding@resend.dev>"
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY não configurada. E-mail não enviado.")
    return { skipped: true }
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
  })
  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Falha ao enviar e-mail: ${details}`)
  }
  return response.json()
}

async function storeFeedback(payload: Record<string, unknown>) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return { skipped: true }
  const response = await fetch(`${SUPABASE_URL}/rest/v1/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Prefer": "return=minimal",
    },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    console.warn("Falha ao armazenar feedback:", await response.text())
  }
  return { stored: response.ok }
}

function buildFeedbackEmail(category: string, message: string, senderName: string, senderEmail: string) {
  const timestamp = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
  return `
    <div style="font-family: Arial, sans-serif; color: #1F2937; line-height: 1.6; max-width: 640px;">
      <h1 style="color: #4F46E5; margin-bottom: 4px;">Novo Feedback — STEAM+ Cultura Maker</h1>
      <p style="color: #6B7280; font-size: 13px; margin-top: 0;">${timestamp}</p>
      <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <tr>
          <td style="padding: 8px 12px; background: #F3F4F6; font-weight: 700; width: 140px; border-bottom: 1px solid #E5E7EB;">Categoria</td>
          <td style="padding: 8px 12px; border-left: 3px solid #4F46E5; border-bottom: 1px solid #E5E7EB;">${escapeHtml(category)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; background: #F3F4F6; font-weight: 700;">Remetente</td>
          <td style="padding: 8px 12px; border-left: 3px solid #4F46E5;">${escapeHtml(senderName)} &lt;${escapeHtml(senderEmail)}&gt;</td>
        </tr>
      </table>
      <h2 style="font-size: 15px; color: #374151; margin-bottom: 8px;">Mensagem</h2>
      <div style="background: #F9FAFB; border-left: 4px solid #4F46E5; padding: 16px; border-radius: 4px; white-space: pre-wrap; font-size: 14px;">
        ${escapeHtml(message)}
      </div>
      <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px;">
        STEAM Planner · Educação com propósito. Tecnologia com sentido.
      </p>
    </div>
  `
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { category, message, senderName, senderEmail, userId } = await req.json()

    if (!message?.trim()) {
      return new Response(
        JSON.stringify({ error: "Mensagem é obrigatória." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const resolvedCategory = category || "Geral"
    const resolvedName = senderName || "Usuário"
    const resolvedEmail = senderEmail || ""

    await Promise.allSettled([
      sendEmail({
        to: ADMIN_EMAIL,
        subject: `[Feedback] ${resolvedCategory} — STEAM Planner`,
        html: buildFeedbackEmail(resolvedCategory, message.trim(), resolvedName, resolvedEmail),
      }),
      storeFeedback({
        user_id: userId || null,
        category: resolvedCategory,
        message: message.trim(),
        sender_name: resolvedName,
        sender_email: resolvedEmail,
      }),
    ])

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao enviar feedback." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
