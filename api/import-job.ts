import type { ImportedJobDetails } from '../src/types/jobApplication'
import { getAIProvider } from './_lib/ai/getAIProvider.js'
import { fetchPublicJobPage } from './_lib/jobPage.js'

const aiProvider = getAIProvider('deepseek-v4-flash')

function isImportRequest(value: unknown): value is { url: string } {
  if (typeof value !== 'object' || value === null) return false
  const url = (value as Record<string, unknown>).url
  return typeof url === 'string' && url.trim().length > 0 && url.length <= 2_048
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

    if (!isImportRequest(body)) {
      return Response.json({ error: 'A public job listing URL is required.' }, { status: 400 })
    }

    try {
      const sourceUrl = body.url.trim()
      const pageText = await fetchPublicJobPage(sourceUrl)
      const jobDetails: ImportedJobDetails = await aiProvider.extractJobDetails({
        sourceUrl,
        pageText,
      })

      return Response.json(jobDetails)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The job listing could not be imported.'
      return Response.json({ error: message }, { status: 422 })
    }
  },
}
