import { mockJobAnalysis } from '../src/mocks/jobAnalysis'
import type { JobDescriptionInput } from '../src/types/jobApplication'

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isJobDescriptionInput(value: unknown): value is JobDescriptionInput {
  if (typeof value !== 'object' || value === null) return false

  const input = value as Record<string, unknown>

  return (
    isNonEmptyString(input.companyName) &&
    isNonEmptyString(input.jobTitle) &&
    isNonEmptyString(input.jobDescription)
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

    if (!isJobDescriptionInput(body)) {
      return Response.json(
        { error: 'Company name, job title, and job description are required.' },
        { status: 400 },
      )
    }

    return Response.json({
      ...mockJobAnalysis,
      companyName: body.companyName.trim(),
      jobTitle: body.jobTitle.trim(),
    })
  },
}
