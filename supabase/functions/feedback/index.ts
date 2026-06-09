import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || Deno.env.get("VITE_ADMIN_EMAIL") || "marceldancini@gmail.com"
const ADMIN_EMAILS = ADMIN_EMAIL
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "STEAM Planner <onboarding@resend.dev>"
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(
    JSON.stringify(body),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  )
}

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

function getRequesterEmail(req: Request) {
  const authHeader = req.headers.get("Authorization") || ""
  const token = authHeader.replace(/^Bearer\s+/i, "")
  const payload = token.split(".")[1]

  if (!payload) return ""

  try {
    const base64 = payload.replaceAll("-", "+").replaceAll("_", "/")
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")
    const parsed = JSON.parse(atob(padded)) as Record<string, unknown>
    return typeof parsed.email === "string" ? parsed.email.toLowerCase() : ""
  } catch {
    return ""
  }
}

async function isAdminEmail(email: string) {
  if (!email) return false
  if (ADMIN_EMAILS.includes(email.toLowerCase())) return true
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return false

  const params = new URLSearchParams({
    select: "email",
    email: `ilike.${email}`,
    limit: "1",
  })

  const response = await fetch(`${SUPABASE_URL}/rest/v1/app_admins?${params.toString()}`, {
    headers: {
      "apikey": SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  })

  if (!response.ok) {
    console.warn("Falha ao verificar administrador:", await response.text())
    return false
  }

  const admins = await response.json()
  return Array.isArray(admins) && admins.length > 0
}

async function listFeedback(limit: unknown) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase não configurado para listar feedbacks.")
  }

  const parsedLimit = Number(limit)
  const safeLimit = Number.isFinite(parsedLimit)
    ? Math.min(Math.max(Math.trunc(parsedLimit), 1), 200)
    : 50

  const params = new URLSearchParams({
    select: "id,category,message,sender_name,sender_email,user_id,created_at",
    order: "created_at.desc",
    limit: String(safeLimit),
  })

  const response = await fetch(`${SUPABASE_URL}/rest/v1/feedback?${params.toString()}`, {
    headers: {
      "apikey": SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Falha ao carregar feedbacks: ${details}`)
  }

  return response.json()
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
    if (!["GET", "POST"].includes(req.method)) {
      return jsonResponse({ error: "Método não permitido." }, 405)
    }

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {}

    if (req.method === "GET" || body.action === "list") {
      const requesterEmail = getRequesterEmail(req)
      const isAdmin = await isAdminEmail(requesterEmail)

      if (!isAdmin) {
        return jsonResponse({ error: "Acesso restrito a administradores." }, 403)
      }

      const feedback = await listFeedback(body.limit)
      return jsonResponse({ ok: true, feedback })
    }

    const { category, message, senderName, senderEmail, userId } = body
    const trimmedMessage = typeof message === "string" ? message.trim() : ""

    if (!trimmedMessage) {
      return jsonResponse({ error: "Mensagem é obrigatória." }, 400)
    }

    const resolvedCategory = typeof category === "string" && category.trim() ? category.trim() : "Geral"
    const resolvedName = typeof senderName === "string" && senderName.trim() ? senderName.trim() : "Usuário"
    const resolvedEmail = typeof senderEmail === "string" ? senderEmail.trim() : ""
    const resolvedUserId = typeof userId === "string" && userId.trim() ? userId.trim() : null

    await Promise.allSettled([
      sendEmail({
        to: ADMIN_EMAIL,
        subject: `[Feedback] ${resolvedCategory} — STEAM Planner`,
        html: buildFeedbackEmail(resolvedCategory, trimmedMessage, resolvedName, resolvedEmail),
      }),
      storeFeedback({
        user_id: resolvedUserId,
        category: resolvedCategory,
        message: trimmedMessage,
        sender_name: resolvedName,
        sender_email: resolvedEmail,
      }),
    ])

    return jsonResponse({ ok: true })
  } catch (error) {
    return jsonResponse({ error: error.message || "Erro ao enviar feedback." }, 500)
  }
})
