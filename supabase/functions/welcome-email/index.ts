import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "STEAM Planner <onboarding@resend.dev>"
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "marceldancini@gmail.com"

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
    console.warn("RESEND_API_KEY nao configurada. E-mail nao enviado.", { to, subject })
    return { skipped: true }
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Falha ao enviar e-mail para ${to}: ${details}`)
  }

  return response.json()
}

function buildWelcomeEmail(user: any) {
  const name = escapeHtml(user.name || "Professor(a)")

  return `
    <div style="font-family: Arial, sans-serif; color: #1F2937; line-height: 1.6; max-width: 640px;">
      <h1 style="color: #4F46E5;">Bem-vindo(a) ao STEAM+ Cultura Maker</h1>
      <p>Olá, ${name}!</p>
      <p>
        Seu cadastro foi realizado com sucesso. A partir de agora, você pode acessar a plataforma
        e começar a planejar atividades pedagógicas STEAM com Cultura Maker.
      </p>
      <p>
        Lembrete importante: neste momento, você pode gerar até <strong>5 projetos por dia</strong>.
        Use esse limite para testar temas, adaptar ideias e organizar propostas para suas turmas.
      </p>
      <h2 style="font-size: 18px; color: #111827;">Recomendações de uso</h2>
      <ul>
        <li>Comece por um problema real da escola ou da comunidade.</li>
        <li>Escolha a série e a disciplina com atenção para melhorar o alinhamento à BNCC.</li>
        <li>Revise a atividade gerada antes de aplicar em sala.</li>
        <li>Adapte materiais e acessibilidade conforme o perfil da turma.</li>
      </ul>
      <p>
        Obrigado por fazer parte dessa construção.
      </p>
      <p style="color: #6B7280; font-size: 13px;">
        STEAM Planner · Educação com propósito. Tecnologia com sentido.
      </p>
    </div>
  `
}

function buildAdminEmail(user: any) {
  return `
    <div style="font-family: Arial, sans-serif; color: #1F2937; line-height: 1.6; max-width: 640px;">
      <h1 style="color: #4F46E5;">Novo cadastro no STEAM Planner</h1>
      <p>Um novo usuário acabou de se cadastrar.</p>
      <ul>
        <li><strong>Nome:</strong> ${escapeHtml(user.name || "")}</li>
        <li><strong>E-mail:</strong> ${escapeHtml(user.email || "")}</li>
        <li><strong>Escola:</strong> ${escapeHtml(user.school || "")}</li>
        <li><strong>Área:</strong> ${escapeHtml(user.area || "")}</li>
        <li><strong>ID:</strong> ${escapeHtml(user.id || "")}</li>
      </ul>
      <p>
        Recomendação: acompanhar se o usuário consegue gerar os primeiros projetos e coletar
        feedback sobre clareza das atividades, uso de materiais e aderência à BNCC.
      </p>
    </div>
  `
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { user, adminEmail } = await req.json()

    if (!user?.email) {
      return new Response(
        JSON.stringify({ error: "E-mail do usuário é obrigatório." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    const adminTo = adminEmail || ADMIN_EMAIL

    const [welcomeResult, adminResult] = await Promise.all([
      sendEmail({
        to: user.email,
        subject: "Bem-vindo(a) ao STEAM+ Cultura Maker",
        html: buildWelcomeEmail(user),
      }),
      sendEmail({
        to: adminTo,
        subject: "Novo cadastro no STEAM Planner",
        html: buildAdminEmail(user),
      }),
    ])

    return new Response(
      JSON.stringify({ ok: true, welcomeResult, adminResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao enviar e-mails." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }
})
