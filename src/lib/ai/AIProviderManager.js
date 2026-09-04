import { AIProviders, DEFAULT_PROVIDER_ORDER } from './providers/index.js'

function getProviderOrder() {
  return DEFAULT_PROVIDER_ORDER
    .map((name) => AIProviders[name])
    .filter((provider) => provider && provider.isEnabled())
}

function choosePrimaryProvider(requestType, fileData) {
  const order = getProviderOrder()

  if (fileData) {
    return order.find((provider) => provider.name === 'gemini') || order[0]
  }

  return order[0]
}

function buildFallbackProviders(primaryProvider) {
  const activeProviders = getProviderOrder()
  return activeProviders.filter((provider) => provider.name !== primaryProvider.name)
}

export class AIProviderManager {
  static getActiveProviders() {
    return getProviderOrder()
  }

  static isProviderEnabled(providerName) {
    const provider = AIProviders[providerName]
    return provider?.isEnabled?.() || false
  }

  static getProviderNames() {
    return getProviderOrder().map((provider) => provider.name)
  }

  static async request({ requestType = 'generic', prompt, fileData = null, params = {} }) {
    const provider = choosePrimaryProvider(requestType, fileData)
    if (!provider) {
      throw new Error('Nenhum provedor de IA está ativado no momento.')
    }

    const fallbackProviders = buildFallbackProviders(provider)
    const candidates = [provider, ...fallbackProviders]
    const failures = []

    for (const candidate of candidates) {
      try {
        const content = await candidate.execute(requestType, prompt, { fileData, params })
        return {
          provider: candidate.name,
          content,
          metadata: {
            requestType,
            activeProviders: this.getProviderNames(),
            fallbackUsed: candidate.name !== provider.name
          }
        }
      } catch (error) {
        failures.push({ provider: candidate.name, error: error.message })
        console.warn(`Provider ${candidate.name} failed:`, error.message)
      }
    }

    const errors = failures.map((failure) => `${failure.provider}: ${failure.error}`).join(' | ')
    throw new Error(`Falha ao processar requisição de IA. Erros: ${errors}`)
  }
}
