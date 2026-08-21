import { afterEach, describe, expect, it, vi } from 'vitest'

const validInput = {
  companyName: 'Northstar Labs',
  jobTitle: 'Frontend Developer',
  jobDescription: 'Build accessible React applications.',
  resumeText: 'React and TypeScript experience.',
  currentTailoredResume: 'Current tailored resume.',
  outputLanguage: 'en',
}

async function loadHandler() {
  vi.stubEnv('AI_PROVIDER', 'mock')
  vi.resetModules()
  return (await import('./regenerate-resume')).default
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('/api/regenerate-resume', () => {
  it('rejects methods other than POST', async () => {
    const handler = await loadHandler()
    const response = await handler.fetch(
      new Request('http://localhost/api/regenerate-resume', { method: 'GET' }),
    )

    expect(response.status).toBe(405)
    expect(response.headers.get('Allow')).toBe('POST')
  })

  it('rejects requests without the current tailored resume', async () => {
    const handler = await loadHandler()
    const response = await handler.fetch(
      new Request('http://localhost/api/regenerate-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validInput, currentTailoredResume: '  ' }),
      }),
    )

    expect(response.status).toBe(400)
  })

  it('returns only a regenerated tailored resume', async () => {
    const handler = await loadHandler()
    const response = await handler.fetch(
      new Request('http://localhost/api/regenerate-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validInput),
      }),
    )
    const result = (await response.json()) as Record<string, unknown>

    expect(response.status).toBe(200)
    expect(result.tailoredResume).toContain('refreshed resume')
    expect(Object.keys(result)).toEqual(['tailoredResume'])
  })

  it('rejects unsupported AI models', async () => {
    const handler = await loadHandler()
    const response = await handler.fetch(
      new Request('http://localhost/api/regenerate-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validInput, aiModel: 'deepseek-unknown' }),
      }),
    )

    expect(response.status).toBe(400)
  })
})
