import { CerebrasService } from '../../cerebrasService.js'

function isProviderEnabled() {
  const value = import.meta.env.VITE_ENABLE_CEREBRAS
  return value === undefined ? true : String(value).toLowerCase() === 'true'
}

export const CerebrasProvider = {
  name: 'cerebras',
  label: 'Assistente rápido de revisão e síntese',
  isEnabled: isProviderEnabled,

  async execute(requestType, prompt, options = {}) {
    const { fileData } = options
    if (fileData) {
      if (fileData.type === 'pdf') {
        return CerebrasService.analyzePDF(fileData)
      }
      if (fileData.type === 'image') {
        return CerebrasService.analyzeImage(fileData)
      }
      return CerebrasService.extractTextFromFile(fileData)
    }

    return CerebrasService.generateText(prompt, requestType)
  }
}
