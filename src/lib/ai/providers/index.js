import { GeminiProvider } from './gemini/index.js'
import { CerebrasProvider } from './cerebras/index.js'

export const AIProviders = {
  gemini: GeminiProvider,
  cerebras: CerebrasProvider
}

export const DEFAULT_PROVIDER_ORDER = ['gemini', 'cerebras']
