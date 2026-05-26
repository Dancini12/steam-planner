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
    const { prompt, type, fileData } = await req.json()

    if (!prompt && !fileData) {
      return new Response(
        JSON.stringify({ error: 'Prompt ou dados do arquivo são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'API key não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let requestBody: any = {
      contents: [{
        parts: []
      }],
      generationConfig: {
        temperature: type === 'summarize' ? 0.4 : 0.7,
        maxOutputTokens: 8192
      }
    }

    // Handle text prompt
    if (prompt) {
      requestBody.contents[0].parts.push({
        text: prompt
      })
    }

    // Handle file data (PDF, image, etc.)
    if (fileData) {
      if (fileData.type === 'image') {
        requestBody.contents[0].parts.push({
          inline_data: {
            mime_type: fileData.mimeType,
            data: fileData.data
          }
        })
      } else if (fileData.type === 'pdf') {
        requestBody.contents[0].parts.push({
          inline_data: {
            mime_type: fileData.mimeType || 'application/pdf',
            data: fileData.content
          }
        })
      } else if (fileData.content) {
        requestBody.contents[0].parts.push({
          text: `Conteúdo do arquivo:\n${fileData.content}`
        })
      }
    }

    const model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash'
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.text()
      return new Response(
        JSON.stringify({ error: `Erro na API Gemini: ${error}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Gemini não retornou conteúdo para esta solicitação.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
