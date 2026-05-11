import { supabase } from '../supabaseClient.js'

export class ClaudeService {
  static async generateLessonPlan(prompt) {
    try {
      const { data, error } = await supabase.functions.invoke('claude', {
        body: { prompt, type: 'lessonPlan' }
      })

      if (error) throw error
      return data.content
    } catch (error) {
      console.error('Erro no Claude service:', error)
      throw new Error('Falha ao gerar plano de aula')
    }
  }

  static async generateSteamProject(prompt) {
    try {
      const { data, error } = await supabase.functions.invoke('claude', {
        body: { prompt, type: 'steamProject' }
      })

      if (error) throw error
      return data.content
    } catch (error) {
      console.error('Erro no Claude service:', error)
      throw new Error('Falha ao gerar projeto STEAM')
    }
  }

  static async generateAssessment(prompt) {
    try {
      const { data, error } = await supabase.functions.invoke('claude', {
        body: { prompt, type: 'assessment' }
      })

      if (error) throw error
      return data.content
    } catch (error) {
      console.error('Erro no Claude service:', error)
      throw new Error('Falha ao gerar avaliação')
    }
  }

  static async generateBNCCSkills(prompt) {
    try {
      const { data, error } = await supabase.functions.invoke('claude', {
        body: { prompt, type: 'bncc' }
      })

      if (error) throw error
      return data.content
    } catch (error) {
      console.error('Erro no Claude service:', error)
      throw new Error('Falha ao adaptar BNCC')
    }
  }

  static async generateArduinoCode(prompt) {
    try {
      const { data, error } = await supabase.functions.invoke('claude', {
        body: { prompt, type: 'arduino' }
      })

      if (error) throw error
      return data.content
    } catch (error) {
      console.error('Erro no Claude service:', error)
      throw new Error('Falha ao gerar código Arduino')
    }
  }

  static async generateHTMLProject(prompt) {
    try {
      const { data, error } = await supabase.functions.invoke('claude', {
        body: { prompt, type: 'html' }
      })

      if (error) throw error
      return data.content
    } catch (error) {
      console.error('Erro no Claude service:', error)
      throw new Error('Falha ao gerar projeto HTML')
    }
  }

  static async generateAutomationLogic(prompt) {
    try {
      const { data, error } = await supabase.functions.invoke('claude', {
        body: { prompt, type: 'automation' }
      })

      if (error) {
        console.error('Erro no Claude service:', error)
        throw new Error('Falha ao gerar lógica de automação')
      }
      return data.content
    } catch (error) {
      console.error('Erro no Claude service:', error)
      throw new Error('Falha ao gerar lógica de automação')
    }
  }

  static async fixCode(prompt) {
    try {
      const { data, error } = await supabase.functions.invoke('claude', {
        body: { prompt, type: 'fix' }
      })

      if (error) throw error
      return data.content
    } catch (error) {
      console.error('Erro no Claude service:', error)
      throw new Error('Falha ao corrigir código')
    }
  }
}
