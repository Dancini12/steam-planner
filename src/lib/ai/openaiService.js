import { supabase } from '../supabaseClient.js'

export class OpenAIService {
  static async generateLessonPlan(prompt) {
    try {
      const { data, error } = await supabase.functions.invoke('openai', {
        body: { prompt, type: 'lessonPlan' }
      })

      if (error) throw error
      return data.content
    } catch (error) {
      console.error('Erro no OpenAI service:', error)
      throw new Error('Falha ao gerar plano de aula')
    }
  }

  static async generateSteamProject(prompt) {
    try {
      const { data, error } = await supabase.functions.invoke('openai', {
        body: { prompt, type: 'steamProject' }
      })

      if (error) throw error
      return data.content
    } catch (error) {
      console.error('Erro no OpenAI service:', error)
      throw new Error('Falha ao gerar projeto STEAM')
    }
  }

  static async generateAssessment(prompt) {
    try {
      const { data, error } = await supabase.functions.invoke('openai', {
        body: { prompt, type: 'assessment' }
      })

      if (error) throw error
      return data.content
    } catch (error) {
      console.error('Erro no OpenAI service:', error)
      throw new Error('Falha ao gerar avaliação')
    }
  }

  static async generateBNCCSkills(prompt) {
    try {
      const { data, error } = await supabase.functions.invoke('openai', {
        body: { prompt, type: 'bncc' }
      })

      if (error) throw error
      return data.content
    } catch (error) {
      console.error('Erro no OpenAI service:', error)
      throw new Error('Falha ao adaptar BNCC')
    }
  }
}