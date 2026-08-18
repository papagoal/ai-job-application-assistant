import type { AIProvider } from './AIProvider'
import { DeepSeekProvider } from './DeepSeekProvider.js'
import { MockAIProvider } from './MockAIProvider.js'

const mockAIProvider = new MockAIProvider()

interface ServerRuntime {
  process: {
    env: Record<string, string | undefined>
  }
}

export function getAIProvider(): AIProvider {
  const { env } = (globalThis as typeof globalThis & ServerRuntime).process
  const providerName = env.AI_PROVIDER?.trim().toLowerCase() ?? 'mock'

  if (providerName === 'mock') return mockAIProvider

  if (providerName === 'deepseek') {
    const apiKey = env.DEEPSEEK_API_KEY

    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY is required when AI_PROVIDER is deepseek.')
    }

    return new DeepSeekProvider(apiKey, env.DEEPSEEK_MODEL)
  }

  throw new Error(`Unsupported AI provider: ${providerName}`)
}
