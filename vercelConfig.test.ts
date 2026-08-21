import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

interface VercelConfig {
  rewrites?: Array<{
    source: string
    destination: string
  }>
}

const config = JSON.parse(
  readFileSync(new URL('./vercel.json', import.meta.url), 'utf8'),
) as VercelConfig

describe('Vercel SPA routes', () => {
  it.each(['/profile', '/account', '/applications/(.*)'])(
    'rewrites %s to the SPA entry point',
    (source) => {
      expect(config.rewrites).toContainEqual({
        source,
        destination: '/index.html',
      })
    },
  )
})
