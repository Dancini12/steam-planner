import { supabase } from '../supabaseClient.js'

export class CopilotService {
  static async generateArduinoCode(prompt) {
    try {
      const { data, error } = await supabase.functions.invoke('copilot', {
        body: { prompt, type: 'arduino' }
      })

      if (error) throw error
      return data.content
    } catch (error) {
      console.error('Erro no Copilot service:', error)
      throw new Error('Falha ao gerar código Arduino')
    }
  }

  static async generateHTMLProject(prompt) {
    try {
      const { data, error } = await supabase.functions.invoke('copilot', {
        body: { prompt, type: 'html' }
      })

      if (error) throw error
      return data.content
    } catch (error) {
      console.error('Erro no Copilot service:', error)
      throw new Error('Falha ao gerar projeto HTML')
    }
  }

  static async generateAutomationLogic(prompt) {
    try {
      const { data, error } = await supabase.functions.invoke('copilot', {
        body: { prompt, type: 'automation' }
      })

      if (error) throw error
      return data.content
    } catch (error) {
      console.error('Erro no Copilot service:', error)
      throw new Error('Falha ao gerar lógica de automação')
    }
  }

  static async fixCode(prompt) {
    try {
      const { data, error } = await supabase.functions.invoke('copilot', {
        body: { prompt, type: 'fix' }
      })

      if (error) throw error
      return data.content
    } catch (error) {
      console.error('Erro no Copilot service:', error)
      throw new Error('Falha ao corrigir código')
    }
  }
}