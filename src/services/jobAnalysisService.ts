import type { JobAnalysis } from '../types/jobAnalysis'
import type { JobDescriptionInput } from '../types/jobApplication'

export async function analyzeJob(input: JobDescriptionInput): Promise<JobAnalysis> {
  const response = await fetch('/api/analyze-job', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(`Analysis request failed with status ${response.status}.`)
  }

  return (await response.json()) as JobAnalysis
}
