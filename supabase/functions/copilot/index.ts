import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, type } = await req.json()

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY') || Deno.env.get('DEEPSEEK_API_KEY')
    if (!claudeApiKey) {
      return new Response(
        JSON.stringify({ error: 'API key Claude não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let systemPrompt = 'Você é um assistente de programação especializado em projetos maker, Arduino, HTML/CSS/JS e automações.'

    switch (type) {
      case 'arduino':
        systemPrompt = 'Você é um especialista em Arduino. Gere código limpo, comentado e apropriado para projetos maker educacionais.'
        break
      case 'html':
        systemPrompt = 'Você é um especialista em HTML/CSS/JavaScript. Crie interfaces web interativas, acessíveis e educacionais.'
        break
      case 'automation':
        systemPrompt = 'Você é um especialista em automação. Crie scripts e lógicas automatizadas claras e eficientes.'
        break
      case 'fix':
        systemPrompt = 'Você é um especialista em debugging. Corrija código educacional, explique problemas e sugira melhorias.'
        break
      default:
        systemPrompt = 'Você é um assistente de programação para projetos educacionais maker.'
    }

    const response = await fetch('https://api.anthropic.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'x-api-key': claudeApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3.5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.3, // Lower temperature for code
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return new Response(
        JSON.stringify({ error: `Erro na API Claude: ${error}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || ''

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})