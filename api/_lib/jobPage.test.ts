import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  extractJobPageText,
  fetchPublicJobPage,
  isPrivateOrReservedAddress,
} from './jobPage'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('extractJobPageText', () => {
  it('prioritizes structured JobPosting data and readable page content', () => {
    const html = `<!doctype html>
      <html><head>
        <title>Frontend Developer | Northstar Labs</title>
        <meta name="description" content="Build accessible products with React.">
        <script type="application/ld+json">
          {"@type":"JobPosting","title":"Frontend Developer","hiringOrganization":{"name":"Northstar Labs"},"description":"<p>Build accessible React applications.</p>"}
        </script>
      </head><body><main><h1>Frontend Developer</h1><p>Use TypeScript daily.</p></main></body></html>`

    const result = extractJobPageText(html)

    expect(result).toContain('STRUCTURED JOB DATA')
    expect(result).toContain('Company: Northstar Labs')
    expect(result).toContain('Build accessible React applications.')
    expect(result).toContain('Use TypeScript daily.')
  })

  it('rejects pages without enough readable content', () => {
    expect(() => extractJobPageText('<html><body>Hi</body></html>')).toThrow(
      'did not contain enough readable content',
    )
  })
})

describe('public job page security', () => {
  it.each([
    '127.0.0.1',
    '10.0.0.5',
    '169.254.169.254',
    '192.168.1.4',
    '198.51.100.7',
    '203.0.113.9',
    '::1',
    'fd00::1',
    '::ffff:a00:1',
  ])('recognizes private or reserved address %s', (address) => {
    expect(isPrivateOrReservedAddress(address)).toBe(true)
  })

  it('rejects a private URL without requesting it', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchPublicJobPage('http://127.0.0.1/job')).rejects.toThrow(
      'must use a public website',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects redirects to a private URL', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, {
      status: 302,
      headers: { Location: 'http://127.0.0.1/private' },
    })))

    await expect(fetchPublicJobPage('https://8.8.8.8/job')).rejects.toThrow(
      'must use a public website',
    )
  })

  it('returns extracted text from a public HTML response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      '<html><head><title>Frontend Developer</title></head><body>Northstar Labs needs a React and TypeScript developer for accessible products.</body></html>',
      { status: 200, headers: { 'Content-Type': 'text/html' } },
    )))

    const result = await fetchPublicJobPage('https://8.8.8.8/job')

    expect(result).toContain('Frontend Developer')
    expect(result).toContain('Northstar Labs')
  })
})
