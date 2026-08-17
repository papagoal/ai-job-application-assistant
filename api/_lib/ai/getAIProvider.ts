import type { AIProvider } from './AIProvider'
import { MockAIProvider } from './MockAIProvider'

const mockAIProvider = new MockAIProvider()

export function getAIProvider(): AIProvider {
  return mockAIProvider
}
