import { supabase } from '../supabaseClient.js'

export class GeminiService {
  static async analyzePDF(fileData) {
    try {
      const { data, error } = await supabase.functions.invoke('gemini', {
        body: {
          type: 'pdf',
          fileData: {
            type: 'pdf',
            content: fileData.content,
            mimeType: fileData.mimeType
          }
        }
      })

      if (error) throw error
      return data.content
    } catch (error) {
      console.error('Erro no Gemini service:', error)
      throw new Error('Falha ao analisar PDF')
    }
  }

  static async analyzeImage(fileData) {
    try {
      const { data, error } = await supabase.functions.invoke('gemini', {
        body: {
          type: 'image',
          fileData: {
            type: 'image',
            data: fileData.data,
            mimeType: fileData.mimeType
          }
        }
      })

      if (error) throw error
      return data.content
    } catch (error) {
      console.error('Erro no Gemini service:', error)
      throw new Error('Falha ao analisar imagem')
    }
  }

  static async generateText(prompt, requestType = 'generic') {
    try {
      const { data, error } = await supabase.functions.invoke('gemini', {
        body: { prompt, type: requestType }
      })

      if (error) throw error
      return data.content
    } catch (error) {
      console.error('Erro no Gemini service:', error)
      throw new Error('Falha ao gerar texto com Gemini')
    }
  }

  static async summarizeDocument(prompt, fileData = null) {
    try {
      const { data, error } = await supabase.functions.invoke('gemini', {
        body: { prompt, type: 'summarize', fileData }
      })

      if (error) throw error
      return data.content
    } catch (error) {
      console.error('Erro no Gemini service:', error)
      throw new Error('Falha ao resumir documento')
    }
  }

  static async extractTextFromFile(fileData) {
    try {
      const { data, error } = await supabase.functions.invoke('gemini', {
        body: {
          type: 'extract',
          fileData: {
            type: 'file',
            content: fileData.content,
            mimeType: fileData.mimeType
          }
        }
      })

      if (error) throw error
      return data.content
    } catch (error) {
      console.error('Erro no Gemini service:', error)
      throw new Error('Falha ao extrair texto')
    }
  }
}