import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ENABLE_GEMINI = Deno.env.get('ENABLE_GEMINI') !== 'false'
const ENABLE_CEREBRAS = Deno.env.get('ENABLE_CEREBRAS') !== 'false'

function routeAIRequest(prompt: string, fileData?: any): string {
  const lowerPrompt = prompt.toLowerCase()

  const geminiKeywords = [
    'pdf', 'imagem', 'documento', 'arquivo', 'upload', 'analisar', 'ler',
    'extrair', 'resumir', 'vídeo', 'foto', 'google workspace', 'drive'
  ]

  if (fileData) {
    if (ENABLE_GEMINI) return 'gemini'
    if (ENABLE_CEREBRAS) return 'cerebras'
  }

  for (const keyword of geminiKeywords) {
    if (lowerPrompt.includes(keyword)) {
      if (ENABLE_GEMINI) return 'gemini'
      if (ENABLE_CEREBRAS) return 'cerebras'
      break
    }
  }

  const defaultOrder = [
    ENABLE_GEMINI && 'gemini',
    ENABLE_CEREBRAS && 'cerebras'
  ].filter(Boolean) as string[]

  return defaultOrder[0] || 'gemini'
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, fileData } = await req.json()

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const ai = routeAIRequest(prompt, fileData)

    return new Response(
      JSON.stringify({ ai }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})