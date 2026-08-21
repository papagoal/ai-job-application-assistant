import { afterEach, describe, expect, it, vi } from 'vitest'

const validInput = {
  companyName: 'Northstar Labs',
  jobTitle: 'Frontend Developer',
  jobDescription: 'Build accessible React applications.',
  resumeText: 'React and TypeScript experience.',
  outputLanguage: 'en',
}

async function loadHandler() {
  vi.stubEnv('AI_PROVIDER', 'mock')
  vi.resetModules()
  return (await import('./generate-interview-prep')).default
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('/api/generate-interview-prep', () => {
  it('rejects methods other than POST', async () => {
    const handler = await loadHandler()
    const response = await handler.fetch(new Request(
      'http://localhost/api/generate-interview-prep',
      { method: 'GET' },
    ))

    expect(response.status).toBe(405)
    expect(response.headers.get('Allow')).toBe('POST')
  })

  it('rejects incomplete job and resume details', async () => {
    const handler = await loadHandler()
    const response = await handler.fetch(new Request(
      'http://localhost/api/generate-interview-prep',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validInput, resumeText: ' ' }),
      },
    ))

    expect(response.status).toBe(400)
  })

  it('returns five technical and three behavioral questions', async () => {
    const handler = await loadHandler()
    const response = await handler.fetch(new Request(
      'http://localhost/api/generate-interview-prep',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validInput),
      },
    ))
    const result = (await response.json()) as {
      technicalQuestions: unknown[]
      behavioralQuestions: unknown[]
    }

    expect(response.status).toBe(200)
    expect(result.technicalQuestions).toHaveLength(5)
    expect(result.behavioralQuestions).toHaveLength(3)
  })

  it('rejects unsupported AI models', async () => {
    const handler = await loadHandler()
    const response = await handler.fetch(new Request(
      'http://localhost/api/generate-interview-prep',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validInput, aiModel: 'deepseek-unknown' }),
      },
    ))

    expect(response.status).toBe(400)
  })
})
