import { afterEach, describe, expect, it, vi } from 'vitest'

const validInput = {
  companyName: 'Northstar Labs',
  jobTitle: 'Frontend Developer',
  jobDescription: 'Build accessible React applications.',
  resumeText: 'React and TypeScript experience.',
  outputLanguage: 'en',
  aiModel: 'deepseek-v4-pro',
}

async function loadHandler() {
  vi.stubEnv('AI_PROVIDER', 'mock')
  vi.resetModules()
  return (await import('./analyze-job')).default
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('/api/analyze-job', () => {
  it('rejects methods other than POST', async () => {
    const handler = await loadHandler()
    const response = await handler.fetch(
      new Request('http://localhost/api/analyze-job', { method: 'GET' }),
    )

    expect(response.status).toBe(405)
    expect(response.headers.get('Allow')).toBe('POST')
    await expect(response.json()).resolves.toEqual({ error: 'Method not allowed.' })
  })

  it('rejects malformed JSON request bodies', async () => {
    const handler = await loadHandler()
    const response = await handler.fetch(
      new Request('http://localhost/api/analyze-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{not-json',
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Request body must be valid JSON.',
    })
  })

  it('rejects requests with missing required fields', async () => {
    const handler = await loadHandler()
    const response = await handler.fetch(
      new Request('http://localhost/api/analyze-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validInput, resumeText: '  ' }),
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Company name, job title, job description, and resume are required.',
    })
  })

  it('returns a mock analysis for a valid request', async () => {
    const handler = await loadHandler()
    const response = await handler.fetch(
      new Request('http://localhost/api/analyze-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validInput),
      }),
    )
    const analysis = (await response.json()) as Record<string, unknown>

    expect(response.status).toBe(200)
    expect(analysis.companyName).toBe(validInput.companyName)
    expect(analysis.jobTitle).toBe(validInput.jobTitle)
    expect(analysis.matchScore).toBeTypeOf('number')
    expect(analysis.tailoredResume).toContain(validInput.resumeText)
    expect(analysis.outputLanguage).toBe('en')
    expect(analysis.aiModel).toBe('deepseek-v4-pro')
  })

  it('rejects unsupported output languages', async () => {
    const handler = await loadHandler()
    const response = await handler.fetch(
      new Request('http://localhost/api/analyze-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validInput, outputLanguage: 'fr' }),
      }),
    )

    expect(response.status).toBe(400)
  })

  it('rejects unsupported AI models', async () => {
    const handler = await loadHandler()
    const response = await handler.fetch(
      new Request('http://localhost/api/analyze-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validInput, aiModel: 'deepseek-unknown' }),
      }),
    )

    expect(response.status).toBe(400)
  })
})
