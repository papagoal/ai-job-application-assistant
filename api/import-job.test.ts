import { afterEach, describe, expect, it, vi } from 'vitest'

async function loadHandler() {
  vi.stubEnv('AI_PROVIDER', 'mock')
  vi.resetModules()
  return (await import('./import-job')).default
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('/api/import-job', () => {
  it('rejects methods other than POST', async () => {
    const handler = await loadHandler()
    const response = await handler.fetch(
      new Request('http://localhost/api/import-job', { method: 'GET' }),
    )

    expect(response.status).toBe(405)
    expect(response.headers.get('Allow')).toBe('POST')
  })

  it('rejects a private job URL before fetching it', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const handler = await loadHandler()
    const response = await handler.fetch(
      new Request('http://localhost/api/import-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'http://127.0.0.1/job' }),
      }),
    )

    expect(response.status).toBe(422)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fetches a public page and returns only imported job details', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      '<html><head><title>Frontend Developer</title></head><body>Northstar Labs is hiring. Build accessible React and TypeScript applications for customers.</body></html>',
      { status: 200, headers: { 'Content-Type': 'text/html' } },
    )))
    const handler = await loadHandler()
    const response = await handler.fetch(
      new Request('http://localhost/api/import-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://8.8.8.8/job' }),
      }),
    )
    const result = (await response.json()) as Record<string, unknown>

    expect(response.status).toBe(200)
    expect(result.companyName).toBe('Northstar Labs')
    expect(result.jobTitle).toBe('Frontend Developer')
    expect(String(result.jobDescription)).toContain('Build accessible React')
    expect(Object.keys(result)).toEqual(['companyName', 'jobTitle', 'jobDescription'])
  })
})
