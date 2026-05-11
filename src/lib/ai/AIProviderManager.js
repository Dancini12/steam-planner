import { AIProviders, DEFAULT_PROVIDER_ORDER } from './providers/index.js'

const LONG_FORM_TYPES = new Set([
  'project',
  'steamproject',
  'lessonplan',
  'assessment',
  'bncc',
  'bibliography',
  'pedagogicalactivity',
  'justification',
  'methodology',
  'activity',
  'atividade'
])

const QUICK_RESPONSE_TYPES = new Set([
  'review',
  'improve',
  'summary',
  'title',
  'ideas',
  'variation',
  'revision',
  'language',
  'clarity'
])

function normalizeType(requestType) {
  if (!requestType) return 'generic'
  return String(requestType).toLowerCase().replace(/\s+/g, '')
}

function getProviderOrder() {
  return DEFAULT_PROVIDER_ORDER
    .map((name) => AIProviders[name])
    .filter((provider) => provider && provider.isEnabled())
}

function choosePrimaryProvider(requestType, fileData) {
  const type = normalizeType(requestType)

  if (fileData) {
    const order = getProviderOrder()
    return order.find((provider) => provider.name === 'gemini') || order[0]
  }

  if (LONG_FORM_TYPES.has(type)) {
    const order = getProviderOrder()
    return order.find((provider) => provider.name === 'gemini')
      || order.find((provider) => provider.name === 'cerebras')
      || order[0]
  }

  if (QUICK_RESPONSE_TYPES.has(type)) {
    const order = getProviderOrder()
    return order.find((provider) => provider.name === 'cerebras')
      || order.find((provider) => provider.name === 'gemini')
      || order[0]
  }

  return getProviderOrder()[0]
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
