import type { AIProvider } from './AIProvider'
import type { DeepSeekModel } from '../../../src/types/jobApplication'
import { DeepSeekProvider } from './DeepSeekProvider.js'
import { MockAIProvider } from './MockAIProvider.js'

const mockAIProvider = new MockAIProvider()

interface ServerRuntime {
  process: {
    env: Record<string, string | undefined>
  }
}

function isDeepSeekModel(value: unknown): value is DeepSeekModel {
  return value === 'deepseek-v4-flash' || value === 'deepseek-v4-pro'
}

export function getAIProvider(requestedModel?: DeepSeekModel): AIProvider {
  const { env } = (globalThis as typeof globalThis & ServerRuntime).process
  const providerName = env.AI_PROVIDER?.trim().toLowerCase() ?? 'mock'

  if (providerName === 'mock') return mockAIProvider

  if (providerName === 'deepseek') {
    const apiKey = env.DEEPSEEK_API_KEY

    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY is required when AI_PROVIDER is deepseek.')
    }

    const configuredModel = env.DEEPSEEK_MODEL?.trim()
    if (configuredModel && !isDeepSeekModel(configuredModel)) {
      throw new Error(`Unsupported DeepSeek model: ${configuredModel}`)
    }
    const configuredDeepSeekModel = isDeepSeekModel(configuredModel)
      ? configuredModel
      : undefined

    return new DeepSeekProvider(
      apiKey,
      requestedModel ?? configuredDeepSeekModel ?? 'deepseek-v4-flash',
    )
  }

  throw new Error(`Unsupported AI provider: ${providerName}`)
}
