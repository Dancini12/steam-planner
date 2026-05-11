import { supabase } from '../supabaseClient.js'

export class CerebrasService {
  static async generateText(prompt, type = 'generic') {
    try {
      const { data, error } = await supabase.functions.invoke('cerebras', {
        body: { prompt, type }
      })

      if (error) throw error
      return data.content
    } catch (error) {
      console.error('Erro no Cerebras service:', error)
      throw new Error('Falha ao gerar texto com Cerebras')
    }
  }

  static async analyzePDF(fileData) {
    try {
      const { data, error } = await supabase.functions.invoke('cerebras', {
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
      console.error('Erro no Cerebras service:', error)
      throw new Error('Falha ao analisar PDF com Cerebras')
    }
  }

  static async analyzeImage(fileData) {
    try {
      const { data, error } = await supabase.functions.invoke('cerebras', {
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
      console.error('Erro no Cerebras service:', error)
      throw new Error('Falha ao analisar imagem com Cerebras')
    }
  }

  static async extractTextFromFile(fileData) {
    try {
      const { data, error } = await supabase.functions.invoke('cerebras', {
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
      console.error('Erro no Cerebras service:', error)
      throw new Error('Falha ao extrair texto com Cerebras')
    }
  }
}
