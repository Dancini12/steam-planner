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

    let systemPrompt = ''

    switch (type) {
      case 'lessonPlan':
        systemPrompt = 'Você é um especialista em pedagogia STEAM e BNCC. Crie planos de aula detalhados, envolventes e alinhados com a BNCC brasileira.'
        break
      case 'steamProject':
        systemPrompt = 'Você é um especialista em projetos STEAM. Crie projetos criativos, educacionais e investigativos para Ensino Fundamental II.'
        break
      case 'assessment':
        systemPrompt = 'Você é um especialista em avaliação educacional. Crie rubricas, checklist e instrumentos de avaliação eficazes.'
        break
      case 'bncc':
        systemPrompt = 'Você é um especialista na BNCC brasileira. Adapte conteúdos para os padrões curriculares e competências gerais.'
        break
      case 'arduino':
        systemPrompt = 'Você é um especialista em Arduino e robótica educacional. Gere código limpo, comentado e apropriado para ensino.'
        break
      case 'html':
        systemPrompt = 'Você é um especialista em HTML/CSS/JavaScript para educação. Crie código web interativo e acessível.'
        break
      case 'automation':
        systemPrompt = 'Você é um especialista em automações e scripting. Crie lógicas de automação claras e eficientes.'
        break
      case 'fix':
        systemPrompt = 'Você é um especialista em debugging. Corrija código, explique problemas e sugira melhorias.'
        break
      default:
        systemPrompt = 'Você é um assistente pedagógico especializado em educação STEAM e projetos maker.'
    }

    const response = await fetch('https://api.anthropic.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'x-api-key': claudeApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: type === 'fix' ? 0.3 : 0.7,
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