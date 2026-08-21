import type { DeepSeekModel, ResumeRegenerationInput } from '../src/types/jobApplication'
import { getAIProvider } from './_lib/ai/getAIProvider.js'

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isOutputLanguage(value: unknown) {
  return value === undefined || value === 'en' || value === 'zh'
}

function isAIModel(value: unknown): value is DeepSeekModel | undefined {
  return value === undefined
    || value === 'deepseek-v4-flash'
    || value === 'deepseek-v4-pro'
}

function isResumeRegenerationInput(value: unknown): value is ResumeRegenerationInput {
  if (typeof value !== 'object' || value === null) return false

  const input = value as Record<string, unknown>

  return (
    isNonEmptyString(input.companyName) &&
    isNonEmptyString(input.jobTitle) &&
    isNonEmptyString(input.jobDescription) &&
    isNonEmptyString(input.resumeText) &&
    isNonEmptyString(input.currentTailoredResume) &&
    isOutputLanguage(input.outputLanguage) &&
    isAIModel(input.aiModel)
  )
}

export default {
  async fetch(request: Request) {
    if (request.method !== 'POST') {
      return Response.json(
        { error: 'Method not allowed.' },
        { status: 405, headers: { Allow: 'POST' } },
      )
    }

    let body: unknown

    try {
      body = await request.json()
    } catch {
      return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
    }

    if (!isResumeRegenerationInput(body)) {
      return Response.json(
        { error: 'Complete application and current resume details are required.' },
        { status: 400 },
      )
    }

    const tailoredResume = await getAIProvider(body.aiModel).regenerateResume(body)

    return Response.json({ tailoredResume })
  },
}
