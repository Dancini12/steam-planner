import { useState, useCallback } from 'react'
import { AIProviderManager } from '../lib/ai/AIProviderManager.js'

export function useAI() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const processPrompt = useCallback(async (prompt, fileData = null) => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await AIProviderManager.request({
        requestType: 'generic',
        prompt,
        fileData
      })

      setResult({ ai: response.provider, content: response.content })
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setIsLoading(false)
    setError(null)
    setResult(null)
  }, [])

  return {
    processPrompt,
    isLoading,
    error,
    result,
    reset
  }
}
