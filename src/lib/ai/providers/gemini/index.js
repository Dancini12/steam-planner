import { GeminiService } from '../../geminiService.js'

function isProviderEnabled() {
  const value = import.meta.env.VITE_ENABLE_GEMINI
  return value === undefined ? true : String(value).toLowerCase() === 'true'
}

export const GeminiProvider = {
  name: 'gemini',
  label: 'Gerador de conteúdo principal',
  isEnabled: isProviderEnabled,

  async execute(requestType, prompt, options = {}) {
    const { fileData } = options

    if (fileData) {
      if (fileData.type === 'pdf') {
        return GeminiService.analyzePDF(fileData)
      }
      if (fileData.type === 'image') {
        return GeminiService.analyzeImage(fileData)
      }
      return GeminiService.extractTextFromFile(fileData)
    }

    return GeminiService.generateText(prompt, requestType)
  }
}
