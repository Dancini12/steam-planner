import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CEREBRAS_API_KEY = Deno.env.get('CEREBRAS_API_KEY')
const CEREBRAS_MODEL = Deno.env.get('CEREBRAS_MODEL') || 'llama-3.3-70b'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, type, fileData } = await req.json()

    if (!prompt && !fileData) {
      return new Response(
        JSON.stringify({ error: 'Prompt ou dados do arquivo são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!CEREBRAS_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'CEREBRAS_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let contentPayload = prompt
    if (fileData) {
      if (fileData.type === 'pdf') {
        contentPayload = `Analise o documento PDF e responda com base no conteúdo: ${fileData.content}`
      } else if (fileData.type === 'image') {
        contentPayload = `Analise a imagem e responda com base no contexto visual. Mime type: ${fileData.mimeType}`
      } else {
        contentPayload = fileData.content || ''
      }
    }

    const response = await fetch('https://api.cerebras.net/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CEREBRAS_API_KEY}`
      },
      body: JSON.stringify({
        model: CEREBRAS_MODEL,
        messages: [
          { role: 'system', content: 'Você é um assistente educacional STEAM e pedagógico.' },
          { role: 'user', content: contentPayload }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      })
    })

    if (!response.ok) {
      const error = await response.text()
      return new Response(
        JSON.stringify({ error: `Erro na API Cerebras: ${error}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || data.completion || ''

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
